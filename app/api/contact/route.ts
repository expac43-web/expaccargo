import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { isValidEmail } from "@/lib/validation";
import { sendContactMessageEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    // Anti-spam : 5 messages / 10 min / IP
    const ip = getClientIp(req);
    const rl = rateLimit(`contact:${ip}`, 5, 10 * 60 * 1000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Trop de messages envoyés. Réessayez dans quelques minutes." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
      );
    }

    const { name, email, phone, subject, message } = await req.json();

    if (!name || !email || !message || !subject) {
      return NextResponse.json({ error: "Champs obligatoires manquants." }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Adresse email invalide." }, { status: 400 });
    }

    if (typeof message !== "string" || message.trim().length > 5000) {
      return NextResponse.json({ error: "Message invalide." }, { status: 400 });
    }

    const sent = await sendContactMessageEmail({ name, email, phone, subject, message });
    if (!sent) {
      return NextResponse.json(
        { error: "Envoi impossible pour le moment. Réessayez ou écrivez-nous directement." },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
