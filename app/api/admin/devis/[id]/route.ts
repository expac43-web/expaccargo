import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sbGet, sbPatch, sbDelete, enc, isUuid } from "@/lib/supabase-admin";
import { sendQuoteOfferEmail } from "@/lib/email";

const ALLOWED = ["SUPER_ADMIN", "MANAGER", "AGENCY"];

type QuoteItem = { label: string; amount: number };

type QuoteRow = {
  id: string; name: string; email: string; serviceType: string;
  origin: string; destination: string; cargoType: string | null;
  weight: number | null; volume: number | null;
  quotedPrice: number | null; quotedCurrency: string | null; quoteMessage: string | null;
  quoteItems: QuoteItem[] | null;
};

// Charge une demande de devis (avec sa signature éventuelle) pour la page de traitement.
export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || !ALLOWED.includes(role ?? "")) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const [quote] = await sbGet<Record<string, unknown> & { id: string }>("QuoteRequest", `id=eq.${enc(id)}&select=*&limit=1`);
  if (!quote) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  let signature: { signerName: string; signedAt: string } | null = null;
  if (/^[a-z0-9-]+$/i.test(quote.id)) {
    const [sig] = await sbGet<{ signerName: string; createdAt: string }>(
      "Signature", `quoteId=eq.${enc(quote.id)}&select=signerName,createdAt&limit=1`
    );
    if (sig) signature = { signerName: sig.signerName, signedAt: sig.createdAt };
  }

  return NextResponse.json({ ...quote, signature });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const su = session?.user as { id?: string; name?: string; email?: string; role?: string; agencyId?: string } | undefined;
  const role = su?.role;
  if (!session || !ALLOWED.includes(role ?? "")) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { status, quotedPrice, quotedCurrency, quoteMessage, quoteItems } = body;
  const VALID = ["NEW", "IN_REVIEW", "QUOTED", "ACCEPTED", "REJECTED"];
  if (!VALID.includes(status)) return NextResponse.json({ error: "Statut invalide" }, { status: 400 });

  // Prix optionnel : pris en compte seulement s'il est fourni (établissement du devis chiffré).
  const priceNum = Number(quotedPrice);
  const priceProvided = quotedPrice !== null && quotedPrice !== undefined && quotedPrice !== "";
  const hasPrice = priceProvided && Number.isFinite(priceNum) && priceNum >= 0;
  if (priceProvided && !hasPrice) {
    return NextResponse.json({ error: "Montant invalide" }, { status: 400 });
  }

  // Détail du devis (postes : transport, douane, etc.).
  const cleanItems: QuoteItem[] = (Array.isArray(quoteItems) ? quoteItems : [])
    .map((it: { label?: unknown; amount?: unknown }) => ({ label: String(it?.label ?? "").trim(), amount: Number(it?.amount) }))
    .filter((it) => it.label !== "" && Number.isFinite(it.amount) && it.amount >= 0);

  // Traçabilité : qui traite la demande (visible par l'admin et le gérant).
  const handledByName = su?.name?.trim() || su?.email || "Membre de l'équipe";
  const handledAt = new Date().toISOString();

  const patch: Record<string, unknown> = {
    status,
    handledById: su?.id ?? null,
    handledByName,
    handledAt,
  };
  if (hasPrice) {
    patch.quotedPrice = priceNum;
    patch.quotedCurrency = typeof quotedCurrency === "string" && quotedCurrency.trim() ? quotedCurrency.trim().toUpperCase() : "XAF";
    patch.quoteMessage = typeof quoteMessage === "string" && quoteMessage.trim() ? quoteMessage.trim() : null;
    patch.quoteItems = cleanItems.length ? cleanItems : null;
    patch.quotedAt = handledAt;
  }

  const updated = await sbPatch<QuoteRow>("QuoteRequest", `id=eq.${id}`, patch);
  if (!updated) return NextResponse.json({ error: "Erreur" }, { status: 500 });

  // Seul email envoyé au client à cette étape : le devis chiffré une fois établi.
  // Les simples changements de statut ne sont visibles que dans l'espace client (pas d'email).
  if (status === "QUOTED" && updated.email) {
    const finalPrice = updated.quotedPrice ?? (hasPrice ? priceNum : null);
    if (finalPrice != null) {
      // Si c'est un agent d'agence qui répond, on met l'email de son agence en Reply-To.
      let replyTo: string | undefined;
      if (role === "AGENCY" && su?.agencyId && isUuid(su.agencyId)) {
        const [ag] = await sbGet<{ email: string | null }>(
          "Agency", `id=eq.${enc(su.agencyId)}&select=email&limit=1`
        );
        if (ag?.email) replyTo = ag.email;
      }
      await sendQuoteOfferEmail({
        name: updated.name,
        email: updated.email,
        reference: updated.id.slice(0, 8).toUpperCase(),
        serviceType: updated.serviceType,
        origin: updated.origin,
        destination: updated.destination,
        price: finalPrice,
        currency: updated.quotedCurrency ?? "XAF",
        message: updated.quoteMessage,
        items: updated.quoteItems ?? (cleanItems.length ? cleanItems : null),
        replyTo,
      });
    }
  }

  return NextResponse.json({ success: true, handledByName, handledAt });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || !["SUPER_ADMIN", "MANAGER"].includes(role ?? "")) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const ok = await sbDelete("QuoteRequest", `id=eq.${id}`);
  if (!ok) return NextResponse.json({ error: "Erreur" }, { status: 500 });
  return NextResponse.json({ success: true });
}
