"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  MessageSquare, Send, Menu, X, User, Trash2, CheckCheck,
  Clock, Plus, Building2, Users, FileDown,
} from "lucide-react";
import { exportConversationPDF } from "@/lib/pdf";

type Conv = {
  id: string; type: string; clientId: string; agencyId: string | null;
  client: { id: string; name: string; email: string } | null;
  agency: { id: string; name: string } | null;
  unreadCount: number; lastMessage: string | null; lastDate: string;
};
type Msg = {
  id: string; content: string; senderId: string; receiverId: string;
  isRead: boolean; sentAsManager: boolean; createdAt: string;
  _deleted?: boolean;
};
type Client = { id: string; name: string; email: string };

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

export default function GerantMessagesPage() {
  const { data: session } = useSession();
  const myId = (session?.user as { id?: string })?.id ?? "";

  const [convs, setConvs] = useState<Conv[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // "agency" = répondre au nom de l'agence ; "manager" = discussion directe
  const [replyMode, setReplyMode] = useState<"agency" | "manager">("agency");
  // Nouvelle conv directe
  const [showNewDirect, setShowNewDirect] = useState(false);
  const [allClients, setAllClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState("");
  const [draftClientId, setDraftClientId] = useState<string | null>(null);
  // Filtre
  const [filter, setFilter] = useState<"all" | "agency" | "direct">("all");
  const [hasMore, setHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);

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
    const r = await fetch("/api/gerant/conversations");
    if (r.ok) setConvs(await r.json());
  }, []);

  const loadMessages = useCallback(async (convId: string) => {
    const r = await fetch(`/api/gerant/conversations/${convId}/messages`);
    if (r.ok) {
      const data = await r.json();
      setMessages(data.messages ?? []);
      setHasMore(!!data.hasMore);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      loadConvs();
    }
  }, [loadConvs]);

  const pollMessages = useCallback(async (convId: string) => {
    const r = await fetch(`/api/gerant/conversations/${convId}/messages`);
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
    const r = await fetch(`/api/gerant/conversations/${activeConvId}/messages?before=${encodeURIComponent(oldest)}`);
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

  useEffect(() => {
    loadConvs();
    fetch("/api/gerant/clients").then((r) => r.ok ? r.json() : []).then(setAllClients);
  }, [loadConvs]);

  // Ouverture directe d'une conversation via ?conv=... (depuis le pilotage)
  useEffect(() => {
    const c = new URLSearchParams(window.location.search).get("conv");
    if (c) { setActiveConvId(c); setMessages([]); setHasMore(false); }
  }, []);

  useEffect(() => {
    if (!activeConvId) return;
    loadMessages(activeConvId);
    const id = setInterval(() => pollMessages(activeConvId), 10_000);
    return () => clearInterval(id);
  }, [activeConvId, loadMessages, pollMessages]);

  // Déduire le mode par défaut selon le type de conv
  useEffect(() => {
    const conv = convs.find((c) => c.id === activeConvId);
    if (!conv) return;
    setReplyMode(conv.type === "CLIENT_AGENCY" ? "agency" : "manager");
  }, [activeConvId, convs]);

  async function sendMessage() {
    if (!draft.trim() || sending) return;

    // Mode brouillon : crée la discussion directe avec ce 1er message.
    if (!activeConvId && draftClientId) {
      setSending(true);
      const r = await fetch("/api/gerant/conversations", {
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
    const r = await fetch(`/api/gerant/conversations/${activeConvId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: draft.trim(), asAgency: replyMode === "agency" }),
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
    await fetch(`/api/gerant/conversations/${activeConvId}/messages/${msgId}`, { method: "DELETE" });
    setMessages((prev) => prev.filter((m) => m.id !== msgId));
  }

  async function deleteConversation(convId: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Supprimer cette conversation ?")) return;
    setConvs((prev) => prev.filter((c) => c.id !== convId));
    if (activeConvId === convId) { setActiveConvId(null); setMessages([]); setHasMore(false); }
    await fetch(`/api/gerant/conversations/${convId}`, { method: "DELETE" });
  }

  // Choix du client → bascule vers le fil (brouillon, discussion directe).
  function startDraft() {
    if (!selectedClient) return;
    setDraftClientId(selectedClient);
    setActiveConvId(null);
    setMessages([]);
    setHasMore(false);
    setShowNewDirect(false);
    setSidebarOpen(false);
  }

  function changeDraftRecipient() {
    setDraftClientId(null);
    setSelectedClient("");
    setShowNewDirect(true);
    setSidebarOpen(true);
  }

  const activeConv = convs.find((c) => c.id === activeConvId) ?? null;
  const draftClient = allClients.find((c) => c.id === draftClientId) ?? null;
  const filteredConvs = convs.filter((c) => {
    if (filter === "agency") return c.type === "CLIENT_AGENCY";
    if (filter === "direct") return c.type === "CLIENT_MANAGER";
    return true;
  });
  const visibleMsgs = messages.filter((m) => !m._deleted);
  const groups = groupByDate(visibleMsgs);

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      {/* Filtres */}
      <div className="p-3 border-b border-gray-100 space-y-2">
        <div className="flex rounded-xl overflow-hidden border border-gray-200 text-xs font-black">
          {(["all", "agency", "direct"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className="flex-1 py-2 transition-all"
              style={{
                backgroundColor: filter === f ? "#1A3A6B" : "white",
                color: filter === f ? "#fff" : "#6b7280",
                fontFamily: "var(--font-montserrat)",
              }}>
              {f === "all" ? "Tout" : f === "agency" ? "Agence" : "Direct"}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowNewDirect(!showNewDirect)}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-black uppercase text-white transition-all hover:opacity-90"
          style={{ backgroundColor: "#E8520A", fontFamily: "var(--font-montserrat)" }}>
          <Plus size={12} />Discussion directe
        </button>
        {showNewDirect && (
          <div className="mt-1 space-y-2">
            <select value={selectedClient} onChange={(e) => setSelectedClient(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs outline-none focus:border-[#1A3A6B] bg-white"
              style={{ fontFamily: "var(--font-lato)" }}>
              <option value="">Choisir un client…</option>
              {allClients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button onClick={startDraft} disabled={!selectedClient}
              className="w-full py-2 rounded-xl text-xs font-black uppercase text-white disabled:opacity-50"
              style={{ backgroundColor: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
              Démarrer
            </button>
          </div>
        )}
      </div>

      {/* Liste */}
      <div className="flex-1 overflow-y-auto">
        {filteredConvs.length === 0 ? (
          <p className="p-4 text-xs text-gray-400 text-center" style={{ fontFamily: "var(--font-lato)" }}>Aucune conversation.</p>
        ) : filteredConvs.map((conv) => {
          const active = conv.id === activeConvId;
          const name = conv.client?.name ?? "Client";
          const initials = name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();
          const isAgencyConv = conv.type === "CLIENT_AGENCY";
          return (
            <div key={conv.id} role="button" tabIndex={0}
              onClick={() => { setActiveConvId(conv.id); setDraftClientId(null); setSidebarOpen(false); setMessages([]); setHasMore(false); }}
              className="w-full text-left flex items-center gap-3 px-4 py-3.5 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer group"
              style={{ backgroundColor: active ? "rgba(14,34,72,0.07)" : undefined }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-black shrink-0"
                style={{ background: isAgencyConv ? "linear-gradient(135deg,#0e2248,#1A3A6B)" : "linear-gradient(135deg,#7c3aed,#a855f7)" }}>
                {isAgencyConv ? initials : <Users size={14} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <p className="font-black text-xs truncate" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>{name}</p>
                  {conv.unreadCount > 0 && (
                    <span className="w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center text-white shrink-0"
                      style={{ backgroundColor: "#E8520A" }}>
                      {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                    </span>
                  )}
                </div>
                <p className="text-[10px] truncate" style={{ color: isAgencyConv ? "#0e5f72" : "#7c3aed", fontFamily: "var(--font-lato)" }}>
                  {isAgencyConv ? (conv.agency?.name ?? "Agence") : "Discussion directe"}
                </p>
                {conv.lastMessage && (
                  <p className="text-xs text-gray-400 truncate mt-0.5 italic" style={{ fontFamily: "var(--font-lato)" }}>
                    {conv.lastMessage.length > 35 ? conv.lastMessage.slice(0, 35) + "…" : conv.lastMessage}
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
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-3.5rem)] lg:h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex w-72 shrink-0 flex-col border-r border-gray-100 bg-white">
        <div className="px-5 py-5 border-b border-gray-100 shrink-0">
          <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: "#E8520A", fontFamily: "var(--font-montserrat)" }}>▪ Gérant</p>
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
            <div className="flex items-center justify-between flex-1 gap-3 min-w-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0"
                  style={{ background: activeConv.type === "CLIENT_AGENCY" ? "linear-gradient(135deg,#0e2248,#1A3A6B)" : "linear-gradient(135deg,#7c3aed,#a855f7)" }}>
                  {activeConv.type === "CLIENT_AGENCY" ? <Building2 size={14} /> : <User size={14} />}
                </div>
                <div className="min-w-0">
                  <p className="font-black text-sm truncate" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
                    {activeConv.client?.name ?? "Client"}
                  </p>
                  <p className="text-xs text-gray-400 truncate" style={{ fontFamily: "var(--font-lato)" }}>
                    {activeConv.type === "CLIENT_AGENCY" ? `Agence : ${activeConv.agency?.name ?? ""}` : "Discussion directe"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {visibleMsgs.length > 0 && (
                  <button
                    onClick={() => exportConversationPDF(
                      activeConv.client?.name ?? "Client",
                      visibleMsgs.map((m) => ({
                        senderLabel: m.senderId === myId
                          ? (m.sentAsManager ? "Gérant" : "Agence")
                          : (m.sentAsManager ? "Gérant" : activeConv.type === "CLIENT_AGENCY" ? "Agence" : (activeConv.client?.name ?? "Client")),
                        date: m.createdAt,
                        content: m.content,
                        fromMe: m.senderId === myId,
                      })),
                    )}
                    title="Exporter la conversation en PDF"
                    className="w-9 h-9 rounded-xl flex items-center justify-center border border-gray-200 text-gray-500 hover:text-[#1A3A6B] hover:bg-gray-50 transition-all"
                  >
                    <FileDown size={15} />
                  </button>
                )}
                {/* Toggle réponse (visible pour conv CLIENT_AGENCY uniquement) */}
                {activeConv.type === "CLIENT_AGENCY" && (
                  <div className="flex rounded-xl border border-gray-200 overflow-hidden text-xs font-black">
                    {(["agency", "manager"] as const).map((mode) => (
                      <button key={mode} onClick={() => setReplyMode(mode)}
                        className="px-3 py-1.5 transition-all"
                        style={{
                          backgroundColor: replyMode === mode ? "#1A3A6B" : "white",
                          color: replyMode === mode ? "#fff" : "#6b7280",
                          fontFamily: "var(--font-montserrat)",
                        }}>
                        {mode === "agency" ? "Agence" : "Gérant"}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : draftClient ? (
            <div className="flex items-center justify-between flex-1 gap-3 min-w-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0" style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)" }}>
                  <User size={14} />
                </div>
                <div className="min-w-0">
                  <p className="font-black text-sm truncate" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>{draftClient.name}</p>
                  <p className="text-xs text-gray-400 truncate" style={{ fontFamily: "var(--font-lato)" }}>Nouvelle discussion directe</p>
                </div>
              </div>
              <button onClick={changeDraftRecipient} className="text-xs font-black uppercase text-gray-400 hover:text-[#E8520A] transition-colors shrink-0" style={{ fontFamily: "var(--font-montserrat)" }}>
                Changer
              </button>
            </div>
          ) : (
            <p className="font-black text-sm text-gray-500 flex-1" style={{ fontFamily: "var(--font-montserrat)" }}>Sélectionnez une conversation</p>
          )}
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5">
          {!activeConvId && draftClient ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageSquare size={40} className="mb-3" style={{ color: "rgba(124,58,237,0.3)" }} />
              <p className="font-black uppercase text-sm mb-1" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>Écrivez votre premier message</p>
              <p className="text-sm text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>À {draftClient.name}. La conversation démarrera dès l'envoi.</p>
            </div>
          ) : !activeConvId ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden mb-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-sm text-gray-600">
                <Menu size={15} />Conversations
              </button>
              <MessageSquare size={40} className="text-gray-200 mb-3" />
              <p className="text-sm text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>Sélectionnez ou démarrez une conversation.</p>
            </div>
          ) : visibleMsgs.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-10" style={{ fontFamily: "var(--font-lato)" }}>Aucun message encore.</p>
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
                      // Déterminer l'étiquette expéditeur pour les messages des autres
                      const senderLabel = !isMe
                        ? m.sentAsManager ? "Gérant" : activeConv?.type === "CLIENT_AGENCY" ? "Agence" : "Client"
                        : null;
                      const bubbleColor = isMe
                        ? (replyMode === "manager" || activeConv?.type === "CLIENT_MANAGER" ? "#7c3aed" : "#1A3A6B")
                        : "#fff";
                      return (
                        <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"} group`}>
                          {!isMe && (
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0 mr-2 mt-1"
                              style={{ background: m.sentAsManager ? "linear-gradient(135deg,#7c3aed,#a855f7)" : "linear-gradient(135deg,#0e2248,#1A3A6B)" }}>
                              {m.sentAsManager ? "G" : "C"}
                            </div>
                          )}
                          <div className={`max-w-[75%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                            {!isMe && senderLabel && (
                              <span className="text-[10px] text-gray-400 mb-1 ml-1" style={{ fontFamily: "var(--font-lato)" }}>{senderLabel}</span>
                            )}
                            <div className="relative flex items-end gap-1.5">
                              {isMe && (
                                <button onClick={() => deleteMessage(m.id)}
                                  className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all mb-1">
                                  <Trash2 size={12} />
                                </button>
                              )}
                              <div className="px-4 py-3 text-sm shadow-sm leading-relaxed"
                                style={{
                                  backgroundColor: bubbleColor,
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
            {activeConv?.type === "CLIENT_AGENCY" && (
              <p className="text-xs text-gray-400 mb-2 text-center" style={{ fontFamily: "var(--font-lato)" }}>
                Réponse en tant que : <span className="font-black" style={{ color: replyMode === "agency" ? "#0e5f72" : "#7c3aed" }}>
                  {replyMode === "agency" ? "Agence" : "Gérant (direct)"}
                </span>
              </p>
            )}
            <div className="flex items-end gap-3 max-w-2xl mx-auto">
              <textarea value={draft}
                onChange={(e) => { setDraft(e.target.value); e.currentTarget.style.height = "auto"; e.currentTarget.style.height = `${Math.min(e.currentTarget.scrollHeight, 120)}px`; }}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Écrire un message… (Entrée pour envoyer)" rows={1}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 resize-none transition-all"
                style={{
                  fontFamily: "var(--font-lato)", maxHeight: "120px",
                  borderColor: replyMode === "manager" ? "#7c3aed" : "#1A3A6B",
                }} />
              <button onClick={sendMessage} disabled={!draft.trim() || sending}
                className="w-10 h-10 flex items-center justify-center rounded-xl text-white transition-all hover:opacity-90 disabled:opacity-50 shrink-0"
                style={{ backgroundColor: replyMode === "manager" ? "#7c3aed" : "#1A3A6B" }}>
                {sending ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={16} />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
