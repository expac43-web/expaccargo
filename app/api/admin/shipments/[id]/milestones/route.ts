import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sbGet, sbPost, sbDelete, enc } from "@/lib/supabase-admin";
import { sendShipmentStatusEmail } from "@/lib/email";
import { notifyShipmentUpdate } from "@/lib/notify";

function isAdmin(role?: string) {
  return ["SUPER_ADMIN", "MANAGER", "AGENCY"].includes(role ?? "");
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || !isAdmin(role)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const milestones = await sbGet(
    "Milestone",
    `shipmentId=eq.${id}&select=*&order=occurredAt.desc`
  );
  return NextResponse.json(milestones);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || !isAdmin(role)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id: shipmentId } = await params;
  const { label, location, status, occurredAt, note } = await req.json();

  if (!label?.trim() || !status) {
    return NextResponse.json({ error: "Label et statut obligatoires" }, { status: 400 });
  }

  const milestoneId = crypto.randomUUID();
  const milestone = await sbPost("Milestone", {
    id: milestoneId,
    shipmentId,
    label: label.trim(),
    location: location?.trim() || null,
    status,
    occurredAt: occurredAt || new Date().toISOString(),
    note: note?.trim() || null,
  });

  if (!milestone) return NextResponse.json({ error: "Erreur lors de la création" }, { status: 500 });

  // Notifier le client de cet événement de suivi (no-op tant que Resend n'est pas configuré).
  // Reply-To = l'email de l'agence de l'expédition → les réponses arrivent chez l'agence.
  try {
    const [ship] = await sbGet<{ reference: string; clientId: string; agencyId: string | null }>(
      "Shipment", `id=eq.${enc(shipmentId)}&select=reference,clientId,agencyId&limit=1`
    );
    if (ship?.clientId) {
      // Notification in-app
      await notifyShipmentUpdate(ship.clientId, ship.reference, label.trim(), shipmentId);

      const [client] = await sbGet<{ name: string; email: string }>(
        "User", `id=eq.${enc(ship.clientId)}&select=name,email&limit=1`
      );
      let replyTo: string | undefined;
      if (ship.agencyId) {
        const [ag] = await sbGet<{ email: string | null }>(
          "Agency", `id=eq.${enc(ship.agencyId)}&select=email&limit=1`
        );
        if (ag?.email) replyTo = ag.email;
      }
      if (client?.email) {
        await sendShipmentStatusEmail({
          name: client.name,
          email: client.email,
          reference: ship.reference,
          statusLabel: label.trim(),
          location: location?.trim() || null,
          note: note?.trim() || null,
          replyTo,
        });
      }
    }
  } catch (e) {
    console.error("[milestones] notification email:", e);
  }

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
