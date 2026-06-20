import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sbGet } from "@/lib/supabase-admin";

export async function GET() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || !["SUPER_ADMIN", "MANAGER", "AGENCY"].includes(role ?? "")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const clients = await sbGet<{
    id: string; name: string; email: string; phone: string | null;
    whatsapp: string | null; isActive: boolean; createdAt: string;
  }>("User", "role=eq.CLIENT&select=id,name,email,phone,whatsapp,isActive,createdAt&order=createdAt.desc");

  return NextResponse.json(clients);
}
