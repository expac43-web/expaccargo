"use client";

import Link from "next/link";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  ArrowLeft, FileText, Upload, Send, Loader2, Download, Eye,
  CheckCircle2, XCircle, Clock, Archive,
} from "lucide-react";

type Exchange = {
  id: string; partnerId: string; partnerName?: string | null; title: string;
  docType: string; status: string; amount: number | null; currency: string;
  notes: string | null; createdById: string | null; createdAt: string;
};
type Doc = { id: string; name: string; uploaderId: string | null; createdAt: string };
type Msg = { id: string; content: string; senderId: string; createdAt: string };

const DOC_LABELS: Record<string, string> = {
  DEVIS: "Devis", FACTURE: "Facture", BON_COMMANDE: "Bon de commande", CONTRAT: "Contrat", AUTRE: "Autre",
};
const STATUS_META: Record<string, { label: string; color: string; Icon: React.ElementType }> = {
  PENDING:   { label: "En attente", color: "#f59e0b", Icon: Clock },
  VALIDATED: { label: "Validé",     color: "#10b981", Icon: CheckCircle2 },
  REJECTED:  { label: "Refusé",     color: "#ef4444", Icon: XCircle },
  CLOSED:    { label: "Clôturé",    color: "#6b7280", Icon: Archive },
};

export default function ExchangeDetail({
  exchangeId, isStaff = false, currentUserId, backHref,
}: { exchangeId: string; isStaff?: boolean; currentUserId: string; backHref: string }) {
  const [ex, setEx] = useState<Exchange | null>(null);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(() => {
    fetch(`/api/exchanges/${exchangeId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) { setNotFound(true); return; }
        setEx(d.exchange); setDocs(d.documents ?? []); setMsgs(d.messages ?? []);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [exchangeId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  async function send() {
    if (!draft.trim()) return;
    setSending(true);
    const r = await fetch(`/api/exchanges/${exchangeId}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: draft }),
    });
    if (r.ok) { const created = await r.json(); setMsgs((m) => [...m, created]); setDraft(""); }
    setSending(false);
  }

  async function upload(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const r = await fetch(`/api/exchanges/${exchangeId}`, { method: "POST", body: fd });
    if (r.ok) { const created = await r.json(); setDocs((d) => [created, ...d]); }
    if (fileRef.current) fileRef.current.value = "";
    setUploading(false);
  }

  async function setStatus(status: string) {
    const r = await fetch(`/api/exchanges/${exchangeId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (r.ok && ex) setEx({ ...ex, status });
  }

  if (loading) {
    return <div className="flex justify-center py-24 text-gray-400"><Loader2 size={24} className="animate-spin" /></div>;
  }
  if (notFound || !ex) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-400 mb-4" style={{ fontFamily: "var(--font-lato)" }}>Échange introuvable ou inaccessible.</p>
        <Link href={backHref} className="text-sm font-black uppercase" style={{ color: "#E8520A", fontFamily: "var(--font-montserrat)" }}>Retour aux échanges</Link>
      </div>
    );
  }

  const st = STATUS_META[ex.status] ?? STATUS_META.PENDING;

  return (
    <div className="p-5 lg:p-8">
      <Link href={backHref} className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wide text-gray-500 hover:text-[#1A3A6B] mb-4" style={{ fontFamily: "var(--font-montserrat)" }}>
        <ArrowLeft size={15} /> Retour aux échanges
      </Link>

      {/* En-tête */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <h1 className="text-xl lg:text-2xl font-black" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>{ex.title}</h1>
            <p className="text-sm text-gray-400 mt-1" style={{ fontFamily: "var(--font-lato)" }}>
              {DOC_LABELS[ex.docType] ?? ex.docType}
              {ex.amount ? ` · ${new Intl.NumberFormat("fr-FR").format(ex.amount)} ${ex.currency === "XAF" ? "FCFA" : ex.currency}` : ""}
              {isStaff && ex.partnerName ? ` · ${ex.partnerName}` : ""}
              {` · créé le ${new Date(ex.createdAt).toLocaleDateString("fr-FR")}`}
            </p>
            {ex.notes && <p className="text-sm text-gray-600 mt-2" style={{ fontFamily: "var(--font-lato)" }}>{ex.notes}</p>}
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-lg shrink-0" style={{ backgroundColor: `${st.color}15`, color: st.color, fontFamily: "var(--font-montserrat)" }}>
            <st.Icon size={14} /> {st.label}
          </span>
        </div>

        {isStaff && (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
            {(["PENDING", "VALIDATED", "REJECTED", "CLOSED"] as const).map((s) => {
              const m = STATUS_META[s];
              const active = ex.status === s;
              return (
                <button key={s} onClick={() => setStatus(s)} className="px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wide border-2 transition-all"
                  style={active ? { borderColor: m.color, backgroundColor: `${m.color}12`, color: m.color, fontFamily: "var(--font-montserrat)" } : { borderColor: "#e5e7eb", color: "#9ca3af", fontFamily: "var(--font-montserrat)" }}>
                  {m.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Documents */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-black uppercase tracking-wider text-gray-600" style={{ fontFamily: "var(--font-montserrat)" }}>Documents ({docs.length})</h2>
            <label className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wide cursor-pointer hover:opacity-80" style={{ color: "#E8520A", fontFamily: "var(--font-montserrat)" }}>
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} Déposer
              <input ref={fileRef} type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }} />
            </label>
          </div>
          {docs.length === 0 ? (
            <p className="text-xs text-gray-400 py-6 text-center" style={{ fontFamily: "var(--font-lato)" }}>Aucun document. PDF ou image, 20 Mo max.</p>
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
                  <a href={`/api/files/${d.id}`} target="_blank" rel="noopener noreferrer" title="Ouvrir" className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"><Eye size={15} /></a>
                  <a href={`/api/files/${d.id}?download=1`} download title="Télécharger" className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"><Download size={15} /></a>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Discussion */}
        <div className="bg-white rounded-2xl border border-gray-100 flex flex-col" style={{ minHeight: "24rem" }}>
          <h2 className="text-sm font-black uppercase tracking-wider text-gray-600 p-5 pb-3" style={{ fontFamily: "var(--font-montserrat)" }}>Discussion</h2>
          <div className="flex-1 overflow-y-auto px-5 space-y-2" style={{ maxHeight: "26rem" }}>
            {msgs.length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center" style={{ fontFamily: "var(--font-lato)" }}>Aucun message.</p>
            ) : (
              msgs.map((m) => {
                const mine = m.senderId === currentUserId;
                return (
                  <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div className="max-w-[80%] rounded-2xl px-3.5 py-2" style={mine ? { backgroundColor: "#1A3A6B", color: "#fff" } : { backgroundColor: "#f3f4f6", color: "#374151" }}>
                      <p className="text-sm whitespace-pre-wrap break-words" style={{ fontFamily: "var(--font-lato)" }}>{m.content}</p>
                      <p className="text-[10px] mt-0.5 opacity-70">{new Date(m.createdAt).toLocaleString("fr-FR")}</p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>
          <div className="p-4 border-t border-gray-100 flex items-center gap-2">
            <input
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#1A3A6B]"
              style={{ fontFamily: "var(--font-lato)" }}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Écrire un message…"
            />
            <button onClick={send} disabled={sending || !draft.trim()} className="w-11 h-11 flex items-center justify-center rounded-xl text-white shrink-0 disabled:opacity-50" style={{ backgroundColor: "#1A3A6B" }}>
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
