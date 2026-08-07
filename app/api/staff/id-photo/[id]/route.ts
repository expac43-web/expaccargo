import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sbGet, enc } from "@/lib/supabase-admin";
import { downloadFile } from "@/lib/supabase-storage";

/**
 * Sert la pièce d'identité d'un membre du staff depuis le bucket privé.
 * Accès : le propriétaire du compte OU un admin / gérant (SUPER_ADMIN, MANAGER).
 * `[id]` = identifiant de l'utilisateur ciblé.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const me = session?.user as { id?: string; role?: string } | undefined;
  if (!session || !me?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  if (!id || /[(),&=]/.test(id)) {
    return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 });
  }

  const isAdmin = me.role === "SUPER_ADMIN" || me.role === "MANAGER";
  if (me.id !== id && !isAdmin) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const [user] = await sbGet<{ idPhotoUrl: string | null }>(
    "User", `id=eq.${enc(id)}&select=idPhotoUrl&limit=1`
  );
  if (!user?.idPhotoUrl) return NextResponse.json({ error: "Aucune pièce d'identité" }, { status: 404 });

  const fileData = await downloadFile(user.idPhotoUrl);
  if (!fileData) return NextResponse.json({ error: "Fichier indisponible" }, { status: 502 });

  return new NextResponse(new Uint8Array(fileData.buffer), {
    status: 200,
    headers: {
      "Content-Type": fileData.contentType,
      "Content-Disposition": "inline",
      "Cache-Control": "private, max-age=0, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
