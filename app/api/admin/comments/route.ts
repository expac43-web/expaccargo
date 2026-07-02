import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sbGet, sbPost } from "@/lib/supabase-admin";

function isStaff(role?: string) {
  return role === "SUPER_ADMIN" || role === "MANAGER";
}

/** Liste de tous les commentaires (tous statuts) — admin + gérant uniquement. */
export async function GET() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || !isStaff(role)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const comments = await sbGet("Comment", "select=*&order=createdAt.desc");
  return NextResponse.json(comments);
}

/** Création directe d'un commentaire par un admin/gérant (publié immédiatement). */
export async function POST(req: NextRequest) {
  const session = await auth();
  const u = session?.user as { id?: string; role?: string } | undefined;
  if (!session || !isStaff(u?.role)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { authorName, authorRole, content, rating } = await req.json();
  if (!authorName?.trim() || !content?.trim()) {
    return NextResponse.json({ error: "Nom et commentaire obligatoires." }, { status: 400 });
  }

  const r = rating ? Number(rating) : null;
  const now = new Date().toISOString();
  const created = await sbPost("Comment", {
    id: crypto.randomUUID(),
    userId: null,
    authorName: authorName.trim(),
    authorRole: authorRole?.trim() || null,
    rating: r && r >= 1 && r <= 5 ? r : null,
    content: content.trim().slice(0, 1000),
    status: "APPROVED",
    createdAt: now,
    moderatedById: u!.id ?? null,
    moderatedAt: now,
  });

  if (!created) return NextResponse.json({ error: "Erreur lors de la création." }, { status: 500 });
  return NextResponse.json(created, { status: 201 });
}
