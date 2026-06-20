import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { sbGet, sbPost, enc } from "@/lib/supabase-admin";

export const runtime = "nodejs";

/**
 * Webhook Resend (signé via Svix). Sur bounce dur ou plainte, l'adresse est
 * ajoutée à la liste de suppression → plus aucun email ne lui est réémis.
 * Configurez RESEND_WEBHOOK_SECRET (clé « whsec_… » fournie par Resend) :
 * sans elle, la vérification est désactivée (à n'utiliser qu'en dev).
 */
function verifySvix(rawBody: string, headers: Headers, secret: string): boolean {
  const id = headers.get("svix-id");
  const ts = headers.get("svix-timestamp");
  const sigHeader = headers.get("svix-signature");
  if (!id || !ts || !sigHeader) return false;

  // Tolérance temporelle : 5 minutes (anti-rejeu).
  const now = Math.floor(Date.now() / 1000);
  const tsNum = Number(ts);
  if (!Number.isFinite(tsNum) || Math.abs(now - tsNum) > 300) return false;

  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const signedContent = `${id}.${ts}.${rawBody}`;
  const expected = crypto.createHmac("sha256", key).update(signedContent).digest("base64");

  // En-tête « svix-signature » = liste séparée par des espaces de « v1,<sig> ».
  const sigs = sigHeader.split(" ").map((s) => s.split(",")[1]).filter(Boolean);
  return sigs.some((s) => {
    try {
      const a = Buffer.from(s);
      const b = Buffer.from(expected);
      return a.length === b.length && crypto.timingSafeEqual(a, b);
    } catch {
      return false;
    }
  });
}

async function suppress(email: string, reason: string, detail?: string) {
  const e = email.trim().toLowerCase();
  if (!e) return;
  const [existing] = await sbGet<{ email: string }>(
    "EmailSuppression",
    `email=eq.${enc(e)}&select=email&limit=1`
  );
  if (existing) return; // déjà supprimée
  await sbPost("EmailSuppression", {
    email: e,
    reason,
    detail: detail ?? null,
    createdAt: new Date().toISOString(),
  });
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const secret = process.env.RESEND_WEBHOOK_SECRET;

  if (secret) {
    if (!verifySvix(rawBody, req.headers, secret)) {
      return NextResponse.json({ error: "Signature invalide" }, { status: 401 });
    }
  } else {
    console.warn("[resend-webhook] RESEND_WEBHOOK_SECRET absent — vérification désactivée");
  }

  let event: { type?: string; data?: { to?: string[] | string; bounce?: { type?: string } } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const type = event.type ?? "";
  const rawTo = event.data?.to;
  const to: string[] = Array.isArray(rawTo) ? rawTo : typeof rawTo === "string" ? [rawTo] : [];

  try {
    if (type === "email.bounced") {
      const detail = event.data?.bounce?.type ?? "bounce";
      for (const addr of to) await suppress(addr, "bounce", detail);
    } else if (type === "email.complained") {
      for (const addr of to) await suppress(addr, "complaint");
    } else {
      // delivered / opened / clicked / sent / delivery_delayed → journalisés
      console.log(`[resend-webhook] event ${type}`);
    }
  } catch (e) {
    console.error("[resend-webhook] traitement échoué:", e);
  }

  return NextResponse.json({ received: true });
}
