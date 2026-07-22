"use client";

import { useMemo, useState } from "react";
import { Plane, Ship, Plus, Trash2, FileDown, RotateCcw, Package } from "lucide-react";
import {
  computeDevis, DEBOURS_FIXES, DEBOURS_IDENTIQUE_SUGGESTIONS, formatPrice,
  type Mode, type MaritimeType, type TvaBase, type DevisLine,
} from "@/lib/grille";
import { exportDevisTransitPDF } from "@/lib/pdf";

const NAVY = "#1A3A6B";
const ORANGE = "#E8520A";
const fontM = { fontFamily: "var(--font-montserrat)" };
const fontL = { fontFamily: "var(--font-lato)" };
const labelCls = "block text-xs font-black uppercase tracking-wider mb-1.5 text-gray-600";
const inputCls = "w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#1A3A6B] bg-white";

function num(v: string): number {
  const n = parseFloat(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
}
function makeRef(): string {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const AL = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 4; i++) s += AL[Math.floor(Math.random() * AL.length)];
  return `DEV-${ymd}-${s}`;
}

/** Ligne du récapitulatif. */
function Row({ label, value, strong, sub }: { label: string; value: string; strong?: boolean; sub?: boolean }) {
  return (
    <div className={`flex justify-between gap-3 ${sub ? "text-xs text-gray-400" : "text-sm"}`}>
      <span className={strong ? "font-black" : sub ? "" : "text-gray-500"} style={strong ? { color: NAVY, ...fontM } : fontL}>{label}</span>
      <span className={strong ? "font-black" : "text-gray-700"} style={strong ? { color: NAVY, ...fontM } : fontL}>{value}</span>
    </div>
  );
}

