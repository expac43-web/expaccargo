import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import Link from "next/link";
import {
  Plane,
  Truck,
  Warehouse,
  Ship,
  Package,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

/* ── DATA ─────────────────────────────────────────────────── */

const services = [
  {
    id: "transit",
    icon: Plane,
    title: "Transit",
    tagline: "Fluidifiez vos opérations douanières",
    description:
      "EXPAC prend en charge l'intégralité de vos démarches douanières à l'import et à l'export. Notre équipe d'experts maîtrise les réglementations de chaque pays africain et vous garantit un transit rapide et sans blocage.",
    features: [
      "Déclarations douanières import et export",
      "Gestion des licences d'importation",
      "Pré-dédouanement et mainlevée rapide",
      "Suivi des dossiers en temps réel",
      "Assistance en cas de litiges douaniers",
      "Traitement des marchandises sous régimes suspensifs",
    ],
    color: "#1A3A6B",
    bgColor: "rgba(26,58,107,0.06)",
    href: "/devis",
  },
  {
    id: "transport",
    icon: Truck,
    title: "Transport Multimodal",
    tagline: "La solution optimale pour chaque trajet",
    description:
      "Nous combinons les meilleurs modes de transport — aérien, maritime et routier — pour concevoir le schéma logistique le plus efficace et économique pour vos marchandises. Chaque itinéraire est optimisé selon vos contraintes de délai et de budget.",
    features: [
      "Fret aérien (express et économique)",
      "Fret maritime (FCL et LCL)",
      "Transport routier régional",
      "Gestion des ruptures de charge",
      "Couverture de l'ensemble de l'Afrique",
      "Suivi GPS et reporting client",
    ],
    color: "#E8520A",
    bgColor: "rgba(232,82,10,0.06)",
    href: "/devis",
  },
  {
    id: "stockage",
    icon: Warehouse,
    title: "Stockage & Entreposage",
    tagline: "Sécurisez et gérez vos stocks",
    description:
      "Nos entrepôts sécurisés offrent des solutions de stockage adaptées à tous types de marchandises. Qu'il s'agisse de produits généraux, de marchandises réfrigérées ou de matières dangereuses, nous disposons des infrastructures et certifications nécessaires.",
    features: [
      "Entrepôts sécurisés 24h/24 et 7j/7",
      "Stockage sous douane (entrepôt agréé)",
      "Gestion des stocks (WMS)",
      "Préparation de commandes",
      "Conditionnement et étiquetage",
      "Inventaires réguliers avec reporting",
    ],
    color: "#1A3A6B",
    bgColor: "rgba(26,58,107,0.06)",
    href: "/devis",
  },
  {
    id: "consignation",
    icon: Ship,
    title: "Consignation Maritime",
    tagline: "Votre représentant dans les ports africains",
    description:
      "En tant que consignataire agréé, EXPAC représente les armateurs et les chargeurs dans les ports africains. Nous gérons l'accueil des navires, les opérations de manutention et la livraison des marchandises dans les meilleures conditions.",
    features: [
      "Représentation des armateurs (ship agency)",
      "Accueil et assistance des navires",
      "Gestion des opérations portuaires",
      "Coordination avec les autorités portuaires",
      "Émission des connaissements (BL)",
      "Suivi des chargements et déchargements",
    ],
    color: "#E8520A",
    bgColor: "rgba(232,82,10,0.06)",
    href: "/devis",
  },
  {
    id: "groupage",
    icon: Package,
    title: "Groupage",
    tagline: "Réduisez vos coûts, optimisez vos envois",
    description:
      "Le groupage permet aux expéditeurs de partager les coûts de transport en regroupant leurs marchandises avec d'autres cargaisons à destination du même port ou de la même région. Une solution idéale pour les petits volumes.",
    features: [
      "Groupage maritime LCL (Less than Container Load)",
      "Groupage aérien consolidé",
      "Départ hebdomadaire sur les axes principaux",
      "Tarifs compétitifs pour petits volumes",
      "Emballage et conditionnement inclus",
      "Suivi individualisé de chaque expédition",
    ],
    color: "#1A3A6B",
    bgColor: "rgba(26,58,107,0.06)",
    href: "/devis",
  },
];

/* ─────────────────────────────────────────────────────────── */

export default function ServicesPage() {
  return (
    <>
      <Navbar />

      <main className="pt-16">
        {/* ── PAGE HEADER ──────────────────────────────────── */}
        <section
          className="relative overflow-hidden py-24"
          style={{
            background: "linear-gradient(135deg, #0e2248 0%, #1A3A6B 60%, #2a5298 100%)",
          }}
        >
          <div
            className="absolute -right-24 -top-24 w-96 h-96 rounded-full opacity-10"
            style={{ backgroundColor: "#E8520A" }}
          />
          <div
            className="absolute -left-12 bottom-0 w-64 h-64 rounded-full opacity-10"
            style={{ backgroundColor: "#E8520A" }}
          />
          <div className="container-custom relative z-10 text-center">
            <p
              className="text-xs font-black uppercase tracking-[0.25em] mb-5"
              style={{ color: "#fba563", fontFamily: "var(--font-montserrat)" }}
            >
              ▪ EXPAC — Express Africa Cargo Ltd
            </p>
            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-black text-white uppercase leading-tight mb-6"
              style={{ fontFamily: "var(--font-montserrat)" }}
            >
              Nos services
              <br />
              <span style={{ color: "#E8520A" }}>logistiques</span>
            </h1>
            <p
              className="text-blue-200 text-lg max-w-xl mx-auto"
              style={{ fontFamily: "var(--font-lato)" }}
            >
              De la prise en charge à la livraison finale, EXPAC couvre
              l&apos;ensemble de vos besoins logistiques en Afrique.
            </p>
          </div>
        </section>

        {/* ── NAV SERVICES ─────────────────────────────────── */}
        <div className="sticky top-16 z-30 bg-white border-b border-gray-100 shadow-sm">
          <div className="container-custom">
            <nav className="flex overflow-x-auto gap-0 scrollbar-none">
              {services.map((s) => {
                const Icon = s.icon;
                return (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className="flex items-center gap-2 px-5 py-4 text-sm font-bold uppercase tracking-wide whitespace-nowrap border-b-2 border-transparent hover:border-orange-500 text-gray-500 hover:text-gray-800 transition-all"
                    style={{ fontFamily: "var(--font-montserrat)" }}
                  >
                    <Icon size={15} />
                    {s.title}
                  </a>
                );
              })}
            </nav>
          </div>
        </div>

        {/* ── SERVICES LIST ─────────────────────────────────── */}
        <div className="bg-gray-50">
          {services.map((service, index) => {
            const Icon = service.icon;
            const isEven = index % 2 === 0;

            return (
              <section
                key={service.id}
                id={service.id}
                className={`py-20 ${isEven ? "bg-white" : "bg-gray-50"}`}
              >
                <div className="container-custom">
                  <div
                    className={`flex flex-col ${isEven ? "lg:flex-row" : "lg:flex-row-reverse"} gap-12 lg:gap-20 items-center`}
                  >
                    {/* Visual block */}
                    <div className="w-full lg:w-2/5 shrink-0">
                      <div
                        className="rounded-3xl p-10 flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[280px]"
                        style={{ backgroundColor: service.bgColor }}
                      >
                        <div
                          className="absolute -right-8 -bottom-8 w-40 h-40 rounded-full opacity-20"
                          style={{ backgroundColor: service.color }}
                        />
                        <div
                          className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-md"
                          style={{ backgroundColor: service.color }}
                        >
                          <Icon size={36} className="text-white" />
                        </div>
                        <div
                          className="text-7xl font-black opacity-10 leading-none select-none absolute right-6 top-6"
                          style={{
                            color: service.color,
                            fontFamily: "var(--font-montserrat)",
                          }}
                        >
                          {String(index + 1).padStart(2, "0")}
                        </div>
                        <h3
                          className="text-2xl font-black uppercase"
                          style={{
                            color: service.color,
                            fontFamily: "var(--font-montserrat)",
                          }}
                        >
                          {service.title}
                        </h3>
                        <p
                          className="text-sm mt-2 font-medium"
                          style={{ color: service.color, opacity: 0.7 }}
                        >
                          {service.tagline}
                        </p>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <p
                        className="text-xs font-black uppercase tracking-[0.2em] mb-4"
                        style={{
                          color: service.color,
                          fontFamily: "var(--font-montserrat)",
                        }}
                      >
                        ▪ {service.tagline}
                      </p>
                      <h2
                        className="text-3xl md:text-4xl font-black uppercase leading-tight mb-6"
                        style={{
                          color: "#1A3A6B",
                          fontFamily: "var(--font-montserrat)",
                        }}
                      >
                        {service.title}
                      </h2>
                      <p
                        className="text-gray-600 leading-relaxed mb-8 text-base"
                        style={{ fontFamily: "var(--font-lato)" }}
                      >
                        {service.description}
                      </p>

                      {/* Features list */}
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                        {service.features.map((feature) => (
                          <li
                            key={feature}
                            className="flex items-start gap-3 text-sm"
                            style={{ fontFamily: "var(--font-lato)" }}
                          >
                            <CheckCircle2
                              size={17}
                              className="shrink-0 mt-0.5"
                              style={{ color: service.color }}
                            />
                            <span className="text-gray-600">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <Link
                        href={service.href}
                        className="inline-flex items-center gap-2 px-7 py-4 rounded-xl font-bold text-white transition-all hover:scale-105 hover:shadow-lg text-sm uppercase tracking-wide"
                        style={{
                          backgroundColor: service.color,
                          fontFamily: "var(--font-montserrat)",
                        }}
                      >
                        Demander un devis
                        <ArrowRight size={16} />
                      </Link>
                    </div>
                  </div>
                </div>
              </section>
            );
          })}
        </div>

        {/* ── BOTTOM CTA ───────────────────────────────────── */}
        <section
          className="relative overflow-hidden py-20"
          style={{ backgroundColor: "#E8520A" }}
        >
          <div
            className="absolute -right-16 -top-16 w-80 h-80 rounded-full opacity-10 bg-white"
          />
          <div className="container-custom text-center relative z-10">
            <p
              className="text-orange-100 text-xs font-black uppercase tracking-[0.2em] mb-4"
              style={{ fontFamily: "var(--font-montserrat)" }}
            >
              ▪ Besoin d&apos;un service spécifique ?
            </p>
            <h2
              className="text-3xl md:text-4xl font-black text-white uppercase mb-4"
              style={{ fontFamily: "var(--font-montserrat)" }}
            >
              Obtenez un devis personnalisé
            </h2>
            <p
              className="text-orange-100 mb-8 max-w-md mx-auto"
              style={{ fontFamily: "var(--font-lato)" }}
            >
              Décrivez votre besoin et nos experts vous répondent sous 24h avec
              une offre adaptée à vos contraintes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/devis"
                className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl font-bold text-white transition-all hover:scale-105 hover:shadow-lg uppercase tracking-wide text-sm"
                style={{
                  backgroundColor: "#1A3A6B",
                  fontFamily: "var(--font-montserrat)",
                }}
              >
                Demander un devis gratuit
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl font-bold text-white border-2 border-white/40 hover:bg-white/10 transition-all uppercase tracking-wide text-sm"
                style={{ fontFamily: "var(--font-montserrat)" }}
              >
                Nous contacter
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
