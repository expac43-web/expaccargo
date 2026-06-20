import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sbGet, sbPatch, sbDelete } from "@/lib/supabase-admin";

function isAdmin(role?: string) {
  return role === "SUPER_ADMIN" || role === "MANAGER";
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || !isAdmin(role)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const [agency] = await sbGet("Agency", `id=eq.${id}&select=*`);
  if (!agency) return NextResponse.json({ error: "Agence introuvable" }, { status: 404 });

  const users = await sbGet("User", `agencyId=eq.${id}&select=id,name,email,role,phone,isActive,createdAt&order=name.asc`);
  return NextResponse.json({ ...agency, users });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || !isAdmin(role)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const { name, city, country, phone, email } = await req.json();
  if (!name?.trim() || !city?.trim() || !country?.trim()) {
    return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 });
  }

  const updated = await sbPatch("Agency", `id=eq.${id}`, {
    name: name.trim(), city: city.trim(), country: country.trim(),
    phone: phone?.trim() || null, email: email?.trim() || null,
  });

  if (!updated) return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 });
  return NextResponse.json(updated);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || role !== "SUPER_ADMIN") return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const ok = await sbDelete("Agency", `id=eq.${id}`);
  if (!ok) return NextResponse.json({ error: "Erreur lors de la suppression" }, { status: 500 });
  return NextResponse.json({ success: true });
}
