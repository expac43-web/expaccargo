import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sbGet, encList } from "@/lib/supabase-admin";

function isGerant(role?: string) {
  return role === "MANAGER" || role === "SUPER_ADMIN";
}

const SLA_HOURS = 2;

type UnansweredItem = {
  conversationId: string;
  clientName: string;
  agencyName: string;
  lastMessage: string;
  lastAt: string;
  waitHours: number;
  overSla: boolean;
};

// Pilotage gérant : KPIs par agence + conversations en attente de réponse (SLA).
export async function GET() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || !isGerant(role)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const [agencies, agents, shipments, convs] = await Promise.all([
    sbGet<{ id: string; name: string; city: string }>("Agency", "select=id,name,city&order=name.asc"),
    sbGet<{ id: string; agencyId: string | null }>("User", "role=eq.AGENCY&agencyId=not.is.null&select=id,agencyId"),
    sbGet<{ id: string; status: string; agencyId: string | null }>("Shipment", "select=id,status,agencyId"),
    sbGet<{ id: string; clientId: string; agencyId: string | null }>("Conversation", "type=eq.CLIENT_AGENCY&select=id,clientId,agencyId"),
  ]);

  // Dernier message par conversation (pour détecter celles en attente de réponse staff)
  let messages: { id: string; conversationId: string; senderId: string; content: string; createdAt: string }[] = [];
  if (convs.length > 0) {
    messages = await sbGet(
      "Message",
      `conversationId=in.(${encList(convs.map((c) => c.id))})&select=id,conversationId,senderId,content,createdAt&order=createdAt.asc`
    );
  }
  const lastByConv = new Map<string, { senderId: string; content: string; createdAt: string }>();
  for (const m of messages) lastByConv.set(m.conversationId, m); // ordre asc → le dernier écrase

  // Noms clients / agences
  const clientIds = [...new Set(convs.map((c) => c.clientId))];
  let clients: { id: string; name: string }[] = [];
  if (clientIds.length > 0) clients = await sbGet<{ id: string; name: string }>("User", `id=in.(${encList(clientIds)})&select=id,name`);
  const clientName = Object.fromEntries(clients.map((c) => [c.id, c.name]));
  const agencyName = Object.fromEntries(agencies.map((a) => [a.id, a.name]));

  const now = Date.now();
  const slaMs = SLA_HOURS * 60 * 60 * 1000;

  const isUnanswered = (convId: string, clientId: string) => {
    const last = lastByConv.get(convId);
    return !!last && last.senderId === clientId;
  };

  const perAgency = agencies.map((a) => {
    const ships = shipments.filter((s) => s.agencyId === a.id);
    const aConvs = convs.filter((c) => c.agencyId === a.id);
    return {
      id: a.id,
      name: a.name,
      city: a.city,
      agents: agents.filter((u) => u.agencyId === a.id).length,
      shipmentsTotal: ships.length,
      shipmentsActive: ships.filter((s) => !["DELIVERED", "CANCELLED"].includes(s.status)).length,
      conversations: aConvs.length,
      unanswered: aConvs.filter((c) => isUnanswered(c.id, c.clientId)).length,
    };
  });

  const unanswered: UnansweredItem[] = [];
  for (const c of convs) {
    const last = lastByConv.get(c.id);
    if (!last || last.senderId !== c.clientId) continue;
    const waitMs = now - new Date(last.createdAt).getTime();
    unanswered.push({
      conversationId: c.id,
      clientName: clientName[c.clientId] ?? "Client",
      agencyName: c.agencyId ? (agencyName[c.agencyId] ?? "—") : "—",
      lastMessage: last.content,
      lastAt: last.createdAt,
      waitHours: Math.floor(waitMs / 3_600_000),
      overSla: waitMs > slaMs,
    });
  }
  unanswered.sort((a, b) => new Date(a.lastAt).getTime() - new Date(b.lastAt).getTime());

  return NextResponse.json({
    slaHours: SLA_HOURS,
    totals: {
      agencies: agencies.length,
      shipmentsActive: shipments.filter((s) => !["DELIVERED", "CANCELLED"].includes(s.status)).length,
      unanswered: unanswered.length,
      overSla: unanswered.filter((u) => u.overSla).length,
    },
    perAgency,
    unanswered,
  });
}
