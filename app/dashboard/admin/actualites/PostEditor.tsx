"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminHeader from "@/components/admin/AdminHeader";
import { Save, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";

type PostData = {
  id?: string; title: string; slug: string; excerpt: string;
  content: string; category: string; lang: string; published: boolean;
};

const CATEGORIES = ["Actualité", "Guide", "Réglementation", "Partenariat", "Communiqué", "Autre"];

const labelCls = "block text-xs font-black uppercase tracking-wider mb-1.5 text-gray-600";
const inputCls = "w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#1A3A6B] focus:ring-2 focus:ring-[#1A3A6B]/10 transition-all bg-white";

function slugify(str: string): string {
  return str.toLowerCase()
    .normalize("NFD").replace(/\p{Mn}/gu, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim().replace(/\s+/g, "-").replace(/-+/g, "-");
}

export default function PostEditor({
  initialPost,
  basePath = "/dashboard/admin/actualites",
}: {
  initialPost?: PostData;
  basePath?: string;
}) {
  const router = useRouter();
  const isEdit = !!initialPost?.id;

  const [form, setForm] = useState<PostData>({
    title: initialPost?.title ?? "",
    slug: initialPost?.slug ?? "",
    excerpt: initialPost?.excerpt ?? "",
    content: initialPost?.content ?? "",
    category: initialPost?.category ?? "Actualité",
    lang: initialPost?.lang ?? "fr",
    published: initialPost?.published ?? false,
  });

  const [slugEdited, setSlugEdited] = useState(isEdit);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Auto-generate slug from title
  useEffect(() => {
    if (!slugEdited && form.title) {
      setForm(p => ({ ...p, slug: slugify(p.title) }));
    }
  }, [form.title, slugEdited]);

  function set(k: keyof PostData, v: string | boolean) {
    setForm(p => ({ ...p, [k]: v }));
  }

  async function save(asDraft = false) {
    setLoading(true); setError(""); setSuccess(false);
    try {
      const payload = { ...form, published: asDraft ? false : form.published };
      const url = isEdit ? `/api/admin/posts/${initialPost!.id}` : "/api/admin/posts";
      const method = isEdit ? "PUT" : "POST";

      const r = await fetch(url, {
        method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      const data = await r.json();
      if (!r.ok) { setError(data.error ?? "Erreur"); return; }

      setSuccess(true);
      setTimeout(() => router.push(basePath), 1000);
    } finally { setLoading(false); }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <AdminHeader
        title={isEdit ? "Modifier l'article" : "Nouvel article"}
        backHref={basePath}
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => { set("published", false); save(true); }}
              disabled={loading}
              className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-black text-gray-600 hover:bg-gray-50 disabled:opacity-60"
              style={{ fontFamily: "var(--font-montserrat)" }}
            >
              Brouillon
            </button>
            <button
              onClick={() => { set("published", true); save(); }}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-xs font-black hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}
            >
              <Save size={14} />
              {loading ? "Enregistrement..." : "Publier"}
            </button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-6">
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100 mb-5">
            <AlertCircle size={14} className="text-red-500 shrink-0" />
            <p className="text-xs text-red-600" style={{ fontFamily: "var(--font-lato)" }}>{error}</p>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 border border-green-100 mb-5">
            <CheckCircle2 size={14} className="text-green-600 shrink-0" />
            <p className="text-xs text-green-700" style={{ fontFamily: "var(--font-lato)" }}>Article enregistré ! Redirection...</p>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Main */}
          <div className="xl:col-span-2 space-y-5">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-5">
              <div>
                <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>Titre *</label>
                <input className={inputCls} value={form.title} onChange={e => set("title", e.target.value)} placeholder="Titre de l'article" style={{ fontFamily: "var(--font-lato)" }} />
              </div>
              <div>
                <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>Slug (URL)</label>
                <input
                  className={inputCls}
                  value={form.slug}
                  onChange={e => { setSlugEdited(true); set("slug", e.target.value); }}
                  placeholder="titre-de-l-article"
                  style={{ fontFamily: "var(--font-lato)" }}
                />
                <p className="text-xs text-gray-400 mt-1" style={{ fontFamily: "var(--font-lato)" }}>
                  URL : /actualites/<strong>{form.slug || "slug"}</strong>
                </p>
              </div>
              <div>
                <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>Résumé *</label>
                <textarea
                  className={inputCls}
                  rows={2}
                  value={form.excerpt}
                  onChange={e => set("excerpt", e.target.value)}
                  placeholder="Résumé affiché dans la liste des articles..."
                  style={{ fontFamily: "var(--font-lato)", resize: "vertical" }}
                />
              </div>
              <div>
                <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>Contenu * <span className="text-gray-400 normal-case font-normal">(HTML ou texte brut)</span></label>
                <textarea
                  className={inputCls}
                  rows={18}
                  value={form.content}
                  onChange={e => set("content", e.target.value)}
                  placeholder="<p>Contenu de l'article...</p>"
                  style={{ fontFamily: "var(--font-lato)", resize: "vertical" }}
                />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
              <h3 className="font-black uppercase text-xs" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>Options de publication</h3>
              <div>
                <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>Statut</label>
                <button
                  type="button"
                  onClick={() => set("published", !form.published)}
                  className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl border text-sm font-black transition-all"
                  style={{
                    borderColor: form.published ? "#16a34a" : "#e5e7eb",
                    color: form.published ? "#16a34a" : "#6b7280",
                    backgroundColor: form.published ? "rgba(22,163,74,0.06)" : "white",
                    fontFamily: "var(--font-montserrat)",
                  }}
                >
                  {form.published ? <Eye size={14} /> : <EyeOff size={14} />}
                  {form.published ? "Publié" : "Brouillon"}
                </button>
              </div>
              <div>
                <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>Catégorie *</label>
                <select className={inputCls} value={form.category} onChange={e => set("category", e.target.value)} style={{ fontFamily: "var(--font-lato)" }}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>Langue</label>
                <select className={inputCls} value={form.lang} onChange={e => set("lang", e.target.value)} style={{ fontFamily: "var(--font-lato)" }}>
                  <option value="fr">Français</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <h3 className="font-black uppercase text-xs mb-3" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>Aide contenu</h3>
              <ul className="space-y-1.5 text-xs text-gray-500" style={{ fontFamily: "var(--font-lato)" }}>
                <li>• Utilisez du HTML basique pour le contenu</li>
                <li>• <code className="bg-gray-100 px-1 rounded">&lt;p&gt;</code> pour les paragraphes</li>
                <li>• <code className="bg-gray-100 px-1 rounded">&lt;h2&gt;</code> pour les sous-titres</li>
                <li>• <code className="bg-gray-100 px-1 rounded">&lt;strong&gt;</code> pour le gras</li>
                <li>• <code className="bg-gray-100 px-1 rounded">&lt;ul&gt;&lt;li&gt;</code> pour les listes</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
