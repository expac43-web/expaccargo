import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import HeroSlider from "@/components/public/HeroSlider";
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

/* ── DATA ─────────────────────────────────────────────────── */

const services = [
  {
    icon: Plane,
    title: "Transit",
    description:
      "Gestion complète des formalités douanières et acheminement de vos marchandises sur l'ensemble du territoire africain.",
    href: "/services/transit",
    color: "#1A3A6B",
  },
  {
    icon: Truck,
    title: "Transport Multimodal",
    description:
      "Combinaison optimale des modes de transport — aérien, maritime, routier — pour une livraison efficace et économique.",
    href: "/services/transport",
    color: "#E8520A",
  },
  {
    icon: Warehouse,
    title: "Stockage",
    description:
      "Entrepôts sécurisés et gestion logistique de vos stocks avec suivi en temps réel de vos inventaires.",
    href: "/services/stockage",
    color: "#1A3A6B",
  },
  {
    icon: Ship,
    title: "Consignation Maritime",
    description:
      "Représentation et gestion de vos intérêts dans les ports africains, de l'accostage à la livraison.",
    href: "/services/consignation",
    color: "#E8520A",
  },
  {
    icon: Package,
    title: "Groupage",
    description:
      "Optimisation des coûts par regroupement de vos expéditions avec d'autres marchandises vers la même destination.",
    href: "/services/groupage",
    color: "#1A3A6B",
  },
];

const stats = [
  { value: "500+", label: "Expéditions réalisées", icon: TrendingUp },
  { value: "20+", label: "Pays couverts", icon: Globe },
  { value: "10+", label: "Années d'expérience", icon: Award },
  { value: "98%", label: "Clients satisfaits", icon: ShieldCheck },
];

const atouts = [
  {
    icon: ShieldCheck,
    title: "Expertise locale",
    description:
      "Une connaissance approfondie des marchés africains et des réglementations douanières pour éviter tout blocage.",
  },
  {
    icon: Clock,
    title: "Réactivité 24/7",
    description:
      "Nos équipes sont disponibles à tout moment pour répondre à vos urgences et assurer le suivi de vos dossiers.",
  },
  {
    icon: FileText,
    title: "Documents sécurisés",
    description:
      "Gestion et archivage numérique de tous vos documents douaniers, factures et connaissements.",
  },
  {
    icon: MapPin,
    title: "Suivi en temps réel",
    description:
      "Localisez vos marchandises à chaque étape grâce à notre plateforme de tracking et nos alertes automatiques.",
  },
];

/* ─────────────────────────────────────────────────────────── */

