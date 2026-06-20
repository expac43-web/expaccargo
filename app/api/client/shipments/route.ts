import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sbGet } from "@/lib/supabase-admin";

export async function GET() {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;

  if (!session || user?.role !== "CLIENT" || !user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const shipments = await sbGet<{
    id: string; reference: string; trackingNumber: string | null;
    status: string; serviceType: string; origin: string; destination: string;
    weight: number | null; volume: number | null; description: string | null;
    eta: string | null; deliveredAt: string | null; createdAt: string; updatedAt: string;
  }>(
    "Shipment",
    `clientId=eq.${user.id}&select=id,reference,trackingNumber,status,serviceType,origin,destination,weight,volume,description,eta,deliveredAt,createdAt,updatedAt&order=createdAt.desc`
  );

  return NextResponse.json(shipments);
}
