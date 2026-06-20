import ClientDetailView from "@/components/clients/ClientDetailView";

export default async function AgenceClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <ClientDetailView
      clientId={id}
      apiBase="/api/agence/clients"
      backHref="/dashboard/agence/clients"
      accent="#0e5f72"
      eyebrow="Agence"
    />
  );
}
