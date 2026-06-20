"use client";

import { useState, useEffect } from "react";
import { Package, Search, Filter } from "lucide-react";
import Link from "next/link";
import Pagination from "@/components/admin/Pagination";

const PAGE_SIZE = 15;

type Shipment = {
  id: string; reference: string; status: string; origin: string;
  destination: string; cargoType: string | null; weight: number | null;
  createdAt: string; estimatedDelivery: string | null;
  client: { name: string; email: string };
};

const STATUSES = ["", "PENDING", "IN_TRANSIT", "AT_CUSTOMS", "DELIVERED", "DELAYED", "CANCELLED"];
const STATUS_LABELS: Record<string, string> = {
  "": "Tous", PENDING: "En attente", IN_TRANSIT: "En transit",
  AT_CUSTOMS: "En douane", DELIVERED: "Livré", DELAYED: "Retardé", CANCELLED: "Annulé",
};
const STATUS_COLORS: Record<string, string> = {
  PENDING: "#f59e0b", IN_TRANSIT: "#3b82f6", AT_CUSTOMS: "#8b5cf6",
  DELIVERED: "#10b981", DELAYED: "#ef4444", CANCELLED: "#6b7280",
};

export default function AgenceExpeditionsPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [filtered, setFiltered] = useState<Shipment[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let url = "/api/agence/expeditions";
    if (status) url += `?status=${status}`;
    fetch(url, { cache: "no-store" })
      .then((r) => r.ok ? r.json() : [])
      .then((data) => { setShipments(data); setFiltered(data); })
      .finally(() => setLoading(false));
  }, [status]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(q ? shipments.filter((s) =>
      s.reference.toLowerCase().includes(q) ||
      s.client.name.toLowerCase().includes(q) ||
      s.origin.toLowerCase().includes(q) ||
      s.destination.toLowerCase().includes(q)
    ) : shipments);
    setPage(1);
  }, [search, shipments]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      <div className="mb-6">
        <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: "#0e5f72", fontFamily: "var(--font-montserrat)" }}>▪ Agence</p>
        <h1 className="text-2xl font-black uppercase" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>Expéditions</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Référence, client, trajet…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#0e5f72] bg-white"
            style={{ fontFamily: "var(--font-lato)" }} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUSES.map((s) => (
            <button key={s} onClick={() => setStatus(s)}
              className="px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wide border-2 transition-all"
              style={{
                borderColor: status === s ? (s ? STATUS_COLORS[s] : "#0e5f72") : "#e5e7eb",
                color: status === s ? (s ? STATUS_COLORS[s] : "#0e5f72") : "#9ca3af",
                backgroundColor: status === s ? `${(s ? STATUS_COLORS[s] : "#0e5f72")}12` : "white",
                fontFamily: "var(--font-montserrat)",
              }}>
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["Référence", "Client", "Trajet", "Marchandise", "Statut", "Date"].map((h) => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-black uppercase tracking-wider text-gray-400" style={{ fontFamily: "var(--font-montserrat)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="px-5 py-4"><div className="h-3.5 bg-gray-100 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-16 text-center text-sm text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>Aucune expédition trouvée.</td></tr>
              ) : (
                paged.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <span className="font-black text-xs" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>{s.reference}</span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-800 text-xs" style={{ fontFamily: "var(--font-lato)" }}>{s.client.name}</p>
                      <p className="text-gray-400 text-xs">{s.client.email}</p>
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-600" style={{ fontFamily: "var(--font-lato)" }}>
                      {s.origin} → {s.destination}
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-500" style={{ fontFamily: "var(--font-lato)" }}>
                      {s.cargoType ?? "—"}{s.weight ? ` · ${s.weight}kg` : ""}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-black" style={{ backgroundColor: `${STATUS_COLORS[s.status] ?? "#6b7280"}18`, color: STATUS_COLORS[s.status] ?? "#6b7280", fontFamily: "var(--font-montserrat)" }}>
                        {STATUS_LABELS[s.status] ?? s.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>
                      {new Date(s.createdAt).toLocaleDateString("fr-FR")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!loading && <Pagination page={page} total={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} />}
    </div>
  );
}
