import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sbGet } from "@/lib/supabase-admin";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;

  if (!session || user?.role !== "CLIENT" || !user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;

  // Verify ownership
  const [shipment] = await sbGet<{
    id: string; reference: string; trackingNumber: string | null;
    status: string; serviceType: string; origin: string; destination: string;
    weight: number | null; volume: number | null; description: string | null;
    eta: string | null; deliveredAt: string | null;
    clientId: string; agencyId: string | null;
    createdAt: string; updatedAt: string;
  }>(
    "Shipment",
    `id=eq.${id}&clientId=eq.${user.id}&select=*`
  );

  if (!shipment) {
    return NextResponse.json({ error: "Expédition introuvable" }, { status: 404 });
  }

  // Fetch milestones
  const milestones = await sbGet<{
    id: string; label: string; location: string | null;
    status: string; occurredAt: string; note: string | null;
  }>(
    "Milestone",
    `shipmentId=eq.${id}&select=id,label,location,status,occurredAt,note&order=occurredAt.desc`
  );

  // Fetch linked documents
  const documents = await sbGet<{
    id: string; name: string; type: string; url: string; createdAt: string;
  }>(
    "Document",
    `shipmentId=eq.${id}&uploadedById=eq.${user.id}&select=id,name,type,url,createdAt&order=createdAt.desc`
  );

  return NextResponse.json({ ...shipment, milestones, documents });
}
