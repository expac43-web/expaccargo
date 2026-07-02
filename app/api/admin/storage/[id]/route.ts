import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sbGet, sbPatch, sbDelete, enc } from "@/lib/supabase-admin";

function isStaff(role?: string) {
  return role === "SUPER_ADMIN" || role === "MANAGER" || role === "AGENCY";
}
function canManageAll(role?: string) {
  return role === "SUPER_ADMIN" || role === "MANAGER";
}
async function getUserAgencyId(userId?: string): Promise<string | null> {
  if (!userId) return null;
  const rows = await sbGet<{ agencyId: string | null }>("User", `id=eq.${enc(userId)}&select=agencyId&limit=1`);
  return rows[0]?.agencyId ?? null;
}

/**
 * Droit d'écriture : admin/gérant partout ; un agent uniquement sur les colis de SON agence.
 */
async function canWrite(u: { id?: string; role?: string } | undefined, id: string): Promise<boolean> {
  if (canManageAll(u?.role)) return true;
  const rows = await sbGet<{ agencyId: string | null }>("Storage", `id=eq.${enc(id)}&select=agencyId&limit=1`);
  if (rows.length === 0) return false;
  const myAgency = await getUserAgencyId(u?.id);
  return !!myAgency && rows[0].agencyId === myAgency;
}

const LOCATIONS = ["BZV", "PN"];
const STATUSES = ["AWAITING", "RELEASED"];

/** Mise à jour d'un colis stocké. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const u = session?.user as { id?: string; role?: string } | undefined;
  if (!session || !isStaff(u?.role)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  if (!(await canWrite(u, id))) {
    return NextResponse.json({ error: "Vous ne pouvez modifier que les colis de votre agence." }, { status: 403 });
  }

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
  // Seuls admin/gérant peuvent réattribuer le colis à une autre agence.
  if (body.agencyId !== undefined && canManageAll(u?.role)) patch.agencyId = body.agencyId?.trim() || null;

  const updated = await sbPatch("Storage", `id=eq.${enc(id)}`, patch);
  if (!updated) return NextResponse.json({ error: "Erreur lors de la mise à jour." }, { status: 500 });
  return NextResponse.json(updated);
}

/** Suppression d'un colis stocké. */
export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const u = session?.user as { id?: string; role?: string } | undefined;
  if (!session || !isStaff(u?.role)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  if (!(await canWrite(u, id))) {
    return NextResponse.json({ error: "Vous ne pouvez supprimer que les colis de votre agence." }, { status: 403 });
  }

  const ok = await sbDelete("Storage", `id=eq.${enc(id)}`);
  if (!ok) return NextResponse.json({ error: "Erreur lors de la suppression." }, { status: 500 });
  return NextResponse.json({ success: true });
}
