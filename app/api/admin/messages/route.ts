import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sbGet, sbPost, sbPatch } from "@/lib/supabase-admin";

function isStaff(role?: string) {
  return ["SUPER_ADMIN", "MANAGER", "AGENCY"].includes(role ?? "");
}

export async function GET(req: NextRequest) {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!session || !isStaff(user?.role) || !user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const shipmentId = searchParams.get("shipmentId");
  const clientId = searchParams.get("clientId");

  let qs = `select=id,content,senderId,receiverId,shipmentId,isRead,createdAt&order=createdAt.asc`;

  if (shipmentId) {
    qs = `shipmentId=eq.${shipmentId}&${qs}`;
  } else if (clientId) {
    qs = `or=(senderId.eq.${clientId},receiverId.eq.${clientId})&${qs}`;
  } else {
    // All messages involving this staff member
    qs = `or=(senderId.eq.${user.id},receiverId.eq.${user.id})&${qs}`;
  }

  const messages = await sbGet("Message", qs);

  // Mark messages sent to this staff as read
  const unreadIds = (messages as { id: string; receiverId: string; isRead: boolean }[])
    .filter((m) => m.receiverId === user.id && !m.isRead)
    .map((m) => m.id);

  if (unreadIds.length > 0) {
    await sbPatch("Message", `id=in.(${unreadIds.join(",")})`, { isRead: true });
  }

  return NextResponse.json(messages);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!session || !isStaff(user?.role) || !user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { content, shipmentId, receiverId } = await req.json();

  if (!content?.trim() || !receiverId) {
    return NextResponse.json({ error: "Message et destinataire requis" }, { status: 400 });
  }

  const id = crypto.randomUUID();
  const msg = await sbPost("Message", {
    id,
    content: content.trim(),
    senderId: user.id,
    receiverId,
    shipmentId: shipmentId || null,
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  if (!msg) return NextResponse.json({ error: "Erreur lors de l'envoi" }, { status: 500 });
  return NextResponse.json(msg, { status: 201 });
}
