/**
 * Client Terminal49 — suivi automatique des conteneurs maritimes.
 *
 * ⚠️ Inactif tant que TERMINAL49_API_KEY n'est pas configurée (comme lib/email).
 * On n'automatise QUE la jambe maritime, jusqu'à l'arrivée / au déchargement au
 * port de destination. Au-delà (douane import, livraison), le staff prend le relais
 * via les jalons manuels.
 */

const API_BASE = "https://api.terminal49.com/v2";
const KEY = process.env.TERMINAL49_API_KEY || "";

export function isTrackingConfigured(): boolean {
  return KEY.length > 0;
}

// ── Compagnies maritimes d'EXPAC : code SCAC + couverture Terminal49 + page de suivi (repli) ──
export type Carrier = { scac: string; name: string; t49: boolean; trackUrl: string };

export const CARRIERS: Carrier[] = [
  { scac: "CMDU", name: "CMA CGM", t49: true, trackUrl: "https://www.cma-cgm.com/ebusiness/tracking" },
  { scac: "MAEU", name: "Maersk", t49: true, trackUrl: "https://www.maersk.com/tracking/" },
  { scac: "MSCU", name: "MSC", t49: true, trackUrl: "https://www.msc.com/en/track-a-shipment" },
  { scac: "COSU", name: "COSCO", t49: true, trackUrl: "https://elines.coscoshipping.com/ebusiness/cargotracking" },
  { scac: "HLCU", name: "Hapag-Lloyd", t49: true, trackUrl: "https://www.hapag-lloyd.com/en/online-business/track/track-by-container-solution.html" },
  { scac: "GRIU", name: "Grimaldi", t49: false, trackUrl: "https://www.visiwise.co/tracking/bl/grimaldi/" },
];

export function carrierByScac(scac?: string | null): Carrier | undefined {
  return scac ? CARRIERS.find((c) => c.scac === scac) : undefined;
}

/**
 * Enregistre une demande de suivi auprès de Terminal49 (par n° de BL/booking + SCAC).
 * Renvoie l'id de la tracking_request, ou null (non configuré / erreur).
 */
export async function createTrackingRequest(opts: {
  requestNumber: string;
  scac: string;
  requestType?: "container" | "bill_of_lading" | "booking_number";
}): Promise<{ id: string } | null> {
  if (!KEY) return null;
  try {
    const res = await fetch(`${API_BASE}/tracking_requests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/vnd.api+json",
        Accept: "application/vnd.api+json",
        Authorization: `Token ${KEY}`,
      },
      body: JSON.stringify({
        data: {
          type: "tracking_request",
          attributes: {
            request_type: opts.requestType ?? "container",
            request_number: opts.requestNumber.trim(),
            scac: opts.scac,
          },
        },
      }),
    });
    if (!res.ok) {
      console.error("[terminal49] tracking_request échoué:", res.status, await res.text().catch(() => ""));
      return null;
    }
    const json = await res.json().catch(() => null);
    const id = json?.data?.id;
    return id ? { id: String(id) } : null;
  } catch (e) {
    console.error("[terminal49] erreur réseau:", e);
    return null;
  }
}

/**
 * Mappe un type d'événement Terminal49 → statut EXPAC + libellé de jalon.
 * Retourne null pour les événements non automatisés (origine, transbordement info,
 * ou tout ce qui est après le port → géré manuellement par le staff).
 */
export function mapEventToMilestone(eventType: string): { status: string; label: string } | null {
  const e = (eventType || "").toLowerCase();
  if (e.includes("vessel_loaded") || e.includes("vessel_departed") || e.endsWith("departed") || e.includes("sailing")) {
    return { status: "IN_TRANSIT", label: "Départ du navire" };
  }
  if (e.includes("vessel_arrived") || e.includes("arrived_at_destination") || e.endsWith("arrived")) {
    return { status: "IN_TRANSIT", label: "Arrivé au port de destination" };
  }
  if (e.includes("discharged")) {
    return { status: "IN_TRANSIT", label: "Conteneur déchargé au port" };
  }
  return null;
}
