import { sbGet } from "@/lib/supabase-admin";
import StorageManager from "@/components/admin/StorageManager";

export default async function GerantStoragePage() {
  const agencies = await sbGet<{ id: string; name: string }>("Agency", "select=id,name&order=name.asc");
  return <StorageManager canManageAll agencies={agencies} />;
}
