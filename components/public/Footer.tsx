import Image from "next/image";
import Link from "next/link";
import { MapPin, Phone, Mail, Globe } from "lucide-react";

export default function Footer() {
  return (
    <footer style={{ backgroundColor: "#1A3A6B" }} className="text-white">
      <div className="container-custom py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="inline-block bg-white rounded-xl px-3 py-2 mb-4">
              <Image
                src="/images/logo.jpeg"
                alt="EXPAC"
                width={120}
                height={40}
                className="h-10 w-auto object-contain"
              />
            </div>
            <p className="text-sm text-blue-200 leading-relaxed">
              Votre partenaire en logistique internationale, transit et transport
              multimodal en Afrique.
            </p>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider text-blue-300 mb-4">
              Services
            </h3>
            <ul className="space-y-2">
              {[
                { label: "Transit", href: "/services/transit" },
                { label: "Transport Multimodal", href: "/services/transport" },
                { label: "Stockage", href: "/services/stockage" },
                { label: "Consignation Maritime", href: "/services/consignation" },
                { label: "Groupage", href: "/services/groupage" },
              ].map((s) => (
                <li key={s.href}>
                  <Link
                    href={s.href}
                    className="text-sm text-blue-200 hover:text-white transition-colors"
                  >
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Liens */}
          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider text-blue-300 mb-4">
              Liens utiles
            </h3>
            <ul className="space-y-2">
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
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider text-blue-300 mb-4">
              Contact
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-blue-200">
                <MapPin size={15} className="mt-0.5 shrink-0 text-[#E8520A]" />
                <span>Express Africa Cargo Ltd, Afrique</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-blue-200">
                <Phone size={15} className="shrink-0 text-[#E8520A]" />
                <a href="tel:+221000000000" className="hover:text-white transition-colors">
                  +221 00 000 00 00
                </a>
              </li>
              <li className="flex items-center gap-2 text-sm text-blue-200">
                <Mail size={15} className="shrink-0 text-[#E8520A]" />
                <a href="mailto:contact@expaccargoltd.com" className="hover:text-white transition-colors">
                  contact@expaccargoltd.com
                </a>
              </li>
              <li className="flex items-center gap-2 text-sm text-blue-200">
                <Globe size={15} className="shrink-0 text-[#E8520A]" />
                <a href="http://expaccargoltd.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  expaccargoltd.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-blue-800 flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-blue-300">
          <p>© {new Date().getFullYear()} Express Africa Cargo Ltd. Tous droits réservés.</p>
          <p>Conçu avec expertise pour l&apos;Afrique</p>
        </div>
      </div>
    </footer>
  );
}
