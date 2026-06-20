"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check } from "lucide-react";

type Notif = { id: string; title: string; body: string; isRead: boolean; link: string | null; createdAt: string };

function timeAgo(d: string): string {
  const diff = Date.now() - new Date(d).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h} h`;
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export default function NotificationBell({ accent = "#1A3A6B", tone = "light" }: { accent?: string; tone?: "light" | "dark" }) {
  const router = useRouter();
  const [items, setItems] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/notifications");
      if (r.ok) {
        const d = await r.json();
        setItems(d.items ?? []);
        setUnread(d.unread ?? 0);
      }
    } catch { /* silencieux */ }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, [load]);

  // Fermer au clic extérieur
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) {
      setUnread(0);
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
      try { await fetch("/api/notifications", { method: "PATCH" }); } catch { /* silencieux */ }
    }
  }

  function goTo(n: Notif) {
    setOpen(false);
    if (n.link) router.push(n.link);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={toggle}
        className={`relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
          tone === "dark" ? "text-white/80 hover:bg-white/10" : "text-gray-500 hover:bg-gray-100"
        }`}
        title="Notifications"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-black flex items-center justify-center text-white"
            style={{ backgroundColor: "#E8520A" }}
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 lg:right-auto lg:left-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <p className="font-black text-sm" style={{ color: accent, fontFamily: "var(--font-montserrat)" }}>Notifications</p>
            {items.some((n) => n.isRead === false) ? null : (
              <span className="text-[10px] text-gray-400 flex items-center gap-1" style={{ fontFamily: "var(--font-lato)" }}><Check size={11} /> à jour</span>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-xs text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>Aucune notification.</p>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => goTo(n)}
                  className="w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors flex gap-3"
                >
                  <span className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: n.isRead ? "transparent" : "#E8520A" }} />
                  <span className="flex-1 min-w-0">
                    <span className="block text-xs font-black line-clamp-1" style={{ color: accent, fontFamily: "var(--font-montserrat)" }}>{n.title}</span>
                    {n.body && <span className="block text-xs text-gray-500 line-clamp-2 break-words" style={{ fontFamily: "var(--font-lato)" }}>{n.body}</span>}
                    <span className="block text-[10px] text-gray-400 mt-0.5" style={{ fontFamily: "var(--font-lato)" }}>{timeAgo(n.createdAt)}</span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