export default function HomePage() {
  return (
    <>
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
                EXPRESS AFRICA CARGO LTD
              </div>

              <h1
                className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.05] mb-6 uppercase"
                style={{ fontFamily: "var(--font-montserrat)", letterSpacing: "-0.01em" }}
              >
                Votre partenaire{" "}
                <span
                  className="relative inline-block"
                  style={{ color: "#E8520A" }}
                >
                  logistique
                </span>
                <br />
                en Afrique
              </h1>

              <p
                className="text-lg md:text-xl text-blue-100 mb-10 leading-relaxed max-w-xl"
                style={{ fontFamily: "var(--font-lato)" }}
              >
                Transit · Transport Multimodal · Stockage · Consignation Maritime.
                EXPAC gère vos expéditions de A à Z avec expertise et réactivité.
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
                  Demander un devis
                  <ArrowRight size={18} />
                </Link>
                <Link
                  href="/services"
                  className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl font-bold text-white border border-white/30 hover:bg-white/10 transition-all text-base uppercase tracking-wide"
                  style={{ fontFamily: "var(--font-montserrat)" }}
                >
                  Nos services
                  <ChevronRight size={18} />
                </Link>
              </div>

              {/* Tracking widget */}
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 max-w-lg">
                <p
                  className="text-blue-200 text-xs font-bold uppercase tracking-widest mb-3"
                  style={{ fontFamily: "var(--font-montserrat)" }}
                >
                  Suivi rapide d&apos;expédition
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ex : EXPAC-2026-00142"
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
                    <span className="hidden sm:inline text-sm">Suivre</span>
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
              {stats.map((s, i) => {
                const Icon = s.icon;
                return (
                  <div
                    key={s.label}
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
                      {s.label}
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
                  ▪ Nos expertises
                </p>
                <h2
                  className="text-3xl md:text-4xl font-black uppercase leading-tight"
                  style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}
                >
                  Des solutions<br />logistiques complètes
                </h2>
              </div>
              <Link
                href="/services"
                className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide transition-all hover:gap-3"
                style={{ color: "#E8520A", fontFamily: "var(--font-montserrat)" }}
              >
                Voir tous les services
                <ArrowRight size={16} />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {services.map((service) => {
                const Icon = service.icon;
                const isOrange = service.color === "#E8520A";
                return (
                  <Link
                    key={service.title}
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
                          {String(services.indexOf(service) + 1).padStart(2, "0")}
                        </span>
                      </div>

                      <h3
                        className="font-black text-lg uppercase mb-3 leading-tight"
                        style={{
                          color: "#1A3A6B",
                          fontFamily: "var(--font-montserrat)",
                        }}
                      >
                        {service.title}
                      </h3>
                      <p
                        className="text-sm text-gray-500 leading-relaxed mb-6"
                        style={{ fontFamily: "var(--font-lato)" }}
                      >
                        {service.description}
                      </p>

                      <div
                        className="inline-flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide group-hover:gap-3 transition-all"
                        style={{
                          color: service.color,
                          fontFamily: "var(--font-montserrat)",
                        }}
                      >
                        En savoir plus
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
                    ▪ Sur mesure
                  </p>
                  <h3
                    className="text-white font-black text-xl uppercase leading-tight mb-3"
                    style={{ fontFamily: "var(--font-montserrat)" }}
                  >
                    Besoin d&apos;une solution adaptée ?
                  </h3>
                  <p
                    className="text-blue-200 text-sm leading-relaxed"
                    style={{ fontFamily: "var(--font-lato)" }}
                  >
                    Nos experts étudient votre besoin et vous proposent une offre
                    personnalisée sous 24h.
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
                  Obtenir un devis
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
              ▪ Suivi en temps réel
            </p>
            <h2
              className="text-3xl md:text-4xl font-black text-white uppercase mb-4"
              style={{ fontFamily: "var(--font-montserrat)" }}
            >
              Localisez votre expédition
            </h2>
            <p
              className="text-orange-100 mb-8 max-w-md mx-auto"
              style={{ fontFamily: "var(--font-lato)" }}
            >
              Entrez votre numéro de référence EXPAC pour suivre votre
              marchandise à chaque étape.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="text"
                placeholder="EXPAC-2026-00142"
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
                Suivre
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
                ▪ Pourquoi nous choisir
              </p>
              <h2
                className="text-3xl md:text-4xl font-black uppercase"
                style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}
              >
                L&apos;excellence au service
                <br />de votre logistique
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {atouts.map((a) => {
                const Icon = a.icon;
                return (
                  <div
                    key={a.title}
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
                      {a.title}
                    </h3>
                    <div
                      className="w-8 h-0.5 mb-4"
                      style={{ backgroundColor: "#E8520A" }}
                    />
                    <p
                      className="text-sm text-gray-500 leading-relaxed"
                      style={{ fontFamily: "var(--font-lato)" }}
                    >
                      {a.description}
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
                    ▪ Contactez-nous
                  </p>
                  <h2
                    className="text-3xl md:text-4xl font-black text-white uppercase mb-4 leading-tight"
                    style={{ fontFamily: "var(--font-montserrat)" }}
                  >
                    Prêt à expédier<br />vos marchandises ?
                  </h2>
                  <p
                    className="text-blue-200 max-w-md"
                    style={{ fontFamily: "var(--font-lato)" }}
                  >
                    Contactez nos experts dès aujourd&apos;hui pour une prise en
                    charge rapide et professionnelle.
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
                    Demander un devis
                    <ArrowRight size={18} />
                  </Link>
                  <Link
                    href="/contact"
                    className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl font-bold text-white border border-white/30 hover:bg-white/10 transition-all whitespace-nowrap uppercase tracking-wide text-sm"
                    style={{ fontFamily: "var(--font-montserrat)" }}
                  >
                    Nous contacter
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
