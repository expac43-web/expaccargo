/**
 * Supabase Storage helper — server-side only (uses service role key)
 */
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const BUCKET = "expac-documents";
export const AVATAR_BUCKET = "expac-avatars";

/**
 * Upload a file buffer to Supabase Storage.
 * Returns the public URL on success, null on failure.
 */
export async function uploadFile(
  path: string,
  buffer: Buffer,
  contentType: string
): Promise<string | null> {
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType,
      upsert: true,
    });

  if (error) {
    console.error("[storage] upload error:", error.message);
    return null;
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Upload an avatar image to the expac-avatars bucket.
 * Path: {userId}/avatar.{ext} — upsert écrase l'ancienne photo.
 */
export async function uploadAvatar(
  userId: string,
  buffer: Buffer,
  contentType: string,
  ext: string
): Promise<string | null> {
  const path = `${userId}/avatar.${ext}`;
  const { error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, buffer, { contentType, upsert: true });

  if (error) {
    console.error("[storage] avatar upload error:", error.message);
    return null;
  }

  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  // Ajouter un cache-buster pour forcer le rechargement après remplacement
  return `${data.publicUrl}?v=${Date.now()}`;
}

/**
 * Upload d'un logo de partenaire dans le bucket public (préfixe partners/).
 * Retourne l'URL publique, ou null en cas d'échec.
 */
export async function uploadPartnerLogo(
  buffer: Buffer,
  contentType: string,
  ext: string
): Promise<{ url: string | null; error?: string }> {
  const path = `partners/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, buffer, { contentType, upsert: true });

  if (error) {
    console.error("[storage] partner logo error:", error.message);
    return { url: null, error: error.message };
  }
  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl };
}

/**
 * Télécharge un fichier du bucket documents via la clé service (côté serveur).
 * Permet de servir le fichier sans exposer l'URL Supabase au navigateur.
 */
export async function downloadFile(
  path: string
): Promise<{ buffer: Buffer; contentType: string } | null> {
  const { data, error } = await supabase.storage.from(BUCKET).download(path);
  if (error || !data) {
    console.error("[storage] download error:", error?.message);
    return null;
  }
  const buffer = Buffer.from(await data.arrayBuffer());
  return { buffer, contentType: data.type || "application/octet-stream" };
}

/**
 * Delete a file from Supabase Storage by its path.
 */
export async function deleteFile(path: string): Promise<boolean> {
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) {
    console.error("[storage] delete error:", error.message);
    return false;
  }
  return true;
}

/**
 * Extract the storage path from a full public URL.
 */
export function urlToPath(url: string): string {
  // e.g. https://xxx.supabase.co/storage/v1/object/public/expac-documents/userId/file.pdf
  const marker = `/object/public/${BUCKET}/`;
  const idx = url.indexOf(marker);
  return idx >= 0 ? url.slice(idx + marker.length) : url;
}
