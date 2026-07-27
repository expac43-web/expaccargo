import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sbGet, sbPatch, enc } from "@/lib/supabase-admin";
import { createTrackingRequest, carrierByScac, isTrackingConfigured } from "@/lib/terminal49";

function isAdmin(role?: string) {
  return ["SUPER_ADMIN", "MANAGER", "AGENCY"].includes(role ?? "");
}

// Champs de suivi actuels d'une expédition (pour l'interface).
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || !isAdmin(role)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const [s] = await sbGet<{
    blNumber: string | null; carrierScac: string | null; containerNumber: string | null;
    trackingStatus: string | null; autoTracking: boolean;
  }>("Shipment", `id=eq.${enc(id)}&select=blNumber,carrierScac,containerNumber,trackingStatus,autoTracking&limit=1`);
  return NextResponse.json(s ?? {});
}

// Renseigne BL / compagnie / n° conteneur d'une expédition, et active éventuellement
// le suivi automatique Terminal49 (jambe maritime).
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || !isAdmin(role)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const blNumber = (body.blNumber ?? "").toString().trim();
  const carrierScac = (body.carrierScac ?? "").toString().trim();
  const containerNumber = (body.containerNumber ?? "").toString().trim();
  const activate = Boolean(body.activate);
  const carrier = carrierByScac(carrierScac);

  const patch: Record<string, unknown> = {
    blNumber: blNumber || null,
    carrierScac: carrierScac || null,
    containerNumber: containerNumber || null,
    updatedAt: new Date().toISOString(),
  };

  if (activate) {
    if (!blNumber || !carrier) {
      return NextResponse.json({ error: "N° de BL et compagnie requis pour activer le suivi." }, { status: 400 });
    }
    if (!carrier.t49) {
      return NextResponse.json(
        { error: `${carrier.name} n'est pas couvert par le suivi automatique — suivi manuel + lien transporteur.` },
        { status: 400 }
      );
    }
    if (!isTrackingConfigured()) {
      return NextResponse.json({ error: "Suivi automatique non configuré (clé Terminal49 absente)." }, { status: 503 });
    }
    const tr = await createTrackingRequest({ requestNumber: blNumber, scac: carrier.scac });
    if (!tr) {
      await sbPatch("Shipment", `id=eq.${enc(id)}`, { ...patch, trackingStatus: "failed" });
      return NextResponse.json({ error: "Terminal49 a refusé la demande. Vérifiez le BL et la compagnie." }, { status: 502 });
    }
    patch.t49TrackingRequestId = tr.id;
    patch.autoTracking = true;
    patch.trackingStatus = "pending";
  }

  const updated = await sbPatch("Shipment", `id=eq.${enc(id)}`, patch);
  if (!updated) return NextResponse.json({ error: "Erreur d'enregistrement." }, { status: 500 });

  return NextResponse.json({ success: true, trackingStatus: patch.trackingStatus ?? "none" });
}
