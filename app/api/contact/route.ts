import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, subject, message } = await req.json();

    if (!name || !email || !message || !subject) {
      return NextResponse.json({ error: "Champs obligatoires manquants." }, { status: 400 });
    }

    // Log the contact request (email sending via Resend when RESEND_API_KEY is configured)
    console.log("[contact]", { name, email, phone, subject, message: message.slice(0, 100) });

    // TODO: Send email via Resend when API key is set
    // if (process.env.RESEND_API_KEY) { ... }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
