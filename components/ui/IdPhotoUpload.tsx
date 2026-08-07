"use client";

import { useState } from "react";
import { Camera, Upload, Loader2, AlertCircle, CheckCircle2, FileText, ExternalLink } from "lucide-react";

/**
 * Chargement de la pièce d'identité (staff) — bucket privé.
 * Aperçu image (ou icône PDF), bouton charger / remplacer, lien « Voir ».
 * Le fichier est servi par le proxy authentifié (viewUrl).
 */
export default function IdPhotoUpload({
  viewUrl, hasPhoto, uploadEndpoint, accentColor = "#1A3A6B",
}: {
  viewUrl: string; hasPhoto: boolean; uploadEndpoint: string; accentColor?: string;
}) {
  const [has, setHas] = useState(hasPhoto);
  const [version, setVersion] = useState(() => Date.now());
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);
  const [imgError, setImgError] = useState(false);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(""); setOk(false);
    if (file.size > 5 * 1024 * 1024) { setError("Taille max : 5 Mo."); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch(uploadEndpoint, { method: "POST", body: fd });
      if (!r.ok) { const d = await r.json().catch(() => ({})); setError(d.error ?? "Erreur lors de l'envoi."); return; }
      setHas(true); setImgError(false); setVersion(Date.now()); setOk(true);
      setTimeout(() => setOk(false), 2500);
    } finally {
      setUploading(false);
    }
  }

  const src = `${viewUrl}?v=${version}`;

  return (
    <div>
      <div className="flex items-center gap-4">
        <div className="w-24 h-16 rounded-xl border border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center shrink-0">
          {has && !imgError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt="Pièce d'identité" className="w-full h-full object-cover" onError={() => setImgError(true)} />
          ) : has && imgError ? (
            <FileText size={22} className="text-gray-400" />
          ) : (
            <Camera size={22} className="text-gray-300" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-black uppercase text-white cursor-pointer hover:opacity-90" style={{ backgroundColor: accentColor, fontFamily: "var(--font-montserrat)" }}>
              {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
              {uploading ? "Envoi…" : has ? "Remplacer" : "Charger"}
              <input type="file" accept="image/*,application/pdf,.pdf,.heic,.heif" className="hidden" onChange={onPick} disabled={uploading} />
            </label>
            {has && (
              <a href={src} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-black" style={{ color: accentColor, fontFamily: "var(--font-montserrat)" }}>
                <ExternalLink size={12} /> Voir
              </a>
            )}
          </div>
          <p className="text-[11px] text-gray-400 mt-1.5" style={{ fontFamily: "var(--font-lato)" }}>Image ou PDF, 5 Mo max. Visible par l&apos;administration.</p>
        </div>
      </div>
      {error && <p className="flex items-center gap-1 text-[11px] text-red-500 mt-2" style={{ fontFamily: "var(--font-lato)" }}><AlertCircle size={12} />{error}</p>}
      {ok && <p className="flex items-center gap-1 text-[11px] text-green-600 mt-2" style={{ fontFamily: "var(--font-lato)" }}><CheckCircle2 size={12} />Pièce enregistrée.</p>}
    </div>
  );
}
