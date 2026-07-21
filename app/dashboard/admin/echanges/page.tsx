import ExchangesView from "@/components/exchanges/ExchangesView";

export default function EchangesPage() {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <ExchangesView isStaff detailBase="/dashboard/admin/echanges" />
    </div>
  );
}
