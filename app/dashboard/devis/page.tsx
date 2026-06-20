"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  FileText, Plus, X, Loader2, CheckCircle2, AlertCircle,
  Clock, Send, ChevronRight, ArrowRight, Download,
  PenLine, XCircle, ShieldCheck, Coins,
} from "lucide-react";
import { exportDevisPDF } from "@/lib/pdf";
import SignaturePad from "@/components/SignaturePad";
import { useT } from "@/components/i18n/LanguageProvider";

// Couleur + étape par statut ; libellé via t.quoteStatus.
const STATUS_STEP: Record<string, { color: string; step: number }> = {
  NEW:       { color: "#0891b2", step: 1 },
  IN_REVIEW: { color: "#d97706", step: 2 },
  QUOTED:    { color: "#7c3aed", step: 3 },
  ACCEPTED:  { color: "#16a34a", step: 4 },
  REJECTED:  { color: "#dc2626", step: 4 },
};

const SERVICE_VALUES = ["TRANSIT", "MULTIMODAL", "STORAGE", "MARITIME_CONSIGNMENT", "GROUPAGE"];

function fmtMoney(amount: number, currency: string): string {
  const n = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(Math.round(amount));
  return `${n} ${currency === "XAF" ? "FCFA" : currency}`;
}

type QuoteItem = { label: string; amount: number };

type Quote = {
  id: string; serviceType: string; origin: string; destination: string;
  cargoType: string; weight: number | null; volume: number | null;
  notes: string | null; status: string; createdAt: string;
  transportMode: string | null; preferredDate: string | null; dangerous: boolean | null;
  quotedPrice: number | null; quotedCurrency: string | null; quoteMessage: string | null;
  quotedAt: string | null; quoteItems: QuoteItem[] | null;
  signature?: { signerName: string; signedAt: string } | null;
};

// Valeurs stables (identiques à la page devis publique) ; affichage traduit via le dico.
const TRANSPORT_MODES = ["Maritime", "Aérien", "Routier", "Multimodal"];

const inputCls = "w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#1A3A6B] focus:ring-2 focus:ring-[#1A3A6B]/10 transition-all bg-white";
const labelCls = "block text-xs font-black uppercase tracking-wider mb-1.5 text-gray-600";

