"use client";

import { useState, useEffect, useMemo } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import Modal from "@/components/admin/Modal";
import { FileText, Search, Trash2, ChevronDown, Package, MapPin, Weight, Phone, Mail, StickyNote, Download } from "lucide-react";
import { exportDevisPDF } from "@/lib/pdf";

type Quote = {
  id: string; name: string; email: string; phone: string;
  serviceType: string; origin: string; destination: string;
  cargoType: string; weight: number | null; volume: number | null;
  notes: string | null; status: string; createdAt: string;
};

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  NEW:       { label: "Nouveau",    color: "#2563eb", bg: "rgba(37,99,235,0.1)" },
  IN_REVIEW: { label: "En cours",   color: "#d97706", bg: "rgba(217,119,6,0.1)" },
  QUOTED:    { label: "Devis émis", color: "#7c3aed", bg: "rgba(124,58,237,0.1)" },
  ACCEPTED:  { label: "Accepté",    color: "#16a34a", bg: "rgba(22,163,74,0.1)" },
  REJECTED:  { label: "Refusé",     color: "#dc2626", bg: "rgba(220,38,38,0.1)" },
};

const SERVICE_LABELS: Record<string, string> = {
  TRANSIT: "Transit", MULTIMODAL: "Multimodal",
  STORAGE: "Stockage", MARITIME_CONSIGNMENT: "Consignation", GROUPAGE: "Groupage",
};

const NEXT_STATUS: Record<string, string[]> = {
  NEW:       ["IN_REVIEW", "REJECTED"],
  IN_REVIEW: ["QUOTED", "REJECTED"],
  QUOTED:    ["ACCEPTED", "REJECTED"],
  ACCEPTED:  [],
  REJECTED:  [],
};

