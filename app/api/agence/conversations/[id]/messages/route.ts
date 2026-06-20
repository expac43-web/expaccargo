import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sbGet, sbPost, sbPatch, enc, encList, isUuid } from "@/lib/supabase-admin";
import { notifyNewMessage } from "@/lib/notify";

type Msg = {
  id: string; content: string; senderId: string; receiverId: string;
  conversationId: string; isRead: boolean; deletedBySender: boolean;
  deletedByReceiver: boolean; sentAsManager: boolean; createdAt: string;
};

// Taille de page par défaut / maximale pour la pagination des messages
const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 100;

// GET — messages paginés par curseur. Query: ?limit=30&before=<ISO> → { messages: [asc], hasMore }
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const user = session?.user as { id?: string; role?: string; agencyId?: string } | undefined;
  if (!session || user?.role !== "AGENCY" || !user?.id || !user?.agencyId)
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!isUuid(id)) return NextResponse.json({ error: "Conversation introuvable" }, { status: 404 });

  // Vérifier que la conv appartient à l'agence
  const [conv] = await sbGet<{ id: string; agencyId: string | null }>(
    "Conversation", `id=eq.${enc(id)}&agencyId=eq.${enc(user.agencyId)}&type=eq.CLIENT_AGENCY&select=id,agencyId&limit=1`
  );
  if (!conv) return NextResponse.json({ error: "Conversation introuvable" }, { status: 404 });

  const sp = req.nextUrl.searchParams;
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(sp.get("limit") ?? "", 10) || DEFAULT_LIMIT));
  const before = sp.get("before");

  const me = enc(user.id);
  const delFilter = `or=(and(senderId.eq.${me},deletedBySender.eq.false),and(receiverId.eq.${me},deletedByReceiver.eq.false))`;
  const cursor = before ? `&createdAt=lt.${enc(before)}` : "";

  const rows = await sbGet<Msg>(
    "Message",
    `conversationId=eq.${enc(id)}&${delFilter}${cursor}&select=id,content,senderId,receiverId,isRead,deletedBySender,deletedByReceiver,sentAsManager,createdAt&order=createdAt.desc&limit=${limit}`
  );

  const hasMore = rows.length === limit;
  const messages = rows.slice().reverse();

  // Marquer comme lus
  const unreadIds = messages.filter((m) => m.receiverId === user.id && !m.isRead).map((m) => m.id);
  if (unreadIds.length > 0) {
    await sbPatch("Message", `id=in.(${encList(unreadIds)})`, { isRead: true });
    await sbPatch("Conversation", `id=eq.${enc(id)}`, { updatedAt: new Date().toISOString() });
  }

  return NextResponse.json({ messages, hasMore });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const user = session?.user as { id?: string; role?: string; agencyId?: string } | undefined;
  if (!session || user?.role !== "AGENCY" || !user?.id || !user?.agencyId)
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!isUuid(id)) return NextResponse.json({ error: "Conversation introuvable" }, { status: 404 });

  const [conv] = await sbGet<{ id: string; clientId: string; agencyId: string | null }>(
    "Conversation", `id=eq.${enc(id)}&agencyId=eq.${enc(user.agencyId)}&type=eq.CLIENT_AGENCY&select=id,clientId,agencyId&limit=1`
  );
  if (!conv) return NextResponse.json({ error: "Conversation introuvable" }, { status: 404 });

  const { content } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "Message vide" }, { status: 400 });
  if (content.trim().length > 5000) return NextResponse.json({ error: "Message trop long" }, { status: 400 });

  const now = new Date().toISOString();
  const msg = await sbPost<Msg>("Message", {
    id: crypto.randomUUID(),
    content: content.trim(),
    senderId: user.id,
    receiverId: conv.clientId,
    conversationId: id,
    isRead: false,
    deletedBySender: false,
    deletedByReceiver: false,
    sentAsManager: false,
    createdAt: now,
  });
  if (!msg) return NextResponse.json({ error: "Erreur envoi" }, { status: 500 });

  await sbPatch("Conversation", `id=eq.${enc(id)}`, { updatedAt: now, deletedByClient: false });
  await notifyNewMessage(conv.clientId, content.trim());
  return NextResponse.json(msg, { status: 201 });
}
