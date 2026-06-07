"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

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

        {/* CTA + mobile toggle */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden md:inline-flex items-center px-4 py-2 rounded-lg text-xs font-black text-white uppercase tracking-wide transition-colors hover:opacity-90"
            style={{ backgroundColor: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}
          >
            Connexion
          </Link>
          <button
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
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
          <Link
            href="/login"
            onClick={() => setOpen(false)}
            className="inline-flex justify-center items-center px-4 py-3 rounded-lg text-xs font-black text-white uppercase tracking-wide"
            style={{ backgroundColor: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}
          >
            Connexion
          </Link>
        </div>
      )}
    </header>
  );
}
