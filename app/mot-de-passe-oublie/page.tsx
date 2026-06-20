"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Loader2, CheckCircle2, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      const r = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const d = await r.json().catch(() => ({}));
      setMessage(d.message ?? "Demande enregistrée.");
      setDone(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "linear-gradient(135deg,#0e2248,#1A3A6B)" }}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <Link href="/login" className="inline-flex items-center gap-2 text-xs font-black uppercase text-gray-400 hover:text-gray-600 mb-6" style={{ fontFamily: "var(--font-montserrat)" }}>
          <ArrowLeft size={14} /> Connexion
        </Link>

        {done ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} className="text-green-500" />
            </div>
            <h1 className="font-black text-lg mb-2" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>Demande envoyée</h1>
            <p className="text-sm text-gray-500" style={{ fontFamily: "var(--font-lato)" }}>{message}</p>
            <Link href="/login" className="inline-block mt-6 px-5 py-2.5 rounded-xl text-white text-sm font-black uppercase hover:opacity-90" style={{ backgroundColor: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
              Retour à la connexion
            </Link>
          </div>
        ) : (
          <>
            <h1 className="font-black text-xl mb-1" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>Mot de passe oublié</h1>
            <p className="text-sm text-gray-500 mb-6" style={{ fontFamily: "var(--font-lato)" }}>
              Saisissez votre email. Les <strong>clients</strong> recevront un <strong>lien de réinitialisation</strong> (valable 1h). Les <strong>gérants et agents</strong> devront contacter l'administrateur.
            </p>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider mb-1.5 text-gray-600" style={{ fontFamily: "var(--font-montserrat)" }}>Adresse email</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="vous@exemple.com"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#1A3A6B] focus:ring-2 focus:ring-[#1A3A6B]/10 bg-white"
                    style={{ fontFamily: "var(--font-lato)" }}
                  />
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white text-sm font-black uppercase hover:opacity-90 disabled:opacity-60" style={{ backgroundColor: "#E8520A", fontFamily: "var(--font-montserrat)" }}>
                {loading ? <Loader2 size={15} className="animate-spin" /> : null}
                {loading ? "Envoi..." : "Envoyer la demande"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
