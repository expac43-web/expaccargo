import type { Metadata } from "next";
import { Montserrat, Lato } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "EXPAC — Express Africa Cargo Ltd",
  description:
    "Expert en logistique internationale, transit et transport multimodal en Afrique. Suivi de vos expéditions en temps réel.",
  keywords: "cargo, logistique, Afrique, transit, transport, expédition, EXPAC",
  openGraph: {
    title: "EXPAC — Express Africa Cargo Ltd",
    description: "Votre partenaire logistique en Afrique",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${montserrat.variable} ${lato.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
