import {
  AERIEN_BRACKETS, AERIEN_OVER_2000_PER_KG,
  MARITIME_CONV_PER_TONNE, MARITIME_CONV_MIN, MARITIME_TC_PRICE,
  MANUTENTION_PER_TONNE, MANUTENTION_MIN_TONNES,
  DEBOURS_FIXES, DEBOURS_IDENTIQUE_SUGGESTIONS,
  FRAIS_OUVERTURE, COMMISSION_RATE, TVA_RATE, CA_RATE,
  formatPrice, type Mode,
} from "@/lib/grille";
import { Info, Plane, Ship, Package, Receipt, Hash } from "lucide-react";

const NAVY = "#1A3A6B";
const ORANGE = "#E8520A";
const fontM = { fontFamily: "var(--font-montserrat)" };
const fontL = { fontFamily: "var(--font-lato)" };

function pct(x: number): string {
  return `${(x * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
}
function modeLabel(modes: Mode[]): string {
  if (modes.includes("AERIEN") && modes.includes("MARITIME")) return "Aérien + Maritime";
  return modes.includes("AERIEN") ? "Aérien" : "Maritime";
}

const th = "text-left text-[11px] font-black uppercase tracking-wider text-gray-500 px-3 py-2";
const td = "px-3 py-2 text-sm text-gray-700";

export default function TarificationView() {
  const stats = [
    { label: "Frais d'ouverture", value: formatPrice(FRAIS_OUVERTURE) },
    { label: "Commission débours", value: pct(COMMISSION_RATE) },
    { label: "TVA", value: pct(TVA_RATE) },
    { label: "CA (sur la TVA)", value: pct(CA_RATE) },
  ];

  return (
    <div className="p-5 lg:p-8">
      <div className="mb-6">
        <h1 className="text-xl lg:text-2xl font-black" style={{ color: NAVY, ...fontM }}>Tarification</h1>
        <p className="text-sm text-gray-400" style={fontL}>
          Grille EXPAC (Pointe-Noire). C&apos;est la source de tous les devis — public et backoffice.
        </p>
      </div>

      {/* Bandeau info */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-blue-50 border border-blue-100 mb-6">
        <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700 leading-relaxed" style={fontL}>
          Édition via interface <strong>à venir</strong> (nécessite l&apos;activation d&apos;une table dédiée). Les <strong>codes SH</strong> pour les droits de douane seront ajoutés ici dès réception du barème.
        </p>
      </div>

      {/* Constantes clés */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-[11px] font-black uppercase tracking-wider text-gray-400 mb-1" style={fontM}>{s.label}</p>
            <p className="text-lg font-black" style={{ color: NAVY, ...fontM }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Aérien — prestations */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Plane size={16} style={{ color: ORANGE }} />
            <h2 className="text-sm font-black uppercase tracking-wider text-gray-600" style={fontM}>Aérien — honoraires</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-gray-100"><th className={th}>Tranche de poids</th><th className={`${th} text-right`}>Forfait / dossier</th></tr></thead>
              <tbody>
                {AERIEN_BRACKETS.map((b) => (
                  <tr key={b.maxKg} className="border-b border-gray-50">
                    <td className={td} style={fontL}>{b.label}</td>
                    <td className={`${td} text-right font-semibold`}>{formatPrice(b.price)}</td>
                  </tr>
                ))}
                <tr>
                  <td className={td} style={fontL}>Au-delà de 2 000 kg</td>
                  <td className={`${td} text-right font-semibold`}>{formatPrice(AERIEN_OVER_2000_PER_KG)} / kg</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Maritime — prestations */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Ship size={16} style={{ color: ORANGE }} />
            <h2 className="text-sm font-black uppercase tracking-wider text-gray-600" style={fontM}>Maritime — honoraires</h2>
          </div>
          <div className="space-y-2.5">
            <div className="flex justify-between items-center p-3 rounded-xl bg-gray-50">
              <span className="text-sm text-gray-600" style={fontL}>Conteneur 40&apos;</span>
              <span className="text-sm font-black" style={{ color: NAVY }}>{formatPrice(MARITIME_TC_PRICE["40"])} / TC</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-xl bg-gray-50">
              <span className="text-sm text-gray-600" style={fontL}>Conteneur 20&apos;</span>
              <span className="text-sm font-black" style={{ color: NAVY }}>{formatPrice(MARITIME_TC_PRICE["20"])} / TC</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-xl bg-gray-50">
              <span className="text-sm text-gray-600" style={fontL}>Conventionnel</span>
              <span className="text-sm font-black" style={{ color: NAVY }}>{formatPrice(MARITIME_CONV_PER_TONNE)} / t</span>
            </div>
            <p className="text-[11px] text-gray-400 px-1" style={fontL}>
              Conventionnel : minimum {formatPrice(MARITIME_CONV_MIN)} / dossier. Manutention/dépotage {formatPrice(MANUTENTION_PER_TONNE)}/t (min {MANUTENTION_MIN_TONNES["40"]} T pour 40&apos;, {MANUTENTION_MIN_TONNES["20"]} T pour 20&apos;).
            </p>
          </div>
        </div>
      </div>

      {/* Débours fixes */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mt-5">
        <div className="flex items-center gap-2 mb-3">
          <Receipt size={16} style={{ color: ORANGE }} />
          <h2 className="text-sm font-black uppercase tracking-wider text-gray-600" style={fontM}>Débours fixes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-gray-100"><th className={th}>Poste</th><th className={`${th} text-right`}>Montant</th><th className={th}>Base</th><th className={th}>Portée</th></tr></thead>
            <tbody>
              {DEBOURS_FIXES.map((d) => (
                <tr key={d.code} className="border-b border-gray-50">
                  <td className={td} style={fontL}>{d.label}</td>
                  <td className={`${td} text-right font-semibold whitespace-nowrap`}>{d.percentValeurDouane ? pct(d.percentValeurDouane) : formatPrice(d.amount)}</td>
                  <td className={`${td} text-gray-400 text-xs whitespace-nowrap`}>{d.unit}</td>
                  <td className={`${td} text-gray-400 text-xs whitespace-nowrap`}>{modeLabel(d.modes)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Débours à l'identique */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mt-5">
        <div className="flex items-center gap-2 mb-2">
          <Package size={16} style={{ color: ORANGE }} />
          <h2 className="text-sm font-black uppercase tracking-wider text-gray-600" style={fontM}>Débours à l&apos;identique</h2>
        </div>
        <p className="text-xs text-gray-400 mb-3" style={fontL}>Avances refacturées au coût réel, saisies à la main sur chaque devis (dont les droits de douane).</p>
        <div className="flex flex-wrap gap-2">
          {DEBOURS_IDENTIQUE_SUGGESTIONS.map((s) => (
            <span key={s} className="px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-100 text-xs text-gray-600" style={fontL}>{s}</span>
          ))}
        </div>
      </div>

      {/* Codes SH — à venir */}
      <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-5 mt-5">
        <div className="flex items-center gap-2 mb-1">
          <Hash size={16} className="text-gray-400" />
          <h2 className="text-sm font-black uppercase tracking-wider text-gray-400" style={fontM}>Codes SH — droits de douane</h2>
        </div>
        <p className="text-xs text-gray-400" style={fontL}>
          À intégrer ici dès réception du barème. En attendant, les droits de douane se saisissent manuellement en débours à l&apos;identique.
        </p>
      </div>
    </div>
  );
}
