"use client";

import { useState, useEffect } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import { User, Mail, Phone, MessageSquare, Lock, Eye, EyeOff, Save, CheckCircle2, AlertCircle, ShieldCheck } from "lucide-react";

type Profile = {
  id: string; name: string; email: string;
  phone: string | null; whatsapp: string | null; role: string; createdAt: string;
};

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super administrateur",
  MANAGER: "Gestionnaire",
  AGENCY: "Agence",
};

const labelCls = "block text-xs font-black uppercase tracking-wider mb-1.5 text-gray-600";
const inputCls = "w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#1A3A6B] focus:ring-2 focus:ring-[#1A3A6B]/10 transition-all bg-white";

export default function ProfilPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Profile form
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [profileMsg, setProfileMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Password form
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/profile")
      .then(r => r.json())
      .then((d: Profile) => {
        setProfile(d);
        setName(d.name);
        setPhone(d.phone ?? "");
        setWhatsapp(d.whatsapp ?? "");
      })
      .finally(() => setLoading(false));
  }, []);

  async function saveProfile() {
    setSaving(true); setProfileMsg(null);
    try {
      const r = await fetch("/api/admin/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, whatsapp }),
      });
      const data = await r.json();
      if (!r.ok) { setProfileMsg({ type: "err", text: data.error ?? "Erreur" }); return; }
      setProfile(p => p ? { ...p, name, phone: phone || null, whatsapp: whatsapp || null } : p);
      setProfileMsg({ type: "ok", text: "Profil mis à jour avec succès." });
    } finally { setSaving(false); }
  }

  async function changePassword() {
    setPwdMsg(null);
    if (newPwd !== confirmPwd) { setPwdMsg({ type: "err", text: "Les mots de passe ne correspondent pas." }); return; }
    if (newPwd.length < 8) { setPwdMsg({ type: "err", text: "Minimum 8 caractères." }); return; }
    setSaving(true);
    try {
      const r = await fetch("/api/admin/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: currentPwd, newPassword: newPwd }),
      });
      const data = await r.json();
      if (!r.ok) { setPwdMsg({ type: "err", text: data.error ?? "Erreur" }); return; }
      setPwdMsg({ type: "ok", text: "Mot de passe modifié avec succès." });
      setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
    } finally { setSaving(false); }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <span className="w-8 h-8 border-2 border-gray-200 border-t-[#1A3A6B] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <AdminHeader title="Mon profil" subtitle="Gérer vos informations personnelles et sécurité" />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-6">

          {/* Role badge */}
          {profile && (
            <div
              className="flex items-center gap-3 p-4 rounded-2xl"
              style={{ background: "linear-gradient(135deg, #0e2248 0%, #1A3A6B 100%)" }}
            >
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                <ShieldCheck size={22} color="white" />
              </div>
              <div>
                <p className="text-white font-black text-sm" style={{ fontFamily: "var(--font-montserrat)" }}>{profile.name}</p>
                <p className="text-blue-200 text-xs" style={{ fontFamily: "var(--font-lato)" }}>
                  {ROLE_LABELS[profile.role] ?? profile.role} · Membre depuis le {new Date(profile.createdAt).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
                </p>
              </div>
            </div>
          )}

          {/* Profile info */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="font-black uppercase text-sm mb-5" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
              Informations personnelles
            </h2>

            {profileMsg && (
              <div className={`flex items-center gap-2 p-3 rounded-xl border mb-5 ${profileMsg.type === "ok" ? "bg-green-50 border-green-100" : "bg-red-50 border-red-100"}`}>
                {profileMsg.type === "ok" ? <CheckCircle2 size={14} className="text-green-600 shrink-0" /> : <AlertCircle size={14} className="text-red-500 shrink-0" />}
                <p className={`text-xs ${profileMsg.type === "ok" ? "text-green-700" : "text-red-600"}`} style={{ fontFamily: "var(--font-lato)" }}>{profileMsg.text}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>Nom complet *</label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" value={name} onChange={e => setName(e.target.value)} className={inputCls} placeholder="Votre nom" style={{ fontFamily: "var(--font-lato)" }} />
                </div>
              </div>

              <div>
                <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>Adresse email</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="email" value={profile?.email ?? ""} disabled className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-100 text-sm bg-gray-50 text-gray-400 cursor-not-allowed" style={{ fontFamily: "var(--font-lato)" }} />
                </div>
                <p className="text-xs text-gray-400 mt-1" style={{ fontFamily: "var(--font-lato)" }}>L'email ne peut pas être modifié.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>Téléphone</label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className={inputCls} placeholder="+242 00 000 00 00" style={{ fontFamily: "var(--font-lato)" }} />
                  </div>
                </div>
                <div>
                  <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>WhatsApp</label>
                  <div className="relative">
                    <MessageSquare size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="tel" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} className={inputCls} placeholder="+242 00 000 00 00" style={{ fontFamily: "var(--font-lato)" }} />
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={saveProfile}
              disabled={saving || !name.trim()}
              className="mt-6 flex items-center gap-2 px-6 py-3 rounded-xl text-white text-sm font-black hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}
            >
              <Save size={15} />
              {saving ? "Enregistrement..." : "Enregistrer les modifications"}
            </button>
          </div>

          {/* Change password */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="font-black uppercase text-sm mb-5" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
              Changer le mot de passe
            </h2>

            {pwdMsg && (
              <div className={`flex items-center gap-2 p-3 rounded-xl border mb-5 ${pwdMsg.type === "ok" ? "bg-green-50 border-green-100" : "bg-red-50 border-red-100"}`}>
                {pwdMsg.type === "ok" ? <CheckCircle2 size={14} className="text-green-600 shrink-0" /> : <AlertCircle size={14} className="text-red-500 shrink-0" />}
                <p className={`text-xs ${pwdMsg.type === "ok" ? "text-green-700" : "text-red-600"}`} style={{ fontFamily: "var(--font-lato)" }}>{pwdMsg.text}</p>
              </div>
            )}

            <div className="space-y-4">
              {[
                { label: "Mot de passe actuel *", value: currentPwd, set: setCurrentPwd, show: showCurrent, toggle: () => setShowCurrent(p => !p) },
                { label: "Nouveau mot de passe *", value: newPwd, set: setNewPwd, show: showNew, toggle: () => setShowNew(p => !p), hint: "Minimum 8 caractères" },
                { label: "Confirmer le nouveau mot de passe *", value: confirmPwd, set: setConfirmPwd, show: showNew, toggle: () => setShowNew(p => !p) },
              ].map(({ label, value, set, show, toggle, hint }) => (
                <div key={label}>
                  <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>{label}</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={show ? "text" : "password"}
                      value={value}
                      onChange={e => set(e.target.value)}
                      className={`${inputCls} pr-10`}
                      placeholder="••••••••"
                      style={{ fontFamily: "var(--font-lato)" }}
                    />
                    <button type="button" onClick={toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {show ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {hint && <p className="text-xs text-gray-400 mt-1" style={{ fontFamily: "var(--font-lato)" }}>{hint}</p>}
                </div>
              ))}
            </div>

            <button
              onClick={changePassword}
              disabled={saving || !currentPwd || !newPwd || !confirmPwd}
              className="mt-6 flex items-center gap-2 px-6 py-3 rounded-xl text-white text-sm font-black hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: "#E8520A", fontFamily: "var(--font-montserrat)" }}
            >
              <Lock size={15} />
              {saving ? "Mise à jour..." : "Modifier le mot de passe"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
