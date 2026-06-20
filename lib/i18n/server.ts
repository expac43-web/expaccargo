import "server-only";
import { cookies } from "next/headers";
import { getDictionary, normalizeLocale, type Locale } from "./index";

/** Locale courante côté serveur (cookie `locale`, défaut « fr »). */
export async function getServerLocale(): Promise<Locale> {
  const c = await cookies();
  return normalizeLocale(c.get("locale")?.value);
}

/** Dictionnaire courant côté serveur (composants serveur). */
export async function getServerDict() {
  return getDictionary(await getServerLocale());
}
