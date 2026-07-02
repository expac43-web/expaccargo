"use client";

import { Star, Quote } from "lucide-react";
import Reveal from "@/components/public/Reveal";
import { useT } from "@/components/i18n/LanguageProvider";

type PublicComment = {
  id: string;
  authorName: string;
  authorRole: string | null;
  rating: number | null;
  content: string;
  createdAt: string;
};

function Stars({ value }: { value: number }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={15} style={{ color: "#E8520A" }} fill={n <= value ? "#E8520A" : "none"} />
      ))}
    </div>
  );
}

export default function CommentsSection({ initial }: { initial: PublicComment[] }) {
  const { t } = useT();
  const rv = t.home.reviews;

  // Rien à afficher tant qu'aucun avis n'est publié : on masque la section.
  if (!initial || initial.length === 0) return null;

  return (
    <section className="bg-gray-50 py-24">
      <div className="container-custom">
        <Reveal>
          <div className="text-center mb-14">
            <p className="text-xs font-black uppercase tracking-[0.2em] mb-4" style={{ color: "#E8520A", fontFamily: "var(--font-montserrat)" }}>
              ▪ {rv.eyebrow}
            </p>
            <h2 className="text-3xl md:text-4xl font-black uppercase" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
              {rv.title}
            </h2>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {initial.map((c, i) => (
            <Reveal key={c.id} delay={(i % 3) * 80} className="h-full">
              <div className="relative bg-white rounded-2xl border border-gray-100 shadow-sm p-7 h-full flex flex-col">
                <Quote size={30} className="mb-3" style={{ color: "rgba(232,82,10,0.18)" }} fill="rgba(232,82,10,0.18)" />
                {c.rating ? <div className="mb-3"><Stars value={c.rating} /></div> : null}
                <p className="text-sm text-gray-600 leading-relaxed flex-1" style={{ fontFamily: "var(--font-lato)" }}>
                  “{c.content}”
                </p>
                <div className="mt-5 pt-4 border-t border-gray-100">
                  <p className="font-black text-sm" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>{c.authorName}</p>
                  {c.authorRole && <p className="text-xs text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>{c.authorRole}</p>}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
