import { sbPost } from "@/lib/supabase-admin";

const STATUS_FR: Record<string, string> = {
  PENDING: "En attente", PICKED_UP: "Collecté", CUSTOMS_EXPORT: "Douane export",
  IN_TRANSIT: "En transit", CUSTOMS_IMPORT: "Douane import", OUT_DELIVERY: "En livraison",
  DELIVERED: "Livré", INCIDENT: "Incident", CANCELLED: "Annulé",
};

const FIELD_FR: Record<string, string> = {
  reference: "Référence", trackingNumber: "N° tracking", serviceType: "Service",
  origin: "Origine", destination: "Destination", weight: "Poids", volume: "Volume",
  description: "Description", eta: "ETA", clientId: "Client", agencyId: "Agence",
  deliveredAt: "Date de livraison",
};

export function statusFr(s?: string | null): string {
  return s ? (STATUS_FR[s] ?? s) : "";
}

export function fieldFr(k: string): string {
  return FIELD_FR[k] ?? k;
}

/** Enregistre une action sur une expédition (qui a modifié quoi). Best-effort. */
export async function logShipmentAudit(opts: {
  shipmentId: string;
  action: string;
  detail?: string | null;
  by?: { id?: string; name?: string; role?: string };
}): Promise<void> {
  try {
    await sbPost("ShipmentAudit", {
      id: crypto.randomUUID(),
      shipmentId: opts.shipmentId,
      action: opts.action,
      detail: opts.detail ?? null,
      byId: opts.by?.id ?? null,
      byName: opts.by?.name ?? null,
      byRole: opts.by?.role ?? null,
      createdAt: new Date().toISOString(),
    });
  } catch (e) {
    console.error("[audit] échec enregistrement:", e);
  }
}