export default function ClientDevisPage() {
  const { data: session } = useSession();
  const { t, locale } = useT();
  const dv = t.dashboard.devis;
  const dl = locale === "en" ? "en-US" : "fr-FR";
  const quoteLabel = (s: string) => (t.quoteStatus as Record<string, string>)[s] ?? s;
  const serviceLabel = (s: string) => (t.serviceTypes as Record<string, string>)[s] ?? s;
  const modeLabel = (m: string) => (({
    Maritime: t.devisForm.modes.maritime, "Aérien": t.devisForm.modes.air,
    Routier: t.devisForm.modes.road, Multimodal: t.devisForm.modes.multimodal,
  } as Record<string, string>)[m] ?? m);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Signature électronique (acceptation de devis)
  const [signQuote, setSignQuote] = useState<Quote | null>(null);
  const [signing, setSigning] = useState(false);
  const [signError, setSignError] = useState("");

  const [form, setForm] = useState({
    serviceType: "TRANSIT",
    origin: "", destination: "", cargoType: "",
    weight: "", volume: "", phone: "", notes: "",
    transportMode: "", preferredDate: "", dangerous: false,
  });

  const user = session?.user as { name?: string; email?: string } | undefined;

  const loadQuotes = async () => {
    const r = await fetch("/api/client/devis");
    if (r.ok) setQuotes(await r.json());
    setLoading(false);
  };

  useEffect(() => { loadQuotes(); }, []);

  async function submitQuote(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError("");
    try {
      const r = await fetch("/api/devis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: user?.name ?? "",
          email: user?.email ?? "",
          phone: form.phone,
          serviceType: form.serviceType,
          origin: form.origin,
          destination: form.destination,
          cargoType: form.cargoType,
          weight: form.weight,
          volume: form.volume,
          transportMode: form.transportMode || null,
          preferredDate: form.preferredDate || null,
          dangerous: form.dangerous,
          notes: form.notes,
        }),
      });
      if (!r.ok) {
        const d = await r.json();
        setSubmitError(d.error ?? dv.sendError);
        return;
      }
      setSubmitSuccess(true);
      setForm({ serviceType: "TRANSIT", origin: "", destination: "", cargoType: "", weight: "", volume: "", phone: "", notes: "", transportMode: "", preferredDate: "", dangerous: false });
      setTimeout(() => {
        setShowForm(false);
        setSubmitSuccess(false);
        loadQuotes();
      }, 2000);
    } finally {
      setSubmitting(false);
    }
  }

  function set(key: string, val: string) {
    setForm((f) => ({ ...f, [key]: val } as typeof f));
  }

  // Télécharge le PDF du devis ; inclut la signature si le devis est signé.
  async function downloadPdf(q: Quote) {
    let sig: { signatureDataUrl?: string; signerName?: string; signedAt?: string } = {};
    if (q.signature) {
      try {
        const r = await fetch(`/api/signatures/${q.id}`);
        if (r.ok) {
          const blob = await r.blob();
          const dataUrl = await new Promise<string>((res, rej) => {
            const fr = new FileReader();
            fr.onload = () => res(fr.result as string);
            fr.onerror = rej;
            fr.readAsDataURL(blob);
          });
          sig = {
            signatureDataUrl: dataUrl,
            signerName: q.signature.signerName,
            signedAt: new Date(q.signature.signedAt).toLocaleDateString(dl, { day: "numeric", month: "long", year: "numeric" }),
          };
        }
      } catch { /* signature indisponible → PDF sans tampon */ }
    }
    exportDevisPDF({
      reference: q.id.slice(0, 8).toUpperCase(),
      name: user?.name ?? "—",
      email: user?.email ?? "—",
      phone: "—",
      serviceType: q.serviceType,
      origin: q.origin,
      destination: q.destination,
      cargoType: q.cargoType,
      weight: q.weight,
      volume: q.volume,
      notes: q.notes,
      transportMode: q.transportMode,
      preferredDate: q.preferredDate,
      quotedPrice: q.quotedPrice,
      quotedCurrency: q.quotedCurrency,
      quoteMessage: q.quoteMessage,
      quoteItems: q.quoteItems,
      status: quoteLabel(q.status),
      createdAt: q.createdAt,
      ...sig,
    });
  }

  async function submitSign(dataUrl: string, signerName: string) {
    if (!signQuote) return;
    setSigning(true);
    setSignError("");
    try {
      const r = await fetch(`/api/client/devis/${signQuote.id}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signature: dataUrl, signerName }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setSignError(d.error ?? dv.signError); return; }
      setSignQuote(null);
      loadQuotes();
    } finally {
      setSigning(false);
    }
  }

  async function rejectQuote(q: Quote) {
    if (!window.confirm(dv.rejectConfirm)) return;
    const r = await fetch(`/api/client/devis/${q.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reject" }),
    });
    if (r.ok) loadQuotes();
  }

  return (
    <div className="flex-1 overflow-auto">
      {/* Header */}
      <div
        className="px-6 lg:px-8 pt-8 pb-8 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0e2248 0%, #1A3A6B 100%)" }}
      >
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full opacity-10" style={{ backgroundColor: "#E8520A" }} />
        <p className="text-xs font-black uppercase tracking-widest mb-2 relative z-10" style={{ color: "#fba563", fontFamily: "var(--font-montserrat)" }}>
          ▪ {dv.eyebrow}
        </p>
        <div className="flex items-center justify-between gap-4 relative z-10">
          <div>
            <h1 className="text-2xl font-black text-white" style={{ fontFamily: "var(--font-montserrat)" }}>
              {dv.title}
            </h1>
            <p className="text-blue-200 text-sm mt-1" style={{ fontFamily: "var(--font-lato)" }}>
              {dv.subtitle}
            </p>
          </div>
          <button
            onClick={() => { setShowForm(true); setSubmitError(""); setSubmitSuccess(false); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black uppercase text-white shrink-0 hover:opacity-80 transition-opacity"
            style={{ backgroundColor: "#E8520A", fontFamily: "var(--font-montserrat)" }}
          >
            <Plus size={15} />
            {dv.newRequest}
          </button>
        </div>
      </div>

      <div className="px-6 lg:px-8 py-6">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 size={28} className="animate-spin" style={{ color: "#1A3A6B" }} />
          </div>
        ) : quotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: "rgba(8,145,178,0.08)" }}>
              <FileText size={28} style={{ color: "#0891b2" }} />
            </div>
            <p className="font-black uppercase text-sm mb-2" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
              {dv.none}
            </p>
            <p className="text-xs text-gray-400 max-w-xs mb-4" style={{ fontFamily: "var(--font-lato)" }}>
              {dv.noneHint}
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black uppercase text-white hover:opacity-80 transition-opacity"
              style={{ backgroundColor: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}
            >
              <Plus size={14} />
              {dv.submitRequest}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {quotes.map((q) => {
              const sm = STATUS_STEP[q.status] ?? STATUS_STEP.NEW;
              const steps = ["NEW","IN_REVIEW","QUOTED","ACCEPTED"];
              return (
                <div key={q.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-gray-200 transition-all">
                  {/* Top */}
                  <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-black text-sm" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
                          {serviceLabel(q.serviceType)}
                        </span>
                        <span
                          className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black"
                          style={{ backgroundColor: `${sm.color}15`, color: sm.color, fontFamily: "var(--font-montserrat)" }}
                        >
                          {quoteLabel(q.status)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>
                        {q.origin} → {q.destination} · {q.cargoType}
                      </p>
                      {(q.weight || q.volume) && (
                        <p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: "var(--font-lato)" }}>
                          {q.weight ? `${q.weight} kg` : ""}{q.weight && q.volume ? " · " : ""}{q.volume ? `${q.volume} m³` : ""}
                        </p>
                      )}
                      {(q.transportMode || q.preferredDate || q.dangerous) && (
                        <div className="flex items-center gap-1.5 flex-wrap mt-1">
                          {q.transportMode && (
                            <span className="text-xs text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>{modeLabel(q.transportMode)}</span>
                          )}
                          {q.transportMode && q.preferredDate && <span className="text-xs text-gray-300">·</span>}
                          {q.preferredDate && (
                            <span className="text-xs text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>
                              {new Date(q.preferredDate).toLocaleDateString(dl, { day: "numeric", month: "short", year: "numeric" })}
                            </span>
                          )}
                          {q.dangerous && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-black" style={{ backgroundColor: "rgba(220,38,38,0.1)", color: "#dc2626", fontFamily: "var(--font-montserrat)" }}>
                              ⚠ {t.devisForm.dangerous}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <p className="text-xs text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>
                        {new Date(q.createdAt).toLocaleDateString(dl, { day: "numeric", month: "long", year: "numeric" })}
                      </p>
                      <button
                        onClick={() => downloadPdf(q)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-black uppercase border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                        style={{ fontFamily: "var(--font-montserrat)" }}
                      >
                        <Download size={13} />
                        PDF
                      </button>
                    </div>
                  </div>

                  {/* Status stepper */}
                  <div className="flex items-center gap-1">
                    {steps.map((step, i) => {
                      const stepMeta = STATUS_STEP[step];
                      const done = sm.step > i + 1;
                      const active = q.status === step || (q.status === "REJECTED" && step === "ACCEPTED");
                      const rejected = q.status === "REJECTED" && step === "ACCEPTED";
                      return (
                        <div key={step} className="flex items-center flex-1">
                          <div className="flex flex-col items-center flex-1">
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black mb-1"
                              style={{
                                backgroundColor: rejected
                                  ? "#dc262615"
                                  : done || active
                                  ? `${stepMeta?.color ?? "#6b7280"}20`
                                  : "#f3f4f6",
                                color: rejected
                                  ? "#dc2626"
                                  : done
                                  ? stepMeta?.color
                                  : active
                                  ? stepMeta?.color
                                  : "#d1d5db",
                                fontFamily: "var(--font-montserrat)",
                              }}
                            >
                              {done ? "✓" : i + 1}
                            </div>
                            <span
                              className="text-xs text-center leading-tight hidden sm:block"
                              style={{
                                color: rejected && step === "ACCEPTED"
                                  ? "#dc2626"
                                  : active || done
                                  ? stepMeta?.color ?? "#6b7280"
                                  : "#d1d5db",
                                fontFamily: "var(--font-montserrat)",
                                fontSize: "9px",
                                fontWeight: "900",
                              }}
                            >
                              {rejected && step === "ACCEPTED" ? dv.rejected : quoteLabel(step).split(" ")[0]}
                            </span>
                          </div>
                          {i < steps.length - 1 && (
                            <div
                              className="h-px flex-1 mx-1"
                              style={{ backgroundColor: sm.step > i + 1 ? sm.color : "#e5e7eb" }}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {q.notes && (
                    <p className="mt-3 text-xs text-gray-500 italic border-l-2 pl-3" style={{ borderColor: "#e5e7eb", fontFamily: "var(--font-lato)" }}>
                      {q.notes}
                    </p>
                  )}

                  {/* Réponse de la société : devis chiffré */}
                  {q.quotedPrice != null && (
                    <div className="mt-4 rounded-xl p-4 border" style={{ borderColor: "rgba(124,58,237,0.3)", backgroundColor: "rgba(124,58,237,0.06)" }}>
                      <p className="text-xs font-black uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: "#7c3aed", fontFamily: "var(--font-montserrat)" }}>
                        <Coins size={13} /> {dv.quoteAmountLabel}
                      </p>
                      {q.quoteItems && q.quoteItems.length > 0 && (
                        <div className="space-y-1 mb-2">
                          {q.quoteItems.map((it, i) => (
                            <div key={i} className="flex items-center justify-between text-sm" style={{ fontFamily: "var(--font-lato)" }}>
                              <span className="text-gray-600">{it.label}</span>
                              <span className="text-gray-800 font-semibold">{fmtMoney(it.amount, q.quotedCurrency || "XAF")}</span>
                            </div>
                          ))}
                          <div className="border-t border-gray-200 my-1" />
                        </div>
                      )}
                      <p className="text-2xl font-black" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
                        {fmtMoney(q.quotedPrice, q.quotedCurrency || "XAF")}
                      </p>
                      {q.quoteMessage && <p className="text-sm text-gray-600 mt-1.5" style={{ fontFamily: "var(--font-lato)" }}>{q.quoteMessage}</p>}
                    </div>
                  )}

                  {/* Actions client : accepter & signer / refuser */}
                  {q.status === "QUOTED" && (
                    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
                      <button
                        onClick={() => { setSignQuote(q); setSignError(""); }}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-xs font-black uppercase hover:opacity-90 transition-opacity"
                        style={{ backgroundColor: "#16a34a", fontFamily: "var(--font-montserrat)" }}
                      >
                        <PenLine size={13} /> {dv.acceptSign}
                      </button>
                      <button
                        onClick={() => rejectQuote(q)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-gray-500 text-xs font-black uppercase hover:bg-gray-50 transition-colors"
                        style={{ fontFamily: "var(--font-montserrat)" }}
                      >
                        <XCircle size={13} /> {dv.reject}
                      </button>
                    </div>
                  )}
                  {q.status === "ACCEPTED" && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-start gap-2.5 rounded-xl p-3 bg-green-50 border border-green-100">
                        <ShieldCheck size={17} className="text-green-600 shrink-0 mt-0.5" />
                        <div className="text-xs" style={{ fontFamily: "var(--font-lato)" }}>
                          <p className="font-black text-green-700" style={{ fontFamily: "var(--font-montserrat)" }}>{dv.acceptedTitle}</p>
                          {q.signature && (
                            <p className="text-gray-600 mt-0.5">
                              {dv.signedByPre} <strong>{q.signature.signerName}</strong> {dv.signedByOn} {new Date(q.signature.signedAt).toLocaleDateString(dl, { day: "numeric", month: "long", year: "numeric" })}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* New quote modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <h2 className="font-black uppercase text-sm" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
                {dv.modalTitle}
              </h2>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-5">
              {submitSuccess ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-4">
                    <CheckCircle2 size={32} className="text-green-500" />
                  </div>
                  <p className="font-black text-sm mb-1" style={{ color: "#16a34a", fontFamily: "var(--font-montserrat)" }}>
                    {dv.sentTitle}
                  </p>
                  <p className="text-xs text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>
                    {dv.sentText}
                  </p>
                </div>
              ) : (
                <form onSubmit={submitQuote} className="space-y-4">
                  {submitError && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100">
                      <AlertCircle size={14} className="text-red-500 shrink-0" />
                      <p className="text-xs text-red-600" style={{ fontFamily: "var(--font-lato)" }}>{submitError}</p>
                    </div>
                  )}

                  <div>
                    <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>{dv.serviceType}</label>
                    <select className={inputCls} value={form.serviceType} onChange={(e) => set("serviceType", e.target.value)} required style={{ fontFamily: "var(--font-lato)" }}>
                      {SERVICE_VALUES.map((v) => <option key={v} value={v}>{serviceLabel(v)}</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>{dv.origin}</label>
                      <input className={inputCls} value={form.origin} onChange={(e) => set("origin", e.target.value)} placeholder={dv.cityCountry} required style={{ fontFamily: "var(--font-lato)" }} />
                    </div>
                    <div>
                      <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>{dv.destination}</label>
                      <input className={inputCls} value={form.destination} onChange={(e) => set("destination", e.target.value)} placeholder={dv.cityCountry} required style={{ fontFamily: "var(--font-lato)" }} />
                    </div>
                  </div>

                  <div>
                    <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>{t.devisForm.transportMode}</label>
                    <select className={inputCls} value={form.transportMode} onChange={(e) => set("transportMode", e.target.value)} style={{ fontFamily: "var(--font-lato)" }}>
                      <option value="">—</option>
                      {TRANSPORT_MODES.map((mode) => <option key={mode} value={mode}>{modeLabel(mode)}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>{dv.cargoType}</label>
                    <input className={inputCls} value={form.cargoType} onChange={(e) => set("cargoType", e.target.value)} placeholder={dv.cargoPh} required style={{ fontFamily: "var(--font-lato)" }} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>{dv.weight}</label>
                      <input type="number" min="0" step="0.1" className={inputCls} value={form.weight} onChange={(e) => set("weight", e.target.value)} placeholder="0.0" style={{ fontFamily: "var(--font-lato)" }} />
                    </div>
                    <div>
                      <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>{dv.volume}</label>
                      <input type="number" min="0" step="0.001" className={inputCls} value={form.volume} onChange={(e) => set("volume", e.target.value)} placeholder="0.000" style={{ fontFamily: "var(--font-lato)" }} />
                    </div>
                  </div>

                  <div>
                    <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>{t.devisForm.preferredDate}</label>
                    <input type="date" className={inputCls} value={form.preferredDate} onChange={(e) => set("preferredDate", e.target.value)} style={{ fontFamily: "var(--font-lato)" }} />
                  </div>

                  <label className="flex items-center gap-3 cursor-pointer w-fit">
                    <input type="checkbox" checked={form.dangerous} onChange={(e) => setForm((f) => ({ ...f, dangerous: e.target.checked }))} className="w-4 h-4 rounded accent-[#E8520A]" />
                    <span className="text-sm text-gray-600" style={{ fontFamily: "var(--font-lato)" }}>{t.devisForm.dangerous}</span>
                  </label>

                  <div>
                    <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>{dv.phone}</label>
                    <input type="tel" className={inputCls} value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+242 00 000 00 00" required style={{ fontFamily: "var(--font-lato)" }} />
                  </div>

                  <div>
                    <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>{dv.notes}</label>
                    <textarea className={`${inputCls} resize-none`} rows={3} value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder={dv.notesPh} style={{ fontFamily: "var(--font-lato)" }} />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-black uppercase text-gray-600 hover:bg-gray-50 transition-colors" style={{ fontFamily: "var(--font-montserrat)" }}>
                      {dv.cancel}
                    </button>
                    <button type="submit" disabled={submitting} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-black uppercase transition-opacity hover:opacity-80 disabled:opacity-50" style={{ backgroundColor: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
                      {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                      {submitting ? dv.sending : dv.send}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Signature modal */}
      {signQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-black uppercase text-sm" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
                {dv.signTitle} {signQuote.id.slice(0, 8).toUpperCase()}
              </h2>
              <button onClick={() => setSignQuote(null)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="px-6 py-5">
              <SignaturePad
                defaultName={user?.name ?? ""}
                submitting={signing}
                error={signError}
                onCancel={() => setSignQuote(null)}
                onConfirm={submitSign}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
