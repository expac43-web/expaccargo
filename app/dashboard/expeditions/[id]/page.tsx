"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, MapPin, Calendar, Package, Weight,
  Layers, CheckCircle2, Clock, AlertTriangle, XCircle,
  FileText, Download, Eye, ExternalLink, Loader2, MessageSquare,
  FileDown,
} from "lucide-react";
import { exportExpeditionPDF } from "@/lib/pdf";
import FileViewButton from "@/components/files/FileViewButton";
import { useT } from "@/components/i18n/LanguageProvider";

// Couleur + icône par statut ; libellé via t.shipmentStatus.
const STATUS_STYLE: Record<string, { color: string; icon: React.ElementType }> = {
  PENDING:        { color: "#6b7280", icon: Clock },
  PICKED_UP:      { color: "#2563eb", icon: Package },
  CUSTOMS_EXPORT: { color: "#7c3aed", icon: Layers },
  IN_TRANSIT:     { color: "#0891b2", icon: MapPin },
  CUSTOMS_IMPORT: { color: "#7c3aed", icon: Layers },
  OUT_DELIVERY:   { color: "#d97706", icon: Package },
  DELIVERED:      { color: "#16a34a", icon: CheckCircle2 },
  INCIDENT:       { color: "#dc2626", icon: AlertTriangle },
  CANCELLED:      { color: "#9ca3af", icon: XCircle },
};

const STATUS_ORDER = [
  "PENDING","PICKED_UP","CUSTOMS_EXPORT","IN_TRANSIT",
  "CUSTOMS_IMPORT","OUT_DELIVERY","DELIVERED",
];

type Shipment = {
  id: string; reference: string; trackingNumber: string | null;
  status: string; serviceType: string; origin: string; destination: string;
  weight: number | null; volume: number | null; description: string | null;
  eta: string | null; deliveredAt: string | null; createdAt: string;
  milestones: Milestone[]; documents: ShipDoc[];
};

type Milestone = {
  id: string; label: string; location: string | null;
  status: string; occurredAt: string; note: string | null;
};

type ShipDoc = { id: string; name: string; type: string; url: string; createdAt: string };

