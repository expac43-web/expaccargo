/**
 * Code devise (ISO 4217) → code pays (ISO 3166-1 alpha-2, minuscule) pour les drapeaux.
 * Pour 95 % des devises, les 2 premières lettres du code = le pays (par construction
 * de l'ISO 4217). On gère les exceptions (devises supranationales, EUR…) à part.
 */
const OVERRIDES: Record<string, string | null> = {
  EUR: "eu", // Union européenne
  // Devises supranationales / sans pays → pas de drapeau (repli emoji)
  XAF: null, XOF: null, XPF: null, XCD: null, XDR: null,
  XAU: null, XAG: null, XPT: null, XPD: null, XBA: null, XBB: null,
};

/** Renvoie le code pays minuscule pour flagcdn, ou null si pas de drapeau pertinent. */
export function currencyCountry(code: string): string | null {
  if (code in OVERRIDES) return OVERRIDES[code];
  if (code.startsWith("X")) return null; // autres devises supranationales
  const cc = code.slice(0, 2).toLowerCase();
  return /^[a-z]{2}$/.test(cc) ? cc : null;
}

/** URL du drapeau SVG (flagcdn, libre, sans clé). */
export function flagUrl(cc: string): string {
  return `https://flagcdn.com/${cc}.svg`;
}
