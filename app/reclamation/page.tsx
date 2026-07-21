import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import { AlertCircle, ArrowRight } from "lucide-react";

const NAVY = "#1A3A6B";
const ORANGE = "#E8520A";

export const metadata: Metadata = {
  title: "Réclamation — EXPAC",
  description:
    "Déposez une réclamation auprès d'EXPAC, commissionnaire agréé en douane et transitaire au Congo (Pointe-Noire & Brazzaville).",
  alternates: { canonical: "https://www.expaccargo.com/reclamation" },
  // Page en préparation : désindexée tant que le contenu définitif n'est pas en ligne.
  robots: { index: false, follow: true },
};

export default function ReclamationPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 pt-16">
        {/* ── HERO ─────────────────────────────────────────────── */}
        <section className="relative overflow-hidden py-24 lg:py-32" style={{ background: "linear-gradient(120deg, #0e2248 0%, #1A3A6B 55%, #24407e 100%)" }}>
          <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full opacity-10" style={{ backgroundColor: ORANGE }} />
          <div className="container-custom relative z-10">
            <div className="max-w-3xl">
              <p className="text-xs font-black uppercase tracking-[0.25em] mb-4" style={{ color: "#fba563", fontFamily: "var(--font-montserrat)" }}>▪ À propos</p>
              <h1 className="text-4xl md:text-6xl font-black text-white uppercase leading-[1.05] mb-6" style={{ fontFamily: "var(--font-montserrat)" }}>
                Réclamation
              </h1>
              <p className="text-lg md:text-xl text-blue-100 leading-relaxed max-w-2xl" style={{ fontFamily: "var(--font-lato)" }}>
                Votre satisfaction est au cœur de nos priorités. Cette page vous permettra prochainement
                de déposer et de suivre vos réclamations.
              </p>
            </div>
          </div>
        </section>

        {/* ── PLACEHOLDER (contenu à venir) ────────────────────── */}
        <section className="bg-white py-20 lg:py-28">
          <div className="container-custom">
            <div className="max-w-2xl mx-auto text-center">
              <div className="mx-auto mb-6 w-16 h-16 rounded-2xl flex items-center justify-center shadow-md" style={{ background: `linear-gradient(135deg, ${NAVY}, ${ORANGE})` }}>
                <AlertCircle size={30} strokeWidth={1.75} className="text-white" />
              </div>
              <h2 className="text-2xl md:text-3xl font-black mb-4" style={{ color: NAVY, fontFamily: "var(--font-montserrat)" }}>
                Page en cours de préparation
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed mb-8" style={{ fontFamily: "var(--font-lato)" }}>
                Le contenu de cette page sera ajouté prochainement. En attendant, pour toute réclamation,
                n&apos;hésitez pas à nous contacter directement — notre équipe traitera votre demande dans les meilleurs délais.
              </p>
              <Link href="/contact" className="inline-flex items-center gap-2 px-7 py-4 rounded-xl font-black text-white uppercase tracking-wide text-sm transition-all hover:scale-105" style={{ backgroundColor: NAVY, fontFamily: "var(--font-montserrat)" }}>
                Nous contacter <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
