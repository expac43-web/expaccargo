import type { Metadata } from "next";
import { Montserrat, Lato } from "next/font/google";
import { cookies } from "next/headers";
import Providers from "@/components/Providers";
import LanguageProvider from "@/components/i18n/LanguageProvider";
import { getDictionary, normalizeLocale } from "@/lib/i18n";
import "./globals.css";

/* ── Polices ───────────────────────────────────────────────────────────────
   display:swap évite le Flash of Invisible Text (FOIT) sur connexion lente.
   On ne charge que les graisses réellement utilisées dans le code.
   Montserrat : 400 body, 700 bold, 900 black (titres et étiquettes)
   Lato       : 400 texte courant, 700 emphase
   ─────────────────────────────────────────────────────────────────────── */
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  display: "swap",
});

const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

/* ── Métadonnées de base (surchargées par chaque page) ─────────────────── */
const SITE_NAME = "EXPAC — Express Africa Cargo Ltd";
const SITE_URL = "https://expaccargoltd.com";
const SITE_DESCRIPTION =
  "Expert en logistique internationale, transit douanier et transport multimodal en Afrique. Suivi d'expéditions en temps réel. Devis gratuit sous 24h.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  /* ── Titre avec template pour les sous-pages ── */
  title: {
    default: SITE_NAME,
    template: `%s | EXPAC`,
  },

  description: SITE_DESCRIPTION,

  keywords: [
    // ── Recherches générales import/export (intention commerciale) ──
    "société import export Afrique",
    "société import export Congo",
    "société import export Congo Brazzaville",
    "agence import export Afrique",
    "entreprise import export Congo",
    "importer des marchandises en Afrique",
    "exporter des marchandises depuis le Congo",
    "importer au Congo Brazzaville",
    "comment importer marchandises Congo",
    "société de négoce international Afrique",

    // ── Transit & dédouanement (termes précis utilisés en pratique) ──
    "transitaire Congo Brazzaville",
    "transitaire douanier Afrique",
    "dédouanement marchandise Congo",
    "dédouanement Brazzaville",
    "commissionnaire agréé en douane Congo",
    "passer la douane Congo",
    "mainlevée douane Afrique",
    "déclaration en douane import Congo",
    "blocage douane Congo solution",
    "formalités douanières Afrique centrale",

    // ── Transport de fret (aérien, maritime, routier) ──
    "envoyer marchandise en Afrique",
    "expédier un colis au Congo",
    "transporteur cargo Afrique",
    "fret maritime Afrique",
    "fret aérien Congo Brazzaville",
    "fret aérien Afrique centrale",
    "transport routier Afrique centrale",
    "conteneur maritime Congo",
    "groupage maritime Congo",
    "groupage aérien Afrique",
    "LCL Afrique",
    "FCL Congo",
    "expédition internationale Afrique",

    // ── Stockage & entreposage ──
    "entrepôt logistique Congo",
    "stockage marchandise Brazzaville",
    "entrepôt sous douane Afrique",
    "entreposage marchandises Afrique centrale",

    // ── Consignation maritime ──
    "consignataire maritime Congo",
    "agent maritime Brazzaville",
    "représentant armateur Afrique",
    "consignation navire Congo",

    // ── Devis & tarifs (intention d'achat directe) ──
    "devis transport international Afrique",
    "tarif fret Afrique",
    "prix expédition Congo",
    "devis logistique Congo gratuit",

    // ── Marque & identité ──
    "Express Africa Cargo Ltd",
    "EXPAC cargo",
    "EXPAC logistique",
    "logistique Congo Brazzaville",
    "freight forwarding Africa",
  ],

  authors: [{ name: "Express Africa Cargo Ltd", url: SITE_URL }],
  creator: "Express Africa Cargo Ltd",
  publisher: "Express Africa Cargo Ltd",

  /* ── Robots ── */
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  /* ── Open Graph ── */
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: `${SITE_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: "EXPAC — Express Africa Cargo Ltd",
      },
    ],
  },

  /* ── Twitter / X Card ── */
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [`${SITE_URL}/og-image.jpg`],
  },

  /* ── Liens canoniques & alternatifs ── */
  alternates: {
    canonical: SITE_URL,
  },

  /* ── Verification Google Search Console (à remplacer par la vraie clé) ── */
  // verification: {
  //   google: "VOTRE_CODE_VERIFICATION_GSC",
  // },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const locale = normalizeLocale(cookieStore.get("locale")?.value);
  const dict = getDictionary(locale);

  return (
    <html
      lang={locale}
      className={`${montserrat.variable} ${lato.variable} h-full antialiased`}
    >
      <head>
        {/* Preconnect aux domaines critiques pour réduire la latence */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="preconnect"
          href={process.env.NEXT_PUBLIC_SUPABASE_URL}
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-full flex flex-col">
        <Providers>
          <LanguageProvider locale={locale} dict={dict}>{children}</LanguageProvider>
        </Providers>
      </body>
    </html>
  );
}
