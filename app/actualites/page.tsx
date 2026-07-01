import type { Metadata } from "next";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import Link from "next/link";
import Image from "next/image";
import Reveal from "@/components/public/Reveal";

export const metadata: Metadata = {
  title: "Actualités — Logistique & Transport en Afrique",
  description:
    "Restez informé des dernières actualités du secteur logistique, transport et transit en Afrique. Articles, analyses et conseils par les experts EXPAC.",
  alternates: { canonical: "https://expaccargo.com/actualites" },
  openGraph: {
    title: "Actualités Logistique Afrique — EXPAC",
    description:
      "Toute l'actualité du transport international et de la logistique en Afrique par Express Africa Cargo Ltd.",
    url: "https://expaccargo.com/actualites",
  },
};
import { ExternalLink, Calendar, Tag, ArrowRight, Newspaper, PenLine } from "lucide-react";
import { getServerLocale } from "@/lib/i18n/server";
import { getDictionary } from "@/lib/i18n";

/* ── Image d'en-tête (Unsplash, optimisée par next/image) — machine à écrire « News » ── */
const NEWS_HEADER = "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=1600&q=55";

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
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/Post?published=eq.true&order=createdAt.desc&limit=12`,
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

function formatDate(dateStr: string, dl: string) {
  try {
    return new Intl.DateTimeFormat(dl, { day: "numeric", month: "long", year: "numeric" }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

/* ── Page ───────────────────────────────────────────────── */

export default async function ActualitesPage() {
  const [rssArticles, dbPosts] = await Promise.all([fetchRssNews(), fetchPosts()]);
  const locale = await getServerLocale();
  const t = getDictionary(locale);
  const n = t.news;
  const dl = locale === "en" ? "en-US" : "fr-FR";

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">

        {/* Header — image de fond (machine à écrire « News ») + voile navy */}
        <div className="relative py-20 overflow-hidden">
          <Image src={NEWS_HEADER} alt="Actualités & presse — EXPAC" fill priority sizes="100vw" className="object-cover" />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(120deg, rgba(14,34,72,0.95) 0%, rgba(26,58,107,0.88) 55%, rgba(42,82,152,0.72) 100%)" }}
          />
          <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full opacity-10" style={{ backgroundColor: "#E8520A" }} />
          <div className="container-custom relative z-10">
            <p className="text-xs font-black uppercase tracking-[0.2em] mb-4" style={{ color: "#fba563", fontFamily: "var(--font-montserrat)" }}>
              ▪ {n.eyebrow}
            </p>
            <h1 className="text-4xl lg:text-5xl font-black text-white uppercase leading-tight mb-4" style={{ fontFamily: "var(--font-montserrat)" }}>
              {n.titlePre} <span style={{ color: "#E8520A" }}>{n.titleHighlight}</span>
            </h1>
            <p className="text-blue-200 max-w-xl" style={{ fontFamily: "var(--font-lato)" }}>
              {n.subtitle}
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
                    {n.expacArticles}
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {dbPosts.map((post, i) => (
                    <Reveal key={post.id} delay={(i % 3) * 70} className="h-full">
                      <Link
                        href={`/actualites/${post.slug}`}
                        className="group relative flex flex-col h-full bg-white rounded-2xl border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 hover:border-[#E8520A]/40"
                      >
                        <span className="absolute top-0 left-0 h-1 w-full" style={{ backgroundColor: "#E8520A" }} />
                        <div className="p-6 flex flex-col flex-1">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-[11px] font-black uppercase tracking-wide px-2.5 py-1 rounded-full" style={{ backgroundColor: "rgba(232,82,10,0.1)", color: "#E8520A", fontFamily: "var(--font-montserrat)" }}>
                              {post.category}
                            </span>
                          </div>
                          <h3 className="font-black text-base uppercase leading-tight mb-3 group-hover:text-[#E8520A] transition-colors" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
                            {post.title}
                          </h3>
                          <p className="text-sm text-gray-500 leading-relaxed mb-5 line-clamp-3 flex-1" style={{ fontFamily: "var(--font-lato)" }}>
                            {post.excerpt}
                          </p>
                          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                            <span className="flex items-center gap-1.5 text-xs text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>
                              <Calendar size={12} />
                              {formatDate(post.createdAt, dl)}
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wide border-2 border-[#E8520A] text-[#E8520A] group-hover:bg-[#E8520A] group-hover:text-white transition-all duration-300" style={{ fontFamily: "var(--font-montserrat)" }}>
                              {n.read} <ArrowRight size={12} className="transition-transform duration-300 group-hover:translate-x-1" />
                            </span>
                          </div>
                        </div>
                      </Link>
                    </Reveal>
                  ))}
                </div>
              </div>
            )}

            {/* Actualités RSS */}
            <div>
              <div className="flex items-center gap-3 mb-7">
                <Newspaper size={18} style={{ color: "#1A3A6B" }} />
                <h2 className="text-lg font-black uppercase" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
                  {n.sectorNews}
                </h2>
                <span className="text-xs text-gray-400 ml-2" style={{ fontFamily: "var(--font-lato)" }}>
                  {n.autoUpdate}
                </span>
              </div>

              {rssArticles.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
                  <p className="text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>
                    {n.none}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {rssArticles.map((article, i) => (
                    <Reveal key={i} delay={(i % 3) * 70} className="h-full">
                      <a
                        href={article.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative flex flex-col h-full bg-white rounded-2xl border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 hover:border-[#1A3A6B]/40"
                      >
                        <span className="absolute top-0 left-0 h-1 w-full" style={{ backgroundColor: "#1A3A6B" }} />
                        <div className="p-6 flex flex-col flex-1">
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
                            <p className="text-sm text-gray-500 leading-relaxed mb-5 line-clamp-3 flex-1" style={{ fontFamily: "var(--font-lato)" }}>
                              {article.description}
                            </p>
                          )}
                          <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
                            <span className="flex items-center gap-1.5 text-xs text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>
                              <Calendar size={12} />
                              {formatDate(article.pubDate, dl)}
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wide border-2 border-[#1A3A6B] text-[#1A3A6B] group-hover:bg-[#1A3A6B] group-hover:text-white transition-all duration-300" style={{ fontFamily: "var(--font-montserrat)" }}>
                              {n.read} <ExternalLink size={11} className="transition-transform duration-300 group-hover:translate-x-0.5" />
                            </span>
                          </div>
                        </div>
                      </a>
                    </Reveal>
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
