import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import bcrypt from "bcryptjs";
import { sbGet, sbPatch, enc } from "@/lib/supabase-admin";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = rateLimit(`reset:${ip}`, 10, 15 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez plus tard." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  const { token, password } = await req.json().catch(() => ({}));
  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "Lien invalide." }, { status: 400 });
  }
  if (!password || typeof password !== "string" || password.length < 8) {
    return NextResponse.json({ error: "Le mot de passe doit faire au moins 8 caractères." }, { status: 400 });
  }

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const [row] = await sbGet<{ id: string; userId: string; expiresAt: string; usedAt: string | null }>(
    "PasswordResetToken", `tokenHash=eq.${enc(tokenHash)}&select=id,userId,expiresAt,usedAt&limit=1`
  );
  if (!row || row.usedAt || new Date(row.expiresAt).getTime() < Date.now()) {
    return NextResponse.json({ error: "Lien invalide ou expiré." }, { status: 400 });
  }

  const hashed = await bcrypt.hash(password, 12);
  const ok = await sbPatch("User", `id=eq.${enc(row.userId)}`, {
    password: hashed,
    updatedAt: new Date().toISOString(),
  });
  if (!ok) return NextResponse.json({ error: "Erreur lors de la réinitialisation." }, { status: 500 });

  await sbPatch("PasswordResetToken", `id=eq.${enc(row.id)}`, { usedAt: new Date().toISOString() });
  return NextResponse.json({ success: true });
}
