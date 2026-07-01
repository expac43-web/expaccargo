"use client";

import Link from "next/link";
import Logo from "@/components/ui/Logo";
import { useState } from "react";
import { Menu, X, LayoutDashboard, ChevronDown } from "lucide-react";
import { useSession } from "next-auth/react";
import { useT } from "@/components/i18n/LanguageProvider";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";

type NavLink = { label: string; href: string; children?: { label: string; href: string }[] };

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { data: session, status } = useSession();
  const { t } = useT();
  const isLoading = status === "loading";
  const isLoggedIn = status === "authenticated";

  const links: NavLink[] = [
    { label: t.nav.home, href: "/" },
    {
      label: t.nav.services,
      href: "/services",
      children: [
        { label: t.nav.servicesOverview, href: "/services" },
        { label: t.nav.calculator, href: "/calculateur" },
        { label: t.nav.requestQuote, href: "/devis" },
      ],
    },
    { label: t.nav.about, href: "/a-propos" },
    { label: t.nav.rates, href: "/taux" },
    { label: t.nav.news, href: "/actualites" },
    { label: t.nav.contact, href: "/contact" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/96 backdrop-blur-md shadow-sm border-b border-gray-100">
      <div className="container-custom flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Logo className="h-11 w-auto object-contain" width={130} height={44} priority />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-7">
          {links.map((l) =>
            l.children ? (
              <div key={l.href} className="relative group">
                <Link
                  href={l.href}
                  className="flex items-center gap-1 text-xs font-black uppercase tracking-wider text-gray-500 hover:text-[#1A3A6B] transition-colors"
                  style={{ fontFamily: "var(--font-montserrat)" }}
                >
                  {l.label}
                  <ChevronDown size={13} className="transition-transform duration-200 group-hover:rotate-180" />
                </Link>
                {/* pt-3 fait le pont sous le lien pour ne pas perdre le survol */}
                <div className="absolute left-0 top-full pt-3 opacity-0 invisible translate-y-1 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-150 z-50">
                  <div className="bg-white rounded-xl shadow-lg border border-gray-100 py-2 min-w-[210px]">
                    {l.children.map((c) => (
                      <Link
                        key={c.href}
                        href={c.href}
                        className="block px-4 py-2.5 text-xs font-black uppercase tracking-wider text-gray-500 hover:text-[#1A3A6B] hover:bg-gray-50 transition-colors"
                        style={{ fontFamily: "var(--font-montserrat)" }}
                      >
                        {c.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <Link
                key={l.href}
                href={l.href}
                className="text-xs font-black uppercase tracking-wider text-gray-500 hover:text-[#1A3A6B] transition-colors"
                style={{ fontFamily: "var(--font-montserrat)" }}
              >
                {l.label}
              </Link>
            )
          )}
        </nav>

        {/* Auth buttons — desktop */}
        <div className="hidden md:flex items-center gap-2">
          <LanguageSwitcher />
          {isLoading ? (
            <div className="w-24 h-8 rounded-lg bg-gray-100 animate-pulse" />
          ) : isLoggedIn ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black text-white uppercase tracking-wide transition-all hover:opacity-90"
              style={{ backgroundColor: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}
            >
              <LayoutDashboard size={14} />
              {session?.user?.name?.split(" ")[0] ?? t.nav.account}
            </Link>
          ) : (
            <>
              <Link
                href="/inscription"
                className="inline-flex items-center px-4 py-2 rounded-lg text-xs font-black text-white uppercase tracking-wide transition-all hover:opacity-90"
                style={{ backgroundColor: "#E8520A", fontFamily: "var(--font-montserrat)" }}
              >
                {t.nav.register}
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center px-4 py-2 rounded-lg text-xs font-black text-white uppercase tracking-wide transition-all hover:opacity-90"
                style={{ backgroundColor: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}
              >
                {t.nav.login}
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
          {links.map((l) =>
            l.children ? (
              <div key={l.href} className="flex flex-col gap-3">
                <span className="text-xs font-black uppercase tracking-wider text-gray-400" style={{ fontFamily: "var(--font-montserrat)" }}>
                  {l.label}
                </span>
                <div className="flex flex-col gap-3 pl-4 border-l-2 border-gray-100">
                  {l.children.map((c) => (
                    <Link
                      key={c.href}
                      href={c.href}
                      onClick={() => setOpen(false)}
                      className="text-xs font-black uppercase tracking-wider text-gray-600 hover:text-[#1A3A6B]"
                      style={{ fontFamily: "var(--font-montserrat)" }}
                    >
                      {c.label}
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="text-xs font-black uppercase tracking-wider text-gray-600 hover:text-[#1A3A6B]"
                style={{ fontFamily: "var(--font-montserrat)" }}
              >
                {l.label}
              </Link>
            )
          )}

          <div className="flex items-center justify-between gap-2 pt-2">
            <span className="text-xs font-black uppercase tracking-wider text-gray-400" style={{ fontFamily: "var(--font-montserrat)" }}>
              {t.switcher.label}
            </span>
            <LanguageSwitcher />
          </div>

          <div className="flex gap-2 pt-1">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="flex-1 inline-flex justify-center items-center gap-2 px-4 py-3 rounded-lg text-xs font-black text-white uppercase tracking-wide"
                style={{ backgroundColor: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}
              >
                <LayoutDashboard size={14} />
                {t.nav.account}
              </Link>
            ) : (
              <>
                <Link
                  href="/inscription"
                  onClick={() => setOpen(false)}
                  className="flex-1 inline-flex justify-center items-center px-4 py-3 rounded-lg text-xs font-black text-white uppercase tracking-wide"
                  style={{ backgroundColor: "#E8520A", fontFamily: "var(--font-montserrat)" }}
                >
                  {t.nav.register}
                </Link>
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="flex-1 inline-flex justify-center items-center px-4 py-3 rounded-lg text-xs font-black text-white uppercase tracking-wide"
                  style={{ backgroundColor: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}
                >
                  {t.nav.login}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
