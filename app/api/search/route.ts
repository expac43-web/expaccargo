import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sbGet, enc, encList } from "@/lib/supabase-admin";

function isStaff(role?: string) {
  return ["SUPER_ADMIN", "MANAGER", "AGENCY"].includes(role ?? "");
}

// Motif ilike sécurisé : on encode la saisie, les * (jokers PostgREST) restent littéraux.
function like(q: string): string {
  return `*${enc(q)}*`;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || !isStaff(role)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  if (q.length < 2) return NextResponse.json({ clients: [], shipments: [], documents: [] });

  const pattern = like(q);

  const [clients, shipments, documents] = await Promise.all([
    sbGet<{ id: string; name: string; email: string }>(
      "User",
      `role=eq.CLIENT&or=(name.ilike.${pattern},email.ilike.${pattern})&select=id,name,email&limit=6`
    ),
    sbGet<{ id: string; reference: string; status: string; origin: string; destination: string }>(
      "Shipment",
      `or=(reference.ilike.${pattern},origin.ilike.${pattern},destination.ilike.${pattern})&select=id,reference,status,origin,destination&order=createdAt.desc&limit=6`
    ),
    sbGet<{ id: string; name: string; type: string; uploadedById: string }>(
      "Document",
      `name.ilike.${pattern}&select=id,name,type,uploadedById&order=createdAt.desc&limit=6`
    ),
  ]);

  // Nom du propriétaire des documents trouvés
  const ownerIds = [...new Set(documents.map((d) => d.uploadedById))];
  let owners: { id: string; name: string }[] = [];
  if (ownerIds.length > 0) {
    owners = await sbGet<{ id: string; name: string }>("User", `id=in.(${encList(ownerIds)})&select=id,name`);
  }
  const ownerName = Object.fromEntries(owners.map((o) => [o.id, o.name]));

  return NextResponse.json({
    clients,
    shipments,
    documents: documents.map((d) => ({ ...d, clientId: d.uploadedById, ownerName: ownerName[d.uploadedById] ?? "—" })),
  });
}
