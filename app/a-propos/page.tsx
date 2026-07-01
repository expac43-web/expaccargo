import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import AgrementBadge from "@/components/public/AgrementBadge";
import {
  Handshake, Target, ShieldCheck, CheckCircle2, MapPin, FileCheck2,
  AlertTriangle, Leaf, TrendingUp, Download, ArrowRight, Anchor,
} from "lucide-react";

const NAVY = "#1A3A6B";
const ORANGE = "#E8520A";

export const metadata: Metadata = {
  title: "À propos — EXPAC, commissionnaire agréé en douane au Congo",
  description:
    "EXPAC, commissionnaire agréé en douane et transitaire à Pointe-Noire et Brazzaville : votre partenaire logistique stratégique au Congo. Notre mission, notre expertise et notre engagement Qualité, Sécurité et Environnement (QSE).",
  alternates: { canonical: "https://expaccargo.com/a-propos" },
};

const points = [
  {
    icon: Handshake,
    title: "Un accompagnement sur-mesure",
    text: "Nous accompagnons entreprises, ONG et projets d'envergure dans la gestion intégrale de leurs opérations de commerce international. Nous concevons des solutions fluides, adaptées à la spécificité de chaque dossier, pour une coordination sans faille à chaque étape de votre chaîne d'approvisionnement.",
  },
  {
    icon: Target,
    title: "Une expertise au service de votre performance",
    text: "Notre valeur ajoutée repose sur un triptyque : une présence locale ancrée sur le terrain, une maîtrise rigoureuse de la conformité réglementaire et une capacité proactive d'anticipation des risques portuaires et douaniers.",
  },
  {
    icon: ShieldCheck,
    title: "Plus qu'un prestataire, un véritable allié",
    text: "Nous n'intervenons pas comme de simples prestataires, mais comme votre partenaire logistique. Cette vision partenariale nous pousse à nous investir pleinement dans la réussite de vos projets.",
  },
  {
    icon: CheckCircle2,
    title: "Notre engagement : sécurité et efficacité",
    text: "Sécuriser vos flux, réduire vos coûts cachés et garantir la continuité de vos opérations. En choisissant EXPAC, vous optez pour une logistique maîtrisée, synonyme de sérénité et d'optimisation économique.",
  },
];

const pillars = [
  { icon: MapPin, title: "Présence locale", text: "Des équipes implantées à Pointe-Noire et Brazzaville, au plus près des ports et des administrations." },
  { icon: FileCheck2, title: "Conformité réglementaire", text: "Une maîtrise rigoureuse des formalités douanières et des normes en vigueur." },
  { icon: AlertTriangle, title: "Anticipation des risques", text: "Une approche proactive des aléas portuaires et douaniers pour fluidifier vos échanges." },
];

const qse = [
  { icon: Leaf, title: "Pérennité & conformité", text: "Notre démarche QSE est le fondement de notre stratégie de développement : allier rigueur professionnelle et respect de l'environnement pour que chaque prestation contribue à la pérennité de vos opérations." },
  { icon: TrendingUp, title: "Amélioration continue", text: "La satisfaction de notre clientèle est le pivot de notre activité. Suivi rigoureux, analyse de nos indicateurs et ajustement permanent : nous transformons chaque expérience logistique en opportunité de progrès." },
];

function Eyebrow({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <p className="text-xs font-black uppercase tracking-[0.25em] mb-4" style={{ color: light ? "#fba563" : ORANGE, fontFamily: "var(--font-montserrat)" }}>
      ▪ {children}
    </p>
  );
}

