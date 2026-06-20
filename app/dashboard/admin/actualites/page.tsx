import { sbGet } from "@/lib/supabase-admin";
import PostsClient from "./PostsClient";

async function getPosts() {
  return sbGet<{
    id: string; title: string; slug: string; excerpt: string;
    category: string; lang: string; published: boolean; createdAt: string;
  }>("Post", "select=id,title,slug,excerpt,category,lang,published,createdAt&order=createdAt.desc");
}

export default async function ActualitesAdminPage() {
  const posts = await getPosts();
  return <PostsClient initialPosts={posts} />;
}
