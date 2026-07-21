import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sbGet, sbPost, sbPatch, enc } from "@/lib/supabase-admin";
import { uploadFile } from "@/lib/supabase-storage";

const STATUSES = ["PENDING", "VALIDATED", "REJECTED", "CLOSED"];

function isStaff(role?: string) {
  return role === "SUPER_ADMIN" || role === "MANAGER";
}

type Exchange = { id: string; partnerId: string; createdById: string | null; title: string };

/** Récupère l'échange et vérifie que l'utilisateur y a droit. */
async function loadAuthorized(id: string, user: { id?: string; role?: string }) {
  const [ex] = await sbGet<Exchange>("PartnerExchange", `id=eq.${enc(id)}&select=*&limit=1`);
  if (!ex) return { error: "Échange introuvable", status: 404 as const };
  const allowed = isStaff(user.role) || (user.role === "PARTNER" && ex.partnerId === user.id);
  if (!allowed) return { error: "Non autorisé", status: 401 as const };
  return { ex };
}

/** Détail : échange + pièces jointes + discussion. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!session || !user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const res = await loadAuthorized(id, user);
  if ("error" in res) return NextResponse.json({ error: res.error }, { status: res.status });

  const [documents, messages] = await Promise.all([
    sbGet("Document", `exchangeId=eq.${enc(id)}&select=id,name,type,url,uploadedById,uploaderId,createdAt&order=createdAt.desc`),
    sbGet("Message", `exchangeId=eq.${enc(id)}&select=id,content,senderId,createdAt&order=createdAt.asc`),
  ]);

  return NextResponse.json({ exchange: res.ex, documents, messages });
}

/** Changement de statut — réservé à l'admin et au gérant. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!session || !isStaff(user?.role)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const { status, amount } = await req.json();
  if (status && !STATUSES.includes(status)) {
    return NextResponse.json({ error: "Statut invalide." }, { status: 400 });
  }

  const updated = await sbPatch("PartnerExchange", `id=eq.${enc(id)}`, {
    ...(status ? { status } : {}),
    ...(typeof amount === "number" ? { amount } : {}),
    updatedAt: new Date().toISOString(),
  });
  if (!updated) return NextResponse.json({ error: "Erreur lors de la mise à jour." }, { status: 500 });
  return NextResponse.json(updated);
}

/**
 * Ajout dans l'échange, par le partenaire OU par EXPAC :
 * - multipart/form-data → dépôt d'un document (PDF/image)
 * - JSON                → message de discussion
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!session || !user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const res = await loadAuthorized(id, user);
  if ("error" in res) return NextResponse.json({ error: res.error }, { status: res.status });
  const ex = res.ex;
  const now = new Date().toISOString();

  // ── Dépôt de document ──
  if ((req.headers.get("content-type") ?? "").includes("multipart/form-data")) {
    const fd = await req.formData();
    const file = fd.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "Fichier obligatoire." }, { status: 400 });
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: "Fichier trop volumineux (max 20 Mo)." }, { status: 413 });
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadFile(`exchanges/${id}/${Date.now()}_${safeName}`, buffer, file.type || "application/octet-stream");
    if (!url) return NextResponse.json({ error: "Erreur lors de l'envoi du fichier." }, { status: 500 });

    const doc = await sbPost("Document", {
      id: crypto.randomUUID(),
      name: file.name,
      type: "OTHER",
      url,
      shipmentId: null,
      exchangeId: id,
      uploadedById: ex.partnerId, // rattaché au dossier du partenaire
      uploaderId: user.id,        // qui l'a réellement déposé (partenaire ou EXPAC)
      createdAt: now,
    });
    if (!doc) return NextResponse.json({ error: "Erreur lors de l'enregistrement." }, { status: 500 });

    await sbPatch("PartnerExchange", `id=eq.${enc(id)}`, { updatedAt: now });
    return NextResponse.json(doc, { status: 201 });
  }

  // ── Message de discussion ──
  const { content } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "Message vide." }, { status: 400 });

  // Message.receiverId est obligatoire en base : on vise l'autre partie.
  // La lecture se fait de toute façon par exchangeId (fil partagé).
  const receiverId =
    user.role === "PARTNER"
      ? ex.createdById && ex.createdById !== ex.partnerId
        ? ex.createdById
        : ex.partnerId
      : ex.partnerId;

  const msg = await sbPost("Message", {
    id: crypto.randomUUID(),
    content: String(content).trim().slice(0, 5000),
    senderId: user.id,
    receiverId,
    exchangeId: id,
    isRead: false,
    sentAsManager: isStaff(user.role),
    deletedBySender: false,
    deletedByReceiver: false,
    createdAt: now,
  });
  if (!msg) return NextResponse.json({ error: "Erreur lors de l'envoi." }, { status: 500 });

  await sbPatch("PartnerExchange", `id=eq.${enc(id)}`, { updatedAt: now });
  return NextResponse.json(msg, { status: 201 });
}
