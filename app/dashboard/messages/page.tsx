"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  MessageSquare, Send, Loader2, CheckCheck, Clock,
  Menu, X, Plus, Trash2, Building2, FileDown,
} from "lucide-react";
import { exportConversationPDF } from "@/lib/pdf";
import { useT } from "@/components/i18n/LanguageProvider";

type Agency = { id: string; name: string; city: string; country: string };
type Conv = {
  id: string; type: string; agencyId: string | null;
  agency: { id: string; name: string; city: string } | null;
  unreadCount: number; lastMessage: string | null; lastDate: string;
};
type Msg = {
  id: string; content: string; senderId: string; receiverId: string;
  isRead: boolean; sentAsManager: boolean; createdAt: string;
  _deleted?: boolean; // suppression optimiste locale
};

function groupByDate(messages: Msg[], dl: string) {
  const groups: { date: string; msgs: Msg[] }[] = [];
  for (const m of messages) {
    const date = new Date(m.createdAt).toLocaleDateString(dl, { weekday: "long", day: "numeric", month: "long" });
    const last = groups[groups.length - 1];
    if (last?.date === date) last.msgs.push(m);
    else groups.push({ date, msgs: [m] });
  }
  return groups;
}

function formatDate(d: string, dl: string) {
  const diff = Date.now() - new Date(d).getTime();
  if (diff < 86400000) return new Date(d).toLocaleTimeString(dl, { hour: "2-digit", minute: "2-digit" });
  if (diff < 604800000) return new Date(d).toLocaleDateString(dl, { weekday: "short" });
  return new Date(d).toLocaleDateString(dl, { day: "numeric", month: "short" });
}

