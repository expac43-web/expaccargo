"use client";

import { useState, useEffect, useCallback } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import Modal from "@/components/admin/Modal";
import Pagination from "@/components/admin/Pagination";
import {
  Package, Plus, Pencil, Trash2, Search, MapPin,
  Calendar, AlertCircle, ExternalLink, Clock,
  Flag, X, CheckCircle2, Loader2,
} from "lucide-react";

const PAGE_SIZE = 15;

// ── Types ──────────────────────────────────────────────────────────
type Shipment = {
  id: string; reference: string; trackingNumber: string | null;
  status: string; serviceType: string;
  origin: string; destination: string;
  weight: number | null; volume: number | null;
  description: string | null; eta: string | null;
  clientId: string; clientName: string; clientEmail: string;
  agencyId: string | null; createdAt: string;
};

type Milestone = {
  id: string; shipmentId: string; label: string;
  location: string | null; status: string;
  occurredAt: string; note: string | null;
};

type Client = { id: string; name: string; email: string };

// ── Constants ──────────────────────────────────────────────────────
const STATUS_META: Record<string, { label: string; color: string }> = {
  PENDING:        { label: "En attente",      color: "#6b7280" },
  PICKED_UP:      { label: "Collecté",        color: "#2563eb" },
  CUSTOMS_EXPORT: { label: "Douane export",   color: "#7c3aed" },
  IN_TRANSIT:     { label: "En transit",      color: "#0891b2" },
  CUSTOMS_IMPORT: { label: "Douane import",   color: "#7c3aed" },
  OUT_DELIVERY:   { label: "En livraison",    color: "#d97706" },
  DELIVERED:      { label: "Livré",           color: "#16a34a" },
  INCIDENT:       { label: "Incident",        color: "#dc2626" },
  CANCELLED:      { label: "Annulé",          color: "#9ca3af" },
};

const SERVICE_LABELS: Record<string, string> = {
  TRANSIT:              "Transit",
  MULTIMODAL:           "Multimodal",
  STORAGE:              "Stockage",
  MARITIME_CONSIGNMENT: "Consignation maritime",
  GROUPAGE:             "Groupage",
};

const STATUS_FILTERS = [
  { value: "ALL", label: "Tout" },
  { value: "PENDING", label: "En attente" },
  { value: "PICKED_UP", label: "Collecté" },
  { value: "IN_TRANSIT", label: "En transit" },
  { value: "OUT_DELIVERY", label: "En livraison" },
  { value: "DELIVERED", label: "Livré" },
  { value: "INCIDENT", label: "Incident" },
  { value: "CANCELLED", label: "Annulé" },
];

const STATUS_OPTIONS = Object.entries(STATUS_META).map(([v, { label }]) => ({ value: v, label }));
const SERVICE_OPTIONS = Object.entries(SERVICE_LABELS).map(([v, label]) => ({ value: v, label }));

// ── Styles ─────────────────────────────────────────────────────────
const labelCls = "block text-xs font-black uppercase tracking-wider mb-1.5 text-gray-600";
const inputCls = "w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#1A3A6B] focus:ring-2 focus:ring-[#1A3A6B]/10 transition-all bg-white";
const selectCls = inputCls;

// ── Sub-components ─────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status] ?? STATUS_META.PENDING;
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-black uppercase"
      style={{ backgroundColor: `${m.color}18`, color: m.color, fontFamily: "var(--font-montserrat)" }}
    >
      {m.label}
    </span>
  );
}

