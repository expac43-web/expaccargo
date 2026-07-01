import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import AgrementBadge from "@/components/public/AgrementBadge";
import Reveal from "@/components/public/Reveal";
import {
  Handshake, Target, ShieldCheck, CheckCircle2, MapPin, FileCheck2,
  AlertTriangle, Leaf, TrendingUp, Download, ArrowRight, Anchor,
} from "lucide-react";

const NAVY = "#1A3A6B";
const ORANGE = "#E8520A";

// Images de fond (optimisées AVIF/WebP par next/image, source volontairement modérée).
const HERO_BG = "https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=1600&q=55";
const PILLARS_BG = "https://images.unsplash.com/photo-1759216373394-91146ca977c7?auto=format&fit=crop&w=1600&q=55";
// Mosaïque de photos (style « service sur mesure »).
const MOSAIC_TALL = "https://images.unsplash.com/photo-1759216373394-91146ca977c7?auto=format&fit=crop&w=800&q=55";
const MOSAIC_A = "https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=700&q=55";
const MOSAIC_B = "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=700&q=55";

const capabilities = [
  { img: "/illustrations/transit.webp", label: "Transit douanier" },
  { img: "/illustrations/transport.webp", label: "Transport multimodal" },
  { img: "/illustrations/stockage.webp", label: "Stockage sécurisé" },
  { img: "/illustrations/consignation.webp", label: "Consignation maritime" },
  { img: "/illustrations/groupage.webp", label: "Groupage" },
  { img: "/illustrations/suivi.webp", label: "Suivi en temps réel" },
];

const benefits = [
  "Expédition internationale",
  "Dédouanement maîtrisé",
  "Suivi en temps réel",
  "Support dédié et à l'écoute",
  "Coûts logistiques optimisés",
  "Livraison rapide et soignée",
];

export const metadata: Metadata = {
  title: "À propos — EXPAC, commissionnaire agréé en douane au Congo",
  description:
    "EXPAC, commissionnaire agréé en douane et transitaire à Pointe-Noire et Brazzaville : votre partenaire logistique stratégique au Congo. Notre mission, notre expertise et notre engagement Qualité, Sécurité et Environnement (QSE).",
  alternates: { canonical: "https://expaccargo.com/a-propos" },
};

