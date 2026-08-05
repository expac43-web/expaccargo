import type { Metadata } from "next";
import Image from "next/image";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import ReclamationForm from "./ReclamationForm";
import { getServerDict } from "@/lib/i18n/server";
import {
  ClipboardList, Camera, PenLine, Lightbulb, BadgeCheck, Clock, ShieldCheck,
  Phone, Mail, MapPin,
} from "lucide-react";

const NAVY = "#1A3A6B";
const ORANGE = "#E8520A";
// Poignée de main / confiance — écho au texte « renforcer la confiance qui nous unit ».
const HERO_BG = "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1600&q=55";
const fontM = { fontFamily: "var(--font-montserrat)" };
const fontL = { fontFamily: "var(--font-lato)" };

export const metadata: Metadata = {
  title: "Réclamation & Service Client — EXPAC",
  description:
    "Déposez et suivez votre réclamation auprès d'EXPAC, commissionnaire agréé en douane et transitaire au Congo (Pointe-Noire & Brazzaville). Première réponse sous 48 heures ouvrées.",
  alternates: { canonical: "https://www.expaccargo.com/reclamation" },
};

export default async function ReclamationPage() {
  const t = await getServerDict();
  const r = t.reclamation;

  const STEPS = [
    { Icon: ClipboardList, title: r.step1Title, text: r.step1Text },
    { Icon: Camera, title: r.step2Title, text: r.step2Text },
    { Icon: PenLine, title: r.step3Title, text: r.step3Text },
  ];
  const ENGAGEMENTS = [
    { Icon: BadgeCheck, title: r.eng1Title, text: r.eng1Text },
    { Icon: Clock, title: r.eng2Title, text: r.eng2Text },
    { Icon: ShieldCheck, title: r.eng3Title, text: r.eng3Text },
  ];
  const CONTACTS = [
    { Icon: Phone, label: r.cPhone, value: "+242 06 436 38 82", note: r.cPhoneNote, href: "tel:+242064363882" },
    { Icon: Mail, label: r.cEmail, value: "contact@expaccargo.com", href: "mailto:contact@expaccargo.com" },
    { Icon: MapPin, label: r.cMail, value: "Résidence les Palmiers, Bat C 2ème étage, Appt Caïman — Av. Germain Bikoumat, Centre-Ville, Pointe-Noire", note: undefined as string | undefined, href: undefined as string | undefined },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 pt-16">
        {/* ── HERO ─────────────────────────────────────────────── */}
        <section className="relative overflow-hidden py-24 lg:py-28">
          <Image src={HERO_BG} alt="Service client EXPAC" fill priority sizes="100vw" className="object-cover" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(120deg, rgba(14,34,72,0.95) 0%, rgba(26,58,107,0.9) 55%, rgba(36,64,126,0.8) 100%)" }} />
          <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full opacity-10" style={{ backgroundColor: ORANGE }} />
          <div className="absolute -left-16 bottom-0 w-72 h-72 rounded-full opacity-10" style={{ backgroundColor: ORANGE }} />
          <div className="container-custom relative z-10">
            <div className="max-w-3xl">
              <p className="text-xs font-black uppercase tracking-[0.25em] mb-4" style={{ color: "#fba563", ...fontM }}>▪ {r.heroEyebrow}</p>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white uppercase leading-[1.05] mb-6" style={fontM}>
                {r.heroTitle}
              </h1>
              <p className="text-lg md:text-xl text-blue-100 leading-relaxed max-w-2xl" style={fontL}>
                {r.heroSubtitle}
              </p>
            </div>
          </div>
        </section>

        {/* ── INTRO ────────────────────────────────────────────── */}
        <section className="bg-white py-16 lg:py-20">
          <div className="container-custom">
            <div className="max-w-3xl">
              <p className="text-gray-600 text-base lg:text-lg leading-relaxed mb-5" style={fontL}>{r.intro1}</p>
              <p className="text-gray-600 text-base lg:text-lg leading-relaxed" style={fontL}>{r.intro2}</p>
            </div>
          </div>
        </section>

        {/* ── COMMENT SOUMETTRE ────────────────────────────────── */}
        <section className="bg-gray-50 py-16 lg:py-20 border-t border-gray-100">
          <div className="container-custom">
            <div className="max-w-2xl mb-12">
              <p className="text-xs font-black uppercase tracking-[0.25em] mb-3 text-gray-400" style={fontM}>▪ {r.howEyebrow}</p>
              <h2 className="text-2xl md:text-3xl font-black mb-4" style={{ color: NAVY, ...fontM }}>{r.howTitle}</h2>
              <p className="text-gray-500" style={fontL}>{r.howSubtitle}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
              {STEPS.map(({ Icon, title, text }, i) => (
                <div key={i} className="relative bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                  <span className="absolute top-5 right-5 text-5xl font-black opacity-[0.06]" style={{ color: NAVY, ...fontM }}>{i + 1}</span>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: "rgba(232,82,10,0.1)" }}>
                    <Icon size={22} style={{ color: ORANGE }} />
                  </div>
                  <h3 className="font-black text-base mb-2" style={{ color: NAVY, ...fontM }}>{title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed" style={fontL}>{text}</p>
                </div>
              ))}
            </div>

            {/* Conseil d'expert */}
            <div className="rounded-2xl p-6 lg:p-7 flex items-start gap-4" style={{ background: "linear-gradient(135deg, #0e2248 0%, #1A3A6B 100%)" }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "rgba(251,165,99,0.15)" }}>
                <Lightbulb size={22} style={{ color: "#fba563" }} />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest mb-1.5" style={{ color: "#fba563", ...fontM }}>{r.tipEyebrow}</p>
                <p className="text-blue-100 leading-relaxed" style={fontL}>{r.tipText}</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── NOS ENGAGEMENTS ──────────────────────────────────── */}
        <section className="bg-white py-16 lg:py-20 border-t border-gray-100">
          <div className="container-custom">
            <div className="max-w-2xl mb-12">
              <p className="text-xs font-black uppercase tracking-[0.25em] mb-3 text-gray-400" style={fontM}>▪ {r.engEyebrow}</p>
              <h2 className="text-2xl md:text-3xl font-black" style={{ color: NAVY, ...fontM }}>{r.engTitle}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {ENGAGEMENTS.map(({ Icon, title, text }, i) => (
                <div key={i} className="bg-gray-50 rounded-2xl border border-gray-100 p-6">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: `linear-gradient(135deg, ${NAVY}, ${ORANGE})` }}>
                    <Icon size={22} strokeWidth={1.9} className="text-white" />
                  </div>
                  <h3 className="font-black text-base mb-2" style={{ color: NAVY, ...fontM }}>{title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed" style={fontL}>{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FORMULAIRE + CONTACT ─────────────────────────────── */}
        <section className="bg-gray-50 py-16 lg:py-20 border-t border-gray-100">
          <div className="container-custom">
            <div className="max-w-2xl mb-10">
              <p className="text-xs font-black uppercase tracking-[0.25em] mb-3 text-gray-400" style={fontM}>▪ {r.formEyebrow}</p>
              <h2 className="text-2xl md:text-3xl font-black mb-3" style={{ color: NAVY, ...fontM }}>{r.formTitle}</h2>
              <p className="text-gray-500" style={fontL}>{r.formSubtitle}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              {/* Formulaire */}
              <div className="lg:col-span-2">
                <ReclamationForm />
              </div>

              {/* Autres moyens de contact */}
              <div className="lg:col-span-1 space-y-4">
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                  <h3 className="font-black uppercase text-sm mb-1.5" style={{ color: NAVY, ...fontM }}>{r.contactTitle}</h3>
                  <p className="text-xs text-gray-400 mb-5" style={fontL}>{r.contactSubtitle}</p>
                  <ul className="space-y-5">
                    {CONTACTS.map(({ Icon, label, value, note, href }) => (
                      <li key={label} className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: "rgba(232,82,10,0.1)" }}>
                          <Icon size={16} style={{ color: ORANGE }} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-black uppercase tracking-wider mb-0.5" style={{ color: NAVY, ...fontM }}>{label}</p>
                          {href ? (
                            <a href={href} className="text-sm text-gray-600 hover:text-[#E8520A] transition-colors break-words" style={fontL}>{value}</a>
                          ) : (
                            <p className="text-sm text-gray-600 break-words" style={fontL}>{value}</p>
                          )}
                          {note && <p className="text-[11px] text-gray-400 mt-0.5" style={fontL}>{note}</p>}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-2xl p-6" style={{ background: "linear-gradient(135deg, #0e2248 0%, #1A3A6B 100%)" }}>
                  <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: "#fba563", ...fontM }}>{r.urgentEyebrow}</p>
                  <p className="text-white font-black text-sm mb-4" style={fontM}>{r.urgentText}</p>
                  <a href="tel:+242064363882"
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-black text-white text-sm uppercase tracking-wide hover:opacity-90 transition-all"
                    style={{ backgroundColor: ORANGE, ...fontM }}>
                    <Phone size={15} />+242 06 436 38 82
                  </a>
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
