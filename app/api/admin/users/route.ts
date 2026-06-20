import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sbGet, sbPost, enc, isUuid } from "@/lib/supabase-admin";
import bcrypt from "bcryptjs";

function isAdmin(role?: string) {
  return role === "SUPER_ADMIN" || role === "MANAGER";
}

// List staff users (MANAGER, AGENCY roles)
export async function GET(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || !isAdmin(role)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const agencyId = searchParams.get("agencyId");

  if (agencyId && !isUuid(agencyId))
    return NextResponse.json({ error: "agencyId invalide" }, { status: 400 });

  const qs = agencyId
    ? `agencyId=eq.${enc(agencyId)}&select=id,name,email,role,phone,whatsapp,isActive,createdAt,agencyId&order=name.asc`
    : `role=in.(MANAGER,AGENCY,SUPER_ADMIN)&select=id,name,email,role,phone,isActive,createdAt,agencyId&order=name.asc`;

  const users = await sbGet("User", qs);
  return NextResponse.json(users);
}

// Create a staff user
export async function POST(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || !isAdmin(role)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { name, email, password, userRole, agencyId, phone, whatsapp } = await req.json();

  if (!name?.trim() || !email?.trim() || !password || !userRole) {
    return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "Le mot de passe doit contenir au moins 8 caractères" }, { status: 400 });
  }

  // Check email uniqueness
  const existing = await sbGet("User", `email=eq.${enc(email.trim().toLowerCase())}&select=id`);
  if (existing.length > 0) {
    return NextResponse.json({ error: "Cette adresse email est déjà utilisée" }, { status: 409 });
  }

  const hashed = await bcrypt.hash(password, 12);
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const user = await sbPost("User", {
    id, name: name.trim(), email: email.trim().toLowerCase(),
    password: hashed, role: userRole,
    agencyId: agencyId || null,
    phone: phone?.trim() || null, whatsapp: whatsapp?.trim() || null,
    isActive: true, createdAt: now, updatedAt: now,
  });

  if (!user) return NextResponse.json({ error: "Erreur lors de la création" }, { status: 500 });

  // Don't return password
  const { password: _, ...safe } = user as { password: string; [key: string]: unknown };
  return NextResponse.json(safe, { status: 201 });
}
