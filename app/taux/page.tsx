import type { Metadata } from "next";
import Image from "next/image";
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
  alternates: { canonical: "https://expaccargo.com/taux" },
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
    <div className="min-h-screen flex flex-col relative">
      {/* Fond planisphère — couche fixe plein écran, discrète et non étirée */}
      <div
        aria-hidden
        className="fixed inset-0 -z-10 pointer-events-none"
        style={{
          backgroundColor: "#eef1f6",
          backgroundImage: "url('/illustrations/fond.webp')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />
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

        {/* Bandeau illustration devises — change.webp est ici pleinement visible */}
        <div className="relative h-56 md:h-72 overflow-hidden">
          <Image
            src="/illustrations/change.webp"
            alt="Devises internationales — dollar, euro, livre, yen, roupie"
            fill
            priority
            sizes="100vw"
            className="object-cover"
            style={{ objectPosition: "center 40%" }}
          />
          {/* Voile léger, uniquement en bas, pour fondre le bandeau dans la section */}
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(180deg, rgba(11,30,64,0.12) 0%, rgba(238,241,246,0) 42%, rgba(238,241,246,0.55) 78%, #eef1f6 100%)" }}
          />
          <div className="container-custom relative z-10 h-full flex items-end pb-6">
            <p className="text-sm md:text-base font-black uppercase tracking-[0.15em]" style={{ color: "#0e2248", fontFamily: "var(--font-montserrat)" }}>
              {locale === "en" ? "International currencies" : "Devises internationales"}
            </p>
          </div>
        </div>

        {/* Section table — fond translucide : le planisphère reste visible derrière */}
        <div className="relative pt-10 pb-16">
          <div className="container-custom relative z-10">
            {!data ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
                <AlertCircle size={32} className="mx-auto mb-3 text-gray-300" />
                <p className="text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>{r.unavailable}</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-5 text-xs text-gray-600" style={{ fontFamily: "var(--font-lato)" }}>
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
