"use client";

import { useState, useEffect, useRef } from "react";
import { FolderOpen, Upload, Trash2, Download, Eye, Search, FileText, X, AlertCircle, CheckCircle2, FileDown } from "lucide-react";
import { exportDocumentsListPDF } from "@/lib/pdf";
import FileViewButton from "@/components/files/FileViewButton";

type Doc = {
  id: string; name: string; type: string; url: string;
  uploadedById: string; clientName: string; shipmentId: string | null;
  canDelete: boolean; createdAt: string;
};
type Client = { id: string; name: string };

// Types alignés sur l'enum DocumentType côté DB
const DOC_TYPES = ["INVOICE", "PRO_FORMA", "BILL_OF_LADING", "CUSTOMS_DECL", "CERTIFICATE", "PACKING_LIST", "OTHER"];
const DOC_LABELS: Record<string, string> = {
  INVOICE: "Facture", PRO_FORMA: "Facture pro forma", BILL_OF_LADING: "Connaissement",
  CUSTOMS_DECL: "Déclaration douanière", CERTIFICATE: "Certificat",
  PACKING_LIST: "Liste de colisage", OTHER: "Autre",
};
const TYPE_COLORS: Record<string, string> = {
  INVOICE: "#E8520A", PRO_FORMA: "#7c3aed", BILL_OF_LADING: "#1A3A6B",
  CUSTOMS_DECL: "#f59e0b", CERTIFICATE: "#10b981", PACKING_LIST: "#0e5f72", OTHER: "#6b7280",
};

