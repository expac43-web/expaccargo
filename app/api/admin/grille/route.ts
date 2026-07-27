import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sbGet, sbPatch, sbPost } from "@/lib/supabase-admin";
import { mergeGrille, type GrilleConfig } from "@/lib/grille";

// Édition de la grille tarifaire — admin (SUPER_ADMIN) et gérant (MANAGER) uniquement.
function canManage(role?: string) {
  return role === "SUPER_ADMIN" || role === "MANAGER";
}

export async function GET() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || !canManage(role)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const [row] = await sbGet<{ data: Partial<GrilleConfig> }>(
    "GrilleConfig",
    "id=eq.default&select=data&limit=1"
  );
  return NextResponse.json(mergeGrille(row?.data ?? null));
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  const su = session?.user as { id?: string; name?: string; role?: string } | undefined;
  if (!session || !canManage(su?.role)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Données invalides." }, { status: 400 });

  // On persiste la config complète (fusionnée sur les défauts pour ne rien perdre).
  const merged = mergeGrille(body as Partial<GrilleConfig>);
  const meta = { data: merged, updatedAt: new Date().toISOString(), updatedBy: su?.name || su?.id || "admin" };

  const updated = await sbPatch<{ id: string }>("GrilleConfig", "id=eq.default", meta);
  if (!updated) await sbPost("GrilleConfig", { id: "default", ...meta });

  return NextResponse.json(merged);
}