export default function DevisTransitBuilder() {
  const [mode, setMode] = useState<Mode>("MARITIME");
  const [weightKg, setWeightKg] = useState("");
  const [maritimeType, setMaritimeType] = useState<MaritimeType>("CONTENEUR");
  const [tonnes, setTonnes] = useState("");
  const [tc20, setTc20] = useState("");
  const [tc40, setTc40] = useState("");
  const [valeurDouane, setValeurDouane] = useState("");
  const [fixesQty, setFixesQty] = useState<Record<string, number>>({});
  const [identique, setIdentique] = useState<{ label: string; amount: string }[]>([{ label: "Droits de douane", amount: "" }]);
  const [tvaBase, setTvaBase] = useState<TvaBase>("FULL");
  const [includeOuverture, setIncludeOuverture] = useState(true);
  const [clientLabel, setClientLabel] = useState("");

  const catalog = useMemo(() => DEBOURS_FIXES.filter((d) => d.modes.includes(mode)), [mode]);

  const deboursFixesLines = useMemo<DevisLine[]>(() => {
    const out: DevisLine[] = [];
    for (const d of catalog) {
      const qty = fixesQty[d.code] ?? 0;
      if (qty <= 0) continue;
      if (d.percentValeurDouane) {
        out.push({ label: d.label, amount: Math.round(num(valeurDouane) * d.percentValeurDouane) });
      } else {
        out.push({ label: qty > 1 ? `${d.label} ×${qty}` : d.label, amount: d.amount * qty });
      }
    }
    return out;
  }, [catalog, fixesQty, valeurDouane]);

  const deboursIdentiqueLines = useMemo<DevisLine[]>(
    () => identique.map((l) => ({ label: l.label.trim() || "Débours", amount: num(l.amount) })).filter((l) => l.amount > 0),
    [identique]
  );

  const result = useMemo(
    () => computeDevis({
      mode, weightKg: num(weightKg), maritimeType,
      tonnes: num(tonnes), tc20: num(tc20), tc40: num(tc40),
      deboursFixes: deboursFixesLines, deboursIdentique: deboursIdentiqueLines,
      includeFraisOuverture: includeOuverture, tvaBase,
    }),
    [mode, weightKg, maritimeType, tonnes, tc20, tc40, deboursFixesLines, deboursIdentiqueLines, includeOuverture, tvaBase]
  );

  const modeDetail = mode === "AERIEN"
    ? `Aérien — ${num(weightKg)} kg`
    : maritimeType === "CONTENEUR"
      ? `Maritime conteneur — ${num(tc40)}×40', ${num(tc20)}×20'`
      : `Maritime conventionnel — ${num(tonnes)} t`;
  const tvaBaseLabel = tvaBase === "FULL" ? "prestations + ouverture + commission" : "prestations";

  function reset() {
    setWeightKg(""); setTonnes(""); setTc20(""); setTc40(""); setValeurDouane("");
    setFixesQty({}); setIdentique([{ label: "Droits de douane", amount: "" }]); setClientLabel("");
  }

  function exportPdf() {
    exportDevisTransitPDF({
      reference: makeRef(), clientLabel, modeDetail,
      prestations: result.prestations, fraisOuverture: result.fraisOuverture, commission: result.commission,
      debours: [...deboursFixesLines, ...deboursIdentiqueLines], deboursTotal: result.deboursTotal,
      remuneration: result.remuneration, baseTaxable: result.baseTaxable,
      tva: result.tva, ca: result.ca, totalHT: result.totalHT, totalTTC: result.totalTTC, tvaBaseLabel,
    });
  }

  const modeBtn = (m: Mode, Icon: typeof Plane, label: string) => (
    <button
      onClick={() => setMode(m)}
      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black uppercase tracking-wide border-2 transition-all"
      style={mode === m
        ? { borderColor: NAVY, backgroundColor: `${NAVY}0d`, color: NAVY, ...fontM }
        : { borderColor: "#e5e7eb", color: "#9ca3af", ...fontM }}
    >
      <Icon size={15} /> {label}
    </button>
  );

  return (
    <div className="p-5 lg:p-8">
      <div className="mb-6">
        <h1 className="text-xl lg:text-2xl font-black" style={{ color: NAVY, ...fontM }}>Devis de transit</h1>
        <p className="text-sm text-gray-400" style={fontL}>
          Calcul selon la grille EXPAC. Les droits de douane se saisissent en débours à l&apos;identique en attendant le barème HS.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        {/* ── Formulaire ── */}
        <div className="lg:col-span-3 space-y-5">
          {/* Mode + nature */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex gap-2 mb-4">
              {modeBtn("AERIEN", Plane, "Aérien")}
              {modeBtn("MARITIME", Ship, "Maritime")}
            </div>

            {mode === "AERIEN" ? (
              <div>
                <label className={labelCls} style={fontM}>Poids (kg)</label>
                <input type="number" min="0" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} placeholder="0" className={inputCls} style={fontL} />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <button onClick={() => setMaritimeType("CONTENEUR")} className="flex-1 py-2 rounded-xl text-xs font-black uppercase border-2 transition-all"
                    style={maritimeType === "CONTENEUR" ? { borderColor: ORANGE, backgroundColor: `${ORANGE}0d`, color: ORANGE, ...fontM } : { borderColor: "#e5e7eb", color: "#9ca3af", ...fontM }}>
                    Conteneur
                  </button>
                  <button onClick={() => setMaritimeType("CONVENTIONNEL")} className="flex-1 py-2 rounded-xl text-xs font-black uppercase border-2 transition-all"
                    style={maritimeType === "CONVENTIONNEL" ? { borderColor: ORANGE, backgroundColor: `${ORANGE}0d`, color: ORANGE, ...fontM } : { borderColor: "#e5e7eb", color: "#9ca3af", ...fontM }}>
                    Conventionnel
                  </button>
                </div>
                {maritimeType === "CONTENEUR" ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls} style={fontM}>Conteneurs 40&apos; (500 000)</label>
                      <input type="number" min="0" value={tc40} onChange={(e) => setTc40(e.target.value)} placeholder="0" className={inputCls} style={fontL} />
                    </div>
                    <div>
                      <label className={labelCls} style={fontM}>Conteneurs 20&apos; (300 000)</label>
                      <input type="number" min="0" value={tc20} onChange={(e) => setTc20(e.target.value)} placeholder="0" className={inputCls} style={fontL} />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className={labelCls} style={fontM}>Tonnage (30 000/t, min 180 000)</label>
                    <input type="number" min="0" value={tonnes} onChange={(e) => setTonnes(e.target.value)} placeholder="0" className={inputCls} style={fontL} />
                  </div>
                )}
              </div>
            )}

            <div className="mt-4">
              <label className={labelCls} style={fontM}>Client / objet (pour le PDF)</label>
              <input type="text" value={clientLabel} onChange={(e) => setClientLabel(e.target.value)} placeholder="Nom du client, référence dossier…" className={inputCls} style={fontL} />
            </div>
          </div>

          {/* Débours fixes */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h2 className="text-sm font-black uppercase tracking-wider text-gray-600 mb-3" style={fontM}>Débours fixes</h2>
            <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
              {catalog.map((d) => {
                const qty = fixesQty[d.code] ?? 0;
                const on = qty > 0;
                return (
                  <div key={d.code} className={`rounded-xl border p-2.5 transition-colors ${on ? "border-[#1A3A6B]/30 bg-[#1A3A6B]/[0.03]" : "border-gray-100"}`}>
                    <div className="flex items-center gap-2.5">
                      <input type="checkbox" checked={on} onChange={(e) => setFixesQty((m) => ({ ...m, [d.code]: e.target.checked ? 1 : 0 }))}
                        className="w-4 h-4 accent-[#1A3A6B] shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-gray-700 truncate" style={fontL}>{d.label}</p>
                        <p className="text-[11px] text-gray-400">{d.percentValeurDouane ? "1 % de la valeur en douane" : `${formatPrice(d.amount)} / ${d.unit}`}</p>
                      </div>
                      {on && !d.percentValeurDouane && (
                        <input type="number" min="1" value={qty} onChange={(e) => setFixesQty((m) => ({ ...m, [d.code]: Math.max(1, Math.floor(Number(e.target.value) || 1)) }))}
                          className="w-14 px-2 py-1.5 rounded-lg border border-gray-200 text-sm text-center outline-none focus:border-[#1A3A6B]" style={fontL} title="Quantité" />
                      )}
                    </div>
                    {on && d.percentValeurDouane && (
                      <div className="mt-2 pl-7">
                        <input type="number" min="0" value={valeurDouane} onChange={(e) => setValeurDouane(e.target.value)} placeholder="Valeur en douane (FCFA)"
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#1A3A6B]" style={fontL} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Débours à l'identique */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-black uppercase tracking-wider text-gray-600" style={fontM}>Débours à l&apos;identique</h2>
              <button onClick={() => setIdentique((r) => [...r, { label: "", amount: "" }])} className="flex items-center gap-1 text-xs font-black uppercase" style={{ color: ORANGE, ...fontM }}>
                <Plus size={14} /> Ligne
              </button>
            </div>
            <p className="text-[11px] text-gray-400 mb-3" style={fontL}>Coûts réels avancés (assurance locale, acconage, magasinage… et droits de douane).</p>
            <datalist id="debours-suggestions">
              {DEBOURS_IDENTIQUE_SUGGESTIONS.map((s) => <option key={s} value={s} />)}
            </datalist>
            <div className="space-y-2">
              {identique.map((l, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input list="debours-suggestions" value={l.label} onChange={(e) => setIdentique((rows) => rows.map((r, idx) => idx === i ? { ...r, label: e.target.value } : r))}
                    placeholder="Libellé" className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#1A3A6B]" style={fontL} />
                  <input type="number" min="0" value={l.amount} onChange={(e) => setIdentique((rows) => rows.map((r, idx) => idx === i ? { ...r, amount: e.target.value } : r))}
                    placeholder="Montant" className="w-32 px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#1A3A6B]" style={fontL} />
                  <button onClick={() => setIdentique((r) => r.filter((_, idx) => idx !== i))} className="text-gray-300 hover:text-red-500 shrink-0" title="Supprimer">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Options */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-3">
            <h2 className="text-sm font-black uppercase tracking-wider text-gray-600" style={fontM}>Options</h2>
            <label className="flex items-center gap-2.5 text-sm text-gray-600" style={fontL}>
              <input type="checkbox" checked={includeOuverture} onChange={(e) => setIncludeOuverture(e.target.checked)} className="w-4 h-4 accent-[#1A3A6B]" />
              Inclure les frais d&apos;ouverture de dossier (40 000)
            </label>
            <div>
              <label className={labelCls} style={fontM}>Assiette de la TVA</label>
              <select value={tvaBase} onChange={(e) => setTvaBase(e.target.value as TvaBase)} className={inputCls} style={fontL}>
                <option value="FULL">Prestations + ouverture + commission</option>
                <option value="PRESTATIONS">Prestations uniquement</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── Récapitulatif ── */}
        <div className="lg:col-span-2 lg:sticky lg:top-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Package size={18} style={{ color: ORANGE }} />
              <h2 className="text-sm font-black uppercase tracking-wider" style={{ color: NAVY, ...fontM }}>Récapitulatif</h2>
            </div>

            <div className="space-y-2">
              <Row label="Honoraires de prestation" value={formatPrice(result.prestations)} />
              {result.fraisOuverture > 0 && <Row label="Frais d'ouverture" value={formatPrice(result.fraisOuverture)} />}
              {result.deboursFixesTotal > 0 && <Row label="Débours fixes" value={formatPrice(result.deboursFixesTotal)} />}
              {result.deboursIdentiqueTotal > 0 && <Row label="Débours à l'identique" value={formatPrice(result.deboursIdentiqueTotal)} />}
              {result.commission > 0 && <Row label="Commission débours (3,5 %)" value={formatPrice(result.commission)} />}

              <div className="border-t border-gray-100 my-2" />
              <Row label={`Base taxable (${tvaBaseLabel})`} value={formatPrice(result.baseTaxable)} sub />
              <Row label="TVA 18 %" value={formatPrice(result.tva)} />
              <Row label="CA 5 % (sur la TVA)" value={formatPrice(result.ca)} />
              {result.deboursTotal > 0 && <Row label="Total débours" value={formatPrice(result.deboursTotal)} />}
            </div>

            <div className="rounded-xl p-4 my-4" style={{ background: "linear-gradient(135deg,#0e2248,#1A3A6B)" }}>
              <p className="text-xs uppercase tracking-wider text-blue-200" style={fontM}>Total TTC</p>
              <p className="text-3xl font-black text-white" style={fontM}>{formatPrice(result.totalTTC)}</p>
            </div>

            <div className="flex gap-2">
              <button onClick={exportPdf} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white text-xs font-black uppercase tracking-wide hover:opacity-90"
                style={{ backgroundColor: ORANGE, ...fontM }}>
                <FileDown size={15} /> Exporter le devis (PDF)
              </button>
              <button onClick={reset} className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-gray-200 text-gray-500 text-xs font-black uppercase hover:bg-gray-50"
                style={fontM} title="Réinitialiser">
                <RotateCcw size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
