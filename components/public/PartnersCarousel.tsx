"use client";

import Image from "next/image";

type Partner = { id: string; name: string; logoUrl: string; website?: string | null };

export default function PartnersCarousel({ partners }: { partners: Partner[] }) {
  if (partners.length === 0) return null;

  // Duplicate to create seamless loop
  const items = [...partners, ...partners, ...partners];

  return (
    <div className="relative overflow-hidden">
      {/* Gradient masks */}
      <div className="absolute left-0 top-0 bottom-0 w-20 z-10 pointer-events-none"
        style={{ background: "linear-gradient(to right, white, transparent)" }} />
      <div className="absolute right-0 top-0 bottom-0 w-20 z-10 pointer-events-none"
        style={{ background: "linear-gradient(to left, white, transparent)" }} />

      <div
        className="flex gap-6 partner-scroll"
        style={{ width: "max-content" }}
      >
        {items.map((p, i) => {
          const inner = (
            <div
              className="flex items-center justify-center bg-gray-50 hover:bg-gray-100 rounded-2xl border border-gray-100 px-6 transition-all duration-300 hover:shadow-sm shrink-0"
              style={{ width: "160px", height: "80px" }}
            >
              <Image
                src={p.logoUrl}
                alt={p.name}
                width={140}
                height={60}
                className="object-contain max-h-12"
                unoptimized={p.logoUrl.includes("placehold.co")}
              />
            </div>
          );

          return p.website ? (
            <a key={i} href={p.website} target="_blank" rel="noopener noreferrer">
              {inner}
            </a>
          ) : (
            <div key={i}>{inner}</div>
          );
        })}
      </div>
    </div>
  );
}
