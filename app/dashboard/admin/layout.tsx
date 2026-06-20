import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;

  if (!session || role !== "SUPER_ADMIN") {
    if (role === "MANAGER") redirect("/dashboard/gerant");
    if (role === "AGENCY") redirect("/dashboard/agence");
    redirect("/expac-login");
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      <AdminSidebar role={role ?? ""} userName={session.user?.name ?? ""} />
      {/* pt-14 accounts for the mobile top bar height */}
      <div className="flex-1 min-w-0 flex flex-col pt-14 lg:pt-0">
        {children}
      </div>
    </div>
  );
}
