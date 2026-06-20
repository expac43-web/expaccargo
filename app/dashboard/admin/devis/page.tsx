"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import AdminHeader from "@/components/admin/AdminHeader";
import Modal from "@/components/admin/Modal";
import Pagination from "@/components/admin/Pagination";
import { DevisQuote } from "@/components/admin/DevisProcessPanel";
import { FileText, Trash2, ShieldCheck } from "lucide-react";

const PAGE_SIZE = 15;

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

export default function DevisPage() {
  const [quotes, setQuotes] = useState<DevisQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetch("/api/admin/devis", { cache: "no-store" })
      .then(r => r.json())
      .then(setQuotes)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () => quotes.filter(q => filterStatus === "all" || q.status === filterStatus),
    [quotes, filterStatus]
  );

  // Revenir en page 1 quand le filtre change.
  useEffect(() => { setPage(1); }, [filterStatus]);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function deleteQuote() {
    if (!deleteId) return;
    setSaving(true);
    const r = await fetch(`/api/admin/devis/${deleteId}`, { method: "DELETE" });
    if (r.ok) {
      setQuotes(prev => prev.filter(q => q.id !== deleteId));
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
                  {paged.map((q) => {
                    const m = STATUS_META[q.status] ?? STATUS_META.NEW;
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
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-black uppercase"
                              style={{ backgroundColor: m.bg, color: m.color, fontFamily: "var(--font-montserrat)" }}>
                              {m.label}
                            </span>
                            {q.signature && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-black uppercase"
                                style={{ backgroundColor: "rgba(22,163,74,0.12)", color: "#16a34a", fontFamily: "var(--font-montserrat)" }}>
                                <ShieldCheck size={10} /> Signé
                              </span>
                            )}
                          </div>
                          {q.handledByName && (
                            <p className="text-[10px] text-gray-400 mt-1 truncate max-w-[120px]" style={{ fontFamily: "var(--font-lato)" }}>par {q.handledByName}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>
                          {new Date(q.createdAt).toLocaleDateString("fr-FR")}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <Link
                              href={`/dashboard/admin/devis/${q.id}`}
                              className="px-3 py-1.5 rounded-lg text-xs font-black text-white hover:opacity-90"
                              style={{ backgroundColor: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}
                            >
                              Traiter
                            </Link>
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

        <Pagination page={page} total={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} />
      </div>

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
