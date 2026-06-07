"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import Image from "next/image";
import Link from "next/link";
import {
  Plane, Truck, Warehouse, Ship, Package,
  MapPin, Calendar, User, Building2,
  Mail, Phone, MessageSquare, ChevronRight,
  Clock, CheckCircle, ArrowRight, Send, Weight,
} from "lucide-react";

const sliderImages = [
  {
    src: "https://images.unsplash.com/photo-1759216373394-91146ca977c7?auto=format&fit=crop&w=1920&q=80",
    alt: "Port cargo conteneurs",
  },
  {
    src: "https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=1920&q=80",
    alt: "Cargo maritime",
  },
  {
    src: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1920&q=80",
    alt: "Fret aérien",
  },
];

const serviceTypes = [
  { id: "TRANSIT", icon: Plane, label: "Transit douanier" },
  { id: "TRANSPORT", icon: Truck, label: "Transport multimodal" },
  { id: "STOCKAGE", icon: Warehouse, label: "Stockage" },
  { id: "CONSIGNATION", icon: Ship, label: "Consignation maritime" },
  { id: "GROUPAGE", icon: Package, label: "Groupage" },
];

const transportModes = ["Maritime", "Aérien", "Routier", "Multimodal"];

const labelCls =
  "block text-xs font-black uppercase tracking-wider mb-1.5 text-gray-600";
const inputCls =
  "w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#1A3A6B] focus:ring-2 focus:ring-[#1A3A6B]/10 transition-all bg-white";

function SectionTitle({ number, title }: { number: string; title: string }) {
  return (
    <div className="flex items-center gap-4">
      <span
        className="text-3xl font-black leading-none select-none"
        style={{ color: "#1A3A6B", opacity: 0.15, fontFamily: "var(--font-montserrat)" }}
      >
        {number}
      </span>
      <h2
        className="text-base font-black uppercase"
        style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}
      >
        {title}
      </h2>
    </div>
  );
}

function Field({
  label,
  icon,
  required,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-3 text-gray-400">{icon}</span>
        {children}
      </div>
    </div>
  );
}

