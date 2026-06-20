"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  FolderOpen, Upload, Trash2, Download, FileText, Eye,
  AlertCircle, CheckCircle2, Loader2, ChevronDown, X, Package, FileDown,
} from "lucide-react";
import { exportDocumentsListPDF } from "@/lib/pdf";
import FileViewButton from "@/components/files/FileViewButton";
import { useT } from "@/components/i18n/LanguageProvider";

type Doc = {
  id: string; name: string; type: string; url: string;
  shipmentId: string | null; createdAt: string; canDelete?: boolean;
};

type Shipment = { id: string; reference: string; origin: string; destination: string };

const DOC_TYPE_COLORS: Record<string, string> = {
  INVOICE:           "#1A3A6B",
  PRO_FORMA:         "#7c3aed",
  BILL_OF_LADING:    "#0891b2",
  CUSTOMS_DECL:      "#d97706",
  CERTIFICATE:       "#16a34a",
  PACKING_LIST:      "#E8520A",
  OTHER:             "#6b7280",
};

const ACCEPTED = ".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.zip";

function DocTypeBadge({ type }: { type: string }) {
  const { t } = useT();
  const color = DOC_TYPE_COLORS[type] ?? "#6b7280";
  const label = (t.documentTypes as Record<string, string>)[type] ?? type;
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-black"
      style={{ backgroundColor: `${color}15`, color, fontFamily: "var(--font-montserrat)" }}
    >
      {label}
    </span>
  );
}

function FileIcon({ name }: { name: string }) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const colorMap: Record<string, string> = {
    pdf: "#dc2626", jpg: "#d97706", jpeg: "#d97706", png: "#0891b2",
    doc: "#2563eb", docx: "#2563eb", xls: "#16a34a", xlsx: "#16a34a",
    zip: "#7c3aed",
  };
  const color = colorMap[ext] ?? "#6b7280";
  return (
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
      style={{ backgroundColor: `${color}15` }}
    >
      <FileText size={18} style={{ color }} />
    </div>
  );
}

