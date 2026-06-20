import { NextRequest, NextResponse } from "next/server";
import { sbPost } from "@/lib/supabase-admin";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { isValidEmail } from "@/lib/validation";
import { sendQuoteAckEmail } from "@/lib/email";

const VALID_SERVICES = ["TRANSIT", "MULTIMODAL", "STORAGE", "MARITIME_CONSIGNMENT", "GROUPAGE"];

// Convertit en nombre positif valide, sinon null.
function toPositiveNumber(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export async function POST(req: NextRequest) {
  try {
    // Anti-spam : 10 demandes / heure / IP
    const ip = getClientIp(req);
    const rl = rateLimit(`devis:${ip}`, 10, 60 * 60 * 1000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Trop de demandes envoyées. Réessayez plus tard." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
      );
    }

    const body = await req.json();
    const { name, email, phone, serviceType, origin, destination, cargoType, weight, volume, notes } = body;

    if (!name?.trim() || !email?.trim() || !phone?.trim() || !serviceType || !origin?.trim() || !destination?.trim() || !cargoType?.trim()) {
      return NextResponse.json({ error: "Champs obligatoires manquants." }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Adresse email invalide." }, { status: 400 });
    }

    if (!VALID_SERVICES.includes(serviceType)) {
      return NextResponse.json({ error: "Type de service invalide." }, { status: 400 });
    }

    const id = crypto.randomUUID();
    const record = await sbPost("QuoteRequest", {
      id,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      serviceType,
      origin: origin.trim(),
      destination: destination.trim(),
      cargoType: cargoType.trim(),
      weight: toPositiveNumber(weight),
      volume: toPositiveNumber(volume),
      notes: notes?.trim() || null,
      status: "NEW",
      createdAt: new Date().toISOString(),
    });

    if (!record) return NextResponse.json({ error: "Erreur lors de l'enregistrement." }, { status: 500 });

    // Accusé de réception au demandeur (no-op tant que Resend n'est pas configuré)
    await sendQuoteAckEmail({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      serviceType,
      origin: origin.trim(),
      destination: destination.trim(),
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
