import { sbGet } from "@/lib/supabase-admin";
import AgenciesClient from "./AgenciesClient";

async function getAgencies() {
  const agencies = await sbGet<{
    id: string; name: string; city: string; country: string;
    phone: string | null; email: string | null; createdAt: string;
  }>("Agency", "select=*&order=name.asc");

  const users = await sbGet<{ agencyId: string | null; role: string }>(
    "User", "role=in.(MANAGER,AGENCY)&select=agencyId,role&agencyId=not.is.null"
  );

  const counts: Record<string, number> = {};
  for (const u of users) if (u.agencyId) counts[u.agencyId] = (counts[u.agencyId] ?? 0) + 1;

  return agencies.map((a) => ({ ...a, userCount: counts[a.id] ?? 0 }));
}

export default async function AgencesPage() {
  const agencies = await getAgencies();
  return <AgenciesClient initialAgencies={agencies} />;
}
