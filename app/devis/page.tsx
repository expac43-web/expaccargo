import type { Metadata } from "next";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import DevisForm from "./DevisForm";

export const metadata: Metadata = {
  title: "Demande de Devis — Transport & Logistique en Afrique",
  description:
    "Demandez un devis gratuit pour vos expéditions en Afrique. Transit douanier, transport multimodal, stockage, consignation maritime. Réponse sous 24h ouvrées.",
  alternates: { canonical: "https://expaccargoltd.com/devis" },
  openGraph: {
    title: "Devis Gratuit Logistique Afrique — EXPAC",
    description:
      "Obtenez votre devis personnalisé pour le transport et la logistique de vos marchandises en Afrique. Gratuit et sans engagement.",
    url: "https://expaccargoltd.com/devis",
  },
  keywords: [
    "devis logistique Afrique",
    "devis transport international",
    "devis transit douanier",
    "devis fret maritime",
    "devis groupage Afrique",
    "prix transport cargo Afrique",
  ],
};

export default function DevisPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <DevisForm />
      <Footer />
    </div>
  );
}
