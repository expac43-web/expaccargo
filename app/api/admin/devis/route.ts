import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sbGet } from "@/lib/supabase-admin";

export async function GET() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || !["SUPER_ADMIN", "MANAGER", "AGENCY"].includes(role ?? "")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const quotes = await sbGet<{
    id: string; name: string; email: string; phone: string;
    serviceType: string; origin: string; destination: string;
    cargoType: string; weight: number | null; volume: number | null;
    notes: string | null; status: string; createdAt: string;
  }>("QuoteRequest", "select=*&order=createdAt.desc");

  // Attacher la signature éventuelle (preuve d'acceptation).
  const ids = quotes.map((q) => q.id).filter((x) => /^[a-z0-9-]+$/i.test(x));
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
