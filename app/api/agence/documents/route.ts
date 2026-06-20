import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sbGet, sbPost, enc, encList, isUuid } from "@/lib/supabase-admin";
import { uploadFile } from "@/lib/supabase-storage";
import { notifyDocumentShared } from "@/lib/notify";

function isAgency(role?: string) {
  return role === "AGENCY" || role === "MANAGER" || role === "SUPER_ADMIN";
}

// Types de document valides (enum DocumentType côté DB)
const DOC_TYPES = ["INVOICE", "PRO_FORMA", "BILL_OF_LADING", "CUSTOMS_DECL", "CERTIFICATE", "PACKING_LIST", "OTHER"];

type DocRow = {
  id: string; name: string; type: string; url: string;
  shipmentId: string | null; uploadedById: string; uploaderId: string | null; createdAt: string;
};

export async function GET(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || !isAgency(role)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");
  if (clientId && !isUuid(clientId)) return NextResponse.json({ error: "clientId invalide" }, { status: 400 });

  // Les documents d'un client sont ceux dont il est le propriétaire (uploadedById).
  let qs = "select=id,name,type,url,shipmentId,uploadedById,uploaderId,createdAt&order=createdAt.desc";
  if (clientId) qs = `uploadedById=eq.${enc(clientId)}&${qs}`;

  const docs = await sbGet<DocRow>("Document", qs);

  // Enrichir avec le nom du propriétaire (le client)
  const ownerIds = [...new Set(docs.map((d) => d.uploadedById))];
  let owners: { id: string; name: string }[] = [];
  if (ownerIds.length > 0) {
    owners = await sbGet<{ id: string; name: string }>("User", `id=in.(${encList(ownerIds)})&select=id,name`);
  }
  const nameById = Object.fromEntries(owners.map((o) => [o.id, o.name]));

  const myId = (session?.user as { id?: string })?.id;
  return NextResponse.json(docs.map((d) => ({
    ...d,
    clientName: nameById[d.uploadedById] ?? "Inconnu",
    // L'agent ne peut supprimer que ses propres dépôts.
    canDelete: !!d.uploaderId && d.uploaderId === myId,
  })));
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  const userId = (session?.user as { id?: string })?.id;
  if (!session || !isAgency(role) || !userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const clientId = formData.get("clientId") as string | null;
  const docType = (formData.get("type") as string) || "OTHER";
  const shipmentId = formData.get("shipmentId") as string | null;

  if (!file || !clientId) {
    return NextResponse.json({ error: "Fichier et client requis." }, { status: 400 });
  }
  if (!isUuid(clientId)) {
    return NextResponse.json({ error: "Client invalide." }, { status: 400 });
  }
  if (!DOC_TYPES.includes(docType)) {
    return NextResponse.json({ error: "Type de document invalide." }, { status: 400 });
  }
  if (file.size > 20 * 1024 * 1024) {
    return NextResponse.json({ error: "Fichier trop volumineux (max 20 Mo)." }, { status: 413 });
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${clientId}/${Date.now()}_${safeName}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const publicUrl = await uploadFile(path, buffer, file.type || "application/octet-stream");

  if (!publicUrl) return NextResponse.json({ error: "Erreur upload." }, { status: 500 });

  // uploadedById = le client (visibilité), uploaderId = l'agent (auteur, pour la suppression).
  const doc = await sbPost("Document", {
    id: crypto.randomUUID(),
    name: file.name,
    type: docType,
    url: publicUrl,
    shipmentId: shipmentId || null,
    uploadedById: clientId,
    uploaderId: userId,
    createdAt: new Date().toISOString(),
  });

  if (!doc) return NextResponse.json({ error: "Erreur enregistrement." }, { status: 500 });
  await notifyDocumentShared(clientId, file.name);
  return NextResponse.json(doc, { status: 201 });
}
