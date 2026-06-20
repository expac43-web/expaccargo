import ClientDetailView from "@/components/clients/ClientDetailView";

export default async function GerantClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <ClientDetailView
      clientId={id}
      apiBase="/api/gerant/clients"
      backHref="/dashboard/gerant/clients"
      accent="#1A3A6B"
      eyebrow="Gérant"
    />
  );
}
