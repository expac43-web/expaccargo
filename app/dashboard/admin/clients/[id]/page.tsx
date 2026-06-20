import ClientDetailView from "@/components/clients/ClientDetailView";

export default async function AdminClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <ClientDetailView
      clientId={id}
      apiBase="/api/admin/clients"
      backHref="/dashboard/admin/clients"
      accent="#1A3A6B"
      eyebrow="Super Admin"
    />
  );
}
