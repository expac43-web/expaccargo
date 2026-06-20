"use client";

import { createContext, useContext } from "react";
import { useRouter } from "next/navigation";
import type { Dict, Locale } from "@/lib/i18n";

type LanguageCtx = { locale: Locale; t: Dict; setLocale: (l: Locale) => void };

const LanguageContext = createContext<LanguageCtx | null>(null);

/**
 * Fournit la locale + le dictionnaire aux composants client.
 * La locale est résolue côté serveur (cookie) puis passée en props : pas de
 * flash de langue à l'hydratation.
 */
export default function LanguageProvider({
  locale,
  dict,
  children,
}: {
  locale: Locale;
  dict: Dict;
  children: React.ReactNode;
}) {
  const router = useRouter();

  function setLocale(l: Locale) {
    if (l === locale) return;
    document.cookie = `locale=${l};path=/;max-age=31536000;samesite=lax`;
    // Recharge les composants serveur avec la nouvelle locale.
    router.refresh();
  }

  return (
    <LanguageContext.Provider value={{ locale, t: dict, setLocale }}>
      {children}
    </LanguageContext.Provider>
  );
}

/** Hook d'accès à la traduction côté client : `const { t, locale, setLocale } = useT()`. */
export function useT(): LanguageCtx {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useT doit être utilisé à l'intérieur de <LanguageProvider>");
  return ctx;
}
