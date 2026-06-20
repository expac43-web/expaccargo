import ExpeditionsClient from "@/app/dashboard/admin/expeditions/ExpeditionsClient";

// L'agence dispose de la gestion complète des expéditions (création, modification,
// jalons), mais sans l'historique des modifications (réservé à l'admin et au gérant).
export default function AgenceExpeditionsPage() {
  return <ExpeditionsClient />;
}
