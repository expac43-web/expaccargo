"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Plane, Truck, Warehouse, Ship, Package,
  MapPin, Calendar, User, Building2,
  Mail, Phone, MessageSquare, ChevronRight,
  Clock, CheckCircle, ArrowRight, Send, Weight, Calculator,
} from "lucide-react";
import { useT } from "@/components/i18n/LanguageProvider";

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

const SERVICE_MAP: Record<string, string> = {
  TRANSIT: "TRANSIT",
  TRANSPORT: "MULTIMODAL",
  STOCKAGE: "STORAGE",
  CONSIGNATION: "MARITIME_CONSIGNMENT",
  GROUPAGE: "GROUPAGE",
};

// id + icône (les libellés viennent du dictionnaire).
const serviceMeta = [
  { id: "TRANSIT", icon: Plane },
  { id: "TRANSPORT", icon: Truck },
  { id: "STOCKAGE", icon: Warehouse },
  { id: "CONSIGNATION", icon: Ship },
  { id: "GROUPAGE", icon: Package },
] as const;

// Valeurs stables (stockées dans la note interne) ; affichage traduit via le dico.
const transportModes = ["Maritime", "Aérien", "Routier", "Multimodal"];

const labelCls = "block text-xs font-black uppercase tracking-wider mb-1.5 text-gray-600";
const inputCls = "w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#1A3A6B] focus:ring-2 focus:ring-[#1A3A6B]/10 transition-all bg-white";

function SectionTitle({ number, title }: { number: string; title: string }) {
  return (
    <div className="flex items-center gap-4">
      <span className="text-3xl font-black leading-none select-none" style={{ color: "#1A3A6B", opacity: 0.15, fontFamily: "var(--font-montserrat)" }}>
        {number}
      </span>
      <h2 className="text-base font-black uppercase" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
        {title}
      </h2>
    </div>
  );
}

function Field({ label, icon, required, children }: { label: string; icon: React.ReactNode; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>
        {label}{required && <span className="text-red-400 ml-1">*</span>}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-3 text-gray-400">{icon}</span>
        {children}
      </div>
    </div>
  );
}

