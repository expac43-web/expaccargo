"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

function ResetForm() {
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) { setError("Le mot de passe doit faire au moins 8 caractères."); return; }
    if (password !== confirm) { setError("Les deux mots de passe ne correspondent pas."); return; }
    setLoading(true);
    try {
      const r = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setError(d.error ?? "Erreur lors de la réinitialisation."); return; }
      setDone(true);
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="text-center py-6">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <AlertCircle size={32} className="text-red-400" />
        </div>
        <p className="text-sm text-gray-500" style={{ fontFamily: "var(--font-lato)" }}>Lien invalide ou incomplet.</p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="text-center py-6">
        <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={32} className="text-green-500" />
        </div>
        <h1 className="font-black text-lg mb-2" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>Mot de passe mis à jour</h1>
        <p className="text-sm text-gray-500 mb-6" style={{ fontFamily: "var(--font-lato)" }}>Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.</p>
        <Link href="/login" className="inline-block px-5 py-2.5 rounded-xl text-white text-sm font-black uppercase hover:opacity-90" style={{ backgroundColor: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
          Se connecter
        </Link>
      </div>
    );
  }

  return (
    <>
      <h1 className="font-black text-xl mb-1" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>Nouveau mot de passe</h1>
      <p className="text-sm text-gray-500 mb-6" style={{ fontFamily: "var(--font-lato)" }}>Choisissez un nouveau mot de passe pour votre compte.</p>
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100 mb-4">
          <AlertCircle size={14} className="text-red-500 shrink-0" />
          <p className="text-xs text-red-600" style={{ fontFamily: "var(--font-lato)" }}>{error}</p>
        </div>
      )}
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-xs font-black uppercase tracking-wider mb-1.5 text-gray-600" style={{ fontFamily: "var(--font-montserrat)" }}>Nouveau mot de passe</label>
          <div className="relative">
            <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type={show ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimum 8 caractères"
              className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#1A3A6B] focus:ring-2 focus:ring-[#1A3A6B]/10 bg-white" style={{ fontFamily: "var(--font-lato)" }} />
            <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {show ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-xs font-black uppercase tracking-wider mb-1.5 text-gray-600" style={{ fontFamily: "var(--font-montserrat)" }}>Confirmer</label>
          <div className="relative">
            <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type={show ? "text" : "password"} required value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Répétez le mot de passe"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#1A3A6B] focus:ring-2 focus:ring-[#1A3A6B]/10 bg-white" style={{ fontFamily: "var(--font-lato)" }} />
          </div>
        </div>
        <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white text-sm font-black uppercase hover:opacity-90 disabled:opacity-60" style={{ backgroundColor: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
          {loading ? <Loader2 size={15} className="animate-spin" /> : null}
          {loading ? "Mise à jour..." : "Mettre à jour"}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "linear-gradient(135deg,#0e2248,#1A3A6B)" }}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <Suspense fallback={<div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-[#1A3A6B]" /></div>}>
          <ResetForm />
        </Suspense>
      </div>
    </div>
  );
}
