/**
 * Compression / redimensionnement d'image côté navigateur (canvas).
 * Réduit le poids des logos avant upload. Les SVG sont laissés intacts
 * (vectoriels — pas de rasterisation).
 */
export async function compressImage(
  file: File,
  opts?: { maxSize?: number; quality?: number; mime?: string }
): Promise<File> {
  // SVG : pas de compression raster (on garde le vectoriel).
  if (file.type === "image/svg+xml") return file;

  const maxSize = opts?.maxSize ?? 400;
  const quality = opts?.quality ?? 0.85;
  const mime = opts?.mime ?? "image/webp";

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result as string);
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new window.Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = dataUrl;
  });

  let { width, height } = img;
  if (width > maxSize || height > maxSize) {
    const ratio = Math.min(maxSize / width, maxSize / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(img, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, mime, quality));
  if (!blob) return file;

  const ext = mime === "image/webp" ? "webp" : mime === "image/png" ? "png" : "jpg";
  const baseName = file.name.replace(/\.[^.]+$/, "") || "image";
  return new File([blob], `${baseName}.${ext}`, { type: mime });
}
