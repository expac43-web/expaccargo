/**
 * Règles de suppression des documents.
 *
 * - `uploadedById` = propriétaire (le client, pour la visibilité).
 * - `uploaderId`   = auteur réel du dépôt (staff ou client).
 *
 * Règles :
 *  - SUPER_ADMIN : peut tout supprimer.
 *  - chacun : peut supprimer ses propres dépôts (uploaderId === son id).
 *  - MANAGER (gérant) : peut en plus supprimer les dépôts faits par un AGENT (rôle AGENCY).
 */
import { sbGet, enc } from "@/lib/supabase-admin";

export type DeletableDoc = {
  id: string; url: string; uploaderId: string | null; uploadedById: string;
};

/** Récupère un document avec les champs nécessaires au contrôle de suppression. */
export async function getDocForDelete(id: string): Promise<DeletableDoc | null> {
  const [doc] = await sbGet<DeletableDoc>(
    "Document", `id=eq.${enc(id)}&select=id,url,uploaderId,uploadedById`
  );
  return doc ?? null;
}

/** Calcul synchrone du droit de suppression quand le rôle de l'auteur est déjà connu. */
export function canDeleteDoc(
  role: string | undefined,
  userId: string | undefined,
  uploaderId: string | null,
  uploaderRole: string | null,
): boolean {
  if (role === "SUPER_ADMIN") return true;
  if (uploaderId && userId && uploaderId === userId) return true;
  if (role === "MANAGER" && uploaderRole === "AGENCY") return true;
  return false;
}

/** Version async : résout le rôle de l'auteur si besoin (pour les routes DELETE). */
export async function canUserDeleteDoc(
  user: { id?: string; role?: string },
  doc: DeletableDoc,
): Promise<boolean> {
  if (user.role === "SUPER_ADMIN") return true;
  if (doc.uploaderId && doc.uploaderId === user.id) return true;
  if (user.role === "MANAGER" && doc.uploaderId) {
    const [u] = await sbGet<{ role: string }>(
      "User", `id=eq.${enc(doc.uploaderId)}&select=role&limit=1`
    );
    if (u?.role === "AGENCY") return true;
  }
  return false;
}

/** Récupère les rôles d'une liste d'ids utilisateurs (pour calculer canDelete en lot). */
export async function getUserRoles(ids: string[]): Promise<Record<string, string>> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return {};
  const users = await sbGet<{ id: string; role: string }>(
    "User", `id=in.(${unique.map((v) => enc(v)).join(",")})&select=id,role`
  );
  return Object.fromEntries(users.map((u) => [u.id, u.role]));
}
