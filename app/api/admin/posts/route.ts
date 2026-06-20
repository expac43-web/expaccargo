import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sbGet, sbPost } from "@/lib/supabase-admin";

function isStaff(role?: string) {
  return ["SUPER_ADMIN", "MANAGER", "AGENCY"].includes(role ?? "");
}

function slugify(str: string): string {
  return str.toLowerCase()
    .normalize("NFD").replace(/\p{Mn}/gu, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim().replace(/\s+/g, "-").replace(/-+/g, "-");
}

export async function GET() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || !isStaff(role)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const posts = await sbGet("Post", "select=*&order=createdAt.desc");
  return NextResponse.json(posts);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || !isStaff(role)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { title, excerpt, content, category, lang, published, slug: customSlug } = await req.json();

  if (!title?.trim() || !excerpt?.trim() || !content?.trim() || !category?.trim()) {
    return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 });
  }

  const slug = customSlug?.trim() || slugify(title);

  // Check slug uniqueness
  const existing = await sbGet("Post", `slug=eq.${encodeURIComponent(slug)}&select=id`);
  if (existing.length > 0) {
    return NextResponse.json({ error: "Ce slug est déjà utilisé, modifiez le titre ou le slug" }, { status: 409 });
  }

  const id = crypto.randomUUID();
  const post = await sbPost("Post", {
    id, title: title.trim(), slug, excerpt: excerpt.trim(),
    content: content.trim(), category: category.trim(),
    lang: lang || "fr", published: published ?? false,
    createdAt: new Date().toISOString(),
  });

  if (!post) return NextResponse.json({ error: "Erreur lors de la création" }, { status: 500 });
  return NextResponse.json(post, { status: 201 });
}
