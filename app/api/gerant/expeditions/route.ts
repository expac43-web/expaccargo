import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sbGet } from "@/lib/supabase-admin";

function isGerant(role?: string) {
  return role === "MANAGER" || role === "SUPER_ADMIN";
}

export async function GET(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || !isGerant(role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const clientId = searchParams.get("clientId");

  let query = "select=*&order=createdAt.desc";
  if (status) query += `&status=eq.${status}`;
  if (clientId) query += `&clientId=eq.${clientId}`;

  const shipments = await sbGet<{
    id: string; reference: string; status: string; origin: string;
    destination: string; cargoType: string | null; weight: number | null;
    clientId: string; createdAt: string; estimatedDelivery: string | null;
    trackingNumber: string | null;
  }>("Shipment", query);

  const userIds = [...new Set(shipments.map((s) => s.clientId))];
  let clients: { id: string; name: string; email: string }[] = [];
  if (userIds.length > 0) {
    clients = await sbGet<{ id: string; name: string; email: string }>(
      "User", `id=in.(${userIds.join(",")})&select=id,name,email`
    );
  }
  const clientMap = Object.fromEntries(clients.map((c) => [c.id, c]));

  return NextResponse.json(shipments.map((s) => ({
    ...s,
    client: clientMap[s.clientId] ?? { name: "Inconnu", email: "" },
  })));
}
