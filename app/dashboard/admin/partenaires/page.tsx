"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import AdminHeader from "@/components/admin/AdminHeader";
import Modal from "@/components/admin/Modal";
import { Handshake, Plus, Pencil, Trash2, ChevronUp, ChevronDown, AlertCircle, Globe, Upload, Loader2 } from "lucide-react";
import { compressImage } from "@/lib/image-compress";

type Partner = {
  id: string; name: string; logoUrl: string; website: string | null;
  isActive: boolean; order: number; createdAt: string;
};

const labelCls = "block text-xs font-black uppercase tracking-wider mb-1.5 text-gray-600";
const inputCls = "w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#1A3A6B] focus:ring-2 focus:ring-[#1A3A6B]/10 transition-all bg-white";

const emptyForm = { name: "", logoUrl: "", website: "", isActive: true };

export default function PartenairesPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<Partner | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleLogoFile(file: File | null) {
    if (!file) return;
    setError("");
    setUploadingLogo(true);
    try {
      // Compression côté navigateur (logos → WebP, max 400 px). SVG laissé tel quel.
      const compressed = await compressImage(file, { maxSize: 400, quality: 0.85 });
      const fd = new FormData();
      fd.append("file", compressed);
      const r = await fetch("/api/admin/partners/logo", { method: "POST", body: fd });
      const data = await r.json();
      if (!r.ok) { setError(data.error ?? "Erreur lors de l'upload du logo."); return; }
      setForm((p) => ({ ...p, logoUrl: data.url }));
    } catch {
      setError("Impossible de traiter cette image.");
    } finally {
      setUploadingLogo(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  useEffect(() => {
    fetch("/api/admin/partners")
      .then(r => r.json())
      .then(setPartners)
      .finally(() => setLoading(false));
  }, []);

  function openCreate() {
    setForm(emptyForm); setEditing(null); setError("");
    setModal("create");
  }

  function openEdit(p: Partner) {
    setForm({ name: p.name, logoUrl: p.logoUrl, website: p.website ?? "", isActive: p.isActive });
    setEditing(p); setError("");
    setModal("edit");
  }

  async function save() {
    if (!form.name.trim()) { setError("Le nom du partenaire est obligatoire."); return; }
    if (!form.logoUrl) { setError("Veuillez charger un logo."); return; }
    setSaving(true); setError("");
    try {
      const url = editing ? `/api/admin/partners/${editing.id}` : "/api/admin/partners";
      const method = editing ? "PUT" : "POST";
      const payload = { ...form, order: editing ? editing.order : partners.length };
      const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await r.json();
      if (!r.ok) { setError(data.error ?? "Erreur"); return; }

      if (editing) {
        setPartners(prev => prev.map(p => p.id === editing.id ? { ...p, ...data } : p));
      } else {
        setPartners(prev => [...prev, data]);
      }
      setModal(null);
    } finally { setSaving(false); }
  }

  async function remove() {
    if (!deleteId) return;
    setSaving(true);
    try {
      const r = await fetch(`/api/admin/partners/${deleteId}`, { method: "DELETE" });
      if (r.ok) setPartners(prev => prev.filter(p => p.id !== deleteId));
      setDeleteId(null);
    } finally { setSaving(false); }
  }

  async function toggleActive(p: Partner) {
    const r = await fetch(`/api/admin/partners/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !p.isActive }),
    });
    if (r.ok) setPartners(prev => prev.map(x => x.id === p.id ? { ...x, isActive: !p.isActive } : x));
  }

  async function moveOrder(p: Partner, dir: "up" | "down") {
    const sorted = [...partners].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex(x => x.id === p.id);
    const swapIdx = dir === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    const a = sorted[idx], b = sorted[swapIdx];
    await Promise.all([
      fetch(`/api/admin/partners/${a.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order: b.order }) }),
      fetch(`/api/admin/partners/${b.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order: a.order }) }),
    ]);
    setPartners(prev => prev.map(x => {
      if (x.id === a.id) return { ...x, order: b.order };
      if (x.id === b.id) return { ...x, order: a.order };
      return x;
    }));
  }

  const sorted = [...partners].sort((a, b) => a.order - b.order);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <AdminHeader
        title="Partenaires"
        subtitle={`${partners.length} partenaire${partners.length > 1 ? "s" : ""}`}
        action={
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-xs font-black uppercase tracking-wide hover:opacity-90"
            style={{ backgroundColor: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}
          >
            <Plus size={15} /> Nouveau partenaire
          </button>
        }
      />

      <div className="flex-1 p-6">
        {loading ? (
          <div className="flex justify-center py-20"><span className="w-8 h-8 border-2 border-gray-200 border-t-[#1A3A6B] rounded-full animate-spin" /></div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-20">
            <Handshake size={36} className="mx-auto mb-3 text-gray-300" />
            <p className="text-gray-400 text-sm" style={{ fontFamily: "var(--font-lato)" }}>Aucun partenaire enregistré.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sorted.map((p, i) => (
              <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Logo preview */}
                <div className="relative h-28 bg-gray-50 flex items-center justify-center px-4">
                  <Image
                    src={p.logoUrl}
                    alt={p.name}
                    width={160} height={80}
                    className="object-contain max-h-16"
                    unoptimized={p.logoUrl.includes("placehold")}
                    onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/160x80/f3f4f6/9ca3af?text=Logo"; }}
                  />
                  {/* Active badge */}
                  <div className="absolute top-2 right-2">
                    <button
                      onClick={() => toggleActive(p)}
                      className="text-xs font-black px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: p.isActive ? "rgba(22,163,74,0.1)" : "rgba(156,163,175,0.15)",
                        color: p.isActive ? "#16a34a" : "#9ca3af",
                        fontFamily: "var(--font-montserrat)",
                      }}
                    >
                      {p.isActive ? "Actif" : "Inactif"}
                    </button>
                  </div>
                </div>

                <div className="p-4">
                  <p className="font-black text-sm truncate" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>{p.name}</p>
                  {p.website && (
                    <a href={p.website} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:text-[#E8520A] flex items-center gap-1 mt-0.5 truncate" style={{ fontFamily: "var(--font-lato)" }}>
                      <Globe size={11} /> {p.website.replace(/https?:\/\//, "")}
                    </a>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex gap-1">
                      <button onClick={() => moveOrder(p, "up")} disabled={i === 0} className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-100 disabled:opacity-30"><ChevronUp size={13} /></button>
                      <button onClick={() => moveOrder(p, "down")} disabled={i === sorted.length - 1} className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-100 disabled:opacity-30"><ChevronDown size={13} /></button>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(p)} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-[#1A3A6B] hover:bg-gray-100"><Pencil size={13} /></button>
                      <button onClick={() => setDeleteId(p.id)} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50"><Trash2 size={13} /></button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit modal */}
      <Modal open={modal !== null} onClose={() => setModal(null)} title={modal === "create" ? "Nouveau partenaire" : "Modifier le partenaire"}>
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100 mb-4">
            <AlertCircle size={14} className="text-red-500 shrink-0" />
            <p className="text-xs text-red-600" style={{ fontFamily: "var(--font-lato)" }}>{error}</p>
          </div>
        )}
        <div className="space-y-4">
          <div>
            <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>Nom du partenaire *</label>
            <input className={inputCls} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="DHL, CMA CGM..." style={{ fontFamily: "var(--font-lato)" }} />
          </div>
          <div>
            <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>Logo *</label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleLogoFile(e.target.files?.[0] ?? null)}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploadingLogo}
              className="w-full border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-[#1A3A6B] transition-colors flex flex-col items-center gap-2 disabled:opacity-60"
            >
              {uploadingLogo ? (
                <Loader2 size={22} className="animate-spin text-gray-400" />
              ) : (
                <Upload size={22} className="text-gray-300" />
              )}
              <span className="text-xs text-gray-500" style={{ fontFamily: "var(--font-lato)" }}>
                {uploadingLogo ? "Compression et envoi…" : "Choisir un logo depuis l'explorateur"}
              </span>
              <span className="text-[10px] text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>
                PNG, JPG, WebP ou SVG — compressé automatiquement
              </span>
            </button>
            {form.logoUrl && !uploadingLogo && (
              <div className="mt-2 p-2 bg-gray-50 rounded-xl flex items-center justify-center h-16">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.logoUrl} alt="Aperçu" className="max-h-12 max-w-full object-contain" />
              </div>
            )}
          </div>
          <div>
            <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>Site web</label>
            <input className={inputCls} value={form.website} onChange={e => setForm(p => ({ ...p, website: e.target.value }))} placeholder="https://www.exemple.com" style={{ fontFamily: "var(--font-lato)" }} />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} className="w-4 h-4 accent-[#1A3A6B]" />
            <span className="text-sm text-gray-600" style={{ fontFamily: "var(--font-lato)" }}>Afficher sur la page d'accueil</span>
          </label>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={() => setModal(null)} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-black text-gray-500" style={{ fontFamily: "var(--font-montserrat)" }}>Annuler</button>
          <button onClick={save} disabled={saving} className="flex-1 py-3 rounded-xl text-white text-sm font-black hover:opacity-90 disabled:opacity-60" style={{ backgroundColor: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </Modal>

      {/* Delete */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Supprimer le partenaire">
        <p className="text-sm text-gray-600 mb-6" style={{ fontFamily: "var(--font-lato)" }}>Ce partenaire sera supprimé définitivement.</p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteId(null)} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-black text-gray-500" style={{ fontFamily: "var(--font-montserrat)" }}>Annuler</button>
          <button onClick={remove} disabled={saving} className="flex-1 py-3 rounded-xl text-white text-sm font-black bg-red-500 hover:bg-red-600 disabled:opacity-60" style={{ fontFamily: "var(--font-montserrat)" }}>
            {saving ? "Suppression..." : "Supprimer"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
