/**
 * Supabase REST API helpers — server-side only (uses service role key)
 */

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Encode une valeur destinée à un filtre PostgREST (ex. `col=eq.${enc(value)}`).
 * encodeURIComponent ne protège PAS ( ) ' ! * — or ces caractères permettent
 * d'injecter des opérateurs/logique PostgREST. On les encode explicitement.
 */
export function enc(value: string | number | boolean): string {
  return encodeURIComponent(String(value)).replace(
    /[()'!*]/g,
    (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase()
  );
}

const UUID_RE =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

/** Valide qu'une valeur est un UUID (tous les ids du système sont des UUID). */
export function isUuid(v: unknown): v is string {
  return typeof v === "string" && UUID_RE.test(v);
}

/** Encode une liste d'ids pour un filtre `col=in.(${encList(ids)})`. */
export function encList(values: string[]): string {
  return values.map((v) => enc(v)).join(",");
}

function baseHeaders(extra?: Record<string, string>) {
  return {
    apikey: KEY,
    Authorization: `Bearer ${KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
    ...extra,
  };
}

export async function sbGet<T>(table: string, qs = ""): Promise<T[]> {
  try {
    const r = await fetch(`${URL}/rest/v1/${table}${qs ? `?${qs}` : ""}`, {
      headers: baseHeaders(),
      cache: "no-store",
    });
    if (!r.ok) {
      console.error(`[sbGet] ${table} → HTTP ${r.status}: ${(await r.text()).slice(0, 200)}`);
      return [];
    }
    return await r.json();
  } catch (e) {
    console.error(`[sbGet] ${table} → exception:`, e);
    return [];
  }
}

export async function sbCount(table: string, filter = ""): Promise<number> {
  try {
    const qs = filter ? `${filter}&select=id` : "select=id";
    const r = await fetch(`${URL}/rest/v1/${table}?${qs}`, {
      headers: baseHeaders({ Prefer: "count=exact", Range: "0-0" }),
      cache: "no-store",
    });
    const hdr = r.headers.get("content-range");
    if (!hdr) return 0;
    const n = parseInt(hdr.split("/")[1] ?? "0", 10);
    return isNaN(n) ? 0 : n;
  } catch (e) {
    console.error(`[sbCount] ${table} → exception:`, e);
    return 0;
  }
}

export async function sbPost<T>(table: string, body: object): Promise<T | null> {
  try {
    const r = await fetch(`${URL}/rest/v1/${table}`, {
      method: "POST",
      headers: baseHeaders(),
      body: JSON.stringify(body),
    });
    if (!r.ok) {
      console.error(`[sbPost] ${table} → HTTP ${r.status}: ${(await r.text()).slice(0, 300)}`);
      return null;
    }
    const d = await r.json();
    return Array.isArray(d) ? d[0] : d;
  } catch (e) {
    console.error(`[sbPost] ${table} → exception:`, e);
    return null;
  }
}

export async function sbPatch<T>(table: string, filter: string, body: object): Promise<T | null> {
  try {
    const r = await fetch(`${URL}/rest/v1/${table}?${filter}`, {
      method: "PATCH",
      headers: baseHeaders(),
      body: JSON.stringify(body),
    });
    if (!r.ok) {
      console.error(`[sbPatch] ${table} → HTTP ${r.status}: ${(await r.text()).slice(0, 300)}`);
      return null;
    }
    const d = await r.json();
    return Array.isArray(d) ? d[0] ?? null : d;
  } catch (e) {
    console.error(`[sbPatch] ${table} → exception:`, e);
    return null;
  }
}

export async function sbDelete(table: string, filter: string): Promise<boolean> {
  try {
    const r = await fetch(`${URL}/rest/v1/${table}?${filter}`, {
      method: "DELETE",
      headers: baseHeaders({ Prefer: "" }),
    });
    return r.ok;
  } catch (e) {
    console.error(`[sbDelete] ${table} → exception:`, e);
    return false;
  }
}
