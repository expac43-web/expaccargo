import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sbGet, sbPost } from "@/lib/supabase-admin";

function isAdmin(role?: string) {
  return role === "SUPER_ADMIN" || role === "MANAGER";
}

export async function GET() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || !isAdmin(role)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const partners = await sbGet("Partner", `select=*&order=order.asc`);
  return NextResponse.json(partners);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || !isAdmin(role)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { name, logoUrl, website, isActive, order } = await req.json();

  if (!name?.trim() || !logoUrl?.trim()) {
    return NextResponse.json({ error: "Nom et URL du logo obligatoires" }, { status: 400 });
  }

  const id = crypto.randomUUID();
  const partner = await sbPost("Partner", {
    id, name: name.trim(), logoUrl: logoUrl.trim(),
    website: website?.trim() || null,
    isActive: isActive ?? true,
    order: order ?? 0,
    createdAt: new Date().toISOString(),
  });

  if (!partner) return NextResponse.json({ error: "Erreur lors de la création" }, { status: 500 });
  return NextResponse.json(partner, { status: 201 });
}
