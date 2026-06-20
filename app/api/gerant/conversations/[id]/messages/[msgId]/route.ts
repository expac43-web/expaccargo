import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sbGet, sbPatch, sbDelete, enc, isUuid } from "@/lib/supabase-admin";

type Msg = {
  id: string; senderId: string; receiverId: string; isRead: boolean;
  deletedBySender: boolean; deletedByReceiver: boolean;
};

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; msgId: string }> }
) {
  const { id, msgId } = await params;
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!session || user?.role !== "MANAGER" || !user?.id)
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!isUuid(id) || !isUuid(msgId))
    return NextResponse.json({ error: "Message introuvable" }, { status: 404 });

  const [conv] = await sbGet<{ id: string }>("Conversation", `id=eq.${enc(id)}&select=id&limit=1`);
  if (!conv) return NextResponse.json({ error: "Conversation introuvable" }, { status: 404 });

  const [msg] = await sbGet<Msg>(
    "Message", `id=eq.${enc(msgId)}&conversationId=eq.${enc(id)}&select=id,senderId,receiverId,isRead,deletedBySender,deletedByReceiver&limit=1`
  );
  if (!msg) return NextResponse.json({ error: "Message introuvable" }, { status: 404 });

  const isSender = msg.senderId === user.id;
  const isReceiver = msg.receiverId === user.id;
  if (!isSender && !isReceiver) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  if (!msg.isRead && isSender) {
    await sbDelete("Message", `id=eq.${enc(msgId)}`);
    return NextResponse.json({ deleted: "both" });
  }

  const update: Record<string, boolean> = {};
  if (isSender) update.deletedBySender = true;
  if (isReceiver) update.deletedByReceiver = true;
  await sbPatch("Message", `id=eq.${enc(msgId)}`, update);

  const newDs = update.deletedBySender ?? msg.deletedBySender;
  const newDr = update.deletedByReceiver ?? msg.deletedByReceiver;
  if (newDs && newDr) {
    await sbDelete("Message", `id=eq.${enc(msgId)}`);
    return NextResponse.json({ deleted: "both" });
  }
  return NextResponse.json({ deleted: isSender ? "sender" : "receiver" });
}
