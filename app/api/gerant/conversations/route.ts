import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sbGet, sbPost, sbPatch, enc, encList, isUuid } from "@/lib/supabase-admin";

type Conv = {
  id: string; type: string; clientId: string; agencyId: string | null;
  createdAt: string; updatedAt: string;
  client: { id: string; name: string; email: string } | null;
  agency: { id: string; name: string } | null;
};
type Msg = { id: string; conversationId: string; isRead: boolean; receiverId: string; content: string; createdAt: string };

// GET — toutes les conversations (CLIENT_AGENCY + CLIENT_MANAGER)
export async function GET() {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!session || user?.role !== "MANAGER" || !user?.id)
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const convs = await sbGet<Conv>(
    "Conversation",
    `deletedByStaff=eq.false&select=id,type,clientId,agencyId,createdAt,updatedAt,client:User!clientId(id,name,email),agency:Agency(id,name)&order=updatedAt.desc`
  );
  if (convs.length === 0) return NextResponse.json([]);

  const ids = encList(convs.map((c) => c.id));
  const messages = await sbGet<Msg>(
    "Message",
    `conversationId=in.(${ids})&select=id,conversationId,isRead,receiverId,content,createdAt&order=createdAt.asc`
  );

  const result = convs.map((conv) => {
    const msgs = messages.filter((m) => m.conversationId === conv.id);
    const unread = msgs.filter((m) => m.receiverId === user.id && !m.isRead).length;
    const last = msgs[msgs.length - 1] ?? null;
    return { ...conv, unreadCount: unread, lastMessage: last?.content ?? null, lastDate: last?.createdAt ?? conv.createdAt };
  });

  return NextResponse.json(result);
}

// POST — démarrer une conversation directe CLIENT_MANAGER avec un client
export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!session || user?.role !== "MANAGER" || !user?.id)
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { clientId, firstMessage } = await req.json();
  if (!isUuid(clientId)) return NextResponse.json({ error: "clientId invalide" }, { status: 400 });

  const now = new Date().toISOString();

  // Réutiliser la conv CLIENT_MANAGER existante (même supprimée côté staff).
  const existing = await sbGet<{ id: string }>(
    "Conversation",
    `clientId=eq.${enc(clientId)}&type=eq.CLIENT_MANAGER&agencyId=is.null&select=id&limit=1`
  );

  let convId: string;
  let exists = false;
  if (existing[0]) {
    convId = existing[0].id;
    exists = true;
    await sbPatch("Conversation", `id=eq.${enc(convId)}`, { deletedByStaff: false });
  } else {
    const conv = await sbPost<{ id: string }>("Conversation", {
      id: crypto.randomUUID(),
      type: "CLIENT_MANAGER",
      clientId,
      agencyId: null,
      deletedByClient: false,
      deletedByStaff: false,
      createdAt: now,
      updatedAt: now,
    });
    if (!conv) return NextResponse.json({ error: "Erreur création conversation" }, { status: 500 });
    convId = conv.id;
  }

  if (firstMessage?.trim()) {
    await sbPost("Message", {
      id: crypto.randomUUID(),
      content: firstMessage.trim(),
      senderId: user.id,
      receiverId: clientId,
      conversationId: convId,
      isRead: false,
      deletedBySender: false,
      deletedByReceiver: false,
      sentAsManager: true,
      createdAt: now,
    });
    // Le message ré-affiche la conversation côté client (destinataire).
    await sbPatch("Conversation", `id=eq.${enc(convId)}`, { updatedAt: now, deletedByClient: false });
  }

  return NextResponse.json({ id: convId, exists }, { status: exists ? 200 : 201 });
}

// HEAD — badge non-lus (messages reçus par ce manager)
export async function HEAD() {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!session || user?.role !== "MANAGER" || !user?.id)
    return new NextResponse(null, { status: 401 });

  const unread = await sbGet<{ id: string }>(
    "Message",
    `receiverId=eq.${enc(user.id)}&isRead=eq.false&deletedByReceiver=eq.false&select=id`
  );
  return new NextResponse(null, { status: 200, headers: { "X-Unread-Count": String(unread.length) } });
}
