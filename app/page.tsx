import type { Metadata } from "next";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import { getServerDict } from "@/lib/i18n/server";

/* ── SEO — Métadonnées spécifiques à la page d'accueil ──────────────────── */
export const metadata: Metadata = {
  title: "EXPAC — Commissionnaire Agréé en Douane, Transit & Logistique en Afrique",
  description:
    "EXPAC (Express Africa Cargo Ltd), commissionnaire agréé en douane (N° CDA 265) au Congo Brazzaville : transit douanier, transport multimodal, stockage et consignation maritime en Afrique. Suivi d'expéditions en temps réel. Devis gratuit sous 24h.",
  alternates: { canonical: "https://expaccargo.com" },
  openGraph: {
    title: "EXPAC — Commissionnaire Agréé en Douane & Logistique en Afrique",
    description:
      "Commissionnaire agréé en douane (N° CDA 265) : transit douanier, transport multimodal, stockage et consignation maritime en Afrique. Express Africa Cargo Ltd — votre partenaire de confiance.",
    url: "https://expaccargo.com",
    type: "website",
  },
};

/* ── JSON-LD : Organisation + 2 établissements (données structurées Google) ──
   👉 Infos modifiables ici à tout moment (adresses, téléphones, horaires).
   La source qui fait foi pour le référencement local reste le Profil d'établissement Google. */
const SITE = "https://expaccargo.com";
const ORG_ID = `${SITE}/#organization`;

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": ORG_ID,
      name: "Express Africa Cargo Ltd",
      alternateName: "EXPAC",
      url: SITE,
      logo: `${SITE}/images/logo.jpeg`,
      email: "contact@expaccargo.com",
      description:
        "Commissionnaire agréé en douane (N° CDA 265) : transit douanier, transport multimodal et logistique en Afrique (Congo Brazzaville).",
      areaServed: { "@type": "Place", name: "Afrique centrale" },
      sameAs: [], // ← ajouter ici les URLs réseaux sociaux (LinkedIn, Facebook…)
      knowsAbout: [
        "Commissionnaire agréé en douane",
        "Transit douanier",
        "Transport multimodal",
        "Stockage",
        "Consignation maritime",
        "Groupage",
        "Dédouanement",
      ],
    },
    {
      "@type": "LocalBusiness",
      "@id": `${SITE}/#pointe-noire`,
      name: "EXPAC — Pointe-Noire",
      parentOrganization: { "@id": ORG_ID },
      url: SITE,
      image: `${SITE}/images/logo.jpeg`,
      telephone: "+242064363882",
      email: "agence.pn@expaccargo.com",
      address: {
        "@type": "PostalAddress",
        streetAddress:
          "Résidence les Palmiers, Bât C 2e étage, Appt Caïman — Av. Germain Bikoumat, Centre-Ville",
        addressLocality: "Pointe-Noire",
        addressCountry: "CG",
      },
      openingHours: ["Mo-Fr 08:00-18:00", "Sa 09:00-13:00"],
    },
    {
      "@type": "LocalBusiness",
      "@id": `${SITE}/#brazzaville`,
      name: "EXPAC — Brazzaville (Siège)",
      parentOrganization: { "@id": ORG_ID },
      url: SITE,
      image: `${SITE}/images/logo.jpeg`,
      telephone: "+242055119711",
      email: "agence.bz@expaccargo.com",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Croisement Av. de la Tsieme / Rue Mbetis, Ouenze SOCECA-SOCEMA",
        addressLocality: "Brazzaville",
        addressCountry: "CG",
      },
      openingHours: ["Mo-Fr 08:00-18:00", "Sa 09:00-13:00"],
    },
  ],
};
import HeroSlider from "@/components/public/HeroSlider";
import PartnersCarousel from "@/components/public/PartnersCarousel";
import RatesSummary from "@/components/public/RatesSummary";
import { getRates } from "@/lib/rates";
import Link from "next/link";
import {
  Plane,
  Truck,
  Warehouse,
  Ship,
  Package,
  Search,
  ShieldCheck,
  Clock,
  FileText,
  MapPin,
  ArrowRight,
  ChevronRight,
  TrendingUp,
  Globe,
  Award,
} from "lucide-react";

