"use client";

import { useState } from "react";
import { currencyCountry, flagUrl } from "@/lib/flags";

/**
 * Drapeau d'une devise sous forme d'image (flagcdn) — rendu fiable sur tous les
 * appareils, y compris Windows où les emojis-drapeaux ne s'affichent pas.
 * Repli sur un emoji globe si pas de pays ou si l'image échoue.
 */
export default function CurrencyFlag({
  code,
  size = 24,
  className = "",
}: {
  code: string;
  size?: number;
  className?: string;
}) {
  const cc = currencyCountry(code);
  const [err, setErr] = useState(false);

  if (!cc || err) {
    return (
      <span className={className} style={{ fontSize: size * 0.85, lineHeight: 1 }} aria-hidden>
        🌐
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={flagUrl(cc)}
      alt=""
      aria-hidden
      loading="lazy"
      onError={() => setErr(true)}
      className={`rounded-sm object-cover shadow-sm ${className}`}
      style={{ width: size, height: Math.round(size * 0.72) }}
    />
  );
}
