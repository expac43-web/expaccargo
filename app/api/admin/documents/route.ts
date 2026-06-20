import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sbGet, sbPost } from "@/lib/supabase-admin";
import { uploadFile } from "@/lib/supabase-storage";
import { notifyDocumentShared } from "@/lib/notify";

function isStaff(role?: string) {
  return ["SUPER_ADMIN", "MANAGER", "AGENCY"].includes(role ?? "");
}

export async function GET(req: NextRequest) {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!session || !isStaff(user?.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const shipmentId = searchParams.get("shipmentId");
  const clientId = searchParams.get("clientId");

  let qs = "select=id,name,type,url,shipmentId,uploadedById,createdAt&order=createdAt.desc";
  if (shipmentId) qs = `shipmentId=eq.${shipmentId}&${qs}`;
  else if (clientId) qs = `uploadedById=eq.${clientId}&${qs}`;

  const docs = await sbGet("Document", qs);
  return NextResponse.json(docs);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!session || !isStaff(user?.role) || !user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const type = formData.get("type") as string;
  const shipmentId = formData.get("shipmentId") as string | null;
  const targetClientId = formData.get("clientId") as string | null;

  if (!file || !type) {
    return NextResponse.json({ error: "Fichier et type obligatoires" }, { status: 400 });
  }

  if (file.size > 20 * 1024 * 1024) {
    return NextResponse.json({ error: "Fichier trop volumineux (max 20 Mo)" }, { status: 413 });
  }

  const uploadedForId = targetClientId ?? user.id;
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${uploadedForId}/${Date.now()}_${safeName}`;

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
    uploadedById: uploadedForId,     // propriétaire (client si dépôt pour un client)
    uploaderId: user.id,             // auteur réel du dépôt (le staff)
    createdAt: new Date().toISOString(),
  });

  if (!doc) return NextResponse.json({ error: "Erreur lors de la création" }, { status: 500 });
  // Notifier le client si le document a été déposé pour lui (pas un upload perso du staff).
  if (targetClientId) await notifyDocumentShared(targetClientId, file.name);
  return NextResponse.json(doc, { status: 201 });
}
