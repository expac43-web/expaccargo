import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import AgrementBadge from "@/components/public/AgrementBadge";
import Reveal from "@/components/public/Reveal";
import { Download, ArrowRight, Anchor } from "lucide-react";

const NAVY = "#1A3A6B";
const ORANGE = "#E8520A";

// Bannière du hero (en-tête de page).
const HERO_BG = "https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=1600&q=55";
// Visuels d'accompagnement (2 par section) — vérifiés.
const IMG_QSN_1 = "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=55"; // équipe / coordination
const IMG_QSN_2 = "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=800&q=55"; // poignée de main / partenariat
const IMG_QSE_1 = "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=800&q=55"; // panneaux solaires / environnement
const IMG_QSE_2 = "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=800&q=55"; // documents / conformité

type Item = { title: string; text: string };
type DownloadCta = { href: string; label: string; filename?: string };

// ── SECTION 1 — Qui sommes-nous (texte du document) ──
const quiSommesNous = {
  lead: "EXPAC : votre partenaire logistique stratégique au Congo",
  intro:
    "EXPAC s'impose comme un opérateur logistique de premier plan, offrant une gamme exhaustive de prestations adaptées aux exigences complexes du commerce international. En tant que commissionnaire agréé en douane et transitaire solidement implanté à Pointe-Noire et Brazzaville, nous agissons comme le trait d'union indispensable entre vos activités locales et les marchés mondiaux.",
  items: [
    {
      title: "Un accompagnement sur-mesure pour vos opérations",
      text: "Nous accompagnons les entreprises, les organisations non gouvernementales (ONG) ainsi que les projets d'envergure dans la gestion intégrale de leurs opérations d'importation et d'exportation. Notre approche ne se limite pas à la simple exécution de tâches logistiques ; nous concevons des solutions fluides qui s'adaptent à la spécificité de chaque dossier, garantissant une coordination sans faille à chaque étape de votre chaîne d'approvisionnement.",
    },
    {
      title: "Une expertise au service de votre performance",
      text: "Notre valeur ajoutée repose sur un triptyque fondamental : une présence locale ancrée sur le terrain, une maîtrise rigoureuse de la conformité réglementaire, et une capacité proactive d'anticipation des risques liés aux environnements portuaires et douaniers. Cette expertise nous permet de naviguer avec précision dans les complexités administratives, assurant ainsi la fluidité de vos échanges commerciaux dans un contexte économique exigeant.",
    },
    {
      title: "Plus qu'un prestataire, un véritable allié",
      text: "Chez EXPAC, nous avons fait le choix de la collaboration étroite : nous n'intervenons pas comme de simples prestataires, mais comme votre partenaire logistique. Cette vision partenariale nous pousse à nous investir pleinement dans la réussite de vos projets, en intégrant vos enjeux opérationnels au cœur même de notre stratégie de service.",
    },
    {
      title: "Notre engagement : sécurité et efficacité",
      text: "Notre objectif est simple et clair : sécuriser vos flux, réduire vos coûts cachés et garantir la continuité absolue de vos opérations. En choisissant EXPAC, vous optez pour une logistique maîtrisée, synonyme de sérénité et d'optimisation économique, vous permettant ainsi de vous concentrer pleinement sur votre cœur de métier.",
    },
  ] as Item[],
  images: [IMG_QSN_1, IMG_QSN_2],
  download: { href: "/Brochure.pdf", label: "Télécharger la brochure" } as DownloadCta,
};

