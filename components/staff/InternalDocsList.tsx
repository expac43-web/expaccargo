"use client";

import { useState, useEffect } from "react";
import { FolderLock, Download, Eye, FileText, Loader2 } from "lucide-react";

type Doc = { id: string; name: string; type: string; url: string; createdAt: string };

const DOC_LABELS: Record<string, string> = {
  INVOICE: "Facture", PRO_FORMA: "Facture pro forma", BILL_OF_LADING: "Connaissement",
  CUSTOMS_DECL: "Déclaration douanière", CERTIFICATE: "Certificat",
  PACKING_LIST: "Liste de colisage", OTHER: "Document",
};
const TYPE_COLORS: Record<string, string> = {
  INVOICE: "#E8520A", PRO_FORMA: "#7c3aed", BILL_OF_LADING: "#1A3A6B",
  CUSTOMS_DECL: "#f59e0b", CERTIFICATE: "#10b981", PACKING_LIST: "#0e5f72", OTHER: "#6b7280",
};

/** Espace « Mes documents » : documents internes déposés par l'admin pour le membre connecté. */
export default function InternalDocsList({ accent = "#1A3A6B" }: { accent?: string }) {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/staff/documents")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setDocs(Array.isArray(d) ? d : []))
      .catch(() => setDocs([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-5 lg:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: `linear-gradient(135deg, #0e2248 0%, ${accent} 100%)` }}>
          <FolderLock size={20} color="white" />
        </div>
        <div>
          <h1 className="text-xl lg:text-2xl font-black" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
            Mes documents
          </h1>
          <p className="text-sm text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>
            Documents internes mis à votre disposition par l&apos;administration.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <Loader2 size={22} className="animate-spin" />
        </div>
      ) : docs.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <FileText size={34} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-400 text-sm" style={{ fontFamily: "var(--font-lato)" }}>
            Aucun document interne pour le moment.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {docs.map((d) => {
            const color = TYPE_COLORS[d.type] ?? "#6b7280";
            return (
              <div key={d.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}15`, color }}>
                  <FileText size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black truncate" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>{d.name}</p>
                  <p className="text-xs text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>
                    {DOC_LABELS[d.type] ?? d.type} · {new Date(d.createdAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <a href={`/api/files/${d.id}`} target="_blank" rel="noopener noreferrer" title="Ouvrir" className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-[#1A3A6B] transition-colors">
                    <Eye size={16} />
                  </a>
                  <a href={`/api/files/${d.id}?download=1`} download title="Télécharger" className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-[#1A3A6B] transition-colors">
                    <Download size={16} />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
