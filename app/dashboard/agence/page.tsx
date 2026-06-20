"use client";

import { useState, useEffect } from "react";
import { Users, Package, MessageSquare, FolderOpen, ArrowRight, TrendingUp, Clock, CheckCircle2 } from "lucide-react";
import Link from "next/link";

type Stats = { clients: number; activeShipments: number; totalShipments: number; unreadMessages: number; documents: number };

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#f59e0b", IN_TRANSIT: "#3b82f6", DELIVERED: "#10b981",
  DELAYED: "#ef4444", AT_CUSTOMS: "#8b5cf6", CANCELLED: "#6b7280",
};
const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente", IN_TRANSIT: "En transit", DELIVERED: "Livré",
  DELAYED: "Retardé", AT_CUSTOMS: "En douane", CANCELLED: "Annulé",
};

export default function AgenceDashboardPage() {
  const [stats, setStats] = useState<Stats>({ clients: 0, activeShipments: 0, totalShipments: 0, unreadMessages: 0, documents: 0 });
  const [recentShipments, setRecentShipments] = useState<{ id: string; reference: string; status: string; client: { name: string }; createdAt: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [clientsRes, shipmentsRes, messagesRes, docsRes] = await Promise.all([
          fetch("/api/agence/clients"),
          fetch("/api/agence/expeditions"),
          fetch("/api/agence/messages", { method: "HEAD" }),
          fetch("/api/agence/documents"),
        ]);
        const clients = clientsRes.ok ? await clientsRes.json() : [];
        const shipments = shipmentsRes.ok ? await shipmentsRes.json() : [];
        const unread = parseInt(messagesRes.headers.get("X-Unread-Count") ?? "0", 10);
        const docs = docsRes.ok ? await docsRes.json() : [];

        setStats({
          clients: clients.length,
          totalShipments: shipments.length,
          activeShipments: shipments.filter((s: { status: string }) => !["DELIVERED", "CANCELLED"].includes(s.status)).length,
          unreadMessages: isNaN(unread) ? 0 : unread,
          documents: docs.length,
        });
        setRecentShipments(shipments.slice(0, 5));
      } catch { /* ignore */ }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const statCards = [
    { label: "Clients", value: stats.clients, icon: Users, color: "#0e5f72", href: "/dashboard/agence/clients" },
    { label: "Expéditions actives", value: stats.activeShipments, icon: Package, color: "#1A3A6B", href: "/dashboard/agence/expeditions" },
    { label: "Messages non lus", value: stats.unreadMessages, icon: MessageSquare, color: "#E8520A", href: "/dashboard/agence/messages" },
    { label: "Documents", value: stats.documents, icon: FolderOpen, color: "#0d7a8f", href: "/dashboard/agence/documents" },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: "#0e5f72", fontFamily: "var(--font-montserrat)" }}>▪ Tableau de bord</p>
        <h1 className="text-2xl font-black uppercase" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>Vue d&apos;ensemble</h1>
        <p className="text-sm text-gray-500 mt-1" style={{ fontFamily: "var(--font-lato)" }}>
          Gérez vos clients, documents et messages depuis votre espace agence.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.label} href={card.href}
              className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${card.color}18` }}>
                  <Icon size={20} style={{ color: card.color }} />
                </div>
                <ArrowRight size={14} className="text-gray-300 group-hover:text-gray-400 transition-colors" />
              </div>
              <div className="text-2xl font-black mb-1" style={{ color: card.color, fontFamily: "var(--font-montserrat)" }}>
                {loading ? <span className="inline-block w-8 h-6 bg-gray-100 rounded animate-pulse" /> : card.value}
              </div>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide" style={{ fontFamily: "var(--font-montserrat)" }}>{card.label}</p>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Expéditions récentes */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-black uppercase" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>Expéditions récentes</h2>
            <Link href="/dashboard/agence/expeditions" className="text-xs font-black uppercase tracking-wide hover:opacity-70" style={{ color: "#0e5f72", fontFamily: "var(--font-montserrat)" }}>
              Voir tout →
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="px-6 py-4 flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-100 rounded w-32 animate-pulse" />
                    <div className="h-3 bg-gray-100 rounded w-20 animate-pulse" />
                  </div>
                </div>
              ))
            ) : recentShipments.length === 0 ? (
              <div className="px-6 py-10 text-center text-sm text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>
                Aucune expédition pour le moment.
              </div>
            ) : (
              recentShipments.map((s) => (
                <div key={s.id} className="px-6 py-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${STATUS_COLORS[s.status] ?? "#6b7280"}18` }}>
                    <Package size={18} style={{ color: STATUS_COLORS[s.status] ?? "#6b7280" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black truncate" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>{s.reference}</p>
                    <p className="text-xs text-gray-400 truncate" style={{ fontFamily: "var(--font-lato)" }}>{s.client?.name}</p>
                  </div>
                  <span className="text-xs font-black px-2.5 py-1 rounded-full shrink-0" style={{ backgroundColor: `${STATUS_COLORS[s.status] ?? "#6b7280"}18`, color: STATUS_COLORS[s.status] ?? "#6b7280", fontFamily: "var(--font-montserrat)" }}>
                    {STATUS_LABELS[s.status] ?? s.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Actions rapides */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h2 className="text-sm font-black uppercase mb-4" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>Actions rapides</h2>
            <div className="space-y-2">
              {[
                { label: "Voir les clients", href: "/dashboard/agence/clients", icon: Users, color: "#0e5f72" },
                { label: "Envoyer un message", href: "/dashboard/agence/messages", icon: MessageSquare, color: "#E8520A" },
                { label: "Ajouter un document", href: "/dashboard/agence/documents", icon: FolderOpen, color: "#0d7a8f" },
              ].map(({ label, href, icon: Icon, color }) => (
                <Link key={href} href={href}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all group">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
                    <Icon size={16} style={{ color }} />
                  </div>
                  <span className="text-sm font-semibold flex-1" style={{ color: "#374151", fontFamily: "var(--font-lato)" }}>{label}</span>
                  <ArrowRight size={13} className="text-gray-300 group-hover:text-gray-400" />
                </Link>
              ))}
            </div>
          </div>

          {/* Légende statuts */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h2 className="text-sm font-black uppercase mb-3" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>Statuts</h2>
            <div className="space-y-2">
              {Object.entries(STATUS_LABELS).map(([key, label]) => (
                <div key={key} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: STATUS_COLORS[key] }} />
                  <span className="text-xs text-gray-500" style={{ fontFamily: "var(--font-lato)" }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
