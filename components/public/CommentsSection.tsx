"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Star, Quote, Send, CheckCircle2, LogIn, AlertCircle } from "lucide-react";
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

function Stars({ value, onChange }: { value: number; onChange?: (n: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(n)}
          aria-label={`${n}/5`}
          className={onChange ? "cursor-pointer" : "cursor-default"}
        >
          <Star size={onChange ? 24 : 15} style={{ color: "#E8520A" }} fill={n <= value ? "#E8520A" : "none"} />
        </button>
      ))}
    </div>
  );
}

export default function CommentsSection({ initial }: { initial: PublicComment[] }) {
  const { data: session } = useSession();
  const { t } = useT();
  const rv = t.home.reviews;

  const [content, setContent] = useState("");
  const [rating, setRating] = useState(5);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setSending(true);
    setError("");
    try {
      const r = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, rating }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        setError(d.error ?? rv.error);
        return;
      }
      setSent(true);
      setContent("");
    } catch {
      setError(rv.error);
    } finally {
      setSending(false);
    }
  }

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

        {/* Liste des avis */}
        {initial.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-14">
            {initial.map((c, i) => (
              <Reveal key={c.id} delay={(i % 3) * 80} className="h-full">
                <div className="relative bg-white rounded-2xl border border-gray-100 shadow-sm p-7 h-full flex flex-col">
                  <Quote size={30} className="mb-3" style={{ color: "rgba(232,82,10,0.18)" }} fill="rgba(232,82,10,0.18)" />
                  {c.rating ? (
                    <div className="mb-3"><Stars value={c.rating} /></div>
                  ) : null}
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
        ) : (
          <p className="text-center text-gray-400 mb-14" style={{ fontFamily: "var(--font-lato)" }}>{rv.empty}</p>
        )}

        {/* Formulaire / invitation à se connecter */}
        <Reveal className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7 md:p-8">
            {session?.user ? (
              sent ? (
                <div className="text-center py-6">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "rgba(22,163,74,0.1)" }}>
                    <CheckCircle2 size={30} style={{ color: "#16a34a" }} />
                  </div>
                  <p className="text-gray-600" style={{ fontFamily: "var(--font-lato)" }}>{rv.thanks}</p>
                </div>
              ) : (
                <form onSubmit={submit}>
                  <h3 className="font-black text-base uppercase mb-5" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>{rv.formTitle}</h3>
                  {error && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100 mb-4">
                      <AlertCircle size={14} className="text-red-500 shrink-0" />
                      <p className="text-xs text-red-600" style={{ fontFamily: "var(--font-lato)" }}>{error}</p>
                    </div>
                  )}
                  <div className="mb-4">
                    <p className="text-xs font-black uppercase tracking-wider mb-2 text-gray-600" style={{ fontFamily: "var(--font-montserrat)" }}>{rv.ratingLabel}</p>
                    <Stars value={rating} onChange={setRating} />
                  </div>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={4}
                    required
                    maxLength={1000}
                    placeholder={rv.placeholder}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#1A3A6B] focus:ring-2 focus:ring-[#1A3A6B]/10 transition-all bg-white resize-none mb-4"
                    style={{ fontFamily: "var(--font-lato)" }}
                  />
                  <button
                    type="submit"
                    disabled={sending}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-black text-white uppercase tracking-wide text-sm transition-all hover:opacity-90 disabled:opacity-60"
                    style={{ backgroundColor: "#E8520A", fontFamily: "var(--font-montserrat)" }}
                  >
                    {sending ? <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={15} />}
                    {sending ? rv.sending : rv.submit}
                  </button>
                </form>
              )
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-600 mb-5" style={{ fontFamily: "var(--font-lato)" }}>{rv.loginPrompt}</p>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-black text-white uppercase tracking-wide text-sm transition-all hover:opacity-90"
                  style={{ backgroundColor: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}
                >
                  <LogIn size={15} /> {rv.loginBtn}
                </Link>
              </div>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
