import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import ClientSidebar from "@/components/client/ClientSidebar";

export default async function ClientDashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;

  // Super admin: leur layout est dans /dashboard/admin/layout.tsx
  if (role === "SUPER_ADMIN") {
    return <>{children}</>;
  }

  // Manager: leur layout est dans /dashboard/gerant/layout.tsx
  if (role === "MANAGER") {
    return <>{children}</>;
  }

  // Agency: leur layout est dans /dashboard/agence/layout.tsx
  if (role === "AGENCY") {
    return <>{children}</>;
  }

  // No session or non-CLIENT → redirect to client login
  if (!session || role !== "CLIENT") {
    redirect("/login");
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      <ClientSidebar userName={session.user?.name ?? ""} />
      <div className="flex-1 min-w-0 flex flex-col pt-14 lg:pt-0">
        {children}
      </div>
    </div>
  );
}
