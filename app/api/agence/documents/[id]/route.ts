import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sbDelete } from "@/lib/supabase-admin";
import { deleteFile, urlToPath } from "@/lib/supabase-storage";
import { getDocForDelete, canUserDeleteDoc } from "@/lib/doc-perms";

function isAgency(role?: string) {
  return role === "AGENCY" || role === "MANAGER" || role === "SUPER_ADMIN";
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  const userId = (session?.user as { id?: string })?.id;
  if (!session || !isAgency(role) || !userId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const doc = await getDocForDelete(id);
  if (!doc) return NextResponse.json({ error: "Document introuvable" }, { status: 404 });

  if (!(await canUserDeleteDoc({ id: userId, role }, doc))) {
    return NextResponse.json({ error: "Vous ne pouvez supprimer que vos propres dépôts." }, { status: 403 });
  }

  try { await deleteFile(urlToPath(doc.url)); } catch { /* ignore storage error */ }
  await sbDelete("Document", `id=eq.${id}`);
  return NextResponse.json({ success: true });
}
