"use client";

import Link from "next/link";
import Logo from "@/components/ui/Logo";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Handshake, LogOut, Menu, X, Building2, UserCircle } from "lucide-react";

const BG = "linear-gradient(165deg, #7a2d05 0%, #b8420a 55%, #E8520A 100%)";

const navItems = [
  { label: "Mes échanges", href: "/dashboard/partenaire", icon: Handshake },
  { label: "Mon profil", href: "/dashboard/partenaire/profil", icon: UserCircle },
];

function NavContent({ userName, pathname, onClose }: { userName: string; pathname: string; onClose?: () => void }) {
  const initials = userName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div className="flex flex-col h-full">
      <div className="h-16 flex items-center justify-between px-5 border-b border-white/10 shrink-0">
        <Link href="/" onClick={onClose}>
          <Logo variant="onDark" className="h-6 w-auto object-contain" width={100} height={32} priority />
        </Link>
        {onClose && (
          <button onClick={onClose} className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg text-white/70 hover:bg-white/10">
            <X size={18} />
          </button>
        )}
      </div>

      <div className="px-4 py-4 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3 bg-white/10 rounded-xl p-3">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white text-xs font-black shrink-0" style={{ fontFamily: "var(--font-montserrat)" }}>
            {initials || <Building2 size={16} />}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-black text-white truncate" style={{ fontFamily: "var(--font-montserrat)" }}>{userName}</p>
            <p className="text-xs text-white/60 truncate" style={{ fontFamily: "var(--font-lato)" }}>Partenaire</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-black transition-all ${active ? "bg-white/15 text-white" : "text-white/70 hover:text-white hover:bg-white/10"}`}
              style={{ fontFamily: "var(--font-montserrat)" }}
            >
              <Icon size={17} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-white/10 shrink-0">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-black text-white/70 hover:text-white hover:bg-white/10 transition-all"
          style={{ fontFamily: "var(--font-montserrat)" }}
        >
          <LogOut size={17} />
          Déconnexion
        </button>
      </div>
    </div>
  );
}

export default function PartenaireSidebar({ userName }: { userName: string }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <>
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 flex items-center justify-between px-4" style={{ background: BG }}>
        <Link href="/"><Logo variant="onDark" className="h-6 w-auto object-contain" width={90} height={30} priority /></Link>
        <button onClick={() => setMobileOpen(true)} className="w-9 h-9 flex items-center justify-center rounded-xl border border-white/25 text-white">
          <Menu size={18} />
        </button>
      </div>

      {mobileOpen && <div className="lg:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />}

      <aside className={`lg:hidden fixed top-0 left-0 z-50 h-full w-72 flex flex-col shadow-xl transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`} style={{ background: BG }}>
        <NavContent userName={userName} pathname={pathname} onClose={() => setMobileOpen(false)} />
      </aside>

      <aside className="hidden lg:flex w-64 shrink-0 flex-col min-h-screen sticky top-0 h-screen overflow-y-auto" style={{ background: BG }}>
        <NavContent userName={userName} pathname={pathname} />
      </aside>
    </>
  );
}
