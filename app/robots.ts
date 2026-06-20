import type { MetadataRoute } from "next";

const BASE_URL = "https://expaccargo.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        // Crawlers autorisés sur les pages publiques
        userAgent: "*",
        allow: ["/", "/services", "/tracking", "/devis", "/contact", "/actualites"],
        disallow: [
          "/dashboard",      // Espaces client et admin privés
          "/api/",           // Routes API internes
          "/expac-login",    // Connexion admin non indexable
          "/inscription",    // Formulaire d'inscription non indexable
          "/login",          // Connexion client non indexable
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
