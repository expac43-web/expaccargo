"use client";

import Link from "next/link";
import Logo from "@/components/ui/Logo";
import { useState } from "react";
import { Eye, EyeOff, ArrowRight, Lock, Mail, User, Phone, Building2, UserCircle, AlertCircle, CheckCircle } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useT } from "@/components/i18n/LanguageProvider";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";

type AccountType = "particulier" | "entreprise";

export default function InscriptionPage() {
  const { t } = useT();
  const a = t.auth;
  const R = a.register;
  const navLinks = [
    { label: t.nav.services, href: "/services" },
    { label: t.nav.tracking, href: "/tracking" },
    { label: t.nav.quote, href: "/devis" },
    { label: t.nav.contact, href: "/contact" },
  ];
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [accountType, setAccountType] = useState<AccountType>("particulier");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = e.currentTarget;
    const get = (name: string) => (form.elements.namedItem(name) as HTMLInputElement)?.value ?? "";

    const password = get("password");
    const confirm = get("confirm");

    if (password !== confirm) {
      setError(R.errPwdMismatch);
      return;
    }
    if (password.length < 8) {
      setError(R.errPwdShort);
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: get("name"),
        email: get("email"),
        password,
        phone: get("phone") || undefined,
        whatsapp: get("whatsapp") || undefined,
        accountType,
        companyName: get("companyName") || undefined,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? R.errGeneric);
      setLoading(false);
      return;
    }

    // Connexion automatique après inscription
    await signIn("credentials", {
      email: get("email"),
      password,
      redirect: false,
    });

    router.push("/dashboard");
    router.refresh();
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
            href="/login"
            className="text-xs font-black uppercase tracking-wide transition-all hover:opacity-80"
            style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}
          >
            {a.alreadyAccount}
          </Link>
        </div>
      </div>

      {/* ── Split layout ──────────────────────────────────── */}
      <div className="flex flex-1">
        {/* Left panel */}
        <div
          className="hidden lg:flex lg:w-5/12 relative flex-col justify-between p-12 overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #c44408 0%, #E8520A 60%, #f97316 100%)",
          }}
        >
          <div className="absolute -right-16 -top-16 w-72 h-72 rounded-full opacity-10 bg-white" />
          <div className="absolute -left-8 bottom-24 w-48 h-48 rounded-full opacity-10 bg-white" />

          <div className="relative z-10">
            <p
              className="text-xs font-black uppercase tracking-[0.2em] mb-5 text-orange-100"
              style={{ fontFamily: "var(--font-montserrat)" }}
            >
              ▪ {R.eyebrow}
            </p>
            <h1
              className="text-4xl font-black text-white uppercase leading-tight mb-6"
              style={{ fontFamily: "var(--font-montserrat)" }}
            >
              {R.titlePre}<br />
              <span style={{ color: "#1A3A6B" }}>{R.titleHighlight}</span>
            </h1>
            <p className="text-orange-100 leading-relaxed max-w-sm" style={{ fontFamily: "var(--font-lato)" }}>
              {R.intro}
            </p>

            <ul className="mt-8 space-y-4">
              {R.steps.map((label, i) => {
                const step = String(i + 1).padStart(2, "0");
                return (
                  <li key={step} className="flex items-center gap-4">
                    <span
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0 text-white"
                      style={{ backgroundColor: "rgba(255,255,255,0.2)", fontFamily: "var(--font-montserrat)" }}
                    >
                      {step}
                    </span>
                    <span className="text-sm text-orange-100" style={{ fontFamily: "var(--font-lato)" }}>
                      {label}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          <p className="relative z-10 text-xs text-orange-200" style={{ fontFamily: "var(--font-lato)" }}>
            © {new Date().getFullYear()} Express Africa Cargo Ltd
          </p>
        </div>

        {/* Right panel — form */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 bg-gray-50 overflow-y-auto">
          <div className="w-full max-w-lg">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <div className="mb-7">
                <h2
                  className="text-xl font-black uppercase mb-1"
                  style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}
                >
                  {R.formTitle}
                </h2>
                <p className="text-gray-500 text-sm" style={{ fontFamily: "var(--font-lato)" }}>
                  {R.roleNotePre}{" "}
                  <strong className="text-gray-700">{R.roleNoteStrong}</strong>{R.roleNotePost}
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100 mb-4">
                  <AlertCircle size={15} className="text-red-500 shrink-0" />
                  <p className="text-xs text-red-600" style={{ fontFamily: "var(--font-lato)" }}>{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">

                {/* Type de compte */}
                <div>
                  <label
                    className="block text-xs font-black uppercase tracking-wider mb-3"
                    style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}
                  >
                    {R.accountType}
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
                      <UserCircle size={20} style={{ color: accountType === "particulier" ? "#1A3A6B" : "#9ca3af" }} />
                      <div>
                        <p
                          className="text-sm font-black uppercase"
                          style={{ color: accountType === "particulier" ? "#1A3A6B" : "#6b7280", fontFamily: "var(--font-montserrat)" }}
                        >
                          {R.individual}
                        </p>
                        <p className="text-xs text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>{R.individualSub}</p>
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
                      <Building2 size={20} style={{ color: accountType === "entreprise" ? "#E8520A" : "#9ca3af" }} />
                      <div>
                        <p
                          className="text-sm font-black uppercase"
                          style={{ color: accountType === "entreprise" ? "#E8520A" : "#6b7280", fontFamily: "var(--font-montserrat)" }}
                        >
                          {R.company}
                        </p>
                        <p className="text-xs text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>{R.companySub}</p>
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
                      {R.companyName}
                    </label>
                    <div className="relative">
                      <Building2 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        id="company"
                        type="text"
                        required
                        placeholder={R.companyNamePh}
                        className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#1A3A6B] focus:ring-2 focus:ring-[#1A3A6B]/10 transition-all bg-white"
                        style={{ fontFamily: "var(--font-lato)" }}
                      />
                    </div>
                  </div>
                )}

                {/* Nom */}
                <div>
                  <label
                    htmlFor="name"
                    className="block text-xs font-black uppercase tracking-wider mb-2"
                    style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}
                  >
                    {accountType === "entreprise" ? R.nameCompany : R.nameIndividual}
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      id="name"
                      type="text"
                      required
                      autoComplete="name"
                      placeholder={R.namePh}
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
                    {R.email}
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      id="email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder={R.emailPh}
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
                      {R.phone}
                    </label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        id="phone"
                        type="tel"
                        autoComplete="tel"
                        placeholder={R.phonePh}
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
                      {R.whatsapp}
                    </label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        id="whatsapp"
                        type="tel"
                        placeholder={R.phonePh}
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
                    {R.password}
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="new-password"
                      placeholder={R.passwordPh}
                      minLength={8}
                      className="w-full pl-11 pr-12 py-3.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#1A3A6B] focus:ring-2 focus:ring-[#1A3A6B]/10 transition-all bg-white"
                      style={{ fontFamily: "var(--font-lato)" }}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
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
                    {R.confirm}
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      id="confirm"
                      type={showConfirm ? "text" : "password"}
                      required
                      autoComplete="new-password"
                      placeholder={R.confirmPh}
                      className="w-full pl-11 pr-12 py-3.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#1A3A6B] focus:ring-2 focus:ring-[#1A3A6B]/10 transition-all bg-white"
                      style={{ fontFamily: "var(--font-lato)" }}
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Terms */}
                <label className="flex items-start gap-3 cursor-pointer pt-1">
                  <input type="checkbox" required className="w-4 h-4 rounded border-gray-300 accent-[#E8520A] mt-0.5 shrink-0" />
                  <span className="text-sm text-gray-500 leading-relaxed" style={{ fontFamily: "var(--font-lato)" }}>
                    {R.termsPre}{" "}
                    <Link href="/mentions-legales" className="underline hover:text-[#E8520A]">
                      {R.termsLink}
                    </Link>{" "}
                    {R.termsPost}
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
                    <>{R.submit} <ArrowRight size={16} /></>
                  )}
                </button>
              </form>

              <div className="flex items-center gap-4 my-5">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>{R.dividerAlready}</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <Link
                href="/login"
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-black text-sm uppercase tracking-wide border-2 transition-all hover:bg-blue-50"
                style={{ color: "#1A3A6B", borderColor: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}
              >
                {R.signIn} <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
