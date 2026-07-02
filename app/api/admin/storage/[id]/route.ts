import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sbPatch, sbDelete, enc } from "@/lib/supabase-admin";

function isStaff(role?: string) {
  return role === "SUPER_ADMIN" || role === "MANAGER" || role === "AGENCY";
}

const LOCATIONS = ["BZV", "PN"];
const STATUSES = ["AWAITING", "RELEASED"];

/** Mise à jour d'un colis stocké. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || !isStaff(role)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const patch: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  if (body.reference !== undefined) {
    const ref = String(body.reference).trim().toUpperCase();
    if (!ref) return NextResponse.json({ error: "Référence invalide." }, { status: 400 });
    patch.reference = ref;
  }
  if (body.clientName !== undefined) patch.clientName = body.clientName?.trim() || null;
  if (body.description !== undefined) patch.description = body.description?.trim() || null;
  if (body.notes !== undefined) patch.notes = body.notes?.trim() || null;
  if (body.entryDate !== undefined) patch.entryDate = body.entryDate ? new Date(body.entryDate).toISOString() : null;
  if (body.expectedExitDate !== undefined) patch.expectedExitDate = body.expectedExitDate ? new Date(body.expectedExitDate).toISOString() : null;
  if (body.status !== undefined && STATUSES.includes(body.status)) patch.status = body.status;
  if (body.location !== undefined && LOCATIONS.includes(body.location)) patch.location = body.location;

  const updated = await sbPatch("Storage", `id=eq.${enc(id)}`, patch);
  if (!updated) return NextResponse.json({ error: "Erreur lors de la mise à jour." }, { status: 500 });
  return NextResponse.json(updated);
}

/** Suppression d'un colis stocké. */
export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || !isStaff(role)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const ok = await sbDelete("Storage", `id=eq.${enc(id)}`);
  if (!ok) return NextResponse.json({ error: "Erreur lors de la suppression." }, { status: 500 });
  return NextResponse.json({ success: true });
}
