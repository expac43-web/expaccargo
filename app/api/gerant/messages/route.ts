import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sbGet, sbPost, sbPatch } from "@/lib/supabase-admin";

function isGerant(role?: string) {
  return role === "MANAGER" || role === "SUPER_ADMIN";
}

export async function GET(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  const userId = (session?.user as { id?: string })?.id;
  if (!session || !isGerant(role) || !userId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");

  let query = clientId
    ? `or=(and(senderId.eq.${userId},receiverId.eq.${clientId}),and(senderId.eq.${clientId},receiverId.eq.${userId}))&select=*&order=createdAt.asc`
    : `or=(senderId.eq.${userId},receiverId.eq.${userId})&select=*&order=createdAt.asc`;

  const messages = await sbGet<{
    id: string; senderId: string; receiverId: string; content: string;
    isRead: boolean; shipmentId: string | null; createdAt: string;
  }>("Message", query);

  // Marquer les messages reçus comme lus
  const unreadIds = messages.filter((m) => m.receiverId === userId && !m.isRead).map((m) => m.id);
  if (unreadIds.length > 0) {
    await sbPatch("Message", `id=in.(${unreadIds.join(",")})`, { isRead: true });
  }

  return NextResponse.json(messages);
}

export async function HEAD(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  const userId = (session?.user as { id?: string })?.id;
  if (!session || !isGerant(role) || !userId) return new NextResponse(null, { status: 401 });

  const unread = await sbGet<{ id: string }>(
    "Message", `receiverId=eq.${userId}&isRead=eq.false&select=id`
  );
  return new NextResponse(null, {
    status: 200,
    headers: { "X-Unread-Count": String(unread.length) },
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  const userId = (session?.user as { id?: string })?.id;
  if (!session || !isGerant(role) || !userId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { receiverId, content } = await req.json();
  if (!receiverId?.trim() || !content?.trim()) {
    return NextResponse.json({ error: "Destinataire et contenu requis." }, { status: 400 });
  }

  const now = new Date().toISOString();
  const msg = await sbPost("Message", {
    id: crypto.randomUUID(),
    senderId: userId,
    receiverId,
    content: content.trim(),
    isRead: false,
    shipmentId: null,
    createdAt: now,
    updatedAt: now,
  });

  if (!msg) return NextResponse.json({ error: "Erreur envoi." }, { status: 500 });
  return NextResponse.json(msg, { status: 201 });
}
