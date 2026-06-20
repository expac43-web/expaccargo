import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sbGet } from "@/lib/supabase-admin";

function isGerant(role?: string) {
  return role === "MANAGER" || role === "SUPER_ADMIN";
}

export async function GET() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  const userId = (session?.user as { id?: string })?.id;
  if (!session || !isGerant(role) || !userId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const [clients, shipments, unreadMsgs, docs] = await Promise.all([
    sbGet<{ id: string }>("User", "role=eq.CLIENT&select=id"),
    sbGet<{ id: string; status: string; reference: string; origin: string; destination: string; clientId: string; createdAt: string }>(
      "Shipment", "select=id,status,reference,origin,destination,clientId,createdAt&order=createdAt.desc"
    ),
    sbGet<{ id: string }>("Message", `receiverId=eq.${userId}&isRead=eq.false&select=id`),
    sbGet<{ id: string; createdAt: string }>("Document", "select=id,createdAt&order=createdAt.desc"),
  ]);

  const activeShipments = shipments.filter((s) => !["DELIVERED", "CANCELLED"].includes(s.status));
  const recentShipments = shipments.slice(0, 5);

  // Enrichir les 5 dernières expéditions avec le nom du client
  const clientIds = [...new Set(recentShipments.map((s) => s.clientId))];
  let clientList: { id: string; name: string }[] = [];
  if (clientIds.length > 0) {
    clientList = await sbGet<{ id: string; name: string }>(
      "User", `id=in.(${clientIds.join(",")})&select=id,name`
    );
  }
  const clientMap = Object.fromEntries(clientList.map((c) => [c.id, c.name]));

  // Documents des 7 derniers jours
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const recentDocs = docs.filter((d) => d.createdAt >= weekAgo).length;

  return NextResponse.json({
    totalClients: clients.length,
    totalShipments: shipments.length,
    activeShipments: activeShipments.length,
    deliveredShipments: shipments.filter((s) => s.status === "DELIVERED").length,
    unreadMessages: unreadMsgs.length,
    recentDocuments: recentDocs,
    recentShipments: recentShipments.map((s) => ({
      ...s,
      clientName: clientMap[s.clientId] ?? "Inconnu",
    })),
  });
}
