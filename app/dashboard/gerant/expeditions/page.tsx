import ExpeditionsClient from "@/app/dashboard/admin/expeditions/ExpeditionsClient";

// Le gérant dispose de la même gestion complète des expéditions que l'admin
// (création, modification, jalons) + l'historique des modifications.
export default function GerantExpeditionsPage() {
  return <ExpeditionsClient canSeeAudit />;
}
