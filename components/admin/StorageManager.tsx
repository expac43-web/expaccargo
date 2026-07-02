"use client";

import { useState, useEffect } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import Modal from "@/components/admin/Modal";
import {
  Warehouse, Plus, Pencil, Trash2, AlertCircle, MapPin,
  CalendarDays, CalendarClock, Eye,
} from "lucide-react";

type StorageStatus = "AWAITING" | "RELEASED";
type StorageItem = {
  id: string;
  reference: string;
  clientName: string | null;
  description: string | null;
  entryDate: string;
  expectedExitDate: string | null;
  status: StorageStatus;
  location: "BZV" | "PN";
  notes: string | null;
  agencyId: string | null;
};

const labelCls = "block text-xs font-black uppercase tracking-wider mb-1.5 text-gray-600";
const inputCls = "w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#1A3A6B] focus:ring-2 focus:ring-[#1A3A6B]/10 transition-all bg-white";

const LOCATION_LABEL: Record<string, string> = { BZV: "Brazzaville (BZV)", PN: "Pointe-Noire (PN)" };

/** Statut effectif affiché : « délai dépassé » calculé si la sortie prévue est passée. */
function effectiveStatus(item: StorageItem): "AWAITING" | "RELEASED" | "OVERDUE" {
  if (item.status === "RELEASED") return "RELEASED";
  if (item.expectedExitDate && new Date(item.expectedExitDate) < new Date()) return "OVERDUE";
  return "AWAITING";
}
const EFF_META = {
  AWAITING: { label: "En attente", color: "#b45309", bg: "rgba(245,158,11,0.12)" },
  OVERDUE: { label: "Délai dépassé", color: "#dc2626", bg: "rgba(220,38,38,0.1)" },
  RELEASED: { label: "Libéré", color: "#16a34a", bg: "rgba(22,163,74,0.12)" },
} as const;

