import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sbGet, sbPatch } from "@/lib/supabase-admin";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await auth();
  const userId = (session?.user as { id?: string })?.id;
  const role = (session?.user as { role?: string })?.role;
  if (!session || role !== "MANAGER" || !userId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const users = await sbGet<{
    id: string; name: string; email: string; phone: string | null; whatsapp: string | null; avatarUrl: string | null;
  }>("User", `id=eq.${userId}&select=id,name,email,phone,whatsapp,avatarUrl`);

  if (!users.length) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json(users[0]);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  const userId = (session?.user as { id?: string })?.id;
  const role = (session?.user as { role?: string })?.role;
  if (!session || role !== "MANAGER" || !userId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { name, phone, whatsapp, currentPassword, newPassword } = await req.json();
  const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };

  if (name?.trim()) updates.name = name.trim();
  if (phone !== undefined) updates.phone = phone?.trim() || null;
  if (whatsapp !== undefined) updates.whatsapp = whatsapp?.trim() || null;

  if (newPassword) {
    if (!currentPassword) return NextResponse.json({ error: "Mot de passe actuel requis." }, { status: 400 });
    if (newPassword.length < 8) return NextResponse.json({ error: "Nouveau mot de passe trop court." }, { status: 400 });
    const users = await sbGet<{ password: string }>("User", `id=eq.${userId}&select=password`);
    const valid = users[0] && await bcrypt.compare(currentPassword, users[0].password);
    if (!valid) return NextResponse.json({ error: "Mot de passe actuel incorrect." }, { status: 400 });
    updates.password = await bcrypt.hash(newPassword, 12);
  }

  await sbPatch("User", `id=eq.${userId}`, updates);
  return NextResponse.json({ success: true });
}
