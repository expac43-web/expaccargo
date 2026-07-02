import { auth } from "@/lib/auth";
import { sbGet, enc } from "@/lib/supabase-admin";
import StorageManager from "@/components/admin/StorageManager";

export default async function AgenceStoragePage() {
  const session = await auth();
  const uid = (session?.user as { id?: string })?.id;
  let agencyId: string | null = null;
  if (uid) {
    const rows = await sbGet<{ agencyId: string | null }>("User", `id=eq.${enc(uid)}&select=agencyId&limit=1`);
    agencyId = rows[0]?.agencyId ?? null;
  }
  // L'agent : lecture de tous les colis, mais écriture limitée à ceux de son agence.
  return <StorageManager canManageAll={false} myAgencyId={agencyId} />;
}
