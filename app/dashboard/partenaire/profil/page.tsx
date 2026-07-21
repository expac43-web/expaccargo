"use client";

import { useState, useEffect } from "react";
import { UserCircle, Mail, Phone, MessageCircle, KeyRound, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

type Profile = { id: string; name: string; email: string; phone: string | null; whatsapp: string | null };

const inputCls = "w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#E8520A] transition-all bg-white";
const labelCls = "block text-xs font-black uppercase tracking-wider mb-1.5 text-gray-600";

export default function PartenaireProfilPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", whatsapp: "", currentPassword: "", newPassword: "", confirmPassword: "" });

  useEffect(() => {
    fetch("/api/partner/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: Profile | null) => {
        if (d) {
          setProfile(d);
          setForm((f) => ({ ...f, name: d.name ?? "", phone: d.phone ?? "", whatsapp: d.whatsapp ?? "" }));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSuccess(false);

    if (form.newPassword && form.newPassword !== form.confirmPassword) {
      setError("Les deux mots de passe ne correspondent pas."); return;
    }
    setSaving(true);
    try {
      const r = await fetch("/api/partner/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          whatsapp: form.whatsapp,
          ...(form.newPassword ? { currentPassword: form.currentPassword, newPassword: form.newPassword } : {}),
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Erreur");
      setSuccess(true);
      setForm((f) => ({ ...f, currentPassword: "", newPassword: "", confirmPassword: "" }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="flex justify-center py-20 text-gray-400"><Loader2 size={22} className="animate-spin" /></div>;
  }

  return (
    <div className="p-5 lg:p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #b8420a, #E8520A)" }}>
          <UserCircle size={20} color="white" />
        </div>
        <div>
          <h1 className="text-xl lg:text-2xl font-black" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>Mon profil</h1>
          <p className="text-sm text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>{profile?.email}</p>
        </div>
      </div>

      {error && <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-100 mb-4"><AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" /><p className="text-xs text-red-600">{error}</p></div>}
      {success && <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 border border-green-100 mb-4"><CheckCircle2 size={15} className="text-green-600 shrink-0" /><p className="text-xs text-green-700">Profil mis à jour.</p></div>}

      <form onSubmit={save} className="space-y-5">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <div>
            <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>Nom / Société</label>
            <input className={inputCls} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}><Mail size={12} className="inline mr-1" />Email</label>
            <input className={`${inputCls} bg-gray-50 text-gray-400`} value={profile?.email ?? ""} disabled />
            <p className="text-[11px] text-gray-400 mt-1" style={{ fontFamily: "var(--font-lato)" }}>L&apos;email ne peut pas être modifié. Contactez EXPAC si besoin.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}><Phone size={12} className="inline mr-1" />Téléphone</label>
              <input className={inputCls} value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+242 06 000 00 00" />
            </div>
            <div>
              <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}><MessageCircle size={12} className="inline mr-1" />WhatsApp</label>
              <input className={inputCls} value={form.whatsapp} onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))} placeholder="+242 06 000 00 00" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <h2 className="text-sm font-black flex items-center gap-2" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
            <KeyRound size={15} /> Changer le mot de passe
          </h2>
          <p className="text-xs text-gray-400" style={{ fontFamily: "var(--font-lato)" }}>Laissez vide pour conserver le mot de passe actuel.</p>
          <div>
            <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>Mot de passe actuel</label>
            <input type="password" className={inputCls} value={form.currentPassword} onChange={(e) => setForm((f) => ({ ...f, currentPassword: e.target.value }))} autoComplete="current-password" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>Nouveau mot de passe</label>
              <input type="password" className={inputCls} value={form.newPassword} onChange={(e) => setForm((f) => ({ ...f, newPassword: e.target.value }))} autoComplete="new-password" />
            </div>
            <div>
              <label className={labelCls} style={{ fontFamily: "var(--font-montserrat)" }}>Confirmer</label>
              <input type="password" className={inputCls} value={form.confirmPassword} onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))} autoComplete="new-password" />
            </div>
          </div>
        </div>

        <button type="submit" disabled={saving} className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-black text-white text-sm uppercase tracking-wide disabled:opacity-60" style={{ backgroundColor: "#E8520A", fontFamily: "var(--font-montserrat)" }}>
          {saving ? <Loader2 size={16} className="animate-spin" /> : "Enregistrer"}
        </button>
      </form>
    </div>
  );
}
