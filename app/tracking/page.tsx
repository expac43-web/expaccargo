import type { ElementType } from "react";
import type { Metadata } from "next";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";

export const metadata: Metadata = {
  title: "Suivi d'Expédition en Temps Réel",
  description:
    "Suivez votre expédition EXPAC en temps réel. Entrez votre numéro de référence pour localiser vos marchandises à chaque étape du transport en Afrique.",
  alternates: { canonical: "https://expaccargo.com/tracking" },
  openGraph: {
    title: "Suivi d'Expédition EXPAC — Tracking en Temps Réel",
    description:
      "Localisez vos marchandises à tout moment grâce au système de tracking EXPAC. Suivi étape par étape de vos envois en Afrique.",
    url: "https://expaccargo.com/tracking",
  },
  keywords: [
    "suivi expédition Afrique",
    "tracking cargo",
    "localisation marchandises",
    "suivi colis international",
    "tracking transit douanier",
  ],
};
import TrackingSearch from "@/components/public/TrackingSearch";
import { getServerLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n";
import {
  Package,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Truck,
  Ship,
  FileCheck,
  MapPin,
} from "lucide-react";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Style (couleur + icône) par statut. Le libellé vient du dictionnaire.
const STATUS_STYLE: Record<string, { color: string; icon: ElementType }> = {
  PENDING:        { color: "#6b7280", icon: Clock },
  PICKED_UP:      { color: "#2563eb", icon: Package },
  CUSTOMS_EXPORT: { color: "#7c3aed", icon: FileCheck },
  IN_TRANSIT:     { color: "#0891b2", icon: Ship },
  CUSTOMS_IMPORT: { color: "#7c3aed", icon: FileCheck },
  OUT_DELIVERY:   { color: "#d97706", icon: Truck },
  DELIVERED:      { color: "#16a34a", icon: CheckCircle2 },
  INCIDENT:       { color: "#dc2626", icon: AlertTriangle },
  CANCELLED:      { color: "#9ca3af", icon: XCircle },
};

const ORDERED_STEPS = [
  "PENDING",
  "PICKED_UP",
  "CUSTOMS_EXPORT",
  "IN_TRANSIT",
  "CUSTOMS_IMPORT",
  "OUT_DELIVERY",
  "DELIVERED",
];

async function fetchShipment(reference: string) {
  if (!SUPABASE_URL || !SERVICE_KEY) return null;
  const url = `${SUPABASE_URL}/rest/v1/Shipment?reference=eq.${encodeURIComponent(reference)}&select=*&limit=1`;
  const r = await fetch(url, {
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
    },
    next: { revalidate: 0 },
  });
  if (!r.ok) return null;
  const data = await r.json();
  return data[0] ?? null;
}

async function fetchMilestones(shipmentId: string) {
  if (!SUPABASE_URL || !SERVICE_KEY) return [];
  const url = `${SUPABASE_URL}/rest/v1/Milestone?shipmentId=eq.${shipmentId}&select=*&order=occurredAt.asc`;
  const r = await fetch(url, {
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
    },
    next: { revalidate: 0 },
  });
  if (!r.ok) return [];
  return await r.json();
}

