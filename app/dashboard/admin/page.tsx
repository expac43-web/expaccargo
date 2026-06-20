import { auth } from "@/lib/auth";
import {
  Package,
  Users,
  FileText,
  Handshake,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function fetchCount(table: string, filter?: string) {
  if (!SUPABASE_URL || !SERVICE_KEY) return 0;
  const query = filter ? `${table}?${filter}&select=id` : `${table}?select=id`;
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${query}`, {
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      Prefer: "count=exact",
      Range: "0-0",
    },
    next: { revalidate: 60 },
  });
  const range = r.headers.get("content-range");
  if (!range) return 0;
  const total = parseInt(range.split("/")[1] ?? "0", 10);
  return isNaN(total) ? 0 : total;
}

async function fetchRecentShipments() {
  if (!SUPABASE_URL || !SERVICE_KEY) return [];
  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/Shipment?select=id,reference,status,origin,destination,createdAt&order=createdAt.desc&limit=5`,
    {
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
      },
      next: { revalidate: 60 },
    }
  );
  if (!r.ok) return [];
  return r.json();
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  PENDING:          { label: "En attente",   color: "#6b7280" },
  PICKED_UP:        { label: "Collecté",     color: "#2563eb" },
  CUSTOMS_EXPORT:   { label: "Douane exp.",  color: "#7c3aed" },
  IN_TRANSIT:       { label: "En transit",   color: "#0891b2" },
  CUSTOMS_IMPORT:   { label: "Douane imp.",  color: "#7c3aed" },
  OUT_DELIVERY:     { label: "Livraison",    color: "#d97706" },
  DELIVERED:        { label: "Livré",        color: "#16a34a" },
  INCIDENT:         { label: "Incident",     color: "#dc2626" },
  CANCELLED:        { label: "Annulé",       color: "#9ca3af" },
};

export default async function AdminDashboardPage() {
  const session = await auth();
  const firstName = session?.user?.name?.split(" ")[0] ?? "Administrateur";

  const [
    totalShipments,
    pendingShipments,
    deliveredShipments,
    incidentShipments,
    totalClients,
    totalQuotes,
    totalPartners,
    recentShipments,
  ] = await Promise.all([
    fetchCount("Shipment"),
    fetchCount("Shipment", "status=eq.PENDING"),
    fetchCount("Shipment", "status=eq.DELIVERED"),
    fetchCount("Shipment", "status=eq.INCIDENT"),
    fetchCount("User", "role=eq.CLIENT"),
    fetchCount("QuoteRequest"),
    fetchCount("Partner", "isActive=eq.true"),
    fetchRecentShipments(),
  ]);

  const stats = [
    { label: "Expéditions totales", value: totalShipments, icon: Package, color: "#1A3A6B", bg: "rgba(26,58,107,0.08)" },
    { label: "En attente", value: pendingShipments, icon: Clock, color: "#d97706", bg: "rgba(217,119,6,0.08)" },
    { label: "Livrées", value: deliveredShipments, icon: CheckCircle2, color: "#16a34a", bg: "rgba(22,163,74,0.08)" },
    { label: "Incidents", value: incidentShipments, icon: AlertTriangle, color: "#dc2626", bg: "rgba(220,38,38,0.08)" },
    { label: "Clients", value: totalClients, icon: Users, color: "#7c3aed", bg: "rgba(124,58,237,0.08)" },
    { label: "Demandes de devis", value: totalQuotes, icon: FileText, color: "#0891b2", bg: "rgba(8,145,178,0.08)" },
    { label: "Partenaires actifs", value: totalPartners, icon: Handshake, color: "#E8520A", bg: "rgba(232,82,10,0.08)" },
    { label: "Croissance", value: "+", icon: TrendingUp, color: "#16a34a", bg: "rgba(22,163,74,0.08)" },
  ];

  return (
    <div className="flex-1 p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: "#E8520A", fontFamily: "var(--font-montserrat)" }}>
          ▪ Tableau de bord
        </p>
        <h1 className="text-2xl font-black" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
          Bonjour, {firstName} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1" style={{ fontFamily: "var(--font-lato)" }}>
          Voici un aperçu de l'activité EXPAC.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 mb-10">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: bg }}>
                <Icon size={18} style={{ color }} />
              </div>
            </div>
            <p className="text-2xl font-black" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
              {value}
            </p>
            <p className="text-xs text-gray-500 mt-0.5" style={{ fontFamily: "var(--font-lato)" }}>
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* Recent shipments */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="font-black uppercase text-sm" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
            Dernières expéditions
          </h2>
          <a
            href="/dashboard/admin/expeditions"
            className="text-xs font-black uppercase tracking-wide hover:opacity-70 transition-opacity"
            style={{ color: "#E8520A", fontFamily: "var(--font-montserrat)" }}
          >
            Voir tout →
          </a>
        </div>

        {recentShipments.length === 0 ? (
          <p className="px-6 py-10 text-sm text-gray-400 text-center" style={{ fontFamily: "var(--font-lato)" }}>
            Aucune expédition enregistrée.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-gray-100">
                  {["Référence", "Origine", "Destination", "Statut", "Date"].map((h) => (
                    <th key={h} className="px-6 py-3 text-xs font-black uppercase tracking-wider text-gray-400" style={{ fontFamily: "var(--font-montserrat)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentShipments.map((s: {
                  id: string;
                  reference: string;
                  status: string;
                  origin: string;
                  destination: string;
                  createdAt: string;
                }) => {
                  const m = STATUS_META[s.status] ?? STATUS_META.PENDING;
                  return (
                    <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3.5 font-black text-xs" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
                        {s.reference}
                      </td>
                      <td className="px-6 py-3.5 text-gray-600" style={{ fontFamily: "var(--font-lato)" }}>{s.origin}</td>
                      <td className="px-6 py-3.5 text-gray-600" style={{ fontFamily: "var(--font-lato)" }}>{s.destination}</td>
                      <td className="px-6 py-3.5">
                        <span
                          className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-black uppercase"
                          style={{ backgroundColor: `${m.color}15`, color: m.color, fontFamily: "var(--font-montserrat)" }}
                        >
                          {m.label}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-gray-400 text-xs" style={{ fontFamily: "var(--font-lato)" }}>
                        {new Date(s.createdAt).toLocaleDateString("fr-FR")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