export default function DevisPage() {
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [urgency, setUrgency] = useState("standard");
  const [isDangerous, setIsDangerous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setSlide((p) => (p + 1) % sliderImages.length), 4000);
    return () => clearInterval(t);
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    // TODO: POST /api/devis
    setTimeout(() => { setLoading(false); setSent(true); }, 1500);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">

        {/* ── Blue header ─────────────────────────────────── */}
        <div
          className="relative py-16 overflow-hidden"
          style={{ background: "linear-gradient(135deg, #0e2248 0%, #1A3A6B 60%, #2a5298 100%)" }}
        >
          <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full opacity-10" style={{ backgroundColor: "#E8520A" }} />
          <div className="absolute -left-10 bottom-0 w-56 h-56 rounded-full opacity-10" style={{ backgroundColor: "#E8520A" }} />
          <div className="container-custom relative z-10">
            <p
              className="text-xs font-black uppercase tracking-[0.2em] mb-4"
              style={{ color: "#fba563", fontFamily: "var(--font-montserrat)" }}
            >
              ▪ Devis gratuit
            </p>
            <h1
              className="text-4xl lg:text-5xl font-black text-white uppercase leading-tight mb-4"
              style={{ fontFamily: "var(--font-montserrat)" }}
            >
              Demandez un <span style={{ color: "#E8520A" }}>devis</span>
            </h1>
            <p className="text-blue-200 max-w-xl" style={{ fontFamily: "var(--font-lato)" }}>
              Décrivez votre besoin logistique et recevez une offre personnalisée sous 24h ouvrées — 100% gratuit, sans engagement.
            </p>
          </div>
        </div>

        {/* ── Mini slider ─────────────────────────────────── */}
        <div className="relative h-48 overflow-hidden">
          {sliderImages.map((img, i) => (
            <div
              key={i}
              className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
              style={{ opacity: i === slide ? 1 : 0 }}
            >
              <Image src={img.src} alt={img.alt} fill className="object-cover" sizes="100vw" />
            </div>
          ))}
          <div className="absolute inset-0 z-10" style={{ backgroundColor: "rgba(14, 34, 72, 0.75)" }} />

          {/* Badges */}
          <div className="absolute inset-0 z-20 flex items-center justify-center">
            <div className="flex flex-wrap items-center justify-center gap-6 px-4">
              {[
                { icon: Clock, text: "Réponse sous 24h" },
                { icon: CheckCircle, text: "Devis 100% gratuit" },
                { icon: Phone, text: "Assistance dédiée" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: "#E8520A" }}
                  >
                    <Icon size={16} className="text-white" />
                  </div>
                  <span
                    className="text-white font-black uppercase tracking-wide text-xs"
                    style={{ fontFamily: "var(--font-montserrat)" }}
                  >
                    {text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Dots */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 flex gap-1.5">
            {sliderImages.map((_, i) => (
              <button
                key={i}
                onClick={() => setSlide(i)}
                aria-label={`Slide ${i + 1}`}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === slide ? "1.25rem" : "0.375rem",
                  height: "0.375rem",
                  backgroundColor: i === slide ? "#E8520A" : "rgba(255,255,255,0.4)",
                }}
              />
            ))}
          </div>
        </div>

        {/* ── Main content ────────────────────────────────── */}
        <div className="bg-gray-50 py-14">
          <div className="container-custom">
            {sent ? (
              /* Success */
              <div className="max-w-lg mx-auto text-center py-16">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                  style={{ backgroundColor: "rgba(26,58,107,0.08)" }}
                >
                  <CheckCircle size={38} style={{ color: "#1A3A6B" }} />
                </div>
                <h2
                  className="text-2xl font-black uppercase mb-3"
                  style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}
                >
                  Demande envoyée !
                </h2>
                <p className="text-gray-500 mb-8" style={{ fontFamily: "var(--font-lato)" }}>
                  Notre équipe analyse votre demande et vous contacte sous 24h ouvrées avec une offre personnalisée.
                </p>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-black text-white text-sm uppercase tracking-wide hover:opacity-90"
                  style={{ backgroundColor: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}
                >
                  Retour à l'accueil <ArrowRight size={16} />
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

                {/* ── Form ────────────────────────────────── */}
                <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-5">

                  {/* 01 — Service */}
                  <div className="bg-white rounded-2xl border border-gray-100 p-7 shadow-sm">
                    <SectionTitle number="01" title="Type de service" />
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5">
                      {serviceTypes.map(({ id, icon: Icon, label }) => {
                        const active = selectedService === id;
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => setSelectedService(id)}
                            className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center"
                            style={{
                              borderColor: active ? "#1A3A6B" : "#e5e7eb",
                              backgroundColor: active ? "rgba(26,58,107,0.05)" : "white",
                            }}
                          >
                            <div
                              className="w-10 h-10 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: active ? "#1A3A6B" : "#f3f4f6" }}
                            >
                              <Icon size={18} style={{ color: active ? "white" : "#9ca3af" }} />
                            </div>
                            <span
                              className="text-xs font-black uppercase leading-tight"
                              style={{ color: active ? "#1A3A6B" : "#9ca3af", fontFamily: "var(--font-montserrat)" }}
                            >
                              {label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 02 — Route */}
                  <div className="bg-white rounded-2xl border border-gray-100 p-7 shadow-sm">
                    <SectionTitle number="02" title="Route & transport" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
                      <Field label="Ville / Pays d'origine" icon={<MapPin size={15} />} required>
                        <input
                          type="text"
                          required
                          placeholder="ex. Pointe-Noire, Congo"
                          className={inputCls}
                          style={{ fontFamily: "var(--font-lato)" }}
                        />
                      </Field>
                      <Field label="Ville / Pays de destination" icon={<MapPin size={15} />} required>
                        <input
                          type="text"
                          required
                          placeholder="ex. Paris, France"
                          className={inputCls}
                          style={{ fontFamily: "var(--font-lato)" }}
                        />
                      </Field>
                    </div>
                    <div className="mt-5">
                      <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>
                        Mode de transport
                      </label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {transportModes.map((m) => {
                          const active = selectedMode === m;
                          return (
                            <button
                              key={m}
                              type="button"
                              onClick={() => setSelectedMode(m)}
                              className="px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wide border-2 transition-all"
                              style={{
                                borderColor: active ? "#E8520A" : "#e5e7eb",
                                color: active ? "#E8520A" : "#9ca3af",
                                backgroundColor: active ? "rgba(232,82,10,0.05)" : "white",
                                fontFamily: "var(--font-montserrat)",
                              }}
                            >
                              {m}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* 03 — Marchandise */}
                  <div className="bg-white rounded-2xl border border-gray-100 p-7 shadow-sm">
                    <SectionTitle number="03" title="Marchandise" />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
                      <Field label="Type de marchandise" icon={<Package size={15} />} required>
                        <input
                          type="text"
                          required
                          placeholder="ex. Électronique"
                          className={inputCls}
                          style={{ fontFamily: "var(--font-lato)" }}
                        />
                      </Field>
                      <Field label="Poids estimé (kg)" icon={<Weight size={15} />}>
                        <input
                          type="number"
                          min="0"
                          placeholder="ex. 500"
                          className={inputCls}
                          style={{ fontFamily: "var(--font-lato)" }}
                        />
                      </Field>
                      <Field label="Volume estimé (m³)" icon={<Package size={15} />}>
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          placeholder="ex. 2.5"
                          className={inputCls}
                          style={{ fontFamily: "var(--font-lato)" }}
                        />
                      </Field>
                    </div>
                    <label className="flex items-center gap-3 mt-5 cursor-pointer w-fit">
                      <input
                        type="checkbox"
                        checked={isDangerous}
                        onChange={(e) => setIsDangerous(e.target.checked)}
                        className="w-4 h-4 rounded accent-[#E8520A]"
                      />
                      <span className="text-sm text-gray-500" style={{ fontFamily: "var(--font-lato)" }}>
                        Marchandises dangereuses ou matières sensibles
                      </span>
                    </label>
                  </div>

                  {/* 04 — Calendrier */}
                  <div className="bg-white rounded-2xl border border-gray-100 p-7 shadow-sm">
                    <SectionTitle number="04" title="Calendrier" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
                      <Field label="Date d'expédition souhaitée" icon={<Calendar size={15} />}>
                        <input
                          type="date"
                          className={inputCls}
                          style={{ fontFamily: "var(--font-lato)" }}
                        />
                      </Field>
                      <div>
                        <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>
                          Urgence
                        </label>
                        <div className="flex gap-3 mt-2">
                          {[
                            { value: "standard", label: "Standard", desc: "Délai normal" },
                            { value: "urgent", label: "Urgent", desc: "Prioritaire" },
                          ].map((opt) => {
                            const active = urgency === opt.value;
                            return (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => setUrgency(opt.value)}
                                className="flex-1 p-3 rounded-xl border-2 text-center transition-all"
                                style={{
                                  borderColor: active ? "#1A3A6B" : "#e5e7eb",
                                  backgroundColor: active ? "rgba(26,58,107,0.05)" : "white",
                                }}
                              >
                                <div
                                  className="font-black text-xs uppercase"
                                  style={{ color: active ? "#1A3A6B" : "#9ca3af", fontFamily: "var(--font-montserrat)" }}
                                >
                                  {opt.label}
                                </div>
                                <div className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: "var(--font-lato)" }}>
                                  {opt.desc}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 05 — Coordonnées */}
                  <div className="bg-white rounded-2xl border border-gray-100 p-7 shadow-sm">
                    <SectionTitle number="05" title="Vos coordonnées" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
                      <Field label="Nom complet" icon={<User size={15} />} required>
                        <input
                          type="text"
                          required
                          placeholder="Votre nom"
                          className={inputCls}
                          style={{ fontFamily: "var(--font-lato)" }}
                        />
                      </Field>
                      <Field label="Entreprise" icon={<Building2 size={15} />}>
                        <input
                          type="text"
                          placeholder="Optionnel"
                          className={inputCls}
                          style={{ fontFamily: "var(--font-lato)" }}
                        />
                      </Field>
                      <Field label="Adresse email" icon={<Mail size={15} />} required>
                        <input
                          type="email"
                          required
                          placeholder="vous@exemple.com"
                          className={inputCls}
                          style={{ fontFamily: "var(--font-lato)" }}
                        />
                      </Field>
                      <Field label="Téléphone / WhatsApp" icon={<Phone size={15} />} required>
                        <input
                          type="tel"
                          required
                          placeholder="+242 00 000 00 00"
                          className={inputCls}
                          style={{ fontFamily: "var(--font-lato)" }}
                        />
                      </Field>
                    </div>
                    <div className="mt-4">
                      <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>
                        Message complémentaire
                      </label>
                      <div className="relative">
                        <MessageSquare size={15} className="absolute left-3 top-3 text-gray-400" />
                        <textarea
                          rows={4}
                          placeholder="Précisions sur votre demande, contraintes spécifiques..."
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#1A3A6B] focus:ring-2 focus:ring-[#1A3A6B]/10 transition-all bg-white resize-none"
                          style={{ fontFamily: "var(--font-lato)" }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 py-4 rounded-xl font-black text-white uppercase tracking-wide transition-all hover:opacity-90 hover:shadow-lg disabled:opacity-60"
                    style={{ backgroundColor: "#E8520A", fontFamily: "var(--font-montserrat)" }}
                  >
                    {loading ? (
                      <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send size={16} />
                        Envoyer ma demande de devis
                      </>
                    )}
                  </button>
                </form>

                {/* ── Sidebar ─────────────────────────────── */}
                <div className="lg:col-span-1">
                  <div className="sticky top-24 space-y-4">

                    {/* Why EXPAC */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                      <h3
                        className="font-black uppercase text-sm mb-5"
                        style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}
                      >
                        Pourquoi choisir EXPAC ?
                      </h3>
                      <ul className="space-y-4">
                        {[
                          { icon: Clock, text: "Réponse garantie sous 24h ouvrées" },
                          { icon: CheckCircle, text: "Devis gratuit, sans engagement" },
                          { icon: MapPin, text: "Couverture de toute l'Afrique" },
                          { icon: User, text: "Interlocuteur dédié à votre dossier" },
                        ].map(({ icon: Icon, text }) => (
                          <li key={text} className="flex items-start gap-3">
                            <Icon size={16} className="mt-0.5 shrink-0" style={{ color: "#E8520A" }} />
                            <span className="text-sm text-gray-600" style={{ fontFamily: "var(--font-lato)" }}>
                              {text}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Contact urgent */}
                    <div
                      className="rounded-2xl p-6"
                      style={{ background: "linear-gradient(135deg, #0e2248 0%, #1A3A6B 100%)" }}
                    >
                      <p
                        className="text-xs font-black uppercase tracking-widest mb-2"
                        style={{ color: "#fba563", fontFamily: "var(--font-montserrat)" }}
                      >
                        Demande urgente ?
                      </p>
                      <p
                        className="text-white font-black text-sm mb-4"
                        style={{ fontFamily: "var(--font-montserrat)" }}
                      >
                        Contactez-nous directement
                      </p>
                      <a
                        href="tel:+242000000000"
                        className="flex items-center gap-2 text-sm text-blue-200 hover:text-white transition-colors mb-3"
                        style={{ fontFamily: "var(--font-lato)" }}
                      >
                        <Phone size={14} className="shrink-0" />
                        +242 00 000 00 00
                      </a>
                      <a
                        href="mailto:contact@expaccargoltd.com"
                        className="flex items-center gap-2 text-sm text-blue-200 hover:text-white transition-colors"
                        style={{ fontFamily: "var(--font-lato)" }}
                      >
                        <Mail size={14} className="shrink-0" />
                        contact@expaccargoltd.com
                      </a>
                    </div>

                    {/* Link to services */}
                    <Link
                      href="/services"
                      className="flex items-center justify-between p-4 rounded-xl border-2 hover:bg-orange-50 transition-all"
                      style={{ borderColor: "#E8520A" }}
                    >
                      <span
                        className="text-xs font-black uppercase tracking-wide"
                        style={{ color: "#E8520A", fontFamily: "var(--font-montserrat)" }}
                      >
                        Voir nos services
                      </span>
                      <ChevronRight size={16} style={{ color: "#E8520A" }} />
                    </Link>
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
