import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sbGet, sbPost } from "@/lib/supabase-admin";

function isAdmin(role?: string) {
  return ["SUPER_ADMIN", "MANAGER", "AGENCY"].includes(role ?? "");
}

function generateReference() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const rand = Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5).padEnd(5, "X");
  return `EXP-${year}${month}-${rand}`;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || !isAdmin(role)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search")?.trim().toLowerCase();

  let qs = "select=id,reference,trackingNumber,status,serviceType,origin,destination,weight,volume,description,eta,deliveredAt,clientId,agencyId,createdAt,updatedAt&order=createdAt.desc";
  if (status && status !== "ALL") {
    qs = `status=eq.${status}&${qs}`;
  }

  const shipments = await sbGet<{
    id: string; reference: string; trackingNumber: string | null;
    status: string; serviceType: string; origin: string; destination: string;
    weight: number | null; volume: number | null; description: string | null;
    eta: string | null; deliveredAt: string | null;
    clientId: string; agencyId: string | null;
    createdAt: string; updatedAt: string;
  }>("Shipment", qs);

  // Fetch clients to enrich shipments
  const clients = await sbGet<{ id: string; name: string; email: string }>(
    "User", "role=eq.CLIENT&select=id,name,email"
  );
  const clientMap: Record<string, { name: string; email: string }> = {};
  for (const c of clients) clientMap[c.id] = { name: c.name, email: c.email };

  const enriched = shipments.map((s) => ({
    ...s,
    clientName: clientMap[s.clientId]?.name ?? "Inconnu",
    clientEmail: clientMap[s.clientId]?.email ?? "",
  }));

  // Client-side search filter
  const filtered = search
    ? enriched.filter(
        (s) =>
          s.reference.toLowerCase().includes(search) ||
          s.origin.toLowerCase().includes(search) ||
          s.destination.toLowerCase().includes(search) ||
          s.clientName.toLowerCase().includes(search)
      )
    : enriched;

  return NextResponse.json(filtered);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || !isAdmin(role)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const { reference, trackingNumber, serviceType, status, origin, destination,
    weight, volume, description, eta, clientId, agencyId } = body;

  if (!serviceType || !origin?.trim() || !destination?.trim() || !clientId) {
    return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 });
  }

  const ref = reference?.trim() || generateReference();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const shipment = await sbPost("Shipment", {
    id,
    reference: ref,
    trackingNumber: trackingNumber?.trim() || null,
    status: status || "PENDING",
    serviceType,
    origin: origin.trim(),
    destination: destination.trim(),
    weight: weight ? Number(weight) : null,
    volume: volume ? Number(volume) : null,
    description: description?.trim() || null,
    eta: eta || null,
    clientId,
    agencyId: agencyId || null,
    createdAt: now,
    updatedAt: now,
  });

  if (!shipment) return NextResponse.json({ error: "Erreur lors de la création" }, { status: 500 });
  return NextResponse.json(shipment, { status: 201 });
}
