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

  const agencies = await sbGet<{
    id: string; name: string; city: string; country: string;
    phone: string | null; email: string | null; createdAt: string;
  }>("Agency", "select=*&order=name.asc");

  // Fetch user counts per agency
  const users = await sbGet<{ agencyId: string }>("User", "select=agencyId&agencyId=not.is.null");
  const counts: Record<string, number> = {};
  for (const u of users) if (u.agencyId) counts[u.agencyId] = (counts[u.agencyId] ?? 0) + 1;

  return NextResponse.json(agencies.map((a) => ({ ...a, userCount: counts[a.id] ?? 0 })));
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || !isAdmin(role)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { name, city, country, phone, email } = await req.json();
  if (!name?.trim() || !city?.trim() || !country?.trim()) {
    return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 });
  }

  const id = crypto.randomUUID();
  const agency = await sbPost("Agency", {
    id, name: name.trim(), city: city.trim(), country: country.trim(),
    phone: phone?.trim() || null, email: email?.trim() || null,
    createdAt: new Date().toISOString(),
  });

  if (!agency) return NextResponse.json({ error: "Erreur lors de la création" }, { status: 500 });
  return NextResponse.json(agency, { status: 201 });
}