export default async function TrackingPage(props: { searchParams: Promise<{ ref?: string }> }) {
  const { ref: reference } = await props.searchParams;
  const locale = await getServerLocale();
  const t = getDictionary(locale);
  const tp = t.trackingPage;
  const dl = locale === "en" ? "en-US" : "fr-FR";
  const sStatus = (s: string) => (t.shipmentStatus as Record<string, string>)[s] ?? s;
  const sService = (s: string) => (t.serviceTypes as Record<string, string>)[s] ?? s;

  const shipment = reference ? await fetchShipment(reference.trim().toUpperCase()) : null;
  const milestones = shipment ? await fetchMilestones(shipment.id) : [];

  const style = shipment ? (STATUS_STYLE[shipment.status] ?? STATUS_STYLE.PENDING) : null;
  const StatusIcon = style?.icon ?? Package;

  const currentStepIndex = shipment ? ORDERED_STEPS.indexOf(shipment.status) : -1;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">

        {/* Header */}
        <div
          className="relative py-16 overflow-hidden"
          style={{ background: "linear-gradient(135deg, #0e2248 0%, #1A3A6B 60%, #2a5298 100%)" }}
        >
          <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full opacity-10" style={{ backgroundColor: "#E8520A" }} />
          <div className="absolute -left-10 bottom-0 w-56 h-56 rounded-full opacity-10" style={{ backgroundColor: "#E8520A" }} />
          <div className="container-custom relative z-10">
            <p className="text-xs font-black uppercase tracking-[0.2em] mb-4" style={{ color: "#fba563", fontFamily: "var(--font-montserrat)" }}>
              ▪ {tp.eyebrow}
            </p>
            <h1 className="text-4xl lg:text-5xl font-black text-white uppercase leading-tight mb-4" style={{ fontFamily: "var(--font-montserrat)" }}>
              {tp.titlePre} <span style={{ color: "#E8520A" }}>{tp.titleHighlight}</span>
            </h1>
            <p className="text-blue-200 max-w-xl" style={{ fontFamily: "var(--font-lato)" }}>
              {tp.subtitle}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="bg-gray-50 py-10 border-b border-gray-200">
          <div className="container-custom">
            <TrackingSearch defaultValue={reference ?? ""} placeholder={tp.searchPlaceholder} submitLabel={tp.searchBtn} />
          </div>
        </div>

        {/* Results */}
        <div className="bg-gray-50 py-12">
          <div className="container-custom">

            {/* No search yet */}
            {!reference && (
              <div className="text-center py-20">
                <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: "rgba(26,58,107,0.06)" }}>
                  <Package size={40} style={{ color: "#1A3A6B" }} />
                </div>
                <p className="text-gray-400 text-sm" style={{ fontFamily: "var(--font-lato)" }}>
                  {tp.emptyPrompt}
                </p>
              </div>
            )}

            {/* Not found */}
            {reference && !shipment && (
              <div className="text-center py-20">
                <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: "rgba(220,38,38,0.06)" }}>
                  <XCircle size={40} className="text-red-400" />
                </div>
                <h2 className="text-lg font-black uppercase mb-2" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
                  {tp.notFoundTitle}
                </h2>
                <p className="text-gray-500 text-sm max-w-sm mx-auto" style={{ fontFamily: "var(--font-lato)" }}>
                  {tp.notFoundPre} <strong>{reference}</strong>{tp.notFoundPost}
                </p>
              </div>
            )}

            {/* Shipment found */}
            {shipment && style && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Main info + timeline */}
                <div className="lg:col-span-2 space-y-6">

                  {/* Status card */}
                  <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <p className="text-xs font-black uppercase tracking-wider mb-1" style={{ color: "#6b7280", fontFamily: "var(--font-montserrat)" }}>
                          {tp.reference}
                        </p>
                        <p className="text-2xl font-black" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
                          {shipment.reference}
                        </p>
                      </div>
                      <div
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-black uppercase tracking-wide"
                        style={{ backgroundColor: style.color, fontFamily: "var(--font-montserrat)" }}
                      >
                        <StatusIcon size={16} />
                        {sStatus(shipment.status)}
                      </div>
                    </div>

                    {/* Progress bar */}
                    {currentStepIndex >= 0 && shipment.status !== "INCIDENT" && shipment.status !== "CANCELLED" && (
                      <div className="mt-6">
                        <div className="flex justify-between text-xs text-gray-400 mb-2" style={{ fontFamily: "var(--font-lato)" }}>
                          <span>{tp.progressStart}</span>
                          <span>{tp.progressEnd}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div
                            className="h-2 rounded-full transition-all"
                            style={{
                              width: `${Math.round((currentStepIndex / (ORDERED_STEPS.length - 1)) * 100)}%`,
                              backgroundColor: "#1A3A6B",
                            }}
                          />
                        </div>
                        <p className="text-right text-xs text-gray-400 mt-1" style={{ fontFamily: "var(--font-lato)" }}>
                          {Math.round((currentStepIndex / (ORDERED_STEPS.length - 1)) * 100)}%
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Timeline / Milestones */}
                  <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <h3 className="font-black uppercase text-sm mb-6" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
                      {tp.historyTitle}
                    </h3>

                    {milestones.length === 0 ? (
                      <p className="text-sm text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>
                        {tp.noEvents}
                      </p>
                    ) : (
                      <ol className="relative ml-4 border-l-2 border-gray-100 space-y-6">
                        {[...milestones].reverse().map((m: {
                          id: string;
                          status: string;
                          label: string;
                          location?: string;
                          note?: string;
                          occurredAt: string;
                        }, i: number) => {
                          const mStyle = STATUS_STYLE[m.status] ?? STATUS_STYLE.PENDING;
                          const MIcon = mStyle.icon;
                          return (
                            <li key={m.id} className="pl-6 relative">
                              <div
                                className="absolute -left-3.5 top-0 w-7 h-7 rounded-full flex items-center justify-center border-2 border-white"
                                style={{ backgroundColor: i === 0 ? mStyle.color : "#e5e7eb" }}
                              >
                                <MIcon size={13} color={i === 0 ? "white" : "#9ca3af"} />
                              </div>
                              <div className="flex items-start justify-between gap-2 flex-wrap">
                                <div>
                                  <p className="font-black text-sm" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
                                    {m.label}
                                  </p>
                                  {m.location && (
                                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5" style={{ fontFamily: "var(--font-lato)" }}>
                                      <MapPin size={11} /> {m.location}
                                    </p>
                                  )}
                                  {m.note && (
                                    <p className="text-xs text-gray-400 mt-1 italic" style={{ fontFamily: "var(--font-lato)" }}>
                                      {m.note}
                                    </p>
                                  )}
                                </div>
                                <p className="text-xs text-gray-400 shrink-0" style={{ fontFamily: "var(--font-lato)" }}>
                                  {new Date(m.occurredAt).toLocaleDateString(dl, {
                                    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
                                  })}
                                </p>
                              </div>
                            </li>
                          );
                        })}
                      </ol>
                    )}
                  </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-4">

                  {/* Shipment details */}
                  <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <h3 className="font-black uppercase text-sm mb-5" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
                      {tp.detailsTitle}
                    </h3>
                    <ul className="space-y-4">
                      {[
                        { label: tp.dService, value: sService(shipment.serviceType) },
                        { label: tp.dOrigin, value: shipment.origin },
                        { label: tp.dDestination, value: shipment.destination },
                        ...(shipment.weight ? [{ label: tp.dWeight, value: `${shipment.weight} kg` }] : []),
                        ...(shipment.volume ? [{ label: tp.dVolume, value: `${shipment.volume} m³` }] : []),
                        ...(shipment.eta ? [{ label: tp.dEta, value: new Date(shipment.eta).toLocaleDateString(dl, { day: "numeric", month: "long", year: "numeric" }) }] : []),
                      ].map(({ label, value }) => (
                        <li key={label}>
                          <p className="text-xs font-black uppercase tracking-wider mb-0.5" style={{ color: "#9ca3af", fontFamily: "var(--font-montserrat)" }}>
                            {label}
                          </p>
                          <p className="text-sm text-gray-700" style={{ fontFamily: "var(--font-lato)" }}>
                            {value}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Help card */}
                  <div className="rounded-2xl p-6" style={{ background: "linear-gradient(135deg, #0e2248 0%, #1A3A6B 100%)" }}>
                    <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: "#fba563", fontFamily: "var(--font-montserrat)" }}>
                      {tp.helpEyebrow}
                    </p>
                    <p className="text-white text-sm mb-4 leading-relaxed" style={{ fontFamily: "var(--font-lato)" }}>
                      {tp.helpText}
                    </p>
                    <a
                      href="/contact"
                      className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-black text-white text-sm uppercase tracking-wide hover:opacity-90 transition-all"
                      style={{ backgroundColor: "#E8520A", fontFamily: "var(--font-montserrat)" }}
                    >
                      {tp.helpContact}
                    </a>
                    <a
                      href="/login"
                      className="mt-3 flex items-center justify-center gap-2 w-full py-3 rounded-xl font-black text-sm uppercase tracking-wide hover:bg-white/10 transition-all border border-white/20 text-white"
                      style={{ fontFamily: "var(--font-montserrat)" }}
                    >
                      {tp.helpClient}
                    </a>
                  </div>

                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
