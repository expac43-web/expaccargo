"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plane, Ship, Package, FileDown, ArrowRight, AlertTriangle } from "lucide-react";
import { computeDevis, formatPrice, type Mode, type MaritimeType } from "@/lib/grille";
import { exportGrilleEstimatePDF } from "@/lib/pdf";

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

/** Estimateur public basé sur la grille EXPAC (honoraires + taxes, hors débours & douane). */
export default function GrilleEstimator() {
  const [mode, setMode] = useState<Mode>("MARITIME");
  const [weightKg, setWeightKg] = useState("");
  const [maritimeType, setMaritimeType] = useState<MaritimeType>("CONTENEUR");
  const [tonnes, setTonnes] = useState("");
  const [tc20, setTc20] = useState("");
  const [tc40, setTc40] = useState("");

  const hasInput =
    mode === "AERIEN"
      ? num(weightKg) > 0
      : maritimeType === "CONTENEUR"
        ? num(tc20) + num(tc40) > 0
        : num(tonnes) > 0;

  const result = useMemo(
    () => computeDevis({ mode, weightKg: num(weightKg), maritimeType, tonnes: num(tonnes), tc20: num(tc20), tc40: num(tc40) }),
    [mode, weightKg, maritimeType, tonnes, tc20, tc40]
  );

  const modeDetail =
    mode === "AERIEN"
      ? `Aérien — ${num(weightKg)} kg`
      : maritimeType === "CONTENEUR"
        ? `Maritime conteneur — ${num(tc40)}×40', ${num(tc20)}×20'`
        : `Maritime conventionnel — ${num(tonnes)} t`;

  function exportPdf() {
    exportGrilleEstimatePDF({
      modeDetail,
      prestations: result.prestations,
      fraisOuverture: result.fraisOuverture,
      tva: result.tva,
      ca: result.ca,
      total: result.totalTTC,
    });
  }

  const modeBtn = (m: Mode, Icon: typeof Plane, label: string) => (
    <button
      onClick={() => setMode(m)}
      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black uppercase tracking-wide border-2 transition-all"
      style={mode === m ? { borderColor: NAVY, backgroundColor: `${NAVY}0d`, color: NAVY, ...fontM } : { borderColor: "#e5e7eb", color: "#9ca3af", ...fontM }}
    >
      <Icon size={15} /> {label}
    </button>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Formulaire */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex gap-2 mb-5">
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
                  <label className={labelCls} style={fontM}>Conteneurs 40&apos;</label>
                  <input type="number" min="0" value={tc40} onChange={(e) => setTc40(e.target.value)} placeholder="0" className={inputCls} style={fontL} />
                </div>
                <div>
                  <label className={labelCls} style={fontM}>Conteneurs 20&apos;</label>
                  <input type="number" min="0" value={tc20} onChange={(e) => setTc20(e.target.value)} placeholder="0" className={inputCls} style={fontL} />
                </div>
              </div>
            ) : (
              <div>
                <label className={labelCls} style={fontM}>Tonnage</label>
                <input type="number" min="0" value={tonnes} onChange={(e) => setTonnes(e.target.value)} placeholder="0" className={inputCls} style={fontL} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Résultat */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col">
        <div className="flex items-center gap-2 mb-5">
          <Package size={18} style={{ color: NAVY }} />
          <h2 className="font-black uppercase text-sm" style={{ color: NAVY, ...fontM }}>Estimation</h2>
        </div>

        {!hasInput ? (
          <div className="flex-1 flex items-center justify-center text-center py-10">
            <p className="text-sm text-gray-400" style={fontL}>Renseignez votre expédition pour afficher l&apos;estimation.</p>
          </div>
        ) : (
          <>
            <div className="space-y-2 text-sm mb-4" style={fontL}>
              <div className="flex justify-between"><span className="text-gray-500">Honoraires de prestation</span><span className="text-gray-700">{formatPrice(result.prestations)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Frais d&apos;ouverture de dossier</span><span className="text-gray-700">{formatPrice(result.fraisOuverture)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">TVA 18 %</span><span className="text-gray-700">{formatPrice(result.tva)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">CA 5 % (sur la TVA)</span><span className="text-gray-700">{formatPrice(result.ca)}</span></div>
            </div>

            <div className="rounded-xl p-4 mb-4" style={{ background: "linear-gradient(135deg,#0e2248,#1A3A6B)" }}>
              <p className="text-xs uppercase tracking-wider text-blue-200" style={fontM}>Total estimé</p>
              <p className="text-3xl font-black text-white" style={fontM}>{formatPrice(result.totalTTC)}</p>
            </div>

            <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-100 mb-4">
              <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700" style={fontL}>
                <strong>Estimation de nos honoraires.</strong> Les <strong>droits de douane</strong> et les débours (assurance, acconage, magasinage…) dépendent de votre dossier et s&apos;ajoutent. Prix indicatif, non contractuel.
              </p>
            </div>

            <div className="flex gap-2 mt-auto">
              <button onClick={exportPdf} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 text-xs font-black uppercase text-gray-600 hover:bg-gray-50 transition-colors" style={fontM}>
                <FileDown size={14} /> PDF
              </button>
              <Link href="/devis" className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-xs font-black uppercase hover:opacity-90 transition-opacity" style={{ backgroundColor: ORANGE, ...fontM }}>
                Devis ferme <ArrowRight size={13} />
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
