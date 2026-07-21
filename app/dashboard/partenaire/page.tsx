import { auth } from "@/lib/auth";
import ExchangesView from "@/components/exchanges/ExchangesView";

export default async function PartenaireEchangesPage() {
  const session = await auth();
  const userId = (session?.user as { id?: string })?.id ?? "";
  return <ExchangesView currentUserId={userId} />;
}
