"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Handshake, Plus, X, FileText, Upload, Send, Loader2,
  CheckCircle2, XCircle, Clock, Archive, Download, Eye, AlertCircle,
} from "lucide-react";

type Exchange = {
  id: string; partnerId: string; partnerName?: string | null; title: string;
  docType: string; status: string; amount: number | null; currency: string;
  notes: string | null; createdById: string | null; createdAt: string; docCount?: number;
};
type Doc = { id: string; name: string; url: string; uploaderId: string | null; createdAt: string };
type Msg = { id: string; content: string; senderId: string; createdAt: string };
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

export default function ExchangesView({ isStaff = false, currentUserId }: { isStaff?: boolean; currentUserId: string }) {
  const [rows, setRows] = useState<Exchange[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<Exchange | null>(null);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [form, setForm] = useState({ title: "", docType: "DEVIS", amount: "", notes: "", partnerId: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    setLoading(true);
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

  const openDetail = useCallback((ex: Exchange) => {
    setOpen(ex); setDocs([]); setMsgs([]); setLoadingDetail(true);
    fetch(`/api/exchanges/${ex.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) { setDocs(d.documents ?? []); setMsgs(d.messages ?? []); } })
      .finally(() => setLoadingDetail(false));
  }, []);

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
      setShowForm(false);
      setForm({ title: "", docType: "DEVIS", amount: "", notes: "", partnerId: "" });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally { setSaving(false); }
  }

  async function sendMessage() {
    if (!draft.trim() || !open) return;
    setSending(true);
    const r = await fetch(`/api/exchanges/${open.id}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: draft }),
    });
    if (r.ok) { const created = await r.json(); setMsgs((m) => [...m, created]); setDraft(""); }
    setSending(false);
  }

  async function uploadDoc(file: File) {
    if (!open) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const r = await fetch(`/api/exchanges/${open.id}`, { method: "POST", body: fd });
    if (r.ok) { const created = await r.json(); setDocs((d) => [created, ...d]); load(); }
    if (fileRef.current) fileRef.current.value = "";
    setUploading(false);
  }

  async function setStatus(status: string) {
    if (!open) return;
    const r = await fetch(`/api/exchanges/${open.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (r.ok) { setOpen({ ...open, status }); load(); }
  }

  return (
    <div className="p-5 lg:p-8">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl lg:text-2xl font-black" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
            {isStaff ? "Échanges partenaires" : "Mes échanges"}
          </h1>
          <p className="text-sm text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>
            Devis, factures, bons de commande et contrats — documents et discussion au même endroit.
          </p>
        </div>
        <button
          onClick={() => { setShowForm(true); setError(""); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-xs font-black uppercase tracking-wide hover:opacity-90 shrink-0"
          style={{ backgroundColor: "#E8520A", fontFamily: "var(--font-montserrat)" }}
        >
          <Plus size={15} /> Nouvel échange
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20 text-gray-400"><Loader2 size={22} className="animate-spin" /></div>
      ) : rows.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <Handshake size={34} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-400 text-sm" style={{ fontFamily: "var(--font-lato)" }}>Aucun échange pour le moment.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((ex) => {
            const st = STATUS_META[ex.status] ?? STATUS_META.PENDING;
            return (
              <button key={ex.id} onClick={() => openDetail(ex)} className="w-full text-left bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md transition-shadow flex items-center gap-4">
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
                <span className="text-xs font-black px-2.5 py-1 rounded-lg shrink-0" style={{ backgroundColor: `${st.color}15`, color: st.color, fontFamily: "var(--font-montserrat)" }}>
                  {st.label}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Création ── */}
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
              <button type="submit" disabled={saving} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-black text-white text-sm uppercase tracking-wide disabled:opacity-60" style={{ backgroundColor: "#E8520A", fontFamily: "var(--font-montserrat)" }}>
                {saving ? <Loader2 size={16} className="animate-spin" /> : "Créer l'échange"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Détail : documents + discussion ── */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(null)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3 p-5 border-b border-gray-100">
              <div className="min-w-0">
                <h3 className="text-lg font-black truncate" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>{open.title}</h3>
                <p className="text-xs text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>
                  {DOC_LABELS[open.docType] ?? open.docType}
                  {open.amount ? ` · ${new Intl.NumberFormat("fr-FR").format(open.amount)} FCFA` : ""}
                  {isStaff && open.partnerName ? ` · ${open.partnerName}` : ""}
                </p>
              </div>
              <button onClick={() => setOpen(null)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 shrink-0"><X size={18} /></button>
            </div>

            {isStaff && (
              <div className="flex flex-wrap gap-2 px-5 py-3 border-b border-gray-100">
                {(["PENDING", "VALIDATED", "REJECTED", "CLOSED"] as const).map((s) => {
                  const m = STATUS_META[s];
                  const active = open.status === s;
                  return (
                    <button key={s} onClick={() => setStatus(s)} className="px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wide border-2 transition-all"
                      style={active ? { borderColor: m.color, backgroundColor: `${m.color}12`, color: m.color, fontFamily: "var(--font-montserrat)" } : { borderColor: "#e5e7eb", color: "#9ca3af", fontFamily: "var(--font-montserrat)" }}>
                      {m.label}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {loadingDetail ? (
                <div className="flex justify-center py-10 text-gray-400"><Loader2 size={20} className="animate-spin" /></div>
              ) : (
                <>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-black uppercase tracking-wider text-gray-600" style={{ fontFamily: "var(--font-montserrat)" }}>Documents ({docs.length})</h4>
                      <label className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wide cursor-pointer hover:opacity-80" style={{ color: "#E8520A", fontFamily: "var(--font-montserrat)" }}>
                        {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} Déposer
                        <input ref={fileRef} type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadDoc(f); }} />
                      </label>
                    </div>
                    {docs.length === 0 ? (
                      <p className="text-xs text-gray-400 py-3" style={{ fontFamily: "var(--font-lato)" }}>Aucun document. PDF ou image, 20 Mo max.</p>
                    ) : (
                      <div className="space-y-2">
                        {docs.map((d) => (
                          <div key={d.id} className="flex items-center gap-3 p-2.5 rounded-xl border border-gray-100">
                            <FileText size={16} className="text-gray-400 shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm truncate" style={{ fontFamily: "var(--font-lato)" }}>{d.name}</p>
                              <p className="text-[11px] text-gray-400">
                                {d.uploaderId === currentUserId ? "Vous" : isStaff ? "Le partenaire" : "EXPAC"} · {new Date(d.createdAt).toLocaleDateString("fr-FR")}
                              </p>
                            </div>
                            <a href={`/api/files/${d.id}`} target="_blank" rel="noopener noreferrer" className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"><Eye size={15} /></a>
                            <a href={`/api/files/${d.id}?download=1`} download className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"><Download size={15} /></a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-gray-600 mb-2" style={{ fontFamily: "var(--font-montserrat)" }}>Discussion</h4>
                    {msgs.length === 0 ? (
                      <p className="text-xs text-gray-400 py-2" style={{ fontFamily: "var(--font-lato)" }}>Aucun message.</p>
                    ) : (
                      <div className="space-y-2">
                        {msgs.map((m) => {
                          const mine = m.senderId === currentUserId;
                          return (
                            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                              <div className="max-w-[75%] rounded-2xl px-3.5 py-2" style={mine ? { backgroundColor: "#1A3A6B", color: "#fff" } : { backgroundColor: "#f3f4f6", color: "#374151" }}>
                                <p className="text-sm whitespace-pre-wrap break-words" style={{ fontFamily: "var(--font-lato)" }}>{m.content}</p>
                                <p className="text-[10px] mt-0.5 opacity-70">{new Date(m.createdAt).toLocaleString("fr-FR")}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 flex items-center gap-2">
              <input
                className={inputCls}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Écrire un message…"
              />
              <button onClick={sendMessage} disabled={sending || !draft.trim()} className="w-11 h-11 flex items-center justify-center rounded-xl text-white shrink-0 disabled:opacity-50" style={{ backgroundColor: "#1A3A6B" }}>
                {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
