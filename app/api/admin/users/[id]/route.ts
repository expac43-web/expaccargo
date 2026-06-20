import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sbPatch, sbDelete } from "@/lib/supabase-admin";

function isAdmin(role?: string) {
  return role === "SUPER_ADMIN" || role === "MANAGER";
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || !isAdmin(role)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const { name, email, phone, whatsapp, userRole, agencyId, isActive } = await req.json();

  if (!name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: "Nom et email obligatoires" }, { status: 400 });
  }

  const updated = await sbPatch("User", `id=eq.${id}`, {
    name: name.trim(),
    email: email.trim().toLowerCase(),
    phone: phone?.trim() || null,
    whatsapp: whatsapp?.trim() || null,
    ...(userRole ? { role: userRole } : {}),
    ...(agencyId !== undefined ? { agencyId: agencyId || null } : {}),
    ...(isActive !== undefined ? { isActive } : {}),
    updatedAt: new Date().toISOString(),
  });

  if (!updated) return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 });

  const { password: _, ...safe } = updated as { password: string; [key: string]: unknown };
  return NextResponse.json(safe);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || !isAdmin(role)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;

  // Prevent self-deletion
  const myId = (session.user as { id?: string })?.id;
  if (id === myId) return NextResponse.json({ error: "Vous ne pouvez pas supprimer votre propre compte" }, { status: 400 });

  const ok = await sbDelete("User", `id=eq.${id}`);
  if (!ok) return NextResponse.json({ error: "Erreur lors de la suppression" }, { status: 500 });
  return NextResponse.json({ success: true });
}
