import { NextResponse } from "next/server";
import { getGrilleConfig } from "@/lib/grille-server";

// Grille tarifaire courante (valeurs modifiables) — lue par l'estimateur public
// et le composeur de devis. Publique : ce sont les tarifs affichés d'EXPAC.
export async function GET() {
  const grille = await getGrilleConfig();
  return NextResponse.json(grille);
}
