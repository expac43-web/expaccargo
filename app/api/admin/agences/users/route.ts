import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sbGet, sbPost } from "@/lib/supabase-admin";
import bcrypt from "bcryptjs";
import { Resend } from "resend";

function isAdmin(role?: string) {
  return role === "SUPER_ADMIN" || role === "MANAGER";
}

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || !isAdmin(role)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { name, email, password, phone, agencyId } = await req.json();

  if (!name?.trim() || !email?.trim() || !password?.trim()) {
    return NextResponse.json({ error: "Nom, email et mot de passe sont obligatoires." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Le mot de passe doit faire au moins 8 caractères." }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Vérifier si l'email existe déjà
  const existing = await sbGet<{ id: string }>("User", `email=eq.${encodeURIComponent(normalizedEmail)}&select=id`);
  if (existing.length > 0) {
    return NextResponse.json({ error: "Un compte existe déjà avec cet email." }, { status: 409 });
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const now = new Date().toISOString();

  const user = await sbPost("User", {
    id: crypto.randomUUID(),
    name: name.trim(),
    email: normalizedEmail,
    password: hashedPassword,
    phone: phone?.trim() || null,
    whatsapp: null,
    role: "AGENCY",
    agencyId: agencyId || null,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });

  if (!user) return NextResponse.json({ error: "Erreur lors de la création du compte." }, { status: 500 });

  // Envoi email de bienvenue avec les identifiants
  let emailSent = false;
  if (resend) {
    try {
      await resend.emails.send({
        from: "EXPAC <noreply@expaccargo.com>",
        to: normalizedEmail,
        subject: "Vos identifiants d'accès — Espace Agence EXPAC",
        html: `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;max-width:600px;">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#0c3d4a 0%,#0e5f72 100%);padding:32px 40px;">
          <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:900;text-transform:uppercase;letter-spacing:0.05em;">EXPAC</h1>
          <p style="margin:8px 0 0;color:rgba(255,255,255,0.7);font-size:13px;">Express Africa Cargo Ltd</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:40px;">
          <h2 style="margin:0 0 16px;color:#0c3d4a;font-size:20px;font-weight:900;">Bienvenue, ${name.trim()} !</h2>
          <p style="margin:0 0 24px;color:#555;font-size:15px;line-height:1.6;">
            Votre compte agence EXPAC a été créé. Vous pouvez dès maintenant vous connecter à votre espace agence en utilisant les identifiants ci-dessous.
          </p>

          <div style="background:#f0f9ff;border:2px solid #0e5f72;border-radius:12px;padding:24px;margin-bottom:24px;">
            <p style="margin:0 0 12px;color:#0c3d4a;font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:0.1em;">Vos identifiants de connexion</p>
            <p style="margin:0 0 8px;color:#333;font-size:14px;"><strong>Email :</strong> ${normalizedEmail}</p>
            <p style="margin:0;color:#333;font-size:14px;"><strong>Mot de passe :</strong> <code style="background:#e0f2fe;padding:2px 8px;border-radius:4px;font-family:monospace;">${password}</code></p>
          </div>

          <p style="margin:0 0 24px;color:#555;font-size:14px;line-height:1.6;">
            🔒 <strong>Important :</strong> Changez votre mot de passe dès votre première connexion depuis votre espace profil.
          </p>

          <div style="text-align:center;margin-bottom:32px;">
            <a href="https://expaccargo.com/login" style="display:inline-block;background:#0e5f72;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:900;font-size:14px;text-transform:uppercase;letter-spacing:0.05em;">
              Se connecter à mon espace
            </a>
          </div>

          <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 24px;">
          <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;">
            Cet email a été envoyé par EXPAC — Express Africa Cargo Ltd.<br>
            <a href="https://expaccargo.com" style="color:#0e5f72;">expaccargo.com</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
        `.trim(),
      });
      emailSent = true;
    } catch (emailErr) {
      console.error("[agency-user] Email error:", emailErr);
      // Ne pas bloquer la création si l'email échoue
    }
  }

  return NextResponse.json({
    success: true,
    emailSent,
    // Retourner le mot de passe en clair pour que l'admin puisse le noter si l'email n'est pas configuré
    credentials: emailSent ? null : { email: normalizedEmail, password },
    user: {
      id: (user as { id: string }).id,
      name: name.trim(),
      email: normalizedEmail,
      role: "AGENCY",
      phone: phone?.trim() || null,
      isActive: true,
      createdAt: now,
    },
  }, { status: 201 });
}
