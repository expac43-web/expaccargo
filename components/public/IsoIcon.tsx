import * as React from "react";

/**
 * Icônes 3D isométriques (SVG inline, ~1 Ko, aucune image externe).
 * Cube de base à 3 faces ombrées (navy) + détail orange par usage.
 */
const TOP = "#3a63ab";
const LEFT = "#0f2647";
const RIGHT = "#1c3f74";
const O = "#E8520A";

function Cube() {
  return (
    <>
      <polygon points="32,6 57,20 32,34 7,20" fill={TOP} />
      <polygon points="7,20 32,34 32,58 7,44" fill={LEFT} />
      <polygon points="57,20 32,34 32,58 57,44" fill={RIGHT} />
    </>
  );
}

const ICONS: Record<string, React.ReactNode> = {
  // Transit douanier — coche « dédouané »
  transit: (
    <>
      <Cube />
      <polyline points="37,39 42,44 51,31" fill="none" stroke={O} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  // Transport — caisse sur roues
  transport: (
    <>
      <Cube />
      <circle cx="23" cy="55" r="3.4" fill={O} />
      <circle cx="41" cy="55" r="3.4" fill={O} />
    </>
  ),
  // Stockage — caisse à planches
  stockage: (
    <>
      <Cube />
      <line x1="32" y1="42" x2="57" y2="28" stroke={O} strokeWidth="2.4" strokeLinecap="round" />
      <line x1="32" y1="50" x2="57" y2="36" stroke={O} strokeWidth="2.4" strokeLinecap="round" />
    </>
  ),
  // Consignation maritime — conteneur (nervures verticales)
  maritime: (
    <>
      <Cube />
      <line x1="40.3" y1="29.3" x2="40.3" y2="53.3" stroke={O} strokeWidth="2" strokeLinecap="round" />
      <line x1="48.7" y1="24.7" x2="48.7" y2="48.7" stroke={O} strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  // Groupage — colis sanglé
  groupage: (
    <>
      <Cube />
      <line x1="32" y1="47" x2="57" y2="33" stroke={O} strokeWidth="3" strokeLinecap="round" />
      <line x1="32" y1="47" x2="7" y2="33" stroke={O} strokeWidth="3" strokeLinecap="round" />
    </>
  ),
  // Suivi — repère de localisation sur le colis
  suivi: (
    <>
      <Cube />
      <path d="M32 8 C27 8 24 11.5 24 15.5 C24 21 32 26 32 26 C32 26 40 21 40 15.5 C40 11.5 37 8 32 8 Z" fill={O} />
      <circle cx="32" cy="15.5" r="2.6" fill="#ffffff" />
    </>
  ),
};

export default function IsoIcon({
  name, size = 64, className,
}: { name: string; size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} aria-hidden="true">
      {ICONS[name] ?? ICONS.transit}
    </svg>
  );
}