export default function DevisPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [detail, setDetail] = useState<Quote | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/devis")
      .then(r => r.json())
      .then(setQuotes)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => quotes.filter(q => {
    const matchSearch = q.name.toLowerCase().includes(search.toLowerCase()) ||
      q.email.toLowerCase().includes(search.toLowerCase()) ||
      q.origin.toLowerCase().includes(search.toLowerCase()) ||
      q.destination.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || q.status === filterStatus;
    return matchSearch && matchStatus;
  }), [quotes, search, filterStatus]);

  async function updateStatus(id: string, status: string) {
    setSaving(true);
    const r = await fetch(`/api/admin/devis/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (r.ok) {
      setQuotes(prev => prev.map(q => q.id === id ? { ...q, status } : q));
      if (detail?.id === id) setDetail(d => d ? { ...d, status } : d);
    }
    setSaving(false);
  }

  async function deleteQuote() {
    if (!deleteId) return;
    setSaving(true);
    const r = await fetch(`/api/admin/devis/${deleteId}`, { method: "DELETE" });
    if (r.ok) {
      setQuotes(prev => prev.filter(q => q.id !== deleteId));
      if (detail?.id === deleteId) setDetail(null);
    }
    setDeleteId(null);
    setSaving(false);
  }

  const counts = Object.fromEntries(
    Object.keys(STATUS_META).map(s => [s, quotes.filter(q => q.status === s).length])
  );

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <AdminHeader
        title="Demandes de devis"
        subtitle={`${quotes.length} demande${quotes.length > 1 ? "s" : ""}`}
      />

      <div className="flex-1 overflow-y-auto p-6">
        {/* Status counters */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          {Object.entries(STATUS_META).map(([key, m]) => (
            <button
              key={key}
              onClick={() => setFilterStatus(filterStatus === key ? "all" : key)}
              className="rounded-2xl p-3 text-left border transition-all"
              style={{
                backgroundColor: filterStatus === key ? m.bg : "white",
                borderColor: filterStatus === key ? m.color : "#e5e7eb",
              }}
            >
              <p className="text-xl font-black" style={{ color: m.color, fontFamily: "var(--font-montserrat)" }}>{counts[key] ?? 0}</p>
              <p className="text-xs text-gray-500 mt-0.5" style={{ fontFamily: "var(--font-lato)" }}>{m.label}</p>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text" placeholder="Rechercher par nom, email, origine ou destination..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#1A3A6B] focus:ring-2 focus:ring-[#1A3A6B]/10 bg-white"
            style={{ fontFamily: "var(--font-lato)" }}
          />
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-20"><span className="w-8 h-8 border-2 border-gray-200 border-t-[#1A3A6B] rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <FileText size={36} className="mx-auto mb-3 text-gray-300" />
            <p className="text-gray-400 text-sm" style={{ fontFamily: "var(--font-lato)" }}>Aucune demande de devis.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {["Client", "Service", "Trajet", "Statut", "Date", "Actions"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-gray-400" style={{ fontFamily: "var(--font-montserrat)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((q) => {
                    const m = STATUS_META[q.status] ?? STATUS_META.NEW;
                    const next = NEXT_STATUS[q.status] ?? [];
                    return (
                      <tr key={q.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-black text-xs" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>{q.name}</p>
                          <p className="text-xs text-gray-400 truncate max-w-[140px]" style={{ fontFamily: "var(--font-lato)" }}>{q.email}</p>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600" style={{ fontFamily: "var(--font-lato)" }}>
                          {SERVICE_LABELS[q.serviceType] ?? q.serviceType}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs text-gray-600" style={{ fontFamily: "var(--font-lato)" }}>{q.origin}</p>
                          <p className="text-xs text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>→ {q.destination}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-black uppercase"
                            style={{ backgroundColor: m.bg, color: m.color, fontFamily: "var(--font-montserrat)" }}>
                            {m.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>
                          {new Date(q.createdAt).toLocaleDateString("fr-FR")}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setDetail(q)}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-black border border-gray-200 hover:bg-gray-50 text-gray-600"
                              style={{ fontFamily: "var(--font-montserrat)" }}
                            >
                              Détails
                            </button>
                            {next.length > 0 && (
                              <div className="relative group">
                                <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-black text-white hover:opacity-90"
                                  style={{ backgroundColor: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
                                  Avancer <ChevronDown size={11} />
                                </button>
                                <div className="absolute right-0 top-full mt-1 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden z-10 hidden group-hover:block min-w-[130px]">
                                  {next.map(s => {
                                    const sm = STATUS_META[s];
                                    return (
                                      <button
                                        key={s}
                                        onClick={() => updateStatus(q.id, s)}
                                        disabled={saving}
                                        className="flex items-center gap-2 w-full px-3 py-2 text-xs font-black hover:bg-gray-50 text-left"
                                        style={{ color: sm.color, fontFamily: "var(--font-montserrat)" }}
                                      >
                                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: sm.color }} />
                                        {sm.label}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                            <button onClick={() => setDeleteId(q.id)} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Detail modal */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title="Détail de la demande" width="max-w-xl">
        {detail && (() => {
          const m = STATUS_META[detail.status] ?? STATUS_META.NEW;
          const next = NEXT_STATUS[detail.status] ?? [];
          return (
            <div className="space-y-5">
              {/* Status */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-sm font-black uppercase"
                  style={{ backgroundColor: m.bg, color: m.color, fontFamily: "var(--font-montserrat)" }}>
                  {m.label}
                </span>
                {next.length > 0 && (
                  <div className="flex gap-2">
                    {next.map(s => {
                      const sm = STATUS_META[s];
                      return (
                        <button key={s} onClick={() => updateStatus(detail.id, s)} disabled={saving}
                          className="px-3 py-1.5 rounded-xl text-xs font-black border transition-all"
                          style={{ borderColor: sm.color, color: sm.color, fontFamily: "var(--font-montserrat)" }}>
                          → {sm.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Contact */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <p className="text-xs font-black uppercase tracking-wider text-gray-400 mb-3" style={{ fontFamily: "var(--font-montserrat)" }}>Contact</p>
                <p className="text-sm font-black" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>{detail.name}</p>
                <p className="text-xs text-gray-500 flex items-center gap-2" style={{ fontFamily: "var(--font-lato)" }}><Mail size={12} /> {detail.email}</p>
                <p className="text-xs text-gray-500 flex items-center gap-2" style={{ fontFamily: "var(--font-lato)" }}><Phone size={12} /> {detail.phone}</p>
              </div>

              {/* Shipment details */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Package, label: "Service", value: SERVICE_LABELS[detail.serviceType] ?? detail.serviceType },
                  { icon: MapPin, label: "Origine", value: detail.origin },
                  { icon: MapPin, label: "Destination", value: detail.destination },
                  { icon: Package, label: "Type de cargaison", value: detail.cargoType },
                  ...(detail.weight ? [{ icon: Weight, label: "Poids", value: `${detail.weight} kg` }] : []),
                  ...(detail.volume ? [{ icon: Weight, label: "Volume", value: `${detail.volume} m³` }] : []),
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs font-black uppercase tracking-wider text-gray-400 mb-1 flex items-center gap-1" style={{ fontFamily: "var(--font-montserrat)" }}>
                      <Icon size={11} /> {label}
                    </p>
                    <p className="text-sm text-gray-700" style={{ fontFamily: "var(--font-lato)" }}>{value}</p>
                  </div>
                ))}
              </div>

              {detail.notes && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-black uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1" style={{ fontFamily: "var(--font-montserrat)" }}>
                    <StickyNote size={11} /> Notes
                  </p>
                  <p className="text-sm text-gray-600" style={{ fontFamily: "var(--font-lato)" }}>{detail.notes}</p>
                </div>
              )}

              <div className="flex items-center justify-between gap-3 flex-wrap">
                <button
                  onClick={() => exportDevisPDF({
                    reference: detail.id.slice(0, 8).toUpperCase(),
                    name: detail.name,
                    email: detail.email,
                    phone: detail.phone,
                    serviceType: detail.serviceType,
                    origin: detail.origin,
                    destination: detail.destination,
                    cargoType: detail.cargoType,
                    weight: detail.weight,
                    volume: detail.volume,
                    notes: detail.notes,
                    status: m.label,
                    createdAt: detail.createdAt,
                  })}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-black uppercase text-white hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: "#E8520A", fontFamily: "var(--font-montserrat)" }}
                >
                  <Download size={13} /> Exporter en PDF
                </button>
                <p className="text-xs text-gray-400 text-right" style={{ fontFamily: "var(--font-lato)" }}>
                  Reçu le {new Date(detail.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Supprimer la demande">
        <p className="text-sm text-gray-600 mb-6" style={{ fontFamily: "var(--font-lato)" }}>Cette demande de devis sera définitivement supprimée.</p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteId(null)} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-black text-gray-500" style={{ fontFamily: "var(--font-montserrat)" }}>Annuler</button>
          <button onClick={deleteQuote} disabled={saving} className="flex-1 py-3 rounded-xl text-white text-sm font-black bg-red-500 hover:bg-red-600 disabled:opacity-60" style={{ fontFamily: "var(--font-montserrat)" }}>
            {saving ? "Suppression..." : "Supprimer"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
