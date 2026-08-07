"use client";

import { useState } from "react";
import { X, Download, Loader2 } from "lucide-react";

// Mêmes extensions que FileViewButton : aperçu image sur le site, le reste en
// nouvel onglet (lecture native du navigateur pour PDF / Excel / etc.).
const IMAGE_EXT = ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg", "avif"];

export function isImageName(name?: string | null): boolean {
  if (!name) return false;
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  return IMAGE_EXT.includes(ext);
}

/**
 * Enveloppe une cible cliquable (`children`) pour un fichier privé servi par un
 * proxy authentifié :
 *  - image  → aperçu dans une fenêtre modale sur le site ;
 *  - autre  → ouverture dans un nouvel onglet.
 * Reproduit le comportement de FileViewButton pour une URL arbitraire.
 */
export default function PrivateFileView({
  url, name, title, className, style, children,
}: {
  url: string;
  name?: string | null;
  title?: string;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (!isImageName(name)) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" title={title} className={className} style={style}>
        {children}
      </a>
    );
  }

  return (
    <>
      <button type="button" onClick={() => { setOpen(true); setLoaded(false); }} title={title} className={className} style={style}>
        {children}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div className="relative w-auto max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-end gap-2 mb-2">
              <a href={`${url}${url.includes("?") ? "&" : "?"}download=1`} className="w-9 h-9 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors" title="Télécharger">
                <Download size={16} />
              </a>
              <button onClick={() => setOpen(false)} className="w-9 h-9 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors" title="Fermer">
                <X size={16} />
              </button>
            </div>
            <div className="relative rounded-xl overflow-hidden bg-white/5 flex items-center justify-center min-h-[120px]">
              {!loaded && <Loader2 size={26} className="animate-spin text-white/70 absolute" />}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={name ?? "Aperçu"}
                onLoad={() => setLoaded(true)}
                className="max-w-full max-h-[80vh] object-contain rounded-xl"
                style={{ opacity: loaded ? 1 : 0 }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
