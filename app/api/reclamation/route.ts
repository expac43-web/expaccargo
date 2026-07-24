import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { isValidEmail } from "@/lib/validation";
import { sendClaimEmail, sendClaimAckEmail } from "@/lib/email";
import { uploadFile } from "@/lib/supabase-storage";

/** Numéro de suivi lisible : REC-AAAAMMJJ-XXXX (alphabet sans 0/O/1/I ambigus). */
function makeRef(): string {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const AL = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 4; i++) s += AL[Math.floor(Math.random() * AL.length)];
  return `REC-${ymd}-${s}`;
}

// Limites des pièces jointes. Total sous la limite de 4,5 Mo de corps de requête Vercel.
const MAX_FILES = 3;
const MAX_TOTAL_BYTES = 4 * 1024 * 1024; // 4 Mo au total
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif", "application/pdf"]);
const ALLOWED_EXT = new Set(["jpg", "jpeg", "png", "webp", "gif", "heic", "heif", "pdf"]);

function extOf(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i + 1).toLowerCase() : "";
}

export async function POST(req: NextRequest) {
  try {
    // Anti-spam : 5 réclamations / 10 min / IP
    const ip = getClientIp(req);
    const rl = rateLimit(`reclamation:${ip}`, 5, 10 * 60 * 1000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Trop de réclamations envoyées. Réessayez dans quelques minutes." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
      );
    }

    const form = await req.formData();
    const val = (k: string) => (form.get(k) ?? "").toString().trim();
    const name = val("name");
    const email = val("email");
    const phone = val("phone");
    const service = val("service");
    const reference = val("reference");
    const subject = val("subject");
    const message = val("message");

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: "Champs obligatoires manquants." }, { status: 400 });
    }
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Adresse email invalide." }, { status: 400 });
    }
    if (message.length > 5000) {
      return NextResponse.json({ error: "Message invalide." }, { status: 400 });
    }

    // Pièces jointes (optionnelles) : validation type + taille.
    const files = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
    if (files.length > MAX_FILES) {
      return NextResponse.json({ error: `${MAX_FILES} fichiers maximum.` }, { status: 400 });
    }
    let total = 0;
    const attachments: { filename: string; content: Buffer; contentType: string }[] = [];
    for (const f of files) {
      const okType = ALLOWED_TYPES.has(f.type) || ALLOWED_EXT.has(extOf(f.name));
      if (!okType) {
        return NextResponse.json({ error: "Format non autorisé (PDF ou image uniquement)." }, { status: 400 });
      }
      total += f.size;
      if (total > MAX_TOTAL_BYTES) {
        return NextResponse.json({ error: "Pièces jointes trop volumineuses (4 Mo maximum au total)." }, { status: 400 });
      }
      attachments.push({
        filename: f.name || `piece-jointe.${extOf(f.name) || "bin"}`,
        content: Buffer.from(await f.arrayBuffer()),
        contentType: f.type || "application/octet-stream",
      });
    }

    const ref = makeRef();

    // Archivage dans le bucket privé (dossier reclamations/<réf>/) — best-effort.
    await Promise.all(
      attachments.map((a, i) => {
        const safe = `${i + 1}-${a.filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        return uploadFile(`reclamations/${ref}/${safe}`, a.content, a.contentType).catch(() => null);
      })
    );

    const sent = await sendClaimEmail({
      ref, name, email, phone, service, reference, subject, message,
      attachments: attachments.map((a) => ({ filename: a.filename, content: a.content })),
    });
    if (!sent) {
      return NextResponse.json(
        { error: "Envoi impossible pour le moment. Réessayez ou écrivez-nous directement." },
        { status: 502 }
      );
    }

    // Accusé de réception au réclamant : best-effort, n'empêche pas la réponse en cas d'échec.
    try {
      await sendClaimAckEmail({ ref, name, email });
    } catch {
      /* l'essentiel (réclamation reçue côté support) est déjà parti */
    }

    return NextResponse.json({ success: true, ref }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
