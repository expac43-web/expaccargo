"use client";

import { useMemo, useState, useEffect } from "react";
import { Plane, Ship, Plus, Trash2, Send, Receipt } from "lucide-react";
import {
  computeDevis, prestationAerien, prestationConventionnel, DEFAULT_GRILLE,
  DEBOURS_IDENTIQUE_SUGGESTIONS, formatPrice,
  type Mode, type MaritimeType, type DevisLine, type GrilleConfig,
} from "@/lib/grille";

const NAVY = "#1A3A6B";
const ORANGE = "#E8520A";
const VIOLET = "#7c3aed";
const fontM = { fontFamily: "var(--font-montserrat)" };
const fontL = { fontFamily: "var(--font-lato)" };
const inputCls = "w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#1A3A6B] bg-white";
const CURRENCIES = ["XAF", "EUR", "USD"];

function num(v: string): number {
  const n = parseFloat(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/**
 * Composeur de devis en deux parties : à gauche on saisit (mode, quantités, débours),
 * à droite le devis se calcule en direct depuis la grille. Lignes libres pour les ajustements.
 */
export default function DevisComposer({
  initialItems, quotedBefore, saving, onSubmit,
}: {
  initialItems: DevisLine[];
  quotedBefore: boolean;
  saving: boolean;
  onSubmit: (lines: DevisLine[], total: number, currency: string, message: string) => void;
}) {
  const [mode, setMode] = useState<Mode>("MARITIME");
  const [weightKg, setWeightKg] = useState("");
  const [maritimeType, setMaritimeType] = useState<MaritimeType>("CONTENEUR");
  const [tonnes, setTonnes] = useState("");
  const [tc20, setTc20] = useState("");
  const [tc40, setTc40] = useState("");
  const [valeurDouane, setValeurDouane] = useState("");
  const [fixesQty, setFixesQty] = useState<Record<string, number>>({});
  const [fixesAmount, setFixesAmount] = useState<Record<string, string>>({});
  const [identique, setIdentique] = useState<{ label: string; amount: string }[]>([{ label: "Droits de douane", amount: "" }]);
  // Lignes libres : ajustements manuels + reprise éventuelle d'un devis précédent.
  const [freeLines, setFreeLines] = useState<{ label: string; amount: string }[]>(
    () => (quotedBefore ? initialItems.map((it) => ({ label: it.label, amount: String(it.amount) })) : [])
  );
  const [currency, setCurrency] = useState("XAF");
  const [message, setMessage] = useState("");
  const [config, setConfig] = useState<GrilleConfig>(DEFAULT_GRILLE);

  useEffect(() => {
    fetch("/api/grille").then((r) => (r.ok ? r.json() : null)).then((c) => { if (c) setConfig(c); }).catch(() => {});
  }, []);

  const catalog = useMemo(() => config.deboursFixes.filter((d) => d.modes.includes(mode)), [config, mode]);

  const hasInput =
    mode === "AERIEN" ? num(weightKg) > 0 : maritimeType === "CONTENEUR" ? num(tc20) + num(tc40) > 0 : num(tonnes) > 0;

  const deboursFixesLines = useMemo<DevisLine[]>(() => {
    const out: DevisLine[] = [];
    for (const d of catalog) {
      if ((fixesQty[d.code] ?? 0) <= 0) continue;
      if (d.percentValeurDouane) { out.push({ label: d.label, amount: Math.round(num(valeurDouane) * d.percentValeurDouane) }); continue; }
      // Montant modifiable : la valeur saisie prime sur le montant par défaut de la grille.
      const edited = fixesAmount[d.code];
      const amount = edited !== undefined && edited.trim() !== "" ? num(edited) : d.amount;
      out.push({ label: d.label, amount });
    }
    return out;
  }, [catalog, fixesQty, fixesAmount, valeurDouane]);

  const deboursIdentiqueLines = useMemo<DevisLine[]>(
    () => identique.map((l) => ({ label: l.label.trim() || "Débours", amount: num(l.amount) })).filter((l) => l.amount > 0),
    [identique]
  );

  const result = useMemo(
    () => computeDevis({
      mode, weightKg: num(weightKg), maritimeType, tonnes: num(tonnes), tc20: num(tc20), tc40: num(tc40),
      deboursFixes: deboursFixesLines, deboursIdentique: deboursIdentiqueLines,
    }, config),
    [mode, weightKg, maritimeType, tonnes, tc20, tc40, deboursFixesLines, deboursIdentiqueLines, config]
  );

  // Postes calculés depuis la grille (seulement si une quantité est saisie).
  const grilleLines = useMemo<DevisLine[]>(() => {
    if (!hasInput) return [];
    const lines: DevisLine[] = [{ label: "Honoraires de prestation", amount: result.prestations }];
    if (result.fraisOuverture > 0) lines.push({ label: "Frais d'ouverture de dossier", amount: result.fraisOuverture });
    lines.push(...deboursFixesLines, ...deboursIdentiqueLines);
    if (result.commission > 0) lines.push({ label: "Commission sur débours (3,5 %)", amount: result.commission });
    lines.push({ label: "TVA 18 %", amount: result.tva }, { label: "CA 5 % (sur la TVA)", amount: result.ca });
    return lines;
  }, [hasInput, result, deboursFixesLines, deboursIdentiqueLines]);

  const freeClean = useMemo<DevisLine[]>(
    () => freeLines.map((l) => ({ label: l.label.trim() || "Ligne", amount: Number(l.amount) })).filter((l) => Number.isFinite(l.amount) && l.amount !== 0),
    [freeLines]
  );

  const allLines = useMemo(() => [...grilleLines, ...freeClean], [grilleLines, freeClean]);
  const total = useMemo(() => allLines.reduce((s, l) => s + l.amount, 0), [allLines]);
  const canSend = allLines.length > 0 && total > 0;

  // Aperçu du montant à côté de chaque champ de quantité.
  const hint = (v: number) => (v > 0 ? <span className="text-xs shrink-0" style={{ color: ORANGE }}>= {formatPrice(v)}</span> : null);

  const modeBtn = (m: Mode, Icon: typeof Plane, label: string) => (
    <button type="button" onClick={() => setMode(m)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-black uppercase border-2 transition-all"
      style={mode === m ? { borderColor: NAVY, backgroundColor: `${NAVY}0d`, color: NAVY, ...fontM } : { borderColor: "#e5e7eb", color: "#9ca3af", ...fontM }}>
      <Icon size={13} /> {label}
    </button>
  );

  return (
    <div className="rounded-xl border-2 bg-white p-4" style={{ borderColor: "rgba(124,58,237,0.35)" }}>
      <p className="text-sm font-black uppercase tracking-wider mb-3 flex items-center gap-1.5" style={{ color: VIOLET, ...fontM }}>
        <Receipt size={14} /> {quotedBefore ? "Mettre à jour le devis" : "Établir le devis"}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ── Gauche : saisie ── */}
        <div className="space-y-3">
          <p className="text-[11px] font-black uppercase tracking-wider text-gray-400" style={fontM}>Éléments à saisir</p>
          <div className="flex gap-2">{modeBtn("AERIEN", Plane, "Aérien")}{modeBtn("MARITIME", Ship, "Maritime")}</div>

          {mode === "AERIEN" ? (
            <div>
              <label className="text-xs text-gray-500" style={fontL}>Poids de la marchandise (kg)</label>
              <div className="flex items-center gap-2">
                <input type="number" min="0" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} placeholder="Ex : 350" className={inputCls} style={fontL} />
                {hint(num(weightKg) > 0 ? prestationAerien(num(weightKg), config) : 0)}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <button type="button" onClick={() => setMaritimeType("CONTENEUR")} className="flex-1 py-1.5 rounded-lg text-xs font-black uppercase border-2 transition-all"
                  style={maritimeType === "CONTENEUR" ? { borderColor: ORANGE, backgroundColor: `${ORANGE}0d`, color: ORANGE, ...fontM } : { borderColor: "#e5e7eb", color: "#9ca3af", ...fontM }}>Conteneur</button>
                <button type="button" onClick={() => setMaritimeType("CONVENTIONNEL")} className="flex-1 py-1.5 rounded-lg text-xs font-black uppercase border-2 transition-all"
                  style={maritimeType === "CONVENTIONNEL" ? { borderColor: ORANGE, backgroundColor: `${ORANGE}0d`, color: ORANGE, ...fontM } : { borderColor: "#e5e7eb", color: "#9ca3af", ...fontM }}>Conventionnel</button>
              </div>
              {maritimeType === "CONTENEUR" ? (
                <>
                  <div>
                    <label className="text-xs text-gray-500" style={fontL}>Nombre de conteneurs 40&apos;</label>
                    <div className="flex items-center gap-2">
                      <input type="number" min="0" value={tc40} onChange={(e) => setTc40(e.target.value)} placeholder="Ex : 2" className={inputCls} style={fontL} />
                      {hint(num(tc40) * config.maritimeTc["40"])}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500" style={fontL}>Nombre de conteneurs 20&apos;</label>
                    <div className="flex items-center gap-2">
                      <input type="number" min="0" value={tc20} onChange={(e) => setTc20(e.target.value)} placeholder="Ex : 1" className={inputCls} style={fontL} />
                      {hint(num(tc20) * config.maritimeTc["20"])}
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <label className="text-xs text-gray-500" style={fontL}>Poids total (en tonnes)</label>
                  <div className="flex items-center gap-2">
                    <input type="number" min="0" value={tonnes} onChange={(e) => setTonnes(e.target.value)} placeholder="Ex : 5" className={inputCls} style={fontL} />
                    {hint(num(tonnes) > 0 ? prestationConventionnel(num(tonnes), config) : 0)}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Débours fixes */}
          <div>
            <p className="text-[11px] font-black uppercase tracking-wider text-gray-400 mb-1.5 border-t border-gray-100 pt-2.5" style={fontM}>Débours (cocher)</p>
            <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
              {catalog.map((d) => {
                const on = (fixesQty[d.code] ?? 0) > 0;
                return (
                  <div key={d.code} className="text-xs">
                    <div className="flex items-center gap-2 py-0.5">
                      <label className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer">
                        <input type="checkbox" checked={on} onChange={(e) => setFixesQty((m) => ({ ...m, [d.code]: e.target.checked ? 1 : 0 }))} className="w-3.5 h-3.5 accent-[#1A3A6B] shrink-0" />
                        <span className="text-gray-600 truncate" style={fontL}>{d.label}</span>
                      </label>
                      {on && !d.percentValeurDouane ? (
                        <input type="number" min="0" value={fixesAmount[d.code] ?? String(d.amount)} onChange={(e) => setFixesAmount((m) => ({ ...m, [d.code]: e.target.value }))} title="Montant modifiable" className="w-24 px-2 py-1 rounded-lg border border-gray-200 text-xs text-right outline-none focus:border-[#1A3A6B] shrink-0" style={fontL} />
                      ) : (
                        <span className="text-gray-400 shrink-0">{d.percentValeurDouane ? "1 % val." : formatPrice(d.amount)}</span>
                      )}
                    </div>
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
            <datalist id="composer-debours-suggestions">{DEBOURS_IDENTIQUE_SUGGESTIONS.map((s) => <option key={s} value={s} />)}</datalist>
            <div className="space-y-1.5">
              {identique.map((l, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <input list="composer-debours-suggestions" value={l.label} onChange={(e) => setIdentique((rows) => rows.map((r, idx) => idx === i ? { ...r, label: e.target.value } : r))} placeholder="Libellé" className="flex-1 min-w-0 px-2 py-1.5 rounded-lg border border-gray-200 text-xs outline-none focus:border-[#1A3A6B]" style={fontL} />
                  <input type="number" min="0" value={l.amount} onChange={(e) => setIdentique((rows) => rows.map((r, idx) => idx === i ? { ...r, amount: e.target.value } : r))} placeholder="Montant" className="w-24 px-2 py-1.5 rounded-lg border border-gray-200 text-xs outline-none focus:border-[#1A3A6B]" style={fontL} />
                  <button type="button" onClick={() => setIdentique((r) => r.filter((_, idx) => idx !== i))} className="text-gray-300 hover:text-red-500 shrink-0"><Trash2 size={13} /></button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Droite : devis en direct ── */}
        <div className="space-y-3">
          <p className="text-[11px] font-black uppercase tracking-wider text-gray-400" style={fontM}>Devis (calculé en direct)</p>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 min-h-[3rem]">
            {grilleLines.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-3" style={fontL}>Saisissez une quantité à gauche pour calculer.</p>
            ) : (
              <div className="space-y-1">
                {grilleLines.map((l, i) => (
                  <div key={i} className="flex justify-between text-xs" style={fontL}>
                    <span className="text-gray-500 truncate pr-2">{l.label}</span>
                    <span className="text-gray-700 shrink-0">{formatPrice(l.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Lignes libres */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[11px] font-black uppercase tracking-wider text-gray-400" style={fontM}>Lignes libres (remise, fret…)</p>
              <button type="button" onClick={() => setFreeLines((r) => [...r, { label: "", amount: "" }])} className="flex items-center gap-1 text-[11px] font-black uppercase" style={{ color: ORANGE, ...fontM }}><Plus size={12} /> Ligne</button>
            </div>
            <div className="space-y-1.5">
              {freeLines.map((l, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <input value={l.label} onChange={(e) => setFreeLines((rows) => rows.map((r, idx) => idx === i ? { ...r, label: e.target.value } : r))} placeholder="Libellé (ex : Remise)" className="flex-1 min-w-0 px-2 py-1.5 rounded-lg border border-gray-200 text-xs outline-none focus:border-[#1A3A6B]" style={fontL} />
                  <input type="number" step="any" value={l.amount} onChange={(e) => setFreeLines((rows) => rows.map((r, idx) => idx === i ? { ...r, amount: e.target.value } : r))} placeholder="± Montant" className="w-24 px-2 py-1.5 rounded-lg border border-gray-200 text-xs outline-none focus:border-[#1A3A6B]" style={fontL} />
                  <button type="button" onClick={() => setFreeLines((r) => r.filter((_, idx) => idx !== i))} className="text-gray-300 hover:text-red-500 shrink-0"><Trash2 size={13} /></button>
                </div>
              ))}
            </div>
          </div>

          {/* Total + devise */}
          <div className="flex items-center justify-between gap-3 border-t border-gray-100 pt-2.5">
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="px-2 py-1.5 rounded-lg border border-gray-200 text-xs outline-none focus:border-[#1A3A6B] bg-white" style={fontL}>
              {CURRENCIES.map((c) => <option key={c} value={c}>{c === "XAF" ? "FCFA" : c}</option>)}
            </select>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-wider text-gray-400" style={fontM}>Total {currency === "XAF" ? "TTC" : ""}</p>
              <p className="text-lg font-black" style={{ color: NAVY, ...fontM }}>{new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(Math.round(total))} {currency === "XAF" ? "FCFA" : currency}</p>
            </div>
          </div>

          <textarea rows={2} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Message au client (facultatif) : délais, validité…" className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#1A3A6B] resize-none" style={fontL} />

          <button type="button" onClick={() => onSubmit(allLines, total, currency, message.trim())} disabled={saving || !canSend}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-black uppercase text-white hover:opacity-90 disabled:opacity-50" style={{ backgroundColor: VIOLET, ...fontM }}>
            <Send size={14} /> {saving ? "Envoi…" : quotedBefore ? "Renvoyer le devis au client" : "Envoyer le devis au client"}
          </button>
        </div>
      </div>
    </div>
  );
}
