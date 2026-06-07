"use client";

import { useState } from "react";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import { MapPin, Phone, Mail, Clock, Send, User, MessageSquare, AlertCircle, CheckCircle, ChevronDown } from "lucide-react";

const subjects = [
  "Demande de renseignement",
  "Demande de devis",
  "Suivi d'expédition",
  "Réclamation",
  "Partenariat",
  "Autre",
];

const contacts = [
  {
    icon: MapPin,
    label: "Adresse",
    value: "Express Africa Cargo Ltd, République du Congo",
  },
  {
    icon: Phone,
    label: "Téléphone / WhatsApp",
    value: "+242 00 000 00 00",
    href: "tel:+242000000000",
  },
  {
    icon: Mail,
    label: "Email",
    value: "contact@expaccargoltd.com",
    href: "mailto:contact@expaccargoltd.com",
  },
  {
    icon: Clock,
    label: "Horaires",
    value: "Lun – Ven : 8h – 18h · Sam : 9h – 13h",
  },
];

const labelCls = "block text-xs font-black uppercase tracking-wider mb-1.5 text-gray-600";
const inputCls = "w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#1A3A6B] focus:ring-2 focus:ring-[#1A3A6B]/10 transition-all bg-white";

export default function ContactPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = e.currentTarget;
    const get = (name: string) => (form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement)?.value ?? "";

    const payload = {
      name: get("name"),
      email: get("email"),
      phone: get("phone"),
      subject: get("subject"),
      message: get("message"),
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Erreur serveur");
      setSent(true);
    } catch {
      setError("Une erreur est survenue. Réessayez ou contactez-nous par email directement.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">

        {/* Header */}
        <div
          className="relative py-16 overflow-hidden"
          style={{ background: "linear-gradient(135deg, #0e2248 0%, #1A3A6B 60%, #2a5298 100%)" }}
        >
          <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full opacity-10" style={{ backgroundColor: "#E8520A" }} />
          <div className="absolute -left-10 bottom-0 w-56 h-56 rounded-full opacity-10" style={{ backgroundColor: "#E8520A" }} />
          <div className="container-custom relative z-10">
            <p className="text-xs font-black uppercase tracking-[0.2em] mb-4" style={{ color: "#fba563", fontFamily: "var(--font-montserrat)" }}>
              ▪ Nous joindre
            </p>
            <h1 className="text-4xl lg:text-5xl font-black text-white uppercase leading-tight mb-4" style={{ fontFamily: "var(--font-montserrat)" }}>
              Contactez <span style={{ color: "#E8520A" }}>notre équipe</span>
            </h1>
            <p className="text-blue-200 max-w-xl" style={{ fontFamily: "var(--font-lato)" }}>
              Notre équipe vous répond sous 24h ouvrées. Pour une demande urgente, contactez-nous directement par téléphone.
            </p>
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
                    <h2 className="text-xl font-black uppercase mb-3" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
                      Message envoyé !
                    </h2>
                    <p className="text-gray-500 mb-8" style={{ fontFamily: "var(--font-lato)" }}>
                      Merci de nous avoir contactés. Notre équipe vous répondra dans les plus brefs délais.
                    </p>
                    <button
                      onClick={() => setSent(false)}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-black text-white text-sm uppercase tracking-wide hover:opacity-90"
                      style={{ backgroundColor: "#E8520A", fontFamily: "var(--font-montserrat)" }}
                    >
                      Nouveau message
                    </button>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
                    <h2 className="text-base font-black uppercase mb-6" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
                      Envoyer un message
                    </h2>

                    {error && (
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100 mb-5">
                        <AlertCircle size={15} className="text-red-500 shrink-0" />
                        <p className="text-xs text-red-600" style={{ fontFamily: "var(--font-lato)" }}>{error}</p>
                      </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Nom */}
                        <div>
                          <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>
                            Nom complet <span className="text-red-400">*</span>
                          </label>
                          <div className="relative">
                            <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                              name="name"
                              type="text"
                              required
                              placeholder="Votre nom"
                              className={inputCls}
                              style={{ fontFamily: "var(--font-lato)" }}
                            />
                          </div>
                        </div>

                        {/* Email */}
                        <div>
                          <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>
                            Email <span className="text-red-400">*</span>
                          </label>
                          <div className="relative">
                            <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                              name="email"
                              type="email"
                              required
                              placeholder="vous@exemple.com"
                              className={inputCls}
                              style={{ fontFamily: "var(--font-lato)" }}
                            />
                          </div>
                        </div>

                        {/* Téléphone */}
                        <div>
                          <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>
                            Téléphone
                          </label>
                          <div className="relative">
                            <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                              name="phone"
                              type="tel"
                              placeholder="+242 00 000 00 00"
                              className={inputCls}
                              style={{ fontFamily: "var(--font-lato)" }}
                            />
                          </div>
                        </div>

                        {/* Sujet */}
                        <div>
                          <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>
                            Sujet <span className="text-red-400">*</span>
                          </label>
                          <div className="relative">
                            <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            <select
                              name="subject"
                              required
                              className="w-full pl-4 pr-10 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#1A3A6B] focus:ring-2 focus:ring-[#1A3A6B]/10 transition-all bg-white appearance-none"
                              style={{ fontFamily: "var(--font-lato)" }}
                            >
                              <option value="">Choisir un sujet</option>
                              {subjects.map((s) => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Message */}
                      <div>
                        <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>
                          Message <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                          <MessageSquare size={15} className="absolute left-3 top-3 text-gray-400" />
                          <textarea
                            name="message"
                            required
                            rows={5}
                            placeholder="Décrivez votre demande en détail..."
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#1A3A6B] focus:ring-2 focus:ring-[#1A3A6B]/10 transition-all bg-white resize-none"
                            style={{ fontFamily: "var(--font-lato)" }}
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-3 py-4 rounded-xl font-black text-white uppercase tracking-wide transition-all hover:opacity-90 hover:shadow-lg disabled:opacity-60"
                        style={{ backgroundColor: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}
                      >
                        {loading ? (
                          <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <><Send size={16} /> Envoyer le message</>
                        )}
                      </button>
                    </form>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1 space-y-4">
                {/* Contact info */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                  <h3 className="font-black uppercase text-sm mb-5" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
                    Nos coordonnées
                  </h3>
                  <ul className="space-y-5">
                    {contacts.map(({ icon: Icon, label, value, href }) => (
                      <li key={label} className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: "rgba(232,82,10,0.1)" }}>
                          <Icon size={16} style={{ color: "#E8520A" }} />
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-wider mb-0.5" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
                            {label}
                          </p>
                          {href ? (
                            <a href={href} className="text-sm text-gray-600 hover:text-[#E8520A] transition-colors" style={{ fontFamily: "var(--font-lato)" }}>
                              {value}
                            </a>
                          ) : (
                            <p className="text-sm text-gray-600" style={{ fontFamily: "var(--font-lato)" }}>{value}</p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Urgent card */}
                <div className="rounded-2xl p-6" style={{ background: "linear-gradient(135deg, #0e2248 0%, #1A3A6B 100%)" }}>
                  <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: "#fba563", fontFamily: "var(--font-montserrat)" }}>
                    Demande urgente ?
                  </p>
                  <p className="text-white font-black text-sm mb-4" style={{ fontFamily: "var(--font-montserrat)" }}>
                    Appelez-nous directement
                  </p>
                  <a
                    href="tel:+242000000000"
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-black text-white text-sm uppercase tracking-wide hover:opacity-90 transition-all"
                    style={{ backgroundColor: "#E8520A", fontFamily: "var(--font-montserrat)" }}
                  >
                    <Phone size={15} />
                    +242 00 000 00 00
                  </a>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
