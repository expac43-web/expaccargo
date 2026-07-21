import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import PartenaireSidebar from "@/components/partenaire/PartenaireSidebar";

export default async function PartenaireLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;

  if (!session || role !== "PARTNER") {
    redirect("/login");
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      <PartenaireSidebar userName={session.user?.name ?? ""} />
      <div className="flex-1 min-w-0 flex flex-col pt-14 lg:pt-0">{children}</div>
    </div>
  );
}
