import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, phone, whatsapp, accountType, companyName } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Champs obligatoires manquants." }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Le mot de passe doit contenir au moins 8 caractères." }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Un compte existe déjà avec cet email." }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const displayName = accountType === "entreprise" && companyName
      ? companyName
      : name;

    await prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        name: displayName,
        email,
        password: hashedPassword,
        phone: phone || null,
        whatsapp: whatsapp || null,
        role: "CLIENT",
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error("[register]", err);
    return NextResponse.json({ error: "Erreur serveur. Réessayez plus tard." }, { status: 500 });
  }
}
