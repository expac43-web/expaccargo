import { NextRequest, NextResponse } from "next/server";
import { sbGet, sbPatch, enc } from "@/lib/supabase-admin";
import { addMilestone } from "@/lib/milestones";
import { mapEventToMilestone } from "@/lib/terminal49";

// Auth simple par secret partagé dans l'URL (?secret=…), en attendant de brancher
// la vérification de signature native de Terminal49 sur de vrais événements.
const SECRET = process.env.TERMINAL49_WEBHOOK_SECRET || "";

function asObj(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
}

/** Recherche en profondeur la 1re valeur (string/number) portée par l'une des clés. */
function deepFind(obj: unknown, keys: string[]): string | null {
  const o = asObj(obj);
  if (!o) return null;
  for (const [k, v] of Object.entries(o)) {
    if (keys.includes(k) && (typeof v === "string" || typeof v === "number")) return String(v);
  }
  for (const v of Object.values(o)) {
    const found = deepFind(v, keys);
    if (found) return found;
  }
  return null;
}

/** Id d'un objet lié (JSON:API) : data.relationships[type].data.id ou included[type].id. */
function findRelId(body: unknown, type: string): string | null {
  const data = asObj(asObj(body)?.data);
  const rel = asObj(asObj(asObj(data?.relationships)?.[type])?.data);
  if (rel?.id) return String(rel.id);
  const inc = asObj(body)?.included;
  if (Array.isArray(inc)) {
    const match = inc.find((x) => { const o = asObj(x); return o?.type === type || o?.type === `${type}s`; });
    const mo = asObj(match);
    if (mo?.id) return String(mo.id);
  }
  return null;
}

async function findShipment(t49ShipmentId: string | null, bl: string | null) {
  if (t49ShipmentId) {
    const [s] = await sbGet<{ id: string }>("Shipment", `t49ShipmentId=eq.${enc(t49ShipmentId)}&select=id&limit=1`);
    if (s) return s;
  }
  if (bl) {
    const [s] = await sbGet<{ id: string }>("Shipment", `blNumber=eq.${enc(bl)}&select=id&limit=1`);
    if (s) return s;
  }
  return null;
}

export async function POST(req: NextRequest) {
  if (SECRET) {
    const s = new URL(req.url).searchParams.get("secret");
    if (s !== SECRET) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ ok: true });

  const data = asObj(asObj(body)?.data);
  const attrs = asObj(data?.attributes);
  const eventType = String(attrs?.event ?? deepFind(body, ["event"]) ?? "");
  const t49ShipmentId = deepFind(body, ["shipment_id"]) ?? findRelId(body, "shipment");
  const bl = deepFind(body, ["bill_of_lading_number", "normalized_number", "request_number"]);
  const trackingRequestId =
    findRelId(body, "tracking_request") ??
    (eventType.startsWith("tracking_request") && data?.id ? String(data.id) : null);

  try {
    // Confirmation de la demande de suivi → on mémorise l'id d'expédition Terminal49.
    if (eventType.includes("tracking_request.succeeded")) {
      if (trackingRequestId) {
        await sbPatch("Shipment", `t49TrackingRequestId=eq.${enc(trackingRequestId)}`, {
          t49ShipmentId: t49ShipmentId ?? null,
          trackingStatus: "active",
          updatedAt: new Date().toISOString(),
        });
      }
      return NextResponse.json({ ok: true });
    }
    if (eventType.includes("tracking_request.failed")) {
      if (trackingRequestId) {
        await sbPatch("Shipment", `t49TrackingRequestId=eq.${enc(trackingRequestId)}`, {
          trackingStatus: "failed",
          updatedAt: new Date().toISOString(),
        });
      }
      return NextResponse.json({ ok: true });
    }

    // Événement de transport → jalon automatique (jambe maritime, jusqu'au port).
    const mapped = mapEventToMilestone(eventType);
    if (mapped) {
      const ship = await findShipment(t49ShipmentId, bl);
      if (ship) {
        await addMilestone({
          shipmentId: ship.id,
          label: mapped.label,
          status: mapped.status,
          note: "Suivi automatique (Terminal49)",
        });
      } else {
        console.warn("[t49 webhook] expédition introuvable:", eventType, { t49ShipmentId, bl });
      }
    } else if (eventType) {
      console.log("[t49 webhook] événement non automatisé:", eventType);
    }
  } catch (e) {
    console.error("[t49 webhook] erreur:", e);
  }

  // Toujours 200 : évite les ré-essais en boucle de Terminal49.
  return NextResponse.json({ ok: true });
}
