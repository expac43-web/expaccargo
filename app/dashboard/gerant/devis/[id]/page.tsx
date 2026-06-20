import DevisDetail from "@/components/admin/DevisDetail";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DevisDetail id={id} backHref="/dashboard/gerant/devis" />;
}
