import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sbGet, sbPatch, sbDelete, enc, isUuid } from "@/lib/supabase-admin";

// Suppression d'une conversation côté GÉRANT (staff). Purge complète si le client a aussi supprimé.
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!session || user?.role !== "MANAGER" || !user?.id)
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!isUuid(id)) return NextResponse.json({ error: "Conversation introuvable" }, { status: 404 });

  const [conv] = await sbGet<{ id: string; deletedByClient: boolean }>(
    "Conversation", `id=eq.${enc(id)}&select=id,deletedByClient&limit=1`
  );
  if (!conv) return NextResponse.json({ error: "Conversation introuvable" }, { status: 404 });

  if (conv.deletedByClient) {
    await sbDelete("Message", `conversationId=eq.${enc(id)}`);
    await sbDelete("Conversation", `id=eq.${enc(id)}`);
    return NextResponse.json({ deleted: "both" });
  }

  await sbPatch("Conversation", `id=eq.${enc(id)}`, { deletedByStaff: true });
  return NextResponse.json({ deleted: "staff" });
}
