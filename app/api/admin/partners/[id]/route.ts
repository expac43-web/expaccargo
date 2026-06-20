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
  const { name, logoUrl, website, isActive, order } = await req.json();

  if (!name?.trim() || !logoUrl?.trim()) {
    return NextResponse.json({ error: "Nom et URL du logo obligatoires" }, { status: 400 });
  }

  const updated = await sbPatch("Partner", `id=eq.${id}`, {
    name: name.trim(), logoUrl: logoUrl.trim(),
    website: website?.trim() || null,
    ...(isActive !== undefined ? { isActive } : {}),
    ...(order !== undefined ? { order } : {}),
  });

  if (!updated) return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 });
  return NextResponse.json(updated);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || !isAdmin(role)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const ok = await sbPatch("Partner", `id=eq.${id}`, body);
  if (!ok) return NextResponse.json({ error: "Erreur" }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || !isAdmin(role)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const ok = await sbDelete("Partner", `id=eq.${id}`);
  if (!ok) return NextResponse.json({ error: "Erreur lors de la suppression" }, { status: 500 });
  return NextResponse.json({ success: true });
}
