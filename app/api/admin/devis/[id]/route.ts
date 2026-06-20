import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sbGet, sbPatch, sbDelete, enc, isUuid } from "@/lib/supabase-admin";
import { sendQuoteResponseEmail } from "@/lib/email";

const ALLOWED = ["SUPER_ADMIN", "MANAGER", "AGENCY"];

const STATUS_LABELS: Record<string, string> = {
  NEW: "Nouveau", IN_REVIEW: "En étude", QUOTED: "Devis envoyé",
  ACCEPTED: "Accepté", REJECTED: "Refusé",
};

type QuoteRow = {
  id: string; name: string; email: string; serviceType: string;
  origin: string; destination: string; cargoType: string | null;
  weight: number | null; volume: number | null;
};

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || !ALLOWED.includes(role ?? "")) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const { status } = await req.json();
  const VALID = ["NEW", "IN_REVIEW", "QUOTED", "ACCEPTED", "REJECTED"];
  if (!VALID.includes(status)) return NextResponse.json({ error: "Statut invalide" }, { status: 400 });

  const updated = await sbPatch<QuoteRow>("QuoteRequest", `id=eq.${id}`, { status });
  if (!updated) return NextResponse.json({ error: "Erreur" }, { status: 500 });

  // Notifier le demandeur du suivi de son devis (no-op tant que Resend n'est pas configuré).
  if (["IN_REVIEW", "QUOTED", "ACCEPTED", "REJECTED"].includes(status) && updated.email) {
    // Si c'est un agent d'agence qui répond, on met l'email de son agence en Reply-To :
    // le client répond et tombe directement chez la bonne agence.
    let replyTo: string | undefined;
    const responder = session.user as { role?: string; agencyId?: string };
    if (responder.role === "AGENCY" && responder.agencyId && isUuid(responder.agencyId)) {
      const [ag] = await sbGet<{ email: string | null }>(
        "Agency", `id=eq.${enc(responder.agencyId)}&select=email&limit=1`
      );
      if (ag?.email) replyTo = ag.email;
    }

    await sendQuoteResponseEmail({
      name: updated.name,
      email: updated.email,
      reference: updated.id.slice(0, 8).toUpperCase(),
      serviceType: updated.serviceType,
      origin: updated.origin,
      destination: updated.destination,
      cargoType: updated.cargoType ?? undefined,
      weight: updated.weight,
      volume: updated.volume,
      statusLabel: STATUS_LABELS[status] ?? status,
      replyTo,
    });
  }

  return NextResponse.json({ success: true });
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
