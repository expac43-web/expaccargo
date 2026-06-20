import type { Metadata } from "next";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import { getRates } from "@/lib/rates";
import RatesTable from "@/components/public/RatesTable";
import { TrendingUp, AlertCircle } from "lucide-react";
import { getServerLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Taux de change du jour — Franc CFA (XAF)",
  description:
    "Consultez les taux de change du jour en Franc CFA (XAF) : EUR, USD, CNY et toutes les devises. Mis à jour quotidiennement par Express Africa Cargo.",
  alternates: { canonical: "https://expaccargoltd.com/taux" },
};

function formatUpdated(s: string, dl: string): string {
  if (!s) return "";
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString(dl, { day: "numeric", month: "long", year: "numeric" });
}

export default async function TauxPage() {
  const data = await getRates();
  const locale = await getServerLocale();
  const t = getDictionary(locale);
  const r = t.rates;
  const dl = locale === "en" ? "en-US" : "fr-FR";

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        {/* Header */}
        <div className="relative py-16 overflow-hidden" style={{ background: "linear-gradient(135deg, #0e2248 0%, #1A3A6B 60%, #2a5298 100%)" }}>
          <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full opacity-10" style={{ backgroundColor: "#E8520A" }} />
          <div className="container-custom relative z-10">
            <p className="text-xs font-black uppercase tracking-[0.2em] mb-4" style={{ color: "#fba563", fontFamily: "var(--font-montserrat)" }}>
              ▪ {r.eyebrow}
            </p>
            <h1 className="text-4xl lg:text-5xl font-black text-white uppercase leading-tight mb-4" style={{ fontFamily: "var(--font-montserrat)" }}>
              {r.titlePre} <span style={{ color: "#E8520A" }}>{r.titleHighlight}</span>
            </h1>
            <p className="text-blue-200 max-w-xl" style={{ fontFamily: "var(--font-lato)" }}>
              {r.subtitle}{data?.updated ? ` — ${r.updatedPrefix} ${formatUpdated(data.updated, dl)}` : ""}.
            </p>
          </div>
        </div>

        <div className="bg-gray-50 py-12">
          <div className="container-custom">
            {!data ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
                <AlertCircle size={32} className="mx-auto mb-3 text-gray-300" />
                <p className="text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>{r.unavailable}</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-5 text-xs text-gray-500" style={{ fontFamily: "var(--font-lato)" }}>
                  <TrendingUp size={14} style={{ color: "#16a34a" }} />
                  {r.indicative}
                </div>
                <RatesTable rates={data.rates} />
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
