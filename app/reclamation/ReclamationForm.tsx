"use client";

import { useState } from "react";
import {
  User, Mail, Phone, Hash, FileText, MessageSquare, ChevronDown,
  Send, AlertCircle, CheckCircle, Copy, Check, Paperclip, X,
} from "lucide-react";
import { useT } from "@/components/i18n/LanguageProvider";

const MAX_FILES = 3;
const MAX_TOTAL_BYTES = 4 * 1024 * 1024; // 4 Mo au total
const ALLOWED_EXT = ["jpg", "jpeg", "png", "webp", "gif", "heic", "heif", "pdf"];

const NAVY = "#1A3A6B";
const ORANGE = "#E8520A";

const labelCls = "block text-xs font-black uppercase tracking-wider mb-1.5 text-gray-600";
const inputCls = "w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#1A3A6B] focus:ring-2 focus:ring-[#1A3A6B]/10 transition-all bg-white";
const fontM = { fontFamily: "var(--font-montserrat)" };
const fontL = { fontFamily: "var(--font-lato)" };

export default function ReclamationForm() {
  const { t } = useT();
  const r = t.reclamation;
  const [loading, setLoading] = useState(false);
  const [ref, setRef] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [fileErr, setFileErr] = useState("");

  // La valeur envoyée reste en français (constante) pour le support ; seul le libellé est traduit.
  const SERVICES = [
    { value: "Transit maritime", label: r.svcMaritime },
    { value: "Transit aérien", label: r.svcAir },
    { value: "Transit routier", label: r.svcRoad },
    { value: "Entreposage", label: r.svcStorage },
    { value: "Douane", label: r.svcCustoms },
    { value: "Autre", label: r.svcOther },
  ];

  function isAllowed(f: File): boolean {
    const ext = f.name.includes(".") ? f.name.split(".").pop()!.toLowerCase() : "";
    return f.type.startsWith("image/") || f.type === "application/pdf" || ALLOWED_EXT.includes(ext);
  }
  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!picked.length) return;
    const all = [...files, ...picked];
    if (all.length > MAX_FILES) { setFileErr(r.errMaxFiles); return; }
    if (all.some((f) => !isAllowed(f))) { setFileErr(r.errType); return; }
    if (all.reduce((s, f) => s + f.size, 0) > MAX_TOTAL_BYTES) { setFileErr(r.errSize); return; }
    setFileErr("");
    setFiles(all);
  }
  function removeFile(i: number) {
    setFiles((fs) => fs.filter((_, idx) => idx !== i));
    setFileErr("");
  }
  function fileSize(bytes: number): string {
    return bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} ${r.unitKo}` : `${(bytes / 1024 / 1024).toFixed(1)} ${r.unitMo}`;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = e.currentTarget;
    const get = (name: string) =>
      (form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement)?.value ?? "";
    const fd = new FormData();
    for (const k of ["name", "email", "phone", "service", "reference", "subject", "message"]) fd.append(k, get(k));
    files.forEach((f) => fd.append("files", f));
    try {
      const res = await fetch("/api/reclamation", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || r.errServer);
      setRef(data.ref || "—");
    } catch (err) {
      setError(err instanceof Error ? err.message : r.errGeneric);
    } finally {
      setLoading(false);
    }
  }

  function copyRef() {
    if (!ref) return;
    navigator.clipboard?.writeText(ref).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }

  if (ref) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-8 lg:p-12 shadow-sm text-center">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: "rgba(26,58,107,0.08)" }}>
          <CheckCircle size={38} style={{ color: NAVY }} />
        </div>
        <h2 className="text-xl font-black uppercase mb-3" style={{ color: NAVY, ...fontM }}>{r.okTitle}</h2>
        <p className="text-gray-500 mb-6 max-w-md mx-auto" style={fontL}>{r.okText}</p>
        <div className="inline-flex items-center gap-3 px-5 py-3 rounded-xl border-2 border-dashed mb-8" style={{ borderColor: ORANGE }}>
          <span className="text-lg font-black tracking-wider" style={{ color: NAVY, ...fontM }}>{ref}</span>
          <button onClick={copyRef} title={r.copy} className="text-gray-400 hover:text-[#E8520A] transition-colors">
            {copied ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
          </button>
        </div>
        <p className="text-sm text-gray-400 mb-8" style={fontL}>
          {r.okDelayPre}<strong>{r.okDelayStrong}</strong>.
        </p>
        <button
          onClick={() => { setRef(null); setError(null); }}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-black text-white text-sm uppercase tracking-wide hover:opacity-90"
          style={{ backgroundColor: ORANGE, ...fontM }}
        >
          {r.okNew}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 lg:p-8 shadow-sm">
      <h2 className="text-base font-black uppercase mb-6" style={{ color: NAVY, ...fontM }}>{r.formHeading}</h2>
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100 mb-5">
          <AlertCircle size={15} className="text-red-500 shrink-0" />
          <p className="text-xs text-red-600" style={fontL}>{error}</p>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls} style={fontM}>{r.fName} <span className="text-red-400">*</span></label>
            <div className="relative">
              <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input name="name" type="text" required placeholder={r.fNamePh} className={inputCls} style={fontL} />
            </div>
          </div>
          <div>
            <label className={labelCls} style={fontM}>{r.fEmail} <span className="text-red-400">*</span></label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input name="email" type="email" required placeholder={r.fEmailPh} className={inputCls} style={fontL} />
            </div>
          </div>
          <div>
            <label className={labelCls} style={fontM}>{r.fPhone}</label>
            <div className="relative">
              <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input name="phone" type="tel" placeholder="+242 00 000 00 00" className={inputCls} style={fontL} />
            </div>
          </div>
          <div>
            <label className={labelCls} style={fontM}>{r.fService}</label>
            <div className="relative">
              <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <select name="service" defaultValue="" className="w-full pl-4 pr-10 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#1A3A6B] focus:ring-2 focus:ring-[#1A3A6B]/10 transition-all bg-white appearance-none" style={fontL}>
                <option value="">{r.fServiceChoose}</option>
                {SERVICES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={labelCls} style={fontM}>{r.fRef}</label>
            <div className="relative">
              <Hash size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input name="reference" type="text" placeholder={r.fRefPh} className={inputCls} style={fontL} />
            </div>
          </div>
          <div>
            <label className={labelCls} style={fontM}>{r.fSubject} <span className="text-red-400">*</span></label>
            <div className="relative">
              <FileText size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input name="subject" type="text" required placeholder={r.fSubjectPh} className={inputCls} style={fontL} />
            </div>
          </div>
        </div>
        <div>
          <label className={labelCls} style={fontM}>{r.fMessage} <span className="text-red-400">*</span></label>
          <div className="relative">
            <MessageSquare size={15} className="absolute left-3 top-3 text-gray-400" />
            <textarea name="message" required rows={6} placeholder={r.fMessagePh}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#1A3A6B] focus:ring-2 focus:ring-[#1A3A6B]/10 transition-all bg-white resize-none"
              style={fontL} />
          </div>
        </div>

        {/* Pièces jointes */}
        <div>
          <label className={labelCls} style={fontM}>{r.attach}</label>
          <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-gray-200 text-sm text-gray-500 cursor-pointer hover:border-[#1A3A6B] hover:text-[#1A3A6B] transition-colors" style={fontL}>
            <Paperclip size={15} /> {r.attachAdd}
            <input type="file" multiple accept="image/*,application/pdf,.pdf,.heic,.heif" className="hidden" onChange={onPick} />
          </label>
          <p className="text-[11px] text-gray-400 mt-1.5" style={fontL}>{r.attachHint}</p>
          {fileErr && <p className="text-[11px] text-red-500 mt-1" style={fontL}>{fileErr}</p>}
          {files.length > 0 && (
            <div className="space-y-1.5 mt-2">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-lg border border-gray-100 bg-gray-50">
                  <FileText size={14} className="text-gray-400 shrink-0" />
                  <span className="text-xs text-gray-600 truncate flex-1" style={fontL}>{f.name}</span>
                  <span className="text-[10px] text-gray-400 shrink-0">{fileSize(f.size)}</span>
                  <button type="button" onClick={() => removeFile(i)} className="text-gray-300 hover:text-red-500 shrink-0" title={r.attachRemove}>
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <button type="submit" disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-4 rounded-xl font-black text-white uppercase tracking-wide transition-all hover:opacity-90 hover:shadow-lg disabled:opacity-60"
          style={{ backgroundColor: NAVY, ...fontM }}>
          {loading ? <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Send size={16} />{r.submit}</>}
        </button>
      </form>
    </div>
  );
}
