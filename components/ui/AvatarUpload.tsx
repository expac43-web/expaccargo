"use client";

import { useRef, useState } from "react";
import { Camera } from "lucide-react";

interface AvatarUploadProps {
  avatarUrl: string | null;
  name: string;
  uploadEndpoint: string; // ex: /api/agence/profile/avatar
  onUploaded: (url: string) => void;
  size?: number; // px, default 80
  accentColor?: string;
}

export default function AvatarUpload({
  avatarUrl,
  name,
  uploadEndpoint,
  onUploaded,
  size = 80,
  accentColor = "#0e5f72",
}: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(avatarUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  async function handleFile(file: File) {
    setError(null);
    if (!file.type.startsWith("image/")) { setError("Format d'image invalide."); return; }
    if (file.size > 5 * 1024 * 1024) { setError("Taille max : 5 Mo."); return; }

    // Prévisualisation immédiate
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const r = await fetch(uploadEndpoint, { method: "POST", body: fd });
      const data = await r.json();
      if (!r.ok) { setError(data.error ?? "Erreur upload."); setPreview(avatarUrl); return; }
      onUploaded(data.avatarUrl);
      setPreview(data.avatarUrl);
    } catch {
      setError("Erreur réseau.");
      setPreview(avatarUrl);
    } finally {
      setUploading(false);
      URL.revokeObjectURL(objectUrl);
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative group cursor-pointer" style={{ width: size, height: size }}
        onClick={() => !uploading && fileRef.current?.click()}>
        <div className="w-full h-full rounded-full overflow-hidden border-4 border-white shadow-md"
          style={{ backgroundColor: `${accentColor}20` }}>
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt={name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white font-black text-xl"
              style={{ backgroundColor: accentColor, fontFamily: "var(--font-montserrat)" }}>
              {initials}
            </div>
          )}
        </div>

        {/* Overlay caméra */}
        <div className="absolute inset-0 rounded-full flex items-center justify-center transition-opacity opacity-0 group-hover:opacity-100"
          style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
          {uploading
            ? <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            : <Camera size={size > 60 ? 22 : 16} className="text-white" />}
        </div>

        {/* Badge caméra (toujours visible, petit) */}
        <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full flex items-center justify-center shadow-md border-2 border-white"
          style={{ backgroundColor: accentColor }}>
          <Camera size={11} className="text-white" />
        </div>
      </div>

      <input ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />

      {error && <p className="text-xs text-red-500 text-center" style={{ fontFamily: "var(--font-lato)" }}>{error}</p>}
      <p className="text-xs text-gray-400 text-center" style={{ fontFamily: "var(--font-lato)" }}>
        Cliquer pour changer · JPG, PNG, WebP · max 5 Mo
      </p>
    </div>
  );
}
