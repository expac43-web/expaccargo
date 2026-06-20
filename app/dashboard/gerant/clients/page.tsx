"use client";

import { useState, useEffect } from "react";
import { Users, Search, MessageSquare, FolderOpen, Package, Eye } from "lucide-react";
import Link from "next/link";
import Pagination from "@/components/admin/Pagination";

const PAGE_SIZE = 15; // 5 lignes × 3 colonnes

type Client = {
  id: string; name: string; email: string; phone: string | null;
  isActive: boolean; shipmentCount: number; activeShipments: number; createdAt: string;
};

export default function GerantClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetch("/api/gerant/clients").then((r) => r.ok ? r.json() : [])
      .then(setClients).finally(() => setLoading(false));
  }, []);

  const filtered = search
    ? clients.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase())
      )
    : clients;

  useEffect(() => { setPage(1); }, [search]);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      <div className="mb-6">
        <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: "#E8520A", fontFamily: "var(--font-montserrat)" }}>▪ Gérant</p>
        <h1 className="text-2xl font-black uppercase" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>Clients</h1>
      </div>

      <div className="relative max-w-sm mb-6">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un client…"
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#1A3A6B] bg-white"
          style={{ fontFamily: "var(--font-lato)" }} />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-36 bg-white rounded-2xl border border-gray-100 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Users size={40} className="mx-auto text-gray-200 mb-4" />
          <p className="text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>Aucun client trouvé.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {paged.map((c) => {
            const initials = c.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
            return (
              <div key={c.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-sm font-black shrink-0"
                    style={{ background: "linear-gradient(135deg,#0e2248,#1A3A6B)" }}>
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-sm truncate" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>{c.name}</p>
                    <p className="text-xs text-gray-400 truncate" style={{ fontFamily: "var(--font-lato)" }}>{c.email}</p>
                    {c.phone && <p className="text-xs text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>{c.phone}</p>}
                  </div>
                </div>

                <div className="flex gap-3 mb-4">
                  <div className="flex-1 bg-gray-50 rounded-xl p-2.5 text-center">
                    <p className="text-lg font-black" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>{c.shipmentCount}</p>
                    <p className="text-xs text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>Expéditions</p>
                  </div>
                  <div className="flex-1 bg-gray-50 rounded-xl p-2.5 text-center">
                    <p className="text-lg font-black" style={{ color: "#3b82f6", fontFamily: "var(--font-montserrat)" }}>{c.activeShipments}</p>
                    <p className="text-xs text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>En cours</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link href={`/dashboard/gerant/clients/${c.id}`}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wide transition-all hover:opacity-90"
                    style={{ backgroundColor: "#1A3A6B", color: "#fff", fontFamily: "var(--font-montserrat)" }}>
                    <Eye size={12} /> Voir
                  </Link>
                  <Link href={`/dashboard/gerant/expeditions?clientId=${c.id}`}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all hover:opacity-80"
                    style={{ backgroundColor: "rgba(26,58,107,0.08)", color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
                    <Package size={12} />
                  </Link>
                  <Link href={`/dashboard/gerant/messages?clientId=${c.id}`}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all hover:opacity-80"
                    style={{ backgroundColor: "rgba(232,82,10,0.08)", color: "#E8520A", fontFamily: "var(--font-montserrat)" }}>
                    <MessageSquare size={12} />
                  </Link>
                  <Link href={`/dashboard/gerant/documents?clientId=${c.id}`}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all hover:opacity-80"
                    style={{ backgroundColor: "rgba(124,58,237,0.08)", color: "#7c3aed", fontFamily: "var(--font-montserrat)" }}>
                    <FolderOpen size={12} />
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
