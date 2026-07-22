"use client";

import { useState } from "react";
import {
  User, Mail, Phone, Hash, FileText, MessageSquare, ChevronDown,
  Send, AlertCircle, CheckCircle, Copy, Check,
} from "lucide-react";

const NAVY = "#1A3A6B";
const ORANGE = "#E8520A";

const labelCls = "block text-xs font-black uppercase tracking-wider mb-1.5 text-gray-600";
const inputCls = "w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#1A3A6B] focus:ring-2 focus:ring-[#1A3A6B]/10 transition-all bg-white";
const fontM = { fontFamily: "var(--font-montserrat)" };
const fontL = { fontFamily: "var(--font-lato)" };

const SERVICES = [
  "Transit maritime",
  "Transit aérien",
  "Transit routier",
  "Entreposage",
  "Douane",
  "Autre",
];

export default function ReclamationForm() {
  const [loading, setLoading] = useState(false);
  const [ref, setRef] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = e.currentTarget;
    const get = (name: string) =>
      (form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement)?.value ?? "";
    const payload = {
      name: get("name"), email: get("email"), phone: get("phone"),
      service: get("service"), reference: get("reference"),
      subject: get("subject"), message: get("message"),
    };
    try {
      const res = await fetch("/api/reclamation", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Erreur serveur");
      setRef(data.ref || "—");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue. Réessayez ou écrivez-nous directement.");
    } finally {
      setLoading(false);
    }
  }

  function copyRef() {
    if (!ref) return;
    navigator.clipboard?.writeText(ref).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }

  if (ref) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-8 lg:p-12 shadow-sm text-center">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: "rgba(26,58,107,0.08)" }}>
          <CheckCircle size={38} style={{ color: NAVY }} />
        </div>
        <h2 className="text-xl font-black uppercase mb-3" style={{ color: NAVY, ...fontM }}>Réclamation enregistrée</h2>
        <p className="text-gray-500 mb-6 max-w-md mx-auto" style={fontL}>
          Nous accusons réception de votre réclamation. Conservez votre numéro de suivi unique — un accusé de réception vient de vous être envoyé par e-mail.
        </p>
        <div className="inline-flex items-center gap-3 px-5 py-3 rounded-xl border-2 border-dashed mb-8" style={{ borderColor: ORANGE }}>
          <span className="text-lg font-black tracking-wider" style={{ color: NAVY, ...fontM }}>{ref}</span>
          <button onClick={copyRef} title="Copier" className="text-gray-400 hover:text-[#E8520A] transition-colors">
            {copied ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
          </button>
        </div>
        <p className="text-sm text-gray-400 mb-8" style={fontL}>
          Un gestionnaire dédié étudiera votre dossier et reviendra vers vous <strong>sous 48 heures ouvrées</strong>.
        </p>
        <button
          onClick={() => { setRef(null); setError(null); }}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-black text-white text-sm uppercase tracking-wide hover:opacity-90"
          style={{ backgroundColor: ORANGE, ...fontM }}
        >
          Nouvelle réclamation
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 lg:p-8 shadow-sm">
      <h2 className="text-base font-black uppercase mb-6" style={{ color: NAVY, ...fontM }}>Formulaire de réclamation</h2>
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100 mb-5">
          <AlertCircle size={15} className="text-red-500 shrink-0" />
          <p className="text-xs text-red-600" style={fontL}>{error}</p>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls} style={fontM}>Nom / Société <span className="text-red-400">*</span></label>
            <div className="relative">
              <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input name="name" type="text" required placeholder="Votre nom ou raison sociale" className={inputCls} style={fontL} />
            </div>
          </div>
          <div>
            <label className={labelCls} style={fontM}>E-mail <span className="text-red-400">*</span></label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input name="email" type="email" required placeholder="vous@exemple.com" className={inputCls} style={fontL} />
            </div>
          </div>
          <div>
            <label className={labelCls} style={fontM}>Téléphone</label>
            <div className="relative">
              <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input name="phone" type="tel" placeholder="+242 00 000 00 00" className={inputCls} style={fontL} />
            </div>
          </div>
          <div>
            <label className={labelCls} style={fontM}>Type de prestation</label>
            <div className="relative">
              <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <select name="service" defaultValue="" className="w-full pl-4 pr-10 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#1A3A6B] focus:ring-2 focus:ring-[#1A3A6B]/10 transition-all bg-white appearance-none" style={fontL}>
                <option value="">Sélectionnez…</option>
                {SERVICES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={labelCls} style={fontM}>N° de dossier / expédition</label>
            <div className="relative">
              <Hash size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input name="reference" type="text" placeholder="BL, LTA, n° de dossier…" className={inputCls} style={fontL} />
            </div>
          </div>
          <div>
            <label className={labelCls} style={fontM}>Objet de la réclamation <span className="text-red-400">*</span></label>
            <div className="relative">
              <FileText size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input name="subject" type="text" required placeholder="Résumé en quelques mots" className={inputCls} style={fontL} />
            </div>
          </div>
        </div>
        <div>
          <label className={labelCls} style={fontM}>Message détaillé <span className="text-red-400">*</span></label>
          <div className="relative">
            <MessageSquare size={15} className="absolute left-3 top-3 text-gray-400" />
            <textarea name="message" required rows={6} placeholder="Décrivez précisément votre réclamation : dates, montants, références, faits constatés…"
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#1A3A6B] focus:ring-2 focus:ring-[#1A3A6B]/10 transition-all bg-white resize-none"
              style={fontL} />
          </div>
          <p className="text-[11px] text-gray-400 mt-2" style={fontL}>
            Vos justificatifs (photos, réserves, e-mails) vous seront demandés par votre gestionnaire dès l&apos;ouverture du dossier.
          </p>
        </div>
        <button type="submit" disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-4 rounded-xl font-black text-white uppercase tracking-wide transition-all hover:opacity-90 hover:shadow-lg disabled:opacity-60"
          style={{ backgroundColor: NAVY, ...fontM }}>
          {loading ? <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Send size={16} />Émettre ma réclamation</>}
        </button>
      </form>
    </div>
  );
}
