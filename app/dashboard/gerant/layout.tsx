import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import GerantSidebar from "@/components/gerant/GerantSidebar";
import { sbGet } from "@/lib/supabase-admin";

export default async function GerantDashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  const userId = (session?.user as { id?: string })?.id;

  if (!session || role !== "MANAGER") {
    redirect("/login");
  }

  let avatarUrl: string | null = null;
  if (userId) {
    const users = await sbGet<{ avatarUrl: string | null }>(
      "User",
      `id=eq.${encodeURIComponent(userId)}&select=avatarUrl`
    );
    avatarUrl = users[0]?.avatarUrl ?? null;
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      <GerantSidebar userName={session.user?.name ?? "Gérant"} avatarUrl={avatarUrl} />
      <div className="flex-1 min-w-0 flex flex-col pt-14 lg:pt-0">
        {children}
      </div>
    </div>
  );
}
