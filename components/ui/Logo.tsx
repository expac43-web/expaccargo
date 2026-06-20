import Image from "next/image";

/**
 * Composant Logo réutilisable pour tout le site EXPAC.
 *
 * variant="onLight"  → fond clair (navbar, pages login, sidebar admin blanc)
 *                      → image directe, aucun fond supplémentaire
 *
 * variant="onDark"   → fond sombre (sidebar client, footer, headers foncés)
 *                      → image encadrée dans une pastille blanche pour que
 *                        le logo JPEG reste lisible quelle que soit sa couleur
 */
interface LogoProps {
  /** "onLight" (défaut) pour fond clair, "onDark" pour fond sombre */
  variant?: "onLight" | "onDark";
  /** Classe Tailwind appliquée à l'image : contrôle la hauteur (ex: "h-9") */
  className?: string;
  /** Largeur intrinsèque Next/Image (pixel) — ne contrôle pas l'affichage */
  width?: number;
  /** Hauteur intrinsèque Next/Image (pixel) — ne contrôle pas l'affichage */
  height?: number;
  /** Priorité de chargement Next/Image (true sur les logos above-the-fold) */
  priority?: boolean;
}

export default function Logo({
  variant = "onLight",
  className = "h-8 w-auto object-contain",
  width = 130,
  height = 44,
  priority = false,
}: LogoProps) {
  const img = (
    <Image
      src="/images/logo.jpeg"
      alt="EXPAC — Express Africa Cargo"
      width={width}
      height={height}
      className={className}
      priority={priority}
    />
  );

  if (variant === "onDark") {
    return (
      <div className="inline-flex items-center bg-white rounded-lg px-2.5 py-1 shadow-sm shrink-0">
        {img}
      </div>
    );
  }

  return img;
}
