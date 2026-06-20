"use client";

import Link from "next/link";
import Logo from "@/components/ui/Logo";
import { useState } from "react";
import { Eye, EyeOff, ArrowRight, Lock, Mail, AlertCircle } from "lucide-react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useT } from "@/components/i18n/LanguageProvider";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";

export default function LoginPage() {
  const { t } = useT();
  const a = t.auth;
  const L = a.login;
  const navLinks = [
    { label: t.nav.services, href: "/services" },
    { label: t.nav.tracking, href: "/tracking" },
    { label: t.nav.quote, href: "/devis" },
    { label: t.nav.contact, href: "/contact" },
  ];
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError(L.error);
      setLoading(false);
    } else {
      // Redirection selon le rôle
      const session = await getSession();
      const role = (session?.user as { role?: string })?.role;
      if (role === "AGENCY") {
        router.push("/dashboard/agence");
      } else if (role === "MANAGER") {
        router.push("/dashboard/gerant");
      } else if (role === "SUPER_ADMIN") {
        router.push("/dashboard/admin");
      } else {
        router.push("/dashboard");
      }
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Barre de navigation minimale ─────────────────── */}
      <div className="bg-white border-b border-gray-100 h-14 flex items-center px-6 shrink-0 z-10">
        <Link href="/" className="shrink-0">
          <Logo className="h-9 w-auto object-contain" width={110} height={38} priority />
        </Link>
        <nav className="hidden sm:flex items-center gap-6 ml-8">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-xs font-black uppercase tracking-wider text-gray-500 hover:text-[#1A3A6B] transition-colors"
              style={{ fontFamily: "var(--font-montserrat)" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-4">
          <LanguageSwitcher />
          <Link
            href="/inscription"
            className="text-xs font-black uppercase tracking-wide transition-all hover:opacity-80"
            style={{ color: "#E8520A", fontFamily: "var(--font-montserrat)" }}
          >
            {a.noAccountYet}
          </Link>
        </div>
      </div>

      {/* ── Split layout ──────────────────────────────────── */}
      <div className="flex flex-1">
        {/* Left panel */}
        <div
          className="hidden lg:flex lg:w-5/12 relative flex-col justify-between p-12 overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #0e2248 0%, #1A3A6B 60%, #2a5298 100%)",
          }}
        >
          <div className="absolute -right-16 -top-16 w-72 h-72 rounded-full opacity-10" style={{ backgroundColor: "#E8520A" }} />
          <div className="absolute -left-8 bottom-24 w-48 h-48 rounded-full opacity-10" style={{ backgroundColor: "#E8520A" }} />

          <div className="relative z-10">
            <p
              className="text-xs font-black uppercase tracking-[0.2em] mb-5"
              style={{ color: "#fba563", fontFamily: "var(--font-montserrat)" }}
            >
              ▪ {L.eyebrow}
            </p>
            <h1
              className="text-4xl font-black text-white uppercase leading-tight mb-6"
              style={{ fontFamily: "var(--font-montserrat)" }}
            >
              {L.titlePre}<br />
              <span style={{ color: "#E8520A" }}>{L.titleHighlight}</span>
            </h1>
            <p className="text-blue-200 leading-relaxed max-w-sm" style={{ fontFamily: "var(--font-lato)" }}>
              {L.intro}
            </p>

            <ul className="mt-8 space-y-3">
              {L.features.map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-blue-100" style={{ fontFamily: "var(--font-lato)" }}>
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: "#E8520A" }} />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          <p className="relative z-10 text-xs text-blue-400" style={{ fontFamily: "var(--font-lato)" }}>
            © {new Date().getFullYear()} Express Africa Cargo Ltd
          </p>
        </div>

        {/* Right panel — form */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-gray-50">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <div className="mb-7">
                <h2
                  className="text-xl font-black uppercase mb-1"
                  style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}
                >
                  {L.formTitle}
                </h2>
                <p className="text-gray-500 text-sm" style={{ fontFamily: "var(--font-lato)" }}>
                  {L.formIntro}
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100 mb-5">
                  <AlertCircle size={15} className="text-red-500 shrink-0" />
                  <p className="text-xs text-red-600" style={{ fontFamily: "var(--font-lato)" }}>{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs font-black uppercase tracking-wider mb-2"
                    style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}
                  >
                    {L.email}
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      id="email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder={L.emailPlaceholder}
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
                      {L.password}
                    </label>
                    <Link
                      href="/mot-de-passe-oublie"
                      className="text-xs text-gray-400 hover:text-[#E8520A] transition-colors"
                      style={{ fontFamily: "var(--font-lato)" }}
                    >
                      {L.forgot}
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
                  <input type="checkbox" className="w-4 h-4 rounded border-gray-300 accent-[#1A3A6B]" />
                  <span className="text-sm text-gray-500" style={{ fontFamily: "var(--font-lato)" }}>
                    {L.remember}
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
                    <>{L.submit} <ArrowRight size={16} /></>
                  )}
                </button>
              </form>

              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>
                  {L.dividerNoAccount}
                </span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <Link
                href="/inscription"
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-black text-sm uppercase tracking-wide border-2 transition-all hover:bg-orange-50"
                style={{ color: "#E8520A", borderColor: "#E8520A", fontFamily: "var(--font-montserrat)" }}
              >
                {L.createAccount} <ArrowRight size={15} />
              </Link>

              <p className="text-center text-xs text-gray-400 mt-5" style={{ fontFamily: "var(--font-lato)" }}>
                {L.staffAccess}{" "}
                <a href="mailto:contact@expaccargoltd.com" className="underline hover:text-gray-600">
                  contact@expaccargoltd.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
