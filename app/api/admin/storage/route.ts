import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sbGet, sbPost, enc } from "@/lib/supabase-admin";

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

const LOCATIONS = ["BZV", "PN"];
const STATUSES = ["AWAITING", "RELEASED"];

/** Liste des colis stockés — lecture OUVERTE à tous les acteurs (admin / gérant / agence). */
export async function GET() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || !isStaff(role)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const items = await sbGet("Storage", "select=*&order=entryDate.desc");
  return NextResponse.json(items);
}

/** Enregistrement d'un colis. L'agent est limité à SA propre agence ; admin/gérant : tous droits. */
export async function POST(req: NextRequest) {
  const session = await auth();
  const u = session?.user as { id?: string; role?: string } | undefined;
  if (!session || !isStaff(u?.role)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const reference = String(body.reference ?? "").trim().toUpperCase();
  if (!reference) return NextResponse.json({ error: "La référence est obligatoire." }, { status: 400 });
  if (!body.entryDate) return NextResponse.json({ error: "La date d'entrée est obligatoire." }, { status: 400 });

  const status = STATUSES.includes(body.status) ? body.status : "AWAITING";
  const location = LOCATIONS.includes(body.location) ? body.location : "PN";

  // Rattachement à l'agence : l'agent est forcé sur SON agence ; admin/gérant peuvent préciser (ou laisser vide).
  let agencyId: string | null;
  if (canManageAll(u?.role)) {
    agencyId = body.agencyId?.trim() || null;
  } else {
    agencyId = await getUserAgencyId(u?.id);
    if (!agencyId) return NextResponse.json({ error: "Aucune agence n'est associée à votre compte." }, { status: 403 });
  }

  const existing = await sbGet<{ id: string }>("Storage", `reference=eq.${enc(reference)}&select=id&limit=1`);
  if (existing.length > 0) return NextResponse.json({ error: "Cette référence existe déjà." }, { status: 409 });

  const now = new Date().toISOString();
  const created = await sbPost("Storage", {
    id: crypto.randomUUID(),
    reference,
    clientName: body.clientName?.trim() || null,
    description: body.description?.trim() || null,
    entryDate: new Date(body.entryDate).toISOString(),
    expectedExitDate: body.expectedExitDate ? new Date(body.expectedExitDate).toISOString() : null,
    status,
    location,
    notes: body.notes?.trim() || null,
    agencyId,
    createdById: u!.id ?? null,
    createdAt: now,
    updatedAt: now,
  });

  if (!created) return NextResponse.json({ error: "Erreur lors de l'enregistrement." }, { status: 500 });
  return NextResponse.json(created, { status: 201 });
}
