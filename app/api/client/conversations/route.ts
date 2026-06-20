import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sbGet, sbPost, sbPatch, enc, encList, isUuid } from "@/lib/supabase-admin";

type Conv = {
  id: string; type: string; agencyId: string | null; createdAt: string; updatedAt: string;
  agency: { id: string; name: string; city: string } | null;
};
type Msg = { id: string; conversationId: string; isRead: boolean; receiverId: string; content: string; createdAt: string };

// GET — liste des conversations du client + dernier message + non-lus
export async function GET() {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!session || user?.role !== "CLIENT" || !user?.id)
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const convs = await sbGet<Conv>(
    "Conversation",
    `clientId=eq.${enc(user.id)}&deletedByClient=eq.false&select=id,type,agencyId,createdAt,updatedAt,agency:Agency(id,name,city)&order=updatedAt.desc`
  );

  // Récupère tous les messages des conversations de ce client
  if (convs.length === 0) return NextResponse.json([]);
  const ids = encList(convs.map((c) => c.id));
  const messages = await sbGet<Msg>(
    "Message",
    `conversationId=in.(${ids})&deletedByReceiver=eq.false&select=id,conversationId,isRead,receiverId,content,createdAt&order=createdAt.asc`
  );

  const result = convs.map((conv) => {
    const msgs = messages.filter((m) => m.conversationId === conv.id);
    const unread = msgs.filter((m) => m.receiverId === user.id && !m.isRead).length;
    const last = msgs[msgs.length - 1] ?? null;
    return { ...conv, unreadCount: unread, lastMessage: last?.content ?? null, lastDate: last?.createdAt ?? conv.createdAt };
  });

  return NextResponse.json(result);
}

// POST — démarrer une nouvelle conversation avec une agence
export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!session || user?.role !== "CLIENT" || !user?.id)
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { agencyId, firstMessage } = await req.json();
  if (!isUuid(agencyId)) return NextResponse.json({ error: "agencyId invalide" }, { status: 400 });

  const now = new Date().toISOString();

  // Réutiliser la conversation existante si elle existe (même supprimée par le client).
  const existing = await sbGet<{ id: string }>(
    "Conversation",
    `clientId=eq.${enc(user.id)}&agencyId=eq.${enc(agencyId)}&type=eq.CLIENT_AGENCY&select=id&limit=1`
  );

  let convId: string;
  let exists = false;
  if (existing[0]) {
    convId = existing[0].id;
    exists = true;
    // Si le client l'avait supprimée, elle réapparaît.
    await sbPatch("Conversation", `id=eq.${enc(convId)}`, { deletedByClient: false });
  } else {
    const conv = await sbPost<{ id: string }>("Conversation", {
      id: crypto.randomUUID(),
      type: "CLIENT_AGENCY",
      clientId: user.id,
      agencyId,
      deletedByClient: false,
      deletedByStaff: false,
      createdAt: now,
      updatedAt: now,
    });
    if (!conv) return NextResponse.json({ error: "Erreur création conversation" }, { status: 500 });
    convId = conv.id;
  }

  // Envoyer le premier message (nouvelle conversation OU existante).
  if (firstMessage?.trim()) {
    const agencyUsers = await sbGet<{ id: string }>(
      "User",
      `agencyId=eq.${enc(agencyId)}&role=in.(AGENCY,MANAGER)&isActive=eq.true&select=id&limit=1`
    );
    let receiverId = agencyUsers[0]?.id;
    if (!receiverId) {
      const managers = await sbGet<{ id: string }>("User", `role=in.(SUPER_ADMIN,MANAGER)&isActive=eq.true&select=id&limit=1`);
      receiverId = managers[0]?.id;
    }
    if (receiverId) {
      await sbPost("Message", {
        id: crypto.randomUUID(),
        content: firstMessage.trim(),
        senderId: user.id,
        receiverId,
        conversationId: convId,
        isRead: false,
        deletedBySender: false,
        deletedByReceiver: false,
        sentAsManager: false,
        createdAt: now,
      });
      // Le message ré-affiche la conversation côté staff (destinataire).
      await sbPatch("Conversation", `id=eq.${enc(convId)}`, { updatedAt: now, deletedByStaff: false });
    }
  }

  return NextResponse.json({ id: convId, exists }, { status: exists ? 200 : 201 });
}

// HEAD — badge non-lus
export async function HEAD() {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!session || !user?.id) return new NextResponse(null, { status: 401 });

  const unread = await sbGet<{ id: string }>(
    "Message",
    `receiverId=eq.${enc(user.id)}&isRead=eq.false&deletedByReceiver=eq.false&select=id`
  );
  return new NextResponse(null, { status: 200, headers: { "X-Unread-Count": String(unread.length) } });
}
