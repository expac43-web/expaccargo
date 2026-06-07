"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Menu, X, LayoutDashboard } from "lucide-react";
import { useSession } from "next-auth/react";

const links = [
  { label: "Services", href: "/services" },
  { label: "Suivi", href: "/tracking" },
  { label: "Devis", href: "/devis" },
  { label: "Partenaires", href: "/partenaires" },
  { label: "Actualités", href: "/actualites" },
  { label: "Contact", href: "/contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { data: session, status } = useSession();
  const isLoading = status === "loading";
  const isLoggedIn = status === "authenticated";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/96 backdrop-blur-md shadow-sm border-b border-gray-100">
      <div className="container-custom flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Image
            src="/images/logo.jpeg"
            alt="EXPAC Logo"
            width={130}
            height={44}
            className="h-11 w-auto object-contain"
            priority
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-7">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-xs font-black uppercase tracking-wider text-gray-500 hover:text-[#1A3A6B] transition-colors"
              style={{ fontFamily: "var(--font-montserrat)" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Auth buttons — desktop */}
        <div className="hidden md:flex items-center gap-2">
          {isLoading ? (
            <div className="w-24 h-8 rounded-lg bg-gray-100 animate-pulse" />
          ) : isLoggedIn ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black text-white uppercase tracking-wide transition-all hover:opacity-90"
              style={{ backgroundColor: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}
            >
              <LayoutDashboard size={14} />
              {session?.user?.name?.split(" ")[0] ?? "Mon compte"}
            </Link>
          ) : (
            <>
              <Link
                href="/inscription"
                className="inline-flex items-center px-4 py-2 rounded-lg text-xs font-black text-white uppercase tracking-wide transition-all hover:opacity-90"
                style={{ backgroundColor: "#E8520A", fontFamily: "var(--font-montserrat)" }}
              >
                Inscription
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center px-4 py-2 rounded-lg text-xs font-black text-white uppercase tracking-wide transition-all hover:opacity-90"
                style={{ backgroundColor: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}
              >
                Connexion
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-white border-t border-gray-100 px-6 py-5 flex flex-col gap-4">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="text-xs font-black uppercase tracking-wider text-gray-600 hover:text-[#1A3A6B]"
              style={{ fontFamily: "var(--font-montserrat)" }}
            >
              {l.label}
            </Link>
          ))}

          <div className="flex gap-2 pt-2">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="flex-1 inline-flex justify-center items-center gap-2 px-4 py-3 rounded-lg text-xs font-black text-white uppercase tracking-wide"
                style={{ backgroundColor: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}
              >
                <LayoutDashboard size={14} />
                Mon compte
              </Link>
            ) : (
              <>
                <Link
                  href="/inscription"
                  onClick={() => setOpen(false)}
                  className="flex-1 inline-flex justify-center items-center px-4 py-3 rounded-lg text-xs font-black text-white uppercase tracking-wide"
                  style={{ backgroundColor: "#E8520A", fontFamily: "var(--font-montserrat)" }}
                >
                  Inscription
                </Link>
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="flex-1 inline-flex justify-center items-center px-4 py-3 rounded-lg text-xs font-black text-white uppercase tracking-wide"
                  style={{ backgroundColor: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}
                >
                  Connexion
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
