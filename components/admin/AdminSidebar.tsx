"use client";

import Link from "next/link";
import Logo from "@/components/ui/Logo";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
import {
  LayoutDashboard,
  Package,
  Users,
  Building2,
  FileText,
  Newspaper,
  Handshake,
  LogOut,
  ChevronRight,
  ShieldCheck,
  UserCircle,
  UserPlus,
  Calculator,
  Menu,
  X,
} from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import GlobalSearch from "@/components/GlobalSearch";

const navItems = [
  { label: "Tableau de bord", href: "/dashboard/admin", icon: LayoutDashboard },
  { label: "Expéditions",     href: "/dashboard/admin/expeditions", icon: Package },
  { label: "Clients",         href: "/dashboard/admin/clients", icon: Users },
  { label: "Agences",         href: "/dashboard/admin/agences", icon: Building2 },
  { label: "Comptes",         href: "/dashboard/admin/comptes", icon: UserPlus },
  { label: "Devis",           href: "/dashboard/admin/devis", icon: FileText },
  { label: "Tarifs",          href: "/dashboard/admin/tarifs", icon: Calculator },
  { label: "Actualités",      href: "/dashboard/admin/actualites", icon: Newspaper },
  { label: "Partenaires",     href: "/dashboard/admin/partenaires", icon: Handshake },
  { label: "Mon profil",      href: "/dashboard/admin/profil", icon: UserCircle },
];

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super administrateur",
  MANAGER:     "Gestionnaire",
  AGENCY:      "Agence",
};

function NavContent({
  role,
  userName,
  pathname,
  onClose,
}: {
  role: string;
  userName: string;
  pathname: string;
  onClose?: () => void;
}) {
  return (
    <>
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-gray-100 shrink-0">
        <Link href="/" onClick={onClose}>
          <Logo className="h-8 w-auto object-contain" width={100} height={36} priority />
        </Link>
        <div className="flex items-center gap-1">
          <GlobalSearch clientBase="/dashboard/admin/clients" />
          <NotificationBell />
          {onClose && (
            <button onClick={onClose} className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100">
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* User badge */}
      <div className="px-4 py-4 border-b border-gray-100 shrink-0">
        <Link
          href="/dashboard/admin/profil"
          onClick={onClose}
          className="flex items-center gap-3 bg-gray-50 hover:bg-gray-100 rounded-xl p-3 transition-colors"
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, #0e2248 0%, #1A3A6B 100%)" }}
          >
            <ShieldCheck size={17} color="white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-black truncate" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
              {userName}
            </p>
            <p className="text-xs text-gray-400 truncate" style={{ fontFamily: "var(--font-lato)" }}>
              {ROLE_LABELS[role] ?? role}
            </p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard/admin" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-black transition-all"
              style={{
                fontFamily: "var(--font-montserrat)",
                backgroundColor: active ? "rgba(26,58,107,0.08)" : "transparent",
                color: active ? "#1A3A6B" : "#6b7280",
              }}
            >
              <Icon size={17} />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight size={13} />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-gray-100 shrink-0">
        <button
          onClick={() => signOut({ callbackUrl: "/expac-login" })}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-black text-gray-500 hover:text-red-500 hover:bg-red-50 transition-all"
          style={{ fontFamily: "var(--font-montserrat)" }}
        >
          <LogOut size={17} />
          Déconnexion
        </button>
      </div>
    </>
  );
}

export default function AdminSidebar({ role, userName }: { role: string; userName: string }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4">
        <Link href="/">
          <Logo className="h-7 w-auto object-contain" width={90} height={32} priority />
        </Link>
        <div className="flex items-center gap-1">
          <GlobalSearch clientBase="/dashboard/admin/clients" />
          <NotificationBell />
          <button
            onClick={() => setMobileOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500"
          >
            <Menu size={18} />
          </button>
        </div>
      </div>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`lg:hidden fixed top-0 left-0 z-50 h-full w-72 bg-white flex flex-col border-r border-gray-200 shadow-xl transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <NavContent role={role} userName={userName} pathname={pathname} onClose={() => setMobileOpen(false)} />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-gray-200 bg-white min-h-screen sticky top-0 h-screen overflow-y-auto">
        <NavContent role={role} userName={userName} pathname={pathname} />
      </aside>
    </>
  );
}
