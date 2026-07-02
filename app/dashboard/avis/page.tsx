"use client";

import { useState } from "react";
import { Star, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { useT } from "@/components/i18n/LanguageProvider";

function Stars({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex gap-1.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)} aria-label={`${n}/5`} className="cursor-pointer">
          <Star size={26} style={{ color: "#E8520A" }} fill={n <= value ? "#E8520A" : "none"} />
        </button>
      ))}
    </div>
  );
}

export default function ClientReviewPage() {
  const { t } = useT();
  const d = t.dashboard.reviews;
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
        const dj = await r.json().catch(() => ({}));
        setError(dj.error ?? rv.error);
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
    <div className="flex-1 p-6 lg:p-8">
      <div className="mb-8">
        <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: "#E8520A", fontFamily: "var(--font-montserrat)" }}>
          ▪ {d.eyebrow}
        </p>
        <h1 className="text-2xl font-black" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>{d.title}</h1>
        <p className="text-gray-500 text-sm mt-1" style={{ fontFamily: "var(--font-lato)" }}>{d.subtitle}</p>
      </div>

      <div className="max-w-2xl">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 lg:p-8">
          {sent ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "rgba(22,163,74,0.1)" }}>
                <CheckCircle2 size={30} style={{ color: "#16a34a" }} />
              </div>
              <p className="text-gray-600 mb-6" style={{ fontFamily: "var(--font-lato)" }}>{rv.thanks}</p>
              <button
                onClick={() => setSent(false)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black text-white hover:opacity-90"
                style={{ backgroundColor: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}
              >
                {d.title}
              </button>
            </div>
          ) : (
            <form onSubmit={submit}>
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100 mb-5">
                  <AlertCircle size={14} className="text-red-500 shrink-0" />
                  <p className="text-xs text-red-600" style={{ fontFamily: "var(--font-lato)" }}>{error}</p>
                </div>
              )}
              <div className="mb-5">
                <p className="text-xs font-black uppercase tracking-wider mb-2 text-gray-600" style={{ fontFamily: "var(--font-montserrat)" }}>{rv.ratingLabel}</p>
                <Stars value={rating} onChange={setRating} />
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={5}
                required
                maxLength={1000}
                placeholder={rv.placeholder}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#1A3A6B] focus:ring-2 focus:ring-[#1A3A6B]/10 transition-all bg-white resize-none mb-5"
                style={{ fontFamily: "var(--font-lato)" }}
              />
              <button
                type="submit"
                disabled={sending}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-black text-white uppercase tracking-wide text-sm hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: "#E8520A", fontFamily: "var(--font-montserrat)" }}
              >
                {sending ? <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={15} />}
                {sending ? rv.sending : rv.submit}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
