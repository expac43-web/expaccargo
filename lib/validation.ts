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

/**
 * NIU (Numéro d'Identification Unique) — ex : P23000000492456J.
 * Normalisation : suppression des espaces + majuscules.
 */
export function normalizeNiu(v: string): string {
  return v.replace(/\s+/g, "").toUpperCase();
}

/**
 * Validation souple du NIU : une lettre initiale puis 9 à 19 caractères
 * alphanumériques (le préfixe « P23… » du modèle n'est pas imposé en dur pour
 * ne pas rejeter un NIU société ou d'un autre millésime).
 */
export function isValidNiu(v: unknown): v is string {
  return typeof v === "string" && /^[A-Za-z][A-Za-z0-9]{9,19}$/.test(normalizeNiu(v));
}
