import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isUuid } from "@/lib/supabase-admin";
import { getClientBundle } from "@/lib/client-detail";

function isGerant(role?: string) {
  return role === "MANAGER" || role === "SUPER_ADMIN";
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || !isGerant(role)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!isUuid(id)) return NextResponse.json({ error: "Client introuvable" }, { status: 404 });

  const bundle = await getClientBundle(id);
  if (!bundle) return NextResponse.json({ error: "Client introuvable" }, { status: 404 });

  return NextResponse.json(bundle);
}
