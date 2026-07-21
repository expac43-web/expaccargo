import { auth } from "@/lib/auth";
import ExchangeDetail from "@/components/exchanges/ExchangeDetail";

export default async function PartenaireExchangePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const userId = (session?.user as { id?: string })?.id ?? "";
  return <ExchangeDetail exchangeId={id} currentUserId={userId} backHref="/dashboard/partenaire" />;
}
