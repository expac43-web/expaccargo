"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Package, MapPin, Calendar, Search,
  CheckCircle2, Loader2,
  ArrowRight, ChevronRight, MessageSquare, FolderOpen, Eye,
} from "lucide-react";
import { useT } from "@/components/i18n/LanguageProvider";

// ── Constants ──────────────────────────────────────────────────────
// Couleur + fond par statut ; le libellé vient du dictionnaire (t.shipmentStatus).
const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  PENDING:        { color: "#6b7280", bg: "rgba(107,114,128,0.1)" },
  PICKED_UP:      { color: "#2563eb", bg: "rgba(37,99,235,0.1)" },
  CUSTOMS_EXPORT: { color: "#7c3aed", bg: "rgba(124,58,237,0.1)" },
  IN_TRANSIT:     { color: "#0891b2", bg: "rgba(8,145,178,0.1)" },
  CUSTOMS_IMPORT: { color: "#7c3aed", bg: "rgba(124,58,237,0.1)" },
  OUT_DELIVERY:   { color: "#d97706", bg: "rgba(217,119,6,0.1)" },
  DELIVERED:      { color: "#16a34a", bg: "rgba(22,163,74,0.1)" },
  INCIDENT:       { color: "#dc2626", bg: "rgba(220,38,38,0.1)" },
  CANCELLED:      { color: "#9ca3af", bg: "rgba(156,163,175,0.1)" },
};

const STATUS_ORDER = [
  "PENDING","PICKED_UP","CUSTOMS_EXPORT","IN_TRANSIT",
  "CUSTOMS_IMPORT","OUT_DELIVERY","DELIVERED",
];

type Shipment = {
  id: string; reference: string; trackingNumber: string | null;
  status: string; serviceType: string;
  origin: string; destination: string;
  weight: number | null; volume: number | null;
  eta: string | null; deliveredAt: string | null; createdAt: string;
};

// ── Small components ───────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const { t } = useT();
  const m = STATUS_STYLE[status] ?? STATUS_STYLE.PENDING;
  const label = (t.shipmentStatus as Record<string, string>)[status] ?? status;
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black"
      style={{ backgroundColor: m.bg, color: m.color, fontFamily: "var(--font-montserrat)" }}
    >
      {status === "IN_TRANSIT" || status === "OUT_DELIVERY" || status === "PICKED_UP" ? (
        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: m.color }} />
      ) : null}
      {label}
    </span>
  );
}

function ProgressBar({ status }: { status: string }) {
  if (["CANCELLED", "INCIDENT"].includes(status)) return null;
  const idx = STATUS_ORDER.indexOf(status);
  const pct = idx < 0 ? 0 : Math.round(((idx + 1) / STATUS_ORDER.length) * 100);
  return (
    <div className="flex items-center gap-2 mt-3">
      <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: status === "DELIVERED"
              ? "#16a34a"
              : "linear-gradient(90deg, #1A3A6B, #2563eb)",
          }}
        />
      </div>
      <span
        className="text-xs font-black w-8 text-right"
        style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}
      >
        {pct}%
      </span>
    </div>
  );
}

function QuickAction({
  icon: Icon, label, href, color, description,
}: { icon: React.ElementType; label: string; href: string; color: string; description: string }) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all"
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform"
        style={{ backgroundColor: `${color}15` }}
      >
        <Icon size={20} style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-black text-sm" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>{label}</p>
        <p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: "var(--font-lato)" }}>{description}</p>
      </div>
      <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500 transition-colors shrink-0" />
    </Link>
  );
}

