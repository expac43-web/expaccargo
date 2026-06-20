import fr, { type Dict } from "./fr";
import en from "./en";

export type Locale = "fr" | "en";
export const defaultLocale: Locale = "fr";
export const locales: Locale[] = ["fr", "en"];

const dicts: Record<Locale, Dict> = { fr, en };

export function getDictionary(locale: Locale): Dict {
  return dicts[locale] ?? fr;
}

export function normalizeLocale(value: string | undefined | null): Locale {
  return value === "en" ? "en" : "fr";
}

export type { Dict };
