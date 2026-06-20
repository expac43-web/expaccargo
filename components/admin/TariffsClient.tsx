"use client";

import { useState, useEffect } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import Modal from "@/components/admin/Modal";
import { Calculator, Plus, Pencil, Trash2, Eye, EyeOff, AlertCircle } from "lucide-react";
import { TARIFF_SERVICES, SERVICE_LABEL, formatPrice, type Tariff } from "@/lib/tariffs";

const labelCls = "block text-xs font-black uppercase tracking-wider mb-1.5 text-gray-600";
const inputCls = "w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#1A3A6B] focus:ring-2 focus:ring-[#1A3A6B]/10 transition-all bg-white";

const emptyForm = {
  serviceType: "TRANSIT", origin: "", destination: "",
  baseFee: "", pricePerKg: "", volumetricFactor: "167", minPrice: "",
  currency: "XAF", note: "", isActive: true,
};

export default function TariffsClient() {
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<Tariff | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/tariffs").then((r) => (r.ok ? r.json() : [])).then((d) => setTariffs(Array.isArray(d) ? d : [])).finally(() => setLoading(false));
  }, []);

  function openCreate() {
    setForm(emptyForm); setEditing(null); setError(""); setModal("create");
  }
  function openEdit(t: Tariff) {
    setForm({
      serviceType: t.serviceType, origin: t.origin, destination: t.destination,
      baseFee: String(t.baseFee), pricePerKg: String(t.pricePerKg), volumetricFactor: String(t.volumetricFactor ?? 167),
      minPrice: String(t.minPrice), currency: t.currency, note: t.note ?? "", isActive: t.isActive,
    });
    setEditing(t); setError(""); setModal("edit");
  }

  async function save() {
    if (!form.origin.trim() || !form.destination.trim()) { setError("Origine et destination obligatoires."); return; }
    setSaving(true); setError("");
    try {
      const url = editing ? `/api/admin/tariffs/${editing.id}` : "/api/admin/tariffs";
      const method = editing ? "PUT" : "POST";
      const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await r.json();
      if (!r.ok) { setError(data.error ?? "Erreur"); return; }
      if (editing) setTariffs((prev) => prev.map((t) => (t.id === editing.id ? data : t)));
      else setTariffs((prev) => [data, ...prev]);
      setModal(null);
    } finally { setSaving(false); }
  }

  async function toggleActive(t: Tariff) {
    const r = await fetch(`/api/admin/tariffs/${t.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !t.isActive }) });
    if (r.ok) setTariffs((prev) => prev.map((x) => (x.id === t.id ? { ...x, isActive: !t.isActive } : x)));
  }

  async function remove() {
    if (!deleteId) return;
    setSaving(true);
    try {
      const r = await fetch(`/api/admin/tariffs/${deleteId}`, { method: "DELETE" });
      if (r.ok) setTariffs((prev) => prev.filter((t) => t.id !== deleteId));
      setDeleteId(null);
    } finally { setSaving(false); }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <AdminHeader
        title="Grille tarifaire"
        subtitle={`${tariffs.length} tarif${tariffs.length > 1 ? "s" : ""}`}
        action={
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-xs font-black uppercase tracking-wide hover:opacity-90" style={{ backgroundColor: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
            <Plus size={15} /> Nouveau tarif
          </button>
        }
      />

      <div className="flex-1 p-6">
        <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-100 mb-5">
          <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700" style={{ fontFamily: "var(--font-lato)" }}>
            Ces tarifs alimentent le <strong>calculateur public</strong>. Les estimations affichées aux clients sont marquées comme <strong>approximatives</strong>.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><span className="w-8 h-8 border-2 border-gray-200 border-t-[#1A3A6B] rounded-full animate-spin" /></div>
        ) : tariffs.length === 0 ? (
          <div className="text-center py-20">
            <Calculator size={36} className="mx-auto mb-3 text-gray-300" />
            <p className="text-gray-400 text-sm" style={{ fontFamily: "var(--font-lato)" }}>Aucun tarif. Ajoutez-en pour activer le calculateur.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {["Service", "Trajet", "Base", "/kg", "Fact. vol.", "Min.", "Statut", "Actions"].map((h) => (
                      <th key={h} className="px-3 py-3 text-left text-xs font-black uppercase tracking-wider text-gray-400" style={{ fontFamily: "var(--font-montserrat)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tariffs.map((t) => (
                    <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-3 text-xs font-black" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>{SERVICE_LABEL[t.serviceType] ?? t.serviceType}</td>
                      <td className="px-3 py-3 text-xs text-gray-600" style={{ fontFamily: "var(--font-lato)" }}>{t.origin} → {t.destination}</td>
                      <td className="px-3 py-3 text-xs text-gray-600">{formatPrice(t.baseFee, t.currency)}</td>
                      <td className="px-3 py-3 text-xs text-gray-600">{formatPrice(t.pricePerKg, t.currency)}</td>
                      <td className="px-3 py-3 text-xs text-gray-600">{t.volumetricFactor} kg/m³</td>
                      <td className="px-3 py-3 text-xs text-gray-600">{formatPrice(t.minPrice, t.currency)}</td>
                      <td className="px-3 py-3">
                        <button onClick={() => toggleActive(t)} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-black uppercase" style={{ backgroundColor: t.isActive ? "rgba(22,163,74,0.1)" : "rgba(156,163,175,0.15)", color: t.isActive ? "#16a34a" : "#9ca3af", fontFamily: "var(--font-montserrat)" }}>
                          {t.isActive ? <Eye size={10} /> : <EyeOff size={10} />}{t.isActive ? "Actif" : "Inactif"}
                        </button>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEdit(t)} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-[#1A3A6B] hover:bg-gray-100"><Pencil size={13} /></button>
                          <button onClick={() => setDeleteId(t.id)} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50"><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit modal */}
      <Modal open={modal !== null} onClose={() => setModal(null)} title={modal === "create" ? "Nouveau tarif" : "Modifier le tarif"} width="max-w-lg">
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100 mb-4">
            <AlertCircle size={14} className="text-red-500 shrink-0" />
            <p className="text-xs text-red-600" style={{ fontFamily: "var(--font-lato)" }}>{error}</p>
          </div>
        )}
        <div className="space-y-4">
          <div>
            <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>Service *</label>
            <select className={inputCls} value={form.serviceType} onChange={(e) => setForm((p) => ({ ...p, serviceType: e.target.value }))} style={{ fontFamily: "var(--font-lato)" }}>
              {TARIFF_SERVICES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>Origine *</label>
              <input className={inputCls} value={form.origin} onChange={(e) => setForm((p) => ({ ...p, origin: e.target.value }))} placeholder="Ville, Pays" style={{ fontFamily: "var(--font-lato)" }} />
            </div>
            <div>
              <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>Destination *</label>
              <input className={inputCls} value={form.destination} onChange={(e) => setForm((p) => ({ ...p, destination: e.target.value }))} placeholder="Ville, Pays" style={{ fontFamily: "var(--font-lato)" }} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>Frais de base</label>
              <input type="number" min="0" className={inputCls} value={form.baseFee} onChange={(e) => setForm((p) => ({ ...p, baseFee: e.target.value }))} placeholder="0" style={{ fontFamily: "var(--font-lato)" }} />
            </div>
            <div>
              <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>Devise</label>
              <select className={inputCls} value={form.currency} onChange={(e) => setForm((p) => ({ ...p, currency: e.target.value }))} style={{ fontFamily: "var(--font-lato)" }}>
                <option value="XAF">XAF (FCFA)</option>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
              </select>
            </div>
            <div>
              <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>Prix / kg</label>
              <input type="number" min="0" className={inputCls} value={form.pricePerKg} onChange={(e) => setForm((p) => ({ ...p, pricePerKg: e.target.value }))} placeholder="0" style={{ fontFamily: "var(--font-lato)" }} />
            </div>
            <div>
              <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>Prix minimum</label>
              <input type="number" min="0" className={inputCls} value={form.minPrice} onChange={(e) => setForm((p) => ({ ...p, minPrice: e.target.value }))} placeholder="0" style={{ fontFamily: "var(--font-lato)" }} />
            </div>
            <div>
              <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>Facteur volumétrique (kg/m³)</label>
              <input type="number" min="0" className={inputCls} value={form.volumetricFactor} onChange={(e) => setForm((p) => ({ ...p, volumetricFactor: e.target.value }))} placeholder="167" style={{ fontFamily: "var(--font-lato)" }} />
            </div>
          </div>
          <p className="text-xs text-gray-400 -mt-2" style={{ fontFamily: "var(--font-lato)" }}>
            Poids facturable = max(poids réel, volume × facteur). Repères : aérien ≈ 167 · maritime ≈ 1000 · routier ≈ 333.
          </p>
          <div>
            <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>Note (optionnel)</label>
            <input className={inputCls} value={form.note} onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))} placeholder="Ex : hors taxes douanières" style={{ fontFamily: "var(--font-lato)" }} />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))} className="w-4 h-4 accent-[#1A3A6B]" />
            <span className="text-sm text-gray-600" style={{ fontFamily: "var(--font-lato)" }}>Visible dans le calculateur public</span>
          </label>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={() => setModal(null)} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-black text-gray-500" style={{ fontFamily: "var(--font-montserrat)" }}>Annuler</button>
          <button onClick={save} disabled={saving} className="flex-1 py-3 rounded-xl text-white text-sm font-black hover:opacity-90 disabled:opacity-60" style={{ backgroundColor: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </Modal>

      {/* Delete */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Supprimer le tarif">
        <p className="text-sm text-gray-600 mb-6" style={{ fontFamily: "var(--font-lato)" }}>Ce tarif sera supprimé définitivement.</p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteId(null)} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-black text-gray-500" style={{ fontFamily: "var(--font-montserrat)" }}>Annuler</button>
          <button onClick={remove} disabled={saving} className="flex-1 py-3 rounded-xl text-white text-sm font-black bg-red-500 hover:bg-red-600 disabled:opacity-60" style={{ fontFamily: "var(--font-montserrat)" }}>
            {saving ? "Suppression..." : "Supprimer"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