// ── Main ───────────────────────────────────────────────────────────
export default function ClientDashboardPage() {
  const { data: session, status } = useSession();
  const { t, locale } = useT();
  const dh = t.dashboard.home;
  const dl = locale === "en" ? "en-US" : "fr-FR";
  const router = useRouter();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const role = (session?.user as { role?: string })?.role;
  const firstName = session?.user?.name?.split(" ")[0] ?? "";

  // Les comptes non-clients ne doivent pas voir le tableau de bord client :
  // on les renvoie vers leur propre espace (corrige aussi le 401 sur /api/client/*).
  useEffect(() => {
    if (status !== "authenticated") return;
    if (role === "SUPER_ADMIN") router.replace("/dashboard/admin");
    else if (role === "MANAGER") router.replace("/dashboard/gerant");
    else if (role === "AGENCY") router.replace("/dashboard/agence");
  }, [status, role, router]);

  useEffect(() => {
    // N'appeler l'API client que pour un vrai client (sinon 401).
    if (status !== "authenticated") return;
    if (role !== "CLIENT") { setLoading(false); return; }
    fetch("/api/client/shipments")
      .then((r) => r.json())
      .then((d) => setShipments(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, [status, role]);

  const filtered = search.trim()
    ? shipments.filter(
        (s) =>
          s.reference.toLowerCase().includes(search.toLowerCase()) ||
          s.origin.toLowerCase().includes(search.toLowerCase()) ||
          s.destination.toLowerCase().includes(search.toLowerCase())
      )
    : shipments;

  const active = shipments.filter((s) =>
    ["PICKED_UP", "CUSTOMS_EXPORT", "IN_TRANSIT", "CUSTOMS_IMPORT", "OUT_DELIVERY"].includes(s.status)
  );
  const delivered = shipments.filter((s) => s.status === "DELIVERED");
  const incidents = shipments.filter((s) => s.status === "INCIDENT");

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return dh.greetMorning;
    if (h < 18) return dh.greetAfternoon;
    return dh.greetEvening;
  };

  const shipmentWord = (n: number) => (n > 1 ? dh.shipmentMany : dh.shipmentOne);
  const serviceLabel = (code: string) => (t.serviceTypes as Record<string, string>)[code] ?? code;

  // Pendant la redirection d'un compte non-client, ne pas afficher le dashboard client.
  if (status === "authenticated" && role && role !== "CLIENT") {
    return (
      <div className="flex-1 flex items-center justify-center py-32">
        <Loader2 size={28} className="animate-spin" style={{ color: "#1A3A6B" }} />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      {/* Hero header */}
      <div
        className="relative px-6 lg:px-8 pt-8 pb-12 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0e2248 0%, #1A3A6B 100%)" }}
      >
        {/* Decorative circles */}
        <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full opacity-10" style={{ backgroundColor: "#E8520A" }} />
        <div className="absolute right-20 bottom-0 w-28 h-28 rounded-full opacity-5" style={{ backgroundColor: "#fff" }} />

        <div className="relative z-10">
          <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: "#fba563", fontFamily: "var(--font-montserrat)" }}>
            ▪ {dh.eyebrow}
          </p>
          <h1 className="text-2xl lg:text-3xl font-black text-white mb-1" style={{ fontFamily: "var(--font-montserrat)" }}>
            {getGreeting()}, {firstName} 👋
          </h1>
          <p className="text-blue-200 text-sm" style={{ fontFamily: "var(--font-lato)" }}>
            {shipments.length === 0
              ? dh.subNone
              : active.length > 0
              ? `${active.length} ${shipmentWord(active.length)} ${dh.subActiveSuffix}`
              : dh.subAllDone}
          </p>
        </div>

        {/* Stats row */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          {[
            { label: dh.statTotal, value: shipments.length, color: "#fff", sub: dh.shipmentMany },
            { label: dh.statActive, value: active.length, color: "#60a5fa", sub: dh.statActiveSub },
            { label: dh.statDelivered, value: delivered.length, color: "#4ade80", sub: dh.shipmentMany },
            { label: dh.statIncidents, value: incidents.length, color: "#f87171", sub: dh.statIncidentsSub },
          ].map(({ label, value, color, sub }) => (
            <div key={label} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
              <p className="text-2xl font-black" style={{ color, fontFamily: "var(--font-montserrat)" }}>
                {value}
              </p>
              <p className="text-xs text-white font-black mt-0.5" style={{ fontFamily: "var(--font-montserrat)" }}>{label}</p>
              <p className="text-xs text-white/40" style={{ fontFamily: "var(--font-lato)" }}>{sub}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-6 lg:px-8 py-6 space-y-6">
        {/* Quick actions */}
        <div>
          <h2 className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: "#9ca3af", fontFamily: "var(--font-montserrat)" }}>
            {dh.quickAccess}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <QuickAction icon={FolderOpen} label={dh.qaDocs} href="/dashboard/documents" color="#7c3aed" description={dh.qaDocsDesc} />
            <QuickAction icon={MessageSquare} label={dh.qaMessages} href="/dashboard/messages" color="#0891b2" description={dh.qaMessagesDesc} />
            <QuickAction icon={Package} label={dh.qaTracking} href="/tracking" color="#E8520A" description={dh.qaTrackingDesc} />
          </div>
        </div>

        {/* Shipments section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-black uppercase tracking-widest" style={{ color: "#9ca3af", fontFamily: "var(--font-montserrat)" }}>
              {t.dashboard.navShipments}
            </h2>
            <span className="text-xs text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>
              {filtered.length} {filtered.length !== 1 ? dh.resultMany : dh.resultOne}
            </span>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={dh.searchPlaceholder}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#1A3A6B] focus:ring-2 focus:ring-[#1A3A6B]/10 bg-white shadow-sm"
              style={{ fontFamily: "var(--font-lato)" }}
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 size={28} className="animate-spin" style={{ color: "#1A3A6B" }} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: "linear-gradient(135deg, rgba(26,58,107,0.08), rgba(26,58,107,0.04))" }}
              >
                <Package size={28} style={{ color: "#1A3A6B" }} />
              </div>
              <p className="font-black uppercase text-sm mb-2" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
                {search ? dh.emptyNoResult : dh.emptyNoShipments}
              </p>
              <p className="text-xs text-gray-400 max-w-xs" style={{ fontFamily: "var(--font-lato)" }}>
                {search ? dh.emptyHintSearch : dh.emptyHintNone}
              </p>
              {!search && (
                <Link
                  href="/dashboard/messages"
                  className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase text-white transition-opacity hover:opacity-80"
                  style={{ backgroundColor: "#E8520A", fontFamily: "var(--font-montserrat)" }}
                >
                  <MessageSquare size={13} />
                  {dh.contactAgency}
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((s) => (
                <div
                  key={s.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-gray-200 transition-all group"
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span
                          className="font-black text-sm"
                          style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}
                        >
                          {s.reference}
                        </span>
                        <StatusBadge status={s.status} />
                      </div>

                      {/* Route */}
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500" style={{ fontFamily: "var(--font-lato)" }}>
                          <MapPin size={11} className="text-gray-400 shrink-0" />
                          <span className="font-medium">{s.origin}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-4 h-px bg-gray-200" />
                          <ArrowRight size={10} className="text-gray-300" />
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500" style={{ fontFamily: "var(--font-lato)" }}>
                          <MapPin size={11} className="text-gray-400 shrink-0" />
                          <span className="font-medium">{s.destination}</span>
                        </div>
                      </div>

                      {/* Meta */}
                      <div className="flex flex-wrap gap-3 text-xs text-gray-400 mt-1" style={{ fontFamily: "var(--font-lato)" }}>
                        <span>{serviceLabel(s.serviceType)}</span>
                        {s.weight && <span>· {s.weight} kg</span>}
                        {s.volume && <span>· {s.volume} m³</span>}
                        {s.eta && (
                          <span className="flex items-center gap-1">
                            · <Calendar size={10} />
                            {dh.eta} {new Date(s.eta).toLocaleDateString(dl, { day: "numeric", month: "short" })}
                          </span>
                        )}
                        {s.deliveredAt && (
                          <span className="flex items-center gap-1 text-green-600 font-medium">
                            · <CheckCircle2 size={10} />
                            {dh.deliveredOn} {new Date(s.deliveredAt).toLocaleDateString(dl)}
                          </span>
                        )}
                      </div>

                      <ProgressBar status={s.status} />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        href={`/dashboard/expeditions/${s.id}`}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black uppercase transition-all hover:opacity-80"
                        style={{
                          backgroundColor: "rgba(26,58,107,0.08)",
                          color: "#1A3A6B",
                          fontFamily: "var(--font-montserrat)",
                        }}
                        title={dh.details}
                      >
                        <Eye size={12} />
                        <span className="hidden sm:inline">{dh.details}</span>
                      </Link>
                      <Link
                        href={`/dashboard/messages?ref=${s.reference}`}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black uppercase transition-all hover:opacity-80"
                        style={{
                          backgroundColor: "rgba(8,145,178,0.08)",
                          color: "#0891b2",
                          fontFamily: "var(--font-montserrat)",
                        }}
                        title={dh.message}
                      >
                        <MessageSquare size={12} />
                        <span className="hidden sm:inline">{dh.message}</span>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
