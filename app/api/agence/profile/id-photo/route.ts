import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sbPatch } from "@/lib/supabase-admin";
import { uploadIdPhoto } from "@/lib/supabase-storage";

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "application/pdf"];

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = (session?.user as { id?: string })?.id;
  const role = (session?.user as { role?: string })?.role;
  if (!session || role !== "AGENCY" || !userId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Fichier requis." }, { status: 400 });
  if (!ALLOWED.includes(file.type) && !file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Format invalide (image ou PDF)." }, { status: 400 });
  }
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "Taille max : 5 Mo." }, { status: 400 });

  const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const buffer = Buffer.from(await file.arrayBuffer());
  const path = await uploadIdPhoto(userId, buffer, file.type, ext);
  if (!path) return NextResponse.json({ error: "Erreur upload." }, { status: 500 });

  await sbPatch("User", `id=eq.${userId}`, { idPhotoUrl: path, updatedAt: new Date().toISOString() });
  return NextResponse.json({ ok: true });
}
