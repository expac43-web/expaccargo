"use client";

import Link from "next/link";
import Logo from "@/components/ui/Logo";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import {
  LayoutDashboard, Users, Package, FolderOpen,
  MessageSquare, MessageSquareQuote, UserCircle, LogOut, Menu, X, Gauge, Newspaper, Calculator, FileText, Warehouse,
} from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import GlobalSearch from "@/components/GlobalSearch";

const BG = "linear-gradient(165deg, #0e2248 0%, #1A3A6B 60%, #1e3a8a 100%)";

const navItems = [
  { label: "Tableau de bord", href: "/dashboard/gerant",             icon: LayoutDashboard },
  { label: "Pilotage",        href: "/dashboard/gerant/pilotage",    icon: Gauge },
  { label: "Clients",         href: "/dashboard/gerant/clients",     icon: Users },
  { label: "Expéditions",     href: "/dashboard/gerant/expeditions", icon: Package },
  { label: "Stockage",        href: "/dashboard/gerant/stockage",    icon: Warehouse },
  { label: "Documents",       href: "/dashboard/gerant/documents",   icon: FolderOpen },
  { label: "Devis",           href: "/dashboard/gerant/devis",       icon: FileText },
  { label: "Actualités",      href: "/dashboard/gerant/actualites",  icon: Newspaper },
  { label: "Commentaires",    href: "/dashboard/gerant/commentaires", icon: MessageSquareQuote },
  { label: "Tarifs",          href: "/dashboard/gerant/tarifs",      icon: Calculator },
  { label: "Messages",        href: "/dashboard/gerant/messages",    icon: MessageSquare },
  { label: "Mon profil",      href: "/dashboard/gerant/profil",      icon: UserCircle },
];

function NavContent({
  userName, avatarUrl, pathname, unread, onClose,
}: {
  userName: string; avatarUrl: string | null; pathname: string; unread: number; onClose?: () => void;
}) {
  const initials = userName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-white/10 shrink-0">
        <Link href="/" onClick={onClose}>
          <Logo variant="onDark" className="h-6 w-auto object-contain" width={100} height={32} priority />
        </Link>
        <div className="flex items-center gap-1">
          <GlobalSearch clientBase="/dashboard/gerant/clients" tone="dark" />
          <NotificationBell tone="dark" />
          {onClose && (
            <button onClick={onClose} className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 text-white/70 hover:bg-white/20 transition-colors">
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* User card */}
      <div className="px-4 py-4 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/10">
          <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center text-[#0e2248] text-sm font-black shrink-0 bg-white relative">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt={userName} className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div className="min-w-0">
            <p className="text-white text-xs font-black truncate" style={{ fontFamily: "var(--font-montserrat)" }}>{userName}</p>
            <p className="text-white/50 text-xs truncate" style={{ fontFamily: "var(--font-lato)" }}>Gérant</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <div className="pt-1 pb-2 px-3">
          <p className="text-xs font-black uppercase tracking-widest text-white/30" style={{ fontFamily: "var(--font-montserrat)" }}>
            Espace gérant
          </p>
        </div>
        {navItems.map(({ label, href, icon: Icon }) => {
          const badge = label === "Messages" ? unread : 0;
          const active = href === "/dashboard/gerant"
            ? pathname === "/dashboard/gerant"
            : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all relative"
              style={{
                fontFamily: "var(--font-lato)",
                backgroundColor: active ? "rgba(232,82,10,0.18)" : "transparent",
                color: active ? "#fff" : "rgba(255,255,255,0.55)",
              }}
            >
              <Icon size={17} />
              <span className="flex-1">{label}</span>
              {!!badge && (
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-black text-white shrink-0"
                  style={{ backgroundColor: "#E8520A", fontFamily: "var(--font-montserrat)" }}>
                  {badge > 9 ? "9+" : badge}
                </span>
              )}
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full" style={{ backgroundColor: "#E8520A" }} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-white/10 shrink-0">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-white/50 hover:text-red-300 hover:bg-white/10 transition-all w-full"
          style={{ fontFamily: "var(--font-lato)" }}
        >
          <LogOut size={15} />
          <span>Déconnexion</span>
        </button>
      </div>
    </div>
  );
}

export default function GerantSidebar({ userName, avatarUrl = null }: { userName: string; avatarUrl?: string | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    async function poll() {
      try {
        const r = await fetch("/api/gerant/messages", { method: "HEAD" });
        const c = parseInt(r.headers.get("X-Unread-Count") ?? "0", 10);
        setUnread(isNaN(c) ? 0 : c);
      } catch { /* ignore */ }
    }
    poll();
    const id = setInterval(poll, 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 z-40 flex items-center px-4 gap-3 shadow-lg" style={{ background: BG }}>
        <button onClick={() => setOpen(true)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 text-white">
          <Menu size={16} />
        </button>
        <Logo variant="onDark" className="h-5 w-auto object-contain" width={80} height={26} />
        <div className="ml-auto flex items-center gap-2">
          {unread > 0 && (
            <Link href="/dashboard/gerant/messages" className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black text-white"
              style={{ backgroundColor: "#E8520A", fontFamily: "var(--font-montserrat)" }}>
              <MessageSquare size={11} />
              {unread > 9 ? "9+" : unread}
            </Link>
          )}
          <GlobalSearch clientBase="/dashboard/gerant/clients" tone="dark" />
          <NotificationBell tone="dark" />
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 shrink-0 flex-col min-h-screen sticky top-0 h-screen shadow-xl z-30" style={{ background: BG }}>
        <NavContent userName={userName} avatarUrl={avatarUrl} pathname={pathname} unread={unread} />
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 flex flex-col shadow-2xl" style={{ background: BG }}>
            <NavContent userName={userName} avatarUrl={avatarUrl} pathname={pathname} unread={unread} onClose={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
