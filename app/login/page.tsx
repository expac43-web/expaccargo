"use client";

import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import Link from "next/link";
import { useState } from "react";
import { Eye, EyeOff, ArrowRight, Lock, Mail } from "lucide-react";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    // NextAuth signIn câblé ici
    setTimeout(() => setLoading(false), 1500);
  }

  return (
    <>
      <Navbar />

      {/* Page header */}
      <div
        className="pt-16"
        style={{
          background: "linear-gradient(135deg, #0e2248 0%, #1A3A6B 100%)",
        }}
      >
        <div className="container-custom py-12 text-center">
          <p
            className="text-xs font-black uppercase tracking-[0.2em] mb-3"
            style={{ color: "#fba563", fontFamily: "var(--font-montserrat)" }}
          >
            ▪ Espace sécurisé
          </p>
          <h1
            className="text-3xl md:text-4xl font-black text-white uppercase"
            style={{ fontFamily: "var(--font-montserrat)" }}
          >
            Connexion
          </h1>
        </div>
      </div>

      {/* Form section */}
      <main className="bg-gray-50 py-16 flex-1">
        <div className="container-custom flex justify-center">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              {/* Header */}
              <div className="mb-7">
                <h2
                  className="text-xl font-black uppercase mb-1"
                  style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}
                >
                  Accédez à votre espace
                </h2>
                <p
                  className="text-gray-500 text-sm"
                  style={{ fontFamily: "var(--font-lato)" }}
                >
                  Utilisez vos identifiants EXPAC pour vous connecter.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs font-black uppercase tracking-wider mb-2"
                    style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}
                  >
                    Adresse email
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

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label
                      htmlFor="password"
                      className="block text-xs font-black uppercase tracking-wider"
                      style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}
                    >
                      Mot de passe
                    </label>
                    <Link
                      href="/mot-de-passe-oublie"
                      className="text-xs text-gray-400 hover:text-[#E8520A] transition-colors"
                      style={{ fontFamily: "var(--font-lato)" }}
                    >
                      Mot de passe oublié ?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="current-password"
                      placeholder="••••••••"
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

                {/* Remember me */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 accent-[#1A3A6B]"
                  />
                  <span className="text-sm text-gray-500" style={{ fontFamily: "var(--font-lato)" }}>
                    Se souvenir de moi
                  </span>
                </label>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-black text-white text-sm uppercase tracking-wide transition-all hover:opacity-90 hover:shadow-lg disabled:opacity-60"
                  style={{ backgroundColor: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}
                >
                  {loading ? (
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>Se connecter <ArrowRight size={16} /></>
                  )}
                </button>
              </form>

              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>
                  Pas encore de compte ?
                </span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <Link
                href="/inscription"
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-black text-sm uppercase tracking-wide border-2 transition-all hover:bg-orange-50"
                style={{ color: "#E8520A", borderColor: "#E8520A", fontFamily: "var(--font-montserrat)" }}
              >
                Créer un compte client <ArrowRight size={15} />
              </Link>

              <p className="text-center text-xs text-gray-400 mt-5" style={{ fontFamily: "var(--font-lato)" }}>
                Pour un accès agence ou gérant, contactez{" "}
                <a href="mailto:contact@expaccargoltd.com" className="underline hover:text-gray-600">
                  contact@expaccargoltd.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
