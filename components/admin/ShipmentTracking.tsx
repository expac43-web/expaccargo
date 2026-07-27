"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Loader2, Satellite } from "lucide-react";
import { CARRIERS, carrierByScac } from "@/lib/terminal49";

const NAVY = "#1A3A6B";
const fontM = { fontFamily: "var(--font-montserrat)" };
const fontL = { fontFamily: "var(--font-lato)" };
const inputCls = "w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#1A3A6B] bg-white";

const STATUS_META: Record<string, { label: string; color: string }> = {
  none: { label: "Non suivi", color: "#9ca3af" },
  pending: { label: "Enregistré (Terminal49)", color: "#2563eb" },
  active: { label: "Suivi actif", color: "#16a34a" },
  failed: { label: "Échec", color: "#dc2626" },
};

export default function ShipmentTracking({ shipmentId }: { shipmentId: string }) {
  const [bl, setBl] = useState("");
  const [scac, setScac] = useState("");
  const [container, setContainer] = useState("");
  const [status, setStatus] = useState("none");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    fetch(`/api/admin/shipments/${shipmentId}/tracking`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) {
          setBl(d.blNumber || "");
          setScac(d.carrierScac || "");
          setContainer(d.containerNumber || "");
          setStatus(d.trackingStatus || "none");
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [shipmentId]);

  const carrier = carrierByScac(scac);

  async function save(activate: boolean) {
    setSaving(true);
    setMsg(null);
    try {
      const r = await fetch(`/api/admin/shipments/${shipmentId}/tracking`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blNumber: bl, carrierScac: scac, containerNumber: container, activate }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Erreur");
      if (d.trackingStatus) setStatus(d.trackingStatus);
      setMsg({ type: "ok", text: activate ? "Suivi enregistré chez Terminal49." : "Informations enregistrées." });
    } catch (e) {
      setMsg({ type: "err", text: e instanceof Error ? e.message : "Erreur" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="mb-5 p-4 rounded-xl bg-gray-50 flex justify-center"><Loader2 size={16} className="animate-spin text-gray-400" /></div>;
  }

  const st = STATUS_META[status] ?? STATUS_META.none;

  return (
    <div className="mb-5 p-4 rounded-xl border border-gray-100" style={{ backgroundColor: "rgba(232,82,10,0.03)" }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5" style={{ color: NAVY, ...fontM }}>
          <Satellite size={13} /> Suivi automatique
        </span>
        <span className="text-[11px] font-black px-2 py-0.5 rounded" style={{ color: st.color, backgroundColor: `${st.color}18` }}>{st.label}</span>
      </div>

      <div className="space-y-2">
        <div>
          <label className="text-[11px] text-gray-500" style={fontL}>N° de BL / booking</label>
          <input value={bl} onChange={(e) => setBl(e.target.value)} placeholder="Ex : MAEU123456789" className={inputCls} style={fontL} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] text-gray-500" style={fontL}>Compagnie</label>
            <select value={scac} onChange={(e) => setScac(e.target.value)} className={inputCls} style={fontL}>
              <option value="">—</option>
              {CARRIERS.map((c) => <option key={c.scac} value={c.scac}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] text-gray-500" style={fontL}>N° conteneur</label>
            <input value={container} onChange={(e) => setContainer(e.target.value)} placeholder="Facultatif" className={inputCls} style={fontL} />
          </div>
        </div>
      </div>

      {msg && <p className="text-[11px] mt-2" style={{ color: msg.type === "ok" ? "#16a34a" : "#dc2626", ...fontL }}>{msg.text}</p>}
      {carrier && !carrier.t49 && (
        <p className="text-[11px] text-amber-600 mt-2" style={fontL}>{carrier.name} n&apos;est pas couvert par le suivi auto — utilisez le lien ci-dessous.</p>
      )}

      <div className="flex items-center gap-2 mt-3 flex-wrap">
        <button onClick={() => save(false)} disabled={saving} className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-black uppercase text-gray-600 hover:bg-gray-50 disabled:opacity-50" style={fontM}>
          Enregistrer
        </button>
        {carrier?.t49 && (
          <button onClick={() => save(true)} disabled={saving || !bl.trim()} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-white text-xs font-black uppercase hover:opacity-90 disabled:opacity-50" style={{ backgroundColor: NAVY, ...fontM }}>
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Satellite size={12} />} Activer le suivi
          </button>
        )}
        {carrier && (
          <a href={carrier.trackUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-3 py-2 rounded-xl border border-gray-200 text-xs font-black uppercase text-gray-500 hover:bg-gray-50" style={fontM}>
            <ExternalLink size={12} /> Suivre chez {carrier.name}
          </a>
        )}
      </div>

      <p className="text-[10px] text-gray-400 mt-2" style={fontL}>
        En forfait gratuit, « Activer » enregistre le conteneur chez Terminal49 (consultable sur leur tableau de bord). Les mises à jour automatiques ici nécessitent le plan payant (webhooks).
      </p>
    </div>
  );
}
