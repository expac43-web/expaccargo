import { sbGet } from "@/lib/supabase-admin";
import PostEditor from "@/app/dashboard/admin/actualites/PostEditor";
import { notFound } from "next/navigation";

export default async function GerantEditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [post] = await sbGet<{
    id: string; title: string; slug: string; excerpt: string;
    content: string; category: string; lang: string; published: boolean;
  }>("Post", `id=eq.${id}&select=*`);

  if (!post) notFound();
  return <PostEditor initialPost={post} basePath="/dashboard/gerant/actualites" />;
}
