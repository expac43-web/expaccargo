import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sbPatch, sbDelete } from "@/lib/supabase-admin";

function isStaff(role?: string) {
  return ["SUPER_ADMIN", "MANAGER", "AGENCY"].includes(role ?? "");
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || !isStaff(role)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const { title, excerpt, content, category, lang, published, slug } = await req.json();

  if (!title?.trim() || !excerpt?.trim() || !content?.trim() || !category?.trim()) {
    return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 });
  }

  const updated = await sbPatch("Post", `id=eq.${id}`, {
    title: title.trim(), excerpt: excerpt.trim(),
    content: content.trim(), category: category.trim(),
    ...(slug ? { slug } : {}),
    ...(lang ? { lang } : {}),
    ...(published !== undefined ? { published } : {}),
  });

  if (!updated) return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 });
  return NextResponse.json(updated);
}

// Toggle published only
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || !isStaff(role)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const { published } = await req.json();
  const ok = await sbPatch("Post", `id=eq.${id}`, { published });
  if (!ok) return NextResponse.json({ error: "Erreur" }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || !isStaff(role)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const ok = await sbDelete("Post", `id=eq.${id}`);
  if (!ok) return NextResponse.json({ error: "Erreur lors de la suppression" }, { status: 500 });
  return NextResponse.json({ success: true });
}