export default function ExpeditionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t, locale } = useT();
  const sd = t.dashboard.shipmentDetail;
  const dl = locale === "en" ? "en-US" : "fr-FR";
  const statusLabel = (s: string) => (t.shipmentStatus as Record<string, string>)[s] ?? s;
  const serviceLabel = (s: string) => (t.serviceTypes as Record<string, string>)[s] ?? s;
  const docLabel = (s: string) => (t.documentTypes as Record<string, string>)[s] ?? s;
  const [data, setData] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/client/shipments/${params.id}`)
      .then(async (r) => {
        if (r.status === 404) { setNotFound(true); return; }
        if (r.ok) setData(await r.json());
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 size={28} className="animate-spin" style={{ color: "#1A3A6B" }} />
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
        <p className="font-black uppercase text-sm mb-2" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
          {sd.notFound}
        </p>
        <Link href="/dashboard" className="text-xs text-[#E8520A] underline" style={{ fontFamily: "var(--font-lato)" }}>
          {sd.backToDash}
        </Link>
      </div>
    );
  }

  const sm = STATUS_STYLE[data.status] ?? STATUS_STYLE.PENDING;
  const StatusIcon = sm.icon;
  const idx = STATUS_ORDER.indexOf(data.status);
  const pct = ["CANCELLED","INCIDENT"].includes(data.status)
    ? 0
    : idx < 0 ? 0 : Math.round(((idx + 1) / STATUS_ORDER.length) * 100);

  return (
    <div className="flex-1 overflow-auto">
      {/* Header */}
      <div
        className="px-6 lg:px-8 pt-6 pb-8 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0e2248 0%, #1A3A6B 100%)" }}
      >
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full opacity-10" style={{ backgroundColor: "#E8520A" }} />

        {/* Back button */}
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-5 text-xs font-black uppercase"
          style={{ fontFamily: "var(--font-montserrat)" }}
        >
          <ArrowLeft size={14} />
          {sd.back}
        </button>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: "#fba563", fontFamily: "var(--font-montserrat)" }}>
              ▪ {sd.eyebrow}
            </p>
            <h1 className="text-2xl font-black text-white mb-2" style={{ fontFamily: "var(--font-montserrat)" }}>
              {data.reference}
            </h1>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black"
                style={{ backgroundColor: `${sm.color}25`, color: sm.color, fontFamily: "var(--font-montserrat)" }}
              >
                <StatusIcon size={12} />
                {statusLabel(data.status)}
              </span>
              <span className="text-blue-200 text-xs" style={{ fontFamily: "var(--font-lato)" }}>
                {serviceLabel(data.serviceType)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => exportExpeditionPDF({
                reference: data.reference,
                status: statusLabel(data.status),
                serviceType: data.serviceType,
                origin: data.origin,
                destination: data.destination,
                weight: data.weight,
                volume: data.volume,
                eta: data.eta,
                createdAt: data.createdAt,
                milestones: data.milestones.map((m) => ({
                  label: m.label,
                  date: m.occurredAt,
                  done: true,
                })),
                documents: data.documents.map((d) => ({
                  name: d.name,
                  type: docLabel(d.type),
                })),
              })}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 text-white text-xs font-black uppercase hover:bg-white/20 transition-colors"
              style={{ fontFamily: "var(--font-montserrat)" }}
            >
              <FileDown size={13} />
              PDF
            </button>
            <Link
              href={`/dashboard/messages?ref=${data.reference}`}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 text-white text-xs font-black uppercase hover:bg-white/20 transition-colors"
              style={{ fontFamily: "var(--font-montserrat)" }}
            >
              <MessageSquare size={13} />
              {sd.contact}
            </Link>
            <a
              href={`/tracking?ref=${data.reference}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#E8520A] text-white text-xs font-black uppercase hover:opacity-80 transition-opacity"
              style={{ fontFamily: "var(--font-montserrat)" }}
            >
              <ExternalLink size={13} />
              {sd.publicTracking}
            </a>
          </div>
        </div>

        {/* Progress bar */}
        {!["CANCELLED","INCIDENT"].includes(data.status) && (
          <div className="mt-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-white/50" style={{ fontFamily: "var(--font-lato)" }}>
                {sd.progress}
              </span>
              <span className="text-xs font-black text-white" style={{ fontFamily: "var(--font-montserrat)" }}>
                {pct}%
              </span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${pct}%`,
                  background: data.status === "DELIVERED"
                    ? "#4ade80"
                    : "linear-gradient(90deg, #60a5fa, #fff)",
                }}
              />
            </div>
            {/* Steps */}
            <div className="flex justify-between mt-2">
              {STATUS_ORDER.slice(0, 4).map((s, i) => (
                <div
                  key={s}
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    backgroundColor: i <= idx ? "#fff" : "rgba(255,255,255,0.2)",
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="px-6 lg:px-8 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column — info + milestones */}
        <div className="lg:col-span-2 space-y-5">
          {/* Info card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-black uppercase text-xs mb-4 tracking-wider" style={{ color: "#9ca3af", fontFamily: "var(--font-montserrat)" }}>
              {sd.info}
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400 mb-0.5" style={{ fontFamily: "var(--font-lato)" }}>{sd.origin}</p>
                <p className="font-black text-sm flex items-center gap-1.5" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
                  <MapPin size={12} style={{ color: "#E8520A" }} />
                  {data.origin}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5" style={{ fontFamily: "var(--font-lato)" }}>{sd.destination}</p>
                <p className="font-black text-sm flex items-center gap-1.5" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
                  <MapPin size={12} style={{ color: "#1A3A6B" }} />
                  {data.destination}
                </p>
              </div>
              {data.weight && (
                <div>
                  <p className="text-xs text-gray-400 mb-0.5" style={{ fontFamily: "var(--font-lato)" }}>{sd.weight}</p>
                  <p className="font-black text-sm" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
                    {data.weight} kg
                  </p>
                </div>
              )}
              {data.volume && (
                <div>
                  <p className="text-xs text-gray-400 mb-0.5" style={{ fontFamily: "var(--font-lato)" }}>{sd.volume}</p>
                  <p className="font-black text-sm" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
                    {data.volume} m³
                  </p>
                </div>
              )}
              {data.eta && (
                <div>
                  <p className="text-xs text-gray-400 mb-0.5" style={{ fontFamily: "var(--font-lato)" }}>{sd.etaEst}</p>
                  <p className="font-black text-sm flex items-center gap-1.5" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
                    <Calendar size={12} style={{ color: "#0891b2" }} />
                    {new Date(data.eta).toLocaleDateString(dl, { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
              )}
              {data.deliveredAt && (
                <div>
                  <p className="text-xs text-gray-400 mb-0.5" style={{ fontFamily: "var(--font-lato)" }}>{sd.deliveryDate}</p>
                  <p className="font-black text-sm flex items-center gap-1.5 text-green-600" style={{ fontFamily: "var(--font-montserrat)" }}>
                    <CheckCircle2 size={12} />
                    {new Date(data.deliveredAt).toLocaleDateString(dl, { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
              )}
              {data.trackingNumber && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-400 mb-0.5" style={{ fontFamily: "var(--font-lato)" }}>{sd.trackingNo}</p>
                  <p className="font-mono text-sm text-gray-700">{data.trackingNumber}</p>
                </div>
              )}
              {data.description && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-400 mb-0.5" style={{ fontFamily: "var(--font-lato)" }}>{sd.description}</p>
                  <p className="text-sm text-gray-600" style={{ fontFamily: "var(--font-lato)" }}>{data.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Milestone timeline */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-black uppercase text-xs mb-5 tracking-wider" style={{ color: "#9ca3af", fontFamily: "var(--font-montserrat)" }}>
              {sd.history}
            </h2>

            {data.milestones.length === 0 ? (
              <div className="text-center py-8">
                <Clock size={24} className="mx-auto mb-2 text-gray-200" />
                <p className="text-xs text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>
                  {sd.noMilestone}
                </p>
              </div>
            ) : (
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-gray-200 to-transparent" />

                <div className="space-y-5">
                  {data.milestones.map((m, i) => {
                    const msm = STATUS_STYLE[m.status] ?? STATUS_STYLE.PENDING;
                    const MIcon = msm.icon;
                    const isFirst = i === 0;
                    return (
                      <div key={m.id} className="flex gap-4 relative">
                        {/* Dot */}
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 border-2"
                          style={{
                            backgroundColor: isFirst ? msm.color : "#fff",
                            borderColor: msm.color,
                            boxShadow: isFirst ? `0 0 0 4px ${msm.color}20` : "none",
                          }}
                        >
                          <MIcon size={13} style={{ color: isFirst ? "#fff" : msm.color }} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 pb-1">
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <div>
                              <p
                                className="font-black text-sm"
                                style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}
                              >
                                {m.label}
                              </p>
                              {m.location && (
                                <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5" style={{ fontFamily: "var(--font-lato)" }}>
                                  <MapPin size={10} />
                                  {m.location}
                                </p>
                              )}
                              {m.note && (
                                <p className="text-xs text-gray-500 mt-1 italic bg-gray-50 px-2 py-1 rounded-lg" style={{ fontFamily: "var(--font-lato)" }}>
                                  {m.note}
                                </p>
                              )}
                            </div>
                            <span
                              className="text-xs text-gray-400 shrink-0"
                              style={{ fontFamily: "var(--font-lato)" }}
                            >
                              {new Date(m.occurredAt).toLocaleDateString(dl, {
                                day: "numeric", month: "short",
                              })} · {new Date(m.occurredAt).toLocaleTimeString(dl, {
                                hour: "2-digit", minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right column — documents */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-black uppercase text-xs tracking-wider" style={{ color: "#9ca3af", fontFamily: "var(--font-montserrat)" }}>
                {sd.documents}
              </h2>
              <Link
                href={`/dashboard/documents`}
                className="text-xs font-black uppercase tracking-wide hover:opacity-70"
                style={{ color: "#E8520A", fontFamily: "var(--font-montserrat)" }}
              >
                {sd.manage}
              </Link>
            </div>

            {data.documents.length === 0 ? (
              <div className="text-center py-6">
                <FileText size={24} className="mx-auto mb-2 text-gray-200" />
                <p className="text-xs text-gray-400 mb-3" style={{ fontFamily: "var(--font-lato)" }}>
                  {sd.noDoc}
                </p>
                <Link
                  href="/dashboard/documents"
                  className="text-xs font-black uppercase tracking-wide"
                  style={{ color: "#7c3aed", fontFamily: "var(--font-montserrat)" }}
                >
                  {sd.addDoc}
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {data.documents.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-sm">
                      <FileText size={14} style={{ color: "#7c3aed" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black truncate" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
                        {doc.name}
                      </p>
                      <p className="text-xs text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>
                        {docLabel(doc.type)}
                      </p>
                    </div>
                    <FileViewButton
                      docId={doc.id}
                      name={doc.name}
                      className="w-7 h-7 rounded-lg flex items-center justify-center hover:opacity-80 transition-opacity shrink-0 cursor-pointer"
                      style={{ backgroundColor: "rgba(26,58,107,0.08)" }}
                      iconSize={12}
                      iconColor="#1A3A6B"
                    />
                    <a
                      href={`/api/files/${doc.id}?download=1`}
                      title={sd.download}
                      className="w-7 h-7 rounded-lg flex items-center justify-center hover:opacity-80 transition-opacity shrink-0"
                      style={{ backgroundColor: "rgba(26,58,107,0.08)" }}
                    >
                      <Download size={12} style={{ color: "#1A3A6B" }} />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick links */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-black uppercase text-xs mb-3 tracking-wider" style={{ color: "#9ca3af", fontFamily: "var(--font-montserrat)" }}>
              {sd.quickActions}
            </h2>
            <div className="space-y-2">
              <Link
                href={`/dashboard/messages?ref=${data.reference}`}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "rgba(8,145,178,0.08)" }}>
                  <MessageSquare size={14} style={{ color: "#0891b2" }} />
                </div>
                <p className="text-sm font-black" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
                  {sd.contactAgency}
                </p>
              </Link>
              <a
                href={`/tracking?ref=${data.reference}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "rgba(232,82,10,0.08)" }}>
                  <ExternalLink size={14} style={{ color: "#E8520A" }} />
                </div>
                <p className="text-sm font-black" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
                  {sd.publicTracking}
                </p>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
