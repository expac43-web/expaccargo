import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sbDelete } from "@/lib/supabase-admin";
import { deleteFile, urlToPath } from "@/lib/supabase-storage";
import { getDocForDelete, canUserDeleteDoc } from "@/lib/doc-perms";

function isStaff(role?: string) {
  return ["SUPER_ADMIN", "MANAGER", "AGENCY"].includes(role ?? "");
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!session || !isStaff(user?.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const doc = await getDocForDelete(id);
  if (!doc) return NextResponse.json({ error: "Document introuvable" }, { status: 404 });

  if (!(await canUserDeleteDoc({ id: user?.id, role: user?.role }, doc))) {
    return NextResponse.json({ error: "Suppression non autorisée pour ce document." }, { status: 403 });
  }

  const path = urlToPath(doc.url);
  await deleteFile(path);
  await sbDelete("Document", `id=eq.${id}`);

  return NextResponse.json({ success: true });
}
