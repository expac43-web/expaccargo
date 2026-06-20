import type { Metadata } from "next";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import DevisCalculator from "@/components/public/DevisCalculator";
import { sbGet } from "@/lib/supabase-admin";
import type { Tariff } from "@/lib/tariffs";
import { Calculator } from "lucide-react";
import { getServerDict } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "Calculateur de devis — Estimation de transport",
  description:
    "Estimez le coût de votre expédition en quelques secondes avec le calculateur EXPAC. Prix indicatif selon le trajet, le poids et le volume.",
  alternates: { canonical: "https://expaccargoltd.com/calculateur" },
};

async function getActiveTariffs(): Promise<Tariff[]> {
  return sbGet<Tariff>("Tariff", "isActive=eq.true&select=*&order=serviceType.asc");
}

export default async function CalculateurPage() {
  const tariffs = await getActiveTariffs();
  const t = await getServerDict();
  const c = t.calculator;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        <div className="relative py-16 overflow-hidden" style={{ background: "linear-gradient(135deg, #0e2248 0%, #1A3A6B 60%, #2a5298 100%)" }}>
          <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full opacity-10" style={{ backgroundColor: "#E8520A" }} />
          <div className="container-custom relative z-10">
            <p className="text-xs font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2" style={{ color: "#fba563", fontFamily: "var(--font-montserrat)" }}>
              <Calculator size={14} /> {c.eyebrow}
            </p>
            <h1 className="text-4xl lg:text-5xl font-black text-white uppercase leading-tight mb-4" style={{ fontFamily: "var(--font-montserrat)" }}>
              {c.titlePre} <span style={{ color: "#E8520A" }}>{c.titleHighlight}</span>
            </h1>
            <p className="text-blue-200 max-w-xl" style={{ fontFamily: "var(--font-lato)" }}>
              {c.subtitlePre} <strong className="text-white">{c.subtitleStrong}</strong>{c.subtitlePost}
            </p>
          </div>
        </div>

        <div className="bg-gray-50 py-12">
          <div className="container-custom">
            <DevisCalculator tariffs={tariffs} />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
