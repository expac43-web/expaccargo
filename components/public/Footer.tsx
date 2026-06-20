"use client";

import Link from "next/link";
import Logo from "@/components/ui/Logo";
import { MapPin, Phone, Mail, Globe } from "lucide-react";
import { useT } from "@/components/i18n/LanguageProvider";

export default function Footer() {
  const { t } = useT();
  return (
    <footer style={{ backgroundColor: "#1A3A6B" }} className="text-white">
      {/* Top accent line */}
      <div style={{ backgroundColor: "#E8520A" }} className="h-1 w-full" />

      <div className="container-custom pb-10" style={{ paddingTop: "5rem" }}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-14 border-b border-blue-800">

          {/* Brand */}
          <div className="md:col-span-1">
            <div className="mb-5">
              <Logo variant="onDark" className="h-9 w-auto object-contain" width={120} height={40} />
            </div>
            <p className="text-sm text-blue-200 leading-relaxed mb-3" style={{ fontFamily: "var(--font-lato)" }}>
              {t.footer.tagline}
            </p>
            <p className="text-xs text-blue-400" style={{ fontFamily: "var(--font-lato)" }}>
              {t.footer.legalLine}
            </p>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.15em] text-blue-300 mb-5"
              style={{ fontFamily: "var(--font-montserrat)" }}>
              {t.footer.servicesTitle}
            </h3>
            <ul className="space-y-3">
              {[
                { label: t.footer.svcTransit, href: "/services#transit" },
                { label: t.footer.svcMultimodal, href: "/services#transport" },
                { label: t.footer.svcStorage, href: "/services#stockage" },
                { label: t.footer.svcConsignment, href: "/services#consignation" },
                { label: t.footer.svcGroupage, href: "/services#groupage" },
              ].map((s) => (
                <li key={s.href}>
                  <Link href={s.href} className="text-sm text-blue-200 hover:text-white transition-colors"
                    style={{ fontFamily: "var(--font-lato)" }}>
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Liens */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.15em] text-blue-300 mb-5"
              style={{ fontFamily: "var(--font-montserrat)" }}>
              {t.footer.linksTitle}
            </h3>
            <ul className="space-y-3">
              {[
                { label: t.footer.linkTrack, href: "/tracking" },
                { label: t.footer.linkQuote, href: "/devis" },
                { label: t.footer.linkNews, href: "/actualites" },
                { label: t.footer.linkClient, href: "/login" },
                { label: t.footer.linkLegal, href: "/mentions-legales" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-blue-200 hover:text-white transition-colors"
                    style={{ fontFamily: "var(--font-lato)" }}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact — deux bureaux */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.15em] text-blue-300 mb-5"
              style={{ fontFamily: "var(--font-montserrat)" }}>
              {t.footer.officesTitle}
            </h3>
            <ul className="space-y-5">

              {/* Pointe-Noire */}
              <li>
                <p className="text-xs font-black uppercase tracking-wide mb-2" style={{ color: "#fba563", fontFamily: "var(--font-montserrat)" }}>
                  Pointe-Noire
                </p>
                <div className="flex items-start gap-2.5 text-sm text-blue-200 mb-1.5">
                  <MapPin size={13} className="mt-0.5 shrink-0 text-[#E8520A]" />
                  <span style={{ fontFamily: "var(--font-lato)" }}>
                    Résidence les Palmiers, Bat C 2ème étage, Appt Caïman — Av. Germain Bikoumat, Centre-Ville
                  </span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-blue-200 mb-1">
                  <Phone size={13} className="shrink-0 text-[#E8520A]" />
                  <a href="tel:+242064363882" className="hover:text-white transition-colors" style={{ fontFamily: "var(--font-lato)" }}>
                    +242 06 436 38 82
                  </a>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-blue-200 mb-1">
                  <Phone size={13} className="shrink-0 text-[#E8520A]" />
                  <a href="tel:+242050526043" className="hover:text-white transition-colors" style={{ fontFamily: "var(--font-lato)" }}>
                    +242 05 052 60 43
                  </a>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-blue-200">
                  <Mail size={13} className="shrink-0 text-[#E8520A]" />
                  <a href="mailto:agence.pn@expaccargo.com" className="hover:text-white transition-colors" style={{ fontFamily: "var(--font-lato)" }}>
                    agence.pn@expaccargo.com
                  </a>
                </div>
              </li>

              {/* Brazzaville */}
              <li>
                <p className="text-xs font-black uppercase tracking-wide mb-2" style={{ color: "#fba563", fontFamily: "var(--font-montserrat)" }}>
                  {t.footer.headquarters}
                </p>
                <div className="flex items-start gap-2.5 text-sm text-blue-200 mb-1.5">
                  <MapPin size={13} className="mt-0.5 shrink-0 text-[#E8520A]" />
                  <span style={{ fontFamily: "var(--font-lato)" }}>
                    Croisement Av. de la Tsieme / Rue Mbetis Ouenze SOCECA-SOCEMA BZV
                  </span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-blue-200 mb-1">
                  <Phone size={13} className="shrink-0 text-[#E8520A]" />
                  <a href="tel:+242055119711" className="hover:text-white transition-colors" style={{ fontFamily: "var(--font-lato)" }}>
                    +242 05 511 97 11
                  </a>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-blue-200 mb-2">
                  <Phone size={13} className="shrink-0 text-[#E8520A]" />
                  <a href="tel:+242056402277" className="hover:text-white transition-colors" style={{ fontFamily: "var(--font-lato)" }}>
                    +242 05 640 22 77
                  </a>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-blue-200 mb-1">
                  <Mail size={13} className="shrink-0 text-[#E8520A]" />
                  <a href="mailto:agence.bz@expaccargo.com" className="hover:text-white transition-colors" style={{ fontFamily: "var(--font-lato)" }}>
                    agence.bz@expaccargo.com
                  </a>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-blue-200">
                  <Globe size={13} className="shrink-0 text-[#E8520A]" />
                  <a href="http://expaccargo.com" target="_blank" rel="noopener noreferrer"
                    className="hover:text-white transition-colors" style={{ fontFamily: "var(--font-lato)" }}>
                    expaccargo.com
                  </a>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-blue-400">
          <p style={{ fontFamily: "var(--font-lato)" }}>
            © {new Date().getFullYear()} Express Africa Cargo Ltd (EXPAC). {t.footer.rights}
          </p>
          <div className="flex items-center gap-4">
            <p className="text-blue-500 text-xs" style={{ fontFamily: "var(--font-lato)" }}>
              RC : CG-BZV-01-2021-B12-00199
            </p>
            <p className="font-black uppercase tracking-wider text-blue-400" style={{ fontFamily: "var(--font-montserrat)" }}>
              {t.footer.tagFast}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
