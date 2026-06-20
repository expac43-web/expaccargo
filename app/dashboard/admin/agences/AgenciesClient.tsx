"use client";

import { useState, useCallback } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import Modal from "@/components/admin/Modal";
import {
  Building2, Plus, Pencil, Trash2, Users, Phone,
  Mail, MapPin, AlertCircle, CheckCircle2, RefreshCw, Eye, EyeOff, KeyRound, Copy, Check
} from "lucide-react";

type Agency = {
  id: string; name: string; city: string; country: string;
  phone: string | null; email: string | null; createdAt: string; userCount: number;
};

type StaffUser = {
  id: string; name: string; email: string; role: string;
  phone: string | null; isActive: boolean; createdAt: string;
};

const ROLE_OPTIONS = [
  { value: "MANAGER", label: "Gérant" },
  { value: "AGENCY", label: "Agent d'agence" },
];

const ROLE_LABELS: Record<string, string> = { MANAGER: "Gérant", AGENCY: "Agent", SUPER_ADMIN: "Super admin" };
const ROLE_COLORS: Record<string, string> = { MANAGER: "#1A3A6B", AGENCY: "#0891b2", SUPER_ADMIN: "#7c3aed" };

// ── Shared form styles ────────────────────────────────────────────
const labelCls = "block text-xs font-black uppercase tracking-wider mb-1.5 text-gray-600";
const inputCls = "w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#1A3A6B] focus:ring-2 focus:ring-[#1A3A6B]/10 transition-all bg-white";

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>{label}</label>
      {children}
    </div>
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

