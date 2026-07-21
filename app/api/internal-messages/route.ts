import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sbGet, sbPost, sbPatch, enc, encList } from "@/lib/supabase-admin";

const STAFF = ["SUPER_ADMIN", "MANAGER", "AGENCY"];
function isStaff(role?: string) {
  return STAFF.includes(role ?? "");
}

type Msg = { id: string; content: string; senderId: string; receiverId: string; isRead: boolean; createdAt: string };

/**
 * Messagerie interne du personnel (admin ↔ gérant ↔ agents).
 *
 * - Sans `with` : renvoie les collègues + dernier message + nombre de non-lus.
 * - Avec `?with=<userId>` : renvoie le fil avec ce collègue et marque comme lus
 *   les messages reçus de sa part.
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  const me = session?.user as { id?: string; role?: string } | undefined;
  if (!session || !isStaff(me?.role) || !me?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const other = new URL(req.url).searchParams.get("with");

  // ── Fil avec un collègue précis ──
  if (other) {
    const msgs = await sbGet<Msg>(
      "Message",
      `isInternal=eq.true&or=(and(senderId.eq.${enc(me.id)},receiverId.eq.${enc(other)}),and(senderId.eq.${enc(other)},receiverId.eq.${enc(me.id)}))&select=id,content,senderId,receiverId,isRead,createdAt&order=createdAt.asc`
    );
    // Marquer comme lus les messages reçus de ce collègue.
    await sbPatch("Message", `isInternal=eq.true&senderId=eq.${enc(other)}&receiverId=eq.${enc(me.id)}&isRead=eq.false`, { isRead: true });
    return NextResponse.json(msgs);
  }

  // ── Liste des collègues + aperçu ──
  const colleagues = await sbGet<{ id: string; name: string; email: string; role: string }>(
    "User",
    `role=in.(${STAFF.join(",")})&isActive=eq.true&select=id,name,email,role&order=name.asc`
  );
  const others = colleagues.filter((u) => u.id !== me.id);

  const all = await sbGet<Msg>(
    "Message",
    `isInternal=eq.true&or=(senderId.eq.${enc(me.id)},receiverId.eq.${enc(me.id)})&select=id,content,senderId,receiverId,isRead,createdAt&order=createdAt.desc`
  );

  const last: Record<string, Msg> = {};
  const unread: Record<string, number> = {};
  for (const m of all) {
    const peer = m.senderId === me.id ? m.receiverId : m.senderId;
    if (!last[peer]) last[peer] = m; // la liste est déjà triée du plus récent au plus ancien
    if (m.receiverId === me.id && !m.isRead) unread[peer] = (unread[peer] ?? 0) + 1;
  }

  return NextResponse.json(
    others
      .map((u) => ({
        ...u,
        lastMessage: last[u.id]?.content ?? null,
        lastAt: last[u.id]?.createdAt ?? null,
        unread: unread[u.id] ?? 0,
      }))
      .sort((a, b) => (b.lastAt ?? "").localeCompare(a.lastAt ?? ""))
  );
}

/** Envoi d'un message interne à un collègue. */
export async function POST(req: NextRequest) {
  const session = await auth();
  const me = session?.user as { id?: string; role?: string } | undefined;
  if (!session || !isStaff(me?.role) || !me?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { receiverId, content } = await req.json();
  if (!receiverId || !content?.trim()) {
    return NextResponse.json({ error: "Destinataire et message obligatoires." }, { status: 400 });
  }
  if (receiverId === me.id) {
    return NextResponse.json({ error: "Impossible de s'écrire à soi-même." }, { status: 400 });
  }

  // Le destinataire doit être un membre du personnel actif.
  const [peer] = await sbGet<{ id: string }>(
    "User",
    `id=eq.${enc(receiverId)}&role=in.(${encList(STAFF)})&isActive=eq.true&select=id&limit=1`
  );
  if (!peer) return NextResponse.json({ error: "Destinataire invalide." }, { status: 400 });

  const msg = await sbPost("Message", {
    id: crypto.randomUUID(),
    content: String(content).trim().slice(0, 5000),
    senderId: me.id,
    receiverId: peer.id,
    isInternal: true,
    isRead: false,
    sentAsManager: me.role === "MANAGER",
    deletedBySender: false,
    deletedByReceiver: false,
    createdAt: new Date().toISOString(),
  });

  if (!msg) return NextResponse.json({ error: "Erreur lors de l'envoi." }, { status: 500 });
  return NextResponse.json(msg, { status: 201 });
}
