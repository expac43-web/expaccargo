"use client";

import { useState, useEffect, useMemo } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import Modal from "@/components/admin/Modal";
import Link from "next/link";
import {
  Users, Search, Download, Trash2, UserCheck, UserX,
  Mail, Phone, AlertCircle, Eye,
} from "lucide-react";

type Client = {
  id: string; name: string; email: string; phone: string | null;
  whatsapp: string | null; isActive: boolean; createdAt: string;
};

function exportCsv(clients: Client[]) {
  const header = ["Nom", "Email", "Téléphone", "WhatsApp", "Statut", "Inscrit le"];
  const rows = clients.map(c => [
    c.name, c.email, c.phone ?? "", c.whatsapp ?? "",
    c.isActive ? "Actif" : "Désactivé",
    new Date(c.createdAt).toLocaleDateString("fr-FR"),
  ]);
  const csv = [header, ...rows].map(r => r.map(v => `"${v}"`).join(";")).join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `clients-expac-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click(); URL.revokeObjectURL(url);
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/clients")
      .then(r => r.json())
      .then(setClients)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => clients.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || (filter === "active" ? c.isActive : !c.isActive);
    return matchSearch && matchFilter;
  }), [clients, search, filter]);

  async function deleteClient() {
    if (!deleteId) return;
    setDeleting(true); setError("");
    try {
      const r = await fetch(`/api/admin/clients/${deleteId}`, { method: "DELETE" });
      if (r.ok) { setClients(p => p.filter(c => c.id !== deleteId)); setDeleteId(null); }
      else { const d = await r.json(); setError(d.error ?? "Erreur"); }
    } finally { setDeleting(false); }
  }

  async function toggleActive(c: Client) {
    const r = await fetch(`/api/admin/clients/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !c.isActive }),
    });
    if (r.ok) setClients(p => p.map(x => x.id === c.id ? { ...x, isActive: !c.isActive } : x));
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <AdminHeader
        title="Clients"
        subtitle={`${clients.length} compte${clients.length > 1 ? "s" : ""} client`}
        action={
          <button
            onClick={() => exportCsv(filtered)}
            disabled={filtered.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black transition-all hover:opacity-90 disabled:opacity-40"
            style={{ backgroundColor: "rgba(26,58,107,0.08)", color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}
          >
            <Download size={15} /> Exporter CSV
          </button>
        }
      />

      <div className="flex-1 p-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text" placeholder="Rechercher par nom ou email..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#1A3A6B] focus:ring-2 focus:ring-[#1A3A6B]/10 bg-white"
              style={{ fontFamily: "var(--font-lato)" }}
            />
          </div>
          <div className="flex gap-2">
            {(["all", "active", "inactive"] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="px-4 py-2.5 rounded-xl text-xs font-black uppercase transition-all"
                style={{
                  fontFamily: "var(--font-montserrat)",
                  backgroundColor: filter === f ? "#1A3A6B" : "white",
                  color: filter === f ? "white" : "#6b7280",
                  border: `1px solid ${filter === f ? "#1A3A6B" : "#e5e7eb"}`,
                }}
              >
                {f === "all" ? "Tous" : f === "active" ? "Actifs" : "Désactivés"}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-20"><span className="w-8 h-8 border-2 border-gray-200 border-t-[#1A3A6B] rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Users size={36} className="mx-auto mb-3 text-gray-300" />
            <p className="text-gray-400 text-sm" style={{ fontFamily: "var(--font-lato)" }}>Aucun client trouvé.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {["Client", "Email", "Téléphone", "Statut", "Inscrit le", "Actions"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-gray-400" style={{ fontFamily: "var(--font-montserrat)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-black shrink-0" style={{ backgroundColor: "#1A3A6B" }}>
                            {c.name.charAt(0).toUpperCase()}
                          </div>
                          <p className="font-black text-xs" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>{c.name}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs" style={{ fontFamily: "var(--font-lato)" }}>
                        <a href={`mailto:${c.email}`} className="flex items-center gap-1 hover:text-[#1A3A6B]"><Mail size={11} />{c.email}</a>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs" style={{ fontFamily: "var(--font-lato)" }}>
                        {c.phone ? <span className="flex items-center gap-1"><Phone size={11} />{c.phone}</span> : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-black uppercase"
                          style={{
                            backgroundColor: c.isActive ? "rgba(22,163,74,0.1)" : "rgba(220,38,38,0.1)",
                            color: c.isActive ? "#16a34a" : "#dc2626",
                            fontFamily: "var(--font-montserrat)",
                          }}>
                          {c.isActive ? <><UserCheck size={11} /> Actif</> : <><UserX size={11} /> Désactivé</>}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs" style={{ fontFamily: "var(--font-lato)" }}>
                        {new Date(c.createdAt).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Link
                            href={`/dashboard/admin/clients/${c.id}`}
                            title="Voir la fiche"
                            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:bg-gray-100 text-gray-400 hover:text-[#1A3A6B]"
                          >
                            <Eye size={13} />
                          </Link>
                          <button
                            onClick={() => toggleActive(c)}
                            title={c.isActive ? "Désactiver" : "Activer"}
                            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:bg-gray-100 text-gray-400"
                          >
                            {c.isActive ? <UserX size={13} /> : <UserCheck size={13} />}
                          </button>
                          <button
                            onClick={() => setDeleteId(c.id)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:bg-red-50 text-gray-400 hover:text-red-500"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>
              {filtered.length} résultat{filtered.length > 1 ? "s" : ""}
            </div>
          </div>
        )}
      </div>

      {/* Delete confirm */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Supprimer le compte">
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100 mb-4">
            <AlertCircle size={14} className="text-red-500" />
            <p className="text-xs text-red-600" style={{ fontFamily: "var(--font-lato)" }}>{error}</p>
          </div>
        )}
        <p className="text-sm text-gray-600 mb-6" style={{ fontFamily: "var(--font-lato)" }}>
          Ce compte client sera définitivement supprimé. Toutes ses données associées seront perdues.
        </p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteId(null)} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-black text-gray-500" style={{ fontFamily: "var(--font-montserrat)" }}>Annuler</button>
          <button onClick={deleteClient} disabled={deleting} className="flex-1 py-3 rounded-xl text-white text-sm font-black bg-red-500 hover:bg-red-600 disabled:opacity-60" style={{ fontFamily: "var(--font-montserrat)" }}>
            {deleting ? "Suppression..." : "Supprimer"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
