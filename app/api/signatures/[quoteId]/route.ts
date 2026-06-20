import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sbGet, enc } from "@/lib/supabase-admin";
import { downloadFile } from "@/lib/supabase-storage";

export const runtime = "nodejs";

/**
 * Sert l'image de signature (bucket privé) via le serveur, avec contrôle d'accès :
 * le client propriétaire du devis (match email) ou un membre du staff.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ quoteId: string }> }) {
  const { quoteId } = await params;
  const session = await auth();
  const user = session?.user as { id?: string; role?: string; email?: string } | undefined;
  if (!session || !user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!quoteId || /[(),&=]/.test(quoteId)) return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 });

  const [quote] = await sbGet<{ email: string }>("QuoteRequest", `id=eq.${enc(quoteId)}&select=email&limit=1`);
  if (!quote) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const role = user.role;
  const staff = role === "SUPER_ADMIN" || role === "MANAGER" || role === "AGENCY";
  const owner = role === "CLIENT" && !!user.email && quote.email.toLowerCase() === user.email.toLowerCase();
  if (!staff && !owner) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const fileData = await downloadFile(`signatures/${quoteId}.png`);
  if (!fileData) return NextResponse.json({ error: "Signature indisponible" }, { status: 404 });

  return new NextResponse(new Uint8Array(fileData.buffer), {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "private, max-age=0, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
