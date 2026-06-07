import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
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
} from "lucide-react";

const services = [
  {
    icon: Plane,
    title: "Transit",
    description:
      "Gestion complète des formalités douanières et acheminement de vos marchandises sur l'ensemble du territoire africain.",
    href: "/services/transit",
  },
  {
    icon: Truck,
    title: "Transport Multimodal",
    description:
      "Combinaison optimale des modes de transport — aérien, maritime, routier — pour une livraison efficace et économique.",
    href: "/services/transport",
  },
  {
    icon: Warehouse,
    title: "Stockage",
    description:
      "Entrepôts sécurisés et gestion logistique de vos stocks avec suivi en temps réel de vos inventaires.",
    href: "/services/stockage",
  },
  {
    icon: Ship,
    title: "Consignation Maritime",
    description:
      "Représentation et gestion de vos intérêts dans les ports africains, de l'accostage à la livraison.",
    href: "/services/consignation",
  },
  {
    icon: Package,
    title: "Groupage",
    description:
      "Optimisation des coûts par regroupement de vos expéditions avec d'autres marchandises vers la même destination.",
    href: "/services/groupage",
  },
];

const stats = [
  { value: "500+", label: "Expéditions réalisées" },
  { value: "20+", label: "Pays couverts" },
  { value: "10+", label: "Années d'expérience" },
  { value: "98%", label: "Clients satisfaits" },
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

export default function HomePage() {
  return (
    <>
      <Navbar />

      <main className="pt-16">
        {/* ── HERO ─────────────────────────────────────────── */}
        <section
          className="relative overflow-hidden min-h-[90vh] flex items-center"
          style={{
            background:
              "linear-gradient(135deg, #112850 0%, #1A3A6B 50%, #2a5298 100%)",
          }}
        >
          <div
            className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full opacity-10"
            style={{ backgroundColor: "#E8520A" }}
          />
          <div
            className="absolute -bottom-24 -left-24 w-[350px] h-[350px] rounded-full opacity-10"
            style={{ backgroundColor: "#E8520A" }}
          />

          <div className="container-custom relative z-10 py-24 lg:py-32">
            <div className="max-w-3xl">
              <div
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-6 border border-orange-400/30"
                style={{
                  backgroundColor: "rgba(232,82,10,0.15)",
                  color: "#f97316",
                }}
              >
                <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                Express Africa Cargo Ltd
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
                Votre partenaire{" "}
                <span style={{ color: "#E8520A" }}>logistique</span>
                <br />
                en Afrique
              </h1>

              <p className="text-lg text-blue-100 mb-10 leading-relaxed max-w-xl">
                Transit, transport multimodal, stockage et consignation
                maritime. EXPAC gère vos expéditions de A à Z avec expertise et
                réactivité.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <Link
                  href="/devis"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-white transition-all hover:scale-105"
                  style={{ backgroundColor: "#E8520A" }}
                >
                  Demander un devis
                  <ArrowRight size={18} />
                </Link>
                <Link
                  href="/services"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-white border border-white/30 hover:bg-white/10 transition-all"
                >
                  Découvrir nos services
                  <ChevronRight size={18} />
                </Link>
              </div>

              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 max-w-lg">
                <p className="text-blue-200 text-sm mb-3 font-medium">
                  Suivi rapide d&apos;expédition
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ex: EXPAC-2026-00142"
                    className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-blue-300 outline-none focus:border-orange-400 transition-colors"
                  />
                  <Link
                    href="/tracking"
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-medium text-white transition-all hover:opacity-90 shrink-0"
                    style={{ backgroundColor: "#E8520A" }}
                  >
                    <Search size={16} />
                    <span className="hidden sm:inline">Suivre</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── STATS ────────────────────────────────────────── */}
        <section className="bg-white border-b border-gray-100">
          <div className="container-custom py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((s) => (
                <div key={s.label} className="text-center">
                  <div
                    className="text-3xl md:text-4xl font-bold mb-1"
                    style={{ color: "#1A3A6B" }}
                  >
                    {s.value}
                  </div>
                  <div className="text-sm text-gray-500">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SERVICES ─────────────────────────────────────── */}
        <section className="bg-gray-50 py-20">
          <div className="container-custom">
            <div className="text-center mb-14">
              <p
                className="text-sm font-semibold uppercase tracking-wider mb-3"
                style={{ color: "#E8520A" }}
              >
                Nos expertises
              </p>
              <h2
                className="text-3xl md:text-4xl font-bold mb-4"
                style={{ color: "#1A3A6B" }}
              >
                Des solutions logistiques complètes
              </h2>
              <p className="text-gray-500 max-w-xl mx-auto">
                De la prise en charge à la livraison finale, EXPAC couvre
                l&apos;ensemble de vos besoins logistiques en Afrique.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => {
                const Icon = service.icon;
                return (
                  <Link
                    key={service.title}
                    href={service.href}
                    className="group bg-white rounded-2xl p-7 border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all"
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                      style={{ backgroundColor: "rgba(26,58,107,0.08)" }}
                    >
                      <Icon size={22} style={{ color: "#1A3A6B" }} />
                    </div>
                    <h3
                      className="font-semibold text-lg mb-2"
                      style={{ color: "#1A3A6B" }}
                    >
                      {service.title}
                    </h3>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      {service.description}
                    </p>
                    <div
                      className="mt-5 inline-flex items-center gap-1 text-sm font-medium group-hover:gap-2 transition-all"
                      style={{ color: "#E8520A" }}
                    >
                      En savoir plus
                      <ChevronRight size={15} />
                    </div>
                  </Link>
                );
              })}

              <div
                className="rounded-2xl p-7 flex flex-col justify-between"
                style={{
                  background:
                    "linear-gradient(135deg, #1A3A6B 0%, #2a5298 100%)",
                }}
              >
                <div>
                  <p className="text-blue-200 text-sm mb-3">Une question ?</p>
                  <h3 className="text-white font-bold text-xl mb-3">
                    Besoin d&apos;une solution sur mesure ?
                  </h3>
                  <p className="text-blue-200 text-sm leading-relaxed">
                    Nos experts étudient votre besoin et vous proposent une
                    offre adaptée sous 24h.
                  </p>
                </div>
                <Link
                  href="/devis"
                  className="mt-8 inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-white transition-all hover:scale-105 self-start"
                  style={{ backgroundColor: "#E8520A" }}
                >
                  Obtenir un devis
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── TRACKING CTA ─────────────────────────────────── */}
        <section style={{ backgroundColor: "#E8520A" }} className="py-16">
          <div className="container-custom text-center">
            <p className="text-orange-100 text-sm font-medium uppercase tracking-wider mb-3">
              Suivi en temps réel
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Localisez votre expédition
            </h2>
            <p className="text-orange-100 mb-8 max-w-md mx-auto">
              Entrez votre numéro de référence EXPAC pour suivre votre
              marchandise à chaque étape.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="text"
                placeholder="EXPAC-2026-00142"
                className="flex-1 px-4 py-3.5 rounded-xl text-sm text-gray-800 placeholder-gray-400 outline-none bg-white"
              />
              <Link
                href="/tracking"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-white transition-all hover:opacity-90"
                style={{ backgroundColor: "#1A3A6B" }}
              >
                <Search size={16} />
                Suivre
              </Link>
            </div>
          </div>
        </section>

        {/* ── POURQUOI EXPAC ────────────────────────────────── */}
        <section className="bg-white py-20">
          <div className="container-custom">
            <div className="text-center mb-14">
              <p
                className="text-sm font-semibold uppercase tracking-wider mb-3"
                style={{ color: "#E8520A" }}
              >
                Pourquoi nous choisir
              </p>
              <h2
                className="text-3xl md:text-4xl font-bold mb-4"
                style={{ color: "#1A3A6B" }}
              >
                L&apos;excellence au service de votre logistique
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {atouts.map((a) => {
                const Icon = a.icon;
                return (
                  <div key={a.title} className="text-center">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
                      style={{ backgroundColor: "rgba(232,82,10,0.1)" }}
                    >
                      <Icon size={24} style={{ color: "#E8520A" }} />
                    </div>
                    <h3
                      className="font-semibold text-lg mb-2"
                      style={{ color: "#1A3A6B" }}
                    >
                      {a.title}
                    </h3>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      {a.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── CONTACT CTA ──────────────────────────────────── */}
        <section className="bg-gray-50 py-20">
          <div className="container-custom">
            <div
              className="rounded-3xl p-10 md:p-16 text-center"
              style={{
                background:
                  "linear-gradient(135deg, #112850 0%, #1A3A6B 100%)",
              }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Prêt à expédier ?
              </h2>
              <p className="text-blue-200 mb-8 max-w-md mx-auto">
                Contactez nos experts dès aujourd&apos;hui pour une prise en
                charge rapide de vos marchandises.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/devis"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-white transition-all hover:scale-105"
                  style={{ backgroundColor: "#E8520A" }}
                >
                  Demander un devis gratuit
                  <ArrowRight size={18} />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-white border border-white/30 hover:bg-white/10 transition-all"
                >
                  Nous contacter
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
