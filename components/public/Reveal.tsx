"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Révèle son contenu (fondu + glissement) lorsqu'il entre dans le viewport.
 * 100 % natif (IntersectionObserver), aucune librairie. Respecte prefers-reduced-motion (via CSS).
 */
export default function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number; // ms — pour un effet en cascade
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setVisible(true);
            io.disconnect();
            break;
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal${visible ? " is-visible" : ""}${className ? " " + className : ""}`}
      style={delay ? ({ "--reveal-delay": `${delay}ms` } as React.CSSProperties) : undefined}
    >
      {children}
    </div>
  );
}
