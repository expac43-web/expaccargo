import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sbGet, sbPost, enc, encList } from "@/lib/supabase-admin";

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

type StorageRow = { agencyId: string | null; createdById: string | null; [k: string]: unknown };

/** Liste des colis — lecture OUVERTE à tous les acteurs, enrichie du nom d'agence et du créateur. */
export async function GET() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || !isStaff(role)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const items = await sbGet<StorageRow>("Storage", "select=*&order=entryDate.desc");

  const agencyIds = [...new Set(items.map((i) => i.agencyId).filter(Boolean))] as string[];
  const creatorIds = [...new Set(items.map((i) => i.createdById).filter(Boolean))] as string[];
  const [agencies, creators] = await Promise.all([
    agencyIds.length ? sbGet<{ id: string; name: string }>("Agency", `id=in.(${encList(agencyIds)})&select=id,name`) : Promise.resolve([]),
    creatorIds.length ? sbGet<{ id: string; name: string }>("User", `id=in.(${encList(creatorIds)})&select=id,name`) : Promise.resolve([]),
  ]);
  const aMap = new Map(agencies.map((a) => [a.id, a.name]));
  const cMap = new Map(creators.map((c) => [c.id, c.name]));

  const enriched = items.map((i) => ({
    ...i,
    agencyName: i.agencyId ? aMap.get(i.agencyId) ?? null : null,
    creatorName: i.createdById ? cMap.get(i.createdById) ?? null : null,
  }));
  return NextResponse.json(enriched);
}

/** Enregistrement d'un colis. Agent → forcé sur son agence ; admin/gérant → agence obligatoire à choisir. */
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

  // Rattachement à l'agence
  let agencyId: string | null;
  if (canManageAll(u?.role)) {
    agencyId = body.agencyId?.trim() || null;
    if (!agencyId) return NextResponse.json({ error: "Veuillez attribuer le colis à une agence." }, { status: 400 });
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
