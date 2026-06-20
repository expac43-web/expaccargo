"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft, Mail, Phone, MessageCircle, Package, FileText, Eye, Download,
  Upload, Loader2, CheckCircle2, AlertCircle, Calendar, MapPin,
} from "lucide-react";
import FileViewButton from "@/components/files/FileViewButton";

type ClientProfile = {
  id: string; name: string; email: string; phone: string | null;
  whatsapp: string | null; isActive: boolean; createdAt: string;
};
type Shipment = {
  id: string; reference: string; status: string; serviceType: string;
  origin: string; destination: string; eta: string | null; createdAt: string;
};
type Document = {
  id: string; name: string; type: string; shipmentId: string | null;
  uploadedById: string; createdAt: string;
};
type Bundle = { client: ClientProfile; shipments: Shipment[]; documents: Document[] };

const SHIP_STATUS: Record<string, { label: string; color: string }> = {
  PENDING:        { label: "En attente",    color: "#6b7280" },
  PICKED_UP:      { label: "Collecté",      color: "#2563eb" },
  CUSTOMS_EXPORT: { label: "Douane export", color: "#7c3aed" },
  IN_TRANSIT:     { label: "En transit",    color: "#0891b2" },
  CUSTOMS_IMPORT: { label: "Douane import", color: "#7c3aed" },
  OUT_DELIVERY:   { label: "En livraison",  color: "#d97706" },
  DELIVERED:      { label: "Livré",         color: "#16a34a" },
  INCIDENT:       { label: "Incident",      color: "#dc2626" },
  CANCELLED:      { label: "Annulé",        color: "#9ca3af" },
};
const SERVICE_LABELS: Record<string, string> = {
  TRANSIT: "Transit", MULTIMODAL: "Multimodal", STORAGE: "Stockage",
  MARITIME_CONSIGNMENT: "Consignation maritime", GROUPAGE: "Groupage",
};
const DOC_TYPES: { value: string; label: string }[] = [
  { value: "INVOICE", label: "Facture" },
  { value: "PRO_FORMA", label: "Facture pro forma" },
  { value: "BILL_OF_LADING", label: "Connaissement" },
  { value: "CUSTOMS_DECL", label: "Déclaration douanière" },
  { value: "CERTIFICATE", label: "Certificat" },
  { value: "PACKING_LIST", label: "Liste de colisage" },
  { value: "OTHER", label: "Autre" },
];
const DOC_LABEL = Object.fromEntries(DOC_TYPES.map((d) => [d.value, d.label]));

