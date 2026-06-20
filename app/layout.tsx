import type { Metadata } from "next";
import { Montserrat, Lato } from "next/font/google";
import { cookies } from "next/headers";
import Script from "next/script";
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
const SITE_URL = "https://expaccargo.com";
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
    "société d'import-export",
    "société d'import-export Congo Brazzaville",
    "société d'import-export Afrique",
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
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID;

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
        {(gaId || gtmId) && <link rel="preconnect" href="https://www.googletagmanager.com" />}
      </head>
      <body className="min-h-full flex flex-col">
        {/* Google Tag Manager (noscript) — juste après l'ouverture de <body> */}
        {gtmId && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        )}
        <Providers>
          <LanguageProvider locale={locale} dict={dict}>{children}</LanguageProvider>
        </Providers>

        {/* Google Analytics 4 — chargé après l'hydratation (ne bloque pas le rendu),
            uniquement si NEXT_PUBLIC_GA_ID est défini. */}
        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}');
              `}
            </Script>
          </>
        )}

        {/* Google Tag Manager — chargé après l'hydratation (ne bloque pas le rendu).
            ⚠️ Ne PAS configurer GA4 dans GTM : GA4 est déjà branché en direct ci-dessus
            (sinon double comptage). GTM sert aux autres tags. */}
        {gtmId && (
          <Script id="gtm-init" strategy="afterInteractive">
            {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`}
          </Script>
        )}
      </body>
    </html>
  );
}
