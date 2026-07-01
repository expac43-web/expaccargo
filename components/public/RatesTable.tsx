"use client";

import { useState, useMemo } from "react";
import { Search, Star } from "lucide-react";
import { xafPerUnit, FEATURED_CURRENCIES } from "@/lib/rates";
import { useT } from "@/components/i18n/LanguageProvider";
import CurrencyFlag from "@/components/public/CurrencyFlag";

type Row = { code: string; name: string; xaf: number };

export default function RatesTable({ rates }: { rates: Record<string, number> }) {
  const { t, locale } = useT();
  const r = t.rates;
  const [q, setQ] = useState("");

  const intlLocale = locale === "en" ? "en-US" : "fr-FR";
  const nf = useMemo(
    () => new Intl.NumberFormat(intlLocale, { maximumFractionDigits: 2, minimumFractionDigits: 2 }),
    [intlLocale]
  );
  const currencyName = useMemo(() => {
    let dn: Intl.DisplayNames | null = null;
    try {
      dn = new Intl.DisplayNames([locale], { type: "currency" });
    } catch {
      dn = null;
    }
    return (code: string) => {
      try {
        return dn?.of(code) ?? code;
      } catch {
        return code;
      }
    };
  }, [locale]);

  const all = useMemo<Row[]>(() => {
    const items = Object.keys(rates)
      .filter((c) => c !== "XAF")
      .map((code) => ({ code, name: currencyName(code), xaf: xafPerUnit(rates, code) }))
      .filter((i): i is Row => i.xaf != null);
    // Tri par CODE (déterministe SSR↔client) : les noms via Intl.DisplayNames
    // peuvent différer entre Node et le navigateur → un tri par nom casse l'hydratation.
    items.sort((a, b) => a.code.localeCompare(b.code));
    return items;
  }, [rates, currencyName]);

  const featured = useMemo(
    () => FEATURED_CURRENCIES.map((code) => all.find((row) => row.code === code)).filter((row): row is Row => !!row),
    [all]
  );

  const filtered = q.trim()
    ? all.filter((i) => i.code.toLowerCase().includes(q.toLowerCase()) || i.name.toLowerCase().includes(q.toLowerCase()))
    : all;

  return (
    <div>
      {/* Cartes vedettes */}
      {featured.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {featured.map((row, i) => (
            <div
              key={row.code}
              className="card-lift animate-fade-in-up bg-white rounded-2xl border border-gray-100 shadow-sm p-5 relative overflow-hidden"
              style={{ animationDelay: `${i * 0.07}s` }}
            >
              <div className="absolute -right-6 -top-6 w-20 h-20 rounded-full opacity-[0.07]" style={{ backgroundColor: "#E8520A" }} />
              <div className="flex items-center justify-between mb-3 relative z-10">
                <CurrencyFlag code={row.code} size={34} />
                <span className="text-xs font-black px-2 py-0.5 rounded-lg" style={{ backgroundColor: "rgba(26,58,107,0.08)", color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
                  {row.code}
                </span>
              </div>
              <p className="text-2xl font-black relative z-10" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
                {nf.format(row.xaf)} <span className="text-xs text-gray-400 font-normal">FCFA</span>
              </p>
              <p suppressHydrationWarning className="text-xs text-gray-400 mt-0.5 capitalize relative z-10" style={{ fontFamily: "var(--font-lato)" }}>
                1 {row.code} · {row.name}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Recherche */}
      <div className="relative max-w-sm mb-5">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={r.searchPlaceholder}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#1A3A6B] focus:ring-2 focus:ring-[#1A3A6B]/10 bg-white transition-all"
          style={{ fontFamily: "var(--font-lato)" }}
        />
      </div>

      {/* Table complète */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-fade-in-up">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {[r.thCurrency, r.thCode, r.thRate].map((header) => (
                  <th key={header} className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-gray-400" style={{ fontFamily: "var(--font-montserrat)" }}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={3} className="px-4 py-8 text-center text-sm text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>{r.none}</td></tr>
              ) : (
                filtered.map((i, idx) => {
                  const isFeatured = FEATURED_CURRENCIES.includes(i.code);
                  return (
                    <tr key={i.code} className={`border-b border-gray-100 transition-colors hover:bg-[#1A3A6B]/[0.06] ${idx % 2 === 1 ? "bg-gray-50" : "bg-white"}`}>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-2.5">
                          <CurrencyFlag code={i.code} size={22} />
                          <span suppressHydrationWarning className="text-gray-700 capitalize" style={{ fontFamily: "var(--font-lato)" }}>{i.name}</span>
                          {isFeatured && <Star size={11} className="shrink-0" style={{ color: "#E8520A" }} fill="#E8520A" />}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{i.code}</td>
                      <td className="px-4 py-3 font-black whitespace-nowrap" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
                        {nf.format(i.xaf)} <span className="text-xs text-gray-400 font-normal">FCFA</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>
          {filtered.length} {filtered.length > 1 ? r.countMany : r.countOne}
        </div>
      </div>
    </div>
  );
}
