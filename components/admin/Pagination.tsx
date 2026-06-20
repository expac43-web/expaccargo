"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

/** Construit la liste des pages à afficher, avec « … » si beaucoup de pages. */
function pageList(page: number, pageCount: number): (number | "…")[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1);
  const out: (number | "…")[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(pageCount - 1, page + 1);
  if (start > 2) out.push("…");
  for (let i = start; i <= end; i++) out.push(i);
  if (end < pageCount - 1) out.push("…");
  out.push(pageCount);
  return out;
}

export default function Pagination({
  page, total, pageSize, onChange,
}: {
  page: number;
  total: number;
  pageSize: number;
  onChange: (p: number) => void;
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  if (pageCount <= 1) return null;
  const go = (p: number) => onChange(Math.min(pageCount, Math.max(1, p)));

  const btn = "min-w-[34px] h-[34px] px-2 rounded-lg text-xs font-black flex items-center justify-center transition-colors";

  return (
    <div className="flex items-center justify-center gap-1.5 mt-6 flex-wrap" style={{ fontFamily: "var(--font-montserrat)" }}>
      <button
        onClick={() => go(page - 1)}
        disabled={page <= 1}
        className={`${btn} border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed`}
        aria-label="Page précédente"
      >
        <ChevronLeft size={15} />
      </button>

      {pageList(page, pageCount).map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} className="px-1.5 text-gray-400 text-xs">…</span>
        ) : (
          <button
            key={p}
            onClick={() => go(p)}
            className={btn}
            style={
              p === page
                ? { backgroundColor: "#1A3A6B", color: "#fff" }
                : { border: "1px solid #e5e7eb", color: "#6b7280" }
            }
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => go(page + 1)}
        disabled={page >= pageCount}
        className={`${btn} border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed`}
        aria-label="Page suivante"
      >
        <ChevronRight size={15} />
      </button>
    </div>
  );
}
