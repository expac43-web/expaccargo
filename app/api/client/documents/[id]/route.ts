import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sbGet, sbDelete } from "@/lib/supabase-admin";
import { deleteFile, urlToPath } from "@/lib/supabase-storage";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!session || user?.role !== "CLIENT" || !user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;

  // Le client ne supprime que ses propres dépôts (uploaderId), pas ceux déposés par le staff.
  const [doc] = await sbGet<{ id: string; url: string; uploadedById: string; uploaderId: string | null }>(
    "Document",
    `id=eq.${id}&select=id,url,uploadedById,uploaderId`
  );
  if (!doc || doc.uploadedById !== user.id) {
    return NextResponse.json({ error: "Document introuvable" }, { status: 404 });
  }
  if (doc.uploaderId !== user.id) {
    return NextResponse.json({ error: "Vous ne pouvez supprimer que vos propres documents." }, { status: 403 });
  }

  // Delete from storage
  const path = urlToPath(doc.url);
  await deleteFile(path);

  // Delete from DB
  await sbDelete("Document", `id=eq.${id}`);
  return NextResponse.json({ success: true });
}
