"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Compteur animé au défilement. `value` du type "500+", "20+", "98%", "10+".
 * La partie numérique s'anime de 0 à la cible ; le suffixe (+, %…) est conservé.
 */
export default function CountUp({
  value,
  className,
  style,
}: {
  value: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const match = value.match(/^(\d+)(.*)$/);
  const target = match ? parseInt(match[1], 10) : 0;
  const suffix = match ? match[2] : "";
  const [display, setDisplay] = useState(match ? "0" + suffix : value);

  useEffect(() => {
    const el = ref.current;
    if (!el || !match) return;
    if (typeof IntersectionObserver === "undefined" || typeof requestAnimationFrame === "undefined") {
      setDisplay(value);
      return;
    }
    let started = false;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !started) {
            started = true;
            const duration = 1400;
            const t0 = performance.now();
            const tick = (now: number) => {
              const p = Math.min(1, (now - t0) / duration);
              const eased = 1 - Math.pow(1 - p, 3);
              setDisplay(Math.round(target * eased) + suffix);
              if (p < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
            io.disconnect();
          }
        }
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [match, target, suffix, value]);

  return (
    <span ref={ref} className={className} style={style}>
      {match ? display : value}
    </span>
  );
}
