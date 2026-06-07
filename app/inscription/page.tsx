"use client";

import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import Link from "next/link";
import { useState } from "react";
import { Eye, EyeOff, ArrowRight, Lock, Mail, User, Phone, Building2, UserCircle } from "lucide-react";

type AccountType = "particulier" | "entreprise";

export default function InscriptionPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [accountType, setAccountType] = useState<AccountType>("particulier");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    // API /api/auth/register câblé ici
    setTimeout(() => setLoading(false), 1500);
  }

  return (
    <>
      <Navbar />

      {/* Page header */}
      <div
        className="pt-16"
        style={{
          background: "linear-gradient(135deg, #c44408 0%, #E8520A 100%)",
        }}
      >
        <div className="container-custom py-12 text-center">
          <p
            className="text-xs font-black uppercase tracking-[0.2em] mb-3 text-orange-100"
            style={{ fontFamily: "var(--font-montserrat)" }}
          >
            ▪ Compte gratuit
          </p>
          <h1
            className="text-3xl md:text-4xl font-black text-white uppercase"
            style={{ fontFamily: "var(--font-montserrat)" }}
          >
            Créer un compte
          </h1>
        </div>
      </div>

      {/* Form section */}
      <main className="bg-gray-50 py-16 flex-1">
        <div className="container-custom flex justify-center">
          <div className="w-full max-w-lg">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              {/* Header */}
              <div className="mb-7">
                <h2
                  className="text-xl font-black uppercase mb-1"
                  style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}
                >
                  Vos informations
                </h2>
                <p className="text-gray-500 text-sm" style={{ fontFamily: "var(--font-lato)" }}>
                  Votre compte sera créé avec le rôle{" "}
                  <strong className="text-gray-700">Client</strong>.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">

                {/* ── Type de compte ───────────────────────── */}
                <div>
                  <label
                    className="block text-xs font-black uppercase tracking-wider mb-3"
                    style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}
                  >
                    Type de compte *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setAccountType("particulier")}
                      className="flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 transition-all text-left"
                      style={{
                        borderColor: accountType === "particulier" ? "#1A3A6B" : "#e5e7eb",
                        backgroundColor: accountType === "particulier" ? "rgba(26,58,107,0.05)" : "white",
                      }}
                    >
                      <UserCircle
                        size={20}
                        style={{ color: accountType === "particulier" ? "#1A3A6B" : "#9ca3af" }}
                      />
                      <div>
                        <p
                          className="text-sm font-black uppercase"
                          style={{
                            color: accountType === "particulier" ? "#1A3A6B" : "#6b7280",
                            fontFamily: "var(--font-montserrat)",
                          }}
                        >
                          Particulier
                        </p>
                        <p className="text-xs text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>
                          Personne physique
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAccountType("entreprise")}
                      className="flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 transition-all text-left"
                      style={{
                        borderColor: accountType === "entreprise" ? "#E8520A" : "#e5e7eb",
                        backgroundColor: accountType === "entreprise" ? "rgba(232,82,10,0.05)" : "white",
                      }}
                    >
                      <Building2
                        size={20}
                        style={{ color: accountType === "entreprise" ? "#E8520A" : "#9ca3af" }}
                      />
                      <div>
                        <p
                          className="text-sm font-black uppercase"
                          style={{
                            color: accountType === "entreprise" ? "#E8520A" : "#6b7280",
                            fontFamily: "var(--font-montserrat)",
                          }}
                        >
                          Entreprise
                        </p>
                        <p className="text-xs text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>
                          Personne morale
                        </p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Nom entreprise (conditionnel) */}
                {accountType === "entreprise" && (
                  <div>
                    <label
                      htmlFor="company"
                      className="block text-xs font-black uppercase tracking-wider mb-2"
                      style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}
                    >
                      Nom de l&apos;entreprise *
                    </label>
                    <div className="relative">
                      <Building2 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        id="company"
                        type="text"
                        required={accountType === "entreprise"}
                        placeholder="Raison sociale"
                        className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#1A3A6B] focus:ring-2 focus:ring-[#1A3A6B]/10 transition-all bg-white"
                        style={{ fontFamily: "var(--font-lato)" }}
                      />
                    </div>
                  </div>
                )}

                {/* Nom complet */}
                <div>
                  <label
                    htmlFor="name"
                    className="block text-xs font-black uppercase tracking-wider mb-2"
                    style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}
                  >
                    {accountType === "entreprise" ? "Nom du responsable *" : "Nom complet *"}
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      id="name"
                      type="text"
                      required
                      autoComplete="name"
                      placeholder="Prénom et nom"
                      className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#1A3A6B] focus:ring-2 focus:ring-[#1A3A6B]/10 transition-all bg-white"
                      style={{ fontFamily: "var(--font-lato)" }}
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs font-black uppercase tracking-wider mb-2"
                    style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}
                  >
                    Adresse email *
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      id="email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="vous@exemple.com"
                      className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#1A3A6B] focus:ring-2 focus:ring-[#1A3A6B]/10 transition-all bg-white"
                      style={{ fontFamily: "var(--font-lato)" }}
                    />
                  </div>
                </div>

                {/* Téléphone + WhatsApp */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-xs font-black uppercase tracking-wider mb-2"
                      style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}
                    >
                      Téléphone
                    </label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        id="phone"
                        type="tel"
                        autoComplete="tel"
                        placeholder="+242 …"
                        className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#1A3A6B] focus:ring-2 focus:ring-[#1A3A6B]/10 transition-all bg-white"
                        style={{ fontFamily: "var(--font-lato)" }}
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="whatsapp"
                      className="block text-xs font-black uppercase tracking-wider mb-2"
                      style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}
                    >
                      WhatsApp
                    </label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        id="whatsapp"
                        type="tel"
                        placeholder="+242 …"
                        className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#1A3A6B] focus:ring-2 focus:ring-[#1A3A6B]/10 transition-all bg-white"
                        style={{ fontFamily: "var(--font-lato)" }}
                      />
                    </div>
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-xs font-black uppercase tracking-wider mb-2"
                    style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}
                  >
                    Mot de passe *
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="new-password"
                      placeholder="Minimum 8 caractères"
                      minLength={8}
                      className="w-full pl-11 pr-12 py-3.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#1A3A6B] focus:ring-2 focus:ring-[#1A3A6B]/10 transition-all bg-white"
                      style={{ fontFamily: "var(--font-lato)" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Confirm password */}
                <div>
                  <label
                    htmlFor="confirm"
                    className="block text-xs font-black uppercase tracking-wider mb-2"
                    style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}
                  >
                    Confirmer le mot de passe *
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      id="confirm"
                      type={showConfirm ? "text" : "password"}
                      required
                      autoComplete="new-password"
                      placeholder="Répétez votre mot de passe"
                      className="w-full pl-11 pr-12 py-3.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#1A3A6B] focus:ring-2 focus:ring-[#1A3A6B]/10 transition-all bg-white"
                      style={{ fontFamily: "var(--font-lato)" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      tabIndex={-1}
                    >
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Terms */}
                <label className="flex items-start gap-3 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    required
                    className="w-4 h-4 rounded border-gray-300 accent-[#E8520A] mt-0.5 shrink-0"
                  />
                  <span className="text-sm text-gray-500 leading-relaxed" style={{ fontFamily: "var(--font-lato)" }}>
                    J&apos;accepte les{" "}
                    <Link href="/mentions-legales" className="underline hover:text-[#E8520A]">
                      conditions d&apos;utilisation
                    </Link>{" "}
                    et la politique de confidentialité d&apos;EXPAC.
                  </span>
                </label>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-black text-white text-sm uppercase tracking-wide transition-all hover:opacity-90 hover:shadow-lg disabled:opacity-60 mt-2"
                  style={{ backgroundColor: "#E8520A", fontFamily: "var(--font-montserrat)" }}
                >
                  {loading ? (
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>Créer mon compte <ArrowRight size={16} /></>
                  )}
                </button>
              </form>

              <div className="flex items-center gap-4 my-5">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>Déjà un compte ?</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <Link
                href="/login"
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-black text-sm uppercase tracking-wide border-2 transition-all hover:bg-blue-50"
                style={{ color: "#1A3A6B", borderColor: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}
              >
                Se connecter <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
