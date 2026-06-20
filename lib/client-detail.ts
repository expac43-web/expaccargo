/**
 * Récupère la fiche complète d'un client : profil + expéditions + documents.
 * Mutualisé entre les routes agence / gérant / admin.
 */
import { sbGet, enc } from "@/lib/supabase-admin";

export type ClientProfile = {
  id: string; name: string; email: string; phone: string | null;
  whatsapp: string | null; isActive: boolean; createdAt: string;
};
export type ClientShipment = {
  id: string; reference: string; status: string; serviceType: string;
  origin: string; destination: string; eta: string | null; createdAt: string;
};
export type ClientDocument = {
  id: string; name: string; type: string;
  shipmentId: string | null; uploadedById: string; createdAt: string;
};

export type ClientBundle = {
  client: ClientProfile;
  shipments: ClientShipment[];
  documents: ClientDocument[];
};

/** Renvoie la fiche du client, ou null si l'id ne correspond à aucun client. */
export async function getClientBundle(id: string): Promise<ClientBundle | null> {
  const [client] = await sbGet<ClientProfile>(
    "User",
    `id=eq.${enc(id)}&role=eq.CLIENT&select=id,name,email,phone,whatsapp,isActive,createdAt&limit=1`
  );
  if (!client) return null;

  const shipments = await sbGet<ClientShipment>(
    "Shipment",
    `clientId=eq.${enc(id)}&select=id,reference,status,serviceType,origin,destination,eta,createdAt&order=createdAt.desc`
  );

  // Documents visibles par le client = ceux dont il est le propriétaire (uploadedById).
  // C'est la même colonne que celle utilisée par l'espace client et le proxy /api/files.
  const documents = await sbGet<ClientDocument>(
    "Document",
    `uploadedById=eq.${enc(id)}&select=id,name,type,shipmentId,uploadedById,createdAt&order=createdAt.desc`
  );

  return { client, shipments, documents };
}