export default function ClientMessagesPage() {
  const { data: session } = useSession();
  const { t, locale } = useT();
  const mt = t.dashboard.messages;
  const dl = locale === "en" ? "en-US" : "fr-FR";
  const myId = (session?.user as { id?: string })?.id ?? "";

  const [convs, setConvs] = useState<Conv[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNewConv, setShowNewConv] = useState(false);
  const [selectedAgency, setSelectedAgency] = useState("");
  const [draftAgencyId, setDraftAgencyId] = useState<string | null>(null);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fusionne deux listes de messages par id (les nouveaux écrasent les anciens), triées par date asc
  function mergeMessages(prev: Msg[], incoming: Msg[]): Msg[] {
    const map = new Map(prev.map((m) => [m.id, m]));
    for (const m of incoming) map.set(m.id, m);
    return [...map.values()].sort((a, b) =>
      a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0
    );
  }

  // Charger la liste des agences
  useEffect(() => {
    fetch("/api/agencies").then((r) => r.ok ? r.json() : []).then(setAgencies);
  }, []);

  const loadConvs = useCallback(async () => {
    const r = await fetch("/api/client/conversations");
    if (r.ok) setConvs(await r.json());
  }, []);

  // Chargement initial : dernière page de messages
  const loadMessages = useCallback(async (convId: string) => {
    setLoadingMsgs(true);
    const r = await fetch(`/api/client/conversations/${convId}/messages`);
    if (r.ok) {
      const data = await r.json();
      setMessages(data.messages ?? []);
      setHasMore(!!data.hasMore);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
    setLoadingMsgs(false);
    // Mettre à jour le badge non-lus dans la liste
    loadConvs();
  }, [loadConvs]);

  // Rafraîchissement (polling) : fusionne la dernière page sans casser les anciens chargés
  const pollMessages = useCallback(async (convId: string) => {
    const r = await fetch(`/api/client/conversations/${convId}/messages`);
    if (r.ok) {
      const data = await r.json();
      setMessages((prev) => mergeMessages(prev, data.messages ?? []));
    }
    loadConvs();
  }, [loadConvs]);

  // Charger les messages plus anciens (curseur = date du plus ancien chargé)
  async function loadOlderMessages() {
    if (!activeConvId || loadingOlder || messages.length === 0) return;
    setLoadingOlder(true);
    const oldest = messages[0].createdAt;
    const container = scrollRef.current;
    const prevHeight = container?.scrollHeight ?? 0;
    const r = await fetch(`/api/client/conversations/${activeConvId}/messages?before=${encodeURIComponent(oldest)}`);
    if (r.ok) {
      const data = await r.json();
      setMessages((prev) => mergeMessages(prev, data.messages ?? []));
      setHasMore(!!data.hasMore);
      // Préserver la position de défilement après ajout en haut
      requestAnimationFrame(() => {
        if (container) container.scrollTop = container.scrollHeight - prevHeight;
      });
    }
    setLoadingOlder(false);
  }

  useEffect(() => { loadConvs(); }, [loadConvs]);

  useEffect(() => {
    if (!activeConvId) return;
    loadMessages(activeConvId);
    const interval = setInterval(() => pollMessages(activeConvId), 10_000);
    return () => clearInterval(interval);
  }, [activeConvId, loadMessages, pollMessages]);

  async function sendMessage() {
    if (!draft.trim() || sending) return;

    // Mode brouillon : la conversation n'est créée qu'à l'envoi du 1er message.
    if (!activeConvId && draftAgencyId) {
      setSending(true);
      const r = await fetch("/api/client/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agencyId: draftAgencyId, firstMessage: draft.trim() }),
      });
      if (r.ok) {
        const { id } = await r.json();
        setDraft("");
        setDraftAgencyId(null);
        setSelectedAgency("");
        await loadConvs();
        setActiveConvId(id);
      }
      setSending(false);
      return;
    }

    if (!activeConvId) return;
    setSending(true);
    const r = await fetch(`/api/client/conversations/${activeConvId}/messages`, {
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
      textareaRef.current?.focus();
    }
    setSending(false);
  }

  async function deleteMessage(msgId: string) {
    if (!activeConvId) return;
    // Suppression optimiste
    setMessages((prev) => prev.map((m) => m.id === msgId ? { ...m, _deleted: true } : m));
    await fetch(`/api/client/conversations/${activeConvId}/messages/${msgId}`, { method: "DELETE" });
    setMessages((prev) => prev.filter((m) => m.id !== msgId));
  }

  async function deleteConversation(convId: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm(mt.deleteConvConfirm)) return;
    setConvs((prev) => prev.filter((c) => c.id !== convId));
    if (activeConvId === convId) { setActiveConvId(null); setMessages([]); setHasMore(false); }
    await fetch(`/api/client/conversations/${convId}`, { method: "DELETE" });
  }

  // Choix du destinataire → on bascule vers le fil (brouillon).
  function startDraft() {
    if (!selectedAgency) return;
    setDraftAgencyId(selectedAgency);
    setActiveConvId(null);
    setMessages([]);
    setHasMore(false);
    setShowNewConv(false);
    setSidebarOpen(false);
  }

  function changeDraftRecipient() {
    setDraftAgencyId(null);
    setSelectedAgency("");
    setShowNewConv(true);
    setSidebarOpen(true);
  }

  function selectConv(id: string) {
    setActiveConvId(id);
    setDraftAgencyId(null);
    setSidebarOpen(false);
    setMessages([]);
    setHasMore(false);
  }

  const activeConv = convs.find((c) => c.id === activeConvId) ?? null;
  const draftAgency = agencies.find((a) => a.id === draftAgencyId) ?? null;
  const visibleMsgs = messages.filter((m) => !m._deleted);
  const groups = groupByDate(visibleMsgs, dl);

  // ── Sidebar ─────────────────────────────────────────────────
  const Sidebar = () => (
    <div className="flex flex-col h-full">
      {/* Nouvelle conversation */}
      <div className="p-3 border-b border-gray-100">
        <button
          onClick={() => setShowNewConv(!showNewConv)}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-black uppercase transition-all hover:opacity-90 text-white"
          style={{ backgroundColor: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}
        >
          <Plus size={13} />
          {mt.newConv}
        </button>

        {showNewConv && (
          <div className="mt-3 space-y-2">
            <select
              value={selectedAgency}
              onChange={(e) => setSelectedAgency(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs outline-none focus:border-[#1A3A6B] bg-white"
              style={{ fontFamily: "var(--font-lato)" }}
            >
              <option value="">{mt.chooseAgency}</option>
              {agencies.map((a) => (
                <option key={a.id} value={a.id}>{a.name} — {a.city}</option>
              ))}
            </select>
            <button
              onClick={startDraft}
              disabled={!selectedAgency}
              className="w-full py-2 rounded-xl text-xs font-black uppercase text-white disabled:opacity-50 transition-all"
              style={{ backgroundColor: "#E8520A", fontFamily: "var(--font-montserrat)" }}
            >
              {mt.start}
            </button>
          </div>
        )}
      </div>

      {/* Liste des conversations */}
      <div className="flex-1 overflow-y-auto">
        {convs.length === 0 ? (
          <p className="p-4 text-xs text-gray-400 text-center" style={{ fontFamily: "var(--font-lato)" }}>
            {mt.noConv}
          </p>
        ) : convs.map((conv) => {
          const active = conv.id === activeConvId;
          const label = conv.agency ? conv.agency.name : mt.directChat;
          const sub = conv.agency ? conv.agency.city : mt.withManager;
          return (
            <div
              key={conv.id}
              role="button" tabIndex={0}
              onClick={() => selectConv(conv.id)}
              className="w-full text-left px-4 py-3.5 border-b border-gray-50 hover:bg-gray-50 transition-colors flex items-start gap-3 cursor-pointer group"
              style={{ backgroundColor: active ? "rgba(26,58,107,0.06)" : undefined }}
            >
              <div className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center text-white text-xs font-black"
                style={{ background: "linear-gradient(135deg,#0e2248,#1A3A6B)" }}>
                <Building2 size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <p className="font-black text-xs truncate" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
                    {label}
                  </p>
                  {conv.unreadCount > 0 && (
                    <span className="w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center text-white shrink-0"
                      style={{ backgroundColor: "#E8520A" }}>
                      {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-gray-400 truncate" style={{ fontFamily: "var(--font-lato)" }}>{sub}</p>
                {conv.lastMessage && (
                  <p className="text-xs text-gray-400 truncate mt-0.5 italic" style={{ fontFamily: "var(--font-lato)" }}>
                    {conv.lastMessage.length > 38 ? conv.lastMessage.slice(0, 38) + "…" : conv.lastMessage}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="text-[10px] text-gray-300">{formatDate(conv.lastDate, dl)}</span>
                <button onClick={(e) => deleteConversation(conv.id, e)} title={mt.deleteConvTitle}
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
    <div className="flex-1 flex min-h-0 h-[calc(100vh-3.5rem)] lg:h-screen overflow-hidden">

      {/* Desktop sidebar */}
      <div className="hidden lg:flex w-72 border-r border-gray-100 bg-white flex-col shrink-0">
        <div className="px-5 py-5 border-b border-gray-100 shrink-0"
          style={{ background: "linear-gradient(135deg, #0e2248 0%, #1A3A6B 100%)" }}>
          <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: "#fba563", fontFamily: "var(--font-montserrat)" }}>▪ {mt.eyebrow}</p>
          <h1 className="text-lg font-black text-white" style={{ fontFamily: "var(--font-montserrat)" }}>{mt.title}</h1>
        </div>
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 shrink-0">
              <p className="font-black text-sm" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>{mt.conversations}</p>
              <button onClick={() => setSidebarOpen(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100">
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto"><Sidebar /></div>
          </div>
        </div>
      )}

      {/* Thread */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Header */}
        <div className="px-4 lg:px-6 py-4 border-b border-gray-100 shrink-0 flex items-center gap-3 bg-white shadow-sm">
          <button onClick={() => setSidebarOpen(true)}
            className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 text-gray-500">
            <Menu size={15} />
          </button>
          {activeConv ? (
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0"
                style={{ background: "linear-gradient(135deg,#0e2248,#1A3A6B)" }}>
                <Building2 size={15} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-black text-sm truncate" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
                  {activeConv.agency?.name ?? mt.directChat}
                </p>
                <p className="text-xs text-gray-400 truncate" style={{ fontFamily: "var(--font-lato)" }}>
                  {activeConv.type === "CLIENT_MANAGER" ? mt.withManager : activeConv.agency?.city ?? ""}
                </p>
              </div>
              {visibleMsgs.length > 0 && (
                <button
                  onClick={() => exportConversationPDF(
                    activeConv.agency?.name ?? mt.directChat,
                    visibleMsgs.map((m) => ({
                      senderLabel: m.senderId === myId ? mt.me : (m.sentAsManager ? mt.manager : (activeConv.agency?.name ?? mt.agency)),
                      date: m.createdAt,
                      content: m.content,
                      fromMe: m.senderId === myId,
                    })),
                  )}
                  title={mt.exportPdf}
                  className="w-9 h-9 rounded-xl flex items-center justify-center border border-gray-200 text-gray-500 hover:text-[#1A3A6B] hover:bg-gray-50 transition-all shrink-0"
                >
                  <FileDown size={15} />
                </button>
              )}
            </div>
          ) : draftAgency ? (
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0" style={{ background: "linear-gradient(135deg,#0e2248,#1A3A6B)" }}>
                <Building2 size={15} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-black text-sm truncate" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>{draftAgency.name}</p>
                <p className="text-xs text-gray-400 truncate" style={{ fontFamily: "var(--font-lato)" }}>{mt.newConvWith} · {draftAgency.city}</p>
              </div>
              <button onClick={changeDraftRecipient} className="text-xs font-black uppercase text-gray-400 hover:text-[#E8520A] transition-colors shrink-0" style={{ fontFamily: "var(--font-montserrat)" }}>
                {mt.change}
              </button>
            </div>
          ) : (
            <p className="font-black text-sm flex-1" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
              {mt.selectConv}
            </p>
          )}
        </div>

        {/* Messages area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 lg:px-6 py-4 bg-gray-50">
          {!activeConvId && draftAgency ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: "rgba(232,82,10,0.08)" }}>
                <MessageSquare size={28} style={{ color: "#E8520A" }} />
              </div>
              <p className="font-black uppercase text-sm mb-1" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
                {mt.firstMsgTitle}
              </p>
              <p className="text-xs text-gray-400 max-w-xs" style={{ fontFamily: "var(--font-lato)" }}>
                {mt.firstMsgHintPre} {draftAgency.name}{mt.firstMsgHintPost}
              </p>
            </div>
          ) : !activeConvId ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                style={{ backgroundColor: "rgba(26,58,107,0.07)" }}>
                <MessageSquare size={28} style={{ color: "#1A3A6B" }} />
              </div>
              <p className="font-black uppercase text-sm mb-1" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
                {mt.chooseConvTitle}
              </p>
              <p className="text-xs text-gray-400 mb-4" style={{ fontFamily: "var(--font-lato)" }}>
                {mt.chooseConvHint}
              </p>
              <button onClick={() => setSidebarOpen(true)}
                className="lg:hidden flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase text-white"
                style={{ backgroundColor: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
                <Menu size={13} />{mt.viewConvs}
              </button>
            </div>
          ) : loadingMsgs ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 size={24} className="animate-spin" style={{ color: "#1A3A6B" }} />
            </div>
          ) : visibleMsgs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageSquare size={32} className="text-gray-200 mb-3" />
              <p className="text-sm text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>
                {mt.noMsg}
              </p>
            </div>
          ) : (
            <div className="space-y-6 max-w-2xl mx-auto">
              {hasMore && (
                <div className="flex justify-center">
                  <button
                    onClick={loadOlderMessages}
                    disabled={loadingOlder}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 text-xs font-black uppercase text-gray-500 hover:bg-gray-50 transition-all disabled:opacity-50"
                    style={{ fontFamily: "var(--font-montserrat)" }}
                  >
                    {loadingOlder ? <Loader2 size={13} className="animate-spin" /> : null}
                    {loadingOlder ? mt.loading : mt.loadOlder}
                  </button>
                </div>
              )}
              {groups.map(({ date, msgs }) => (
                <div key={date}>
                  <div className="flex items-center gap-3 my-4">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-xs text-gray-400 px-2 capitalize" style={{ fontFamily: "var(--font-lato)" }}>{date}</span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>
                  <div className="space-y-3">
                    {msgs.map((msg) => {
                      const isMine = msg.senderId === myId;
                      return (
                        <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"} group`}>
                          {!isMine && (
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0 mr-2 mt-1"
                              style={{ background: "linear-gradient(135deg,#0e2248,#1A3A6B)" }}>
                              {msg.sentAsManager ? "G" : "A"}
                            </div>
                          )}
                          <div className={`max-w-[75%] flex flex-col ${isMine ? "items-end" : "items-start"}`}>
                            {!isMine && msg.sentAsManager && (
                              <span className="text-[10px] text-gray-400 mb-1 ml-1" style={{ fontFamily: "var(--font-lato)" }}>{mt.manager}</span>
                            )}
                            <div className="relative flex items-end gap-1.5">
                              {isMine && (
                                <button
                                  onClick={() => deleteMessage(msg.id)}
                                  className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all mb-1 shrink-0"
                                >
                                  <Trash2 size={12} />
                                </button>
                              )}
                              <div className="px-4 py-3 text-sm shadow-sm"
                                style={{
                                  backgroundColor: isMine ? "#1A3A6B" : "#fff",
                                  color: isMine ? "#fff" : "#1f2937",
                                  borderRadius: isMine ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                                  fontFamily: "var(--font-lato)",
                                  border: isMine ? "none" : "1px solid #f3f4f6",
                                  lineHeight: 1.5,
                                }}>
                                {msg.content}
                              </div>
                            </div>
                            <div className={`flex items-center gap-1 mt-1 ${isMine ? "flex-row-reverse" : ""}`}>
                              <span className="text-xs text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>
                                {new Date(msg.createdAt).toLocaleTimeString(dl, { hour: "2-digit", minute: "2-digit" })}
                              </span>
                              {isMine && (msg.isRead
                                ? <CheckCheck size={12} className="text-blue-400" />
                                : <Clock size={10} className="text-gray-300" />)}
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

        {/* Input bar */}
        <div className="px-4 lg:px-6 py-4 bg-white border-t border-gray-100 shrink-0">
          {!activeConvId && !draftAgency ? (
            <p className="text-xs text-gray-400 text-center" style={{ fontFamily: "var(--font-lato)" }}>
              {mt.selectToReply}
            </p>
          ) : (
            <div className="max-w-2xl mx-auto flex items-end gap-3">
              <textarea
                ref={textareaRef}
                value={draft}
                onChange={(e) => { setDraft(e.target.value); e.currentTarget.style.height = "auto"; e.currentTarget.style.height = `${Math.min(e.currentTarget.scrollHeight, 120)}px`; }}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder={mt.inputPlaceholder}
                rows={1}
                className="flex-1 px-4 py-3 rounded-2xl border border-gray-200 text-sm resize-none outline-none focus:border-[#1A3A6B] focus:ring-2 focus:ring-[#1A3A6B]/10 transition-all bg-gray-50"
                style={{ fontFamily: "var(--font-lato)", maxHeight: "120px" }}
              />
              <button onClick={sendMessage} disabled={!draft.trim() || sending}
                className="w-11 h-11 rounded-2xl flex items-center justify-center text-white transition-all hover:opacity-80 disabled:opacity-40 shrink-0"
                style={{ background: "linear-gradient(135deg, #1A3A6B, #2563eb)" }}>
                {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
