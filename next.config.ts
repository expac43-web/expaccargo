import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: {
    root: process.cwd(),
  },
  // Compression gzip automatique des réponses HTTP
  compress: true,
  images: {
    // Conversion automatique en AVIF puis WebP → 30-70% plus léger
    formats: ["image/avif", "image/webp"],
    // Largeurs générées pour le responsive srcset
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "placehold.co", pathname: "/**" },
      { protocol: "https", hostname: "*.supabase.co", pathname: "/**" },
    ],
    // Cache des images optimisées pendant 7 jours côté CDN/browser
    minimumCacheTTL: 60 * 60 * 24 * 7,
  },
  // En-têtes de cache sur les assets statiques
  async headers() {
    return [
      {
        source: "/(.*\\.(?:jpg|jpeg|png|gif|webp|avif|svg|ico|woff|woff2))",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // Pages publiques : cache navigateur 1 min, revalidation CDN 5 min
        source: "/(|services|tracking|devis|contact|actualites)(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=300, stale-while-revalidate=60",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
