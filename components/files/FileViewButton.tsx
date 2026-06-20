"use client";

import { useState } from "react";
import { Eye, X, Download, Loader2 } from "lucide-react";

const IMAGE_EXT = ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg", "avif"];

function isImage(name: string): boolean {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  return IMAGE_EXT.includes(ext);
}

/**
 * Bouton « Ouvrir / lire » d'un document servi par le proxy /api/files/[id].
 * - Image → aperçu dans une fenêtre modale sur le site.
 * - PDF / Excel / autre → ouverture dans un nouvel onglet (lecture native).
 */
export default function FileViewButton({
  docId, name, className, style, iconSize = 14, iconColor = "#1A3A6B",
}: {
  docId: string;
  name: string;
  className?: string;
  style?: React.CSSProperties;
  iconSize?: number;
  iconColor?: string;
}) {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const url = `/api/files/${docId}`;

  if (!isImage(name)) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" title="Ouvrir / lire" className={className} style={style}>
        <Eye size={iconSize} style={{ color: iconColor }} />
      </a>
    );
  }

  return (
    <>
      <button type="button" onClick={() => { setOpen(true); setLoaded(false); }} title="Aperçu" className={className} style={style}>
        <Eye size={iconSize} style={{ color: iconColor }} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div className="relative w-auto max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-3 mb-2">
              <p className="text-white text-sm font-black truncate" style={{ fontFamily: "var(--font-montserrat)" }}>{name}</p>
              <div className="flex items-center gap-2 shrink-0">
                <a href={`${url}?download=1`} className="w-9 h-9 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors" title="Télécharger">
                  <Download size={16} />
                </a>
                <button onClick={() => setOpen(false)} className="w-9 h-9 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors" title="Fermer">
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className="relative rounded-xl overflow-hidden bg-white/5 flex items-center justify-center min-h-[120px]">
              {!loaded && <Loader2 size={26} className="animate-spin text-white/70 absolute" />}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={name}
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