export default function DevisForm() {
  const { t } = useT();
  const df = t.devisForm;
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [urgency, setUrgency] = useState("standard");
  const [isDangerous, setIsDangerous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [slide, setSlide] = useState(0);

  const modeLabels: Record<string, string> = {
    Maritime: df.modes.maritime, "Aérien": df.modes.air, Routier: df.modes.road, Multimodal: df.modes.multimodal,
  };
  const urgencyOptions = [
    { value: "standard", label: df.standard, desc: df.standardDesc },
    { value: "urgent", label: df.urgent, desc: df.urgentDesc },
  ];
  const whyIcons = [Clock, CheckCircle, MapPin, User];
  const badges = [
    { icon: Clock, text: df.badge24h },
    { icon: CheckCircle, text: df.badgeFree },
    { icon: Phone, text: df.badgeSupport },
  ];

  useEffect(() => {
    const timer = setInterval(() => setSlide((p) => (p + 1) % sliderImages.length), 4000);
    return () => clearInterval(timer);
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    if (!selectedService) { setFormError(df.errNoService); return; }
    const form = e.currentTarget;
    const g = (n: string) => (form.elements.namedItem(n) as HTMLInputElement | HTMLTextAreaElement)?.value ?? "";
    const extras: string[] = [];
    if (urgency === "urgent") extras.push("⚡ Demande urgente");
    const userNotes = g("notes");
    if (userNotes) extras.push(userNotes);
    const payload = {
      name: g("clientName"), email: g("email"), phone: g("phone"),
      serviceType: SERVICE_MAP[selectedService] ?? "TRANSIT",
      origin: g("origin"), destination: g("destination"),
      cargoType: g("cargoType"),
      weight: g("weight") ? Number(g("weight")) : null,
      volume: g("volume") ? Number(g("volume")) : null,
      transportMode: selectedMode,
      preferredDate: g("preferredDate") || null,
      dangerous: isDangerous,
      notes: extras.join(" | ") || null,
    };
    setLoading(true);
    try {
      const r = await fetch("/api/devis", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!r.ok) { const d = await r.json(); setFormError(d.error ?? df.errGeneric); }
      else setSent(true);
    } catch { setFormError(df.errNetwork); }
    finally { setLoading(false); }
  }

  return (
    <main className="flex-1 pt-16">
      {/* Header */}
      <div className="relative py-16 overflow-hidden" style={{ background: "linear-gradient(135deg, #0e2248 0%, #1A3A6B 60%, #2a5298 100%)" }}>
        <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full opacity-10" style={{ backgroundColor: "#E8520A" }} />
        <div className="absolute -left-10 bottom-0 w-56 h-56 rounded-full opacity-10" style={{ backgroundColor: "#E8520A" }} />
        <div className="container-custom relative z-10">
          <p className="text-xs font-black uppercase tracking-[0.2em] mb-4" style={{ color: "#fba563", fontFamily: "var(--font-montserrat)" }}>▪ {df.eyebrow}</p>
          <h1 className="text-4xl lg:text-5xl font-black text-white uppercase leading-tight mb-4" style={{ fontFamily: "var(--font-montserrat)" }}>
            {df.titlePre} <span style={{ color: "#E8520A" }}>{df.titleHighlight}</span>
          </h1>
          <p className="text-blue-200 max-w-xl" style={{ fontFamily: "var(--font-lato)" }}>
            {df.subtitle}
          </p>
          <Link
            href="/calculateur"
            className="inline-flex items-center gap-2 mt-5 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wide bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-all"
            style={{ fontFamily: "var(--font-montserrat)" }}
          >
            <Calculator size={14} /> {df.estimateFirst}
          </Link>
        </div>
      </div>

      {/* Mini slider */}
      <div className="relative h-48 overflow-hidden">
        {sliderImages.map((img, i) => (
          <div key={i} className="absolute inset-0 transition-opacity duration-1000 ease-in-out" style={{ opacity: i === slide ? 1 : 0 }}>
            <Image src={img.src} alt={img.alt} fill className="object-cover" sizes="100vw" />
          </div>
        ))}
        <div className="absolute inset-0 z-10" style={{ backgroundColor: "rgba(14, 34, 72, 0.75)" }} />
        <div className="absolute inset-0 z-20 flex items-center justify-center">
          <div className="flex flex-wrap items-center justify-center gap-6 px-4">
            {badges.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "#E8520A" }}>
                  <Icon size={16} className="text-white" />
                </div>
                <span className="text-white font-black uppercase tracking-wide text-xs" style={{ fontFamily: "var(--font-montserrat)" }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 flex gap-1.5">
          {sliderImages.map((_, i) => (
            <button key={i} onClick={() => setSlide(i)} aria-label={`Slide ${i + 1}`} className="rounded-full transition-all duration-300"
              style={{ width: i === slide ? "1.25rem" : "0.375rem", height: "0.375rem", backgroundColor: i === slide ? "#E8520A" : "rgba(255,255,255,0.4)" }} />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="bg-gray-50 py-14">
        <div className="container-custom">
          {sent ? (
            <div className="max-w-lg mx-auto text-center py-16">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: "rgba(26,58,107,0.08)" }}>
                <CheckCircle size={38} style={{ color: "#1A3A6B" }} />
              </div>
              <h2 className="text-2xl font-black uppercase mb-3" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>{df.sentTitle}</h2>
              <p className="text-gray-500 mb-8" style={{ fontFamily: "var(--font-lato)" }}>
                {df.sentText}
              </p>
              <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-black text-white text-sm uppercase tracking-wide hover:opacity-90" style={{ backgroundColor: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
                {df.backHome} <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-5">

                {/* 01 — Service */}
                <div className="bg-white rounded-2xl border border-gray-100 p-7 shadow-sm">
                  <SectionTitle number="01" title={df.s1} />
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5">
                    {serviceMeta.map(({ id, icon: Icon }) => {
                      const active = selectedService === id;
                      return (
                        <button key={id} type="button" onClick={() => setSelectedService(id)}
                          className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center"
                          style={{ borderColor: active ? "#1A3A6B" : "#e5e7eb", backgroundColor: active ? "rgba(26,58,107,0.05)" : "white" }}>
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: active ? "#1A3A6B" : "#f3f4f6" }}>
                            <Icon size={18} style={{ color: active ? "white" : "#9ca3af" }} />
                          </div>
                          <span className="text-xs font-black uppercase leading-tight" style={{ color: active ? "#1A3A6B" : "#9ca3af", fontFamily: "var(--font-montserrat)" }}>{df.services[id]}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 02 — Route */}
                <div className="bg-white rounded-2xl border border-gray-100 p-7 shadow-sm">
                  <SectionTitle number="02" title={df.s2} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
                    <Field label={df.origin} icon={<MapPin size={15} />} required>
                      <input name="origin" type="text" required placeholder={df.originPh} className={inputCls} style={{ fontFamily: "var(--font-lato)" }} />
                    </Field>
                    <Field label={df.destination} icon={<MapPin size={15} />} required>
                      <input name="destination" type="text" required placeholder={df.destinationPh} className={inputCls} style={{ fontFamily: "var(--font-lato)" }} />
                    </Field>
                  </div>
                  <div className="mt-5">
                    <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>{df.transportMode}</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {transportModes.map((m) => {
                        const active = selectedMode === m;
                        return (
                          <button key={m} type="button" onClick={() => setSelectedMode(m)}
                            className="px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wide border-2 transition-all"
                            style={{ borderColor: active ? "#E8520A" : "#e5e7eb", color: active ? "#E8520A" : "#9ca3af", backgroundColor: active ? "rgba(232,82,10,0.05)" : "white", fontFamily: "var(--font-montserrat)" }}>
                            {modeLabels[m] ?? m}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 03 — Marchandise */}
                <div className="bg-white rounded-2xl border border-gray-100 p-7 shadow-sm">
                  <SectionTitle number="03" title={df.s3} />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
                    <Field label={df.cargoType} icon={<Package size={15} />} required>
                      <input name="cargoType" type="text" required placeholder={df.cargoTypePh} className={inputCls} style={{ fontFamily: "var(--font-lato)" }} />
                    </Field>
                    <Field label={df.weight} icon={<Weight size={15} />}>
                      <input name="weight" type="number" min="0" placeholder={df.weightPh} className={inputCls} style={{ fontFamily: "var(--font-lato)" }} />
                    </Field>
                    <Field label={df.volume} icon={<Package size={15} />}>
                      <input name="volume" type="number" min="0" step="0.1" placeholder={df.volumePh} className={inputCls} style={{ fontFamily: "var(--font-lato)" }} />
                    </Field>
                  </div>
                  <label className="flex items-center gap-3 mt-5 cursor-pointer w-fit">
                    <input type="checkbox" checked={isDangerous} onChange={(e) => setIsDangerous(e.target.checked)} className="w-4 h-4 rounded accent-[#E8520A]" />
                    <span className="text-sm text-gray-500" style={{ fontFamily: "var(--font-lato)" }}>{df.dangerous}</span>
                  </label>
                </div>

                {/* 04 — Calendrier */}
                <div className="bg-white rounded-2xl border border-gray-100 p-7 shadow-sm">
                  <SectionTitle number="04" title={df.s4} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
                    <Field label={df.preferredDate} icon={<Calendar size={15} />}>
                      <input name="preferredDate" type="date" className={inputCls} style={{ fontFamily: "var(--font-lato)" }} />
                    </Field>
                    <div>
                      <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>{df.urgency}</label>
                      <div className="flex gap-3 mt-2">
                        {urgencyOptions.map((opt) => {
                          const active = urgency === opt.value;
                          return (
                            <button key={opt.value} type="button" onClick={() => setUrgency(opt.value)}
                              className="flex-1 p-3 rounded-xl border-2 text-center transition-all"
                              style={{ borderColor: active ? "#1A3A6B" : "#e5e7eb", backgroundColor: active ? "rgba(26,58,107,0.05)" : "white" }}>
                              <div className="font-black text-xs uppercase" style={{ color: active ? "#1A3A6B" : "#9ca3af", fontFamily: "var(--font-montserrat)" }}>{opt.label}</div>
                              <div className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: "var(--font-lato)" }}>{opt.desc}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 05 — Coordonnées */}
                <div className="bg-white rounded-2xl border border-gray-100 p-7 shadow-sm">
                  <SectionTitle number="05" title={df.s5} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
                    <Field label={df.fullName} icon={<User size={15} />} required>
                      <input name="clientName" type="text" required placeholder={df.fullNamePh} className={inputCls} style={{ fontFamily: "var(--font-lato)" }} />
                    </Field>
                    <Field label={df.company} icon={<Building2 size={15} />}>
                      <input name="company" type="text" placeholder={df.companyPh} className={inputCls} style={{ fontFamily: "var(--font-lato)" }} />
                    </Field>
                    <Field label={df.email} icon={<Mail size={15} />} required>
                      <input name="email" type="email" required placeholder={df.emailPh} className={inputCls} style={{ fontFamily: "var(--font-lato)" }} />
                    </Field>
                    <Field label={df.phone} icon={<Phone size={15} />} required>
                      <input name="phone" type="tel" required placeholder={df.phonePh} className={inputCls} style={{ fontFamily: "var(--font-lato)" }} />
                    </Field>
                  </div>
                  <div className="mt-4">
                    <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>{df.message}</label>
                    <div className="relative">
                      <MessageSquare size={15} className="absolute left-3 top-3 text-gray-400" />
                      <textarea name="notes" rows={4} placeholder={df.messagePh}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#1A3A6B] focus:ring-2 focus:ring-[#1A3A6B]/10 transition-all bg-white resize-none"
                        style={{ fontFamily: "var(--font-lato)" }} />
                    </div>
                  </div>
                </div>

                {formError && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100">
                    <span className="text-red-500 shrink-0" style={{ fontSize: 14 }}>⚠</span>
                    <p className="text-xs text-red-600" style={{ fontFamily: "var(--font-lato)" }}>{formError}</p>
                  </div>
                )}

                <button type="submit" disabled={loading}
                  className="w-full flex items-center justify-center gap-3 py-4 rounded-xl font-black text-white uppercase tracking-wide transition-all hover:opacity-90 hover:shadow-lg disabled:opacity-60"
                  style={{ backgroundColor: "#E8520A", fontFamily: "var(--font-montserrat)" }}>
                  {loading ? <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Send size={16} />{df.submit}</>}
                </button>
              </form>

              {/* Sidebar */}
              <div className="lg:col-span-1">
                <div className="sticky top-24 space-y-4">
                  <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <h3 className="font-black uppercase text-sm mb-5" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>{df.whyTitle}</h3>
                    <ul className="space-y-4">
                      {df.why.map((text, i) => {
                        const Icon = whyIcons[i] ?? CheckCircle;
                        return (
                          <li key={text} className="flex items-start gap-3">
                            <Icon size={16} className="mt-0.5 shrink-0" style={{ color: "#E8520A" }} />
                            <span className="text-sm text-gray-600" style={{ fontFamily: "var(--font-lato)" }}>{text}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  <div className="rounded-2xl p-6" style={{ background: "linear-gradient(135deg, #0e2248 0%, #1A3A6B 100%)" }}>
                    <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: "#fba563", fontFamily: "var(--font-montserrat)" }}>{df.urgentEyebrow}</p>
                    <p className="text-white font-black text-sm mb-4" style={{ fontFamily: "var(--font-montserrat)" }}>{df.urgentContact}</p>
                    <a href="tel:+242000000000" className="flex items-center gap-2 text-sm text-blue-200 hover:text-white transition-colors mb-3" style={{ fontFamily: "var(--font-lato)" }}>
                      <Phone size={14} className="shrink-0" />+242 00 000 00 00
                    </a>
                    <a href="mailto:contact@expaccargo.com" className="flex items-center gap-2 text-sm text-blue-200 hover:text-white transition-colors" style={{ fontFamily: "var(--font-lato)" }}>
                      <Mail size={14} className="shrink-0" />contact@expaccargo.com
                    </a>
                  </div>

                  <Link href="/services" className="flex items-center justify-between p-4 rounded-xl border-2 hover:bg-orange-50 transition-all" style={{ borderColor: "#E8520A" }}>
                    <span className="text-xs font-black uppercase tracking-wide" style={{ color: "#E8520A", fontFamily: "var(--font-montserrat)" }}>{df.seeServices}</span>
                    <ChevronRight size={16} style={{ color: "#E8520A" }} />
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
