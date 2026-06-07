import Image from "next/image";
import Link from "next/link";
import { MapPin, Phone, Mail, Globe } from "lucide-react";

export default function Footer() {
  return (
    <footer style={{ backgroundColor: "#1A3A6B" }} className="text-white">
      {/* Top accent line */}
      <div style={{ backgroundColor: "#E8520A" }} className="h-1 w-full" />

      <div className="container-custom pb-10" style={{ paddingTop: "5rem" }}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-14 border-b border-blue-800">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="inline-block bg-white rounded-xl px-3 py-2 mb-5">
              <Image
                src="/images/logo.jpeg"
                alt="EXPAC"
                width={120}
                height={40}
                className="h-10 w-auto object-contain"
              />
            </div>
            <p
              className="text-sm text-blue-200 leading-relaxed"
              style={{ fontFamily: "var(--font-lato)" }}
            >
              Votre partenaire en logistique internationale, transit et transport
              multimodal en Afrique.
            </p>
          </div>

          {/* Services */}
          <div>
            <h3
              className="text-xs font-black uppercase tracking-[0.15em] text-blue-300 mb-5"
              style={{ fontFamily: "var(--font-montserrat)" }}
            >
              Services
            </h3>
            <ul className="space-y-3">
              {[
                { label: "Transit", href: "/services#transit" },
                { label: "Transport Multimodal", href: "/services#transport" },
                { label: "Stockage", href: "/services#stockage" },
                { label: "Consignation Maritime", href: "/services#consignation" },
                { label: "Groupage", href: "/services#groupage" },
              ].map((s) => (
                <li key={s.href}>
                  <Link
                    href={s.href}
                    className="text-sm text-blue-200 hover:text-white transition-colors"
                    style={{ fontFamily: "var(--font-lato)" }}
                  >
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Liens */}
          <div>
            <h3
              className="text-xs font-black uppercase tracking-[0.15em] text-blue-300 mb-5"
              style={{ fontFamily: "var(--font-montserrat)" }}
            >
              Liens utiles
            </h3>
            <ul className="space-y-3">
              {[
                { label: "Suivre une expédition", href: "/tracking" },
                { label: "Demander un devis", href: "/devis" },
                { label: "Actualités", href: "/actualites" },
                { label: "Espace client", href: "/login" },
                { label: "Mentions légales", href: "/mentions-legales" },
              ].map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-blue-200 hover:text-white transition-colors"
                    style={{ fontFamily: "var(--font-lato)" }}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3
              className="text-xs font-black uppercase tracking-[0.15em] text-blue-300 mb-5"
              style={{ fontFamily: "var(--font-montserrat)" }}
            >
              Contact
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-2.5 text-sm text-blue-200">
                <MapPin size={15} className="mt-0.5 shrink-0 text-[#E8520A]" />
                <span style={{ fontFamily: "var(--font-lato)" }}>
                  Express Africa Cargo Ltd, Afrique
                </span>
              </li>
              <li className="flex items-center gap-2.5 text-sm text-blue-200">
                <Phone size={15} className="shrink-0 text-[#E8520A]" />
                <a
                  href="tel:+221000000000"
                  className="hover:text-white transition-colors"
                  style={{ fontFamily: "var(--font-lato)" }}
                >
                  +221 00 000 00 00
                </a>
              </li>
              <li className="flex items-center gap-2.5 text-sm text-blue-200">
                <Mail size={15} className="shrink-0 text-[#E8520A]" />
                <a
                  href="mailto:contact@expaccargoltd.com"
                  className="hover:text-white transition-colors"
                  style={{ fontFamily: "var(--font-lato)" }}
                >
                  contact@expaccargoltd.com
                </a>
              </li>
              <li className="flex items-center gap-2.5 text-sm text-blue-200">
                <Globe size={15} className="shrink-0 text-[#E8520A]" />
                <a
                  href="http://expaccargoltd.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                  style={{ fontFamily: "var(--font-lato)" }}
                >
                  expaccargoltd.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-blue-400">
          <p style={{ fontFamily: "var(--font-lato)" }}>
            © {new Date().getFullYear()} Express Africa Cargo Ltd. Tous droits réservés.
          </p>
          <p
            className="font-black uppercase tracking-wider text-blue-400"
            style={{ fontFamily: "var(--font-montserrat)" }}
          >
            Sûr et Rapide
          </p>
        </div>
      </div>
    </footer>
  );
}
