import { auth } from "@/lib/auth";
import ExchangesView from "@/components/exchanges/ExchangesView";

export default async function GerantEchangesPage() {
  const session = await auth();
  const userId = (session?.user as { id?: string })?.id ?? "";
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <ExchangesView isStaff currentUserId={userId} />
    </div>
  );
}
