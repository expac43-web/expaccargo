import Link from "next/link";
import { TrendingUp, ArrowRight } from "lucide-react";
import { xafPerUnit, FEATURED_CURRENCIES } from "@/lib/rates";
import { getServerLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n";
import CurrencyFlag from "@/components/public/CurrencyFlag";

// Résumé de quelques taux pour la page d'accueil (noms de devises localisés).
export default async function RatesSummary({ rates }: { rates: Record<string, number> }) {
  const locale = await getServerLocale();
  const t = getDictionary(locale);
  const nf = new Intl.NumberFormat(locale === "en" ? "en-US" : "fr-FR", { maximumFractionDigits: 0 });

  let dn: Intl.DisplayNames | null = null;
  try {
    dn = new Intl.DisplayNames([locale], { type: "currency" });
  } catch {
    dn = null;
  }
  const nameOf = (code: string) => {
    try {
      return dn?.of(code) ?? code;
    } catch {
      return code;
    }
  };

  const items = FEATURED_CURRENCIES
    .map((code) => ({ code, name: nameOf(code), xaf: xafPerUnit(rates, code) }))
    .filter((i): i is { code: string; name: string; xaf: number } => i.xaf != null);

  if (items.length === 0) return null;

  return (
    <section className="bg-gray-50 py-14 border-t border-gray-100">
      <div className="container-custom">
        <div className="flex items-center justify-between mb-7 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <TrendingUp size={18} style={{ color: "#E8520A" }} />
            <h2 className="text-lg md:text-xl font-black uppercase" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
              {t.rates.summaryTitle}
            </h2>
          </div>
          <Link href="/taux" className="text-xs font-black uppercase flex items-center gap-1 hover:opacity-70" style={{ color: "#E8520A", fontFamily: "var(--font-montserrat)" }}>
            {t.rates.allRates} <ArrowRight size={13} />
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map((i, idx) => (
            <div
              key={i.code}
              className="card-lift animate-fade-in-up bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center"
              style={{ animationDelay: `${idx * 0.07}s` }}
            >
              <div className="flex justify-center mb-2"><CurrencyFlag code={i.code} size={30} /></div>
              <p className="text-xs text-gray-400 mb-1" style={{ fontFamily: "var(--font-lato)" }}>1 {i.code}</p>
              <p className="text-2xl font-black" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>{nf.format(i.xaf)}</p>
              <p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: "var(--font-lato)" }}>FCFA · {i.name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
