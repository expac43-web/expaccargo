"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { MessageSquare, Send, Loader2, Search, ArrowLeft } from "lucide-react";

type Peer = { id: string; name: string; email: string; role: string; lastMessage: string | null; lastAt: string | null; unread: number };
type Msg = { id: string; content: string; senderId: string; createdAt: string };

const ROLE_LABELS: Record<string, string> = { SUPER_ADMIN: "Super admin", MANAGER: "Gérant", AGENCY: "Agent" };
const ROLE_COLORS: Record<string, string> = { SUPER_ADMIN: "#7c3aed", MANAGER: "#1A3A6B", AGENCY: "#0e5f72" };

export default function InternalMessages({ currentUserId }: { currentUserId: string }) {
  const [peers, setPeers] = useState<Peer[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<Peer | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadPeers = useCallback(() => {
    fetch("/api/internal-messages")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setPeers(Array.isArray(d) ? d : []))
      .catch(() => setPeers([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadPeers(); }, [loadPeers]);

  const openThread = useCallback((p: Peer) => {
    setActive(p); setMsgs([]); setLoadingThread(true);
    fetch(`/api/internal-messages?with=${encodeURIComponent(p.id)}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setMsgs(Array.isArray(d) ? d : []))
      .finally(() => { setLoadingThread(false); loadPeers(); });
  }, [loadPeers]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  async function send() {
    if (!draft.trim() || !active) return;
    setSending(true);
    const r = await fetch("/api/internal-messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiverId: active.id, content: draft }),
    });
    if (r.ok) { const created = await r.json(); setMsgs((m) => [...m, created]); setDraft(""); loadPeers(); }
    setSending(false);
  }

  const shown = peers.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-5 lg:p-8">
      <div className="mb-5">
        <h1 className="text-xl lg:text-2xl font-black" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>Messagerie interne</h1>
        <p className="text-sm text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>Échanges entre l&apos;administration, les gérants et les agents.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Liste des collègues */}
        <div className={`lg:col-span-1 ${active ? "hidden lg:block" : ""}`}>
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="relative mb-3">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un collègue…"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#1A3A6B]"
                style={{ fontFamily: "var(--font-lato)" }}
              />
            </div>
            {loading ? (
              <div className="flex justify-center py-10 text-gray-400"><Loader2 size={20} className="animate-spin" /></div>
            ) : shown.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-8" style={{ fontFamily: "var(--font-lato)" }}>Aucun collègue.</p>
            ) : (
              <div className="space-y-1 max-h-[65vh] overflow-y-auto">
                {shown.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => openThread(p)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors"
                    style={{ backgroundColor: active?.id === p.id ? "rgba(26,58,107,0.08)" : "transparent" }}
                  >
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-black shrink-0"
                      style={{ backgroundColor: ROLE_COLORS[p.role] ?? "#6b7280", fontFamily: "var(--font-montserrat)" }}>
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-black truncate" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>{p.name}</p>
                      <p className="text-xs text-gray-400 truncate" style={{ fontFamily: "var(--font-lato)" }}>
                        {p.lastMessage ?? ROLE_LABELS[p.role] ?? p.role}
                      </p>
                    </div>
                    {p.unread > 0 && (
                      <span className="shrink-0 min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-black text-white flex items-center justify-center" style={{ backgroundColor: "#E8520A" }}>
                        {p.unread}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Fil de discussion */}
        <div className={`lg:col-span-2 ${active ? "" : "hidden lg:block"}`}>
          {!active ? (
            <div className="bg-white rounded-2xl border border-gray-100 text-center py-24">
              <MessageSquare size={34} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-400 text-sm" style={{ fontFamily: "var(--font-lato)" }}>Sélectionnez un collègue pour discuter.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 flex flex-col" style={{ height: "70vh" }}>
              <div className="flex items-center gap-3 p-4 border-b border-gray-100 shrink-0">
                <button onClick={() => setActive(null)} className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"><ArrowLeft size={17} /></button>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-black shrink-0"
                  style={{ backgroundColor: ROLE_COLORS[active.role] ?? "#6b7280", fontFamily: "var(--font-montserrat)" }}>
                  {active.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-black truncate" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>{active.name}</p>
                  <p className="text-xs text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>{ROLE_LABELS[active.role] ?? active.role}</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {loadingThread ? (
                  <div className="flex justify-center py-10 text-gray-400"><Loader2 size={20} className="animate-spin" /></div>
                ) : msgs.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-10" style={{ fontFamily: "var(--font-lato)" }}>Aucun message. Écrivez le premier.</p>
                ) : (
                  msgs.map((m) => {
                    const mine = m.senderId === currentUserId;
                    return (
                      <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div className="max-w-[75%] rounded-2xl px-3.5 py-2" style={mine ? { backgroundColor: "#1A3A6B", color: "#fff" } : { backgroundColor: "#f3f4f6", color: "#374151" }}>
                          <p className="text-sm whitespace-pre-wrap break-words" style={{ fontFamily: "var(--font-lato)" }}>{m.content}</p>
                          <p className="text-[10px] mt-0.5 opacity-70">{new Date(m.createdAt).toLocaleString("fr-FR")}</p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>

              <div className="p-3 border-t border-gray-100 flex items-center gap-2 shrink-0">
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
          )}
        </div>
      </div>
    </div>
  );
}
