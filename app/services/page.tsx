import type { Metadata } from "next";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import Link from "next/link";
import { getServerDict } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "Nos Services — Transit, Transport Multimodal & Logistique",
  description:
    "Découvrez tous les services EXPAC : transit douanier, transport multimodal aérien/maritime/routier, stockage, consignation maritime et groupage en Afrique.",
  alternates: { canonical: "https://expaccargo.com/services" },
  openGraph: {
    title: "Services Logistiques EXPAC en Afrique",
    description:
      "Transit, transport multimodal, stockage et consignation maritime. Des solutions logistiques complètes pour vos marchandises en Afrique.",
    url: "https://expaccargo.com/services",
  },
  keywords: [
    "transit douanier Afrique",
    "transport multimodal",
    "stockage marchandises Afrique",
    "consignation maritime",
    "groupage maritime Afrique",
    "fret aérien Afrique",
    "logistique internationale",
  ],
};
import {
  Plane,
  Truck,
  Warehouse,
  Ship,
  Package,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

/* ── DATA (icônes / couleurs / liens — textes via dictionnaire) ─────────── */
const serviceMeta = [
  { id: "transit", icon: Plane, color: "#1A3A6B", bgColor: "rgba(26,58,107,0.06)", href: "/devis" },
  { id: "transport", icon: Truck, color: "#E8520A", bgColor: "rgba(232,82,10,0.06)", href: "/devis" },
  { id: "stockage", icon: Warehouse, color: "#1A3A6B", bgColor: "rgba(26,58,107,0.06)", href: "/devis" },
  { id: "consignation", icon: Ship, color: "#E8520A", bgColor: "rgba(232,82,10,0.06)", href: "/devis" },
  { id: "groupage", icon: Package, color: "#1A3A6B", bgColor: "rgba(26,58,107,0.06)", href: "/devis" },
] as const;

/* ─────────────────────────────────────────────────────────── */

export default async function ServicesPage() {
  const t = await getServerDict();
  const sp = t.servicesPage;

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
              ▪ {sp.eyebrow}
            </p>
            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-black text-white uppercase leading-tight mb-6"
              style={{ fontFamily: "var(--font-montserrat)" }}
            >
              {sp.titleLine1}
              <br />
              <span style={{ color: "#E8520A" }}>{sp.titleHighlight}</span>
            </h1>
            <p
              className="text-blue-200 text-lg max-w-xl mx-auto"
              style={{ fontFamily: "var(--font-lato)" }}
            >
              {sp.subtitle}
            </p>
          </div>
        </section>

        {/* ── NAV SERVICES ─────────────────────────────────── */}
        <div className="sticky top-16 z-30 bg-white border-b border-gray-100 shadow-sm">
          <div className="container-custom">
            <nav className="flex overflow-x-auto gap-0 scrollbar-none">
              {serviceMeta.map((s) => {
                const Icon = s.icon;
                return (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className="flex items-center gap-2 px-5 py-4 text-sm font-bold uppercase tracking-wide whitespace-nowrap border-b-2 border-transparent hover:border-orange-500 text-gray-500 hover:text-gray-800 transition-all"
                    style={{ fontFamily: "var(--font-montserrat)" }}
                  >
                    <Icon size={15} />
                    {sp.items[s.id].title}
                  </a>
                );
              })}
            </nav>
          </div>
        </div>

        {/* ── SERVICES LIST ─────────────────────────────────── */}
        <div className="bg-gray-50">
          {serviceMeta.map((service, index) => {
            const Icon = service.icon;
            const isEven = index % 2 === 0;
            const item = sp.items[service.id];

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
                          {item.title}
                        </h3>
                        <p
                          className="text-sm mt-2 font-medium"
                          style={{ color: service.color, opacity: 0.7 }}
                        >
                          {item.tagline}
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
                        ▪ {item.tagline}
                      </p>
                      <h2
                        className="text-3xl md:text-4xl font-black uppercase leading-tight mb-6"
                        style={{
                          color: "#1A3A6B",
                          fontFamily: "var(--font-montserrat)",
                        }}
                      >
                        {item.title}
                      </h2>
                      <p
                        className="text-gray-600 leading-relaxed mb-8 text-base"
                        style={{ fontFamily: "var(--font-lato)" }}
                      >
                        {item.description}
                      </p>

                      {/* Features list */}
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                        {item.features.map((feature) => (
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
                        {sp.requestQuote}
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
              ▪ {sp.cta.eyebrow}
            </p>
            <h2
              className="text-3xl md:text-4xl font-black text-white uppercase mb-4"
              style={{ fontFamily: "var(--font-montserrat)" }}
            >
              {sp.cta.title}
            </h2>
            <p
              className="text-orange-100 mb-8 max-w-md mx-auto"
              style={{ fontFamily: "var(--font-lato)" }}
            >
              {sp.cta.desc}
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
                {sp.cta.primary}
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl font-bold text-white border-2 border-white/40 hover:bg-white/10 transition-all uppercase tracking-wide text-sm"
                style={{ fontFamily: "var(--font-montserrat)" }}
              >
                {sp.cta.secondary}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
