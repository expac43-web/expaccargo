import { auth } from "@/lib/auth";
import ExchangeDetail from "@/components/exchanges/ExchangeDetail";

export default async function StaffExchangePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const userId = (session?.user as { id?: string })?.id ?? "";
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <ExchangeDetail exchangeId={id} isStaff currentUserId={userId} backHref="/dashboard/gerant/echanges" />
    </div>
  );
}
