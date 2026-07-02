import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sbPost } from "@/lib/supabase-admin";

/**
 * Soumission d'un commentaire par un utilisateur connecté.
 * Le commentaire est créé en statut PENDING : il n'apparaît publiquement
 * qu'après validation par un administrateur ou un gérant.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as { id?: string; name?: string } | undefined;
  if (!session || !user?.id) {
    return NextResponse.json(
      { error: "Vous devez être connecté pour laisser un commentaire." },
      { status: 401 }
    );
  }

  const { content, rating, authorRole } = await req.json();
  if (!content?.trim()) {
    return NextResponse.json({ error: "Le commentaire ne peut pas être vide." }, { status: 400 });
  }

  const r = rating ? Number(rating) : null;
  if (r !== null && (isNaN(r) || r < 1 || r > 5)) {
    return NextResponse.json({ error: "Note invalide." }, { status: 400 });
  }

  const created = await sbPost("Comment", {
    id: crypto.randomUUID(),
    userId: user.id,
    authorName: user.name || "Client",
    authorRole: authorRole?.trim() || null,
    rating: r,
    content: content.trim().slice(0, 1000),
    status: "PENDING",
    createdAt: new Date().toISOString(),
  });

  if (!created) return NextResponse.json({ error: "Erreur lors de l'envoi." }, { status: 500 });
  return NextResponse.json({ success: true }, { status: 201 });
}
