"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminHeader from "@/components/admin/AdminHeader";
import Modal from "@/components/admin/Modal";
import Pagination from "@/components/admin/Pagination";
import { Newspaper, Plus, Pencil, Trash2, Eye, EyeOff, ExternalLink } from "lucide-react";

const PAGE_SIZE = 15;

type Post = {
  id: string; title: string; slug: string; excerpt: string;
  category: string; lang: string; published: boolean; createdAt: string;
};

const CATEGORIES = ["Actualité", "Guide", "Réglementation", "Partenariat", "Communiqué", "Autre"];

export default function PostsClient({
  initialPosts,
  basePath = "/dashboard/admin/actualites",
}: {
  initialPosts: Post[];
  basePath?: string;
}) {
  const [posts, setPosts] = useState(initialPosts);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const router = useRouter();

  // Rester sur une page valide après suppression.
  useEffect(() => {
    const pc = Math.max(1, Math.ceil(posts.length / PAGE_SIZE));
    if (page > pc) setPage(pc);
  }, [posts.length, page]);
  const paged = posts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function togglePublish(p: Post) {
    const r = await fetch(`/api/admin/posts/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !p.published }),
    });
    if (r.ok) setPosts(prev => prev.map(x => x.id === p.id ? { ...x, published: !p.published } : x));
  }

  async function deletePost() {
    if (!deleteId) return;
    setLoading(true);
    try {
      const r = await fetch(`/api/admin/posts/${deleteId}`, { method: "DELETE" });
      if (r.ok) setPosts(prev => prev.filter(p => p.id !== deleteId));
      setDeleteId(null);
    } finally { setLoading(false); }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <AdminHeader
        title="Actualités"
        subtitle={`${posts.length} article${posts.length > 1 ? "s" : ""}`}
        action={
          <button
            onClick={() => router.push(`${basePath}/new`)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-xs font-black uppercase tracking-wide hover:opacity-90"
            style={{ backgroundColor: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}
          >
            <Plus size={15} /> Nouvel article
          </button>
        }
      />

      <div className="flex-1 p-6">
        {posts.length === 0 ? (
          <div className="text-center py-20">
            <Newspaper size={36} className="mx-auto mb-3 text-gray-300" />
            <p className="text-gray-400 text-sm" style={{ fontFamily: "var(--font-lato)" }}>Aucun article publié.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {["Titre", "Catégorie", "Langue", "Statut", "Date", "Actions"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-gray-400" style={{ fontFamily: "var(--font-montserrat)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paged.map((p) => (
                    <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-black text-xs truncate max-w-xs" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>{p.title}</p>
                        <p className="text-xs text-gray-400 truncate max-w-xs mt-0.5" style={{ fontFamily: "var(--font-lato)" }}>{p.excerpt}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-1 rounded-lg font-black" style={{ backgroundColor: "rgba(26,58,107,0.06)", color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
                          {p.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 uppercase" style={{ fontFamily: "var(--font-montserrat)" }}>{p.lang}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-black uppercase"
                          style={{
                            backgroundColor: p.published ? "rgba(22,163,74,0.1)" : "rgba(107,114,128,0.1)",
                            color: p.published ? "#16a34a" : "#6b7280",
                            fontFamily: "var(--font-montserrat)",
                          }}>
                          {p.published ? <Eye size={10} /> : <EyeOff size={10} />}
                          {p.published ? "Publié" : "Brouillon"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>
                        {new Date(p.createdAt).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {p.published && (
                            <a href={`/actualites/${p.slug}`} target="_blank" className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-[#1A3A6B] hover:bg-gray-100">
                              <ExternalLink size={13} />
                            </a>
                          )}
                          <button onClick={() => togglePublish(p)} title={p.published ? "Dépublier" : "Publier"} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100">
                            {p.published ? <EyeOff size={13} /> : <Eye size={13} />}
                          </button>
                          <button onClick={() => router.push(`${basePath}/${p.id}`)} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-[#1A3A6B] hover:bg-gray-100">
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => setDeleteId(p.id)} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <Pagination page={page} total={posts.length} pageSize={PAGE_SIZE} onChange={setPage} />
      </div>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Supprimer l'article">
        <p className="text-sm text-gray-600 mb-6" style={{ fontFamily: "var(--font-lato)" }}>
          Cet article sera définitivement supprimé.
        </p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteId(null)} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-black text-gray-500" style={{ fontFamily: "var(--font-montserrat)" }}>Annuler</button>
          <button onClick={deletePost} disabled={loading} className="flex-1 py-3 rounded-xl text-white text-sm font-black bg-red-500 hover:bg-red-600 disabled:opacity-60" style={{ fontFamily: "var(--font-montserrat)" }}>
            {loading ? "Suppression..." : "Supprimer"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
