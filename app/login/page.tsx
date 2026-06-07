"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Eye, EyeOff, ArrowRight, Lock, Mail } from "lucide-react";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    // NextAuth signIn will be wired here
    setTimeout(() => setLoading(false), 1500);
  }

  return (
    <div className="min-h-screen flex">
      {/* ── LEFT PANEL ─────────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #0e2248 0%, #1A3A6B 60%, #2a5298 100%)",
        }}
      >
        {/* Decorative circles */}
        <div
          className="absolute -right-16 -top-16 w-72 h-72 rounded-full opacity-10"
          style={{ backgroundColor: "#E8520A" }}
        />
        <div
          className="absolute -left-8 bottom-24 w-48 h-48 rounded-full opacity-10"
          style={{ backgroundColor: "#E8520A" }}
        />

        {/* Logo */}
        <div className="relative z-10">
          <Link href="/">
            <div className="inline-block bg-white rounded-xl px-4 py-2.5">
              <Image
                src="/images/logo.jpeg"
                alt="EXPAC"
                width={130}
                height={44}
                className="h-11 w-auto object-contain"
              />
            </div>
          </Link>
        </div>

        {/* Center message */}
        <div className="relative z-10">
          <p
            className="text-xs font-black uppercase tracking-[0.2em] mb-5"
            style={{ color: "#fba563", fontFamily: "var(--font-montserrat)" }}
          >
            ▪ Espace client sécurisé
          </p>
          <h1
            className="text-4xl font-black text-white uppercase leading-tight mb-6"
            style={{ fontFamily: "var(--font-montserrat)" }}
          >
            Accédez à votre<br />
            <span style={{ color: "#E8520A" }}>tableau de bord</span>
          </h1>
          <p
            className="text-blue-200 leading-relaxed max-w-sm"
            style={{ fontFamily: "var(--font-lato)" }}
          >
            Suivez vos expéditions, consultez vos documents et communiquez
            avec votre agence directement depuis votre espace personnel.
          </p>

          {/* Features */}
          <ul className="mt-8 space-y-3">
            {[
              "Suivi en temps réel de vos expéditions",
              "Accès à tous vos documents",
              "Messagerie avec votre agence",
              "Demandes de devis en ligne",
            ].map((f) => (
              <li
                key={f}
                className="flex items-center gap-3 text-sm text-blue-100"
                style={{ fontFamily: "var(--font-lato)" }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: "#E8520A" }}
                />
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom */}
        <div className="relative z-10">
          <p
            className="text-xs text-blue-400"
            style={{ fontFamily: "var(--font-lato)" }}
          >
            © {new Date().getFullYear()} Express Africa Cargo Ltd
          </p>
        </div>
      </div>

      {/* ── RIGHT PANEL (form) ──────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-gray-50">
        {/* Mobile logo */}
        <div className="lg:hidden mb-10">
          <Link href="/">
            <Image
              src="/images/logo.jpeg"
              alt="EXPAC"
              width={130}
              height={44}
              className="h-12 w-auto object-contain"
            />
          </Link>
        </div>

        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-8">
            <h2
              className="text-2xl font-black uppercase mb-2"
              style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}
            >
              Connexion
            </h2>
            <p
              className="text-gray-500 text-sm"
              style={{ fontFamily: "var(--font-lato)" }}
            >
              Accédez à votre espace EXPAC avec vos identifiants.
            </p>
          </div>

          {/* Form */}
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
                <Mail
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />
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
                <Lock
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />
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
              <span
                className="text-sm text-gray-500"
                style={{ fontFamily: "var(--font-lato)" }}
              >
                Se souvenir de moi
              </span>
            </label>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-black text-white text-sm uppercase tracking-wide transition-all hover:opacity-90 hover:shadow-lg disabled:opacity-60"
              style={{
                backgroundColor: "#1A3A6B",
                fontFamily: "var(--font-montserrat)",
              }}
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Se connecter
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span
              className="text-xs text-gray-400"
              style={{ fontFamily: "var(--font-lato)" }}
            >
              Pas encore de compte ?
            </span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Register link */}
          <Link
            href="/inscription"
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-black text-sm uppercase tracking-wide border-2 transition-all hover:bg-orange-50"
            style={{
              color: "#E8520A",
              borderColor: "#E8520A",
              fontFamily: "var(--font-montserrat)",
            }}
          >
            Créer un compte client
            <ArrowRight size={15} />
          </Link>

          <p
            className="text-center text-xs text-gray-400 mt-6"
            style={{ fontFamily: "var(--font-lato)" }}
          >
            Pour un accès agence ou gérant, contactez{" "}
            <a
              href="mailto:contact@expaccargoltd.com"
              className="underline hover:text-gray-600"
            >
              contact@expaccargoltd.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
