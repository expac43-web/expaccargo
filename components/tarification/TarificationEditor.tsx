"use client";

import { useEffect, useState } from "react";
import { Loader2, Save, Check, Info, Plane, Ship, Receipt, RotateCcw, AlertCircle } from "lucide-react";
import { DEFAULT_GRILLE, type GrilleConfig } from "@/lib/grille";

const NAVY = "#1A3A6B";
const ORANGE = "#E8520A";
const fontM = { fontFamily: "var(--font-montserrat)" };
const fontL = { fontFamily: "var(--font-lato)" };
const card = "bg-white rounded-2xl border border-gray-100 p-5";
const numCls = "w-32 px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#1A3A6B] text-right bg-white";
const th = "text-left text-[11px] font-black uppercase tracking-wider text-gray-500 px-3 py-2";

function nz(v: string): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
const pct = (x: number) => Math.round(x * 10000) / 100;

function NumRow({ label, value, onChange, suffix }: { label: string; value: number; onChange: (n: number) => void; suffix?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-sm text-gray-600" style={fontL}>{label}</span>
      <div className="flex items-center gap-1.5 shrink-0">
        <input type="number" value={value} onChange={(e) => onChange(nz(e.target.value))} className={numCls} style={fontL} />
        {suffix && <span className="text-xs text-gray-400 w-8">{suffix}</span>}
      </div>
    </div>
  );
}

