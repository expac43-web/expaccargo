import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sbGet, sbPost, sbPatch, enc } from "@/lib/supabase-admin";
import { uploadFile } from "@/lib/supabase-storage";
import { sendQuoteAcceptedEmail, sendQuoteSignedInternalEmail } from "@/lib/email";
import { notifyStaffQuoteSigned } from "@/lib/notify";

export const runtime = "nodejs";

type Quote = {
  id: string; name: string; email: string; serviceType: string;
  origin: string; destination: string; status: string;
};

/** Acceptation + signature électronique d'un devis par son client. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string; email?: string } | undefined;
  if (!session || user?.role !== "CLIENT" || !user?.email) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  if (!id || /[(),&=]/.test(id)) return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 });

  const { signature, signerName } = await req.json();
  if (typeof signature !== "string" || !signature.startsWith("data:image/png;base64,")) {
    return NextResponse.json({ error: "Signature manquante ou invalide." }, { status: 400 });
  }
  if (!signerName?.trim()) return NextResponse.json({ error: "Nom du signataire requis." }, { status: 400 });

  // Le devis doit appartenir au client (match email) et être au statut QUOTED.
  const [quote] = await sbGet<Quote>(
    "QuoteRequest",
    `id=eq.${enc(id)}&select=id,name,email,serviceType,origin,destination,status&limit=1`
  );
  if (!quote || quote.email.toLowerCase() !== user.email.toLowerCase()) {
    return NextResponse.json({ error: "Devis introuvable." }, { status: 404 });
  }
  if (quote.status !== "QUOTED") {
    return NextResponse.json({ error: "Ce devis ne peut pas être signé à ce stade." }, { status: 409 });
  }

  // Décodage du PNG (taille limitée ~1,5 Mo).
  const base64 = signature.slice("data:image/png;base64,".length);
  const buffer = Buffer.from(base64, "base64");
  if (buffer.length === 0 || buffer.length > 1_500_000) {
    return NextResponse.json({ error: "Image de signature invalide." }, { status: 400 });
  }

  const url = await uploadFile(`signatures/${id}.png`, buffer, "image/png");
  if (!url) return NextResponse.json({ error: "Échec de l'enregistrement de la signature." }, { status: 500 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
  const ua = req.headers.get("user-agent") || null;

  await sbPost("Signature", {
    id: crypto.randomUUID(),
    quoteId: id,
    userId: user.id ?? null,
    signerName: signerName.trim(),
    signerEmail: user.email,
    url,
    ipAddress: ip,
    userAgent: ua,
    createdAt: new Date().toISOString(),
  });

  await sbPatch("QuoteRequest", `id=eq.${enc(id)}`, { status: "ACCEPTED" });

  // Emails (no-op tant que Resend n'est pas configuré).
  const ref = id.slice(0, 8).toUpperCase();
  const signedAt = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  await sendQuoteAcceptedEmail({
    name: quote.name, email: quote.email, reference: ref,
    serviceType: quote.serviceType, origin: quote.origin, destination: quote.destination, signedAt,
  });
  await sendQuoteSignedInternalEmail({
    reference: ref, signerName: signerName.trim(), signerEmail: quote.email,
    serviceType: quote.serviceType, origin: quote.origin, destination: quote.destination,
  });

  // Notification in-app pour l'équipe (admin + gérants).
  await notifyStaffQuoteSigned(ref, signerName.trim());

  return NextResponse.json({ success: true });
}