// ── SECTION 2 — Engagement QSE (texte du document) ──
const engagementQSE = {
  lead: "L'Engagement Qualité, Sécurité et Environnement (QSE) d'EXPAC",
  intro:
    "Chez EXPAC, l'excellence opérationnelle est indissociable de notre responsabilité sociétale. Conscients des enjeux liés à notre secteur d'activité, nous avons fait le choix stratégique d'intégrer une démarche Qualité, Sécurité et Environnement (QSE) au cœur même de notre organisation. Cet engagement témoigne de notre volonté d'offrir des services de haute performance, dans le respect strict des normes environnementales et des exigences de sécurité les plus rigoureuses.",
  items: [
    {
      title: "Une vision axée sur la pérennité et la conformité",
      text: "Notre démarche QSE ne constitue pas seulement un cadre de travail ; elle représente le fondement de notre stratégie de développement. En alliant rigueur professionnelle et respect de notre environnement, nous nous assurons que chaque prestation délivrée par EXPAC contribue à la pérennité de vos opérations. Nous veillons scrupuleusement à ce que nos processus répondent non seulement aux standards du marché, mais également à vos attentes les plus exigeantes en matière de sécurité et de conformité.",
    },
    {
      title: "Le moteur de notre amélioration continue",
      text: "La satisfaction de notre clientèle est le pivot central de notre activité. Pour l'atteindre, nous avons instauré une culture d'amélioration continue qui imprègne chaque niveau de notre structure. Grâce à un suivi rigoureux, à l'analyse systématique de nos indicateurs de performance et à une capacité d'ajustement permanent, nous transformons chaque expérience logistique en une opportunité de progrès. Chez EXPAC, nous nous engageons à optimiser sans cesse nos méthodes pour garantir non seulement la fiabilité de nos services, mais aussi la sérénité de vos échanges commerciaux.",
    },
  ] as Item[],
  images: [IMG_QSE_1, IMG_QSE_2],
  download: { href: "/DI01-POLITIQUE%20QSE%20EXPAC.pdf", label: "Télécharger la politique QSE", filename: "Politique-QSE-EXPAC.pdf" } as DownloadCta,
};

// ── SECTION 3 — Plate-forme e-EXPAC (texte du document) ──
const ePlatform = {
  intro:
    "Cet espace est réservé au personnel d'EXPAC Cargo. Une fois l'accès autorisé, il se divise en trois parties.",
  items: [
    { title: "Info-personnel", text: "Nom et prénom, fonction, n° de téléphone, e-mail." },
    { title: "Courrier", text: "Courrier inter-entreprise." },
    { title: "Documentaire", text: "Documents PDF pour assurer le respect de la qualité." },
  ] as Item[],
};

export const metadata: Metadata = {
  title: "À propos — EXPAC, commissionnaire agréé en douane au Congo",
  description:
    "EXPAC, commissionnaire agréé en douane et transitaire à Pointe-Noire et Brazzaville : votre partenaire logistique stratégique au Congo. Notre mission, notre expertise et notre engagement Qualité, Sécurité et Environnement (QSE).",
  alternates: { canonical: "https://www.expaccargo.com/a-propos" },
};

/** Colonne d'images décoratives (sticky) affichée à côté du texte. */
function SideImages({ images, alt }: { images: string[]; alt: string }) {
  return (
    <Reveal delay={120} className="lg:sticky lg:top-24">
      <div className="relative">
        {/* Accent de marque en fond (décoratif) */}
        <div className="hidden lg:block absolute -top-5 -left-5 w-28 h-28 rounded-3xl" style={{ background: `linear-gradient(135deg, ${ORANGE}, ${NAVY})`, opacity: 0.18 }} />
        <div className="relative space-y-5">
          <div className="relative rounded-3xl overflow-hidden shadow-xl aspect-[4/3]">
            <Image src={images[0]} alt={alt} fill sizes="(max-width:1024px) 100vw, 42vw" className="object-cover" />
          </div>
          {images[1] ? (
            <div className="relative rounded-3xl overflow-hidden shadow-lg aspect-[16/10]">
              <Image src={images[1]} alt="" fill sizes="(max-width:1024px) 100vw, 42vw" className="object-cover" />
            </div>
          ) : null}
        </div>
      </div>
    </Reveal>
  );
}

