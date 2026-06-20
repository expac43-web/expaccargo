"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, FileText } from "lucide-react";
import AdminHeader from "@/components/admin/AdminHeader";
import DevisProcessPanel, { DevisQuote } from "@/components/admin/DevisProcessPanel";

export default function DevisDetail({ id, backHref }: { id: string; backHref: string }) {
  const [quote, setQuote] = useState<DevisQuote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/devis/${id}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setQuote(d))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  function applyPatch(patch: Partial<DevisQuote> & { id: string }) {
    setQuote((q) => (q && q.id === patch.id ? { ...q, ...patch } : q));
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <AdminHeader title="Traiter la demande de devis" subtitle={quote ? quote.name : "Demande de devis"} />

      <div className="flex-1 overflow-y-auto p-6">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 mb-5 px-3 py-2 rounded-xl text-xs font-black uppercase border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          style={{ fontFamily: "var(--font-montserrat)" }}
        >
          <ArrowLeft size={14} /> Retour aux devis
        </Link>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin" style={{ color: "#1A3A6B" }} /></div>
        ) : error || !quote ? (
          <div className="text-center py-20">
            <FileText size={36} className="mx-auto mb-3 text-gray-300" />
            <p className="text-gray-400 text-sm" style={{ fontFamily: "var(--font-lato)" }}>Demande de devis introuvable.</p>
          </div>
        ) : (
          <DevisProcessPanel quote={quote} onUpdated={applyPatch} />
        )}
      </div>
    </div>
  );
}