export default function TarificationEditor() {
  const [cfg, setCfg] = useState<GrilleConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/grille")
      .then((r) => (r.ok ? r.json() : null))
      .then((c) => setCfg(c || DEFAULT_GRILLE))
      .catch(() => setCfg(DEFAULT_GRILLE))
      .finally(() => setLoading(false));
  }, []);

  function patch(p: Partial<GrilleConfig>) { setCfg((c) => (c ? { ...c, ...p } : c)); setSaved(false); }
  function setBracket(i: number, price: number) { setCfg((c) => (c ? { ...c, aerienBrackets: c.aerienBrackets.map((b, idx) => (idx === i ? { ...b, price } : b)) } : c)); setSaved(false); }
  function setTc(size: "20" | "40", v: number) { setCfg((c) => (c ? { ...c, maritimeTc: { ...c.maritimeTc, [size]: v } } : c)); setSaved(false); }
  function setDebour(i: number, amount: number) { setCfg((c) => (c ? { ...c, deboursFixes: c.deboursFixes.map((d, idx) => (idx === i ? { ...d, amount } : d)) } : c)); setSaved(false); }

  async function save() {
    if (!cfg) return;
    setSaving(true); setError("");
    try {
      const r = await fetch("/api/admin/grille", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cfg) });
      if (!r.ok) throw new Error("Échec de l'enregistrement.");
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally { setSaving(false); }
  }

  if (loading || !cfg) {
    return <div className="p-10 flex justify-center"><Loader2 className="animate-spin" style={{ color: NAVY }} /></div>;
  }

  return (
    <div className="p-5 lg:p-8 max-w-5xl">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
        <div>
          <h1 className="text-xl lg:text-2xl font-black" style={{ color: NAVY, ...fontM }}>Tarification</h1>
          <p className="text-sm text-gray-400" style={fontL}>Grille EXPAC — source de tous les devis (public et backoffice). Modifiable ici.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => { setCfg(DEFAULT_GRILLE); setSaved(false); }} title="Réinitialiser aux valeurs par défaut" className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-xs font-black uppercase hover:bg-gray-50" style={fontM}>
            <RotateCcw size={14} /> Défaut
          </button>
          <button onClick={save} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-xs font-black uppercase tracking-wide hover:opacity-90 disabled:opacity-50" style={{ backgroundColor: saved ? "#16a34a" : ORANGE, ...fontM }}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : <Save size={14} />}
            {saving ? "Enregistrement…" : saved ? "Enregistré" : "Enregistrer"}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100 mb-5">
          <AlertCircle size={15} className="text-red-500 shrink-0" />
          <p className="text-xs text-red-600" style={fontL}>{error}</p>
        </div>
      )}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-blue-50 border border-blue-100 mb-6">
        <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700 leading-relaxed" style={fontL}>
          Les modifications s&apos;appliquent immédiatement au calculateur public et au traitement des devis après enregistrement. Les <strong>codes SH</strong> (droits de douane) seront ajoutés ici dès réception du barème.
        </p>
      </div>

      {/* Taux & frais */}
      <div className={`${card} mb-5`}>
        <h2 className="text-sm font-black uppercase tracking-wider text-gray-600 mb-3" style={fontM}>Taux &amp; frais</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
          <NumRow label="Frais d'ouverture de dossier" value={cfg.fraisOuverture} onChange={(n) => patch({ fraisOuverture: n })} suffix="F" />
          <NumRow label="Commission sur débours" value={pct(cfg.commissionRate)} onChange={(n) => patch({ commissionRate: n / 100 })} suffix="%" />
          <NumRow label="TVA" value={pct(cfg.tvaRate)} onChange={(n) => patch({ tvaRate: n / 100 })} suffix="%" />
          <NumRow label="CA (sur la TVA)" value={pct(cfg.caRate)} onChange={(n) => patch({ caRate: n / 100 })} suffix="%" />
          <NumRow label="Engagement cautionné IM5" value={pct(cfg.engagementIm5Rate)} onChange={(n) => patch({ engagementIm5Rate: n / 100 })} suffix="%" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Aérien */}
        <div className={card}>
          <h2 className="text-sm font-black uppercase tracking-wider text-gray-600 mb-3 flex items-center gap-2" style={fontM}><Plane size={16} style={{ color: ORANGE }} /> Aérien — honoraires</h2>
          {cfg.aerienBrackets.map((b, i) => (
            <NumRow key={i} label={b.label} value={b.price} onChange={(n) => setBracket(i, n)} suffix="F" />
          ))}
          <NumRow label="Au-delà de 2 000 kg (par kg)" value={cfg.aerienOver2000PerKg} onChange={(n) => patch({ aerienOver2000PerKg: n })} suffix="F" />
        </div>

        {/* Maritime */}
        <div className={card}>
          <h2 className="text-sm font-black uppercase tracking-wider text-gray-600 mb-3 flex items-center gap-2" style={fontM}><Ship size={16} style={{ color: ORANGE }} /> Maritime — honoraires</h2>
          <NumRow label="Conteneur 40' (par TC)" value={cfg.maritimeTc["40"]} onChange={(n) => setTc("40", n)} suffix="F" />
          <NumRow label="Conteneur 20' (par TC)" value={cfg.maritimeTc["20"]} onChange={(n) => setTc("20", n)} suffix="F" />
          <NumRow label="Conventionnel (par tonne)" value={cfg.maritimeConvPerTonne} onChange={(n) => patch({ maritimeConvPerTonne: n })} suffix="F" />
          <NumRow label="Conventionnel — minimum / dossier" value={cfg.maritimeConvMin} onChange={(n) => patch({ maritimeConvMin: n })} suffix="F" />
          <NumRow label="Manutention / dépotage (par tonne)" value={cfg.manutentionPerTonne} onChange={(n) => patch({ manutentionPerTonne: n })} suffix="F" />
        </div>
      </div>

      {/* Débours fixes */}
      <div className={card}>
        <h2 className="text-sm font-black uppercase tracking-wider text-gray-600 mb-3 flex items-center gap-2" style={fontM}><Receipt size={16} style={{ color: ORANGE }} /> Débours fixes</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-gray-100"><th className={th}>Poste</th><th className={`${th} text-right`}>Montant</th></tr></thead>
            <tbody>
              {cfg.deboursFixes.map((d, i) => (
                <tr key={d.code} className="border-b border-gray-50">
                  <td className="px-3 py-1.5 text-sm text-gray-600" style={fontL}>{d.label}</td>
                  <td className="px-3 py-1.5 text-right">
                    {d.percentValeurDouane ? (
                      <span className="text-xs text-gray-400" style={fontL}>1 % valeur douane</span>
                    ) : (
                      <input type="number" value={d.amount} onChange={(e) => setDebour(i, nz(e.target.value))} className={numCls} style={fontL} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-end mt-5">
        <button onClick={save} disabled={saving} className="flex items-center gap-2 px-6 py-3 rounded-xl text-white text-sm font-black uppercase tracking-wide hover:opacity-90 disabled:opacity-50" style={{ backgroundColor: saved ? "#16a34a" : ORANGE, ...fontM }}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : <Save size={14} />}
          {saving ? "Enregistrement…" : saved ? "Enregistré" : "Enregistrer la grille"}
        </button>
      </div>
    </div>
  );
}
