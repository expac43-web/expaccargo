import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sbGet, sbPatch, enc } from "@/lib/supabase-admin";

// Liste des notifications de l'utilisateur courant (+ nombre de non-lues).
export async function GET() {
  const session = await auth();
  const userId = (session?.user as { id?: string })?.id;
  if (!session || !userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const items = await sbGet<{ id: string; title: string; body: string; isRead: boolean; link: string | null; createdAt: string }>(
    "Notification",
    `userId=eq.${enc(userId)}&select=id,title,body,isRead,link,createdAt&order=createdAt.desc&limit=30`
  );
  const unread = items.filter((i) => !i.isRead).length;
  return NextResponse.json({ items, unread });
}

// Marquer toutes les notifications comme lues.
export async function PATCH() {
  const session = await auth();
  const userId = (session?.user as { id?: string })?.id;
  if (!session || !userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  await sbPatch("Notification", `userId=eq.${enc(userId)}&isRead=eq.false`, { isRead: true });
  return NextResponse.json({ success: true });
}
