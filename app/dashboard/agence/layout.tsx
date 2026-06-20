import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import AgenceSidebar from "@/components/agence/AgenceSidebar";
import { sbGet } from "@/lib/supabase-admin";

export default async function AgenceDashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  const userId = (session?.user as { id?: string })?.id;

  if (!session || role !== "AGENCY") {
    redirect("/login");
  }

  // Récupérer le nom de l'agence et l'avatar de l'utilisateur
  let agencyName = "Agence";
  let avatarUrl: string | null = null;
  if (userId) {
    const users = await sbGet<{ agencyId: string | null; avatarUrl: string | null }>(
      "User",
      `id=eq.${encodeURIComponent(userId)}&select=agencyId,avatarUrl`
    );
    avatarUrl = users[0]?.avatarUrl ?? null;
    const agencyId = users[0]?.agencyId;
    if (agencyId) {
      const agencies = await sbGet<{ name: string }>(
        "Agency",
        `id=eq.${encodeURIComponent(agencyId)}&select=name`
      );
      agencyName = agencies[0]?.name ?? "Agence";
    }
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      <AgenceSidebar
        userName={session.user?.name ?? "Agent"}
        agencyName={agencyName}
        avatarUrl={avatarUrl}
      />
      <div className="flex-1 min-w-0 flex flex-col pt-14 lg:pt-0">
        {children}
      </div>
    </div>
  );
}
