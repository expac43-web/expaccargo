import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sbGet } from "@/lib/supabase-admin";

export async function GET() {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string; email?: string } | undefined;

  if (!session || user?.role !== "CLIENT" || !user?.email) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  // Match by email since QuoteRequest has no userId
  const quotes = await sbGet<{
    id: string; name: string; email: string; phone: string;
    serviceType: string; origin: string; destination: string;
    cargoType: string; weight: number | null; volume: number | null;
    notes: string | null; status: string; createdAt: string;
  }>(
    "QuoteRequest",
    `email=eq.${encodeURIComponent(user.email)}&select=*&order=createdAt.desc`
  );

  // Attacher la signature éventuelle (devis acceptés et signés).
  const ids = quotes.map((q) => q.id).filter((x) => /^[a-z0-9]+$/i.test(x));
  const sigByQuote: Record<string, { signerName: string; signedAt: string }> = {};
  if (ids.length) {
    const sigs = await sbGet<{ quoteId: string; signerName: string; createdAt: string }>(
      "Signature",
      `quoteId=in.(${ids.join(",")})&select=quoteId,signerName,createdAt`
    );
    for (const s of sigs) sigByQuote[s.quoteId] = { signerName: s.signerName, signedAt: s.createdAt };
  }

  return NextResponse.json(quotes.map((q) => ({ ...q, signature: sigByQuote[q.id] ?? null })));
}
