import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import Link from "next/link";
import { ExternalLink, Calendar, Tag, ArrowRight, Newspaper, PenLine } from "lucide-react";

/* ── Types ─────────────────────────────────────────────── */

type RssArticle = {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  source: string;
  type: "rss";
};

type DbPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  createdAt: string;
  type: "db";
};

/* ── Fetch RSS Google News ──────────────────────────────── */

async function fetchRssNews(): Promise<RssArticle[]> {
  try {
    const queries = [
      "import export logistique Afrique",
      "cargo transit maritime Afrique",
    ];
    const q = encodeURIComponent(queries[0]);
    const url = `https://news.google.com/rss/search?q=${q}&hl=fr&gl=FR&ceid=FR:fr`;

    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const xml = await res.text();

    const itemBlocks = xml.match(/<item>([\s\S]*?)<\/item>/g) ?? [];

    return itemBlocks.slice(0, 12).map((block) => {
      const extract = (tag: string) => {
        const cdataMatch = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`).exec(block);
        if (cdataMatch) return cdataMatch[1].trim();
        const plainMatch = new RegExp(`<${tag}[^>]*>([^<]*)<\\/${tag}>`).exec(block);
        return plainMatch ? plainMatch[1].trim() : "";
      };

      const linkMatch = /<link>([^<]+)<\/link>/.exec(block)
        ?? /<link \/>([^<]+)/.exec(block);

      // Strip HTML from description
      const rawDesc = extract("description").replace(/<[^>]+>/g, "").slice(0, 180);

      return {
        title: extract("title"),
        link: linkMatch?.[1] ?? "",
        description: rawDesc,
        pubDate: extract("pubDate"),
        source: extract("source") || "Google News",
        type: "rss" as const,
      };
    }).filter((a) => a.title && a.link);
  } catch {
    return [];
  }
}

/* ── Fetch published posts from DB ─────────────────────── */

async function fetchPosts(): Promise<DbPost[]> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/Post?published=eq.true&order=createdAt.desc&limit=6`,
      {
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
        },
        next: { revalidate: 60 },
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.map((p: DbPost) => ({ ...p, type: "db" as const }));
  } catch {
    return [];
  }
}

/* ── Helpers ────────────────────────────────────────────── */

function formatDate(dateStr: string) {
  try {
    return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

/* ── Page ───────────────────────────────────────────────── */

export default async function ActualitesPage() {
  const [rssArticles, dbPosts] = await Promise.all([fetchRssNews(), fetchPosts()]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">

        {/* Header */}
        <div
          className="relative py-16 overflow-hidden"
          style={{ background: "linear-gradient(135deg, #0e2248 0%, #1A3A6B 60%, #2a5298 100%)" }}
        >
          <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full opacity-10" style={{ backgroundColor: "#E8520A" }} />
          <div className="container-custom relative z-10">
            <p className="text-xs font-black uppercase tracking-[0.2em] mb-4" style={{ color: "#fba563", fontFamily: "var(--font-montserrat)" }}>
              ▪ Restez informé
            </p>
            <h1 className="text-4xl lg:text-5xl font-black text-white uppercase leading-tight mb-4" style={{ fontFamily: "var(--font-montserrat)" }}>
              Actualités <span style={{ color: "#E8520A" }}>logistique</span>
            </h1>
            <p className="text-blue-200 max-w-xl" style={{ fontFamily: "var(--font-lato)" }}>
              Les dernières nouvelles de l'import-export et de la logistique en Afrique, ainsi que les publications de notre équipe.
            </p>
          </div>
        </div>

        <div className="bg-gray-50 py-14">
          <div className="container-custom">

            {/* Articles EXPAC (DB) */}
            {dbPosts.length > 0 && (
              <div className="mb-14">
                <div className="flex items-center gap-3 mb-7">
                  <PenLine size={18} style={{ color: "#E8520A" }} />
                  <h2 className="text-lg font-black uppercase" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
                    Articles EXPAC
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {dbPosts.map((post) => (
                    <Link
                      key={post.id}
                      href={`/actualites/${post.slug}`}
                      className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1"
                    >
                      <div className="h-1" style={{ backgroundColor: "#E8520A" }} />
                      <div className="p-6">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xs font-black uppercase px-2 py-1 rounded-lg" style={{ backgroundColor: "rgba(232,82,10,0.1)", color: "#E8520A", fontFamily: "var(--font-montserrat)" }}>
                            {post.category}
                          </span>
                        </div>
                        <h3 className="font-black text-base uppercase leading-tight mb-3 group-hover:text-[#E8520A] transition-colors" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
                          {post.title}
                        </h3>
                        <p className="text-sm text-gray-500 leading-relaxed mb-4 line-clamp-3" style={{ fontFamily: "var(--font-lato)" }}>
                          {post.excerpt}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-xs text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>
                            <Calendar size={12} />
                            {formatDate(post.createdAt)}
                          </span>
                          <span className="flex items-center gap-1 text-xs font-black uppercase" style={{ color: "#E8520A", fontFamily: "var(--font-montserrat)" }}>
                            Lire <ArrowRight size={12} />
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Actualités RSS */}
            <div>
              <div className="flex items-center gap-3 mb-7">
                <Newspaper size={18} style={{ color: "#1A3A6B" }} />
                <h2 className="text-lg font-black uppercase" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
                  Actualités du secteur
                </h2>
                <span className="text-xs text-gray-400 ml-2" style={{ fontFamily: "var(--font-lato)" }}>
                  Mise à jour automatique toutes les heures
                </span>
              </div>

              {rssArticles.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
                  <p className="text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>
                    Aucune actualité disponible pour le moment.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {rssArticles.map((article, i) => (
                    <a
                      key={i}
                      href={article.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1"
                    >
                      <div className="h-1" style={{ backgroundColor: "#1A3A6B" }} />
                      <div className="p-6">
                        <div className="flex items-center gap-2 mb-3">
                          <Tag size={12} style={{ color: "#1A3A6B" }} />
                          <span className="text-xs text-gray-400 truncate" style={{ fontFamily: "var(--font-lato)" }}>
                            {article.source}
                          </span>
                        </div>
                        <h3 className="font-black text-sm uppercase leading-tight mb-3 group-hover:text-[#1A3A6B] transition-colors line-clamp-3" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
                          {article.title}
                        </h3>
                        {article.description && (
                          <p className="text-sm text-gray-500 leading-relaxed mb-4 line-clamp-3" style={{ fontFamily: "var(--font-lato)" }}>
                            {article.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-auto">
                          <span className="flex items-center gap-1.5 text-xs text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>
                            <Calendar size={12} />
                            {formatDate(article.pubDate)}
                          </span>
                          <span className="flex items-center gap-1 text-xs font-black uppercase" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
                            Lire <ExternalLink size={11} />
                          </span>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
