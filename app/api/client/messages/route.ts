import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sbGet, sbPost, sbPatch } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!session || user?.role !== "CLIENT" || !user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const shipmentId = searchParams.get("shipmentId");

  // Fetch all messages where the client is sender or receiver
  let qs = `or=(senderId.eq.${user.id},receiverId.eq.${user.id})&select=id,content,senderId,receiverId,shipmentId,isRead,createdAt&order=createdAt.asc`;
  if (shipmentId) {
    qs = `shipmentId=eq.${shipmentId}&or=(senderId.eq.${user.id},receiverId.eq.${user.id})&select=id,content,senderId,receiverId,shipmentId,isRead,createdAt&order=createdAt.asc`;
  }

  const messages = await sbGet("Message", qs);

  // Mark unread received messages as read
  const unreadIds = (messages as { id: string; receiverId: string; isRead: boolean }[])
    .filter((m) => m.receiverId === user.id && !m.isRead)
    .map((m) => m.id);

  if (unreadIds.length > 0) {
    // Mark each as read via PATCH with IN filter
    await sbPatch("Message", `id=in.(${unreadIds.join(",")})`, { isRead: true });
  }

  return NextResponse.json(messages);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!session || user?.role !== "CLIENT" || !user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { content, shipmentId, receiverId } = await req.json();

  if (!content?.trim()) {
    return NextResponse.json({ error: "Le message ne peut pas être vide" }, { status: 400 });
  }

  // Find who to send to: the agency assigned to the shipment,
  // or fall back to any MANAGER
  let targetReceiverId = receiverId;

  if (!targetReceiverId && shipmentId) {
    // Get shipment's agencyId, find the agency's users (MANAGER or AGENCY role)
    const [shipment] = await sbGet<{ agencyId: string | null }>(
      "Shipment",
      `id=eq.${shipmentId}&select=agencyId`
    );

    if (shipment?.agencyId) {
      const agencyUsers = await sbGet<{ id: string }>(
        "User",
        `agencyId=eq.${shipment.agencyId}&role=in.(MANAGER,AGENCY)&isActive=eq.true&select=id&limit=1`
      );
      targetReceiverId = agencyUsers[0]?.id;
    }
  }

  // Fallback: first SUPER_ADMIN or MANAGER
  if (!targetReceiverId) {
    const admins = await sbGet<{ id: string }>(
      "User",
      `role=in.(SUPER_ADMIN,MANAGER)&isActive=eq.true&select=id&limit=1`
    );
    targetReceiverId = admins[0]?.id;
  }

  if (!targetReceiverId) {
    return NextResponse.json({ error: "Aucun destinataire disponible" }, { status: 400 });
  }

  const id = crypto.randomUUID();
  const msg = await sbPost("Message", {
    id,
    content: content.trim(),
    senderId: user.id,
    receiverId: targetReceiverId,
    shipmentId: shipmentId || null,
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  if (!msg) return NextResponse.json({ error: "Erreur lors de l'envoi" }, { status: 500 });
  return NextResponse.json(msg, { status: 201 });
}

// GET unread count for notification badge
export async function HEAD(req: NextRequest) {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!session || !user?.id) {
    return new NextResponse(null, { status: 401 });
  }

  const messages = await sbGet<{ id: string }>(
    "Message",
    `receiverId=eq.${user.id}&isRead=eq.false&select=id`
  );

  return new NextResponse(null, {
    status: 200,
    headers: { "X-Unread-Count": String(messages.length) },
  });
}
