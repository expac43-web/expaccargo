"use client";

import { useState, useEffect } from "react";
import { User, Mail, Phone, Lock, Building2, Save, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
import AvatarUpload from "@/components/ui/AvatarUpload";

type Profile = {
  id: string; name: string; email: string; phone: string | null; whatsapp: string | null;
  agencyId: string | null; avatarUrl: string | null;
  agency: { id: string; name: string; city: string; country: string } | null;
};

const labelCls = "block text-xs font-black uppercase tracking-wider mb-1.5 text-gray-600";
const inputCls = "w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#0e5f72] focus:ring-2 focus:ring-[#0e5f72]/10 transition-all bg-white";

export default function AgenceProfilPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", whatsapp: "", currentPassword: "", newPassword: "", confirmPassword: "" });

  useEffect(() => {
    fetch("/api/agence/profile")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data) {
          setProfile(data);
          setAvatarUrl(data.avatarUrl ?? null);
          setForm((f) => ({ ...f, name: data.name ?? "", phone: data.phone ?? "", whatsapp: data.whatsapp ?? "" }));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setError(null);
    if (form.newPassword && form.newPassword !== form.confirmPassword) {
      setError("Les mots de passe ne correspondent pas."); return;
    }
    setSaving(true);
    const r = await fetch("/api/agence/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        phone: form.phone,
        whatsapp: form.whatsapp,
        currentPassword: form.currentPassword || undefined,
        newPassword: form.newPassword || undefined,
      }),
    });
    setSaving(false);
    if (!r.ok) { const d = await r.json(); setError(d.error ?? "Erreur."); return; }
    setSuccess(true);
    setForm((f) => ({ ...f, currentPassword: "", newPassword: "", confirmPassword: "" }));
    setTimeout(() => setSuccess(false), 3000);
  }

  if (loading) {
    return <div className="p-8 flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#0e5f72] border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      <div className="mb-8">
        <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: "#0e5f72", fontFamily: "var(--font-montserrat)" }}>▪ Agence</p>
        <h1 className="text-2xl font-black uppercase" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>Mon profil</h1>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100 mb-5">
          <AlertCircle size={14} className="text-red-500 shrink-0" />
          <p className="text-xs text-red-600" style={{ fontFamily: "var(--font-lato)" }}>{error}</p>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 border border-green-100 mb-5">
          <CheckCircle2 size={14} className="text-green-500 shrink-0" />
          <p className="text-xs text-green-600" style={{ fontFamily: "var(--font-lato)" }}>Profil mis à jour avec succès.</p>
        </div>
      )}

      {/* Photo de profil */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-5 flex justify-center">
        <AvatarUpload
          avatarUrl={avatarUrl}
          name={profile?.name ?? ""}
          uploadEndpoint="/api/agence/profile/avatar"
          onUploaded={setAvatarUrl}
          size={88}
          accentColor="#0e5f72"
        />
      </div>

      {/* Infos agence (lecture seule) */}
      {profile?.agency && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(14,95,114,0.1)" }}>
              <Building2 size={18} style={{ color: "#0e5f72" }} />
            </div>
            <h2 className="text-sm font-black uppercase" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>Mon agence</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-400 mb-0.5" style={{ fontFamily: "var(--font-montserrat)" }}>Nom</p>
              <p className="font-semibold text-gray-800" style={{ fontFamily: "var(--font-lato)" }}>{profile.agency.name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5" style={{ fontFamily: "var(--font-montserrat)" }}>Localisation</p>
              <p className="font-semibold text-gray-800" style={{ fontFamily: "var(--font-lato)" }}>{profile.agency.city}, {profile.agency.country}</p>
            </div>
          </div>
        </div>
      )}

      {/* Informations personnelles */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-5">
        <h2 className="text-sm font-black uppercase mb-5" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>Informations personnelles</h2>
        <div className="space-y-4">
          <div>
            <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>Nom complet</label>
            <div className="relative">
              <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={inputCls} style={{ fontFamily: "var(--font-lato)" }} />
            </div>
          </div>
          <div>
            <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>Email (non modifiable)</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="email" value={profile?.email ?? ""} disabled className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-100 text-sm bg-gray-50 text-gray-400 cursor-not-allowed" style={{ fontFamily: "var(--font-lato)" }} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>Téléphone</label>
              <div className="relative">
                <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+242 …" className={inputCls} style={{ fontFamily: "var(--font-lato)" }} />
              </div>
            </div>
            <div>
              <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>WhatsApp</label>
              <div className="relative">
                <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="tel" value={form.whatsapp} onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))} placeholder="+242 …" className={inputCls} style={{ fontFamily: "var(--font-lato)" }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mot de passe */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-6">
        <h2 className="text-sm font-black uppercase mb-5" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>Changer le mot de passe</h2>
        <div className="space-y-4">
          {[
            { label: "Mot de passe actuel", field: "currentPassword" as const, show: showCurrent, toggle: () => setShowCurrent(!showCurrent) },
            { label: "Nouveau mot de passe", field: "newPassword" as const, show: showNew, toggle: () => setShowNew(!showNew) },
            { label: "Confirmer le nouveau mot de passe", field: "confirmPassword" as const, show: showNew, toggle: () => setShowNew(!showNew) },
          ].map(({ label, field, show, toggle }) => (
            <div key={field}>
              <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>{label}</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type={show ? "text" : "password"} value={form[field]} onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#0e5f72] focus:ring-2 focus:ring-[#0e5f72]/10 transition-all bg-white"
                  style={{ fontFamily: "var(--font-lato)" }} />
                <button type="button" onClick={toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" tabIndex={-1}>
                  {show ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button onClick={handleSave} disabled={saving}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-black text-white text-sm uppercase tracking-wide transition-all hover:opacity-90 hover:shadow-lg disabled:opacity-60"
        style={{ backgroundColor: "#0e5f72", fontFamily: "var(--font-montserrat)" }}>
        {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={16} />Sauvegarder les modifications</>}
      </button>
    </div>
  );
}
