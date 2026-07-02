"use client";

import { useState, useEffect } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import Modal from "@/components/admin/Modal";
import {
  MessageSquareQuote, Plus, Star, Check, X, Trash2,
  AlertCircle, CheckCircle2, Loader2,
} from "lucide-react";

type CommentStatus = "PENDING" | "APPROVED" | "REJECTED";
type Comment = {
  id: string;
  userId: string | null;
  authorName: string;
  authorRole: string | null;
  rating: number | null;
  content: string;
  status: CommentStatus;
  createdAt: string;
  moderatedById: string | null;
  moderatedAt: string | null;
};

const labelCls = "block text-xs font-black uppercase tracking-wider mb-1.5 text-gray-600";
const inputCls = "w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#1A3A6B] focus:ring-2 focus:ring-[#1A3A6B]/10 transition-all bg-white";

const STATUS_META: Record<CommentStatus, { label: string; color: string; bg: string }> = {
  PENDING: { label: "En attente", color: "#b45309", bg: "rgba(245,158,11,0.12)" },
  APPROVED: { label: "Publié", color: "#16a34a", bg: "rgba(22,163,74,0.12)" },
  REJECTED: { label: "Rejeté", color: "#9ca3af", bg: "rgba(156,163,175,0.15)" },
};

const emptyForm = { authorName: "", authorRole: "", rating: 5, content: "" };

function Stars({ value, onChange }: { value: number; onChange?: (n: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(n)}
          className={onChange ? "cursor-pointer" : "cursor-default"}
        >
          <Star
            size={onChange ? 22 : 14}
            style={{ color: "#E8520A" }}
            fill={n <= value ? "#E8520A" : "none"}
          />
        </button>
      ))}
    </div>
  );
}

