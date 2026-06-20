"use client";

import { useT } from "./LanguageProvider";
import type { Locale } from "@/lib/i18n";

/** Bascule FR/EN. `tone="dark"` pour les fonds sombres (sidebars). */
export default function LanguageSwitcher({ tone = "light" }: { tone?: "light" | "dark" }) {
  const { locale, setLocale } = useT();
  const isDark = tone === "dark";

  return (
    <div
      className="flex items-center rounded-lg overflow-hidden border shrink-0"
      style={{ borderColor: isDark ? "rgba(255,255,255,0.25)" : "#e5e7eb" }}
      role="group"
      aria-label="Language"
    >
      {(["fr", "en"] as Locale[]).map((l) => {
        const active = locale === l;
        return (
          <button
            key={l}
            onClick={() => setLocale(l)}
            aria-pressed={active}
            className="px-2 py-1 text-xs font-black uppercase transition-colors"
            style={{
              fontFamily: "var(--font-montserrat)",
              backgroundColor: active ? "#E8520A" : "transparent",
              color: active ? "#fff" : isDark ? "rgba(255,255,255,0.7)" : "#6b7280",
            }}
          >
            {l}
          </button>
        );
      })}
    </div>
  );
}
