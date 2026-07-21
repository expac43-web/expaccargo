import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sbGet, enc } from "@/lib/supabase-admin";

function isStaff(role?: string) {
  return ["SUPER_ADMIN", "MANAGER", "AGENCY"].includes(role ?? "");
}

/**
 * Documents internes du membre de l'équipe connecté.
 * Un « document interne » = un Document dont le propriétaire (uploadedById)
 * est ce membre. Déposés par l'admin via /api/admin/documents (clientId = agent).
 * Portée volontairement limitée à la session : un agent ne voit que SES documents.
 */
export async function GET() {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!session || !isStaff(user?.role) || !user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const docs = await sbGet(
    "Document",
    `uploadedById=eq.${enc(user.id)}&select=id,name,type,url,createdAt&order=createdAt.desc`
  );
  return NextResponse.json(docs);
}
