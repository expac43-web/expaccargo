/**
 * Chargement de la grille tarifaire depuis la base (table GrilleConfig, ligne id='default').
 * Server-only : utilise la clé service role via supabase-admin. Les champs absents
 * retombent sur la grille par défaut (lib/grille), donc jamais de valeur manquante.
 */
import { sbGet } from "@/lib/supabase-admin";
import { mergeGrille, type GrilleConfig } from "@/lib/grille";

export async function getGrilleConfig(): Promise<GrilleConfig> {
  try {
    const [row] = await sbGet<{ data: Partial<GrilleConfig> }>(
      "GrilleConfig",
      "id=eq.default&select=data&limit=1"
    );
    return mergeGrille(row?.data ?? null);
  } catch {
    return mergeGrille(null);
  }
}
