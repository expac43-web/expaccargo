/**
 * Grille tarifaire & calcul d'estimation. Module pur (client-safe — n'importe
 * aucun secret/clé serveur).
 */
export type Tariff = {
  id: string;
  serviceType: string;
  origin: string;
  destination: string;
  baseFee: number;
  pricePerKg: number;
  pricePerM3: number;
  volumetricFactor: number; // kg par m³ (aérien ≈167, maritime ≈1000, routier ≈333)
  minPrice: number;
  currency: string;
  note: string | null;
  isActive: boolean;
  createdAt: string;
};

export const TARIFF_SERVICES: { value: string; label: string }[] = [
  { value: "TRANSIT", label: "Transit" },
  { value: "MULTIMODAL", label: "Transport multimodal" },
  { value: "MARITIME_CONSIGNMENT", label: "Consignation maritime" },
  { value: "GROUPAGE", label: "Groupage" },
  { value: "STORAGE", label: "Stockage" },
];

export const SERVICE_LABEL: Record<string, string> = Object.fromEntries(
  TARIFF_SERVICES.map((s) => [s.value, s.label])
);

/** Poids volumétrique = volume × facteur (kg/m³). */
export function volumetricWeight(volumeM3: number, factor: number): number {
  const v = Number.isFinite(volumeM3) && volumeM3 > 0 ? volumeM3 : 0;
  const f = Number.isFinite(factor) && factor > 0 ? factor : 0;
  return v * f;
}

/** Poids facturable = max(poids réel, poids volumétrique) — standard du fret. */
export function chargeableWeight(weightKg: number, volumeM3: number, factor: number): number {
  const w = Number.isFinite(weightKg) && weightKg > 0 ? weightKg : 0;
  return Math.max(w, volumetricWeight(volumeM3, factor));
}

/**
 * Estimation = max(minPrice, frais de base + poids facturable × prix/kg).
 * Le poids facturable retient le plus élevé entre poids réel et poids volumétrique.
 * L'admin contrôle toutes les valeurs (facteur volumétrique inclus).
 */
export function estimateTariff(t: Tariff, weightKg: number, volumeM3: number): number {
  const cw = chargeableWeight(weightKg, volumeM3, t.volumetricFactor);
  const raw = t.baseFee + cw * t.pricePerKg;
  return Math.max(t.minPrice, raw);
}

export function formatPrice(amount: number, currency = "XAF"): string {
  const nf = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });
  const suffix = currency === "XAF" ? "FCFA" : currency;
  return `${nf.format(Math.round(amount))} ${suffix}`;
}
