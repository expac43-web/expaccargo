"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Search, X, Loader2, Users, Package, FileText } from "lucide-react";

type Results = {
  clients: { id: string; name: string; email: string }[];
  shipments: { id: string; reference: string; status: string; origin: string; destination: string }[];
  documents: { id: string; name: string; type: string; clientId: string; ownerName: string }[];
};

const EMPTY: Results = { clients: [], shipments: [], documents: [] };

const STATUS_LABEL: Record<string, string> = {
  PENDING: "En attente", PICKED_UP: "Collecté", CUSTOMS_EXPORT: "Douane export",
  IN_TRANSIT: "En transit", CUSTOMS_IMPORT: "Douane import", OUT_DELIVERY: "En livraison",
  DELIVERED: "Livré", INCIDENT: "Incident", CANCELLED: "Annulé",
};

/**
 * Recherche globale (staff). `clientBase`/`documentsBase` adaptent les liens au rôle.
 * Déclencheur = icône loupe ; ouvre une modale type palette de commandes.
 */
export default function GlobalSearch({
  clientBase, tone = "light",
}: {
  clientBase: string;       // ex. /dashboard/gerant/clients (les docs pointent vers la fiche du client)
  tone?: "light" | "dark";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [res, setRes] = useState<Results>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setMounted(true), []);

  // Raccourci clavier Ctrl/Cmd+K
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setOpen(true); }
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
    else { setQ(""); setRes(EMPTY); }
  }, [open]);

  const search = useCallback(async (term: string) => {
    if (term.trim().length < 2) { setRes(EMPTY); return; }
    setLoading(true);
    try {
      const r = await fetch(`/api/search?q=${encodeURIComponent(term.trim())}`);
      if (r.ok) setRes(await r.json());
    } catch { /* silencieux */ } finally { setLoading(false); }
  }, []);

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => search(q), 250);
    return () => clearTimeout(t);
  }, [q, search]);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  const total = res.clients.length + res.shipments.length + res.documents.length;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Rechercher (Ctrl+K)"
        aria-label="Rechercher"
        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
          tone === "dark" ? "text-white/80 hover:bg-white/10" : "text-gray-500 hover:bg-gray-100"
        }`}
      >
        <Search size={18} />
      </button>

      {open && mounted && createPortal(
        <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-[10vh] bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Champ */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
              <Search size={18} className="text-gray-400 shrink-0" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Rechercher un client, une expédition, un document…"
                className="flex-1 text-sm outline-none bg-transparent"
                style={{ fontFamily: "var(--font-lato)" }}
              />
              {loading && <Loader2 size={16} className="animate-spin text-gray-300 shrink-0" />}
              <button onClick={() => setOpen(false)} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 shrink-0">
                <X size={15} />
              </button>
            </div>

            {/* Résultats */}
            <div className="max-h-[60vh] overflow-y-auto">
              {q.trim().length < 2 ? (
                <p className="px-4 py-8 text-center text-xs text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>
                  Tapez au moins 2 caractères.
                </p>
              ) : total === 0 && !loading ? (
                <p className="px-4 py-8 text-center text-xs text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>
                  Aucun résultat pour « {q} ».
                </p>
              ) : (
                <div className="py-2">
                  {res.clients.length > 0 && (
                    <Group label="Clients" icon={Users}>
                      {res.clients.map((c) => (
                        <Row key={c.id} onClick={() => go(`${clientBase}/${c.id}`)} title={c.name} sub={c.email} />
                      ))}
                    </Group>
                  )}
                  {res.shipments.length > 0 && (
                    <Group label="Expéditions" icon={Package}>
                      {res.shipments.map((s) => (
                        <Row
                          key={s.id}
                          onClick={() => go(`/tracking?ref=${encodeURIComponent(s.reference)}`)}
                          title={s.reference}
                          sub={`${s.origin} → ${s.destination} · ${STATUS_LABEL[s.status] ?? s.status}`}
                        />
                      ))}
                    </Group>
                  )}
                  {res.documents.length > 0 && (
                    <Group label="Documents" icon={FileText}>
                      {res.documents.map((d) => (
                        <Row
                          key={d.id}
                          onClick={() => go(`${clientBase}/${d.clientId}`)}
                          title={d.name}
                          sub={d.ownerName}
                        />
                      ))}
                    </Group>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

function Group({ label, icon: Icon, children }: { label: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="mb-1">
      <p className="px-4 py-1.5 text-[10px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5" style={{ fontFamily: "var(--font-montserrat)" }}>
        <Icon size={11} /> {label}
      </p>
      {children}
    </div>
  );
}

function Row({ title, sub, onClick }: { title: string; sub: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors">
      <p className="text-sm font-black truncate" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>{title}</p>
      <p className="text-xs text-gray-400 truncate" style={{ fontFamily: "var(--font-lato)" }}>{sub}</p>
    </button>
  );
}
