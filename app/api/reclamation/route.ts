import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { isValidEmail } from "@/lib/validation";
import { sendClaimEmail, sendClaimAckEmail } from "@/lib/email";

/** Numéro de suivi lisible : REC-AAAAMMJJ-XXXX (alphabet sans 0/O/1/I ambigus). */
function makeRef(): string {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const AL = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 4; i++) s += AL[Math.floor(Math.random() * AL.length)];
  return `REC-${ymd}-${s}`;
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

    const { name, email, phone, service, reference, subject, message } = await req.json();

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: "Champs obligatoires manquants." }, { status: 400 });
    }
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Adresse email invalide." }, { status: 400 });
    }
    if (typeof message !== "string" || message.trim().length > 5000) {
      return NextResponse.json({ error: "Message invalide." }, { status: 400 });
    }

    const ref = makeRef();
    const sent = await sendClaimEmail({ ref, name, email, phone, service, reference, subject, message });
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
