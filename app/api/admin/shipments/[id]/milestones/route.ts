import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sbGet, sbDelete } from "@/lib/supabase-admin";
import { addMilestone } from "@/lib/milestones";

function isAdmin(role?: string) {
  return ["SUPER_ADMIN", "MANAGER", "AGENCY"].includes(role ?? "");
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || !isAdmin(role)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const milestones = await sbGet("Milestone", `shipmentId=eq.${id}&select=*&order=occurredAt.desc`);
  return NextResponse.json(milestones);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const su = session?.user as { id?: string; name?: string; role?: string } | undefined;
  if (!session || !isAdmin(su?.role)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id: shipmentId } = await params;
  const { label, location, status, occurredAt, note } = await req.json();
  if (!label?.trim() || !status) {
    return NextResponse.json({ error: "Label et statut obligatoires" }, { status: 400 });
  }

  const milestone = await addMilestone({
    shipmentId, label, status, location, note, occurredAt,
    by: { id: su?.id, name: su?.name, role: su?.role },
  });
  if (!milestone) return NextResponse.json({ error: "Erreur lors de la création" }, { status: 500 });

  return NextResponse.json(milestone, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || !isAdmin(role)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const milestoneId = searchParams.get("milestoneId");
  if (!milestoneId) return NextResponse.json({ error: "milestoneId requis" }, { status: 400 });

  const ok = await sbDelete("Milestone", `id=eq.${milestoneId}`);
  if (!ok) return NextResponse.json({ error: "Erreur lors de la suppression" }, { status: 500 });
  return NextResponse.json({ success: true });
}