export default function DocumentsPage() {
  const { t, locale } = useT();
  const dd = t.dashboard.docs;
  const dl = locale === "en" ? "en-US" : "fr-FR";
  const dt = (code: string) => (t.documentTypes as Record<string, string>)[code] ?? code;
  const [docs, setDocs] = useState<Doc[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterShipment, setFilterShipment] = useState<string>("ALL");

  // Upload state
  const [showUpload, setShowUpload] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState("INVOICE");
  const [uploadShipmentId, setUploadShipmentId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadDocs = useCallback(async () => {
    const qs = filterShipment !== "ALL" ? `?shipmentId=${filterShipment}` : "";
    const r = await fetch(`/api/client/documents${qs}`);
    if (r.ok) setDocs(await r.json());
  }, [filterShipment]);

  useEffect(() => {
    Promise.all([
      fetch("/api/client/shipments").then((r) => r.json()),
    ]).then(([s]) => {
      setShipments(Array.isArray(s) ? s : []);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadDocs();
  }, [loadDocs]);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) setUploadFile(f);
  }

  async function doUpload() {
    if (!uploadFile || !uploadType) return;
    setUploading(true);
    setUploadError("");
    try {
      const fd = new FormData();
      fd.append("file", uploadFile);
      fd.append("type", uploadType);
      if (uploadShipmentId) fd.append("shipmentId", uploadShipmentId);

      const r = await fetch("/api/client/documents", { method: "POST", body: fd });
      if (!r.ok) {
        const d = await r.json();
        setUploadError(d.error ?? dd.uploadError);
        return;
      }
      setUploadSuccess(true);
      setUploadFile(null);
      setUploadType("INVOICE");
      setUploadShipmentId("");
      setTimeout(() => {
        setShowUpload(false);
        setUploadSuccess(false);
      }, 1500);
      await loadDocs();
    } finally {
      setUploading(false);
    }
  }

  async function deleteDoc(id: string) {
    setDeletingId(id);
    try {
      await fetch(`/api/client/documents/${id}`, { method: "DELETE" });
      setDocs((prev) => prev.filter((d) => d.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  const filtered = filterShipment === "ALL"
    ? docs
    : docs.filter((d) => d.shipmentId === filterShipment);

  return (
    <div className="flex-1 overflow-auto">
      {/* Header */}
      <div
        className="px-6 lg:px-8 pt-8 pb-8"
        style={{ background: "linear-gradient(135deg, #0e2248 0%, #1A3A6B 100%)" }}
      >
        <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: "#fba563", fontFamily: "var(--font-montserrat)" }}>
          ▪ {dd.eyebrow}
        </p>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white" style={{ fontFamily: "var(--font-montserrat)" }}>
              {dd.title}
            </h1>
            <p className="text-blue-200 text-sm mt-1" style={{ fontFamily: "var(--font-lato)" }}>
              {dd.subtitle}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {filtered.length > 0 && (
              <button
                onClick={() => exportDocumentsListPDF(
                  filtered.map((d) => ({
                    name: d.name,
                    type: dt(d.type),
                    createdAt: d.createdAt,
                  })),
                  filterShipment !== "ALL"
                    ? shipments.find((s) => s.id === filterShipment)?.reference
                    : undefined,
                )}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black uppercase text-white transition-opacity hover:opacity-80"
                style={{ backgroundColor: "rgba(255,255,255,0.12)", fontFamily: "var(--font-montserrat)" }}
              >
                <FileDown size={15} />
                <span className="hidden sm:inline">PDF</span>
              </button>
            )}
            <button
              onClick={() => { setShowUpload(true); setUploadError(""); setUploadSuccess(false); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black uppercase text-white transition-opacity hover:opacity-80"
              style={{ backgroundColor: "#E8520A", fontFamily: "var(--font-montserrat)" }}
            >
              <Upload size={15} />
              {dd.deposit}
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 lg:px-8 py-6">
        {/* Filters */}
        {shipments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            <button
              onClick={() => setFilterShipment("ALL")}
              className="px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all"
              style={{
                fontFamily: "var(--font-montserrat)",
                backgroundColor: filterShipment === "ALL" ? "#1A3A6B" : "rgba(26,58,107,0.06)",
                color: filterShipment === "ALL" ? "#fff" : "#1A3A6B",
              }}
            >
              {dd.all}
            </button>
            {shipments.map((s) => (
              <button
                key={s.id}
                onClick={() => setFilterShipment(s.id)}
                className="px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all"
                style={{
                  fontFamily: "var(--font-montserrat)",
                  backgroundColor: filterShipment === s.id ? "#1A3A6B" : "rgba(26,58,107,0.06)",
                  color: filterShipment === s.id ? "#fff" : "#1A3A6B",
                }}
              >
                {s.reference}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 size={28} className="animate-spin" style={{ color: "#1A3A6B" }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: "rgba(124,58,237,0.08)" }}>
              <FolderOpen size={28} style={{ color: "#7c3aed" }} />
            </div>
            <p className="font-black uppercase text-sm mb-1" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
              {dd.none}
            </p>
            <p className="text-xs text-gray-400 max-w-xs" style={{ fontFamily: "var(--font-lato)" }}>
              {dd.noneHint}
            </p>
            <button
              onClick={() => setShowUpload(true)}
              className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase text-white transition-opacity hover:opacity-80"
              style={{ backgroundColor: "#7c3aed", fontFamily: "var(--font-montserrat)" }}
            >
              <Upload size={13} />
              {dd.depositDoc}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((doc) => {
              const shipment = shipments.find((s) => s.id === doc.shipmentId);
              return (
                <div
                  key={doc.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4 hover:shadow-md hover:border-gray-200 transition-all group"
                >
                  <FileIcon name={doc.name} />
                  <div className="flex-1 min-w-0">
                    <p
                      className="font-black text-sm truncate"
                      style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}
                    >
                      {doc.name}
                    </p>
                    <div className="flex items-center flex-wrap gap-2 mt-1">
                      <DocTypeBadge type={doc.type} />
                      {shipment && (
                        <span className="flex items-center gap-1 text-xs text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>
                          <Package size={10} />
                          {shipment.reference}
                        </span>
                      )}
                      <span className="text-xs text-gray-300">
                        {new Date(doc.createdAt).toLocaleDateString(dl)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <FileViewButton
                      docId={doc.id}
                      name={doc.name}
                      className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-80 transition-opacity cursor-pointer"
                      style={{ backgroundColor: "rgba(26,58,107,0.08)" }}
                      iconSize={14}
                      iconColor="#1A3A6B"
                    />
                    <a
                      href={`/api/files/${doc.id}?download=1`}
                      className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-80 transition-opacity"
                      style={{ backgroundColor: "rgba(26,58,107,0.08)" }}
                      title={dd.download}
                    >
                      <Download size={14} style={{ color: "#1A3A6B" }} />
                    </a>
                    {doc.canDelete && (
                      <button
                        onClick={() => deleteDoc(doc.id)}
                        disabled={deletingId === doc.id}
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-80 transition-opacity disabled:opacity-50"
                        style={{ backgroundColor: "rgba(220,38,38,0.08)" }}
                        title={dd.delete}
                      >
                        {deletingId === doc.id
                          ? <Loader2 size={13} className="animate-spin text-red-500" />
                          : <Trash2 size={13} style={{ color: "#dc2626" }} />}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upload modal */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-black uppercase text-sm" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
                {dd.modalTitle}
              </h2>
              <button
                onClick={() => setShowUpload(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {uploadSuccess ? (
                <div className="flex flex-col items-center py-6 text-center">
                  <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mb-3">
                    <CheckCircle2 size={28} className="text-green-500" />
                  </div>
                  <p className="font-black text-sm" style={{ color: "#16a34a", fontFamily: "var(--font-montserrat)" }}>
                    {dd.sentTitle}
                  </p>
                </div>
              ) : (
                <>
                  {uploadError && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100">
                      <AlertCircle size={14} className="text-red-500 shrink-0" />
                      <p className="text-xs text-red-600" style={{ fontFamily: "var(--font-lato)" }}>{uploadError}</p>
                    </div>
                  )}

                  {/* Drop zone */}
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all"
                    style={{
                      borderColor: dragOver ? "#1A3A6B" : uploadFile ? "#16a34a" : "#e5e7eb",
                      backgroundColor: dragOver ? "rgba(26,58,107,0.04)" : uploadFile ? "rgba(22,163,74,0.04)" : "#fafafa",
                    }}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={ACCEPTED}
                      className="hidden"
                      onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                    />
                    {uploadFile ? (
                      <div className="flex items-center justify-center gap-3">
                        <FileIcon name={uploadFile.name} />
                        <div className="text-left">
                          <p className="font-black text-sm" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
                            {uploadFile.name}
                          </p>
                          <p className="text-xs text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>
                            {(uploadFile.size / 1024 / 1024).toFixed(2)} {dd.sizeMb}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Upload size={24} className="mx-auto mb-2 text-gray-300" />
                        <p className="font-black text-sm text-gray-600" style={{ fontFamily: "var(--font-montserrat)" }}>
                          {dd.dropTitle}
                        </p>
                        <p className="text-xs text-gray-400 mt-1" style={{ fontFamily: "var(--font-lato)" }}>
                          {dd.dropHint}
                        </p>
                      </>
                    )}
                  </div>

                  {/* Type select */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider mb-1.5 text-gray-600" style={{ fontFamily: "var(--font-montserrat)" }}>
                      {dd.typeLabel}
                    </label>
                    <select
                      value={uploadType}
                      onChange={(e) => setUploadType(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#1A3A6B] focus:ring-2 focus:ring-[#1A3A6B]/10 bg-white"
                      style={{ fontFamily: "var(--font-lato)" }}
                    >
                      {Object.entries(t.documentTypes).map(([v, l]) => (
                        <option key={v} value={v}>{l}</option>
                      ))}
                    </select>
                  </div>

                  {/* Shipment select */}
                  {shipments.length > 0 && (
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider mb-1.5 text-gray-600" style={{ fontFamily: "var(--font-montserrat)" }}>
                        {dd.linkShipment}
                      </label>
                      <select
                        value={uploadShipmentId}
                        onChange={(e) => setUploadShipmentId(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#1A3A6B] focus:ring-2 focus:ring-[#1A3A6B]/10 bg-white"
                        style={{ fontFamily: "var(--font-lato)" }}
                      >
                        <option value="">{dd.noShipment}</option>
                        {shipments.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.reference} ({s.origin} → {s.destination})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setShowUpload(false)}
                      className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-black uppercase text-gray-600 hover:bg-gray-50 transition-colors"
                      style={{ fontFamily: "var(--font-montserrat)" }}
                    >
                      {dd.cancel}
                    </button>
                    <button
                      onClick={doUpload}
                      disabled={!uploadFile || uploading}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-black uppercase transition-opacity hover:opacity-80 disabled:opacity-50"
                      style={{ backgroundColor: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}
                    >
                      {uploading && <Loader2 size={14} className="animate-spin" />}
                      {uploading ? dd.uploading : dd.send}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
