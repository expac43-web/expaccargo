"use client";

import { useState } from "react";
import Image from "next/image";
import { MapPin, Phone, Mail, Clock, Send, User, MessageSquare, AlertCircle, CheckCircle, ChevronDown } from "lucide-react";
import { useT } from "@/components/i18n/LanguageProvider";
import AgrementBadge from "@/components/public/AgrementBadge";

const labelCls = "block text-xs font-black uppercase tracking-wider mb-1.5 text-gray-600";
const inputCls = "w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#1A3A6B] focus:ring-2 focus:ring-[#1A3A6B]/10 transition-all bg-white";

export default function ContactForm() {
  const { t } = useT();
  const c = t.contact;
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subjects = [c.subjects.info, c.subjects.quote, c.subjects.tracking, c.subjects.claim, c.subjects.partnership, c.subjects.other];
  const contacts = [
    { icon: MapPin, label: "Pointe-Noire", value: "Résidence les Palmiers, Bat C 2ème étage — Av. Germain Bikoumat, Centre-Ville" },
    { icon: MapPin, label: c.hq, value: "Croisement Av. de la Tsieme / Rue Mbetis Ouenze SOCECA-SOCEMA BZV" },
    { icon: Phone, label: c.cTelPN, value: "+242 06 436 38 82 / +242 05 052 60 43", href: "tel:+242064363882" },
    { icon: Phone, label: c.cTelBZV, value: "+242 05 511 97 11 / +242 05 640 22 77", href: "tel:+242055119711" },
    { icon: Mail, label: c.fieldEmail, value: "expacargo@gmail.com", href: "mailto:expacargo@gmail.com" },
    { icon: Clock, label: c.cHours, value: c.cHoursValue },
  ];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = e.currentTarget;
    const get = (name: string) => (form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement)?.value ?? "";
    const payload = { name: get("name"), email: get("email"), phone: get("phone"), subject: get("subject"), message: get("message") };
    try {
      const res = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error("Erreur serveur");
      setSent(true);
    } catch {
      setError(c.errorGeneric);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex-1 pt-16">
      {/* Header */}
      <div className="relative py-16 overflow-hidden" style={{ background: "linear-gradient(135deg, #0e2248 0%, #1A3A6B 60%, #2a5298 100%)" }}>
        <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full opacity-10" style={{ backgroundColor: "#E8520A" }} />
        <div className="absolute -left-10 bottom-0 w-56 h-56 rounded-full opacity-10" style={{ backgroundColor: "#E8520A" }} />
        <div className="container-custom relative z-10">
          <p className="text-xs font-black uppercase tracking-[0.2em] mb-4" style={{ color: "#fba563", fontFamily: "var(--font-montserrat)" }}>▪ {c.eyebrow}</p>
          <h1 className="text-4xl lg:text-5xl font-black text-white uppercase leading-tight mb-4" style={{ fontFamily: "var(--font-montserrat)" }}>
            {c.titlePre} <span style={{ color: "#E8520A" }}>{c.titleHighlight}</span>
          </h1>
          <p className="text-blue-200 max-w-xl" style={{ fontFamily: "var(--font-lato)" }}>
            {c.subtitle}
          </p>
          <div className="mt-5">
            <AgrementBadge tone="dark" />
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="bg-gray-50 py-14">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

            {/* Form */}
            <div className="lg:col-span-2">
              {sent ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-12 shadow-sm text-center">
                  <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: "rgba(26,58,107,0.08)" }}>
                    <CheckCircle size={38} style={{ color: "#1A3A6B" }} />
                  </div>
                  <h2 className="text-xl font-black uppercase mb-3" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>{c.sentTitle}</h2>
                  <p className="text-gray-500 mb-8" style={{ fontFamily: "var(--font-lato)" }}>
                    {c.sentText}
                  </p>
                  <button onClick={() => setSent(false)}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-black text-white text-sm uppercase tracking-wide hover:opacity-90"
                    style={{ backgroundColor: "#E8520A", fontFamily: "var(--font-montserrat)" }}>
                    {c.newMessage}
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
                  <h2 className="text-base font-black uppercase mb-6" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>{c.formTitle}</h2>
                  {error && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100 mb-5">
                      <AlertCircle size={15} className="text-red-500 shrink-0" />
                      <p className="text-xs text-red-600" style={{ fontFamily: "var(--font-lato)" }}>{error}</p>
                    </div>
                  )}
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>{c.fieldName} <span className="text-red-400">*</span></label>
                        <div className="relative">
                          <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input name="name" type="text" required placeholder={c.phName} className={inputCls} style={{ fontFamily: "var(--font-lato)" }} />
                        </div>
                      </div>
                      <div>
                        <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>{c.fieldEmail} <span className="text-red-400">*</span></label>
                        <div className="relative">
                          <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input name="email" type="email" required placeholder={c.phEmail} className={inputCls} style={{ fontFamily: "var(--font-lato)" }} />
                        </div>
                      </div>
                      <div>
                        <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>{c.fieldPhone}</label>
                        <div className="relative">
                          <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input name="phone" type="tel" placeholder="+242 00 000 00 00" className={inputCls} style={{ fontFamily: "var(--font-lato)" }} />
                        </div>
                      </div>
                      <div>
                        <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>{c.fieldSubject} <span className="text-red-400">*</span></label>
                        <div className="relative">
                          <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                          <select name="subject" required className="w-full pl-4 pr-10 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#1A3A6B] focus:ring-2 focus:ring-[#1A3A6B]/10 transition-all bg-white appearance-none" style={{ fontFamily: "var(--font-lato)" }}>
                            <option value="">{c.chooseSubject}</option>
                            {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>{c.fieldMessage} <span className="text-red-400">*</span></label>
                      <div className="relative">
                        <MessageSquare size={15} className="absolute left-3 top-3 text-gray-400" />
                        <textarea name="message" required rows={5} placeholder={c.phMessage}
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#1A3A6B] focus:ring-2 focus:ring-[#1A3A6B]/10 transition-all bg-white resize-none"
                          style={{ fontFamily: "var(--font-lato)" }} />
                      </div>
                    </div>
                    <button type="submit" disabled={loading}
                      className="w-full flex items-center justify-center gap-3 py-4 rounded-xl font-black text-white uppercase tracking-wide transition-all hover:opacity-90 hover:shadow-lg disabled:opacity-60"
                      style={{ backgroundColor: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
                      {loading ? <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Send size={16} />{c.send}</>}
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h3 className="font-black uppercase text-sm mb-5" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>{c.coordsTitle}</h3>
                <ul className="space-y-5">
                  {contacts.map(({ icon: Icon, label, value, href }) => (
                    <li key={label} className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: "rgba(232,82,10,0.1)" }}>
                        <Icon size={16} style={{ color: "#E8520A" }} />
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-wider mb-0.5" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>{label}</p>
                        {href ? (
                          <a href={href} className="text-sm text-gray-600 hover:text-[#E8520A] transition-colors" style={{ fontFamily: "var(--font-lato)" }}>{value}</a>
                        ) : (
                          <p className="text-sm text-gray-600" style={{ fontFamily: "var(--font-lato)" }}>{value}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl p-6" style={{ background: "linear-gradient(135deg, #0e2248 0%, #1A3A6B 100%)" }}>
                <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: "#fba563", fontFamily: "var(--font-montserrat)" }}>{c.urgentEyebrow}</p>
                <p className="text-white font-black text-sm mb-4" style={{ fontFamily: "var(--font-montserrat)" }}>{c.urgentText}</p>
                <a href="tel:+242064363882"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-black text-white text-sm uppercase tracking-wide hover:opacity-90 transition-all"
                  style={{ backgroundColor: "#E8520A", fontFamily: "var(--font-montserrat)" }}>
                  <Phone size={15} />+242 06 436 38 82
                </a>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── Mot du Co-fondateur ───────────────────────────────────── */}
      <section className="bg-white border-t border-gray-100 py-16 lg:py-20 overflow-hidden">
        <div className="container-custom">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

            {/* ── Gauche : texte ── */}
            <div className="flex-1 max-w-xl">

              <p className="text-xs font-black uppercase tracking-[0.25em] mb-5 text-gray-400"
                style={{ fontFamily: "var(--font-montserrat)" }}>
                ▪ {c.cofounderEyebrow}
              </p>

              <h2 className="font-black leading-tight mb-6"
                style={{ fontSize: "clamp(1.75rem, 4vw, 2.75rem)", color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
                {c.cofTitlePre}{" "}
                <span className="relative inline-block">
                  {c.cofTitleHighlight}
                  <span className="absolute left-0 -bottom-1 h-1.5 w-full rounded-full"
                    style={{ backgroundColor: "#E8520A" }} />
                </span>{c.cofTitlePost}
              </h2>

              <p className="text-gray-500 text-base lg:text-lg leading-relaxed mb-4"
                style={{ fontFamily: "var(--font-lato)" }}>
                {c.cofBody1}
              </p>
              <p className="text-gray-500 text-base lg:text-lg leading-relaxed mb-8"
                style={{ fontFamily: "var(--font-lato)" }}>
                {c.cofBody2}
              </p>

              <div className="mb-7">
                <p className="font-black text-base lg:text-lg uppercase"
                  style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
                  DOUCOURE MAKAN
                </p>
                <p className="text-sm text-gray-400 mt-1" style={{ fontFamily: "var(--font-lato)" }}>
                  {c.cofRole}
                </p>
              </div>

              <a
                href="https://www.linkedin.com/in/makan-doucoure-b5b781151/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black border-2 transition-all hover:text-white hover:shadow-lg"
                style={{
                  borderColor: "#0077b5",
                  color: "#0077b5",
                  fontFamily: "var(--font-montserrat)",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "#0077b5"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "transparent"; }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                  <rect x="2" y="9" width="4" height="12" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
                {c.linkedin}
              </a>
            </div>

            {/* ── Droite : photo circulaire + déco ── */}
            <div className="shrink-0 relative flex items-center justify-center"
              style={{ width: "clamp(280px, 36vw, 420px)", height: "clamp(280px, 36vw, 420px)" }}>

              <div className="absolute bottom-0 left-0 rounded-full pointer-events-none"
                style={{
                  width: "65%", height: "65%",
                  backgroundColor: "#1A3A6B",
                  transform: "translate(-18%, 18%)",
                }} />

              <div className="absolute bottom-4 right-0 pointer-events-none opacity-25"
                style={{
                  width: "38%", height: "38%",
                  backgroundImage: "radial-gradient(circle, #1A3A6B 1.8px, transparent 1.8px)",
                  backgroundSize: "11px 11px",
                }} />

              <div className="relative z-10 rounded-full overflow-hidden shadow-2xl border-4 border-white"
                style={{ width: "82%", height: "82%" }}>
                <Image
                  src="/images/doucoure.jpeg"
                  alt="DOUCOURE MAKAN — Co-fondateur EXPAC"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 280px, 380px"
                />
              </div>
            </div>

          </div>
        </div>
      </section>

    </main>
  );
}
