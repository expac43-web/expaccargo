import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sbGet, sbPost } from "@/lib/supabase-admin";

function canManage(role?: string) {
  return role === "SUPER_ADMIN" || role === "MANAGER";
}

const SERVICES = ["TRANSIT", "MULTIMODAL", "MARITIME_CONSIGNMENT", "GROUPAGE", "STORAGE"];

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export async function GET() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || !canManage(role)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const tariffs = await sbGet("Tariff", "select=*&order=createdAt.desc");
  return NextResponse.json(tariffs);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || !canManage(role)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const b = await req.json();
  if (!b.serviceType || !SERVICES.includes(b.serviceType)) return NextResponse.json({ error: "Service invalide." }, { status: 400 });
  if (!b.origin?.trim() || !b.destination?.trim()) return NextResponse.json({ error: "Origine et destination obligatoires." }, { status: 400 });

  const tariff = await sbPost("Tariff", {
    id: crypto.randomUUID(),
    serviceType: b.serviceType,
    origin: b.origin.trim(),
    destination: b.destination.trim(),
    baseFee: num(b.baseFee),
    pricePerKg: num(b.pricePerKg),
    pricePerM3: num(b.pricePerM3),
    volumetricFactor: (() => { const n = Number(b.volumetricFactor); return Number.isFinite(n) && n > 0 ? n : 167; })(),
    minPrice: num(b.minPrice),
    currency: (b.currency || "XAF").trim(),
    note: b.note?.trim() || null,
    isActive: b.isActive ?? true,
    createdAt: new Date().toISOString(),
  });

  if (!tariff) return NextResponse.json({ error: "Erreur lors de la création." }, { status: 500 });
  return NextResponse.json(tariff, { status: 201 });
}
