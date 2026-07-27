/**
 * Ajout d'un jalon de suivi, partagé entre l'ajout manuel (route admin) et le
 * suivi automatique (webhook Terminal49).
 *
 * Un jalon : (1) crée l'événement, (2) fait avancer le statut de l'expédition,
 * (3) trace l'historique, (4) notifie le client (in-app + email — no-op sans Resend).
 */
import { sbGet, sbPost, sbPatch, enc } from "@/lib/supabase-admin";
import { sendShipmentStatusEmail } from "@/lib/email";
import { notifyShipmentUpdate } from "@/lib/notify";
import { logShipmentAudit, statusFr } from "@/lib/audit";

export type AddMilestoneInput = {
  shipmentId: string;
  label: string;
  status: string;
  location?: string | null;
  note?: string | null;
  occurredAt?: string;
  /** Auteur (staff) ; absent = suivi automatique (système). */
  by?: { id?: string; name?: string; role?: string };
};

export async function addMilestone(input: AddMilestoneInput) {
  const { shipmentId, label, status } = input;

  const milestone = await sbPost("Milestone", {
    id: crypto.randomUUID(),
    shipmentId,
    label: label.trim(),
    location: input.location?.trim() || null,
    status,
    occurredAt: input.occurredAt || new Date().toISOString(),
    note: input.note?.trim() || null,
  });
  if (!milestone) return null;

  // Le jalon fait avancer le statut + trace l'historique.
  await sbPatch("Shipment", `id=eq.${enc(shipmentId)}`, { status, updatedAt: new Date().toISOString() });
  await logShipmentAudit({
    shipmentId,
    action: "update",
    detail: `Statut → ${statusFr(status)} (jalon : ${label.trim()})`,
    by: input.by ?? { name: "Suivi automatique", role: "SYSTEM" },
  });

  // Notifier le client de cet événement de suivi (Reply-To = agence de l'expédition).
  try {
    const [ship] = await sbGet<{ reference: string; clientId: string; agencyId: string | null }>(
      "Shipment", `id=eq.${enc(shipmentId)}&select=reference,clientId,agencyId&limit=1`
    );
    if (ship?.clientId) {
      await notifyShipmentUpdate(ship.clientId, ship.reference, label.trim(), shipmentId);
      const [client] = await sbGet<{ name: string; email: string }>(
        "User", `id=eq.${enc(ship.clientId)}&select=name,email&limit=1`
      );
      let replyTo: string | undefined;
      if (ship.agencyId) {
        const [ag] = await sbGet<{ email: string | null }>("Agency", `id=eq.${enc(ship.agencyId)}&select=email&limit=1`);
        if (ag?.email) replyTo = ag.email;
      }
      if (client?.email) {
        await sendShipmentStatusEmail({
          name: client.name,
          email: client.email,
          reference: ship.reference,
          statusLabel: label.trim(),
          location: input.location?.trim() || null,
          note: input.note?.trim() || null,
          replyTo,
        });
      }
    }
  } catch (e) {
    console.error("[milestones] notification:", e);
  }

  return milestone;
}
