import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import { sbGet, sbPost, enc } from "@/lib/supabase-admin";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { isValidEmail } from "@/lib/validation";
import { sendPasswordResetEmail } from "@/lib/email";

// Réponses (selon le rôle, comme demandé). Email inconnu → message client générique (anti-énumération).
const CLIENT_MSG =
  "Si un compte client correspond à cet email, un lien de réinitialisation vient d'être envoyé. Le lien est valable 1 heure.";
const STAFF_MSG =
  "Ce compte est géré par l'administration. Veuillez contacter l'administrateur pour réinitialiser votre mot de passe : le nouveau mot de passe vous sera envoyé par email.";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const ipRl = rateLimit(`forgot-ip:${ip}`, 8, 15 * 60 * 1000);
  if (!ipRl.ok) {
    return NextResponse.json(
      { ok: false, error: "Trop de demandes. Réessayez plus tard." },
      { status: 429, headers: { "Retry-After": String(ipRl.retryAfter) } }
    );
  }

  const { email } = await req.json().catch(() => ({}));
  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ ok: true, mode: "client", message: CLIENT_MSG });
  }

  const normalized = String(email).trim().toLowerCase();
  const emailRl = rateLimit(`forgot-email:${normalized}`, 4, 60 * 60 * 1000);
  if (!emailRl.ok) {
    return NextResponse.json(
      { ok: false, error: "Trop de demandes pour cet email. Réessayez plus tard." },
      { status: 429, headers: { "Retry-After": String(emailRl.retryAfter) } }
    );
  }

  const [user] = await sbGet<{ id: string; name: string; email: string; role: string; isActive: boolean }>(
    "User", `email=eq.${enc(normalized)}&select=id,name,email,role,isActive&limit=1`
  );

  // Gérant / agent : pas de self-service → contacter l'admin.
  if (user?.isActive && (user.role === "MANAGER" || user.role === "AGENCY")) {
    return NextResponse.json({ ok: true, mode: "staff", message: STAFF_MSG });
  }

  // Client actif : jeton à usage unique (valable 1h). On stocke le hash, pas le jeton brut ;
  // le mot de passe n'est PAS modifié tant que le client n'a pas validé via le lien.
  if (user?.isActive && user.role === "CLIENT") {
    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    await sbPost("PasswordResetToken", {
      id: crypto.randomUUID(),
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      usedAt: null,
      createdAt: new Date().toISOString(),
    });
    const resetUrl = `${req.nextUrl.origin}/reinitialiser-mot-de-passe?token=${rawToken}`;
    await sendPasswordResetEmail({ name: user.name, email: user.email, resetUrl });
  }

  // Email inconnu / super admin / inactif → réponse générique.
  return NextResponse.json({ ok: true, mode: "client", message: CLIENT_MSG });
}