export default function AgenceDocumentsPage() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [filterClient, setFilterClient] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [uploadClient, setUploadClient] = useState("");
  const [uploadType, setUploadType] = useState("OTHER");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Lire clientId depuis URL si navigué depuis liste clients
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const cid = p.get("clientId");
    if (cid) setFilterClient(cid);
  }, []);

  async function loadDocs() {
    const url = filterClient ? `/api/agence/documents?clientId=${filterClient}` : "/api/agence/documents";
    const r = await fetch(url);
    setDocs(r.ok ? await r.json() : []);
  }

  useEffect(() => {
    fetch("/api/agence/clients").then((r) => r.ok ? r.json() : []).then(setClients);
  }, []);

  useEffect(() => {
    setLoading(true);
    loadDocs().finally(() => setLoading(false));
  }, [filterClient]);

  const filtered = search
    ? docs.filter((d) => d.name.toLowerCase().includes(search.toLowerCase()) || d.clientName.toLowerCase().includes(search.toLowerCase()))
    : docs;

  async function handleUpload() {
    if (!uploadFile || !uploadClient) { setUploadError("Sélectionnez un fichier et un client."); return; }
    setUploading(true);
    setUploadError("");
    const fd = new FormData();
    fd.append("file", uploadFile);
    fd.append("clientId", uploadClient);
    fd.append("type", uploadType);
    const r = await fetch("/api/agence/documents", { method: "POST", body: fd });
    setUploading(false);
    if (!r.ok) { const d = await r.json(); setUploadError(d.error ?? "Erreur upload."); return; }
    setUploadSuccess(true);
    setUploadFile(null);
    setUploadClient("");
    setUploadType("OTHER");
    await loadDocs();
    setTimeout(() => { setUploadSuccess(false); setShowModal(false); }, 1500);
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce document ?")) return;
    await fetch(`/api/agence/documents/${id}`, { method: "DELETE" });
    setDocs((prev) => prev.filter((d) => d.id !== id));
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: "#0e5f72", fontFamily: "var(--font-montserrat)" }}>▪ Agence</p>
          <h1 className="text-2xl font-black uppercase" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>Documents</h1>
        </div>
        <div className="flex items-center gap-2">
          {filtered.length > 0 && (
            <button onClick={() => exportDocumentsListPDF(
              filtered.map((d) => ({
                name: d.name,
                type: DOC_LABELS[d.type] ?? d.type,
                createdAt: d.createdAt,
                owner: d.clientName,
              })),
              filterClient ? clients.find((c) => c.id === filterClient)?.name : undefined,
            )}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wide border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all"
              style={{ fontFamily: "var(--font-montserrat)" }}>
              <FileDown size={15} /> PDF
            </button>
          )}
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-white text-xs uppercase tracking-wide hover:opacity-90 transition-all"
            style={{ backgroundColor: "#0e5f72", fontFamily: "var(--font-montserrat)" }}>
            <Upload size={15} /> Ajouter un document
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#0e5f72] bg-white"
            style={{ fontFamily: "var(--font-lato)" }} />
        </div>
        <select value={filterClient} onChange={(e) => setFilterClient(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#0e5f72] bg-white"
          style={{ fontFamily: "var(--font-lato)" }}>
          <option value="">Tous les clients</option>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-white rounded-xl border border-gray-100 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <FolderOpen size={40} className="mx-auto text-gray-200 mb-4" />
          <p className="text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>Aucun document trouvé.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-50">
            {filtered.map((doc) => (
              <div key={doc.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${TYPE_COLORS[doc.type] ?? "#6b7280"}18` }}>
                  <FileText size={18} style={{ color: TYPE_COLORS[doc.type] ?? "#6b7280" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate text-gray-800" style={{ fontFamily: "var(--font-lato)" }}>{doc.name}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs font-black" style={{ color: TYPE_COLORS[doc.type] ?? "#6b7280", fontFamily: "var(--font-montserrat)" }}>{DOC_LABELS[doc.type] ?? doc.type}</span>
                    <span className="text-xs text-gray-400">·</span>
                    <span className="text-xs text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>{doc.clientName}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <FileViewButton docId={doc.id} name={doc.name}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-all cursor-pointer"
                    iconSize={15} iconColor="#6b7280" />
                  <a href={`/api/files/${doc.id}?download=1`} title="Télécharger"
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-[#0e5f72] hover:bg-gray-100 transition-all">
                    <Download size={15} />
                  </a>
                  {doc.canDelete && (
                    <button onClick={() => handleDelete(doc.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all">
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 z-10">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black uppercase text-sm" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>Ajouter un document</h3>
              <button onClick={() => setShowModal(false)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200">
                <X size={14} />
              </button>
            </div>

            {uploadError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100 mb-4">
                <AlertCircle size={14} className="text-red-500 shrink-0" />
                <p className="text-xs text-red-600" style={{ fontFamily: "var(--font-lato)" }}>{uploadError}</p>
              </div>
            )}
            {uploadSuccess && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 border border-green-100 mb-4">
                <CheckCircle2 size={14} className="text-green-500 shrink-0" />
                <p className="text-xs text-green-600" style={{ fontFamily: "var(--font-lato)" }}>Document ajouté avec succès !</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider mb-1.5 text-gray-600" style={{ fontFamily: "var(--font-montserrat)" }}>Client *</label>
                <select value={uploadClient} onChange={(e) => setUploadClient(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#0e5f72] bg-white"
                  style={{ fontFamily: "var(--font-lato)" }}>
                  <option value="">Sélectionner un client</option>
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-wider mb-1.5 text-gray-600" style={{ fontFamily: "var(--font-montserrat)" }}>Type de document</label>
                <select value={uploadType} onChange={(e) => setUploadType(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#0e5f72] bg-white"
                  style={{ fontFamily: "var(--font-lato)" }}>
                  {DOC_TYPES.map((t) => <option key={t} value={t}>{DOC_LABELS[t]}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-wider mb-1.5 text-gray-600" style={{ fontFamily: "var(--font-montserrat)" }}>Fichier *</label>
                <div
                  className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-[#0e5f72] transition-colors"
                  onClick={() => fileRef.current?.click()}>
                  <Upload size={24} className="mx-auto text-gray-300 mb-2" />
                  {uploadFile ? (
                    <p className="text-sm text-gray-700 font-medium" style={{ fontFamily: "var(--font-lato)" }}>{uploadFile.name}</p>
                  ) : (
                    <p className="text-sm text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>Cliquez pour sélectionner un fichier (max 20 Mo)</p>
                  )}
                  <input ref={fileRef} type="file" className="hidden" onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)} />
                </div>
              </div>
              <button onClick={handleUpload} disabled={uploading || !uploadFile || !uploadClient}
                className="w-full py-3 rounded-xl font-black text-white text-sm uppercase tracking-wide transition-all hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: "#0e5f72", fontFamily: "var(--font-montserrat)" }}>
                {uploading ? <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Envoyer le document"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
