import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sbGet, sbPatch } from "@/lib/supabase-admin";

function isGerant(role?: string) {
  return role === "MANAGER" || role === "SUPER_ADMIN";
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || !isGerant(role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const shipments = await sbGet<{
    id: string; reference: string; status: string; origin: string;
    destination: string; cargoType: string | null; weight: number | null;
    clientId: string; createdAt: string; estimatedDelivery: string | null;
    trackingNumber: string | null;
  }>("Shipment", `id=eq.${id}&select=*`);

  if (!shipments.length) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const s = shipments[0];
  const clients = await sbGet<{ id: string; name: string; email: string }>(
    "User", `id=eq.${s.clientId}&select=id,name,email`
  );

  return NextResponse.json({ ...s, client: clients[0] ?? { name: "Inconnu", email: "" } });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || !isGerant(role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  const allowed = ["status", "estimatedDelivery", "trackingNumber"];
  const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  if (Object.keys(updates).length === 1) {
    return NextResponse.json({ error: "Aucun champ à mettre à jour." }, { status: 400 });
  }

  const updated = await sbPatch("Shipment", `id=eq.${id}`, updates);
  if (!updated) return NextResponse.json({ error: "Mise à jour échouée." }, { status: 500 });

  return NextResponse.json({ success: true });
}
