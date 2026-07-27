"use client";

import { useMemo, useState } from "react";
import { Plane, Ship, Plus, Trash2, Wand2, ChevronDown, ChevronUp } from "lucide-react";
import {
  computeDevis, DEBOURS_FIXES, DEBOURS_IDENTIQUE_SUGGESTIONS, formatPrice,
  type Mode, type MaritimeType, type DevisLine,
} from "@/lib/grille";

const NAVY = "#1A3A6B";
const ORANGE = "#E8520A";
const fontM = { fontFamily: "var(--font-montserrat)" };
const fontL = { fontFamily: "var(--font-lato)" };
const inputCls = "w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#1A3A6B] bg-white";

function num(v: string): number {
  const n = parseFloat(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/**
 * Calcule un devis depuis la grille EXPAC et injecte tous les postes
 * (honoraires, débours, commission, TVA, CA) dans les lignes du devis — modifiables ensuite.
 */
export default function GrilleQuoteFill({ onInject }: { onInject: (lines: DevisLine[]) => void }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("MARITIME");
  const [weightKg, setWeightKg] = useState("");
  const [maritimeType, setMaritimeType] = useState<MaritimeType>("CONTENEUR");
  const [tonnes, setTonnes] = useState("");
  const [tc20, setTc20] = useState("");
  const [tc40, setTc40] = useState("");
  const [valeurDouane, setValeurDouane] = useState("");
  const [fixesQty, setFixesQty] = useState<Record<string, number>>({});
  const [identique, setIdentique] = useState<{ label: string; amount: string }[]>([{ label: "Droits de douane", amount: "" }]);

  const catalog = useMemo(() => DEBOURS_FIXES.filter((d) => d.modes.includes(mode)), [mode]);

  const deboursFixesLines = useMemo<DevisLine[]>(() => {
    const out: DevisLine[] = [];
    for (const d of catalog) {
      const qty = fixesQty[d.code] ?? 0;
      if (qty <= 0) continue;
      if (d.percentValeurDouane) out.push({ label: d.label, amount: Math.round(num(valeurDouane) * d.percentValeurDouane) });
      else out.push({ label: qty > 1 ? `${d.label} ×${qty}` : d.label, amount: d.amount * qty });
    }
    return out;
  }, [catalog, fixesQty, valeurDouane]);

  const deboursIdentiqueLines = useMemo<DevisLine[]>(
    () => identique.map((l) => ({ label: l.label.trim() || "Débours", amount: num(l.amount) })).filter((l) => l.amount > 0),
    [identique]
  );

  const result = useMemo(
    () => computeDevis({
      mode, weightKg: num(weightKg), maritimeType, tonnes: num(tonnes), tc20: num(tc20), tc40: num(tc40),
      deboursFixes: deboursFixesLines, deboursIdentique: deboursIdentiqueLines,
    }),
    [mode, weightKg, maritimeType, tonnes, tc20, tc40, deboursFixesLines, deboursIdentiqueLines]
  );

  function inject() {
    const lines: DevisLine[] = [{ label: "Honoraires de prestation", amount: result.prestations }];
    if (result.fraisOuverture > 0) lines.push({ label: "Frais d'ouverture de dossier", amount: result.fraisOuverture });
    lines.push(...deboursFixesLines, ...deboursIdentiqueLines);
    if (result.commission > 0) lines.push({ label: "Commission sur débours (3,5 %)", amount: result.commission });
    lines.push({ label: "TVA 18 %", amount: result.tva });
    lines.push({ label: "CA 5 % (sur la TVA)", amount: result.ca });
    onInject(lines);
    setOpen(false);
  }

  const modeBtn = (m: Mode, Icon: typeof Plane, label: string) => (
    <button type="button" onClick={() => setMode(m)}
      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-black uppercase border-2 transition-all"
      style={mode === m ? { borderColor: NAVY, backgroundColor: `${NAVY}0d`, color: NAVY, ...fontM } : { borderColor: "#e5e7eb", color: "#9ca3af", ...fontM }}>
      <Icon size={13} /> {label}
    </button>
  );

  return (
    <div className="rounded-xl border-2 bg-white" style={{ borderColor: "rgba(26,58,107,0.25)" }}>
      <button type="button" onClick={() => setOpen((v) => !v)} className="w-full flex items-center justify-between p-3.5">
        <span className="text-sm font-black uppercase tracking-wider flex items-center gap-1.5" style={{ color: NAVY, ...fontM }}>
          <Wand2 size={14} /> Calculer depuis la grille
        </span>
        {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
      </button>

      {open && (
        <div className="p-3.5 pt-0 space-y-3">
          <div className="flex gap-2">{modeBtn("AERIEN", Plane, "Aérien")}{modeBtn("MARITIME", Ship, "Maritime")}</div>

          {mode === "AERIEN" ? (
            <input type="number" min="0" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} placeholder="Poids (kg)" className={inputCls} style={fontL} />
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <button type="button" onClick={() => setMaritimeType("CONTENEUR")} className="flex-1 py-1.5 rounded-lg text-xs font-black uppercase border-2 transition-all"
                  style={maritimeType === "CONTENEUR" ? { borderColor: ORANGE, backgroundColor: `${ORANGE}0d`, color: ORANGE, ...fontM } : { borderColor: "#e5e7eb", color: "#9ca3af", ...fontM }}>Conteneur</button>
                <button type="button" onClick={() => setMaritimeType("CONVENTIONNEL")} className="flex-1 py-1.5 rounded-lg text-xs font-black uppercase border-2 transition-all"
                  style={maritimeType === "CONVENTIONNEL" ? { borderColor: ORANGE, backgroundColor: `${ORANGE}0d`, color: ORANGE, ...fontM } : { borderColor: "#e5e7eb", color: "#9ca3af", ...fontM }}>Conventionnel</button>
              </div>
              {maritimeType === "CONTENEUR" ? (
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" min="0" value={tc40} onChange={(e) => setTc40(e.target.value)} placeholder="Conteneurs 40'" className={inputCls} style={fontL} />
                  <input type="number" min="0" value={tc20} onChange={(e) => setTc20(e.target.value)} placeholder="Conteneurs 20'" className={inputCls} style={fontL} />
                </div>
              ) : (
                <input type="number" min="0" value={tonnes} onChange={(e) => setTonnes(e.target.value)} placeholder="Tonnage" className={inputCls} style={fontL} />
              )}
            </div>
          )}

          {/* Débours fixes */}
          <div>
            <p className="text-[11px] font-black uppercase tracking-wider text-gray-400 mb-1.5" style={fontM}>Débours fixes</p>
            <div className="space-y-1 max-h-44 overflow-y-auto pr-1">
              {catalog.map((d) => {
                const on = (fixesQty[d.code] ?? 0) > 0;
                return (
                  <div key={d.code} className="text-xs">
                    <label className="flex items-center gap-2 py-0.5 cursor-pointer">
                      <input type="checkbox" checked={on} onChange={(e) => setFixesQty((m) => ({ ...m, [d.code]: e.target.checked ? 1 : 0 }))} className="w-3.5 h-3.5 accent-[#1A3A6B] shrink-0" />
                      <span className="text-gray-600 truncate flex-1" style={fontL}>{d.label}</span>
                      <span className="text-gray-400 shrink-0">{d.percentValeurDouane ? "1 % val." : formatPrice(d.amount)}</span>
                    </label>
                    {on && d.percentValeurDouane && (
                      <input type="number" min="0" value={valeurDouane} onChange={(e) => setValeurDouane(e.target.value)} placeholder="Valeur en douane" className="w-full mt-1 px-2 py-1.5 rounded-lg border border-gray-200 text-xs outline-none focus:border-[#1A3A6B]" style={fontL} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Débours à l'identique */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[11px] font-black uppercase tracking-wider text-gray-400" style={fontM}>Débours à l&apos;identique</p>
              <button type="button" onClick={() => setIdentique((r) => [...r, { label: "", amount: "" }])} className="flex items-center gap-1 text-[11px] font-black uppercase" style={{ color: ORANGE, ...fontM }}><Plus size={12} /> Ligne</button>
            </div>
            <datalist id="grille-debours-suggestions">{DEBOURS_IDENTIQUE_SUGGESTIONS.map((s) => <option key={s} value={s} />)}</datalist>
            <div className="space-y-1.5">
              {identique.map((l, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <input list="grille-debours-suggestions" value={l.label} onChange={(e) => setIdentique((rows) => rows.map((r, idx) => idx === i ? { ...r, label: e.target.value } : r))} placeholder="Libellé" className="flex-1 min-w-0 px-2 py-1.5 rounded-lg border border-gray-200 text-xs outline-none focus:border-[#1A3A6B]" style={fontL} />
                  <input type="number" min="0" value={l.amount} onChange={(e) => setIdentique((rows) => rows.map((r, idx) => idx === i ? { ...r, amount: e.target.value } : r))} placeholder="Montant" className="w-24 px-2 py-1.5 rounded-lg border border-gray-200 text-xs outline-none focus:border-[#1A3A6B]" style={fontL} />
                  <button type="button" onClick={() => setIdentique((r) => r.filter((_, idx) => idx !== i))} className="text-gray-300 hover:text-red-500 shrink-0"><Trash2 size={13} /></button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-gray-400" style={fontM}>Total TTC</p>
              <p className="text-base font-black" style={{ color: NAVY, ...fontM }}>{formatPrice(result.totalTTC)}</p>
            </div>
            <button type="button" onClick={inject} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-xs font-black uppercase tracking-wide hover:opacity-90" style={{ backgroundColor: NAVY, ...fontM }}>
              <Wand2 size={14} /> Injecter dans le devis
            </button>
          </div>
          <p className="text-[10px] text-gray-400" style={fontL}>Les postes sont pré-remplis dans le devis ci-dessous ; vous pouvez tout modifier avant l&apos;envoi.</p>
        </div>
      )}
    </div>
  );
}
