"use client";

import Image from "next/image";
import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Partner = { id: string; name: string; logoUrl: string; website?: string | null };

export default function PartnersCarousel({ partners }: { partners: Partner[] }) {
  const [index, setIndex] = useState(0);
  const [perPage, setPerPage] = useState(5);
  const [animated, setAnimated] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Responsive: 2 on mobile, 3 on tablet, 5 on desktop
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      setPerPage(w < 640 ? 2 : w < 1024 ? 3 : 5);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const total = partners.length;
  // Triple the array for seamless looping
  const items = [...partners, ...partners, ...partners];
  // Start in the middle set
  const offset = total;

  const [realIndex, setRealIndex] = useState(offset);

  const goTo = useCallback((i: number, anim = true) => {
    setAnimated(anim);
    setRealIndex(i);
  }, []);

  const next = useCallback(() => {
    goTo(realIndex + 1);
  }, [realIndex, goTo]);

  const prev = useCallback(() => {
    goTo(realIndex - 1);
  }, [realIndex, goTo]);

  // Auto-advance
  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(next, 3500);
  }, [next]);

  useEffect(() => {
    resetTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [resetTimer]);

  // Seamless loop: jump silently when near the edges
  const handleTransitionEnd = () => {
    if (realIndex >= offset + total) {
      goTo(realIndex - total, false);
    } else if (realIndex < offset) {
      goTo(realIndex + total, false);
    }
  };

  const translateX = -((realIndex / perPage) * 100);
  // Each item width in %
  const itemWidth = 100 / perPage;

  if (partners.length === 0) return null;

  return (
    <div className="container-custom">
      <div className="relative flex items-center gap-4">
        {/* Prev button */}
        <button
          onClick={() => { prev(); resetTimer(); }}
          aria-label="Précédent"
          className="shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all hover:shadow-md z-10"
          style={{ borderColor: "#1A3A6B", color: "#1A3A6B", backgroundColor: "white" }}
        >
          <ChevronLeft size={18} />
        </button>

        {/* Track */}
        <div className="flex-1 overflow-hidden">
          <div
            className="flex"
            style={{
              transform: `translateX(${translateX}%)`,
              transition: animated ? "transform 0.5s cubic-bezier(0.25,0.46,0.45,0.94)" : "none",
            }}
            onTransitionEnd={handleTransitionEnd}
          >
            {items.map((p, i) => {
              const inner = (
                <div
                  className="flex items-center justify-center bg-gray-50 hover:bg-white rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-300 mx-2"
                  style={{ height: "88px" }}
                >
                  <Image
                    src={p.logoUrl}
                    alt={p.name}
                    width={140}
                    height={56}
                    className="object-contain max-h-12 px-3"
                    unoptimized={p.logoUrl.includes("placehold.co")}
                  />
                </div>
              );
              return (
                <div
                  key={`${p.id}-${i}`}
                  style={{ width: `${itemWidth}%`, flexShrink: 0 }}
                >
                  {p.website ? (
                    <a href={p.website} target="_blank" rel="noopener noreferrer">
                      {inner}
                    </a>
                  ) : inner}
                </div>
              );
            })}
          </div>
        </div>

        {/* Next button */}
        <button
          onClick={() => { next(); resetTimer(); }}
          aria-label="Suivant"
          className="shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all hover:shadow-md z-10"
          style={{ borderColor: "#1A3A6B", color: "#1A3A6B", backgroundColor: "white" }}
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Dot indicators */}
      <div className="flex justify-center gap-1.5 mt-6">
        {Array.from({ length: Math.ceil(total / perPage) }).map((_, i) => {
          const active = Math.floor((realIndex - offset) / perPage) % Math.ceil(total / perPage) === i;
          return (
            <button
              key={i}
              onClick={() => { goTo(offset + i * perPage); resetTimer(); }}
              aria-label={`Page ${i + 1}`}
              className="rounded-full transition-all duration-300"
              style={{
                width: active ? "1.5rem" : "0.4rem",
                height: "0.4rem",
                backgroundColor: active ? "#E8520A" : "#d1d5db",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
