import type { ElementType } from "react";
import type { Metadata } from "next";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import Image from "next/image";
import StorageSearch from "@/components/public/StorageSearch";
import { getServerLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n";
import {
  Warehouse, XCircle, Clock, CheckCircle2, AlertTriangle,
  MapPin, CalendarDays, CalendarClock, Package,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Suivi de stockage — Vérifiez votre colis stocké",
  description:
    "Vérifiez si votre colis est stocké chez EXPAC (Brazzaville ou Pointe-Noire) et connaissez son statut : date d'entrée, sortie prévue, en attente de libération, libéré ou délai dépassé.",
  alternates: { canonical: "https://expaccargo.com/stockage" },
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const STORAGE_HEADER = "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1600&q=55"; // entrepôt / colis

type StorageItem = {
  id: string;
  reference: string;
  clientName: string | null;
  description: string | null;
  entryDate: string;
  expectedExitDate: string | null;
  status: "AWAITING" | "RELEASED";
  location: "BZV" | "PN";
  notes: string | null;
};

async function fetchStorage(reference: string): Promise<StorageItem | null> {
  if (!SUPABASE_URL || !SERVICE_KEY) return null;
  const url = `${SUPABASE_URL}/rest/v1/Storage?reference=eq.${encodeURIComponent(reference)}&select=*&limit=1`;
  const r = await fetch(url, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
    next: { revalidate: 0 },
  });
  if (!r.ok) return null;
  const data = await r.json();
  return data[0] ?? null;
}

function effectiveStatus(item: StorageItem): "AWAITING" | "RELEASED" | "OVERDUE" {
  if (item.status === "RELEASED") return "RELEASED";
  if (item.expectedExitDate && new Date(item.expectedExitDate) < new Date()) return "OVERDUE";
  return "AWAITING";
}

export default async function StoragePage(props: { searchParams: Promise<{ ref?: string }> }) {
  const { ref: reference } = await props.searchParams;
  const locale = await getServerLocale();
  const t = getDictionary(locale);
  const sp = t.storagePage;
  const dl = locale === "en" ? "en-US" : "fr-FR";

  const item = reference ? await fetchStorage(reference.trim().toUpperCase()) : null;
  const eff = item ? effectiveStatus(item) : null;

  const STATUS_STYLE: Record<string, { color: string; icon: ElementType; label: string }> = {
    AWAITING: { color: "#b45309", icon: Clock, label: sp.statusAwaiting },
    OVERDUE: { color: "#dc2626", icon: AlertTriangle, label: sp.statusOverdue },
    RELEASED: { color: "#16a34a", icon: CheckCircle2, label: sp.statusReleased },
  };
  const style = eff ? STATUS_STYLE[eff] : null;
  const StatusIcon = style?.icon ?? Package;
  const fmt = (d: string | null) =>
    d ? new Date(d).toLocaleDateString(dl, { day: "numeric", month: "long", year: "numeric" }) : "—";

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        {/* Header — image de fond (entrepôt) + voile navy */}
        <div className="relative py-20 overflow-hidden">
          <Image src={STORAGE_HEADER} alt="Entrepôt — colis stockés" fill priority sizes="100vw" className="object-cover" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(120deg, rgba(14,34,72,0.95) 0%, rgba(26,58,107,0.88) 55%, rgba(42,82,152,0.7) 100%)" }} />
          <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full opacity-10" style={{ backgroundColor: "#E8520A" }} />
          <div className="absolute -left-10 bottom-0 w-56 h-56 rounded-full opacity-10" style={{ backgroundColor: "#E8520A" }} />
          <div className="container-custom relative z-10">
            <p className="text-xs font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2" style={{ color: "#fba563", fontFamily: "var(--font-montserrat)" }}>
              <Warehouse size={14} /> {sp.eyebrow}
            </p>
            <h1 className="text-4xl lg:text-5xl font-black text-white uppercase leading-tight mb-4" style={{ fontFamily: "var(--font-montserrat)" }}>
              {sp.titlePre} <span style={{ color: "#E8520A" }}>{sp.titleHighlight}</span>
            </h1>
            <p className="text-blue-200 max-w-xl" style={{ fontFamily: "var(--font-lato)" }}>
              {sp.subtitle}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="bg-gray-50 py-10 border-b border-gray-200">
          <div className="container-custom">
            <StorageSearch defaultValue={reference ?? ""} placeholder={sp.searchPlaceholder} submitLabel={sp.searchBtn} />
          </div>
        </div>

        {/* Results */}
        <div className="bg-gray-50 py-12">
          <div className="container-custom">

            {!reference && (
              <div className="text-center py-20">
                <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: "rgba(26,58,107,0.06)" }}>
                  <Warehouse size={40} style={{ color: "#1A3A6B" }} />
                </div>
                <p className="text-gray-400 text-sm" style={{ fontFamily: "var(--font-lato)" }}>{sp.emptyPrompt}</p>
              </div>
            )}

            {reference && !item && (
              <div className="text-center py-20">
                <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: "rgba(220,38,38,0.06)" }}>
                  <XCircle size={40} className="text-red-400" />
                </div>
                <h2 className="text-lg font-black uppercase mb-2" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>{sp.notFoundTitle}</h2>
                <p className="text-gray-500 text-sm max-w-sm mx-auto" style={{ fontFamily: "var(--font-lato)" }}>
                  {sp.notFoundPre}<strong>{reference}</strong>{sp.notFoundPost}
                </p>
              </div>
            )}

            {item && style && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <p className="text-xs font-black uppercase tracking-wider mb-1" style={{ color: "#6b7280", fontFamily: "var(--font-montserrat)" }}>{sp.reference}</p>
                        <p className="text-2xl font-black" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>{item.reference}</p>
                        {item.clientName && <p className="text-sm text-gray-500 mt-1" style={{ fontFamily: "var(--font-lato)" }}>{item.clientName}</p>}
                      </div>
                      <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-black uppercase tracking-wide" style={{ backgroundColor: style.color, fontFamily: "var(--font-montserrat)" }}>
                        <StatusIcon size={16} /> {style.label}
                      </div>
                    </div>

                    {item.description && (
                      <p className="text-sm text-gray-600 mt-5 leading-relaxed" style={{ fontFamily: "var(--font-lato)" }}>{item.description}</p>
                    )}
                  </div>

                  {item.notes && (
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                      <h3 className="font-black uppercase text-sm mb-2" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>{sp.dNotes}</h3>
                      <p className="text-sm text-gray-600 leading-relaxed" style={{ fontFamily: "var(--font-lato)" }}>{item.notes}</p>
                    </div>
                  )}
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                  <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <h3 className="font-black uppercase text-sm mb-5" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>{sp.detailsTitle}</h3>
                    <ul className="space-y-4">
                      {[
                        { icon: CalendarDays, label: sp.dEntry, value: fmt(item.entryDate) },
                        { icon: CalendarClock, label: sp.dExit, value: fmt(item.expectedExitDate) },
                        { icon: MapPin, label: sp.dLocation, value: item.location === "BZV" ? sp.locBZV : sp.locPN },
                      ].map(({ icon: Icon, label, value }) => (
                        <li key={label} className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "rgba(26,58,107,0.06)" }}>
                            <Icon size={16} style={{ color: "#1A3A6B" }} />
                          </div>
                          <div>
                            <p className="text-xs font-black uppercase tracking-wider mb-0.5" style={{ color: "#9ca3af", fontFamily: "var(--font-montserrat)" }}>{label}</p>
                            <p className="text-sm text-gray-700" style={{ fontFamily: "var(--font-lato)" }}>{value}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-2xl p-6" style={{ background: "linear-gradient(135deg, #0e2248 0%, #1A3A6B 100%)" }}>
                    <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: "#fba563", fontFamily: "var(--font-montserrat)" }}>{sp.helpEyebrow}</p>
                    <p className="text-white text-sm mb-4 leading-relaxed" style={{ fontFamily: "var(--font-lato)" }}>{sp.helpText}</p>
                    <a href="/contact" className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-black text-white text-sm uppercase tracking-wide hover:opacity-90 transition-all" style={{ backgroundColor: "#E8520A", fontFamily: "var(--font-montserrat)" }}>
                      {sp.helpContact}
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
