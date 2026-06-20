import type { Metadata } from "next";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import ContactForm from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact — Parlez à nos Experts Logistique",
  description:
    "Contactez EXPAC pour toute question sur vos expéditions, transit douanier ou transport en Afrique. Réponse garantie sous 24h ouvrées. +242 00 000 00 00",
  alternates: { canonical: "https://expaccargo.com/contact" },
  openGraph: {
    title: "Contacter EXPAC — Experts en Logistique Afrique",
    description:
      "Notre équipe vous répond sous 24h. Transit, transport, stockage : posez vos questions à nos experts en logistique africaine.",
    url: "https://expaccargo.com/contact",
  },
  keywords: [
    "contact logistique Afrique",
    "contacter transitaire Congo",
    "service client EXPAC",
    "numéro téléphone cargo Afrique",
    "email logistique internationale",
  ],
};

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <ContactForm />
      <Footer />
    </div>
  );
}
