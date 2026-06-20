/**
 * Création de notifications in-app (table Notification).
 * Tout est best-effort (jamais bloquant pour l'action principale).
 */
import { sbPost, sbGet, enc } from "@/lib/supabase-admin";

// Lien vers la messagerie selon le rôle du destinataire.
const MSG_LINK: Record<string, string> = {
  CLIENT: "/dashboard/messages",
  AGENCY: "/dashboard/agence/messages",
  MANAGER: "/dashboard/gerant/messages",
  SUPER_ADMIN: "/dashboard/admin",
};

function snippet(text: string, n = 90): string {
  const t = (text ?? "").trim().replace(/\s+/g, " ");
  return t.length > n ? t.slice(0, n) + "…" : t;
}

export async function createNotification(
  userId: string,
  opts: { title: string; body?: string; link?: string | null }
): Promise<void> {
  if (!userId) return;
  try {
    await sbPost("Notification", {
      id: crypto.randomUUID(),
      userId,
      title: opts.title,
      body: opts.body ?? "",
      isRead: false,
      link: opts.link ?? null,
      createdAt: new Date().toISOString(),
    });
  } catch (e) {
    console.error("[notify] échec:", e);
  }
}

/** Notifie le destinataire d'un nouveau message (lien vers sa messagerie selon son rôle). */
export async function notifyNewMessage(receiverId: string, content: string): Promise<void> {
  if (!receiverId) return;
  const [u] = await sbGet<{ role: string }>("User", `id=eq.${enc(receiverId)}&select=role&limit=1`);
  const link = MSG_LINK[u?.role ?? "CLIENT"] ?? "/dashboard/messages";
  await createNotification(receiverId, { title: "Nouveau message", body: snippet(content), link });
}

/** Notifie le client d'une mise à jour de suivi d'expédition. */
export async function notifyShipmentUpdate(
  clientId: string, reference: string, label: string, shipmentId: string
): Promise<void> {
  await createNotification(clientId, {
    title: "Mise à jour d'expédition",
    body: `${reference} : ${label}`,
    link: `/dashboard/expeditions/${shipmentId}`,
  });
}

/** Notifie le client qu'un document a été partagé avec lui. */
export async function notifyDocumentShared(clientId: string, documentName: string): Promise<void> {
  await createNotification(clientId, {
    title: "Nouveau document",
    body: documentName,
    link: "/dashboard/documents",
  });
}

/** Notifie l'équipe (admin + gérants) qu'un client a accepté et signé un devis. */
export async function notifyStaffQuoteSigned(reference: string, signerName: string): Promise<void> {
  try {
    const staff = await sbGet<{ id: string; role: string }>(
      "User", `role=in.(SUPER_ADMIN,MANAGER)&select=id,role`
    );
    await Promise.all(
      staff.map((u) =>
        createNotification(u.id, {
          title: "Devis signé",
          body: `${signerName} a accepté et signé le devis ${reference}.`,
          link: u.role === "MANAGER" ? "/dashboard/gerant/devis" : "/dashboard/admin/devis",
        })
      )
    );
  } catch (e) {
    console.error("[notify] devis signé:", e);
  }
}
