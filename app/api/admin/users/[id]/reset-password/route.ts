import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sbGet, sbPatch, enc, isUuid } from "@/lib/supabase-admin";
import bcrypt from "bcryptjs";
import { sendStaffResetProcessedEmail, type StaffRole } from "@/lib/email";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || (role !== "SUPER_ADMIN" && role !== "MANAGER")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  const { newPassword } = await req.json();

  if (!newPassword || newPassword.length < 8) {
    return NextResponse.json({ error: "Mot de passe trop court (minimum 8 caractères)" }, { status: 400 });
  }

  const [target] = await sbGet<{ name: string; email: string; role: string }>(
    "User", `id=eq.${enc(id)}&select=name,email,role&limit=1`
  );
  if (!target) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

  const hashed = await bcrypt.hash(newPassword, 12);
  const ok = await sbPatch("User", `id=eq.${enc(id)}`, {
    password: hashed,
    updatedAt: new Date().toISOString(),
  });

  if (!ok) return NextResponse.json({ error: "Erreur lors de la réinitialisation" }, { status: 500 });

  // Notifier l'utilisateur staff de son nouveau mot de passe (no-op tant que Resend absent).
  let emailSent = false;
  if (target.role === "MANAGER" || target.role === "AGENCY") {
    emailSent = await sendStaffResetProcessedEmail({
      name: target.name,
      email: target.email,
      password: newPassword,
      role: target.role as StaffRole,
    });
  }

  return NextResponse.json({ success: true, emailSent });
}
