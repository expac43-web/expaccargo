"use client";

import { useState, useEffect } from "react";
import { Users, Package, MessageSquare, FolderOpen, TrendingUp, ArrowRight, Clock } from "lucide-react";
import Link from "next/link";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente", IN_TRANSIT: "En transit", AT_CUSTOMS: "En douane",
  DELIVERED: "Livré", DELAYED: "Retardé", CANCELLED: "Annulé",
  PICKED_UP: "Collecté", CUSTOMS_EXPORT: "Douane export", CUSTOMS_IMPORT: "Douane import",
  OUT_DELIVERY: "En livraison", INCIDENT: "Incident",
};
const STATUS_COLORS: Record<string, string> = {
  PENDING: "#f59e0b", IN_TRANSIT: "#3b82f6", AT_CUSTOMS: "#8b5cf6",
  DELIVERED: "#10b981", DELAYED: "#ef4444", CANCELLED: "#6b7280",
  PICKED_UP: "#2563eb", CUSTOMS_EXPORT: "#7c3aed", CUSTOMS_IMPORT: "#7c3aed",
  OUT_DELIVERY: "#d97706", INCIDENT: "#dc2626",
};

type Stats = {
  totalClients: number; totalShipments: number; activeShipments: number;
  deliveredShipments: number; unreadMessages: number; recentDocuments: number;
  recentShipments: { id: string; reference: string; status: string; origin: string; destination: string; clientName: string; createdAt: string }[];
};

export default function GerantDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/gerant/stats").then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setStats(d); })
      .finally(() => setLoading(false));
  }, []);

  const statCards = [
    { label: "Clients", value: stats?.totalClients ?? 0, icon: Users, color: "#1A3A6B", href: "/dashboard/gerant/clients" },
    { label: "En cours", value: stats?.activeShipments ?? 0, icon: Package, color: "#3b82f6", href: "/dashboard/gerant/expeditions" },
    { label: "Livrées", value: stats?.deliveredShipments ?? 0, icon: TrendingUp, color: "#10b981", href: "/dashboard/gerant/expeditions" },
    { label: "Messages non lus", value: stats?.unreadMessages ?? 0, icon: MessageSquare, color: "#E8520A", href: "/dashboard/gerant/messages" },
  ];

  return (
    <div className="flex-1 overflow-auto">
      {/* Header */}
      <div className="relative px-6 lg:px-8 pt-8 pb-10 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0e2248 0%, #1A3A6B 100%)" }}>
        <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full opacity-10" style={{ backgroundColor: "#E8520A" }} />
        <div className="relative z-10">
          <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: "#fba563", fontFamily: "var(--font-montserrat)" }}>
            ▪ Espace gérant
          </p>
          <h1 className="text-2xl lg:text-3xl font-black text-white mb-1" style={{ fontFamily: "var(--font-montserrat)" }}>
            Tableau de bord
          </h1>
          <p className="text-blue-200 text-sm" style={{ fontFamily: "var(--font-lato)" }}>
            Vue d'ensemble de l'activité
          </p>
        </div>

        {/* Stats */}
        <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
          {statCards.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <Icon size={15} style={{ color }} />
                <p className="text-xs text-white/60 font-semibold" style={{ fontFamily: "var(--font-lato)" }}>{label}</p>
              </div>
              {loading ? (
                <div className="h-7 w-12 bg-white/10 rounded animate-pulse" />
              ) : (
                <p className="text-2xl font-black text-white" style={{ fontFamily: "var(--font-montserrat)" }}>{value}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="px-6 lg:px-8 py-6 space-y-6">
        {/* Accès rapide */}
        <div>
          <h2 className="text-xs font-black uppercase tracking-widest mb-3 text-gray-400" style={{ fontFamily: "var(--font-montserrat)" }}>
            Accès rapide
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {statCards.map(({ label, icon: Icon, color, href }) => (
              <Link key={label} href={href}
                className="group flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform"
                  style={{ backgroundColor: `${color}15` }}>
                  <Icon size={18} style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-xs truncate" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>{label}</p>
                </div>
                <ArrowRight size={14} className="text-gray-300 group-hover:text-gray-500 transition-colors shrink-0" />
              </Link>
            ))}
          </div>
        </div>

        {/* Expéditions récentes */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-black uppercase tracking-widest text-gray-400" style={{ fontFamily: "var(--font-montserrat)" }}>
              Dernières expéditions
            </h2>
            <Link href="/dashboard/gerant/expeditions"
              className="text-xs font-black text-[#E8520A] hover:underline" style={{ fontFamily: "var(--font-montserrat)" }}>
              Voir tout →
            </Link>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-white rounded-xl border border-gray-100 animate-pulse" />)}
            </div>
          ) : !stats?.recentShipments.length ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
              <Package size={32} className="mx-auto text-gray-200 mb-2" />
              <p className="text-gray-400 text-sm" style={{ fontFamily: "var(--font-lato)" }}>Aucune expédition.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="divide-y divide-gray-50">
                {stats.recentShipments.map((s) => (
                  <div key={s.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${STATUS_COLORS[s.status] ?? "#6b7280"}15` }}>
                      <Package size={14} style={{ color: STATUS_COLORS[s.status] ?? "#6b7280" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>{s.reference}</p>
                      <p className="text-xs text-gray-400 truncate" style={{ fontFamily: "var(--font-lato)" }}>
                        {s.clientName} · {s.origin} → {s.destination}
                      </p>
                    </div>
                    <span className="text-xs font-black px-2.5 py-1 rounded-full shrink-0"
                      style={{ backgroundColor: `${STATUS_COLORS[s.status] ?? "#6b7280"}15`, color: STATUS_COLORS[s.status] ?? "#6b7280", fontFamily: "var(--font-montserrat)" }}>
                      {STATUS_LABELS[s.status] ?? s.status}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-gray-400 shrink-0" style={{ fontFamily: "var(--font-lato)" }}>
                      <Clock size={10} />
                      {new Date(s.createdAt).toLocaleDateString("fr-FR")}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Documents récents */}
        {!!stats?.recentDocuments && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(124,58,237,0.1)" }}>
                <FolderOpen size={18} style={{ color: "#7c3aed" }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-black" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
                  {stats.recentDocuments} nouveau{stats.recentDocuments > 1 ? "x" : ""} document{stats.recentDocuments > 1 ? "s" : ""}
                </p>
                <p className="text-xs text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>Ces 7 derniers jours</p>
              </div>
              <Link href="/dashboard/gerant/documents"
                className="text-xs font-black text-[#7c3aed] hover:underline" style={{ fontFamily: "var(--font-montserrat)" }}>
                Voir →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