export default function AgenciesClient({ initialAgencies }: { initialAgencies: Agency[] }) {
  const [agencies, setAgencies] = useState(initialAgencies);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ── Agency modal ─────────────────────────────────────────────────
  const [agencyModal, setAgencyModal] = useState<"create" | "edit" | null>(null);
  const [editingAgency, setEditingAgency] = useState<Agency | null>(null);
  const [agencyForm, setAgencyForm] = useState({ name: "", city: "", country: "", phone: "", email: "" });

  function openCreateAgency() {
    setAgencyForm({ name: "", city: "", country: "", phone: "", email: "" });
    setEditingAgency(null);
    setError("");
    setAgencyModal("create");
  }

  function openEditAgency(a: Agency) {
    setAgencyForm({ name: a.name, city: a.city, country: a.country, phone: a.phone ?? "", email: a.email ?? "" });
    setEditingAgency(a);
    setError("");
    setAgencyModal("edit");
  }

  async function saveAgency() {
    setLoading(true); setError("");
    try {
      const url = editingAgency ? `/api/admin/agencies/${editingAgency.id}` : "/api/admin/agencies";
      const method = editingAgency ? "PUT" : "POST";
      const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(agencyForm) });
      const data = await r.json();
      if (!r.ok) { setError(data.error ?? "Erreur"); return; }

      if (editingAgency) {
        setAgencies(prev => prev.map(a => a.id === editingAgency.id ? { ...a, ...data, userCount: a.userCount } : a));
      } else {
        setAgencies(prev => [...prev, { ...data, userCount: 0 }]);
      }
      setAgencyModal(null);
    } finally { setLoading(false); }
  }

  // ── Delete agency ─────────────────────────────────────────────────
  const [deleteAgencyId, setDeleteAgencyId] = useState<string | null>(null);

  async function deleteAgency() {
    if (!deleteAgencyId) return;
    setLoading(true);
    try {
      const r = await fetch(`/api/admin/agencies/${deleteAgencyId}`, { method: "DELETE" });
      if (r.ok) setAgencies(prev => prev.filter(a => a.id !== deleteAgencyId));
      setDeleteAgencyId(null);
    } finally { setLoading(false); }
  }

  // ── Users panel ───────────────────────────────────────────────────
  const [usersPanel, setUsersPanel] = useState<Agency | null>(null);
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userModal, setUserModal] = useState<"create" | "edit" | null>(null);
  const [editingUser, setEditingUser] = useState<StaffUser | null>(null);
  const [userForm, setUserForm] = useState({ name: "", email: "", password: "", userRole: "AGENCY", phone: "", whatsapp: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [userError, setUserError] = useState("");

  // Reset password modal
  const [resetUser, setResetUser] = useState<StaffUser | null>(null);
  const [newPwd, setNewPwd] = useState("");
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);

  // Credentials modal (shown when email isn't configured)
  const [createdCredentials, setCreatedCredentials] = useState<{
    name: string; email: string; password: string; emailSent: boolean;
  } | null>(null);
  const [copied, setCopied] = useState<"email" | "password" | null>(null);

  const fetchUsers = useCallback(async (agency: Agency) => {
    setLoadingUsers(true);
    const r = await fetch(`/api/admin/users?agencyId=${agency.id}`);
    if (r.ok) setStaffUsers(await r.json());
    setLoadingUsers(false);
  }, []);

  function openUsersPanel(a: Agency) {
    setUsersPanel(a);
    fetchUsers(a);
  }

  function openCreateUser() {
    setUserForm({ name: "", email: "", password: "", userRole: "AGENCY", phone: "", whatsapp: "" });
    setEditingUser(null); setUserError("");
    setUserModal("create");
  }

  function openEditUser(u: StaffUser) {
    setUserForm({ name: u.name, email: u.email, password: "", userRole: u.role, phone: u.phone ?? "", whatsapp: "" });
    setEditingUser(u); setUserError("");
    setUserModal("edit");
  }

  async function saveUser() {
    if (!usersPanel) return;
    setLoading(true); setUserError("");
    try {
      let url: string;
      let method: string;
      let body: Record<string, unknown>;

      if (editingUser) {
        url = `/api/admin/users/${editingUser.id}`;
        method = "PUT";
        body = { name: userForm.name, email: userForm.email, userRole: userForm.userRole, phone: userForm.phone, agencyId: usersPanel.id };
      } else if (userForm.userRole === "AGENCY") {
        // New AGENCY user — uses the dedicated endpoint that sends welcome email
        url = "/api/admin/agences/users";
        method = "POST";
        body = { name: userForm.name, email: userForm.email, password: userForm.password, phone: userForm.phone, agencyId: usersPanel.id };
      } else {
        // MANAGER or other roles — standard endpoint
        url = "/api/admin/users";
        method = "POST";
        body = { ...userForm, agencyId: usersPanel.id };
      }

      const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await r.json();
      if (!r.ok) { setUserError(data.error ?? "Erreur"); return; }

      if (editingUser) {
        setStaffUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...data } : u));
      } else {
        // data.user is the created user; top-level data if old endpoint
        const newUser: StaffUser = data.user ?? data;
        setStaffUsers(prev => [...prev, newUser]);
        setAgencies(prev => prev.map(a => a.id === usersPanel.id ? { ...a, userCount: a.userCount + 1 } : a));

        // Show credentials modal (with or without email confirmation)
        if (userForm.userRole === "AGENCY") {
          setCreatedCredentials({
            name: userForm.name,
            email: userForm.email,
            password: userForm.password,
            emailSent: data.emailSent ?? false,
          });
        }
      }
      setUserModal(null);
    } finally { setLoading(false); }
  }

  function copyToClipboard(text: string, field: "email" | "password") {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(field);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  async function resetPassword() {
    if (!resetUser) return;
    setLoading(true);
    try {
      const r = await fetch(`/api/admin/users/${resetUser.id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: newPwd }),
      });
      if (r.ok) { setResetUser(null); setNewPwd(""); }
    } finally { setLoading(false); }
  }

  async function deleteUser() {
    if (!deleteUserId || !usersPanel) return;
    setLoading(true);
    try {
      const r = await fetch(`/api/admin/users/${deleteUserId}`, { method: "DELETE" });
      if (r.ok) {
        setStaffUsers(prev => prev.filter(u => u.id !== deleteUserId));
        setAgencies(prev => prev.map(a => a.id === usersPanel.id ? { ...a, userCount: Math.max(0, a.userCount - 1) } : a));
      }
      setDeleteUserId(null);
    } finally { setLoading(false); }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <AdminHeader
        title="Agences & Gérants"
        subtitle={`${agencies.length} agence${agencies.length > 1 ? "s" : ""}`}
        action={
          <button
            onClick={openCreateAgency}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-xs font-black uppercase tracking-wide hover:opacity-90 transition-all"
            style={{ backgroundColor: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}
          >
            <Plus size={15} /> Nouvelle agence
          </button>
        }
      />

      <div className="flex-1 p-6">
        {agencies.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "rgba(26,58,107,0.06)" }}>
              <Building2 size={32} style={{ color: "#1A3A6B" }} />
            </div>
            <p className="text-gray-400 text-sm" style={{ fontFamily: "var(--font-lato)" }}>Aucune agence enregistrée.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {agencies.map((a) => (
              <div key={a.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-2 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "rgba(26,58,107,0.08)" }}>
                      <Building2 size={18} style={{ color: "#1A3A6B" }} />
                    </div>
                    <div>
                      <p className="font-black text-sm" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>{a.name}</p>
                      <p className="text-xs text-gray-400 flex items-center gap-1" style={{ fontFamily: "var(--font-lato)" }}>
                        <MapPin size={11} /> {a.city}, {a.country}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-black px-2 py-1 rounded-lg" style={{ backgroundColor: "rgba(26,58,107,0.08)", color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
                    {a.userCount} utilisateur{a.userCount > 1 ? "s" : ""}
                  </span>
                </div>

                <div className="space-y-1.5 mb-5">
                  {a.phone && <p className="text-xs text-gray-500 flex items-center gap-2" style={{ fontFamily: "var(--font-lato)" }}><Phone size={11} />{a.phone}</p>}
                  {a.email && <p className="text-xs text-gray-500 flex items-center gap-2" style={{ fontFamily: "var(--font-lato)" }}><Mail size={11} />{a.email}</p>}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => openUsersPanel(a)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all"
                    style={{ backgroundColor: "rgba(232,82,10,0.08)", color: "#E8520A", fontFamily: "var(--font-montserrat)" }}
                  >
                    <Users size={13} /> Utilisateurs
                  </button>
                  <button
                    onClick={() => openEditAgency(a)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black text-gray-500 hover:bg-gray-100 transition-all"
                    style={{ fontFamily: "var(--font-montserrat)" }}
                  >
                    <Pencil size={13} /> Modifier
                  </button>
                  <button
                    onClick={() => setDeleteAgencyId(a.id)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black text-red-400 hover:bg-red-50 transition-all"
                    style={{ fontFamily: "var(--font-montserrat)" }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Create/Edit Agency Modal ─────────────────────────────── */}
      <Modal
        open={agencyModal !== null}
        onClose={() => setAgencyModal(null)}
        title={agencyModal === "create" ? "Nouvelle agence" : "Modifier l'agence"}
      >
        {error && <ErrorBanner msg={error} />}
        <div className="space-y-4">
          <FieldRow label="Nom de l'agence *">
            <input className={inputCls} value={agencyForm.name} onChange={e => setAgencyForm(p => ({ ...p, name: e.target.value }))} placeholder="Ex : Agence Brazzaville" style={{ fontFamily: "var(--font-lato)" }} />
          </FieldRow>
          <div className="grid grid-cols-2 gap-3">
            <FieldRow label="Ville *">
              <input className={inputCls} value={agencyForm.city} onChange={e => setAgencyForm(p => ({ ...p, city: e.target.value }))} placeholder="Brazzaville" style={{ fontFamily: "var(--font-lato)" }} />
            </FieldRow>
            <FieldRow label="Pays *">
              <input className={inputCls} value={agencyForm.country} onChange={e => setAgencyForm(p => ({ ...p, country: e.target.value }))} placeholder="Congo" style={{ fontFamily: "var(--font-lato)" }} />
            </FieldRow>
          </div>
          <FieldRow label="Téléphone">
            <input className={inputCls} value={agencyForm.phone} onChange={e => setAgencyForm(p => ({ ...p, phone: e.target.value }))} placeholder="+242 00 000 00 00" style={{ fontFamily: "var(--font-lato)" }} />
          </FieldRow>
          <FieldRow label="Email">
            <input className={inputCls} type="email" value={agencyForm.email} onChange={e => setAgencyForm(p => ({ ...p, email: e.target.value }))} placeholder="agence@exemple.com" style={{ fontFamily: "var(--font-lato)" }} />
          </FieldRow>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={() => setAgencyModal(null)} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-black text-gray-500 hover:bg-gray-50" style={{ fontFamily: "var(--font-montserrat)" }}>Annuler</button>
          <button onClick={saveAgency} disabled={loading} className="flex-1 py-3 rounded-xl text-white text-sm font-black hover:opacity-90 disabled:opacity-60" style={{ backgroundColor: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
            {loading ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </Modal>

      {/* ── Delete Agency Confirm ────────────────────────────────── */}
      <Modal open={!!deleteAgencyId} onClose={() => setDeleteAgencyId(null)} title="Supprimer l'agence">
        <p className="text-sm text-gray-600 mb-6" style={{ fontFamily: "var(--font-lato)" }}>
          Cette action est irréversible. Tous les utilisateurs liés à cette agence seront dissociés.
        </p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteAgencyId(null)} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-black text-gray-500" style={{ fontFamily: "var(--font-montserrat)" }}>Annuler</button>
          <button onClick={deleteAgency} disabled={loading} className="flex-1 py-3 rounded-xl text-white text-sm font-black bg-red-500 hover:bg-red-600 disabled:opacity-60" style={{ fontFamily: "var(--font-montserrat)" }}>
            {loading ? "Suppression..." : "Supprimer"}
          </button>
        </div>
      </Modal>

      {/* ── Users Panel Modal ─────────────────────────────────────── */}
      <Modal
        open={!!usersPanel}
        onClose={() => { setUsersPanel(null); setStaffUsers([]); }}
        title={usersPanel ? `Utilisateurs — ${usersPanel.name}` : ""}
        width="max-w-2xl"
      >
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>
            {staffUsers.length} utilisateur{staffUsers.length > 1 ? "s" : ""}
          </p>
          <button
            onClick={openCreateUser}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-white text-xs font-black hover:opacity-90"
            style={{ backgroundColor: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}
          >
            <Plus size={13} /> Ajouter
          </button>
        </div>

        {loadingUsers ? (
          <div className="flex justify-center py-8"><span className="w-6 h-6 border-2 border-gray-200 border-t-[#1A3A6B] rounded-full animate-spin" /></div>
        ) : staffUsers.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8" style={{ fontFamily: "var(--font-lato)" }}>Aucun utilisateur dans cette agence.</p>
        ) : (
          <div className="space-y-3">
            {staffUsers.map((u) => (
              <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white text-sm font-black" style={{ backgroundColor: ROLE_COLORS[u.role] ?? "#6b7280" }}>
                  {u.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black truncate" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>{u.name}</p>
                  <p className="text-xs text-gray-400 truncate" style={{ fontFamily: "var(--font-lato)" }}>{u.email}</p>
                </div>
                <span className="text-xs font-black px-2 py-1 rounded-lg shrink-0" style={{ backgroundColor: `${ROLE_COLORS[u.role] ?? "#6b7280"}15`, color: ROLE_COLORS[u.role] ?? "#6b7280", fontFamily: "var(--font-montserrat)" }}>
                  {ROLE_LABELS[u.role] ?? u.role}
                </span>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEditUser(u)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-[#1A3A6B] hover:bg-gray-100 transition-all"><Pencil size={14} /></button>
                  <button onClick={() => { setResetUser(u); setNewPwd(""); }} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-[#E8520A] hover:bg-orange-50 transition-all"><KeyRound size={14} /></button>
                  <button onClick={() => setDeleteUserId(u.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* ── Create/Edit User Modal ────────────────────────────────── */}
      <Modal
        open={userModal !== null}
        onClose={() => setUserModal(null)}
        title={userModal === "create" ? "Ajouter un utilisateur" : "Modifier l'utilisateur"}
      >
        {userError && <ErrorBanner msg={userError} />}
        <div className="space-y-4">
          <FieldRow label="Nom complet *">
            <input className={inputCls} value={userForm.name} onChange={e => setUserForm(p => ({ ...p, name: e.target.value }))} placeholder="Prénom Nom" style={{ fontFamily: "var(--font-lato)" }} />
          </FieldRow>
          <FieldRow label="Adresse email *">
            <input className={inputCls} type="email" value={userForm.email} onChange={e => setUserForm(p => ({ ...p, email: e.target.value }))} placeholder="utilisateur@exemple.com" style={{ fontFamily: "var(--font-lato)" }} />
          </FieldRow>
          {!editingUser && (
            <FieldRow label="Mot de passe *">
              <div className="relative">
                <input className={inputCls} type={showPwd ? "text" : "password"} value={userForm.password} onChange={e => setUserForm(p => ({ ...p, password: e.target.value }))} placeholder="Minimum 8 caractères" style={{ fontFamily: "var(--font-lato)" }} />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </FieldRow>
          )}
          <FieldRow label="Rôle *">
            <select className={inputCls} value={userForm.userRole} onChange={e => setUserForm(p => ({ ...p, userRole: e.target.value }))} style={{ fontFamily: "var(--font-lato)" }}>
              {ROLE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </FieldRow>
          <FieldRow label="Téléphone">
            <input className={inputCls} value={userForm.phone} onChange={e => setUserForm(p => ({ ...p, phone: e.target.value }))} placeholder="+242 00 000 00 00" style={{ fontFamily: "var(--font-lato)" }} />
          </FieldRow>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={() => setUserModal(null)} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-black text-gray-500" style={{ fontFamily: "var(--font-montserrat)" }}>Annuler</button>
          <button onClick={saveUser} disabled={loading} className="flex-1 py-3 rounded-xl text-white text-sm font-black hover:opacity-90 disabled:opacity-60" style={{ backgroundColor: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
            {loading ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </Modal>

      {/* ── Reset Password Modal ───────────────────────────────────── */}
      <Modal open={!!resetUser} onClose={() => setResetUser(null)} title="Réinitialiser le mot de passe">
        {resetUser && (
          <>
            <p className="text-sm text-gray-500 mb-4" style={{ fontFamily: "var(--font-lato)" }}>
              Nouveau mot de passe pour <strong>{resetUser.name}</strong> :
            </p>
            <FieldRow label="Nouveau mot de passe">
              <div className="relative">
                <input className={inputCls} type={showNewPwd ? "text" : "password"} value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="Minimum 8 caractères" style={{ fontFamily: "var(--font-lato)" }} />
                <button type="button" onClick={() => setShowNewPwd(!showNewPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showNewPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </FieldRow>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setResetUser(null)} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-black text-gray-500" style={{ fontFamily: "var(--font-montserrat)" }}>Annuler</button>
              <button onClick={resetPassword} disabled={loading || newPwd.length < 8} className="flex-1 py-3 rounded-xl text-white text-sm font-black hover:opacity-90 disabled:opacity-60" style={{ backgroundColor: "#E8520A", fontFamily: "var(--font-montserrat)" }}>
                <RefreshCw size={14} className="inline mr-1.5" />
                {loading ? "Réinitialisation..." : "Réinitialiser"}
              </button>
            </div>
          </>
        )}
      </Modal>

      {/* ── Delete User Confirm ───────────────────────────────────── */}
      <Modal open={!!deleteUserId} onClose={() => setDeleteUserId(null)} title="Supprimer l'utilisateur">
        <p className="text-sm text-gray-600 mb-6" style={{ fontFamily: "var(--font-lato)" }}>Confirmer la suppression de ce compte utilisateur ?</p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteUserId(null)} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-black text-gray-500" style={{ fontFamily: "var(--font-montserrat)" }}>Annuler</button>
          <button onClick={deleteUser} disabled={loading} className="flex-1 py-3 rounded-xl text-white text-sm font-black bg-red-500 hover:bg-red-600 disabled:opacity-60" style={{ fontFamily: "var(--font-montserrat)" }}>
            {loading ? "Suppression..." : "Supprimer"}
          </button>
        </div>
      </Modal>

      {/* ── Credentials Modal ─────────────────────────────────────── */}
      <Modal
        open={!!createdCredentials}
        onClose={() => setCreatedCredentials(null)}
        title="Compte créé"
      >
        {createdCredentials && (
          <>
            {/* Email sent confirmation */}
            {createdCredentials.emailSent ? (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 border border-green-100 mb-5">
                <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                <p className="text-sm text-green-700" style={{ fontFamily: "var(--font-lato)" }}>
                  Un email avec les identifiants a été envoyé à <strong>{createdCredentials.email}</strong>.
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-100 mb-5">
                <AlertCircle size={16} className="text-amber-500 shrink-0" />
                <p className="text-sm text-amber-700" style={{ fontFamily: "var(--font-lato)" }}>
                  Email non configuré. Transmettez manuellement les identifiants ci-dessous.
                </p>
              </div>
            )}

            <div className="rounded-2xl border border-gray-100 overflow-hidden mb-5">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                <p className="text-xs font-black uppercase tracking-wider text-gray-500" style={{ fontFamily: "var(--font-montserrat)" }}>
                  Identifiants de connexion — {createdCredentials.name}
                </p>
              </div>
              <div className="divide-y divide-gray-50">
                {/* Email row */}
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <Mail size={14} className="text-gray-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-gray-400 uppercase font-black tracking-wider" style={{ fontFamily: "var(--font-montserrat)" }}>Email</p>
                      <p className="text-sm font-semibold text-gray-800 truncate" style={{ fontFamily: "var(--font-lato)" }}>{createdCredentials.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(createdCredentials.email, "email")}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-[#1A3A6B] hover:bg-gray-100 transition-all shrink-0 ml-2"
                    title="Copier"
                  >
                    {copied === "email" ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                  </button>
                </div>
                {/* Password row */}
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <KeyRound size={14} className="text-gray-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-gray-400 uppercase font-black tracking-wider" style={{ fontFamily: "var(--font-montserrat)" }}>Mot de passe</p>
                      <p className="text-sm font-semibold text-gray-800 font-mono" style={{ fontFamily: "monospace" }}>{createdCredentials.password}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(createdCredentials.password, "password")}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-[#1A3A6B] hover:bg-gray-100 transition-all shrink-0 ml-2"
                    title="Copier"
                  >
                    {copied === "password" ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-400 mb-5 text-center" style={{ fontFamily: "var(--font-lato)" }}>
              L'agent doit se connecter sur <strong>la page de connexion publique</strong> avec ces identifiants.
            </p>

            <button
              onClick={() => setCreatedCredentials(null)}
              className="w-full py-3 rounded-xl text-white text-sm font-black hover:opacity-90 transition-all"
              style={{ backgroundColor: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}
            >
              Fermer
            </button>
          </>
        )}
      </Modal>
    </div>
  );
}
