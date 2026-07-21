"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import Pagination from "@/components/admin/Pagination";

const PAGE_SIZE = 12;
import {
  Users, Search, FileText, Upload, Trash2, Eye, Download,
  X, AlertCircle, CheckCircle2, Loader2, FolderLock,
} from "lucide-react";

type Staff = { id: string; name: string; email: string; role: string; agencyId: string | null };
type Doc = { id: string; name: string; type: string; url: string; createdAt: string };

const ROLE_LABELS: Record<string, string> = { MANAGER: "Gérant", AGENCY: "Agent", SUPER_ADMIN: "Super admin" };
const DOC_TYPES = ["OTHER", "CERTIFICATE", "INVOICE", "PRO_FORMA", "CUSTOMS_DECL", "PACKING_LIST", "BILL_OF_LADING"];
const DOC_LABELS: Record<string, string> = {
  OTHER: "Document", CERTIFICATE: "Certificat", INVOICE: "Facture", PRO_FORMA: "Facture pro forma",
  CUSTOMS_DECL: "Déclaration douanière", PACKING_LIST: "Liste de colisage", BILL_OF_LADING: "Connaissement",
};

export default function DocumentsInternesPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string>("");
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [uploadType, setUploadType] = useState("OTHER");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTargets, setUploadTargets] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Liste des membres de l'équipe (hors clients).
  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => (r.ok ? r.json() : []))
      .then((d: Staff[]) => setStaff(Array.isArray(d) ? d.filter((u) => u.role === "AGENCY" || u.role === "MANAGER") : []))
      .catch(() => setStaff([]));
  }, []);

  const selected = useMemo(() => staff.find((s) => s.id === selectedId) ?? null, [staff, selectedId]);

  const loadDocs = useMemo(
    () => (staffId: string) => {
      setLoadingDocs(true);
      fetch(`/api/admin/documents?clientId=${staffId}`)
        .then((r) => (r.ok ? r.json() : []))
        .then((d) => setDocs(Array.isArray(d) ? d : []))
        .catch(() => setDocs([]))
        .finally(() => setLoadingDocs(false));
    },
    []
  );

  function selectStaff(id: string) {
    setSelectedId(id);
    setDocs([]);
    loadDocs(id);
  }

  /** Ouvre la fenêtre de dépôt avec une présélection de destinataires. */
  function openUploadModal(targets: string[]) {
    setUploadTargets(targets);
    setUploadFile(null);
    setUploadType("OTHER");
    setError("");
    setSuccess(false);
    setShowModal(true);
  }

  function toggleTarget(id: string) {
    setUploadTargets((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!uploadFile) { setError("Sélectionnez un fichier."); return; }
    if (uploadTargets.length === 0) { setError("Sélectionnez au moins un destinataire."); return; }
    setUploading(true);
    setError("");
    setSuccess(false);
    try {
      // Le fichier n'est envoyé qu'une fois : l'API crée une ligne par destinataire.
      const fd = new FormData();
      fd.append("file", uploadFile);
      fd.append("type", uploadType);
      fd.append("staffIds", JSON.stringify(uploadTargets));
      const r = await fetch("/api/admin/internal-documents", { method: "POST", body: fd });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "Échec de l'envoi.");
      setSuccess(true);
      setUploadFile(null);
      if (fileRef.current) fileRef.current.value = "";
      if (selectedId) loadDocs(selectedId);
      setTimeout(() => { setShowModal(false); setSuccess(false); }, 1100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce document ?")) return;
    const r = await fetch(`/api/admin/documents/${id}`, { method: "DELETE" });
    if (r.ok) setDocs((d) => d.filter((x) => x.id !== id));
  }

  const filtered = staff.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase()));
  const pagedStaff = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <AdminHeader
        title="Documents internes"
        subtitle="Documents mis à disposition de chaque membre de l'équipe"
        action={
          <button
            onClick={() => openUploadModal(staff.map((s) => s.id))}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-xs font-black uppercase tracking-wide hover:opacity-90 transition-all"
            style={{ backgroundColor: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}
          >
            <Users size={15} /> Déposer pour plusieurs
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne membres */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="relative mb-3">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Rechercher un membre…"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#1A3A6B]"
                  style={{ fontFamily: "var(--font-lato)" }}
                />
              </div>
              <div className="space-y-1 max-h-[60vh] overflow-y-auto">
                {filtered.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-6" style={{ fontFamily: "var(--font-lato)" }}>Aucun membre.</p>
                ) : (
                  pagedStaff.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => selectStaff(s.id)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors"
                      style={{ backgroundColor: selectedId === s.id ? "rgba(26,58,107,0.08)" : "transparent" }}
                    >
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white text-xs font-black" style={{ backgroundColor: s.role === "MANAGER" ? "#1A3A6B" : "#0e5f72", fontFamily: "var(--font-montserrat)" }}>
                        {s.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black truncate" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>{s.name}</p>
                        <p className="text-xs text-gray-400 truncate" style={{ fontFamily: "var(--font-lato)" }}>{ROLE_LABELS[s.role] ?? s.role}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
              <Pagination page={page} total={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} />
            </div>
          </div>

          {/* Colonne documents */}
          <div className="lg:col-span-2">
            {!selected ? (
              <div className="bg-white rounded-2xl border border-gray-100 text-center py-20">
                <Users size={34} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-400 text-sm" style={{ fontFamily: "var(--font-lato)" }}>Sélectionnez un membre pour gérer ses documents.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex items-center justify-between gap-3 mb-5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #0e2248 0%, #1A3A6B 100%)" }}>
                      <FolderLock size={18} color="white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-black truncate" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>{selected.name}</p>
                      <p className="text-xs text-gray-400 truncate" style={{ fontFamily: "var(--font-lato)" }}>{selected.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => openUploadModal(selectedId ? [selectedId] : [])}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-xs font-black uppercase tracking-wide hover:opacity-90 transition-all shrink-0"
                    style={{ backgroundColor: "#E8520A", fontFamily: "var(--font-montserrat)" }}
                  >
                    <Upload size={15} /> Ajouter
                  </button>
                </div>

                {loadingDocs ? (
                  <div className="flex items-center justify-center py-16 text-gray-400"><Loader2 size={22} className="animate-spin" /></div>
                ) : docs.length === 0 ? (
                  <div className="text-center py-16">
                    <FileText size={30} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-400 text-sm" style={{ fontFamily: "var(--font-lato)" }}>Aucun document pour ce membre.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {docs.map((d) => (
                      <div key={d.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-gray-50 text-gray-500"><FileText size={17} /></div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold truncate" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>{d.name}</p>
                          <p className="text-xs text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>{DOC_LABELS[d.type] ?? d.type} · {new Date(d.createdAt).toLocaleDateString("fr-FR")}</p>
                        </div>
                        <a href={d.url} target="_blank" rel="noopener noreferrer" title="Ouvrir" className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-[#1A3A6B]"><Eye size={16} /></a>
                        <a href={d.url} download title="Télécharger" className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-[#1A3A6B]"><Download size={16} /></a>
                        <button onClick={() => handleDelete(d.id)} title="Supprimer" className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500"><Trash2 size={16} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal d'upload */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => !uploading && setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-black" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>Ajouter un document</h3>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"><X size={18} /></button>
            </div>
            {/* Destinataires : un seul envoi de fichier, plusieurs bénéficiaires */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-black uppercase tracking-wider" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
                  Destinataires ({uploadTargets.length}/{staff.length})
                </label>
                <button
                  type="button"
                  onClick={() => setUploadTargets(uploadTargets.length === staff.length ? [] : staff.map((s) => s.id))}
                  className="text-xs font-black uppercase tracking-wide hover:opacity-80"
                  style={{ color: "#E8520A", fontFamily: "var(--font-montserrat)" }}
                >
                  {uploadTargets.length === staff.length ? "Tout désélectionner" : "Tout sélectionner"}
                </button>
              </div>
              <div className="max-h-40 overflow-y-auto rounded-xl border border-gray-200 divide-y divide-gray-100">
                {staff.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4" style={{ fontFamily: "var(--font-lato)" }}>Aucun membre.</p>
                ) : (
                  staff.map((s) => (
                    <label key={s.id} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={uploadTargets.includes(s.id)}
                        onChange={() => toggleTarget(s.id)}
                        className="w-4 h-4 accent-[#E8520A] shrink-0"
                      />
                      <span className="text-sm truncate" style={{ fontFamily: "var(--font-lato)" }}>{s.name}</span>
                      <span className="ml-auto text-xs text-gray-400 shrink-0">{ROLE_LABELS[s.role] ?? s.role}</span>
                    </label>
                  ))
                )}
              </div>
              <p className="text-xs text-gray-400 mt-2" style={{ fontFamily: "var(--font-lato)" }}>
                Le fichier n&apos;est envoyé qu&apos;une seule fois, puis partagé avec chaque destinataire.
              </p>
            </div>

            {error && <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-100 mb-4"><AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" /><p className="text-xs text-red-600">{error}</p></div>}
            {success && <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 border border-green-100 mb-4"><CheckCircle2 size={15} className="text-green-600 shrink-0" /><p className="text-xs text-green-700">Document ajouté pour {uploadTargets.length} membre{uploadTargets.length > 1 ? "s" : ""}.</p></div>}

            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider mb-2" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>Type</label>
                <select value={uploadType} onChange={(e) => setUploadType(e.target.value)} className="w-full px-3 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#1A3A6B]" style={{ fontFamily: "var(--font-lato)" }}>
                  {DOC_TYPES.map((t) => <option key={t} value={t}>{DOC_LABELS[t] ?? t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-wider mb-2" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>Fichier (max 20 Mo)</label>
                <input ref={fileRef} type="file" onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)} className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-black file:bg-gray-100 file:text-[#1A3A6B]" style={{ fontFamily: "var(--font-lato)" }} />
              </div>
              <button type="submit" disabled={uploading || !uploadFile} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-black text-white text-sm uppercase tracking-wide transition-all hover:opacity-90 disabled:opacity-60" style={{ backgroundColor: "#E8520A", fontFamily: "var(--font-montserrat)" }}>
                {uploading ? <Loader2 size={16} className="animate-spin" /> : <><Upload size={16} /> Envoyer</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
