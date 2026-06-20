import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sbGet, sbPost, enc, isUuid } from "@/lib/supabase-admin";
import bcrypt from "bcryptjs";
import { sendStaffWelcomeEmail } from "@/lib/email";
import { generatePassword } from "@/lib/password";
import { isValidEmail } from "@/lib/validation";

function isAdmin(role?: string) {
  return role === "SUPER_ADMIN" || role === "MANAGER";
}

const STAFF_ROLES = ["MANAGER", "AGENCY"];

/**
 * Création d'un compte gérant ou agence depuis le menu « Comptes » du super admin.
 * - Génère un mot de passe si non fourni.
 * - Envoie l'email de bienvenue (si Resend configuré) et renvoie toujours les
 *   identifiants pour copie manuelle.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || !isAdmin(role)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const { name, email, userRole, agencyId, phone } = body;
  let { password } = body;

  if (!name?.trim() || !email?.trim() || !userRole) {
    return NextResponse.json({ error: "Nom, email et rôle sont obligatoires." }, { status: 400 });
  }
  if (!STAFF_ROLES.includes(userRole)) {
    return NextResponse.json({ error: "Rôle invalide." }, { status: 400 });
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Adresse email invalide." }, { status: 400 });
  }
  // Un agent d'agence doit être rattaché à une agence
  if (userRole === "AGENCY" && !isUuid(agencyId)) {
    return NextResponse.json({ error: "Sélectionnez une agence pour un agent." }, { status: 400 });
  }
  if (agencyId && !isUuid(agencyId)) {
    return NextResponse.json({ error: "Agence invalide." }, { status: 400 });
  }

  // Mot de passe : fourni (≥8) ou généré
  if (password) {
    if (typeof password !== "string" || password.length < 8) {
      return NextResponse.json({ error: "Le mot de passe doit faire au moins 8 caractères." }, { status: 400 });
    }
  } else {
    password = generatePassword(12);
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Unicité de l'email
  const existing = await sbGet<{ id: string }>("User", `email=eq.${enc(normalizedEmail)}&select=id`);
  if (existing.length > 0) {
    return NextResponse.json({ error: "Un compte existe déjà avec cet email." }, { status: 409 });
  }

  // Nom de l'agence (pour l'email + retour) si rattachement
  let agencyName: string | null = null;
  if (agencyId) {
    const [ag] = await sbGet<{ name: string }>("Agency", `id=eq.${enc(agencyId)}&select=name&limit=1`);
    agencyName = ag?.name ?? null;
  }

  const hashed = await bcrypt.hash(password, 12);
  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  const user = await sbPost<{ id: string }>("User", {
    id,
    name: name.trim(),
    email: normalizedEmail,
    password: hashed,
    role: userRole,
    agencyId: agencyId || null,
    phone: phone?.trim() || null,
    whatsapp: null,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });

  if (!user) return NextResponse.json({ error: "Erreur lors de la création du compte." }, { status: 500 });

  // Envoi de l'email de bienvenue (no-op si Resend pas encore configuré)
  const emailSent = await sendStaffWelcomeEmail({
    name: name.trim(),
    email: normalizedEmail,
    password,
    role: userRole,
    agencyName,
  });

  return NextResponse.json(
    {
      success: true,
      emailSent,
      // Toujours renvoyer pour permettre la copie manuelle des identifiants
      credentials: { email: normalizedEmail, password },
      user: {
        id,
        name: name.trim(),
        email: normalizedEmail,
        role: userRole,
        phone: phone?.trim() || null,
        agencyId: agencyId || null,
        agencyName,
        isActive: true,
        createdAt: now,
      },
    },
    { status: 201 }
  );
}
