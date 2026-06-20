import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sbGet, enc } from "@/lib/supabase-admin";
import { downloadFile, urlToPath } from "@/lib/supabase-storage";

type Doc = {
  id: string;
  name: string;
  url: string;
  uploadedById: string;
  shipmentId: string | null;
  shipment: { clientId: string; agencyId: string | null } | null;
};

/**
 * Sert un document via le serveur (proxy) sans exposer l'URL Supabase.
 * `?download=1` force le téléchargement ; sinon affichage inline (lecture).
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const user = session?.user as { id?: string; role?: string; agencyId?: string } | undefined;
  if (!session || !user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  // Les ids de Document sont des cuid (pas des UUID) → on n'impose pas isUuid ici,
  // mais on bloque tout caractère pouvant casser le filtre PostgREST.
  if (!id || /[(),&=]/.test(id)) {
    return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 });
  }

  const [doc] = await sbGet<Doc>(
    "Document",
    `id=eq.${enc(id)}&select=id,name,url,uploadedById,shipmentId,shipment:Shipment(clientId,agencyId)&limit=1`
  );
  if (!doc) return NextResponse.json({ error: "Document introuvable" }, { status: 404 });

  // Contrôle d'accès selon le rôle
  const role = user.role;
  let allowed = false;
  if (role === "SUPER_ADMIN" || role === "MANAGER") {
    allowed = true;
  } else if (role === "CLIENT") {
    allowed = doc.uploadedById === user.id || doc.shipment?.clientId === user.id;
  } else if (role === "AGENCY") {
    allowed =
      doc.uploadedById === user.id ||
      (!!user.agencyId && doc.shipment?.agencyId === user.agencyId);
    // L'agence gère les clients : elle peut consulter les documents appartenant
    // à un compte CLIENT (cohérent avec la liste clients/documents déjà exposée).
    if (!allowed) {
      const [owner] = await sbGet<{ role: string }>(
        "User", `id=eq.${enc(doc.uploadedById)}&select=role&limit=1`
      );
      if (owner?.role === "CLIENT") allowed = true;
    }
  }
  if (!allowed) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const path = urlToPath(doc.url);
  const fileData = await downloadFile(path);
  if (!fileData) return NextResponse.json({ error: "Fichier indisponible" }, { status: 502 });

  const { searchParams } = new URL(req.url);
  const forceDownload = searchParams.get("download") === "1";
  const safeName = doc.name.replace(/["\r\n]/g, "_");

  return new NextResponse(new Uint8Array(fileData.buffer), {
    status: 200,
    headers: {
      "Content-Type": fileData.contentType,
      "Content-Disposition": `${forceDownload ? "attachment" : "inline"}; filename="${safeName}"`,
      "Cache-Control": "private, max-age=0, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