export default function AProposPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 pt-16">
        {/* ── HERO ─────────────────────────────────────────── */}
        <section className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0b1e40 0%, #1A3A6B 55%, #244d86 100%)" }}>
          <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full opacity-10" style={{ backgroundColor: ORANGE }} />
          <div className="absolute -left-16 bottom-0 w-72 h-72 rounded-full opacity-10" style={{ backgroundColor: "#ffffff" }} />
          <div className="container-custom relative z-10 py-20 lg:py-28">
            <div className="max-w-3xl">
              <Eyebrow light>À propos</Eyebrow>
              <h1 className="text-4xl md:text-6xl font-black text-white uppercase leading-[1.05] mb-6" style={{ fontFamily: "var(--font-montserrat)" }}>
                Qui sommes-<span style={{ color: ORANGE }}>nous</span> ?
              </h1>
              <p className="text-lg md:text-xl text-blue-100 leading-relaxed mb-8 max-w-2xl" style={{ fontFamily: "var(--font-lato)" }}>
                EXPAC, votre partenaire logistique stratégique au Congo — commissionnaire agréé en douane
                et transitaire, solidement implanté à Pointe-Noire et Brazzaville.
              </p>
              <AgrementBadge tone="dark" />
            </div>
          </div>
        </section>

        {/* ── MISSION (deux colonnes) ──────────────────────── */}
        <section className="bg-white py-20 lg:py-24">
          <div className="container-custom grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
            <div className="lg:col-span-5">
              <Eyebrow>Notre mission</Eyebrow>
              <div className="w-14 h-1 mb-6 rounded-full" style={{ backgroundColor: ORANGE }} />
              <h2 className="text-3xl md:text-4xl font-black leading-tight" style={{ color: NAVY, fontFamily: "var(--font-montserrat)" }}>
                Le trait d'union entre vos activités locales et les marchés mondiaux
              </h2>
            </div>
            <div className="lg:col-span-7 space-y-5 text-gray-600 text-base md:text-lg leading-relaxed" style={{ fontFamily: "var(--font-lato)" }}>
              <p>
                EXPAC s'impose comme un opérateur logistique de premier plan, offrant une gamme exhaustive
                de prestations adaptées aux exigences complexes du commerce international.
              </p>
              <p>
                En tant que <strong style={{ color: NAVY }}>commissionnaire agréé en douane</strong> et transitaire,
                nous agissons comme le trait d'union indispensable entre vos opérations et les échanges internationaux —
                avec une exigence constante de fluidité, de conformité et de fiabilité.
              </p>
            </div>
          </div>
        </section>

        {/* ── 4 ENGAGEMENTS (cartes numérotées) ────────────── */}
        <section className="bg-gray-50 py-20 lg:py-24">
          <div className="container-custom">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {points.map((p, i) => {
                const Icon = p.icon;
                return (
                  <div key={p.title} className="group relative bg-white rounded-2xl border border-gray-100 p-8 card-lift overflow-hidden">
                    <span className="absolute right-5 top-3 text-7xl font-black leading-none select-none" style={{ color: "rgba(26,58,107,0.05)", fontFamily: "var(--font-montserrat)" }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ backgroundColor: "rgba(232,82,10,0.1)" }}>
                      <Icon size={22} style={{ color: ORANGE }} />
                    </div>
                    <h3 className="font-black text-lg mb-3 leading-tight relative z-10" style={{ color: NAVY, fontFamily: "var(--font-montserrat)" }}>
                      {p.title}
                    </h3>
                    <p className="text-sm text-gray-500 leading-relaxed relative z-10" style={{ fontFamily: "var(--font-lato)" }}>
                      {p.text}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── 3 PILIERS (bande navy) ───────────────────────── */}
        <section className="relative overflow-hidden py-20 lg:py-24" style={{ background: "linear-gradient(135deg, #0e2248 0%, #1A3A6B 100%)" }}>
          <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 46px)" }} />
          <div className="container-custom relative z-10">
            <div className="text-center mb-14">
              <Eyebrow light>Nos piliers</Eyebrow>
              <h2 className="text-3xl md:text-4xl font-black text-white uppercase" style={{ fontFamily: "var(--font-montserrat)" }}>
                Une expertise ancrée sur le terrain
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {pillars.map((p) => {
                const Icon = p.icon;
                return (
                  <div key={p.title} className="rounded-2xl p-8 text-center border border-white/10" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ backgroundColor: "rgba(232,82,10,0.2)" }}>
                      <Icon size={26} style={{ color: "#fba563" }} />
                    </div>
                    <h3 className="text-white font-black text-lg uppercase mb-3" style={{ fontFamily: "var(--font-montserrat)" }}>{p.title}</h3>
                    <p className="text-blue-200 text-sm leading-relaxed" style={{ fontFamily: "var(--font-lato)" }}>{p.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── ENGAGEMENT QSE ───────────────────────────────── */}
        <section className="bg-white py-20 lg:py-24">
          <div className="container-custom grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Bloc lettres QSE */}
            <div className="lg:col-span-4">
              <div className="rounded-3xl p-8 flex flex-col gap-4" style={{ background: "linear-gradient(135deg, rgba(26,58,107,0.06), rgba(232,82,10,0.06))" }}>
                {[
                  { l: "Q", w: "Qualité" },
                  { l: "S", w: "Sécurité" },
                  { l: "E", w: "Environnement" },
                ].map((x) => (
                  <div key={x.l} className="flex items-center gap-4">
                    <span className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black text-white shrink-0" style={{ background: `linear-gradient(135deg, ${NAVY}, ${ORANGE})`, fontFamily: "var(--font-montserrat)" }}>
                      {x.l}
                    </span>
                    <span className="font-black uppercase tracking-wide" style={{ color: NAVY, fontFamily: "var(--font-montserrat)" }}>{x.w}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-8">
              <Eyebrow>Engagement QSE</Eyebrow>
              <h2 className="text-3xl md:text-4xl font-black leading-tight mb-5" style={{ color: NAVY, fontFamily: "var(--font-montserrat)" }}>
                L'excellence, indissociable de notre responsabilité
              </h2>
              <p className="text-gray-600 text-base md:text-lg leading-relaxed mb-8" style={{ fontFamily: "var(--font-lato)" }}>
                Conscients des enjeux liés à notre secteur, nous avons fait le choix stratégique d'intégrer une
                démarche <strong style={{ color: NAVY }}>Qualité, Sécurité et Environnement</strong> au cœur même de notre
                organisation — dans le respect strict des normes et des exigences de sécurité les plus rigoureuses.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {qse.map((q) => {
                  const Icon = q.icon;
                  return (
                    <div key={q.title} className="rounded-2xl border border-gray-100 p-6 bg-gray-50">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "rgba(232,82,10,0.1)" }}>
                          <Icon size={20} style={{ color: ORANGE }} />
                        </div>
                        <h3 className="font-black text-base" style={{ color: NAVY, fontFamily: "var(--font-montserrat)" }}>{q.title}</h3>
                      </div>
                      <p className="text-sm text-gray-500 leading-relaxed" style={{ fontFamily: "var(--font-lato)" }}>{q.text}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ── DOCUMENTATION + CTA ──────────────────────────── */}
        <section className="bg-gray-50 py-20 lg:py-24">
          <div className="container-custom">
            <div className="rounded-3xl p-10 md:p-14 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0e2248 0%, #1A3A6B 60%, #2a5298 100%)" }}>
              <div className="absolute right-0 bottom-0 w-72 h-72 rounded-full opacity-10" style={{ backgroundColor: ORANGE, transform: "translate(30%, 30%)" }} />
              <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
                <div className="max-w-xl">
                  <Eyebrow light>Documentation & contact</Eyebrow>
                  <h2 className="text-2xl md:text-3xl font-black text-white uppercase leading-tight mb-3" style={{ fontFamily: "var(--font-montserrat)" }}>
                    Découvrez EXPAC plus en détail
                  </h2>
                  <p className="text-blue-200 mb-6" style={{ fontFamily: "var(--font-lato)" }}>
                    Brochure de présentation et politique QSE disponibles sur simple demande.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Link href="/contact" className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-black uppercase tracking-wide border border-white/25 text-white hover:bg-white/10 transition-all" style={{ fontFamily: "var(--font-montserrat)" }}>
                      <Download size={16} /> Brochure EXPAC
                    </Link>
                    <Link href="/contact" className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-black uppercase tracking-wide border border-white/25 text-white hover:bg-white/10 transition-all" style={{ fontFamily: "var(--font-montserrat)" }}>
                      <Download size={16} /> Politique QSE
                    </Link>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row lg:flex-col gap-4 shrink-0">
                  <Link href="/devis" className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl font-bold text-white transition-all hover:scale-105 whitespace-nowrap uppercase tracking-wide text-sm" style={{ backgroundColor: ORANGE, fontFamily: "var(--font-montserrat)" }}>
                    Demander un devis <ArrowRight size={18} />
                  </Link>
                  <Link href="/contact" className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl font-bold text-white border border-white/30 hover:bg-white/10 transition-all whitespace-nowrap uppercase tracking-wide text-sm" style={{ fontFamily: "var(--font-montserrat)" }}>
                    <Anchor size={16} /> Nous contacter
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