/** Section de contenu : grand titre + intro + sous-titres/paragraphes (justifiés), image(s) optionnelle(s) à côté et bouton de téléchargement optionnel en fin. */
function TextSection({ title, lead, intro, items, images, download, alt = false }: {
  title: string; lead?: string; intro?: string; items: Item[]; images?: string[]; download?: DownloadCta; alt?: boolean;
}) {
  const hasImages = !!images && images.length > 0;
  return (
    <section className={`py-20 lg:py-24 ${alt ? "bg-gray-50" : "bg-white"}`}>
      <div className="container-custom">
        <div className={hasImages ? "grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start" : ""}>
          {/* Colonne texte */}
          <div className={hasImages ? "lg:col-span-7" : "max-w-4xl"}>
            <Reveal>
              <div className="w-14 h-1.5 mb-6 rounded-full" style={{ backgroundColor: ORANGE }} />
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black uppercase leading-tight mb-6" style={{ color: NAVY, fontFamily: "var(--font-montserrat)" }}>
                {title}
              </h2>
              {lead ? (
                <p className="text-xl md:text-2xl font-black leading-snug mb-5" style={{ color: NAVY, fontFamily: "var(--font-montserrat)" }}>
                  {lead}
                </p>
              ) : null}
              {intro ? (
                <p className="text-gray-600 text-lg md:text-xl leading-relaxed text-justify" style={{ fontFamily: "var(--font-lato)" }}>
                  {intro}
                </p>
              ) : null}
            </Reveal>

            <div className="mt-12 lg:mt-14 space-y-10 lg:space-y-12">
              {items.map((it) => (
                <Reveal key={it.title}>
                  <h3 className="text-xl md:text-2xl font-black leading-tight mb-3" style={{ color: NAVY, fontFamily: "var(--font-montserrat)" }}>
                    {it.title}
                  </h3>
                  <p className="text-gray-600 text-base md:text-lg leading-relaxed text-justify" style={{ fontFamily: "var(--font-lato)" }}>
                    {it.text}
                  </p>
                </Reveal>
              ))}
            </div>

            {download ? (
              <Reveal className="mt-10">
                <a
                  href={download.href}
                  download={download.filename ?? true}
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-black text-white uppercase tracking-wide text-sm transition-all hover:scale-105 hover:shadow-lg"
                  style={{ backgroundColor: NAVY, fontFamily: "var(--font-montserrat)" }}
                >
                  <Download size={18} /> {download.label}
                </a>
              </Reveal>
            ) : null}
          </div>

          {/* Colonne images */}
          {hasImages ? (
            <div className="lg:col-span-5">
              <SideImages images={images!} alt={title} />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export default function AProposPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 pt-16">
        {/* ── HERO « À propos d'EXPAC Cargo » ─────────────────── */}
        <section className="relative overflow-hidden py-24 lg:py-36">
          <Image src={HERO_BG} alt="Porte-conteneurs au port — EXPAC" fill priority sizes="100vw" className="object-cover" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(120deg, rgba(11,30,64,0.94) 0%, rgba(26,58,107,0.86) 52%, rgba(36,77,134,0.55) 100%)" }} />
          <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full opacity-10" style={{ backgroundColor: ORANGE }} />
          <div className="container-custom relative z-10">
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-6xl font-black text-white uppercase leading-[1.05] mb-6" style={{ fontFamily: "var(--font-montserrat)" }}>
                À propos d&apos;<span style={{ color: ORANGE }}>EXPAC Cargo</span>
              </h1>
              <p className="text-lg md:text-xl text-blue-100 leading-relaxed mb-8 max-w-2xl" style={{ fontFamily: "var(--font-lato)" }}>
                Votre partenaire logistique stratégique au Congo — commissionnaire agréé en douane
                et transitaire, solidement implanté à Pointe-Noire et Brazzaville.
              </p>
              <AgrementBadge tone="dark" />
            </div>
          </div>
        </section>

        {/* ── SECTION 1 — QUI SOMMES-NOUS ─────────────────────── */}
        <TextSection
          title="Qui sommes-nous"
          lead={quiSommesNous.lead}
          intro={quiSommesNous.intro}
          items={quiSommesNous.items}
          images={quiSommesNous.images}
          download={quiSommesNous.download}
        />

        {/* ── SECTION 2 — ENGAGEMENT QSE ──────────────────────── */}
        <TextSection
          title="Engagement QSE"
          lead={engagementQSE.lead}
          intro={engagementQSE.intro}
          items={engagementQSE.items}
          images={engagementQSE.images}
          download={engagementQSE.download}
          alt
        />

        {/* ── SECTION 3 — PLATE-FORME e-EXPAC ─────────────────── */}
        <TextSection
          title="Plate-forme e-EXPAC"
          intro={ePlatform.intro}
          items={ePlatform.items}
        />

        {/* ── BAS DE PAGE : Documentation + téléchargements ───── */}
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
                    Téléchargez directement notre brochure de présentation et notre politique QSE au format PDF.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <a href="/Brochure.pdf" download className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-black uppercase tracking-wide border border-white/25 text-white hover:bg-white/10 transition-all" style={{ fontFamily: "var(--font-montserrat)" }}>
                      <Download size={16} /> Brochure EXPAC
                    </a>
                    <a href="/DI01-POLITIQUE%20QSE%20EXPAC.pdf" download="Politique-QSE-EXPAC.pdf" className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-black uppercase tracking-wide border border-white/25 text-white hover:bg-white/10 transition-all" style={{ fontFamily: "var(--font-montserrat)" }}>
                      <Download size={16} /> Politique QSE
                    </a>
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
