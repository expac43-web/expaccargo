import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sbGet } from "@/lib/supabase-admin";

function isAgency(role?: string) {
  return role === "AGENCY" || role === "MANAGER" || role === "SUPER_ADMIN";
}

export async function GET() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || !isAgency(role)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const clients = await sbGet<{
    id: string; name: string; email: string; phone: string | null;
    whatsapp: string | null; isActive: boolean; createdAt: string;
  }>("User", "role=eq.CLIENT&select=id,name,email,phone,whatsapp,isActive,createdAt&order=name.asc");

  // Enrichir avec le nb d'expéditions actives par client
  const shipments = await sbGet<{ clientId: string; status: string }>(
    "Shipment", "select=clientId,status"
  );

  const counts: Record<string, { total: number; active: number }> = {};
  for (const s of shipments) {
    if (!counts[s.clientId]) counts[s.clientId] = { total: 0, active: 0 };
    counts[s.clientId].total++;
    if (!["DELIVERED", "CANCELLED"].includes(s.status)) counts[s.clientId].active++;
  }

  return NextResponse.json(clients.map((c) => ({
    ...c,
    shipmentCount: counts[c.id]?.total ?? 0,
    activeShipments: counts[c.id]?.active ?? 0,
  })));
}
