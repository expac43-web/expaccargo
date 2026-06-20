import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sbDelete, sbPatch, isUuid } from "@/lib/supabase-admin";
import { getClientBundle } from "@/lib/client-detail";

// Fiche complète du client : profil + expéditions + documents
export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || !["SUPER_ADMIN", "MANAGER"].includes(role ?? "")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: "Client introuvable" }, { status: 404 });

  const bundle = await getClientBundle(id);
  if (!bundle) return NextResponse.json({ error: "Client introuvable" }, { status: 404 });

  return NextResponse.json(bundle);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || !["SUPER_ADMIN", "MANAGER"].includes(role ?? "")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const ok = await sbDelete("User", `id=eq.${id}`);
  if (!ok) return NextResponse.json({ error: "Erreur lors de la suppression" }, { status: 500 });
  return NextResponse.json({ success: true });
}

// Toggle active status
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || !["SUPER_ADMIN", "MANAGER"].includes(role ?? "")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const { isActive } = await req.json();
  const ok = await sbPatch("User", `id=eq.${id}`, { isActive, updatedAt: new Date().toISOString() });
  if (!ok) return NextResponse.json({ error: "Erreur" }, { status: 500 });
  return NextResponse.json({ success: true });
}
