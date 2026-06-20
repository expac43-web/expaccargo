"use client";

import { useState, useEffect, useMemo } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import Modal from "@/components/admin/Modal";
import { generatePassword } from "@/lib/password";
import {
  UserPlus, Users, Building2, Mail, KeyRound, Copy, Check,
  RefreshCw, Eye, EyeOff, AlertCircle, CheckCircle2, Search, Shield,
} from "lucide-react";

type Agency = { id: string; name: string; city: string; country: string };
type Staff = {
  id: string; name: string; email: string; role: string;
  phone: string | null; isActive: boolean; agencyId: string | null; createdAt: string;
};

const ROLE_OPTIONS = [
  { value: "MANAGER", label: "Gérant" },
  { value: "AGENCY", label: "Agent d'agence" },
];
const ROLE_LABELS: Record<string, string> = { MANAGER: "Gérant", AGENCY: "Agent", SUPER_ADMIN: "Super admin" };
const ROLE_COLORS: Record<string, string> = { MANAGER: "#1A3A6B", AGENCY: "#0e5f72", SUPER_ADMIN: "#7c3aed" };

const labelCls = "block text-xs font-black uppercase tracking-wider mb-1.5 text-gray-600";
const inputCls = "w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#1A3A6B] focus:ring-2 focus:ring-[#1A3A6B]/10 transition-all bg-white";

