"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { MessageSquare, Send, Menu, X, User, Trash2, CheckCheck, Clock, FileDown, Plus } from "lucide-react";
import { exportConversationPDF } from "@/lib/pdf";

type Conv = {
  id: string; type: string; clientId: string;
  client: { id: string; name: string; email: string } | null;
  unreadCount: number; lastMessage: string | null; lastDate: string;
};
type Msg = {
  id: string; content: string; senderId: string; receiverId: string;
  isRead: boolean; sentAsManager: boolean; createdAt: string;
  _deleted?: boolean;
};

function formatTime(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  if (diff < 86400000) return new Date(d).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  if (diff < 604800000) return new Date(d).toLocaleDateString("fr-FR", { weekday: "short" });
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function groupByDate(messages: Msg[]) {
  const groups: { date: string; msgs: Msg[] }[] = [];
  for (const m of messages) {
    const date = new Date(m.createdAt).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
    const last = groups[groups.length - 1];
    if (last?.date === date) last.msgs.push(m);
    else groups.push({ date, msgs: [m] });
  }
  return groups;
}

export default function AgenceMessagesPage() {
  const { data: session } = useSession();
  const myId = (session?.user as { id?: string })?.id ?? "";

  const [convs, setConvs] = useState<Conv[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);

  // Démarrage d'une conversation
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [showNewConv, setShowNewConv] = useState(false);
  const [selectedClient, setSelectedClient] = useState("");
  const [draftClientId, setDraftClientId] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  function mergeMessages(prev: Msg[], incoming: Msg[]): Msg[] {
    const map = new Map(prev.map((m) => [m.id, m]));
    for (const m of incoming) map.set(m.id, m);
    return [...map.values()].sort((a, b) =>
      a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0
    );
  }

  const loadConvs = useCallback(async () => {
    const r = await fetch("/api/agence/conversations");
    if (r.ok) setConvs(await r.json());
  }, []);

  const loadMessages = useCallback(async (convId: string) => {
    const r = await fetch(`/api/agence/conversations/${convId}/messages`);
    if (r.ok) {
      const data = await r.json();
      setMessages(data.messages ?? []);
      setHasMore(!!data.hasMore);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      loadConvs();
    }
  }, [loadConvs]);

  const pollMessages = useCallback(async (convId: string) => {
    const r = await fetch(`/api/agence/conversations/${convId}/messages`);
    if (r.ok) {
      const data = await r.json();
      setMessages((prev) => mergeMessages(prev, data.messages ?? []));
      loadConvs();
    }
  }, [loadConvs]);

  async function loadOlderMessages() {
    if (!activeConvId || loadingOlder || messages.length === 0) return;
    setLoadingOlder(true);
    const oldest = messages[0].createdAt;
    const container = scrollRef.current;
    const prevHeight = container?.scrollHeight ?? 0;
    const r = await fetch(`/api/agence/conversations/${activeConvId}/messages?before=${encodeURIComponent(oldest)}`);
    if (r.ok) {
      const data = await r.json();
      setMessages((prev) => mergeMessages(prev, data.messages ?? []));
      setHasMore(!!data.hasMore);
      requestAnimationFrame(() => {
        if (container) container.scrollTop = container.scrollHeight - prevHeight;
      });
    }
    setLoadingOlder(false);
  }

  useEffect(() => { loadConvs(); }, [loadConvs]);
  useEffect(() => {
    fetch("/api/agence/clients").then((r) => r.ok ? r.json() : []).then((d) => setClients(Array.isArray(d) ? d : []));
  }, []);
  useEffect(() => {
    if (!activeConvId) return;
    loadMessages(activeConvId);
    const id = setInterval(() => pollMessages(activeConvId), 10_000);
    return () => clearInterval(id);
  }, [activeConvId, loadMessages, pollMessages]);

  // Choix du client → bascule vers le fil (brouillon). La conversation n'est
  // créée qu'à l'envoi du premier message, écrit dans l'espace principal.
  function startDraft() {
    if (!selectedClient) return;
    setDraftClientId(selectedClient);
    setActiveConvId(null);
    setMessages([]);
    setHasMore(false);
    setShowNewConv(false);
    setSidebarOpen(false);
  }

  function changeDraftRecipient() {
    setDraftClientId(null);
    setSelectedClient("");
    setShowNewConv(true);
    setSidebarOpen(true);
  }

  async function sendMessage() {
    if (!draft.trim() || sending) return;

    // Mode brouillon
    if (!activeConvId && draftClientId) {
      setSending(true);
      const r = await fetch("/api/agence/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: draftClientId, firstMessage: draft.trim() }),
      });
      if (r.ok) {
        const { id } = await r.json();
        setDraft("");
        setDraftClientId(null);
        setSelectedClient("");
        await loadConvs();
        setActiveConvId(id);
      }
      setSending(false);
      return;
    }

    if (!activeConvId) return;
    setSending(true);
    const r = await fetch(`/api/agence/conversations/${activeConvId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: draft.trim() }),
    });
    if (r.ok) {
      const msg: Msg = await r.json();
      setMessages((prev) => [...prev, msg]);
      setDraft("");
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      loadConvs();
    }
    setSending(false);
  }

  async function deleteMessage(msgId: string) {
    if (!activeConvId) return;
    setMessages((prev) => prev.map((m) => m.id === msgId ? { ...m, _deleted: true } : m));
    await fetch(`/api/agence/conversations/${activeConvId}/messages/${msgId}`, { method: "DELETE" });
    setMessages((prev) => prev.filter((m) => m.id !== msgId));
  }

  async function deleteConversation(convId: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Supprimer cette conversation ?")) return;
    setConvs((prev) => prev.filter((c) => c.id !== convId));
    if (activeConvId === convId) { setActiveConvId(null); setMessages([]); setHasMore(false); }
    await fetch(`/api/agence/conversations/${convId}`, { method: "DELETE" });
  }

  const activeConv = convs.find((c) => c.id === activeConvId) ?? null;
  const draftClient = clients.find((c) => c.id === draftClientId) ?? null;
  const visibleMsgs = messages.filter((m) => !m._deleted);
  const groups = groupByDate(visibleMsgs);

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      {/* Nouvelle conversation */}
      <div className="p-3 border-b border-gray-100">
        <button
          onClick={() => setShowNewConv(!showNewConv)}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-black uppercase text-white transition-all hover:opacity-90"
          style={{ backgroundColor: "#0e5f72", fontFamily: "var(--font-montserrat)" }}
        >
          <Plus size={13} /> Nouvelle conversation
        </button>
        {showNewConv && (
          <div className="mt-3 space-y-2">
            <select
              value={selectedClient} onChange={(e) => setSelectedClient(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs outline-none focus:border-[#0e5f72] bg-white"
              style={{ fontFamily: "var(--font-lato)" }}
            >
              <option value="">Choisir un client…</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button
              onClick={startDraft} disabled={!selectedClient}
              className="w-full py-2 rounded-xl text-xs font-black uppercase text-white disabled:opacity-50"
              style={{ backgroundColor: "#E8520A", fontFamily: "var(--font-montserrat)" }}
            >
              Démarrer
            </button>
          </div>
        )}
      </div>

      {convs.length === 0 ? (
        <p className="p-4 text-xs text-gray-400 text-center" style={{ fontFamily: "var(--font-lato)" }}>
          Aucune conversation encore.
        </p>
      ) : convs.map((conv) => {
        const active = conv.id === activeConvId;
        const name = conv.client?.name ?? "Client";
        const initials = name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();
        return (
          <div key={conv.id} role="button" tabIndex={0}
            onClick={() => { setActiveConvId(conv.id); setDraftClientId(null); setSidebarOpen(false); setMessages([]); setHasMore(false); }}
            className="w-full text-left flex items-center gap-3 px-4 py-3.5 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer group"
            style={{ backgroundColor: active ? "rgba(14,95,114,0.08)" : undefined }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-black shrink-0"
              style={{ background: "linear-gradient(135deg,#0c3d4a,#0e5f72)" }}>
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <p className="font-black text-xs truncate" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>{name}</p>
                {conv.unreadCount > 0 && (
                  <span className="w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center text-white shrink-0"
                    style={{ backgroundColor: "#0e5f72" }}>
                    {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-gray-400 truncate" style={{ fontFamily: "var(--font-lato)" }}>{conv.client?.email ?? ""}</p>
              {conv.lastMessage && (
                <p className="text-xs text-gray-400 truncate mt-0.5 italic" style={{ fontFamily: "var(--font-lato)" }}>
                  {conv.lastMessage.length > 38 ? conv.lastMessage.slice(0, 38) + "…" : conv.lastMessage}
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className="text-[10px] text-gray-300">{formatTime(conv.lastDate)}</span>
              <button onClick={(e) => deleteConversation(conv.id, e)} title="Supprimer la conversation"
                className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all">
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-3.5rem)] lg:h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex w-72 shrink-0 flex-col border-r border-gray-100 bg-white">
        <div className="px-5 py-5 border-b border-gray-100 shrink-0">
          <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: "#0e5f72", fontFamily: "var(--font-montserrat)" }}>▪ Agence</p>
          <h1 className="text-lg font-black uppercase" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>Messages</h1>
        </div>
        <div className="flex-1 overflow-y-auto"><Sidebar /></div>
      </div>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 shrink-0">
              <p className="font-black text-sm" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>Messages</p>
              <button onClick={() => setSidebarOpen(false)}><X size={16} className="text-gray-400" /></button>
            </div>
            <div className="flex-1 overflow-y-auto"><Sidebar /></div>
          </div>
        </div>
      )}

      {/* Thread */}
      <div className="flex-1 flex flex-col min-w-0 bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-100 px-5 py-4 flex items-center gap-3 shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 text-gray-500">
            <Menu size={15} />
          </button>
          {activeConv ? (
            <>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-black shrink-0"
                style={{ background: "linear-gradient(135deg,#0c3d4a,#0e5f72)" }}>
                <User size={15} />
              </div>
              <div className="flex-1">
                <p className="font-black text-sm" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>{activeConv.client?.name ?? "Client"}</p>
                <p className="text-xs text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>{activeConv.client?.email ?? ""}</p>
              </div>
              {visibleMsgs.length > 0 && (
                <button
                  onClick={() => exportConversationPDF(
                    activeConv.client?.name ?? "Client",
                    visibleMsgs.map((m) => ({
                      senderLabel: m.senderId === myId ? "Agence" : (activeConv.client?.name ?? "Client"),
                      date: m.createdAt,
                      content: m.content,
                      fromMe: m.senderId === myId,
                    })),
                  )}
                  title="Exporter la conversation en PDF"
                  className="w-9 h-9 rounded-xl flex items-center justify-center border border-gray-200 text-gray-500 hover:text-[#0e5f72] hover:bg-gray-50 transition-all shrink-0"
                >
                  <FileDown size={15} />
                </button>
              )}
            </>
          ) : draftClient ? (
            <>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-black shrink-0"
                style={{ background: "linear-gradient(135deg,#0c3d4a,#0e5f72)" }}>
                <User size={15} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-sm truncate" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>{draftClient.name}</p>
                <p className="text-xs text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>Nouvelle conversation</p>
              </div>
              <button onClick={changeDraftRecipient} className="text-xs font-black uppercase text-gray-400 hover:text-[#E8520A] transition-colors shrink-0" style={{ fontFamily: "var(--font-montserrat)" }}>
                Changer
              </button>
            </>
          ) : (
            <p className="font-black text-sm text-gray-500" style={{ fontFamily: "var(--font-montserrat)" }}>Sélectionnez une conversation</p>
          )}
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5">
          {!activeConvId && draftClient ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageSquare size={40} className="mb-3" style={{ color: "rgba(232,82,10,0.3)" }} />
              <p className="font-black uppercase text-sm mb-1" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>Écrivez votre premier message</p>
              <p className="text-sm text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>À {draftClient.name}. La conversation démarrera dès l'envoi.</p>
            </div>
          ) : !activeConvId ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden mb-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-sm text-gray-600">
                <Menu size={15} />Conversations
              </button>
              <MessageSquare size={40} className="text-gray-200 mb-3" />
              <p className="text-sm text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>Sélectionnez une conversation.</p>
            </div>
          ) : visibleMsgs.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-10" style={{ fontFamily: "var(--font-lato)" }}>Commencez la conversation.</p>
          ) : (
            <div className="space-y-6 max-w-2xl mx-auto">
              {hasMore && (
                <div className="flex justify-center">
                  <button onClick={loadOlderMessages} disabled={loadingOlder}
                    className="px-4 py-2 rounded-full bg-white border border-gray-200 text-xs font-black uppercase text-gray-500 hover:bg-gray-50 transition-all disabled:opacity-50"
                    style={{ fontFamily: "var(--font-montserrat)" }}>
                    {loadingOlder ? "Chargement…" : "Charger les messages plus anciens"}
                  </button>
                </div>
              )}
              {groups.map(({ date, msgs }) => (
                <div key={date}>
                  <div className="flex items-center gap-3 my-4">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-xs text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>{date}</span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>
                  <div className="space-y-3">
                    {msgs.map((m) => {
                      const isMe = m.senderId === myId;
                      return (
                        <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"} group`}>
                          <div className={`max-w-[75%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                            <div className="relative flex items-end gap-1.5">
                              {isMe && (
                                <button onClick={() => deleteMessage(m.id)}
                                  className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all mb-1">
                                  <Trash2 size={12} />
                                </button>
                              )}
                              <div className="px-4 py-3 text-sm shadow-sm leading-relaxed"
                                style={{
                                  backgroundColor: isMe ? "#0e5f72" : "#fff",
                                  color: isMe ? "#fff" : "#1f2937",
                                  borderRadius: isMe ? "1rem 1rem 0.25rem 1rem" : "1rem 1rem 1rem 0.25rem",
                                  fontFamily: "var(--font-lato)",
                                  border: isMe ? "none" : "1px solid #f3f4f6",
                                }}>
                                {m.content}
                              </div>
                            </div>
                            <div className={`flex items-center gap-1 mt-1 ${isMe ? "flex-row-reverse" : ""}`}>
                              <span className="text-xs text-gray-400">{new Date(m.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
                              {isMe && (m.isRead ? <CheckCheck size={12} className="text-blue-400" /> : <Clock size={10} className="text-gray-300" />)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input */}
        {(activeConvId || draftClient) && (
          <div className="bg-white border-t border-gray-100 p-4 shrink-0">
            <div className="flex items-end gap-3 max-w-2xl mx-auto">
              <textarea value={draft}
                onChange={(e) => { setDraft(e.target.value); e.currentTarget.style.height = "auto"; e.currentTarget.style.height = `${Math.min(e.currentTarget.scrollHeight, 120)}px`; }}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Écrire un message… (Entrée pour envoyer)" rows={1}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#0e5f72] focus:ring-2 focus:ring-[#0e5f72]/10 resize-none transition-all"
                style={{ fontFamily: "var(--font-lato)", maxHeight: "120px" }} />
              <button onClick={sendMessage} disabled={!draft.trim() || sending}
                className="w-10 h-10 flex items-center justify-center rounded-xl text-white transition-all hover:opacity-90 disabled:opacity-50 shrink-0"
                style={{ backgroundColor: "#0e5f72" }}>
                {sending ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={16} />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
