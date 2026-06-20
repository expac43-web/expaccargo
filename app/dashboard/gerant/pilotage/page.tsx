"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Gauge, Building2, Package, MessageSquare, AlertTriangle,
  Clock, Loader2, Users, ArrowRight,
} from "lucide-react";

type AgencyRow = {
  id: string; name: string; city: string; agents: number;
  shipmentsTotal: number; shipmentsActive: number; conversations: number; unanswered: number;
};
type Unanswered = {
  conversationId: string; clientName: string; agencyName: string;
  lastMessage: string; lastAt: string; waitHours: number; overSla: boolean;
};
type Overview = {
  slaHours: number;
  totals: { agencies: number; shipmentsActive: number; unanswered: number; overSla: number };
  perAgency: AgencyRow[];
  unanswered: Unanswered[];
};

export default function GerantPilotagePage() {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/gerant/overview")
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center py-32"><Loader2 size={28} className="animate-spin" style={{ color: "#1A3A6B" }} /></div>;
  }
  if (!data) {
    return <div className="p-8 text-center text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>Impossible de charger le pilotage.</div>;
  }

  const cards = [
    { label: "Agences", value: data.totals.agencies, icon: Building2, color: "#1A3A6B" },
    { label: "Expéditions actives", value: data.totals.shipmentsActive, icon: Package, color: "#0891b2" },
    { label: "Conv. en attente", value: data.totals.unanswered, icon: MessageSquare, color: "#d97706" },
    { label: `Hors SLA (> ${data.slaHours}h)`, value: data.totals.overSla, icon: AlertTriangle, color: "#dc2626" },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-6xl">
      <div className="mb-6">
        <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: "#E8520A", fontFamily: "var(--font-montserrat)" }}>▪ Gérant</p>
        <h1 className="text-2xl font-black uppercase flex items-center gap-2" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
          <Gauge size={24} /> Pilotage
        </h1>
        <p className="text-sm text-gray-500 mt-1" style={{ fontFamily: "var(--font-lato)" }}>
          Vue d'ensemble des agences et des conversations en attente de réponse.
        </p>
      </div>

      {/* Cartes synthèse */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: `${color}15` }}>
              <Icon size={17} style={{ color }} />
            </div>
            <p className="text-2xl font-black" style={{ color, fontFamily: "var(--font-montserrat)" }}>{value}</p>
            <p className="text-xs text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Par agence */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-8">
        <div className="px-5 py-3 border-b border-gray-100">
          <h2 className="font-black uppercase text-xs tracking-wider" style={{ color: "#9ca3af", fontFamily: "var(--font-montserrat)" }}>Par agence</h2>
        </div>
        {data.perAgency.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>Aucune agence.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {["Agence", "Agents", "Expéditions", "Actives", "Conversations", "En attente"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-black uppercase tracking-wider text-gray-400" style={{ fontFamily: "var(--font-montserrat)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.perAgency.map((a) => (
                  <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-black text-xs" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>{a.name}</p>
                      <p className="text-xs text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>{a.city}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600"><span className="inline-flex items-center gap-1"><Users size={12} className="text-gray-300" />{a.agents}</span></td>
                    <td className="px-4 py-3 text-gray-600">{a.shipmentsTotal}</td>
                    <td className="px-4 py-3"><span className="font-black" style={{ color: "#0891b2" }}>{a.shipmentsActive}</span></td>
                    <td className="px-4 py-3 text-gray-600">{a.conversations}</td>
                    <td className="px-4 py-3">
                      {a.unanswered > 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-black" style={{ backgroundColor: "rgba(217,119,6,0.12)", color: "#d97706", fontFamily: "var(--font-montserrat)" }}>{a.unanswered}</span>
                      ) : <span className="text-xs text-gray-300">0</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Conversations en attente */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-black uppercase text-xs tracking-wider flex items-center gap-2" style={{ color: "#9ca3af", fontFamily: "var(--font-montserrat)" }}>
            <Clock size={13} /> Conversations en attente de réponse
          </h2>
          <span className="text-xs text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>{data.unanswered.length}</span>
        </div>
        {data.unanswered.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>Aucune conversation en attente. 🎉</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {data.unanswered.map((u) => (
              <Link
                key={u.conversationId}
                href={`/dashboard/gerant/messages?conv=${u.conversationId}`}
                className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors"
              >
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: u.overSla ? "#dc2626" : "#d97706" }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-black text-xs" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>{u.clientName}</p>
                    <span className="text-xs text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>· {u.agencyName}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate italic" style={{ fontFamily: "var(--font-lato)" }}>{u.lastMessage}</p>
                </div>
                <span
                  className="text-xs font-black shrink-0 px-2 py-0.5 rounded-lg"
                  style={{
                    backgroundColor: u.overSla ? "rgba(220,38,38,0.1)" : "rgba(217,119,6,0.1)",
                    color: u.overSla ? "#dc2626" : "#d97706",
                    fontFamily: "var(--font-montserrat)",
                  }}
                >
                  {u.waitHours < 1 ? "< 1h" : `${u.waitHours}h`}
                </span>
                <ArrowRight size={14} className="text-gray-300 shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
