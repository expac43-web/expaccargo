"use client";

import Link from "next/link";
import Logo from "@/components/ui/Logo";
import { useState } from "react";
import { Eye, EyeOff, Lock, Mail, AlertCircle, ShieldCheck } from "lucide-react";
import { signIn, getSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function ExpackLoginPage() {
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
      setError("Identifiants incorrects.");
      setLoading(false);
      return;
    }

    // Check role
    const session = await getSession();
    const role = (session?.user as { role?: string })?.role;

    if (role === "SUPER_ADMIN" || role === "MANAGER" || role === "AGENCY") {
      router.push("/dashboard/admin");
      router.refresh();
    } else {
      // Revoke the session immediately — wrong role
      await signOut({ redirect: false });
      setError("Accès réservé au personnel EXPAC. Utilisez l'espace client si vous êtes un particulier.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 h-14 flex items-center px-6 shrink-0">
        <Link href="/" className="shrink-0">
          <Logo className="h-9 w-auto object-contain" width={110} height={38} priority />
        </Link>
        <Link
          href="/login"
          className="ml-auto text-xs font-black uppercase tracking-wide transition-all hover:opacity-80"
          style={{ color: "#E8520A", fontFamily: "var(--font-montserrat)" }}
        >
          Espace client →
        </Link>
      </div>

      {/* Center */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">

          {/* Icon */}
          <div className="flex flex-col items-center mb-8">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: "linear-gradient(135deg, #0e2248 0%, #1A3A6B 100%)" }}
            >
              <ShieldCheck size={28} color="white" />
            </div>
            <h1
              className="text-xl font-black uppercase text-center"
              style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}
            >
              Accès administration
            </h1>
            <p className="text-sm text-gray-500 mt-1 text-center" style={{ fontFamily: "var(--font-lato)" }}>
              Réservé au personnel autorisé EXPAC
            </p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-100 mb-5">
                <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
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
                  Adresse email
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="admin@expaccargoltd.com"
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#1A3A6B] focus:ring-2 focus:ring-[#1A3A6B]/10 transition-all bg-white"
                    style={{ fontFamily: "var(--font-lato)" }}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-black uppercase tracking-wider mb-2"
                  style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}
                >
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    id="password"
                    name="password"
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

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-black text-white text-sm uppercase tracking-wide transition-all hover:opacity-90 hover:shadow-lg disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #0e2248 0%, #1A3A6B 100%)", fontFamily: "var(--font-montserrat)" }}
              >
                {loading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <><ShieldCheck size={16} /> Accéder au tableau de bord</>
                )}
              </button>
            </form>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6" style={{ fontFamily: "var(--font-lato)" }}>
            Problème de connexion :{" "}
            <a href="mailto:contact@expaccargoltd.com" className="underline hover:text-gray-600">
              contact@expaccargoltd.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
