/**
 * Génération de mot de passe fort, lisible (sans caractères ambigus 0/O/1/l/I).
 * Utilisable côté serveur ET côté client (Web Crypto disponible dans les deux).
 */
const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const LOWER = "abcdefghijkmnpqrstuvwxyz";
const DIGITS = "23456789";
const SYMBOLS = "@#$%&*!?";
const ALL = UPPER + LOWER + DIGITS + SYMBOLS;

function randomInt(max: number): number {
  // crypto.getRandomValues est dispo navigateur + Node 18+
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] % max;
}

function pick(set: string): string {
  return set[randomInt(set.length)];
}

/** Mot de passe de `length` caractères (défaut 12) avec au moins 1 de chaque catégorie. */
export function generatePassword(length = 12): string {
  const len = Math.max(8, length);
  const required = [pick(UPPER), pick(LOWER), pick(DIGITS), pick(SYMBOLS)];
  const rest: string[] = [];
  for (let i = required.length; i < len; i++) rest.push(pick(ALL));

  const chars = [...required, ...rest];
  // Mélange Fisher-Yates pour ne pas figer les catégories en tête
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}
