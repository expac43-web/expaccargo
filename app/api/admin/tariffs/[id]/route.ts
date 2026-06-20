import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sbPatch, sbDelete, enc, isUuid } from "@/lib/supabase-admin";

function canManage(role?: string) {
  return role === "SUPER_ADMIN" || role === "MANAGER";
}

const SERVICES = ["TRANSIT", "MULTIMODAL", "MARITIME_CONSIGNMENT", "GROUPAGE", "STORAGE"];
const NUM_FIELDS = ["baseFee", "pricePerKg", "pricePerM3", "volumetricFactor", "minPrice"];

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || !canManage(role)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: "Tarif introuvable" }, { status: 404 });

  const b = await req.json();
  const update: Record<string, unknown> = {};
  if (b.serviceType) {
    if (!SERVICES.includes(b.serviceType)) return NextResponse.json({ error: "Service invalide." }, { status: 400 });
    update.serviceType = b.serviceType;
  }
  if (typeof b.origin === "string") update.origin = b.origin.trim();
  if (typeof b.destination === "string") update.destination = b.destination.trim();
  if (typeof b.currency === "string") update.currency = b.currency.trim() || "XAF";
  if ("note" in b) update.note = b.note?.trim() || null;
  if ("isActive" in b) update.isActive = !!b.isActive;
  for (const f of NUM_FIELDS) {
    if (f in b) {
      const n = Number(b[f]);
      update[f] = Number.isFinite(n) && n >= 0 ? n : 0;
    }
  }

  const ok = await sbPatch("Tariff", `id=eq.${enc(id)}`, update);
  if (!ok) return NextResponse.json({ error: "Erreur lors de la mise à jour." }, { status: 500 });
  return NextResponse.json(ok);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || !canManage(role)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: "Tarif introuvable" }, { status: 404 });

  const ok = await sbDelete("Tariff", `id=eq.${enc(id)}`);
  if (!ok) return NextResponse.json({ error: "Erreur lors de la suppression." }, { status: 500 });
  return NextResponse.json({ success: true });
}
