import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sbGet, sbPatch, enc } from "@/lib/supabase-admin";

type Quote = { id: string; email: string; status: string };

/** Le client refuse un devis qui lui a été proposé (statut QUOTED → REJECTED). */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = session?.user as { role?: string; email?: string } | undefined;
  if (!session || user?.role !== "CLIENT" || !user?.email) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  if (!id || /[(),&=]/.test(id)) return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 });

  const { action } = await req.json();
  if (action !== "reject") return NextResponse.json({ error: "Action non supportée." }, { status: 400 });

  const [quote] = await sbGet<Quote>("QuoteRequest", `id=eq.${enc(id)}&select=id,email,status&limit=1`);
  if (!quote || quote.email.toLowerCase() !== user.email.toLowerCase()) {
    return NextResponse.json({ error: "Devis introuvable." }, { status: 404 });
  }
  if (quote.status !== "QUOTED") {
    return NextResponse.json({ error: "Ce devis ne peut pas être refusé à ce stade." }, { status: 409 });
  }

  const ok = await sbPatch("QuoteRequest", `id=eq.${enc(id)}`, { status: "REJECTED" });
  if (!ok) return NextResponse.json({ error: "Erreur" }, { status: 500 });
  return NextResponse.json({ success: true });
}
