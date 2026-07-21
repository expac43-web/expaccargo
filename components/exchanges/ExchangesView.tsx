"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import {
  Handshake, Plus, X, Loader2, CheckCircle2, XCircle, Clock, Archive, AlertCircle, ChevronRight,
} from "lucide-react";

type Exchange = {
  id: string; partnerId: string; partnerName?: string | null; title: string;
  docType: string; status: string; amount: number | null; currency: string;
  notes: string | null; createdById: string | null; createdAt: string; docCount?: number;
};
type Partner = { id: string; name: string; role: string };

const DOC_TYPES = ["DEVIS", "FACTURE", "BON_COMMANDE", "CONTRAT", "AUTRE"] as const;
const DOC_LABELS: Record<string, string> = {
  DEVIS: "Devis", FACTURE: "Facture", BON_COMMANDE: "Bon de commande", CONTRAT: "Contrat", AUTRE: "Autre",
};
const STATUS_META: Record<string, { label: string; color: string; Icon: React.ElementType }> = {
  PENDING:   { label: "En attente", color: "#f59e0b", Icon: Clock },
  VALIDATED: { label: "Validé",     color: "#10b981", Icon: CheckCircle2 },
  REJECTED:  { label: "Refusé",     color: "#ef4444", Icon: XCircle },
  CLOSED:    { label: "Clôturé",    color: "#6b7280", Icon: Archive },
};

const inputCls = "w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#1A3A6B] transition-all bg-white";
const labelCls = "block text-xs font-black uppercase tracking-wider mb-1.5 text-gray-600";
const PAGE_SIZE = 15;