function toDateInput(d: string | null) {
  if (!d) return "";
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? "" : dt.toISOString().slice(0, 10);
}
function fmt(d: string | null) {
  if (!d) return "—";
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? "—" : dt.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

const emptyForm = {
  reference: "", clientName: "", description: "",
  entryDate: new Date().toISOString().slice(0, 10),
  expectedExitDate: "", status: "AWAITING" as StorageStatus, location: "PN" as "BZV" | "PN", notes: "",
};

export default function StorageManager({
  canManageAll = true,
  myAgencyId = null,
}: {
  canManageAll?: boolean;
  myAgencyId?: string | null;
}) {
  const [items, setItems] = useState<StorageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "AWAITING" | "OVERDUE" | "RELEASED">("ALL");

  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<StorageItem | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/storage")
      .then((r) => r.json())
      .then((d) => setItems(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, []);

  const counts = {
    AWAITING: items.filter((i) => effectiveStatus(i) === "AWAITING").length,
    OVERDUE: items.filter((i) => effectiveStatus(i) === "OVERDUE").length,
    RELEASED: items.filter((i) => effectiveStatus(i) === "RELEASED").length,
  };
  const shown = filter === "ALL" ? items : items.filter((i) => effectiveStatus(i) === filter);

  // Droit d'écriture : admin/gérant partout ; un agent seulement sur les colis de son agence.
  const canWrite = (it: StorageItem) => canManageAll || (!!myAgencyId && it.agencyId === myAgencyId);

  function openCreate() {
    setForm(emptyForm); setEditing(null); setError(""); setModal("create");
  }
  function openEdit(it: StorageItem) {
    setForm({
      reference: it.reference, clientName: it.clientName ?? "", description: it.description ?? "",
      entryDate: toDateInput(it.entryDate), expectedExitDate: toDateInput(it.expectedExitDate),
      status: it.status, location: it.location, notes: it.notes ?? "",
    });
    setEditing(it); setError(""); setModal("edit");
  }

  async function save() {
    if (!form.reference.trim()) { setError("La référence est obligatoire."); return; }
    if (!form.entryDate) { setError("La date d'entrée est obligatoire."); return; }
    setSaving(true); setError("");
    try {
      const url = editing ? `/api/admin/storage/${editing.id}` : "/api/admin/storage";
      const method = editing ? "PATCH" : "POST";
      const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await r.json();
      if (!r.ok) { setError(data.error ?? "Erreur"); return; }
      if (editing) setItems((prev) => prev.map((x) => (x.id === editing.id ? { ...x, ...data } : x)));
      else setItems((prev) => [data, ...prev]);
      setModal(null);
    } finally { setSaving(false); }
  }

  async function remove() {
    if (!deleteId) return;
    setSaving(true);
    try {
      const r = await fetch(`/api/admin/storage/${deleteId}`, { method: "DELETE" });
      if (r.ok) setItems((prev) => prev.filter((x) => x.id !== deleteId));
      setDeleteId(null);
    } finally { setSaving(false); }
  }

  const tabs: { key: typeof filter; label: string }[] = [
    { key: "ALL", label: "Tous" },
    { key: "AWAITING", label: `En attente (${counts.AWAITING})` },
    { key: "OVERDUE", label: `Délai dépassé (${counts.OVERDUE})` },
    { key: "RELEASED", label: `Libérés (${counts.RELEASED})` },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <AdminHeader
        title="Stockage"
        subtitle={`${items.length} colis · ${counts.OVERDUE} en dépassement`}
        action={
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-xs font-black uppercase tracking-wide hover:opacity-90"
            style={{ backgroundColor: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}
          >
            <Plus size={15} /> Nouveau colis
          </button>
        }
      />

      <div className="flex-1 p-4 sm:p-6">
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map((t) => {
            const active = filter === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setFilter(t.key)}
                className="px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wide transition-all"
                style={{
                  fontFamily: "var(--font-montserrat)",
                  backgroundColor: active ? "#1A3A6B" : "white",
                  color: active ? "white" : "#6b7280",
                  border: active ? "2px solid #1A3A6B" : "2px solid #e5e7eb",
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><span className="w-8 h-8 border-2 border-gray-200 border-t-[#1A3A6B] rounded-full animate-spin" /></div>
        ) : shown.length === 0 ? (
          <div className="text-center py-20">
            <Warehouse size={36} className="mx-auto mb-3 text-gray-300" />
            <p className="text-gray-400 text-sm" style={{ fontFamily: "var(--font-lato)" }}>Aucun colis dans cette catégorie.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {shown.map((it) => {
              const eff = effectiveStatus(it);
              const sm = EFF_META[eff];
              return (
                <div key={it.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <p className="font-black text-base truncate" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>{it.reference}</p>
                      {it.clientName && <p className="text-xs text-gray-500 truncate" style={{ fontFamily: "var(--font-lato)" }}>{it.clientName}</p>}
                    </div>
                    <span className="text-[10px] font-black px-2 py-1 rounded-full shrink-0" style={{ backgroundColor: sm.bg, color: sm.color, fontFamily: "var(--font-montserrat)" }}>{sm.label}</span>
                  </div>

                  {it.description && <p className="text-sm text-gray-600 mb-3 leading-relaxed" style={{ fontFamily: "var(--font-lato)" }}>{it.description}</p>}

                  <div className="grid grid-cols-2 gap-2 text-xs mb-3" style={{ fontFamily: "var(--font-lato)" }}>
                    <div className="flex items-center gap-1.5 text-gray-500"><CalendarDays size={13} style={{ color: "#1A3A6B" }} /> Entrée : {fmt(it.entryDate)}</div>
                    <div className="flex items-center gap-1.5 text-gray-500"><CalendarClock size={13} style={{ color: "#E8520A" }} /> Sortie : {fmt(it.expectedExitDate)}</div>
                    <div className="flex items-center gap-1.5 text-gray-500 col-span-2"><MapPin size={13} style={{ color: "#1A3A6B" }} /> {LOCATION_LABEL[it.location]}</div>
                  </div>

                  {it.notes && <p className="text-xs text-gray-400 italic mb-3" style={{ fontFamily: "var(--font-lato)" }}>{it.notes}</p>}

                  <div className="flex items-center justify-end gap-1 mt-auto pt-3 border-t border-gray-100">
                    {canWrite(it) ? (
                      <>
                        <button onClick={() => openEdit(it)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-black uppercase text-gray-500 hover:text-[#1A3A6B] hover:bg-gray-100" style={{ fontFamily: "var(--font-montserrat)" }}><Pencil size={13} /> Modifier</button>
                        <button onClick={() => setDeleteId(it.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50"><Trash2 size={14} /></button>
                      </>
                    ) : (
                      <span className="flex items-center gap-1.5 text-[11px] text-gray-400 uppercase font-black" style={{ fontFamily: "var(--font-montserrat)" }}><Eye size={13} /> Lecture seule</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create / Edit */}
      <Modal open={modal !== null} onClose={() => setModal(null)} title={modal === "create" ? "Nouveau colis stocké" : "Modifier le colis"}>
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100 mb-4">
            <AlertCircle size={14} className="text-red-500 shrink-0" />
            <p className="text-xs text-red-600" style={{ fontFamily: "var(--font-lato)" }}>{error}</p>
          </div>
        )}
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>Référence *</label>
              <input className={inputCls} value={form.reference} onChange={(e) => setForm((p) => ({ ...p, reference: e.target.value }))} placeholder="STK-2026-0001" style={{ fontFamily: "var(--font-lato)" }} />
            </div>
            <div>
              <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>Client</label>
              <input className={inputCls} value={form.clientName} onChange={(e) => setForm((p) => ({ ...p, clientName: e.target.value }))} placeholder="Nom du client" style={{ fontFamily: "var(--font-lato)" }} />
            </div>
          </div>
          <div>
            <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>Description de la marchandise</label>
            <input className={inputCls} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Ex : 2 cartons, 1 palette…" style={{ fontFamily: "var(--font-lato)" }} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>Date d'entrée *</label>
              <input type="date" className={inputCls} value={form.entryDate} onChange={(e) => setForm((p) => ({ ...p, entryDate: e.target.value }))} style={{ fontFamily: "var(--font-lato)" }} />
            </div>
            <div>
              <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>Sortie prévue</label>
              <input type="date" className={inputCls} value={form.expectedExitDate} onChange={(e) => setForm((p) => ({ ...p, expectedExitDate: e.target.value }))} style={{ fontFamily: "var(--font-lato)" }} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>Statut</label>
              <select className={inputCls} value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as StorageStatus }))} style={{ fontFamily: "var(--font-lato)" }}>
                <option value="AWAITING">En attente de libération</option>
                <option value="RELEASED">Libéré</option>
              </select>
            </div>
            <div>
              <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>Lieu de stockage</label>
              <select className={inputCls} value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value as "BZV" | "PN" }))} style={{ fontFamily: "var(--font-lato)" }}>
                <option value="PN">Pointe-Noire (PN)</option>
                <option value="BZV">Brazzaville (BZV)</option>
              </select>
            </div>
          </div>
          <div>
            <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>Remarques</label>
            <textarea rows={3} className={`${inputCls} resize-none`} value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Informations complémentaires…" style={{ fontFamily: "var(--font-lato)" }} />
          </div>
          <p className="text-xs text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>Le statut « délai dépassé » est calculé automatiquement quand la sortie prévue est passée.</p>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={() => setModal(null)} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-black text-gray-500" style={{ fontFamily: "var(--font-montserrat)" }}>Annuler</button>
          <button onClick={save} disabled={saving} className="flex-1 py-3 rounded-xl text-white text-sm font-black hover:opacity-90 disabled:opacity-60" style={{ backgroundColor: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </Modal>

      {/* Delete */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Supprimer le colis">
        <p className="text-sm text-gray-600 mb-6" style={{ fontFamily: "var(--font-lato)" }}>Cet enregistrement sera supprimé définitivement.</p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteId(null)} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-black text-gray-500" style={{ fontFamily: "var(--font-montserrat)" }}>Annuler</button>
          <button onClick={remove} disabled={saving} className="flex-1 py-3 rounded-xl text-white text-sm font-black bg-red-500 hover:bg-red-600 disabled:opacity-60" style={{ fontFamily: "var(--font-montserrat)" }}>Supprimer</button>
        </div>
      </Modal>
    </div>
  );
}
