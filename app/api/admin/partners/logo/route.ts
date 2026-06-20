import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadPartnerLogo } from "@/lib/supabase-storage";

function isStaff(role?: string) {
  return ["SUPER_ADMIN", "MANAGER", "AGENCY"].includes(role ?? "");
}

// Upload d'un logo de partenaire (déjà compressé côté navigateur). Renvoie l'URL publique.
export async function POST(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || !isStaff(role)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "Fichier requis." }, { status: 400 });
  if (!file.type.startsWith("image/")) return NextResponse.json({ error: "Format d'image invalide." }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "Image trop volumineuse (max 5 Mo)." }, { status: 413 });

  const ext = (file.type.split("/")[1] || "webp").replace("jpeg", "jpg").replace("svg+xml", "svg");
  const buffer = Buffer.from(await file.arrayBuffer());
  const { url, error } = await uploadPartnerLogo(buffer, file.type, ext);

  if (!url) {
    // On renvoie le vrai message du stockage pour faciliter le diagnostic.
    return NextResponse.json({ error: error ? `Stockage : ${error}` : "Erreur lors de l'upload." }, { status: 500 });
  }
  return NextResponse.json({ url });
}