/** Liste des échanges. Le détail vit dans sa propre page (detailBase/[id]). */
export default function ExchangesView({
  isStaff = false, detailBase,
}: { isStaff?: boolean; detailBase: string }) {
  const [rows, setRows] = useState<Exchange[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "VALIDATED" | "REJECTED" | "CLOSED">("ALL");
  const [page, setPage] = useState(1);

  const [showForm, setShowForm] = useState(false);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [form, setForm] = useState({ title: "", docType: "DEVIS", amount: "", notes: "", partnerId: "" });
  const [newFile, setNewFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    fetch("/api/exchanges")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setRows(Array.isArray(d) ? d : []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!isStaff) return;
    fetch("/api/admin/users")
      .then((r) => (r.ok ? r.json() : []))
      .then((d: Partner[]) => setPartners(Array.isArray(d) ? d.filter((u) => u.role === "PARTNER") : []))
      .catch(() => setPartners([]));
  }, [isStaff]);

  async function createExchange(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { setError("L'objet est obligatoire."); return; }
    if (isStaff && !form.partnerId) { setError("Sélectionnez un partenaire."); return; }
    setSaving(true); setError("");
    try {
      const r = await fetch("/api/exchanges", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, amount: form.amount ? Number(form.amount) : undefined }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Erreur");
      // Pièce jointe optionnelle : déposée sur l'échange qui vient d'être créé.
      if (newFile && d?.id) {
        const fd = new FormData();
        fd.append("file", newFile);
        await fetch(`/api/exchanges/${d.id}`, { method: "POST", body: fd });
      }
      setShowForm(false);
      setForm({ title: "", docType: "DEVIS", amount: "", notes: "", partnerId: "" });
      setNewFile(null);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally { setSaving(false); }
  }

  const shown = filter === "ALL" ? rows : rows.filter((r) => r.status === filter);
  const paged = shown.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pageCount = Math.max(1, Math.ceil(shown.length / PAGE_SIZE));

  return (
    <div className="p-5 lg:p-8">
      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        <div>
          <h1 className="text-xl lg:text-2xl font-black" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
            {isStaff ? "Échanges partenaires" : "Mes échanges"}
          </h1>
          <p className="text-sm text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>
            Devis, factures, bons de commande et contrats — documents et discussion au même endroit.
          </p>
        </div>
        <button
          onClick={() => { setShowForm(true); setError(""); setNewFile(null); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-xs font-black uppercase tracking-wide hover:opacity-90 shrink-0"
          style={{ backgroundColor: "#E8520A", fontFamily: "var(--font-montserrat)" }}
        >
          <Plus size={15} /> Nouvel échange
        </button>
      </div>

      {!loading && rows.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {[
            { key: "ALL" as const, label: "Tous", color: "#1A3A6B", count: rows.length },
            ...(["PENDING", "VALIDATED", "REJECTED", "CLOSED"] as const).map((s) => ({
              key: s, label: STATUS_META[s].label, color: STATUS_META[s].color,
              count: rows.filter((r) => r.status === s).length,
            })),
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => { setFilter(t.key); setPage(1); }}
              className="px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wide border-2 transition-all"
              style={filter === t.key
                ? { borderColor: t.color, backgroundColor: `${t.color}12`, color: t.color, fontFamily: "var(--font-montserrat)" }
                : { borderColor: "#e5e7eb", color: "#9ca3af", fontFamily: "var(--font-montserrat)" }}
            >
              {t.label} ({t.count})
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20 text-gray-400"><Loader2 size={22} className="animate-spin" /></div>
      ) : shown.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <Handshake size={34} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-400 text-sm" style={{ fontFamily: "var(--font-lato)" }}>
            {rows.length === 0 ? "Aucun échange pour le moment." : "Aucun échange avec ce statut."}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {paged.map((ex) => {
              const st = STATUS_META[ex.status] ?? STATUS_META.PENDING;
              return (
                <Link
                  key={ex.id}
                  href={`${detailBase}/${ex.id}`}
                  className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md transition-shadow flex items-center gap-4"
                >
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${st.color}18`, color: st.color }}>
                    <st.Icon size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-black truncate" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>{ex.title}</p>
                    <p className="text-xs text-gray-400 truncate" style={{ fontFamily: "var(--font-lato)" }}>
                      {DOC_LABELS[ex.docType] ?? ex.docType}
                      {isStaff && ex.partnerName ? ` · ${ex.partnerName}` : ""}
                      {ex.docCount ? ` · ${ex.docCount} document${ex.docCount > 1 ? "s" : ""}` : ""}
                      {" · "}{new Date(ex.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <span className="text-xs font-black px-2.5 py-1 rounded-lg shrink-0 hidden sm:inline" style={{ backgroundColor: `${st.color}15`, color: st.color, fontFamily: "var(--font-montserrat)" }}>
                    {st.label}
                  </span>
                  <ChevronRight size={16} className="text-gray-300 shrink-0" />
                </Link>
              );
            })}
          </div>

          {pageCount > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6" style={{ fontFamily: "var(--font-montserrat)" }}>
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1.5 rounded-lg text-xs font-black border border-gray-200 text-gray-500 disabled:opacity-40">Précédent</button>
              <span className="text-xs text-gray-500">{page} / {pageCount}</span>
              <button onClick={() => setPage((p) => Math.min(pageCount, p + 1))} disabled={page >= pageCount} className="px-3 py-1.5 rounded-lg text-xs font-black border border-gray-200 text-gray-500 disabled:opacity-40">Suivant</button>
            </div>
          )}
        </>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => !saving && setShowForm(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-black" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>Nouvel échange</h3>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"><X size={18} /></button>
            </div>
            {error && <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-100 mb-4"><AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" /><p className="text-xs text-red-600">{error}</p></div>}
            <form onSubmit={createExchange} className="space-y-4">
              {isStaff && (
                <div>
                  <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>Partenaire *</label>
                  <select className={inputCls} value={form.partnerId} onChange={(e) => setForm((f) => ({ ...f, partnerId: e.target.value }))}>
                    <option value="">— Sélectionner —</option>
                    {partners.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>Objet *</label>
                <input className={inputCls} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Location 4×4 — mission Pointe-Noire" />
              </div>
              <div>
                <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>Type</label>
                <select className={inputCls} value={form.docType} onChange={(e) => setForm((f) => ({ ...f, docType: e.target.value }))}>
                  {DOC_TYPES.map((t) => <option key={t} value={t}>{DOC_LABELS[t]}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>Montant (FCFA, optionnel)</label>
                <input className={inputCls} type="number" min="0" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
              </div>
              <div>
                <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>Note (optionnel)</label>
                <textarea className={inputCls} rows={3} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
              </div>
              <div>
                <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>Document (optionnel)</label>
                <input
                  type="file"
                  onChange={(e) => setNewFile(e.target.files?.[0] ?? null)}
                  className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-black file:bg-gray-100 file:text-[#1A3A6B]"
                  style={{ fontFamily: "var(--font-lato)" }}
                />
                <p className="text-[11px] text-gray-400 mt-1" style={{ fontFamily: "var(--font-lato)" }}>
                  PDF ou image, 20 Mo max. Vous pourrez en ajouter d&apos;autres ensuite dans l&apos;échange.
                </p>
              </div>
              <button type="submit" disabled={saving} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-black text-white text-sm uppercase tracking-wide disabled:opacity-60" style={{ backgroundColor: "#E8520A", fontFamily: "var(--font-montserrat)" }}>
                {saving ? <Loader2 size={16} className="animate-spin" /> : "Créer l'échange"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