export default function CommentsManager() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<CommentStatus | "ALL">("PENDING");
  const [actioning, setActioning] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/comments")
      .then((r) => r.json())
      .then((d) => setComments(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, []);

  const counts = {
    PENDING: comments.filter((c) => c.status === "PENDING").length,
    APPROVED: comments.filter((c) => c.status === "APPROVED").length,
    REJECTED: comments.filter((c) => c.status === "REJECTED").length,
  };
  const shown = filter === "ALL" ? comments : comments.filter((c) => c.status === filter);

  async function setStatus(id: string, status: CommentStatus) {
    setActioning(id);
    try {
      const r = await fetch(`/api/admin/comments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (r.ok) setComments((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
    } finally {
      setActioning(null);
    }
  }

  async function remove() {
    if (!deleteId) return;
    setActioning(deleteId);
    try {
      const r = await fetch(`/api/admin/comments/${deleteId}`, { method: "DELETE" });
      if (r.ok) setComments((prev) => prev.filter((c) => c.id !== deleteId));
      setDeleteId(null);
    } finally {
      setActioning(null);
    }
  }

  async function create() {
    if (!form.authorName.trim() || !form.content.trim()) {
      setError("Le nom et le commentaire sont obligatoires.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const r = await fetch("/api/admin/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await r.json();
      if (!r.ok) {
        setError(data.error ?? "Erreur");
        return;
      }
      setComments((prev) => [data, ...prev]);
      setModalOpen(false);
      setForm(emptyForm);
      setFilter("APPROVED");
    } finally {
      setSaving(false);
    }
  }

  const tabs: { key: CommentStatus | "ALL"; label: string }[] = [
    { key: "PENDING", label: `En attente (${counts.PENDING})` },
    { key: "APPROVED", label: `Publiés (${counts.APPROVED})` },
    { key: "REJECTED", label: `Rejetés (${counts.REJECTED})` },
    { key: "ALL", label: "Tous" },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <AdminHeader
        title="Commentaires"
        subtitle={`${counts.PENDING} en attente · ${counts.APPROVED} publié${counts.APPROVED > 1 ? "s" : ""}`}
        action={
          <button
            onClick={() => { setForm(emptyForm); setError(""); setModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-xs font-black uppercase tracking-wide hover:opacity-90"
            style={{ backgroundColor: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}
          >
            <Plus size={15} /> Écrire un commentaire
          </button>
        }
      />

      <div className="flex-1 p-6">
        {/* Filtres */}
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map((t) => {
            const active = filter === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setFilter(t.key)}
                className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wide transition-all"
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
            <MessageSquareQuote size={36} className="mx-auto mb-3 text-gray-300" />
            <p className="text-gray-400 text-sm" style={{ fontFamily: "var(--font-lato)" }}>Aucun commentaire dans cette catégorie.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {shown.map((c) => {
              const sm = STATUS_META[c.status];
              const busy = actioning === c.id;
              return (
                <div key={c.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <p className="font-black text-sm truncate" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>{c.authorName}</p>
                      {c.authorRole && <p className="text-xs text-gray-400 truncate" style={{ fontFamily: "var(--font-lato)" }}>{c.authorRole}</p>}
                    </div>
                    <span className="text-[10px] font-black px-2 py-1 rounded-full shrink-0" style={{ backgroundColor: sm.bg, color: sm.color, fontFamily: "var(--font-montserrat)" }}>
                      {sm.label}
                    </span>
                  </div>

                  {c.rating ? <div className="mb-2"><Stars value={c.rating} /></div> : null}

                  <p className="text-sm text-gray-600 leading-relaxed flex-1" style={{ fontFamily: "var(--font-lato)" }}>{c.content}</p>

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                    <span className="text-xs text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>
                      {new Date(c.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                    <div className="flex items-center gap-1">
                      {c.status !== "APPROVED" && (
                        <button onClick={() => setStatus(c.id, "APPROVED")} disabled={busy} title="Publier"
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-black uppercase disabled:opacity-50" style={{ backgroundColor: "rgba(22,163,74,0.1)", color: "#16a34a", fontFamily: "var(--font-montserrat)" }}>
                          {busy ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Publier
                        </button>
                      )}
                      {c.status !== "REJECTED" && (
                        <button onClick={() => setStatus(c.id, "REJECTED")} disabled={busy} title="Rejeter"
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-black uppercase disabled:opacity-50 text-gray-500 hover:bg-gray-100" style={{ fontFamily: "var(--font-montserrat)" }}>
                          <X size={13} /> Rejeter
                        </button>
                      )}
                      <button onClick={() => setDeleteId(c.id)} disabled={busy} title="Supprimer"
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Créer un commentaire (publié directement) */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Écrire un commentaire">
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100 mb-4">
            <AlertCircle size={14} className="text-red-500 shrink-0" />
            <p className="text-xs text-red-600" style={{ fontFamily: "var(--font-lato)" }}>{error}</p>
          </div>
        )}
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>Nom affiché *</label>
              <input className={inputCls} value={form.authorName} onChange={(e) => setForm((p) => ({ ...p, authorName: e.target.value }))} placeholder="Ex : Aline Mabiala" style={{ fontFamily: "var(--font-lato)" }} />
            </div>
            <div>
              <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>Rôle / fonction</label>
              <input className={inputCls} value={form.authorRole} onChange={(e) => setForm((p) => ({ ...p, authorRole: e.target.value }))} placeholder="Ex : Cliente — Pointe-Noire" style={{ fontFamily: "var(--font-lato)" }} />
            </div>
          </div>
          <div>
            <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>Note</label>
            <Stars value={form.rating} onChange={(n) => setForm((p) => ({ ...p, rating: n }))} />
          </div>
          <div>
            <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>Commentaire *</label>
            <textarea rows={4} className={`${inputCls} resize-none`} value={form.content} onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))} placeholder="Le témoignage à afficher…" style={{ fontFamily: "var(--font-lato)" }} />
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>
            <CheckCircle2 size={13} style={{ color: "#16a34a" }} /> Publié immédiatement sur le site.
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={() => setModalOpen(false)} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-black text-gray-500" style={{ fontFamily: "var(--font-montserrat)" }}>Annuler</button>
          <button onClick={create} disabled={saving} className="flex-1 py-3 rounded-xl text-white text-sm font-black hover:opacity-90 disabled:opacity-60" style={{ backgroundColor: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
            {saving ? "Publication…" : "Publier"}
          </button>
        </div>
      </Modal>

      {/* Supprimer */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Supprimer le commentaire">
        <p className="text-sm text-gray-600 mb-6" style={{ fontFamily: "var(--font-lato)" }}>Ce commentaire sera supprimé définitivement.</p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteId(null)} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-black text-gray-500" style={{ fontFamily: "var(--font-montserrat)" }}>Annuler</button>
          <button onClick={remove} className="flex-1 py-3 rounded-xl text-white text-sm font-black bg-red-500 hover:bg-red-600" style={{ fontFamily: "var(--font-montserrat)" }}>Supprimer</button>
        </div>
      </Modal>
    </div>
  );
}