export default function ComptesPage() {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Form
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ userRole: "MANAGER", agencyId: "", name: "", email: "", phone: "", password: "" });
  const [showPwd, setShowPwd] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Résultat (identifiants créés)
  const [result, setResult] = useState<{ name: string; email: string; password: string; emailSent: boolean } | null>(null);

  // Réinitialisation de mot de passe
  const [resetUser, setResetUser] = useState<Staff | null>(null);
  const [resetPwd, setResetPwd] = useState("");
  const [resetting, setResetting] = useState(false);
  const [resetDone, setResetDone] = useState<{ name: string; password: string; emailSent: boolean } | null>(null);

  function openReset(u: Staff) {
    setResetUser(u);
    setResetPwd(generatePassword(12));
    setResetDone(null);
  }

  async function submitReset() {
    if (!resetUser || resetPwd.length < 8) return;
    setResetting(true);
    try {
      const r = await fetch(`/api/admin/users/${resetUser.id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: resetPwd }),
      });
      const data = await r.json().catch(() => ({}));
      if (r.ok) {
        setResetDone({ name: resetUser.name, password: resetPwd, emailSent: data.emailSent ?? false });
        setResetUser(null);
      }
    } finally {
      setResetting(false);
    }
  }

  async function loadData() {
    const [a, s] = await Promise.all([
      fetch("/api/admin/agencies").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/admin/users").then((r) => (r.ok ? r.json() : [])),
    ]);
    setAgencies(Array.isArray(a) ? a : []);
    setStaff(Array.isArray(s) ? s : []);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  function openForm() {
    setForm({ userRole: "MANAGER", agencyId: "", name: "", email: "", phone: "", password: generatePassword(12) });
    setError("");
    setShowPwd(true);
    setShowForm(true);
  }

  function copy(text: string, field: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    });
  }

  async function submit() {
    if (!form.name.trim() || !form.email.trim()) { setError("Nom et email obligatoires."); return; }
    if (form.userRole === "AGENCY" && !form.agencyId) { setError("Sélectionnez une agence pour un agent."); return; }
    setSubmitting(true); setError("");
    try {
      const r = await fetch("/api/admin/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name, email: form.email, userRole: form.userRole,
          agencyId: form.agencyId || null, phone: form.phone, password: form.password,
        }),
      });
      const data = await r.json();
      if (!r.ok) { setError(data.error ?? "Erreur lors de la création."); return; }
      setShowForm(false);
      setResult({
        name: form.name,
        email: data.credentials?.email ?? form.email,
        password: data.credentials?.password ?? form.password,
        emailSent: data.emailSent ?? false,
      });
      if (data.user) setStaff((prev) => [data.user, ...prev]);
    } finally {
      setSubmitting(false);
    }
  }

  const agencyName = (id: string | null) => agencies.find((a) => a.id === id)?.name ?? null;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return staff
      .filter((u) => u.role !== "SUPER_ADMIN")
      .filter((u) => !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }, [staff, search]);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <AdminHeader
        title="Comptes"
        subtitle="Gérants & agents d'agence"
        action={
          <button
            onClick={openForm}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-xs font-black uppercase tracking-wide hover:opacity-90 transition-all"
            style={{ backgroundColor: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}
          >
            <UserPlus size={15} /> Créer un compte
          </button>
        }
      />

      <div className="flex-1 p-6">
        {/* Recherche */}
        <div className="relative max-w-sm mb-6">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un compte…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#1A3A6B] focus:ring-2 focus:ring-[#1A3A6B]/10 bg-white"
            style={{ fontFamily: "var(--font-lato)" }}
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><span className="w-8 h-8 border-2 border-gray-200 border-t-[#1A3A6B] rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Users size={36} className="mx-auto mb-3 text-gray-300" />
            <p className="text-gray-400 text-sm mb-4" style={{ fontFamily: "var(--font-lato)" }}>Aucun compte gérant ou agence pour le moment.</p>
            <button onClick={openForm} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-xs font-black uppercase hover:opacity-90" style={{ backgroundColor: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
              <UserPlus size={14} /> Créer un compte
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((u) => (
              <div key={u.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-sm font-black shrink-0" style={{ backgroundColor: ROLE_COLORS[u.role] ?? "#6b7280" }}>
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-sm truncate" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>{u.name}</p>
                    <p className="text-xs text-gray-400 truncate flex items-center gap-1" style={{ fontFamily: "var(--font-lato)" }}><Mail size={11} />{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-black px-2 py-1 rounded-lg" style={{ backgroundColor: `${ROLE_COLORS[u.role] ?? "#6b7280"}15`, color: ROLE_COLORS[u.role] ?? "#6b7280", fontFamily: "var(--font-montserrat)" }}>
                    {ROLE_LABELS[u.role] ?? u.role}
                  </span>
                  {u.agencyId && (
                    <span className="text-xs text-gray-500 flex items-center gap-1" style={{ fontFamily: "var(--font-lato)" }}>
                      <Building2 size={11} />{agencyName(u.agencyId) ?? "—"}
                    </span>
                  )}
                  <span className={`text-xs font-black px-2 py-0.5 rounded-full ${u.isActive ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-400"}`} style={{ fontFamily: "var(--font-montserrat)" }}>
                    {u.isActive ? "Actif" : "Inactif"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 mt-3">
                  <p className="text-xs text-gray-300" style={{ fontFamily: "var(--font-lato)" }}>
                    Créé le {new Date(u.createdAt).toLocaleDateString("fr-FR")}
                  </p>
                  <button
                    onClick={() => openReset(u)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-black text-gray-500 hover:text-[#E8520A] hover:bg-orange-50 transition-all"
                    style={{ fontFamily: "var(--font-montserrat)" }}
                    title="Réinitialiser le mot de passe"
                  >
                    <KeyRound size={13} /> Réinitialiser
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="mt-6 text-xs text-gray-400 flex items-center gap-2" style={{ fontFamily: "var(--font-lato)" }}>
          <Shield size={12} />
          La gestion fine (modifier / réinitialiser le mot de passe / supprimer) reste disponible dans <strong>Agences &amp; Gérants</strong>, par agence.
        </p>
      </div>

      {/* ── Modal création ─────────────────────────────────────────── */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Créer un compte">
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100 mb-4">
            <AlertCircle size={14} className="text-red-500 shrink-0" />
            <p className="text-xs text-red-600" style={{ fontFamily: "var(--font-lato)" }}>{error}</p>
          </div>
        )}
        <div className="space-y-4">
          <div>
            <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>Type de compte *</label>
            <select className={inputCls} value={form.userRole} onChange={(e) => setForm((f) => ({ ...f, userRole: e.target.value }))} style={{ fontFamily: "var(--font-lato)" }}>
              {ROLE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div>
            <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>
              Agence {form.userRole === "AGENCY" ? "*" : "(optionnel pour un gérant)"}
            </label>
            <select className={inputCls} value={form.agencyId} onChange={(e) => setForm((f) => ({ ...f, agencyId: e.target.value }))} style={{ fontFamily: "var(--font-lato)" }}>
              <option value="">— Aucune agence —</option>
              {agencies.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.city})</option>)}
            </select>
          </div>

          <div>
            <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>Nom complet *</label>
            <input className={inputCls} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Prénom Nom" style={{ fontFamily: "var(--font-lato)" }} />
          </div>

          <div>
            <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>Adresse email *</label>
            <input className={inputCls} type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="utilisateur@exemple.com" style={{ fontFamily: "var(--font-lato)" }} />
          </div>

          <div>
            <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>Téléphone</label>
            <input className={inputCls} value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+242 00 000 00 00" style={{ fontFamily: "var(--font-lato)" }} />
          </div>

          <div>
            <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>Mot de passe (généré automatiquement)</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  className={`${inputCls} pr-10 font-mono`}
                  type={showPwd ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  style={{ fontFamily: "monospace" }}
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <button type="button" onClick={() => copy(form.password, "form-pwd")} title="Copier" className="w-11 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50">
                {copiedField === "form-pwd" ? <Check size={15} className="text-green-500" /> : <Copy size={15} />}
              </button>
              <button type="button" onClick={() => setForm((f) => ({ ...f, password: generatePassword(12) }))} title="Régénérer" className="w-11 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50">
                <RefreshCw size={15} />
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1.5" style={{ fontFamily: "var(--font-lato)" }}>
              L'utilisateur pourra le changer après connexion.
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-black text-gray-500 hover:bg-gray-50" style={{ fontFamily: "var(--font-montserrat)" }}>Annuler</button>
          <button onClick={submit} disabled={submitting} className="flex-1 py-3 rounded-xl text-white text-sm font-black hover:opacity-90 disabled:opacity-60" style={{ backgroundColor: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
            {submitting ? "Création..." : "Créer le compte"}
          </button>
        </div>
      </Modal>

      {/* ── Modal résultat (identifiants) ──────────────────────────── */}
      <Modal open={!!result} onClose={() => setResult(null)} title="Compte créé">
        {result && (
          <>
            {result.emailSent ? (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 border border-green-100 mb-5">
                <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                <p className="text-sm text-green-700" style={{ fontFamily: "var(--font-lato)" }}>
                  Un email avec les identifiants a été envoyé à <strong>{result.email}</strong>.
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-100 mb-5">
                <AlertCircle size={16} className="text-amber-500 shrink-0" />
                <p className="text-sm text-amber-700" style={{ fontFamily: "var(--font-lato)" }}>
                  Email non encore configuré. Transmettez manuellement les identifiants ci-dessous.
                </p>
              </div>
            )}

            <div className="rounded-2xl border border-gray-100 overflow-hidden mb-5">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                <p className="text-xs font-black uppercase tracking-wider text-gray-500" style={{ fontFamily: "var(--font-montserrat)" }}>
                  Identifiants — {result.name}
                </p>
              </div>
              <div className="divide-y divide-gray-50">
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <Mail size={14} className="text-gray-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-gray-400 uppercase font-black tracking-wider" style={{ fontFamily: "var(--font-montserrat)" }}>Email</p>
                      <p className="text-sm font-semibold text-gray-800 truncate" style={{ fontFamily: "var(--font-lato)" }}>{result.email}</p>
                    </div>
                  </div>
                  <button onClick={() => copy(result.email, "res-email")} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-[#1A3A6B] hover:bg-gray-100 transition-all shrink-0 ml-2" title="Copier">
                    {copiedField === "res-email" ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                  </button>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <KeyRound size={14} className="text-gray-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-gray-400 uppercase font-black tracking-wider" style={{ fontFamily: "var(--font-montserrat)" }}>Mot de passe</p>
                      <p className="text-sm font-semibold text-gray-800 font-mono" style={{ fontFamily: "monospace" }}>{result.password}</p>
                    </div>
                  </div>
                  <button onClick={() => copy(result.password, "res-pwd")} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-[#1A3A6B] hover:bg-gray-100 transition-all shrink-0 ml-2" title="Copier">
                    {copiedField === "res-pwd" ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-400 mb-5 text-center" style={{ fontFamily: "var(--font-lato)" }}>
              L'utilisateur se connecte sur <strong>la page de connexion</strong> avec ces identifiants.
            </p>

            <button onClick={() => setResult(null)} className="w-full py-3 rounded-xl text-white text-sm font-black hover:opacity-90" style={{ backgroundColor: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
              Fermer
            </button>
          </>
        )}
      </Modal>

      {/* ── Modal réinitialisation (saisie) ────────────────────────── */}
      <Modal open={!!resetUser} onClose={() => setResetUser(null)} title="Réinitialiser le mot de passe">
        {resetUser && (
          <>
            <p className="text-sm text-gray-500 mb-4" style={{ fontFamily: "var(--font-lato)" }}>
              Nouveau mot de passe pour <strong>{resetUser.name}</strong> ({resetUser.email}).
            </p>
            <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>Nouveau mot de passe</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input className={`${inputCls} pr-10 font-mono`} type={showPwd ? "text" : "password"} value={resetPwd} onChange={(e) => setResetPwd(e.target.value)} style={{ fontFamily: "monospace" }} />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <button type="button" onClick={() => copy(resetPwd, "reset-pwd")} title="Copier" className="w-11 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50">
                {copiedField === "reset-pwd" ? <Check size={15} className="text-green-500" /> : <Copy size={15} />}
              </button>
              <button type="button" onClick={() => setResetPwd(generatePassword(12))} title="Régénérer" className="w-11 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50">
                <RefreshCw size={15} />
              </button>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setResetUser(null)} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-black text-gray-500 hover:bg-gray-50" style={{ fontFamily: "var(--font-montserrat)" }}>Annuler</button>
              <button onClick={submitReset} disabled={resetting || resetPwd.length < 8} className="flex-1 py-3 rounded-xl text-white text-sm font-black hover:opacity-90 disabled:opacity-60" style={{ backgroundColor: "#E8520A", fontFamily: "var(--font-montserrat)" }}>
                {resetting ? "Réinitialisation..." : "Réinitialiser"}
              </button>
            </div>
          </>
        )}
      </Modal>

      {/* ── Modal réinitialisation (résultat) ──────────────────────── */}
      <Modal open={!!resetDone} onClose={() => setResetDone(null)} title="Mot de passe réinitialisé">
        {resetDone && (
          <>
            {resetDone.emailSent ? (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 border border-green-100 mb-5">
                <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                <p className="text-sm text-green-700" style={{ fontFamily: "var(--font-lato)" }}>
                  Le nouveau mot de passe a été envoyé par email à <strong>{resetDone.name}</strong>.
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-100 mb-5">
                <AlertCircle size={16} className="text-amber-500 shrink-0" />
                <p className="text-sm text-amber-700" style={{ fontFamily: "var(--font-lato)" }}>
                  Email non encore configuré. Transmettez ce mot de passe à l'utilisateur.
                </p>
              </div>
            )}
            <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-gray-100 mb-5">
              <div className="flex items-center gap-2 min-w-0">
                <KeyRound size={14} className="text-gray-400 shrink-0" />
                <p className="text-sm font-semibold text-gray-800 font-mono" style={{ fontFamily: "monospace" }}>{resetDone.password}</p>
              </div>
              <button onClick={() => copy(resetDone.password, "rdone-pwd")} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-[#1A3A6B] hover:bg-gray-100 transition-all shrink-0" title="Copier">
                {copiedField === "rdone-pwd" ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
              </button>
            </div>
            <button onClick={() => setResetDone(null)} className="w-full py-3 rounded-xl text-white text-sm font-black hover:opacity-90" style={{ backgroundColor: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
              Fermer
            </button>
          </>
        )}
      </Modal>
    </div>
  );
}
