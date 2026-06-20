import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { sbGet, sbPost, enc } from "@/lib/supabase-admin";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { isValidEmail } from "@/lib/validation";

export async function POST(req: NextRequest) {
  try {
    // Anti-abus : 5 inscriptions / heure / IP
    const ip = getClientIp(req);
    const rl = rateLimit(`register:${ip}`, 5, 60 * 60 * 1000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Trop de tentatives. Réessayez plus tard." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
      );
    }

    const body = await req.json();
    const { name, email, password, phone, whatsapp, accountType, companyName } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Champs obligatoires manquants." }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Adresse email invalide." }, { status: 400 });
    }

    if (typeof password !== "string" || password.length < 8) {
      return NextResponse.json({ error: "Le mot de passe doit contenir au moins 8 caractères." }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already exists
    const existing = await sbGet<{ id: string }>(
      "User",
      `email=eq.${enc(normalizedEmail)}&select=id&limit=1`
    );
    if (existing.length > 0) {
      return NextResponse.json({ error: "Un compte existe déjà avec cet email." }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const displayName = accountType === "entreprise" && companyName?.trim()
      ? companyName.trim()
      : name.trim();

    const now = new Date().toISOString();

    const user = await sbPost("User", {
      id: crypto.randomUUID(),
      name: displayName,
      email: normalizedEmail,
      password: hashedPassword,
      phone: phone?.trim() || null,
      whatsapp: whatsapp?.trim() || null,
      role: "CLIENT",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    if (!user) {
      return NextResponse.json({ error: "Erreur lors de la création du compte." }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error("[register]", err);
    return NextResponse.json({ error: "Erreur serveur. Réessayez plus tard." }, { status: 500 });
  }
}
