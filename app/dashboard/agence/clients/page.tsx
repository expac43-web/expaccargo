"use client";

import { useState, useEffect } from "react";
import { Users, Search, Package, MessageSquare, FolderOpen, Eye, Phone, Mail } from "lucide-react";
import Link from "next/link";
import Pagination from "@/components/admin/Pagination";

const PAGE_SIZE = 15; // 5 lignes × 3 colonnes

type Client = {
  id: string; name: string; email: string; phone: string | null;
  whatsapp: string | null; isActive: boolean; createdAt: string;
  shipmentCount: number; activeShipments: number;
};

export default function AgenceClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [filtered, setFiltered] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetch("/api/agence/clients")
      .then((r) => r.ok ? r.json() : [])
      .then((data) => { setClients(data); setFiltered(data); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(q ? clients.filter((c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)) : clients);
    setPage(1);
  }, [search, clients]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      <div className="mb-6">
        <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: "#0e5f72", fontFamily: "var(--font-montserrat)" }}>▪ Agence</p>
        <h1 className="text-2xl font-black uppercase" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>Clients</h1>
        <p className="text-sm text-gray-500 mt-1" style={{ fontFamily: "var(--font-lato)" }}>
          {clients.length} compte{clients.length !== 1 ? "s" : ""} client
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-sm mb-6">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un client…"
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#0e5f72] focus:ring-2 focus:ring-[#0e5f72]/10 bg-white transition-all"
          style={{ fontFamily: "var(--font-lato)" }}
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-40 bg-white rounded-2xl border border-gray-100 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Users size={40} className="mx-auto text-gray-200 mb-4" />
          <p className="text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>Aucun client trouvé.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {paged.map((client) => {
            const initials = client.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
            return (
              <div key={client.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden">
                {/* Card header */}
                <div className="p-5 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-sm shrink-0" style={{ background: "linear-gradient(135deg, #0c3d4a, #0e5f72)" }}>
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-black text-sm truncate" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>{client.name}</p>
                    <p className="text-xs text-gray-400 truncate" style={{ fontFamily: "var(--font-lato)" }}>{client.email}</p>
                    <span className={`inline-block mt-1.5 text-xs font-black px-2 py-0.5 rounded-full ${client.isActive ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-400"}`} style={{ fontFamily: "var(--font-montserrat)" }}>
                      {client.isActive ? "Actif" : "Inactif"}
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 divide-x divide-gray-100 border-t border-gray-100">
                  <div className="p-3 text-center">
                    <p className="text-lg font-black" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>{client.shipmentCount}</p>
                    <p className="text-xs text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>Expéditions</p>
                  </div>
                  <div className="p-3 text-center">
                    <p className="text-lg font-black" style={{ color: "#0e5f72", fontFamily: "var(--font-montserrat)" }}>{client.activeShipments}</p>
                    <p className="text-xs text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>En cours</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="px-4 pb-4 flex gap-2 pt-3">
                  <Link href={`/dashboard/agence/clients/${client.id}`}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-black uppercase tracking-wide transition-all hover:opacity-90"
                    style={{ backgroundColor: "#0e5f72", color: "#fff", fontFamily: "var(--font-montserrat)" }}>
                    <Eye size={13} /> Voir
                  </Link>
                  <Link href={`/dashboard/agence/messages?clientId=${client.id}`}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wide border-2 transition-all hover:bg-gray-50"
                    style={{ borderColor: "#e5e7eb", color: "#6b7280", fontFamily: "var(--font-montserrat)" }}>
                    <MessageSquare size={13} />
                  </Link>
                  <Link href={`/dashboard/agence/documents?clientId=${client.id}`}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wide border-2 transition-all hover:bg-gray-50"
                    style={{ borderColor: "#e5e7eb", color: "#6b7280", fontFamily: "var(--font-montserrat)" }}>
                    <FolderOpen size={13} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && <Pagination page={page} total={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} />}
    </div>
  );
}
