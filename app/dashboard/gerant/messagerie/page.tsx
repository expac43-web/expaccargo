import { auth } from "@/lib/auth";
import InternalMessages from "@/components/internal/InternalMessages";

export default async function MessagerieInternePage() {
  const session = await auth();
  const userId = (session?.user as { id?: string })?.id ?? "";
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <InternalMessages currentUserId={userId} />
    </div>
  );
}
