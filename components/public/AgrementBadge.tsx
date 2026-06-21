"use client";

import { ShieldCheck } from "lucide-react";
import { useT } from "@/components/i18n/LanguageProvider";

/**
 * Met en valeur l'agrément de commissionnaire en douane (N° CDA 265).
 * tone="dark" sur fond foncé (hero), "light" sur fond clair.
 */
export default function AgrementBadge({ tone = "light" }: { tone?: "light" | "dark" }) {
  const { locale } = useT();
  const label = locale === "en" ? "Licensed customs broker" : "Commissionnaire agréé en douane";
  const dark = tone === "dark";
  return (
    <span
      className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wide"
      style={{
        fontFamily: "var(--font-montserrat)",
        backgroundColor: dark ? "rgba(255,255,255,0.12)" : "rgba(26,58,107,0.06)",
        color: dark ? "#ffffff" : "#1A3A6B",
        border: `1px solid ${dark ? "rgba(255,255,255,0.25)" : "rgba(26,58,107,0.15)"}`,
      }}
    >
      <ShieldCheck size={14} style={{ color: dark ? "#fba563" : "#E8520A" }} />
      <span>
        {label} · <span style={{ color: dark ? "#fba563" : "#E8520A" }}>N° CDA 265</span>
      </span>
    </span>
  );
}
