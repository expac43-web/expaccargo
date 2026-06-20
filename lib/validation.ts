/** Helpers de validation d'entrée pour les routes API. */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(v: unknown): v is string {
  return typeof v === "string" && v.length <= 254 && EMAIL_RE.test(v.trim());
}

/** Chaîne non vide après trim, avec longueur max optionnelle. */
export function isNonEmptyStr(v: unknown, max = 5000): v is string {
  return typeof v === "string" && v.trim().length > 0 && v.trim().length <= max;
}

/** Numéro de téléphone : chiffres, espaces, +, -, parenthèses (8 à 20 caractères). */
export function isValidPhone(v: unknown): v is string {
  return typeof v === "string" && /^[+\d][\d\s().-]{6,19}$/.test(v.trim());
}