/* ── DATA (icônes / couleurs / liens — les textes viennent du dictionnaire) ── */

const serviceMeta = [
  { key: "transit", icon: Plane, href: "/services#transit", color: "#1A3A6B" },
  { key: "multimodal", icon: Truck, href: "/services#transport", color: "#E8520A" },
  { key: "storage", icon: Warehouse, href: "/services#stockage", color: "#1A3A6B" },
  { key: "consignment", icon: Ship, href: "/services#consignation", color: "#E8520A" },
  { key: "groupage", icon: Package, href: "/services#groupage", color: "#1A3A6B" },
] as const;

const statMeta = [
  { key: "shipments", value: "500+", icon: TrendingUp },
  { key: "countries", value: "20+", icon: Globe },
  { key: "experience", value: "10+", icon: Award },
  { key: "satisfaction", value: "98%", icon: ShieldCheck },
] as const;

const atoutMeta = [
  { key: "expertise", icon: ShieldCheck },
  { key: "reactivity", icon: Clock },
  { key: "documents", icon: FileText },
  { key: "realtime", icon: MapPin },
] as const;

/* ─────────────────────────────────────────────────────────── */

type Partner = { id: string; name: string; logoUrl: string; website?: string | null };

async function fetchPartners(): Promise<Partner[]> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/Partner?isActive=eq.true&order=order.asc`,
      {
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
        },
        next: { revalidate: 300 },
      }
    );
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const partners = await fetchPartners();
  const rates = await getRates();
  const t = await getServerDict();
  const h = t.home;
  return (
    <>
      {/* JSON-LD Organisation — signale à Google la structure de l'entreprise */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <Navbar />

      <main className="pt-16">
        {/* ── HERO ─────────────────────────────────────────── */}
        <HeroSlider>
          <div className="container-custom py-28 lg:py-36">
            <div className="max-w-3xl">
              {/* Badge */}
              <div
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold mb-8 border border-orange-400/40"
                style={{
                  backgroundColor: "rgba(232,82,10,0.18)",
                  color: "#fba563",
                  fontFamily: "var(--font-montserrat)",
                  letterSpacing: "0.05em",
                }}
              >
                <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                {h.hero.badge}
              </div>

              <h1
                className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.05] mb-6 uppercase"
                style={{ fontFamily: "var(--font-montserrat)", letterSpacing: "-0.01em" }}
              >
                {h.hero.titlePre}{" "}
                <span
                  className="relative inline-block"
                  style={{ color: "#E8520A" }}
                >
                  {h.hero.titleHighlight}
                </span>
                <br />
                {h.hero.titlePost}
              </h1>

              <p
                className="text-lg md:text-xl text-blue-100 mb-10 leading-relaxed max-w-xl"
                style={{ fontFamily: "var(--font-lato)" }}
              >
                {h.hero.subtitle}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-14">
                <Link
                  href="/devis"
                  className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl font-bold text-white transition-all hover:scale-105 hover:shadow-lg text-base uppercase tracking-wide"
                  style={{
                    backgroundColor: "#E8520A",
                    fontFamily: "var(--font-montserrat)",
                  }}
                >
                  {h.hero.ctaQuote}
                  <ArrowRight size={18} />
                </Link>
                <Link
                  href="/services"
                  className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl font-bold text-white border border-white/30 hover:bg-white/10 transition-all text-base uppercase tracking-wide"
                  style={{ fontFamily: "var(--font-montserrat)" }}
                >
                  {h.hero.ctaServices}
                  <ChevronRight size={18} />
                </Link>
              </div>

              {/* Tracking widget */}
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 max-w-lg">
                <p
                  className="text-blue-200 text-xs font-bold uppercase tracking-widest mb-3"
                  style={{ fontFamily: "var(--font-montserrat)" }}
                >
                  {h.hero.trackLabel}
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder={h.hero.trackPlaceholder}
                    className="flex-1 bg-white/10 border border-white/25 rounded-xl px-4 py-3 text-sm text-white placeholder-blue-300 outline-none focus:border-orange-400 transition-colors"
                  />
                  <Link
                    href="/tracking"
                    className="inline-flex items-center gap-1.5 px-5 py-3 rounded-xl font-bold text-white transition-all hover:opacity-90 shrink-0"
                    style={{
                      backgroundColor: "#E8520A",
                      fontFamily: "var(--font-montserrat)",
                    }}
                  >
                    <Search size={16} />
                    <span className="hidden sm:inline text-sm">{h.hero.trackBtn}</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </HeroSlider>

        {/* ── STATS ────────────────────────────────────────── */}
        <section style={{ backgroundColor: "#0e2248" }} className="relative overflow-hidden py-16">
          {/* Decorative diagonal lines */}
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)",
              backgroundSize: "20px 20px",
            }}
          />

          <div className="container-custom relative z-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-0 divide-x divide-white/10">
              {statMeta.map((s) => {
                const Icon = s.icon;
                return (
                  <div
                    key={s.key}
                    className="flex flex-col items-center text-center px-6 py-4"
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                      style={{ backgroundColor: "rgba(232,82,10,0.2)" }}
                    >
                      <Icon size={20} style={{ color: "#E8520A" }} />
                    </div>
                    <div
                      className="text-4xl md:text-5xl font-black mb-2 leading-none"
                      style={{
                        color: "#E8520A",
                        fontFamily: "var(--font-montserrat)",
                      }}
                    >
                      {s.value}
                    </div>
                    <div
                      className="w-8 h-0.5 mb-3"
                      style={{ backgroundColor: "rgba(232,82,10,0.4)" }}
                    />
                    <div
                      className="text-sm text-blue-200 font-medium uppercase tracking-wider"
                      style={{ fontFamily: "var(--font-montserrat)" }}
                    >
                      {h.stats[s.key]}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── SERVICES ─────────────────────────────────────── */}
        <section className="bg-white py-24">
          <div className="container-custom">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-4">
              <div>
                <p
                  className="text-xs font-black uppercase tracking-[0.2em] mb-3"
                  style={{ color: "#E8520A", fontFamily: "var(--font-montserrat)" }}
                >
                  ▪ {h.services.eyebrow}
                </p>
                <h2
                  className="text-3xl md:text-4xl font-black uppercase leading-tight"
                  style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}
                >
                  {h.services.title}
                </h2>
              </div>
              <Link
                href="/services"
                className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide transition-all hover:gap-3"
                style={{ color: "#E8520A", fontFamily: "var(--font-montserrat)" }}
              >
                {h.services.seeAll}
                <ArrowRight size={16} />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {serviceMeta.map((service, i) => {
                const Icon = service.icon;
                const isOrange = service.color === "#E8520A";
                const item = h.services.items[service.key];
                return (
                  <Link
                    key={service.key}
                    href={service.href}
                    className="group relative bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                  >
                    {/* Top accent bar */}
                    <div
                      className="h-1 w-full"
                      style={{ backgroundColor: service.color }}
                    />

                    <div className="p-7">
                      {/* Icon + number */}
                      <div className="flex items-start justify-between mb-6">
                        <div
                          className="w-13 h-13 rounded-xl flex items-center justify-center"
                          style={{
                            backgroundColor: isOrange
                              ? "rgba(232,82,10,0.1)"
                              : "rgba(26,58,107,0.08)",
                            width: "3.25rem",
                            height: "3.25rem",
                          }}
                        >
                          <Icon size={24} style={{ color: service.color }} />
                        </div>
                        <span
                          className="text-6xl font-black leading-none select-none"
                          style={{
                            color: "rgba(0,0,0,0.04)",
                            fontFamily: "var(--font-montserrat)",
                          }}
                        >
                          {String(i + 1).padStart(2, "0")}
                        </span>
                      </div>

                      <h3
                        className="font-black text-lg uppercase mb-3 leading-tight"
                        style={{
                          color: "#1A3A6B",
                          fontFamily: "var(--font-montserrat)",
                        }}
                      >
                        {item.title}
                      </h3>
                      <p
                        className="text-sm text-gray-500 leading-relaxed mb-6"
                        style={{ fontFamily: "var(--font-lato)" }}
                      >
                        {item.description}
                      </p>

                      <div
                        className="inline-flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide group-hover:gap-3 transition-all"
                        style={{
                          color: service.color,
                          fontFamily: "var(--font-montserrat)",
                        }}
                      >
                        {h.services.learnMore}
                        <ArrowRight size={14} />
                      </div>
                    </div>

                    {/* Hover fill */}
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                      style={{
                        background: `linear-gradient(135deg, ${service.color}06 0%, transparent 60%)`,
                      }}
                    />
                  </Link>
                );
              })}

              {/* CTA card */}
              <div
                className="rounded-2xl p-7 flex flex-col justify-between relative overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, #1A3A6B 0%, #0e2248 100%)",
                }}
              >
                <div
                  className="absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-10"
                  style={{ backgroundColor: "#E8520A" }}
                />
                <div>
                  <p
                    className="text-xs font-black uppercase tracking-[0.15em] mb-3"
                    style={{ color: "#fba563", fontFamily: "var(--font-montserrat)" }}
                  >
                    ▪ {h.services.ctaEyebrow}
                  </p>
                  <h3
                    className="text-white font-black text-xl uppercase leading-tight mb-3"
                    style={{ fontFamily: "var(--font-montserrat)" }}
                  >
                    {h.services.ctaTitle}
                  </h3>
                  <p
                    className="text-blue-200 text-sm leading-relaxed"
                    style={{ fontFamily: "var(--font-lato)" }}
                  >
                    {h.services.ctaDesc}
                  </p>
                </div>
                <Link
                  href="/devis"
                  className="mt-8 inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-white transition-all hover:scale-105 self-start text-sm uppercase tracking-wide"
                  style={{
                    backgroundColor: "#E8520A",
                    fontFamily: "var(--font-montserrat)",
                  }}
                >
                  {h.services.ctaBtn}
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── TRACKING CTA ─────────────────────────────────── */}
        <section
          style={{ backgroundColor: "#E8520A" }}
          className="relative overflow-hidden py-20"
        >
          <div
            className="absolute -right-16 -bottom-16 w-72 h-72 rounded-full opacity-10 bg-white"
          />
          <div
            className="absolute -left-8 -top-8 w-48 h-48 rounded-full opacity-10 bg-white"
          />
          <div className="container-custom text-center relative z-10">
            <p
              className="text-orange-100 text-xs font-black uppercase tracking-[0.2em] mb-4"
              style={{ fontFamily: "var(--font-montserrat)" }}
            >
              ▪ {h.tracking.eyebrow}
            </p>
            <h2
              className="text-3xl md:text-4xl font-black text-white uppercase mb-4"
              style={{ fontFamily: "var(--font-montserrat)" }}
            >
              {h.tracking.title}
            </h2>
            <p
              className="text-orange-100 mb-8 max-w-md mx-auto"
              style={{ fontFamily: "var(--font-lato)" }}
            >
              {h.tracking.desc}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="text"
                placeholder={h.tracking.placeholder}
                className="flex-1 px-4 py-4 rounded-xl text-sm text-gray-800 placeholder-gray-400 outline-none bg-white shadow-sm font-medium"
              />
              <Link
                href="/tracking"
                className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold text-white transition-all hover:opacity-90 uppercase tracking-wide text-sm"
                style={{
                  backgroundColor: "#1A3A6B",
                  fontFamily: "var(--font-montserrat)",
                }}
              >
                <Search size={16} />
                {h.tracking.btn}
              </Link>
            </div>
          </div>
        </section>

        {/* ── POURQUOI EXPAC ────────────────────────────────── */}
        <section className="bg-gray-50 py-24">
          <div className="container-custom">
            <div className="text-center mb-16">
              <p
                className="text-xs font-black uppercase tracking-[0.2em] mb-4"
                style={{ color: "#E8520A", fontFamily: "var(--font-montserrat)" }}
              >
                ▪ {h.why.eyebrow}
              </p>
              <h2
                className="text-3xl md:text-4xl font-black uppercase"
                style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}
              >
                {h.why.title}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {atoutMeta.map((a) => {
                const Icon = a.icon;
                const item = h.why.items[a.key];
                return (
                  <div
                    key={a.key}
                    className="bg-white rounded-2xl p-7 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                      style={{ backgroundColor: "rgba(232,82,10,0.1)" }}
                    >
                      <Icon size={22} style={{ color: "#E8520A" }} />
                    </div>
                    <h3
                      className="font-black text-base uppercase mb-3 leading-tight"
                      style={{
                        color: "#1A3A6B",
                        fontFamily: "var(--font-montserrat)",
                      }}
                    >
                      {item.title}
                    </h3>
                    <div
                      className="w-8 h-0.5 mb-4"
                      style={{ backgroundColor: "#E8520A" }}
                    />
                    <p
                      className="text-sm text-gray-500 leading-relaxed"
                      style={{ fontFamily: "var(--font-lato)" }}
                    >
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── CONTACT CTA ──────────────────────────────────── */}
        <section className="bg-white py-24">
          <div className="container-custom">
            <div
              className="rounded-3xl p-10 md:p-16 relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #0e2248 0%, #1A3A6B 60%, #2a5298 100%)",
              }}
            >
              <div
                className="absolute right-0 bottom-0 w-72 h-72 rounded-full opacity-10"
                style={{ backgroundColor: "#E8520A", transform: "translate(30%, 30%)" }}
              />
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                <div>
                  <p
                    className="text-xs font-black uppercase tracking-[0.2em] mb-4"
                    style={{ color: "#fba563", fontFamily: "var(--font-montserrat)" }}
                  >
                    ▪ {h.contactCta.eyebrow}
                  </p>
                  <h2
                    className="text-3xl md:text-4xl font-black text-white uppercase mb-4 leading-tight"
                    style={{ fontFamily: "var(--font-montserrat)" }}
                  >
                    {h.contactCta.title}
                  </h2>
                  <p
                    className="text-blue-200 max-w-md"
                    style={{ fontFamily: "var(--font-lato)" }}
                  >
                    {h.contactCta.desc}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row md:flex-col gap-4 shrink-0">
                  <Link
                    href="/devis"
                    className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl font-bold text-white transition-all hover:scale-105 hover:shadow-lg whitespace-nowrap uppercase tracking-wide text-sm"
                    style={{
                      backgroundColor: "#E8520A",
                      fontFamily: "var(--font-montserrat)",
                    }}
                  >
                    {h.contactCta.ctaQuote}
                    <ArrowRight size={18} />
                  </Link>
                  <Link
                    href="/contact"
                    className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl font-bold text-white border border-white/30 hover:bg-white/10 transition-all whitespace-nowrap uppercase tracking-wide text-sm"
                    style={{ fontFamily: "var(--font-montserrat)" }}
                  >
                    {h.contactCta.ctaContact}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* ── TAUX DU JOUR (résumé) ─────────────────────────── */}
        {rates && <RatesSummary rates={rates.rates} />}

        {/* ── PARTENAIRES ───────────────────────────────────── */}
        {partners.length > 0 && (
          <section className="bg-white py-16 border-t border-gray-100">
            <div className="container-custom mb-10 text-center">
              <p
                className="text-xs font-black uppercase tracking-[0.2em] mb-3"
                style={{ color: "#E8520A", fontFamily: "var(--font-montserrat)" }}
              >
                ▪ {h.partners.eyebrow}
              </p>
              <h2
                className="text-2xl md:text-3xl font-black uppercase"
                style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}
              >
                {h.partners.title}
              </h2>
            </div>
            <PartnersCarousel partners={partners} />
          </section>
        )}
      </main>

      <Footer />
    </>
  );
}
