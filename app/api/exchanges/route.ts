import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sbGet, sbPost, enc } from "@/lib/supabase-admin";

const DOC_TYPES = ["DEVIS", "FACTURE", "BON_COMMANDE", "CONTRAT", "AUTRE"];

function isStaff(role?: string) {
  return role === "SUPER_ADMIN" || role === "MANAGER";
}

/**
 * Échanges avec les partenaires (EXPAC est le client du partenaire :
 * location de véhicule, achats, prestations…).
 * - Un partenaire ne voit QUE ses propres échanges.
 * - Admin et gérant voient tout, avec filtre optionnel par partenaire.
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!session || !user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  let filter: string;
  if (user.role === "PARTNER") {
    filter = `partnerId=eq.${enc(user.id)}`;
  } else if (isStaff(user.role)) {
    const partnerId = new URL(req.url).searchParams.get("partnerId");
    filter = partnerId ? `partnerId=eq.${enc(partnerId)}` : "";
  } else {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const qs = `${filter ? filter + "&" : ""}select=*&order=createdAt.desc`;
  const rows = await sbGet<{ id: string; partnerId: string }>("PartnerExchange", qs);

  // Nom du partenaire (utile côté back-office) + nombre de pièces jointes.
  const partnerIds = [...new Set(rows.map((r) => r.partnerId))];
  const names: Record<string, string> = {};
  if (partnerIds.length && isStaff(user.role)) {
    const users = await sbGet<{ id: string; name: string }>(
      "User",
      `id=in.(${partnerIds.map((i) => enc(i)).join(",")})&select=id,name`
    );
    for (const u of users) names[u.id] = u.name;
  }

  const ids = rows.map((r) => r.id);
  const counts: Record<string, number> = {};
  if (ids.length) {
    const docs = await sbGet<{ exchangeId: string }>(
      "Document",
      `exchangeId=in.(${ids.map((i) => enc(i)).join(",")})&select=exchangeId`
    );
    for (const d of docs) counts[d.exchangeId] = (counts[d.exchangeId] ?? 0) + 1;
  }

  return NextResponse.json(
    rows.map((r) => ({ ...r, partnerName: names[r.partnerId] ?? null, docCount: counts[r.id] ?? 0 }))
  );
}

/** Création d'un échange : par le partenaire lui-même, ou par l'admin/gérant. */
export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!session || !user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { title, docType, amount, notes, partnerId } = await req.json();
  if (!title?.trim()) {
    return NextResponse.json({ error: "L'objet de l'échange est obligatoire." }, { status: 400 });
  }

  let target: string;
  if (user.role === "PARTNER") {
    target = user.id;
  } else if (isStaff(user.role)) {
    if (!partnerId) return NextResponse.json({ error: "Sélectionnez un partenaire." }, { status: 400 });
    const [p] = await sbGet<{ id: string }>("User", `id=eq.${enc(partnerId)}&role=eq.PARTNER&select=id&limit=1`);
    if (!p) return NextResponse.json({ error: "Partenaire introuvable." }, { status: 400 });
    target = p.id;
  } else {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const now = new Date().toISOString();
  const created = await sbPost("PartnerExchange", {
    id: crypto.randomUUID(),
    partnerId: target,
    title: String(title).trim().slice(0, 200),
    docType: DOC_TYPES.includes(docType) ? docType : "AUTRE",
    status: "PENDING",
    amount: typeof amount === "number" && amount > 0 ? amount : null,
    currency: "XAF",
    notes: notes?.trim() || null,
    createdById: user.id,
    createdAt: now,
    updatedAt: now,
  });

  if (!created) return NextResponse.json({ error: "Erreur lors de la création." }, { status: 500 });
  return NextResponse.json(created, { status: 201 });
}
