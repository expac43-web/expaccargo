"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie } from "lucide-react";
import { useT } from "@/components/i18n/LanguageProvider";

/**
 * Bandeau de consentement aux cookies (première visite).
 * Le choix est mémorisé dans un cookie navigateur :
 *  - expac_consent=all       → cookies essentiels + mesure d'audience (12 mois)
 *  - expac_consent=essential → cookies essentiels uniquement (6 mois)
 * Les scripts d'analytics (AnalyticsConsent) ne se chargent que si "all".
 */
export function readConsent(): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(/(?:^|; )expac_consent=([^;]*)/);
  return m ? decodeURIComponent(m[1]) : null;
}

export default function CookieConsent() {
  const { t } = useT();
  const cb = t.cookieBanner;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (readConsent()) return;
    // Légère temporisation pour ne pas surgir pendant le premier rendu.
    const id = setTimeout(() => setVisible(true), 900);
    return () => clearTimeout(id);
  }, []);

  function choose(value: "all" | "essential") {
    const days = value === "all" ? 365 : 180;
    document.cookie = `expac_consent=${value}; path=/; max-age=${days * 86400}; SameSite=Lax`;
    setVisible(false);
    // Prévenir AnalyticsConsent (chargement GA sans recharger la page)
    window.dispatchEvent(new Event("expac-consent"));
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label={cb.title}
      className="fixed z-[60] bottom-4 inset-x-4 sm:inset-x-auto sm:right-5 sm:bottom-5 sm:max-w-sm animate-fade-in-up"
    >
      <div className="bg-white rounded-2xl border border-gray-100 shadow-2xl p-5">
        <div className="flex items-center gap-2.5 mb-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "rgba(232,82,10,0.1)" }}>
            <Cookie size={18} style={{ color: "#E8520A" }} />
          </div>
          <p className="font-black text-sm uppercase" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
            {cb.title}
          </p>
        </div>
        <p className="text-xs text-gray-500 leading-relaxed mb-4" style={{ fontFamily: "var(--font-lato)" }}>
          {cb.text}{" "}
          <Link href="/mentions-legales" className="underline hover:text-[#1A3A6B]">{cb.learnMore}</Link>
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => choose("all")}
            className="flex-1 py-2.5 px-4 rounded-xl text-xs font-black text-white uppercase tracking-wide hover:opacity-90 transition-opacity"
            style={{ backgroundColor: "#E8520A", fontFamily: "var(--font-montserrat)" }}
          >
            {cb.acceptAll}
          </button>
          <button
            onClick={() => choose("essential")}
            className="flex-1 py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wide border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
            style={{ fontFamily: "var(--font-montserrat)" }}
          >
            {cb.essentialOnly}
          </button>
        </div>
      </div>
    </div>
  );
}
