import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sbGet, sbPatch } from "@/lib/supabase-admin";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const id = (session.user as { id?: string })?.id;
  if (!id) return NextResponse.json({ error: "Session invalide" }, { status: 401 });

  const [user] = await sbGet<{
    id: string; name: string; email: string;
    phone: string | null; whatsapp: string | null; role: string; createdAt: string;
  }>("User", `id=eq.${id}&select=id,name,email,phone,whatsapp,role,createdAt`);

  if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  return NextResponse.json(user);
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const id = (session.user as { id?: string })?.id;
  if (!id) return NextResponse.json({ error: "Session invalide" }, { status: 401 });

  const { name, phone, whatsapp } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Le nom est obligatoire" }, { status: 400 });

  const updated = await sbPatch("User", `id=eq.${id}`, {
    name: name.trim(),
    phone: phone?.trim() || null,
    whatsapp: whatsapp?.trim() || null,
    updatedAt: new Date().toISOString(),
  });

  if (!updated) return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 });
  const { password: _, ...safe } = updated as { password: string; [key: string]: unknown };
  return NextResponse.json(safe);
}

// Change password
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const id = (session.user as { id?: string })?.id;
  if (!id) return NextResponse.json({ error: "Session invalide" }, { status: 401 });

  const { currentPassword, newPassword } = await req.json();

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Mots de passe manquants" }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: "Le nouveau mot de passe doit contenir au moins 8 caractères" }, { status: 400 });
  }

  const [user] = await sbGet<{ password: string }>("User", `id=eq.${id}&select=password`);
  if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) return NextResponse.json({ error: "Mot de passe actuel incorrect" }, { status: 400 });

  const hashed = await bcrypt.hash(newPassword, 12);
  await sbPatch("User", `id=eq.${id}`, { password: hashed, updatedAt: new Date().toISOString() });

  return NextResponse.json({ success: true });
}