export default function ClientDetailView({
  clientId, apiBase, backHref, accent, eyebrow,
}: {
  clientId: string; apiBase: string; backHref: string; accent: string; eyebrow: string;
}) {
  const [data, setData] = useState<Bundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    const r = await fetch(`${apiBase}/${clientId}`);
    if (r.status === 404) { setNotFound(true); setLoading(false); return; }
    if (r.ok) setData(await r.json());
    setLoading(false);
  }, [apiBase, clientId]);

  useEffect(() => { load(); }, [load]);

  // ── Upload ───────────────────────────────────────────────────────
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState("INVOICE");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadOk, setUploadOk] = useState(false);

  async function doUpload() {
    if (!file) return;
    setUploading(true); setUploadError(""); setUploadOk(false);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("type", docType);
      fd.append("clientId", clientId); // → uploadedById = client : visible côté client
      const r = await fetch("/api/admin/documents", { method: "POST", body: fd });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        setUploadError(d.error ?? "Erreur lors de l'envoi.");
        return;
      }
      setUploadOk(true);
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      await load();
      setTimeout(() => setUploadOk(false), 2500);
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-32"><Loader2 size={28} className="animate-spin" style={{ color: accent }} /></div>;
  }
  if (notFound || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center px-6">
        <p className="font-black uppercase text-sm mb-2" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>Client introuvable</p>
        <Link href={backHref} className="text-xs underline" style={{ color: accent, fontFamily: "var(--font-lato)" }}>← Retour à la liste</Link>
      </div>
    );
  }

  const { client, shipments, documents } = data;
  const initials = client.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="p-6 lg:p-8 max-w-6xl">
      {/* Retour */}
      <Link href={backHref} className="inline-flex items-center gap-2 text-xs font-black uppercase mb-5 text-gray-400 hover:text-gray-600 transition-colors" style={{ fontFamily: "var(--font-montserrat)" }}>
        <ArrowLeft size={14} /> Retour
      </Link>

      <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: accent, fontFamily: "var(--font-montserrat)" }}>▪ {eyebrow} · Fiche client</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne profil */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black shrink-0" style={{ background: `linear-gradient(135deg, #0e2248, ${accent})` }}>
                {initials}
              </div>
              <div className="min-w-0">
                <p className="font-black text-base truncate" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>{client.name}</p>
                <span className={`inline-block mt-1 text-xs font-black px-2 py-0.5 rounded-full ${client.isActive ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-400"}`} style={{ fontFamily: "var(--font-montserrat)" }}>
                  {client.isActive ? "Actif" : "Inactif"}
                </span>
              </div>
            </div>
            <div className="space-y-2.5 text-sm" style={{ fontFamily: "var(--font-lato)" }}>
              <a href={`mailto:${client.email}`} className="flex items-center gap-2 text-gray-600 hover:text-[#1A3A6B] break-all"><Mail size={14} className="shrink-0 text-gray-400" />{client.email}</a>
              {client.phone && <a href={`tel:${client.phone}`} className="flex items-center gap-2 text-gray-600 hover:text-[#1A3A6B]"><Phone size={14} className="shrink-0 text-gray-400" />{client.phone}</a>}
              {client.whatsapp && <p className="flex items-center gap-2 text-gray-600"><MessageCircle size={14} className="shrink-0 text-gray-400" />{client.whatsapp}</p>}
              <p className="flex items-center gap-2 text-gray-400"><Calendar size={14} className="shrink-0" />Inscrit le {new Date(client.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
              <p className="text-2xl font-black" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>{shipments.length}</p>
              <p className="text-xs text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>Expéditions</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
              <p className="text-2xl font-black" style={{ color: accent, fontFamily: "var(--font-montserrat)" }}>{documents.length}</p>
              <p className="text-xs text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>Documents</p>
            </div>
          </div>
        </div>

        {/* Colonne contenu */}
        <div className="lg:col-span-2 space-y-5">
          {/* Expéditions */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-black uppercase text-xs mb-4 tracking-wider flex items-center gap-2" style={{ color: "#9ca3af", fontFamily: "var(--font-montserrat)" }}>
              <Package size={14} /> Expéditions
            </h2>
            {shipments.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center" style={{ fontFamily: "var(--font-lato)" }}>Aucune expédition.</p>
            ) : (
              <div className="space-y-2">
                {shipments.map((s) => {
                  const st = SHIP_STATUS[s.status] ?? SHIP_STATUS.PENDING;
                  return (
                    <div key={s.id} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors flex-wrap">
                      <div className="min-w-0">
                        <p className="font-black text-sm" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>{s.reference}</p>
                        <p className="text-xs text-gray-400 flex items-center gap-1" style={{ fontFamily: "var(--font-lato)" }}>
                          <MapPin size={10} />{s.origin} → {s.destination} · {SERVICE_LABELS[s.serviceType] ?? s.serviceType}
                        </p>
                      </div>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black shrink-0" style={{ backgroundColor: `${st.color}15`, color: st.color, fontFamily: "var(--font-montserrat)" }}>
                        {st.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Documents */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-black uppercase text-xs mb-4 tracking-wider flex items-center gap-2" style={{ color: "#9ca3af", fontFamily: "var(--font-montserrat)" }}>
              <FileText size={14} /> Documents
            </h2>

            {/* Dépôt */}
            <div className="rounded-xl border border-dashed border-gray-200 p-4 mb-4 bg-gray-50/60">
              <p className="text-xs font-black uppercase tracking-wider mb-3 text-gray-500" style={{ fontFamily: "var(--font-montserrat)" }}>
                Ajouter un document <span className="text-gray-400 font-normal normal-case">(visible par le client)</span>
              </p>
              {uploadError && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-50 border border-red-100 mb-3">
                  <AlertCircle size={13} className="text-red-500 shrink-0" />
                  <p className="text-xs text-red-600" style={{ fontFamily: "var(--font-lato)" }}>{uploadError}</p>
                </div>
              )}
              {uploadOk && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-green-50 border border-green-100 mb-3">
                  <CheckCircle2 size={13} className="text-green-500 shrink-0" />
                  <p className="text-xs text-green-600" style={{ fontFamily: "var(--font-lato)" }}>Document ajouté.</p>
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="flex-1 text-xs text-gray-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-black file:bg-gray-100 file:text-gray-600 cursor-pointer"
                  style={{ fontFamily: "var(--font-lato)" }}
                />
                <select value={docType} onChange={(e) => setDocType(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 text-xs outline-none bg-white" style={{ fontFamily: "var(--font-lato)" }}>
                  {DOC_TYPES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
                <button
                  onClick={doUpload}
                  disabled={!file || uploading}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-white text-xs font-black uppercase hover:opacity-90 disabled:opacity-50 transition-all"
                  style={{ backgroundColor: accent, fontFamily: "var(--font-montserrat)" }}
                >
                  {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                  {uploading ? "Envoi…" : "Envoyer"}
                </button>
              </div>
            </div>

            {/* Liste */}
            {documents.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center" style={{ fontFamily: "var(--font-lato)" }}>Aucun document.</p>
            ) : (
              <div className="space-y-2">
                {documents.map((d) => (
                  <div key={d.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${accent}15` }}>
                      <FileText size={15} style={{ color: accent }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black truncate" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>{d.name}</p>
                      <p className="text-xs text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>
                        {DOC_LABEL[d.type] ?? d.type} · {new Date(d.createdAt).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    <FileViewButton docId={d.id} name={d.name}
                      className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-80 transition-opacity shrink-0 cursor-pointer"
                      style={{ backgroundColor: "rgba(26,58,107,0.08)" }}
                      iconSize={13} iconColor="#1A3A6B" />
                    <a href={`/api/files/${d.id}?download=1`} title="Télécharger" className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-80 transition-opacity shrink-0" style={{ backgroundColor: "rgba(26,58,107,0.08)" }}>
                      <Download size={13} style={{ color: "#1A3A6B" }} />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
