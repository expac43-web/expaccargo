"use client";

import { useState, useEffect } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import { FileText, Loader2, Download, ShieldCheck, Eye, X } from "lucide-react";
import { exportDevisPDF } from "@/lib/pdf";

const STATUS_META: Record<string, { label: string; color: string }> = {
  NEW:       { label: "Nouveau",      color: "#0891b2" },
  IN_REVIEW: { label: "En étude",     color: "#d97706" },
  QUOTED:    { label: "Devis envoyé", color: "#7c3aed" },
  ACCEPTED:  { label: "Accepté",      color: "#16a34a" },
  REJECTED:  { label: "Refusé",       color: "#dc2626" },
};

const SERVICE_LABEL: Record<string, string> = {
  TRANSIT: "Transit", MULTIMODAL: "Transport multimodal", STORAGE: "Stockage",
  MARITIME_CONSIGNMENT: "Consignation maritime", GROUPAGE: "Groupage",
};

type Quote = {
  id: string; name: string; email: string; phone: string;
  serviceType: string; origin: string; destination: string;
  cargoType: string; weight: number | null; volume: number | null;
  notes: string | null; status: string; createdAt: string;
  signature?: { signerName: string; signedAt: string } | null;
};

export default function GerantDevisPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [sigView, setSigView] = useState<Quote | null>(null);

  useEffect(() => {
    fetch("/api/admin/devis")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setQuotes(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, []);

  const fmtDate = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  async function downloadPdf(q: Quote) {
    let sig: { signatureDataUrl?: string; signerName?: string; signedAt?: string } = {};
    if (q.signature) {
      try {
        const r = await fetch(`/api/signatures/${q.id}`);
        if (r.ok) {
          const blob = await r.blob();
          const dataUrl = await new Promise<string>((res, rej) => {
            const fr = new FileReader();
            fr.onload = () => res(fr.result as string);
            fr.onerror = rej;
            fr.readAsDataURL(blob);
          });
          sig = { signatureDataUrl: dataUrl, signerName: q.signature.signerName, signedAt: fmtDate(q.signature.signedAt) };
        }
      } catch { /* PDF sans tampon */ }
    }
    exportDevisPDF({
      reference: q.id.slice(0, 8).toUpperCase(),
      name: q.name, email: q.email, phone: q.phone,
      serviceType: q.serviceType, origin: q.origin, destination: q.destination,
      cargoType: q.cargoType, weight: q.weight, volume: q.volume, notes: q.notes,
      status: (STATUS_META[q.status] ?? STATUS_META.NEW).label, createdAt: q.createdAt,
      ...sig,
    });
  }

  const signedCount = quotes.filter((q) => q.signature).length;
  const shown = filter === "ALL" ? quotes : filter === "SIGNED" ? quotes.filter((q) => q.signature) : quotes.filter((q) => q.status === filter);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <AdminHeader title="Devis" subtitle={`${quotes.length} demande${quotes.length > 1 ? "s" : ""} · ${signedCount} signé${signedCount > 1 ? "s" : ""}`} />

      <div className="flex-1 p-6">
        {/* Filtres */}
        <div className="flex flex-wrap gap-2 mb-5">
          {[
            { v: "ALL", l: "Tous" },
            { v: "QUOTED", l: "Devis envoyé" },
            { v: "ACCEPTED", l: "Accepté" },
            { v: "SIGNED", l: "Signés" },
            { v: "REJECTED", l: "Refusé" },
          ].map((f) => (
            <button
              key={f.v}
              onClick={() => setFilter(f.v)}
              className="px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-colors"
              style={{
                fontFamily: "var(--font-montserrat)",
                backgroundColor: filter === f.v ? "#1A3A6B" : "#f3f4f6",
                color: filter === f.v ? "#fff" : "#6b7280",
              }}
            >
              {f.l}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin" style={{ color: "#1A3A6B" }} /></div>
        ) : shown.length === 0 ? (
          <div className="text-center py-20">
            <FileText size={36} className="mx-auto mb-3 text-gray-300" />
            <p className="text-gray-400 text-sm" style={{ fontFamily: "var(--font-lato)" }}>Aucun devis pour ce filtre.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {shown.map((q) => {
              const sm = STATUS_META[q.status] ?? STATUS_META.NEW;
              return (
                <div key={q.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-black text-sm" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
                          {q.name}
                        </span>
                        <span className="px-2.5 py-1 rounded-full text-xs font-black" style={{ backgroundColor: `${sm.color}15`, color: sm.color, fontFamily: "var(--font-montserrat)" }}>
                          {sm.label}
                        </span>
                        {q.signature && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black" style={{ backgroundColor: "rgba(22,163,74,0.12)", color: "#16a34a", fontFamily: "var(--font-montserrat)" }}>
                            <ShieldCheck size={11} /> Signé
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500" style={{ fontFamily: "var(--font-lato)" }}>
                        {SERVICE_LABEL[q.serviceType] ?? q.serviceType} · {q.origin} → {q.destination} · {q.cargoType}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: "var(--font-lato)" }}>
                        {q.email} · {q.phone} · {fmtDate(q.createdAt)}
                      </p>
                      {q.signature && (
                        <p className="text-xs text-green-700 mt-1.5" style={{ fontFamily: "var(--font-lato)" }}>
                          Signé par <strong>{q.signature.signerName}</strong> le {fmtDate(q.signature.signedAt)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {q.signature && (
                        <button onClick={() => setSigView(q)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-black uppercase border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors" style={{ fontFamily: "var(--font-montserrat)" }}>
                          <Eye size={13} /> Signature
                        </button>
                      )}
                      <button onClick={() => downloadPdf(q)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-black uppercase border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors" style={{ fontFamily: "var(--font-montserrat)" }}>
                        <Download size={13} /> PDF
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Aperçu de la signature */}
      {sigView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setSigView(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-black uppercase text-sm" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
                Signature — {sigView.id.slice(0, 8).toUpperCase()}
              </h2>
              <button onClick={() => setSigView(null)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100"><X size={16} /></button>
            </div>
            <div className="px-6 py-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/api/signatures/${sigView.id}`} alt="Signature" className="w-full rounded-xl border border-gray-200 bg-gray-50" />
              {sigView.signature && (
                <p className="text-xs text-gray-500 mt-3 text-center" style={{ fontFamily: "var(--font-lato)" }}>
                  Signé par <strong>{sigView.signature.signerName}</strong> le {fmtDate(sigView.signature.signedAt)}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