function ErrorBanner({ msg }: { msg: string }) {
  return (
    <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100 mb-4">
      <AlertCircle size={14} className="text-red-500 shrink-0" />
      <p className="text-xs text-red-600" style={{ fontFamily: "var(--font-lato)" }}>{msg}</p>
    </div>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>{label}</label>
      {children}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────
export default function ExpeditionsClient() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [page, setPage] = useState(1);

  // Modals state
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Shipment | null>(null);
  const [deleteItem, setDeleteItem] = useState<Shipment | null>(null);
  const [milestonesItem, setMilestonesItem] = useState<Shipment | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [milestonesLoading, setMilestonesLoading] = useState(false);
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);

  // Form state
  const [form, setForm] = useState({
    reference: "", trackingNumber: "", serviceType: "TRANSIT",
    status: "PENDING", origin: "", destination: "",
    weight: "", volume: "", description: "", eta: "",
    clientId: "", agencyId: "",
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  // Milestone form
  const [mForm, setMForm] = useState({
    label: "", location: "", status: "IN_TRANSIT", occurredAt: "", note: "",
  });
  const [mLoading, setMLoading] = useState(false);
  const [mError, setMError] = useState("");

  // Delete state
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // ── Data fetching ──────────────────────────────────────────────
  const loadShipments = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (statusFilter !== "ALL") qs.set("status", statusFilter);
      if (search) qs.set("search", search);
      const r = await fetch(`/api/admin/shipments?${qs}`);
      if (r.ok) setShipments(await r.json());
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    loadShipments();
  }, [loadShipments]);

  useEffect(() => { setPage(1); }, [statusFilter, search]);
  const paged = shipments.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    fetch("/api/admin/clients")
      .then((r) => r.json())
      .then((data) => setClients(Array.isArray(data) ? data : []));
  }, []);

  // ── Form helpers ──────────────────────────────────────────────
  function openCreate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const rand = Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5).padEnd(5, "X");
    setForm({
      reference: `EXP-${year}${month}-${rand}`,
      trackingNumber: "", serviceType: "TRANSIT", status: "PENDING",
      origin: "", destination: "", weight: "", volume: "",
      description: "", eta: "", clientId: "", agencyId: "",
    });
    setFormError("");
    setEditItem(null);
    setShowForm(true);
  }

  function openEdit(s: Shipment) {
    setForm({
      reference: s.reference,
      trackingNumber: s.trackingNumber ?? "",
      serviceType: s.serviceType,
      status: s.status,
      origin: s.origin,
      destination: s.destination,
      weight: s.weight != null ? String(s.weight) : "",
      volume: s.volume != null ? String(s.volume) : "",
      description: s.description ?? "",
      eta: s.eta ? s.eta.slice(0, 10) : "",
      clientId: s.clientId,
      agencyId: s.agencyId ?? "",
    });
    setFormError("");
    setEditItem(s);
    setShowForm(true);
  }

  async function saveForm(e: React.FormEvent) {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");
    try {
      const payload = {
        ...form,
        weight: form.weight ? Number(form.weight) : null,
        volume: form.volume ? Number(form.volume) : null,
        trackingNumber: form.trackingNumber || null,
        description: form.description || null,
        eta: form.eta || null,
        agencyId: form.agencyId || null,
      };

      const url = editItem ? `/api/admin/shipments/${editItem.id}` : "/api/admin/shipments";
      const method = editItem ? "PATCH" : "POST";

      const r = await fetch(url, {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!r.ok) {
        const d = await r.json();
        setFormError(d.error ?? "Erreur");
        return;
      }
      setShowForm(false);
      await loadShipments();
    } finally {
      setFormLoading(false);
    }
  }

  // ── Delete ────────────────────────────────────────────────────
  async function confirmDelete() {
    if (!deleteItem) return;
    setDeleting(true);
    setDeleteError("");
    try {
      const r = await fetch(`/api/admin/shipments/${deleteItem.id}`, { method: "DELETE" });
      if (!r.ok) {
        const d = await r.json();
        setDeleteError(d.error ?? "Erreur");
        return;
      }
      setDeleteItem(null);
      await loadShipments();
    } finally {
      setDeleting(false);
    }
  }

  // ── Milestones ─────────────────────────────────────────────────
  async function openMilestones(s: Shipment) {
    setMilestonesItem(s);
    setMilestonesLoading(true);
    setShowMilestoneForm(false);
    setMilestones([]);
    setMError("");
    const r = await fetch(`/api/admin/shipments/${s.id}/milestones`);
    if (r.ok) setMilestones(await r.json());
    setMilestonesLoading(false);
  }

  async function addMilestone(e: React.FormEvent) {
    e.preventDefault();
    if (!milestonesItem) return;
    setMLoading(true);
    setMError("");
    try {
      const r = await fetch(`/api/admin/shipments/${milestonesItem.id}/milestones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: mForm.label,
          location: mForm.location || null,
          status: mForm.status,
          occurredAt: mForm.occurredAt || new Date().toISOString(),
          note: mForm.note || null,
        }),
      });
      if (!r.ok) {
        const d = await r.json();
        setMError(d.error ?? "Erreur");
        return;
      }
      setShowMilestoneForm(false);
      setMForm({ label: "", location: "", status: "IN_TRANSIT", occurredAt: "", note: "" });
      // Reload milestones
      const r2 = await fetch(`/api/admin/shipments/${milestonesItem.id}/milestones`);
      if (r2.ok) setMilestones(await r2.json());
    } finally {
      setMLoading(false);
    }
  }

  async function deleteMilestone(milestoneId: string) {
    if (!milestonesItem) return;
    const r = await fetch(
      `/api/admin/shipments/${milestonesItem.id}/milestones?milestoneId=${milestoneId}`,
      { method: "DELETE" }
    );
    if (r.ok) {
      setMilestones((prev) => prev.filter((m) => m.id !== milestoneId));
    }
  }

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <AdminHeader
        title="Expéditions"
        subtitle="Gestion des envois et tracking"
        action={
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-black uppercase transition-opacity hover:opacity-80"
            style={{ backgroundColor: "#E8520A", fontFamily: "var(--font-montserrat)" }}
          >
            <Plus size={15} />
            Nouvelle expédition
          </button>
        }
      />

      {/* Filters bar */}
      <div className="px-6 pt-4 pb-2">
        {/* Status tabs */}
        <div className="flex flex-wrap gap-2 mb-3">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className="px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all"
              style={{
                fontFamily: "var(--font-montserrat)",
                backgroundColor: statusFilter === f.value ? "#1A3A6B" : "rgba(26,58,107,0.06)",
                color: statusFilter === f.value ? "#fff" : "#1A3A6B",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
        {/* Search */}
        <div className="relative max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Référence, ville, client..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#1A3A6B] focus:ring-2 focus:ring-[#1A3A6B]/10 bg-white"
            style={{ fontFamily: "var(--font-lato)" }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 pt-3 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 size={28} className="animate-spin" style={{ color: "#1A3A6B" }} />
          </div>
        ) : shipments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: "rgba(26,58,107,0.06)" }}>
              <Package size={28} style={{ color: "#1A3A6B" }} />
            </div>
            <p className="font-black uppercase text-sm mb-1" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
              Aucune expédition trouvée
            </p>
            <p className="text-xs text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>
              {search || statusFilter !== "ALL" ? "Modifiez les filtres pour voir plus de résultats." : "Créez votre première expédition."}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {["Référence", "Client", "Origine → Destination", "Service", "Statut", "ETA", "Actions"].map((h) => (
                      <th
                        key={h}
                        className="px-5 py-3 text-left text-xs font-black uppercase tracking-wider text-gray-400"
                        style={{ fontFamily: "var(--font-montserrat)" }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paged.map((s) => (
                    <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      {/* Reference */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-xs" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
                            {s.reference}
                          </span>
                          <a
                            href={`/tracking?ref=${s.reference}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Voir tracking public"
                            className="text-gray-300 hover:text-[#E8520A] transition-colors"
                          >
                            <ExternalLink size={12} />
                          </a>
                        </div>
                        {s.trackingNumber && (
                          <p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: "var(--font-lato)" }}>
                            {s.trackingNumber}
                          </p>
                        )}
                      </td>
                      {/* Client */}
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-semibold text-gray-800" style={{ fontFamily: "var(--font-lato)" }}>
                          {s.clientName}
                        </p>
                        <p className="text-xs text-gray-400">{s.clientEmail}</p>
                      </td>
                      {/* Route */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5 text-gray-600" style={{ fontFamily: "var(--font-lato)" }}>
                          <MapPin size={11} className="shrink-0 text-gray-400" />
                          <span className="text-xs">{s.origin}</span>
                          <span className="text-gray-300">→</span>
                          <span className="text-xs">{s.destination}</span>
                        </div>
                      </td>
                      {/* Service */}
                      <td className="px-5 py-3.5 text-xs text-gray-500" style={{ fontFamily: "var(--font-lato)" }}>
                        {SERVICE_LABELS[s.serviceType] ?? s.serviceType}
                      </td>
                      {/* Status */}
                      <td className="px-5 py-3.5">
                        <StatusBadge status={s.status} />
                      </td>
                      {/* ETA */}
                      <td className="px-5 py-3.5 text-xs text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>
                        {s.eta ? (
                          <span className="flex items-center gap-1">
                            <Calendar size={11} />
                            {new Date(s.eta).toLocaleDateString("fr-FR")}
                          </span>
                        ) : "—"}
                      </td>
                      {/* Actions */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openMilestones(s)}
                            title="Jalons"
                            className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-80 transition-opacity"
                            style={{ backgroundColor: "rgba(8,145,178,0.08)" }}
                          >
                            <Flag size={13} style={{ color: "#0891b2" }} />
                          </button>
                          <button
                            onClick={() => openEdit(s)}
                            title="Modifier"
                            className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-80 transition-opacity"
                            style={{ backgroundColor: "rgba(26,58,107,0.08)" }}
                          >
                            <Pencil size={13} style={{ color: "#1A3A6B" }} />
                          </button>
                          <button
                            onClick={() => { setDeleteItem(s); setDeleteError(""); }}
                            title="Supprimer"
                            className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-80 transition-opacity"
                            style={{ backgroundColor: "rgba(220,38,38,0.08)" }}
                          >
                            <Trash2 size={13} style={{ color: "#dc2626" }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 border-t border-gray-50">
              <p className="text-xs text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>
                {shipments.length} expédition{shipments.length !== 1 ? "s" : ""} affichée{shipments.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        )}

        {!loading && <Pagination page={page} total={shipments.length} pageSize={PAGE_SIZE} onChange={setPage} />}
      </div>

      {/* ── Create / Edit Modal ────────────────────────────────────── */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editItem ? "Modifier l'expédition" : "Nouvelle expédition"}
      >
        <form onSubmit={saveForm} className="space-y-4">
          {formError && <ErrorBanner msg={formError} />}

          <div className="grid grid-cols-2 gap-3">
            <FieldRow label="Référence *">
              <input
                className={inputCls}
                value={form.reference}
                onChange={(e) => setForm({ ...form, reference: e.target.value })}
                placeholder="EXP-202506-XXXXX"
                required
              />
            </FieldRow>
            <FieldRow label="N° tracking">
              <input
                className={inputCls}
                value={form.trackingNumber}
                onChange={(e) => setForm({ ...form, trackingNumber: e.target.value })}
                placeholder="Optionnel"
              />
            </FieldRow>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FieldRow label="Service *">
              <select
                className={selectCls}
                value={form.serviceType}
                onChange={(e) => setForm({ ...form, serviceType: e.target.value })}
                required
              >
                {SERVICE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </FieldRow>
            <FieldRow label="Statut *">
              <select
                className={selectCls}
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                required
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </FieldRow>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FieldRow label="Origine *">
              <input
                className={inputCls}
                value={form.origin}
                onChange={(e) => setForm({ ...form, origin: e.target.value })}
                placeholder="Ex: Paris, France"
                required
              />
            </FieldRow>
            <FieldRow label="Destination *">
              <input
                className={inputCls}
                value={form.destination}
                onChange={(e) => setForm({ ...form, destination: e.target.value })}
                placeholder="Ex: Abidjan, CI"
                required
              />
            </FieldRow>
          </div>

          <FieldRow label="Client *">
            <select
              className={selectCls}
              value={form.clientId}
              onChange={(e) => setForm({ ...form, clientId: e.target.value })}
              required
            >
              <option value="">-- Sélectionner un client --</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.email})
                </option>
              ))}
            </select>
          </FieldRow>

          <div className="grid grid-cols-3 gap-3">
            <FieldRow label="Poids (kg)">
              <input
                type="number"
                step="0.01"
                min="0"
                className={inputCls}
                value={form.weight}
                onChange={(e) => setForm({ ...form, weight: e.target.value })}
                placeholder="0.00"
              />
            </FieldRow>
            <FieldRow label="Volume (m³)">
              <input
                type="number"
                step="0.001"
                min="0"
                className={inputCls}
                value={form.volume}
                onChange={(e) => setForm({ ...form, volume: e.target.value })}
                placeholder="0.000"
              />
            </FieldRow>
            <FieldRow label="ETA (livraison)">
              <input
                type="date"
                className={inputCls}
                value={form.eta}
                onChange={(e) => setForm({ ...form, eta: e.target.value })}
              />
            </FieldRow>
          </div>

          <FieldRow label="Description">
            <textarea
              className={`${inputCls} resize-none`}
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Contenu, instructions spéciales..."
            />
          </FieldRow>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-black uppercase text-gray-600 hover:bg-gray-50 transition-colors"
              style={{ fontFamily: "var(--font-montserrat)" }}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-black uppercase transition-opacity hover:opacity-80 disabled:opacity-50"
              style={{ backgroundColor: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}
            >
              {formLoading && <Loader2 size={14} className="animate-spin" />}
              {editItem ? "Enregistrer" : "Créer"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Delete Confirmation ────────────────────────────────────── */}
      <Modal open={!!deleteItem} onClose={() => setDeleteItem(null)} title="Supprimer l'expédition">
        {deleteError && <ErrorBanner msg={deleteError} />}
        <p className="text-sm text-gray-600 mb-6" style={{ fontFamily: "var(--font-lato)" }}>
          Supprimer l&apos;expédition{" "}
          <strong style={{ color: "#1A3A6B" }}>{deleteItem?.reference}</strong>{" "}
          et tous ses jalons ? Cette action est irréversible.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setDeleteItem(null)}
            className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-black uppercase text-gray-600 hover:bg-gray-50 transition-colors"
            style={{ fontFamily: "var(--font-montserrat)" }}
          >
            Annuler
          </button>
          <button
            onClick={confirmDelete}
            disabled={deleting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-black uppercase bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50"
            style={{ fontFamily: "var(--font-montserrat)" }}
          >
            {deleting && <Loader2 size={14} className="animate-spin" />}
            Supprimer
          </button>
        </div>
      </Modal>

      {/* ── Milestones Drawer ──────────────────────────────────────── */}
      {milestonesItem && (
        <div className="fixed inset-0 z-50 flex">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMilestonesItem(null)}
          />
          {/* Drawer */}
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div>
                <p className="text-xs font-black uppercase tracking-widest" style={{ color: "#E8520A", fontFamily: "var(--font-montserrat)" }}>
                  Jalons & tracking
                </p>
                <h2 className="font-black text-lg" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
                  {milestonesItem.reference}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: "var(--font-lato)" }}>
                  {milestonesItem.origin} → {milestonesItem.destination}
                </p>
              </div>
              <button onClick={() => setMilestonesItem(null)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors">
                <X size={16} className="text-gray-400" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Current status */}
              <div className="flex items-center justify-between mb-5 p-4 rounded-xl" style={{ backgroundColor: "rgba(26,58,107,0.04)" }}>
                <span className="text-xs font-black uppercase text-gray-500" style={{ fontFamily: "var(--font-montserrat)" }}>Statut actuel</span>
                <StatusBadge status={milestonesItem.status} />
              </div>

              {/* Add milestone button */}
              <button
                onClick={() => {
                  setShowMilestoneForm(true);
                  setMForm({ label: "", location: "", status: milestonesItem.status, occurredAt: "", note: "" });
                  setMError("");
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-gray-200 text-sm font-black uppercase text-gray-400 hover:border-[#1A3A6B] hover:text-[#1A3A6B] transition-colors mb-5"
                style={{ fontFamily: "var(--font-montserrat)" }}
              >
                <Plus size={14} />
                Ajouter un jalon
              </button>

              {/* Add milestone form */}
              {showMilestoneForm && (
                <form onSubmit={addMilestone} className="mb-5 p-4 rounded-2xl border border-gray-100 bg-gray-50 space-y-3">
                  {mError && <ErrorBanner msg={mError} />}
                  <FieldRow label="Description *">
                    <input
                      className={inputCls}
                      value={mForm.label}
                      onChange={(e) => setMForm({ ...mForm, label: e.target.value })}
                      placeholder="Ex: Arrivée en douane"
                      required
                    />
                  </FieldRow>
                  <div className="grid grid-cols-2 gap-2">
                    <FieldRow label="Lieu">
                      <input
                        className={inputCls}
                        value={mForm.location}
                        onChange={(e) => setMForm({ ...mForm, location: e.target.value })}
                        placeholder="Ville / pays"
                      />
                    </FieldRow>
                    <FieldRow label="Statut associé">
                      <select
                        className={selectCls}
                        value={mForm.status}
                        onChange={(e) => setMForm({ ...mForm, status: e.target.value })}
                      >
                        {STATUS_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </FieldRow>
                  </div>
                  <FieldRow label="Date/heure">
                    <input
                      type="datetime-local"
                      className={inputCls}
                      value={mForm.occurredAt}
                      onChange={(e) => setMForm({ ...mForm, occurredAt: e.target.value })}
                    />
                  </FieldRow>
                  <FieldRow label="Note">
                    <input
                      className={inputCls}
                      value={mForm.note}
                      onChange={(e) => setMForm({ ...mForm, note: e.target.value })}
                      placeholder="Information complémentaire"
                    />
                  </FieldRow>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowMilestoneForm(false)}
                      className="flex-1 py-2 rounded-xl border border-gray-200 text-xs font-black uppercase text-gray-500 hover:bg-gray-100 transition-colors"
                      style={{ fontFamily: "var(--font-montserrat)" }}
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={mLoading}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-white text-xs font-black uppercase transition-opacity hover:opacity-80 disabled:opacity-50"
                      style={{ backgroundColor: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}
                    >
                      {mLoading && <Loader2 size={12} className="animate-spin" />}
                      Ajouter
                    </button>
                  </div>
                </form>
              )}

              {/* Milestones list */}
              {milestonesLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 size={22} className="animate-spin" style={{ color: "#1A3A6B" }} />
                </div>
              ) : milestones.length === 0 ? (
                <div className="text-center py-10">
                  <Clock size={28} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-xs text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>
                    Aucun jalon enregistré.
                  </p>
                </div>
              ) : (
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gray-100" />
                  <div className="space-y-4">
                    {milestones.map((m, i) => {
                      const sm = STATUS_META[m.status] ?? STATUS_META.PENDING;
                      return (
                        <div key={m.id} className="flex gap-4 relative">
                          {/* Dot */}
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 border-2 border-white shadow-sm"
                            style={{ backgroundColor: i === 0 ? sm.color : `${sm.color}25` }}
                          >
                            <CheckCircle2 size={12} style={{ color: i === 0 ? "#fff" : sm.color }} />
                          </div>
                          {/* Content */}
                          <div className="flex-1 min-w-0 pb-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="font-black text-sm" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
                                  {m.label}
                                </p>
                                {m.location && (
                                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                    <MapPin size={10} />
                                    {m.location}
                                  </p>
                                )}
                                {m.note && (
                                  <p className="text-xs text-gray-500 mt-1 italic" style={{ fontFamily: "var(--font-lato)" }}>
                                    {m.note}
                                  </p>
                                )}
                                <p className="text-xs text-gray-400 mt-1">
                                  {new Date(m.occurredAt).toLocaleString("fr-FR")}
                                </p>
                              </div>
                              <button
                                onClick={() => deleteMilestone(m.id)}
                                className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors shrink-0"
                                title="Supprimer ce jalon"
                              >
                                <X size={11} className="text-gray-300 hover:text-red-400" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
              <a
                href={`/tracking?ref=${milestonesItem.reference}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-gray-200 text-xs font-black uppercase text-gray-600 hover:bg-white hover:text-[#1A3A6B] hover:border-[#1A3A6B] transition-all"
                style={{ fontFamily: "var(--font-montserrat)" }}
              >
                <ExternalLink size={13} />
                Voir page tracking publique
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
