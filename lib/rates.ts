/**
 * Taux de change du jour (base XAF / Franc CFA).
 * Source : open.er-api.com (gratuit, sans clé, ~160 devises), mise à jour quotidienne.
 * Mise en cache 6h via le cache de fetch de Next.
 */
export type RatesData = {
  base: string;
  updated: string; // date lisible (UTC) de dernière mise à jour
  rates: Record<string, number>; // 1 XAF = rates[CUR] CUR
};

export async function getRates(): Promise<RatesData | null> {
  try {
    const r = await fetch("https://open.er-api.com/v6/latest/XAF", { next: { revalidate: 21600 } });
    if (!r.ok) return null;
    const d = await r.json();
    if (d.result !== "success" || !d.rates) return null;
    return { base: d.base_code ?? "XAF", updated: d.time_last_update_utc ?? "", rates: d.rates };
  } catch {
    return null;
  }
}

/** Combien de XAF pour 1 unité de la devise (ex. 1 EUR = 655,96 FCFA). */
export function xafPerUnit(rates: Record<string, number>, code: string): number | null {
  const r = rates[code];
  if (!r || r <= 0) return null;
  return 1 / r;
}

// Devises mises en avant (accueil + haut de liste).
export const FEATURED_CURRENCIES = ["EUR", "USD", "CNY", "GBP"];
