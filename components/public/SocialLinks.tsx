/**
 * Liens réseaux sociaux (icônes solides). Réutilisable footer + page contact.
 * Les URLs sont nettoyées de leurs paramètres de partage/tracking.
 */
type Net = "linkedin" | "instagram" | "x" | "facebook";

const ALL: { key: Net; name: string; href: string; path: string }[] = [
  {
    key: "linkedin",
    name: "LinkedIn",
    href: "https://www.linkedin.com/in/makan-doucoure-b5b781151",
    path: "M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zm1.78 13.02H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z",
  },
  {
    key: "instagram",
    name: "Instagram",
    href: "https://www.instagram.com/doucmakan",
    path: "M12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63c-.79.3-1.46.72-2.12 1.38C1.36 2.67.94 3.34.63 4.14.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.3.79.72 1.46 1.38 2.12.66.66 1.33 1.08 2.12 1.38.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56.79-.3 1.46-.72 2.12-1.38.66-.66 1.08-1.33 1.38-2.12.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91-.3-.79-.72-1.46-1.38-2.12C21.33 1.36 20.66.94 19.86.63c-.76-.3-1.64-.5-2.91-.56C15.67.01 15.26 0 12 0zm0 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.43.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.43.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.72 3.72 0 0 1-1.38-.9 3.72 3.72 0 0 1-.9-1.38c-.16-.43-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.43-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16zm0 3.68a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.4-11.85a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88z",
  },
  {
    key: "x",
    name: "X",
    href: "https://x.com/makdoucoure",
    path: "M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.4l-5.8-7.58-6.64 7.58H.48l8.6-9.83L0 1.15h7.6l5.24 6.93 6.06-6.93zm-1.29 19.5h2.04L6.48 3.24H4.3L17.61 20.65z",
  },
  {
    key: "facebook",
    name: "Facebook",
    href: "https://www.facebook.com/share/1H5JaZ5r1g/",
    path: "M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.5c-1.48 0-1.95.92-1.95 1.87v2.25h3.31l-.53 3.49h-2.78V24C19.61 23.1 24 18.1 24 12.07z",
  },
];

export default function SocialLinks({
  networks,
  className = "",
  itemClassName = "",
  size = 16,
  disabled = false,
}: {
  /** Sous-ensemble à afficher (par défaut : tous). */
  networks?: Net[];
  className?: string;
  itemClassName?: string;
  size?: number;
  /** Affiche les icônes sans lien (placeholder non cliquable, en attente des comptes). */
  disabled?: boolean;
}) {
  const items = networks ? ALL.filter((a) => networks.includes(a.key)) : ALL;
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {items.map((s) => {
        const icon = (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d={s.path} />
          </svg>
        );
        if (disabled) {
          return (
            <span key={s.key} aria-label={`${s.name} (bientôt disponible)`} title="Bientôt disponible" className={`${itemClassName} cursor-not-allowed opacity-50`}>
              {icon}
            </span>
          );
        }
        return (
          <a key={s.key} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.name} title={s.name} className={itemClassName}>
            {icon}
          </a>
        );
      })}
    </div>
  );
}
