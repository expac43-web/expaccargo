"use client";

import { useState, useEffect } from "react";
import {
  User, Mail, Phone, MessageSquare, Lock, Eye, EyeOff,
  Save, CheckCircle2, AlertCircle, UserCircle, Loader2,
} from "lucide-react";
import { useT } from "@/components/i18n/LanguageProvider";

type Profile = {
  id: string; name: string; email: string;
  phone: string | null; whatsapp: string | null; role: string; createdAt: string;
};

const labelCls = "block text-xs font-black uppercase tracking-wider mb-1.5 text-gray-600";
const inputCls = "w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#1A3A6B] focus:ring-2 focus:ring-[#1A3A6B]/10 transition-all bg-white";

function Msg({ type, text }: { type: "ok" | "err"; text: string }) {
  return (
    <div className={`flex items-center gap-2 p-3 rounded-xl border mb-5 ${type === "ok" ? "bg-green-50 border-green-100" : "bg-red-50 border-red-100"}`}>
      {type === "ok"
        ? <CheckCircle2 size={14} className="text-green-600 shrink-0" />
        : <AlertCircle size={14} className="text-red-500 shrink-0" />}
      <p className={`text-xs ${type === "ok" ? "text-green-700" : "text-red-600"}`} style={{ fontFamily: "var(--font-lato)" }}>
        {text}
      </p>
    </div>
  );
}

export default function ClientProfilPage() {
  const { t, locale } = useT();
  const pr = t.dashboard.profile;
  const dl = locale === "en" ? "en-US" : "fr-FR";
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [profileMsg, setProfileMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/profile")
      .then((r) => r.json())
      .then((d: Profile) => {
        setProfile(d);
        setName(d.name);
        setPhone(d.phone ?? "");
        setWhatsapp(d.whatsapp ?? "");
      })
      .finally(() => setLoading(false));
  }, []);

  async function saveProfile() {
    setSaving(true);
    setProfileMsg(null);
    try {
      const r = await fetch("/api/admin/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, whatsapp }),
      });
      const data = await r.json();
      if (!r.ok) { setProfileMsg({ type: "err", text: data.error ?? pr.errGeneric }); return; }
      setProfile((p) => p ? { ...p, name, phone: phone || null, whatsapp: whatsapp || null } : p);
      setProfileMsg({ type: "ok", text: pr.profileOk });
    } finally {
      setSaving(false);
    }
  }

  async function changePassword() {
    setPwdMsg(null);
    if (newPwd !== confirmPwd) { setPwdMsg({ type: "err", text: pr.pwdMismatch }); return; }
    if (newPwd.length < 8) { setPwdMsg({ type: "err", text: pr.pwdShort }); return; }
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
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 size={28} className="animate-spin" style={{ color: "#1A3A6B" }} />
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 lg:p-8">
      {/* Page header */}
      <div className="mb-8">
        <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: "#E8520A", fontFamily: "var(--font-montserrat)" }}>
          ▪ {pr.eyebrow}
        </p>
        <h1 className="text-2xl font-black" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
          {pr.title}
        </h1>
        <p className="text-gray-500 text-sm mt-1" style={{ fontFamily: "var(--font-lato)" }}>
          {pr.subtitle}
        </p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Identity card */}
        {profile && (
          <div
            className="flex items-center gap-4 p-5 rounded-2xl"
            style={{ background: "linear-gradient(135deg, #0e2248 0%, #1A3A6B 100%)" }}
          >
            <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <UserCircle size={28} color="white" />
            </div>
            <div className="min-w-0">
              <p className="text-white font-black text-base truncate" style={{ fontFamily: "var(--font-montserrat)" }}>
                {profile.name}
              </p>
              <p className="text-blue-200 text-sm truncate" style={{ fontFamily: "var(--font-lato)" }}>
                {profile.email}
              </p>
              <p className="text-blue-300 text-xs mt-0.5" style={{ fontFamily: "var(--font-lato)" }}>
                {pr.client} · {pr.memberSince} {new Date(profile.createdAt).toLocaleDateString(dl, { month: "long", year: "numeric" })}
              </p>
            </div>
          </div>
        )}

        {/* Profile form */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="font-black uppercase text-sm mb-5" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
            {pr.personalInfo}
          </h2>

          {profileMsg && <Msg type={profileMsg.type} text={profileMsg.text} />}

          <div className="space-y-4">
            <div>
              <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>{pr.fullName}</label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputCls}
                  placeholder={pr.fullNamePh}
                  style={{ fontFamily: "var(--font-lato)" }}
                />
              </div>
            </div>

            <div>
              <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>{pr.email}</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={profile?.email ?? ""}
                  disabled
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-100 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
                  style={{ fontFamily: "var(--font-lato)" }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1" style={{ fontFamily: "var(--font-lato)" }}>
                {pr.emailLocked}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>{pr.phone}</label>
                <div className="relative">
                  <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={inputCls}
                    placeholder="+242 00 000 00 00"
                    style={{ fontFamily: "var(--font-lato)" }}
                  />
                </div>
              </div>
              <div>
                <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>{pr.whatsapp}</label>
                <div className="relative">
                  <MessageSquare size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className={inputCls}
                    placeholder="+242 00 000 00 00"
                    style={{ fontFamily: "var(--font-lato)" }}
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={saveProfile}
            disabled={saving || !name.trim()}
            className="mt-6 flex items-center gap-2 px-6 py-3 rounded-xl text-white text-sm font-black hover:opacity-90 disabled:opacity-60 transition-opacity"
            style={{ backgroundColor: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {saving ? pr.saving : pr.save}
          </button>
        </div>

        {/* Change password */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h2 className="font-black uppercase text-sm mb-5" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
            {pr.changePwd}
          </h2>

          {pwdMsg && <Msg type={pwdMsg.type} text={pwdMsg.text} />}

          <div className="space-y-4">
            {[
              { label: pr.currentPwd, value: currentPwd, set: setCurrentPwd, show: showCurrent, toggle: () => setShowCurrent((p) => !p) },
              { label: pr.newPwd, value: newPwd, set: setNewPwd, show: showNew, toggle: () => setShowNew((p) => !p), hint: pr.pwdHint },
              { label: pr.confirmPwd, value: confirmPwd, set: setConfirmPwd, show: showNew, toggle: () => setShowNew((p) => !p) },
            ].map(({ label, value, set, show, toggle, hint }) => (
              <div key={label}>
                <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>{label}</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={show ? "text" : "password"}
                    value={value}
                    onChange={(e) => set(e.target.value)}
                    className={`${inputCls} pr-10`}
                    placeholder="••••••••"
                    style={{ fontFamily: "var(--font-lato)" }}
                  />
                  <button
                    type="button"
                    onClick={toggle}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
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
            className="mt-6 flex items-center gap-2 px-6 py-3 rounded-xl text-white text-sm font-black hover:opacity-90 disabled:opacity-60 transition-opacity"
            style={{ backgroundColor: "#E8520A", fontFamily: "var(--font-montserrat)" }}
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Lock size={15} />}
            {saving ? pr.pwdUpdating : pr.pwdSubmit}
          </button>
        </div>
      </div>
    </div>
  );
}
