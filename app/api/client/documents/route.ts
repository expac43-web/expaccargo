import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sbGet, sbPost } from "@/lib/supabase-admin";
import { uploadFile, BUCKET } from "@/lib/supabase-storage";

const DOC_TYPES = [
  "INVOICE", "PRO_FORMA", "BILL_OF_LADING",
  "CUSTOMS_DECL", "CERTIFICATE", "PACKING_LIST", "OTHER",
] as const;

export async function GET(req: NextRequest) {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!session || user?.role !== "CLIENT" || !user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const shipmentId = searchParams.get("shipmentId");

  let qs = `uploadedById=eq.${user.id}&select=id,name,type,url,shipmentId,uploaderId,createdAt&order=createdAt.desc`;
  if (shipmentId) qs = `shipmentId=eq.${shipmentId}&${qs}`;

  const docs = await sbGet<{ uploaderId: string | null }>("Document", qs);
  // Le client ne peut supprimer que ses propres dépôts (pas ceux déposés par le staff pour lui).
  return NextResponse.json(docs.map((d) => ({ ...d, canDelete: d.uploaderId === user.id })));
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!session || user?.role !== "CLIENT" || !user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const type = formData.get("type") as string | null;
  const shipmentId = formData.get("shipmentId") as string | null;

  if (!file || !type || !DOC_TYPES.includes(type as (typeof DOC_TYPES)[number])) {
    return NextResponse.json({ error: "Fichier et type obligatoires" }, { status: 400 });
  }

  // Limit: 10 MB
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "Fichier trop volumineux (max 10 Mo)" }, { status: 413 });
  }

  const ext = file.name.split(".").pop() ?? "bin";
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${user.id}/${Date.now()}_${safeName}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const url = await uploadFile(path, buffer, file.type || "application/octet-stream");

  if (!url) {
    return NextResponse.json({ error: "Erreur lors de l'upload" }, { status: 500 });
  }

  const id = crypto.randomUUID();
  const doc = await sbPost("Document", {
    id,
    name: file.name,
    type,
    url,
    shipmentId: shipmentId || null,
    uploadedById: user.id,
    uploaderId: user.id, // le client est l'auteur de son propre dépôt
    createdAt: new Date().toISOString(),
  });

  if (!doc) {
    return NextResponse.json({ error: "Erreur lors de la création" }, { status: 500 });
  }
  return NextResponse.json(doc, { status: 201 });
}
