import type { Metadata } from "next";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Tag } from "lucide-react";

type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  createdAt: string;
};

async function fetchPost(slug: string): Promise<Post | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/Post?slug=eq.${encodeURIComponent(slug)}&published=eq.true&limit=1`,
      {
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
        },
        next: { revalidate: 60 },
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data[0] ?? null;
  } catch {
    return null;
  }
}

/* ── generateMetadata : titre + description uniques par article ─────────── */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchPost(slug);

  if (!post) {
    return {
      title: "Article introuvable",
      description: "Cet article n'existe pas ou a été supprimé.",
    };
  }

  const title = `${post.title}`;
  const description = post.excerpt?.slice(0, 160) ?? "Article EXPAC — Logistique Afrique";
  const url = `https://expaccargoltd.com/actualites/${post.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "article",
      publishedTime: post.createdAt,
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

function formatDate(dateStr: string) {
  try {
    return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(dateStr));
  } catch { return dateStr; }
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await fetchPost(slug);
  if (!post) notFound();

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
            <Link
              href="/actualites"
              className="inline-flex items-center gap-2 text-blue-300 hover:text-white text-sm mb-6 transition-colors"
              style={{ fontFamily: "var(--font-lato)" }}
            >
              <ArrowLeft size={15} />
              Retour aux actualités
            </Link>
            <div className="flex items-center gap-2 mb-4">
              <Tag size={13} style={{ color: "#fba563" }} />
              <span className="text-xs font-black uppercase tracking-widest" style={{ color: "#fba563", fontFamily: "var(--font-montserrat)" }}>
                {post.category}
              </span>
            </div>
            <h1
              className="text-3xl lg:text-4xl font-black text-white uppercase leading-tight mb-4 max-w-3xl"
              style={{ fontFamily: "var(--font-montserrat)" }}
            >
              {post.title}
            </h1>
            <p className="text-blue-300 text-sm flex items-center gap-2" style={{ fontFamily: "var(--font-lato)" }}>
              <Calendar size={13} />
              {formatDate(post.createdAt)}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="bg-gray-50 py-14">
          <div className="container-custom">
            <div className="max-w-3xl mx-auto">
              <div className="bg-white rounded-2xl border border-gray-100 p-8 md:p-12 shadow-sm">
                <p
                  className="text-lg text-gray-600 leading-relaxed mb-8 font-medium border-l-4 pl-5"
                  style={{ borderColor: "#E8520A", fontFamily: "var(--font-lato)" }}
                >
                  {post.excerpt}
                </p>
                <div
                  className="prose prose-gray max-w-none text-gray-700 leading-relaxed"
                  style={{ fontFamily: "var(--font-lato)" }}
                  dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, "<br/>") }}
                />
              </div>

              <div className="mt-8 text-center">
                <Link
                  href="/actualites"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-black text-white text-sm uppercase tracking-wide hover:opacity-90"
                  style={{ backgroundColor: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}
                >
                  <ArrowLeft size={15} />
                  Voir toutes les actualités
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
