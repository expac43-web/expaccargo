"use client";

import Link from "next/link";
import Logo from "@/components/ui/Logo";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import {
  Package, UserCircle, LogOut, Menu, X,
  Home, FolderOpen, MessageSquare, FileText, Star,
} from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import { useT } from "@/components/i18n/LanguageProvider";

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
};

function NavContent({
  userName,
  pathname,
  navItems,
  onClose,
}: {
  userName: string;
  pathname: string;
  navItems: NavItem[];
  onClose?: () => void;
}) {
  const { t } = useT();
  const d = t.dashboard;
  const firstName = userName.split(" ")[0];
  const initials = userName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-white/10 shrink-0">
        <Link href="/" onClick={onClose} className="flex items-center gap-2">
          <Logo variant="onDark" className="h-6 w-auto object-contain" width={100} height={32} priority />
        </Link>
        <div className="flex items-center gap-1">
          <NotificationBell tone="dark" />
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 text-white/70 hover:bg-white/20 transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* User card */}
      <div className="px-4 py-4 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/10">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[#1A3A6B] text-sm font-black shrink-0"
            style={{ backgroundColor: "#fff", fontFamily: "var(--font-montserrat)" }}
          >
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-white text-xs font-black truncate" style={{ fontFamily: "var(--font-montserrat)" }}>
              {firstName}
            </p>
            <p className="text-white/50 text-xs" style={{ fontFamily: "var(--font-lato)" }}>
              {d.clientArea}
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <Link
          href="/"
          onClick={onClose}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/10 transition-all"
          style={{ fontFamily: "var(--font-lato)" }}
        >
          <Home size={16} />
          <span>{d.publicSite}</span>
        </Link>

        <div className="pt-3 pb-1 px-3">
          <p className="text-xs font-black uppercase tracking-widest text-white/30" style={{ fontFamily: "var(--font-montserrat)" }}>
            {d.mySpace}
          </p>
        </div>

        {navItems.map(({ label, href, icon: Icon, badge }) => {
          const active = href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all relative"
              style={{
                fontFamily: "var(--font-lato)",
                backgroundColor: active ? "rgba(255,255,255,0.15)" : "transparent",
                color: active ? "#fff" : "rgba(255,255,255,0.55)",
              }}
            >
              <Icon size={17} />
              <span className="flex-1">{label}</span>
              {!!badge && (
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-black"
                  style={{ backgroundColor: "#E8520A", color: "#fff", fontFamily: "var(--font-montserrat)" }}
                >
                  {badge > 9 ? "9+" : badge}
                </span>
              )}
              {active && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
                  style={{ backgroundColor: "#E8520A" }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Langue + Logout */}
      <div className="p-4 border-t border-white/10 shrink-0 space-y-3">
        <div className="flex items-center justify-between px-3">
          <span className="text-xs font-black uppercase tracking-wider text-white/40" style={{ fontFamily: "var(--font-montserrat)" }}>
            {t.switcher.label}
          </span>
          <LanguageSwitcher tone="dark" />
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-white/50 hover:text-red-300 hover:bg-white/10 transition-all w-full"
          style={{ fontFamily: "var(--font-lato)" }}
        >
          <LogOut size={15} />
          <span>{d.logout}</span>
        </button>
      </div>
    </div>
  );
}

export default function ClientSidebar({ userName }: { userName: string }) {
  const pathname = usePathname();
  const { t } = useT();
  const d = t.dashboard;
  const [open, setOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);

  // Poll for unread messages every 30s
  useEffect(() => {
    async function fetchUnread() {
      try {
        const r = await fetch("/api/client/messages", { method: "HEAD" });
        const count = parseInt(r.headers.get("X-Unread-Count") ?? "0", 10);
        setUnreadMessages(isNaN(count) ? 0 : count);
      } catch {
        // ignore
      }
    }
    fetchUnread();
    const interval = setInterval(fetchUnread, 30_000);
    return () => clearInterval(interval);
  }, []);

  const navItems: NavItem[] = [
    { label: d.navShipments, href: "/dashboard",           icon: Package },
    { label: d.navDocuments, href: "/dashboard/documents", icon: FolderOpen },
    { label: d.navMessages,  href: "/dashboard/messages",  icon: MessageSquare, badge: unreadMessages },
    { label: d.navQuotes,    href: "/dashboard/devis",     icon: FileText },
    { label: d.navReviews,   href: "/dashboard/avis",      icon: Star },
    { label: d.navProfile,   href: "/dashboard/profil",    icon: UserCircle },
  ];

  const sidebarBg = "linear-gradient(165deg, #0e2248 0%, #1A3A6B 60%, #1e3f70 100%)";

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-[#1A3A6B] z-40 flex items-center px-4 gap-3 shadow-lg">
        <button
          onClick={() => setOpen(true)}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 text-white"
        >
          <Menu size={16} />
        </button>
        <Logo variant="onDark" className="h-5 w-auto object-contain" width={80} height={26} />
        <div className="ml-auto flex items-center gap-2">
          {unreadMessages > 0 && (
            <Link
              href="/dashboard/messages"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black text-white"
              style={{ backgroundColor: "#E8520A", fontFamily: "var(--font-montserrat)" }}
            >
              <MessageSquare size={11} />
              {unreadMessages > 9 ? "9+" : unreadMessages}
            </Link>
          )}
          <NotificationBell tone="dark" />
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex w-60 shrink-0 flex-col min-h-screen sticky top-0 h-screen shadow-xl z-30"
        style={{ background: sidebarBg }}
      >
        <NavContent
          userName={userName}
          pathname={pathname}
          navItems={navItems}
        />
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div
            className="absolute left-0 top-0 bottom-0 w-64 flex flex-col shadow-2xl"
            style={{ background: sidebarBg }}
          >
            <NavContent
              userName={userName}
              pathname={pathname}
              navItems={navItems}
              onClose={() => setOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}
