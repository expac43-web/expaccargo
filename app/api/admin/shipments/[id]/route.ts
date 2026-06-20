import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sbGet, sbPatch, sbDelete } from "@/lib/supabase-admin";
import { logShipmentAudit, statusFr, fieldFr } from "@/lib/audit";

function isAdmin(role?: string) {
  return ["SUPER_ADMIN", "MANAGER", "AGENCY"].includes(role ?? "");
}

type AuditRow = { id: string; action: string; detail: string | null; byName: string | null; byRole: string | null; createdAt: string };

// Historique des modifications — réservé à l'admin et au gérant.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || !["SUPER_ADMIN", "MANAGER"].includes(role ?? "")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { id } = await params;
  const rows = await sbGet<AuditRow>(
    "ShipmentAudit",
    `shipmentId=eq.${id}&select=id,action,detail,byName,byRole,createdAt&order=createdAt.desc`
  );
  return NextResponse.json(rows);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const su = session?.user as { id?: string; name?: string; role?: string } | undefined;
  const role = su?.role;
  if (!session || !isAdmin(role)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const allowed = [
    "reference", "trackingNumber", "status", "serviceType",
    "origin", "destination", "weight", "volume", "description",
    "eta", "clientId", "agencyId", "deliveredAt",
  ];
  const update: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  for (const key of allowed) {
    if (key in body) {
      if (key === "weight" || key === "volume") {
        update[key] = body[key] ? Number(body[key]) : null;
      } else {
        update[key] = body[key] ?? null;
      }
    }
  }

  // Auto-set deliveredAt when status changes to DELIVERED
  if (body.status === "DELIVERED" && !body.deliveredAt) {
    update.deliveredAt = new Date().toISOString();
  }

  const result = await sbPatch("Shipment", `id=eq.${id}`, update);
  if (!result) return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 });

  // Historique : qui a modifié quoi.
  const parts: string[] = [];
  if ("status" in body) parts.push(`Statut → ${statusFr(body.status)}`);
  const others = allowed.filter((k) => k !== "status" && k in body).map(fieldFr);
  if (others.length) parts.push(`Modifié : ${others.join(", ")}`);
  await logShipmentAudit({
    shipmentId: id,
    action: "update",
    detail: parts.join(" · ") || "Mise à jour",
    by: { id: su?.id, name: su?.name, role: su?.role },
  });

  return NextResponse.json(result);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || !isAdmin(role)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;

  // Delete milestones first (foreign key)
  await sbDelete("Milestone", `shipmentId=eq.${id}`);

  const ok = await sbDelete("Shipment", `id=eq.${id}`);
  if (!ok) return NextResponse.json({ error: "Erreur lors de la suppression" }, { status: 500 });
  return NextResponse.json({ success: true });
}
