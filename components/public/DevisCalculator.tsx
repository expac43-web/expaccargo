"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Calculator, FileDown, ArrowRight, AlertTriangle, Package } from "lucide-react";
import { estimateTariff, chargeableWeight, volumetricWeight, formatPrice, type Tariff } from "@/lib/tariffs";
import { exportEstimatePDF } from "@/lib/pdf";
import { useT } from "@/components/i18n/LanguageProvider";

export default function DevisCalculator({ tariffs }: { tariffs: Tariff[] }) {
  const { t: tr } = useT();
  const c = tr.calculator;
  const svc = (code: string) => (tr.serviceTypes as Record<string, string>)[code] ?? code;

  const [tariffId, setTariffId] = useState("");
  const [weight, setWeight] = useState("");
  const [volume, setVolume] = useState("");

  const tariff = useMemo(() => tariffs.find((tf) => tf.id === tariffId) ?? null, [tariffs, tariffId]);
  const w = parseFloat(weight) || 0;
  const v = parseFloat(volume) || 0;

  const result = useMemo(() => {
    if (!tariff) return null;
    const volWeight = volumetricWeight(v, tariff.volumetricFactor);
    const chargeable = chargeableWeight(w, v, tariff.volumetricFactor);
    const weightCost = chargeable * tariff.pricePerKg;
    const total = estimateTariff(tariff, w, v);
    return { volWeight, chargeable, weightCost, total };
  }, [tariff, w, v]);

  function downloadPdf() {
    if (!tariff || !result) return;
    exportEstimatePDF({
      serviceLabel: svc(tariff.serviceType),
      origin: tariff.origin,
      destination: tariff.destination,
      weight: w,
      volume: v,
      volumetricFactor: tariff.volumetricFactor,
      volumetricWeight: result.volWeight,
      chargeableWeight: result.chargeable,
      baseFee: tariff.baseFee,
      pricePerKg: tariff.pricePerKg,
      weightCost: result.weightCost,
      total: result.total,
      currency: tariff.currency,
      note: tariff.note,
    });
  }

  if (tariffs.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
        <Calculator size={32} className="mx-auto mb-3 text-gray-300" />
        <p className="text-gray-500 mb-4" style={{ fontFamily: "var(--font-lato)" }}>
          {c.soon}
        </p>
        <Link href="/devis" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-black uppercase hover:opacity-90" style={{ backgroundColor: "#E8520A", fontFamily: "var(--font-montserrat)" }}>
          {c.requestQuote} <ArrowRight size={14} />
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Formulaire */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 card-lift">
        <div className="flex items-center gap-2 mb-5">
          <Calculator size={18} style={{ color: "#E8520A" }} />
          <h2 className="font-black uppercase text-sm" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>{c.paramsTitle}</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-black uppercase tracking-wider mb-1.5 text-gray-600" style={{ fontFamily: "var(--font-montserrat)" }}>{c.routeLabel} *</label>
            <select value={tariffId} onChange={(e) => setTariffId(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#1A3A6B] bg-white" style={{ fontFamily: "var(--font-lato)" }}>
              <option value="">{c.chooseRoute}</option>
              {tariffs.map((tf) => (
                <option key={tf.id} value={tf.id}>
                  {svc(tf.serviceType)} · {tf.origin} → {tf.destination}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider mb-1.5 text-gray-600" style={{ fontFamily: "var(--font-montserrat)" }}>{c.weightLabel}</label>
              <input type="number" min="0" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="0" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#1A3A6B] bg-white" style={{ fontFamily: "var(--font-lato)" }} />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-wider mb-1.5 text-gray-600" style={{ fontFamily: "var(--font-montserrat)" }}>{c.volumeLabel}</label>
              <input type="number" min="0" step="0.01" value={volume} onChange={(e) => setVolume(e.target.value)} placeholder="0" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#1A3A6B] bg-white" style={{ fontFamily: "var(--font-lato)" }} />
            </div>
          </div>
        </div>
      </div>

      {/* Résultat */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col">
        <div className="flex items-center gap-2 mb-5">
          <Package size={18} style={{ color: "#1A3A6B" }} />
          <h2 className="font-black uppercase text-sm" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>{c.estimateTitle}</h2>
        </div>

        {!result ? (
          <div className="flex-1 flex items-center justify-center text-center py-10">
            <p className="text-sm text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>{c.emptyHint}</p>
          </div>
        ) : (
          <>
            <div className="space-y-2 text-sm mb-4" style={{ fontFamily: "var(--font-lato)" }}>
              <div className="flex justify-between"><span className="text-gray-500">{c.realWeight}</span><span className="text-gray-700">{w || 0} kg</span></div>
              <div className="flex justify-between"><span className="text-gray-500">{c.volWeight} ({v || 0} m³ × {tariff!.volumetricFactor})</span><span className="text-gray-700">{Math.round(result.volWeight)} kg</span></div>
              <div className="flex justify-between font-black" style={{ color: "#1A3A6B" }}><span>{c.chargeable}</span><span>{Math.round(result.chargeable)} kg</span></div>
              <div className="border-t border-gray-100 pt-2 flex justify-between"><span className="text-gray-500">{c.baseFee}</span><span className="text-gray-700">{formatPrice(tariff!.baseFee, tariff!.currency)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">{Math.round(result.chargeable)} kg × {formatPrice(tariff!.pricePerKg, tariff!.currency)}</span><span className="text-gray-700">{formatPrice(result.weightCost, tariff!.currency)}</span></div>
            </div>

            <div className="rounded-xl p-4 mb-4" style={{ background: "linear-gradient(135deg,#0e2248,#1A3A6B)" }}>
              <p className="text-xs uppercase tracking-wider text-blue-200" style={{ fontFamily: "var(--font-montserrat)" }}>{c.totalEstimate}</p>
              <p className="text-3xl font-black text-white" style={{ fontFamily: "var(--font-montserrat)" }}>{formatPrice(result.total, tariff!.currency)}</p>
            </div>

            <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-100 mb-4">
              <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700" style={{ fontFamily: "var(--font-lato)" }}>
                <strong>{c.approxStrong}</strong>{c.approxRest}
              </p>
            </div>

            <div className="flex gap-2 mt-auto">
              <button onClick={downloadPdf} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 text-xs font-black uppercase text-gray-600 hover:bg-gray-50 transition-colors" style={{ fontFamily: "var(--font-montserrat)" }}>
                <FileDown size={14} /> {c.pdf}
              </button>
              <Link href="/devis" className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-xs font-black uppercase hover:opacity-90 transition-opacity" style={{ backgroundColor: "#E8520A", fontFamily: "var(--font-montserrat)" }}>
                {c.firmQuote} <ArrowRight size={13} />
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