const points = [
  { icon: Handshake, title: "Un accompagnement sur-mesure", text: "Nous accompagnons entreprises, ONG et projets d'envergure dans la gestion intégrale de leurs opérations de commerce international. Nous concevons des solutions fluides, adaptées à la spécificité de chaque dossier, pour une coordination sans faille à chaque étape de votre chaîne d'approvisionnement." },
  { icon: Target, title: "Une expertise au service de votre performance", text: "Notre valeur ajoutée repose sur un triptyque : une présence locale ancrée sur le terrain, une maîtrise rigoureuse de la conformité réglementaire et une capacité proactive d'anticipation des risques portuaires et douaniers." },
  { icon: ShieldCheck, title: "Plus qu'un prestataire, un véritable allié", text: "Nous n'intervenons pas comme de simples prestataires, mais comme votre partenaire logistique. Cette vision partenariale nous pousse à nous investir pleinement dans la réussite de vos projets." },
  { icon: CheckCircle2, title: "Notre engagement : sécurité et efficacité", text: "Sécuriser vos flux, réduire vos coûts cachés et garantir la continuité de vos opérations. En choisissant EXPAC, vous optez pour une logistique maîtrisée, synonyme de sérénité et d'optimisation économique." },
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

/** Badge d'icône en dégradé de marque (plus présentable). */
function IconBadge({ icon: Icon, size = 64, iconSize = 30 }: { icon: React.ElementType; size?: number; iconSize?: number }) {
  return (
    <div
      className="rounded-2xl flex items-center justify-center shrink-0 shadow-md"
      style={{ width: size, height: size, background: `linear-gradient(135deg, ${NAVY} 0%, ${ORANGE} 100%)` }}
    >
      <Icon size={iconSize} strokeWidth={1.75} className="text-white" />
    </div>
  );
}

export default function AProposPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 pt-16">
        {/* ── HERO « Qui sommes-nous » (image de fond) ─────── */}
        <section className="relative overflow-hidden py-24 lg:py-36">
          <Image src={HERO_BG} alt="Porte-conteneurs au port — EXPAC" fill priority sizes="100vw" className="object-cover" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(120deg, rgba(11,30,64,0.94) 0%, rgba(26,58,107,0.86) 52%, rgba(36,77,134,0.55) 100%)" }} />
          <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full opacity-10" style={{ backgroundColor: ORANGE }} />
          <div className="container-custom relative z-10">
            <div className="max-w-3xl">
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
              <p className="text-xs font-black uppercase tracking-[0.25em] mb-4" style={{ color: ORANGE, fontFamily: "var(--font-montserrat)" }}>▪ Notre mission</p>
              <div className="w-14 h-1 mb-6 rounded-full" style={{ backgroundColor: ORANGE }} />
              <h2 className="text-3xl md:text-4xl font-black leading-tight" style={{ color: NAVY, fontFamily: "var(--font-montserrat)" }}>
                Le trait d'union entre vos activités locales et les marchés mondiaux
              </h2>
            </div>
            <div className="lg:col-span-7 space-y-5 text-gray-600 text-lg md:text-xl leading-relaxed" style={{ fontFamily: "var(--font-lato)" }}>
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

        {/* ── CAPACITÉS (bande d'icônes) ───────────────────── */}
        <section className="bg-white pb-16 lg:pb-20">
          <div className="container-custom">
            <Reveal>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-6 gap-y-10">
                {capabilities.map((c) => (
                  <div key={c.label} className="flex flex-col items-center text-center gap-3">
                    <Image src={c.img} alt={c.label} width={104} height={104} className="w-24 h-24 object-contain transition-transform duration-200 hover:-translate-y-1.5" />
                    <span className="text-sm font-black uppercase tracking-wide leading-tight" style={{ color: NAVY, fontFamily: "var(--font-montserrat)" }}>{c.label}</span>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── 4 ENGAGEMENTS (cartes numérotées) ────────────── */}
        <section className="bg-gray-50 py-20 lg:py-24">
          <div className="container-custom">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {points.map((p, i) => (
                <div key={p.title} className="group relative bg-white rounded-2xl border border-gray-100 p-8 card-lift overflow-hidden">
                  <span className="absolute right-5 top-3 text-7xl font-black leading-none select-none" style={{ color: "rgba(26,58,107,0.05)", fontFamily: "var(--font-montserrat)" }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="mb-5"><IconBadge icon={p.icon} /></div>
                  <h3 className="font-black text-lg mb-3 leading-tight relative z-10" style={{ color: NAVY, fontFamily: "var(--font-montserrat)" }}>
                    {p.title}
                  </h3>
                  <p className="text-base text-gray-600 leading-relaxed relative z-10" style={{ fontFamily: "var(--font-lato)" }}>
                    {p.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SERVICE SUR MESURE (mosaïque + checklist) ────── */}
        <section className="bg-white py-16 lg:py-24">
          <div className="container-custom">
            <div className="rounded-[2rem] p-6 md:p-10 lg:p-12" style={{ background: "linear-gradient(135deg, rgba(26,58,107,0.05) 0%, rgba(232,82,10,0.05) 100%)" }}>
              <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
                {/* Mosaïque de photos */}
                <Reveal className="grid grid-cols-2 gap-4">
                  <div className="relative rounded-2xl overflow-hidden aspect-[3/4] shadow-sm">
                    <Image src={MOSAIC_TALL} alt="Terminal à conteneurs" fill sizes="(max-width:1024px) 45vw, 24vw" className="object-cover" />
                  </div>
                  <div className="flex flex-col gap-4">
                    <div className="relative rounded-2xl overflow-hidden shadow-sm aspect-[4/3]">
                      <Image src={MOSAIC_A} alt="Fret maritime" fill sizes="(max-width:1024px) 45vw, 24vw" className="object-cover" />
                    </div>
                    <div className="relative rounded-2xl overflow-hidden shadow-sm aspect-[4/3]">
                      <Image src={MOSAIC_B} alt="Fret aérien" fill sizes="(max-width:1024px) 45vw, 24vw" className="object-cover" />
                    </div>
                  </div>
                </Reveal>

                {/* Texte + checklist */}
                <Reveal delay={120}>
                  <h2 className="text-3xl md:text-4xl font-black leading-tight mb-6" style={{ color: NAVY, fontFamily: "var(--font-montserrat)" }}>
                    Nous répondons à vos besoins par un <span style={{ color: ORANGE }}>service sur mesure</span>
                  </h2>
                  <div className="grid sm:grid-cols-2 gap-x-6 gap-y-4 mb-8">
                    {benefits.map((b) => (
                      <div key={b} className="flex items-center gap-2.5">
                        <CheckCircle2 size={20} className="shrink-0" style={{ color: ORANGE }} />
                        <span className="text-base text-gray-700" style={{ fontFamily: "var(--font-lato)" }}>{b}</span>
                      </div>
                    ))}
                  </div>
                  <Link href="/services" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-black text-white uppercase tracking-wide text-sm transition-all hover:scale-105" style={{ backgroundColor: NAVY, fontFamily: "var(--font-montserrat)" }}>
                    En savoir plus <ArrowRight size={16} />
                  </Link>
                </Reveal>
              </div>
            </div>
          </div>
        </section>

        {/* ── 3 PILIERS (image de fond + overlay navy) ─────── */}
        <section className="relative overflow-hidden py-20 lg:py-28">
          <Image src={PILLARS_BG} alt="Terminal à conteneurs" fill sizes="100vw" className="object-cover" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(14,34,72,0.94) 0%, rgba(26,58,107,0.9) 100%)" }} />
          <div className="container-custom relative z-10">
            <div className="text-center mb-14">
              <p className="text-xs font-black uppercase tracking-[0.25em] mb-4" style={{ color: "#fba563", fontFamily: "var(--font-montserrat)" }}>▪ Nos piliers</p>
              <h2 className="text-3xl md:text-4xl font-black text-white uppercase" style={{ fontFamily: "var(--font-montserrat)" }}>
                Une expertise ancrée sur le terrain
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {pillars.map((p) => (
                <div key={p.title} className="rounded-2xl p-8 text-center border border-white/10 backdrop-blur-sm" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
                  <div className="mx-auto mb-5 w-fit"><IconBadge icon={p.icon} size={68} iconSize={32} /></div>
                  <h3 className="text-white font-black text-lg uppercase mb-3" style={{ fontFamily: "var(--font-montserrat)" }}>{p.title}</h3>
                  <p className="text-blue-100 text-base leading-relaxed" style={{ fontFamily: "var(--font-lato)" }}>{p.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── ENGAGEMENT QSE ───────────────────────────────── */}
        <section className="bg-white py-20 lg:py-24">
          <div className="container-custom grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            <div className="lg:col-span-4">
              <div className="rounded-3xl p-8 flex flex-col gap-4" style={{ background: "linear-gradient(135deg, rgba(26,58,107,0.06), rgba(232,82,10,0.06))" }}>
                {[
                  { l: "Q", w: "Qualité" },
                  { l: "S", w: "Sécurité" },
                  { l: "E", w: "Environnement" },
                ].map((x) => (
                  <div key={x.l} className="flex items-center gap-4">
                    <span className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black text-white shrink-0 shadow-md" style={{ background: `linear-gradient(135deg, ${NAVY}, ${ORANGE})`, fontFamily: "var(--font-montserrat)" }}>
                      {x.l}
                    </span>
                    <span className="font-black uppercase tracking-wide text-lg" style={{ color: NAVY, fontFamily: "var(--font-montserrat)" }}>{x.w}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-8">
              <p className="text-xs font-black uppercase tracking-[0.25em] mb-4" style={{ color: ORANGE, fontFamily: "var(--font-montserrat)" }}>▪ Engagement QSE</p>
              <h2 className="text-3xl md:text-4xl font-black leading-tight mb-5" style={{ color: NAVY, fontFamily: "var(--font-montserrat)" }}>
                L'excellence, indissociable de notre responsabilité
              </h2>
              <p className="text-gray-600 text-lg md:text-xl leading-relaxed mb-8" style={{ fontFamily: "var(--font-lato)" }}>
                Conscients des enjeux liés à notre secteur, nous avons fait le choix stratégique d'intégrer une
                démarche <strong style={{ color: NAVY }}>Qualité, Sécurité et Environnement</strong> au cœur même de notre
                organisation — dans le respect strict des normes et des exigences de sécurité les plus rigoureuses.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {qse.map((q) => (
                  <div key={q.title} className="rounded-2xl border border-gray-100 p-6 bg-gray-50">
                    <div className="flex items-center gap-3 mb-3">
                      <IconBadge icon={q.icon} size={52} iconSize={26} />
                      <h3 className="font-black text-base" style={{ color: NAVY, fontFamily: "var(--font-montserrat)" }}>{q.title}</h3>
                    </div>
                    <p className="text-base text-gray-600 leading-relaxed" style={{ fontFamily: "var(--font-lato)" }}>{q.text}</p>
                  </div>
                ))}
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
                  <p className="text-xs font-black uppercase tracking-[0.25em] mb-4" style={{ color: "#fba563", fontFamily: "var(--font-montserrat)" }}>▪ Documentation & contact</p>
                  <h2 className="text-2xl md:text-3xl font-black text-white uppercase leading-tight mb-3" style={{ fontFamily: "var(--font-montserrat)" }}>
                    Découvrez EXPAC plus en détail
                  </h2>
                  <p className="text-blue-100 text-lg mb-6" style={{ fontFamily: "var(--font-lato)" }}>
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
