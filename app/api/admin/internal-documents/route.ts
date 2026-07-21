import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sbGet, sbPost, encList } from "@/lib/supabase-admin";
import { uploadFile } from "@/lib/supabase-storage";
import { notifyDocumentShared } from "@/lib/notify";

function isAdmin(role?: string) {
  return role === "SUPER_ADMIN" || role === "MANAGER";
}

// Ids acceptés : uuid ou cuid (jamais de caractère permettant d'injecter du PostgREST).
const SAFE_ID = /^[A-Za-z0-9_-]{8,60}$/;

/**
 * Dépôt d'un document interne pour UN ou PLUSIEURS membres de l'équipe.
 *
 * Le fichier n'est envoyé au stockage qu'UNE SEULE fois : on crée ensuite une
 * ligne `Document` par destinataire, toutes pointant vers la même URL. Cela
 * évite de recharger le même fichier autant de fois qu'il y a de membres.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!session || !isAdmin(user?.role) || !user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const type = (formData.get("type") as string) || "OTHER";
  const rawIds = formData.get("staffIds") as string | null;

  if (!file) {
    return NextResponse.json({ error: "Fichier obligatoire." }, { status: 400 });
  }
  if (file.size > 20 * 1024 * 1024) {
    return NextResponse.json({ error: "Fichier trop volumineux (max 20 Mo)." }, { status: 413 });
  }

  let requested: string[] = [];
  try {
    const parsed = JSON.parse(rawIds ?? "[]");
    if (Array.isArray(parsed)) requested = parsed.filter((v): v is string => typeof v === "string" && SAFE_ID.test(v));
  } catch {
    requested = [];
  }
  requested = [...new Set(requested)];
  if (requested.length === 0) {
    return NextResponse.json({ error: "Sélectionnez au moins un membre." }, { status: 400 });
  }

  // Sécurité : on ne dépose que pour de vrais membres de l'équipe (jamais un client).
  const members = await sbGet<{ id: string }>(
    "User",
    `id=in.(${encList(requested)})&role=in.(MANAGER,AGENCY)&select=id`
  );
  const targets = members.map((m) => m.id);
  if (targets.length === 0) {
    return NextResponse.json({ error: "Aucun membre d'équipe valide sélectionné." }, { status: 400 });
  }

  // ── Upload unique du fichier ──
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `internal/${Date.now()}_${safeName}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const url = await uploadFile(path, buffer, file.type || "application/octet-stream");
  if (!url) {
    return NextResponse.json({ error: "Erreur lors de l'envoi du fichier." }, { status: 500 });
  }

  // ── Une ligne Document par destinataire, même URL ──
  const now = new Date().toISOString();
  let created = 0;
  for (const staffId of targets) {
    const doc = await sbPost("Document", {
      id: crypto.randomUUID(),
      name: file.name,
      type,
      url,
      shipmentId: null,
      uploadedById: staffId, // propriétaire = le membre destinataire
      uploaderId: user.id,   // auteur du dépôt = l'admin
      createdAt: now,
    });
    if (doc) {
      created++;
      await notifyDocumentShared(staffId, file.name);
    }
  }

  if (created === 0) {
    return NextResponse.json({ error: "Aucun document n'a pu être enregistré." }, { status: 500 });
  }
  return NextResponse.json({ success: true, created, requested: targets.length }, { status: 201 });
}
