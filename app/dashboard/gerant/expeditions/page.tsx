"use client";

import { useState, useEffect, useCallback } from "react";
import { Package, Search, ChevronDown, Check } from "lucide-react";
import Pagination from "@/components/admin/Pagination";

const PAGE_SIZE = 15;

type Shipment = {
  id: string; reference: string; status: string; origin: string;
  destination: string; cargoType: string | null; weight: number | null;
  createdAt: string; estimatedDelivery: string | null; trackingNumber: string | null;
  client: { name: string; email: string };
};

const ALL_STATUSES = [
  { value: "", label: "Tous" },
  { value: "PENDING", label: "En attente" },
  { value: "PICKED_UP", label: "Collecté" },
  { value: "IN_TRANSIT", label: "En transit" },
  { value: "AT_CUSTOMS", label: "En douane" },
  { value: "OUT_DELIVERY", label: "En livraison" },
  { value: "DELIVERED", label: "Livré" },
  { value: "DELAYED", label: "Retardé" },
  { value: "INCIDENT", label: "Incident" },
  { value: "CANCELLED", label: "Annulé" },
];
const STATUS_COLORS: Record<string, string> = {
  PENDING: "#f59e0b", PICKED_UP: "#2563eb", IN_TRANSIT: "#3b82f6",
  AT_CUSTOMS: "#8b5cf6", OUT_DELIVERY: "#d97706", DELIVERED: "#10b981",
  DELAYED: "#ef4444", INCIDENT: "#dc2626", CANCELLED: "#6b7280",
};

function StatusDropdown({ shipmentId, current, onChanged }: { shipmentId: string; current: string; onChanged: (s: string) => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  async function change(val: string) {
    if (val === current) { setOpen(false); return; }
    setSaving(true);
    setOpen(false);
    await fetch(`/api/gerant/expeditions/${shipmentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: val }),
    });
    setSaving(false);
    onChanged(val);
  }

  const label = ALL_STATUSES.find((s) => s.value === current)?.label ?? current;
  const color = STATUS_COLORS[current] ?? "#6b7280";

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} disabled={saving}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black transition-all hover:opacity-80 disabled:opacity-50"
        style={{ backgroundColor: `${color}18`, color, fontFamily: "var(--font-montserrat)" }}>
        {saving ? <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" /> : null}
        {label}
        <ChevronDown size={11} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 bg-white rounded-xl border border-gray-100 shadow-lg py-1 min-w-[160px]">
            {ALL_STATUSES.filter((s) => s.value).map((s) => (
              <button key={s.value} onClick={() => change(s.value)}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-50 transition-colors"
                style={{ fontFamily: "var(--font-lato)" }}>
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: STATUS_COLORS[s.value] ?? "#6b7280" }} />
                <span className="flex-1 text-left text-gray-700">{s.label}</span>
                {s.value === current && <Check size={12} className="text-green-500" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function GerantExpeditionsPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [filtered, setFiltered] = useState<Shipment[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  // Lire clientId depuis URL
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const cid = p.get("clientId");
    if (cid) {
      fetch(`/api/gerant/expeditions?clientId=${cid}`)
        .then((r) => r.ok ? r.json() : [])
        .then((d) => { setShipments(d); setFiltered(d); })
        .finally(() => setLoading(false));
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    let url = "/api/gerant/expeditions";
    if (status) url += `?status=${status}`;
    const r = await fetch(url);
    const data = r.ok ? await r.json() : [];
    setShipments(data); setFiltered(data);
    setLoading(false);
  }, [status]);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (!p.get("clientId")) load();
  }, [load]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(q ? shipments.filter((s) =>
      s.reference.toLowerCase().includes(q) ||
      s.client.name.toLowerCase().includes(q) ||
      s.origin.toLowerCase().includes(q) ||
      s.destination.toLowerCase().includes(q)
    ) : shipments);
  }, [search, shipments]);

  function handleStatusChange(id: string, newStatus: string) {
    setShipments((prev) => prev.map((s) => s.id === id ? { ...s, status: newStatus } : s));
  }

  useEffect(() => { setPage(1); }, [search, status]);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      <div className="mb-6">
        <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: "#E8520A", fontFamily: "var(--font-montserrat)" }}>▪ Gérant</p>
        <h1 className="text-2xl font-black uppercase" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>Expéditions</h1>
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Référence, client, trajet…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#1A3A6B] bg-white"
            style={{ fontFamily: "var(--font-lato)" }} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {ALL_STATUSES.slice(0, 6).map((s) => (
            <button key={s.value} onClick={() => setStatus(s.value)}
              className="px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wide border-2 transition-all"
              style={{
                borderColor: status === s.value ? (s.value ? STATUS_COLORS[s.value] : "#1A3A6B") : "#e5e7eb",
                color: status === s.value ? (s.value ? STATUS_COLORS[s.value] : "#1A3A6B") : "#9ca3af",
                backgroundColor: status === s.value ? `${(s.value ? STATUS_COLORS[s.value] : "#1A3A6B")}12` : "white",
                fontFamily: "var(--font-montserrat)",
              }}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["Référence", "Client", "Trajet", "Marchandise", "Statut", "Date"].map((h) => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-black uppercase tracking-wider text-gray-400"
                    style={{ fontFamily: "var(--font-montserrat)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>{[...Array(6)].map((_, j) => (
                    <td key={j} className="px-5 py-4"><div className="h-3.5 bg-gray-100 rounded animate-pulse" /></td>
                  ))}</tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-16 text-center text-sm text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>
                  Aucune expédition trouvée.
                </td></tr>
              ) : paged.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <span className="font-black text-xs" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>{s.reference}</span>
                    {s.trackingNumber && (
                      <p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: "var(--font-lato)" }}>#{s.trackingNumber}</p>
                    )}
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
                    <StatusDropdown shipmentId={s.id} current={s.status} onChanged={(ns) => handleStatusChange(s.id, ns)} />
                  </td>
                  <td className="px-5 py-4 text-xs text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>
                    {new Date(s.createdAt).toLocaleDateString("fr-FR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {!loading && <Pagination page={page} total={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} />}
    </div>
  );
}
