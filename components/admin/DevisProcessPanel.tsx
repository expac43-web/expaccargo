"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Package, MapPin, Weight, Phone, Mail, StickyNote, Download,
  Coins, Send, ShieldCheck, Eye, Calendar, Ship, AlertTriangle, Plus, Trash2, UserCheck,
} from "lucide-react";
import { exportDevisPDF } from "@/lib/pdf";

export type QuoteItem = { label: string; amount: number };

export type DevisQuote = {
  id: string; name: string; email: string; phone: string;
  serviceType: string; origin: string; destination: string;
  cargoType: string; weight: number | null; volume: number | null;
  notes: string | null; status: string; createdAt: string;
  transportMode: string | null; preferredDate: string | null; dangerous: boolean | null;
  quotedPrice: number | null; quotedCurrency: string | null; quoteMessage: string | null;
  quotedAt: string | null; quoteItems: QuoteItem[] | null;
  handledById: string | null; handledByName: string | null; handledAt: string | null;
  signature?: { signerName: string; signedAt: string } | null;
};

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  NEW:       { label: "Nouveau",    color: "#2563eb", bg: "rgba(37,99,235,0.1)" },
  IN_REVIEW: { label: "En cours",   color: "#d97706", bg: "rgba(217,119,6,0.1)" },
  QUOTED:    { label: "Devis émis", color: "#7c3aed", bg: "rgba(124,58,237,0.1)" },
  ACCEPTED:  { label: "Accepté",    color: "#16a34a", bg: "rgba(22,163,74,0.1)" },
  REJECTED:  { label: "Refusé",     color: "#dc2626", bg: "rgba(220,38,38,0.1)" },
};

const SERVICE_LABELS: Record<string, string> = {
  TRANSIT: "Transit", MULTIMODAL: "Multimodal",
  STORAGE: "Stockage", MARITIME_CONSIGNMENT: "Consignation", GROUPAGE: "Groupage",
};

// Transitions de statut « manuelles » (l'émission du devis chiffré se fait via le formulaire).
const NEXT_STATUS: Record<string, string[]> = {
  NEW:       ["IN_REVIEW", "REJECTED"],
  IN_REVIEW: ["REJECTED"],
  QUOTED:    ["ACCEPTED", "REJECTED"],
  ACCEPTED:  ["REJECTED"],
  REJECTED:  ["IN_REVIEW"],
};

const CURRENCIES = ["XAF", "EUR", "USD"];
// Postes de coût fréquents (un clic ajoute une ligne pré-nommée).
const PRESET_LABELS = ["Transport / Fret", "Douane", "Manutention", "Assurance", "Autres frais"];

function fmtMoney(amount: number, currency: string): string {
  const n = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(Math.round(amount));
  return `${n} ${currency === "XAF" ? "FCFA" : currency}`;
}

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

export default function DevisProcessPanel({
  quote, onUpdated,
}: {
  quote: DevisQuote;
  onUpdated: (patch: Partial<DevisQuote> & { id: string }) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<{ label: string; amount: string }[]>([]);
  const [currency, setCurrency] = useState("XAF");
  const [message, setMessage] = useState("");
  const [sigOpen, setSigOpen] = useState(false);

  // Pré-remplir le détail du devis à l'ouverture d'une demande.
  useEffect(() => {
    const seed: { label: string; amount: string }[] =
      quote.quoteItems && quote.quoteItems.length
        ? quote.quoteItems.map((it) => ({ label: it.label, amount: String(it.amount) }))
        : quote.quotedPrice != null
          ? [{ label: "Montant total", amount: String(quote.quotedPrice) }]
          : [{ label: "", amount: "" }];
    setItems(seed);
    setCurrency(quote.quotedCurrency || "XAF");
    setMessage(quote.quoteMessage || "");
    setSigOpen(false);
  }, [quote.id]);

  // Lignes valides (libellé + montant) et total.
  const clean = useMemo(
    () =>
      items
        .filter((it) => it.label.trim() !== "" && it.amount !== "" && Number.isFinite(Number(it.amount)) && Number(it.amount) >= 0)
        .map((it) => ({ label: it.label.trim(), amount: Number(it.amount) })),
    [items]
  );
  const total = useMemo(() => clean.reduce((s, it) => s + it.amount, 0), [clean]);
  const priceValid = clean.length > 0 && total > 0;

  function setItem(i: number, key: "label" | "amount", val: string) {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, [key]: val } : it)));
  }
  function addItem(label = "") {
    setItems((prev) => [...prev, { label, amount: "" }]);
  }
  function removeItem(i: number) {
    setItems((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev));
  }

  async function updateStatus(status: string) {
    setSaving(true);
    const r = await fetch(`/api/admin/devis/${quote.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (r.ok) {
      const d = await r.json().catch(() => ({}));
      onUpdated({ id: quote.id, status, handledByName: d.handledByName ?? null, handledAt: d.handledAt ?? null });
    }
    setSaving(false);
  }

  // Établir / mettre à jour le devis chiffré → passe en QUOTED + envoie l'offre par email.
  async function submitQuotePrice() {
    if (!priceValid) return;
    setSaving(true);
    const r = await fetch(`/api/admin/devis/${quote.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "QUOTED",
        quotedPrice: total,
        quotedCurrency: currency,
        quoteMessage: message.trim() || null,
        quoteItems: clean,
      }),
    });
    if (r.ok) {
      const d = await r.json().catch(() => ({}));
      onUpdated({
        id: quote.id, status: "QUOTED",
        quotedPrice: total, quotedCurrency: currency,
        quoteMessage: message.trim() || null, quotedAt: new Date().toISOString(),
        quoteItems: clean,
        handledByName: d.handledByName ?? null, handledAt: d.handledAt ?? null,
      });
    }
    setSaving(false);
  }

  async function downloadPdf() {
    let sig: { signatureDataUrl?: string; signerName?: string; signedAt?: string } = {};
    if (quote.signature) {
      try {
        const r = await fetch(`/api/signatures/${quote.id}`);
        if (r.ok) {
          const blob = await r.blob();
          const dataUrl = await new Promise<string>((res, rej) => {
            const fr = new FileReader();
            fr.onload = () => res(fr.result as string);
            fr.onerror = rej;
            fr.readAsDataURL(blob);
          });
          sig = { signatureDataUrl: dataUrl, signerName: quote.signature.signerName, signedAt: fmtDate(quote.signature.signedAt) };
        }
      } catch { /* PDF sans tampon */ }
    }
    exportDevisPDF({
      reference: quote.id.slice(0, 8).toUpperCase(),
      name: quote.name, email: quote.email, phone: quote.phone,
      serviceType: quote.serviceType, origin: quote.origin, destination: quote.destination,
      cargoType: quote.cargoType, weight: quote.weight, volume: quote.volume, notes: quote.notes,
      transportMode: quote.transportMode, preferredDate: quote.preferredDate,
      quotedPrice: quote.quotedPrice, quotedCurrency: quote.quotedCurrency,
      quoteMessage: quote.quoteMessage, quoteItems: quote.quoteItems,
      status: (STATUS_META[quote.status] ?? STATUS_META.NEW).label, createdAt: quote.createdAt,
      ...sig,
    });
  }

  const m = STATUS_META[quote.status] ?? STATUS_META.NEW;
  const advanceNext = NEXT_STATUS[quote.status] ?? [];

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Statut + transitions */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-sm font-black uppercase"
          style={{ backgroundColor: m.bg, color: m.color, fontFamily: "var(--font-montserrat)" }}>
          {m.label}
        </span>
        {advanceNext.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {advanceNext.map((s) => {
              const sm = STATUS_META[s];
              return (
                <button key={s} onClick={() => updateStatus(s)} disabled={saving}
                  className="px-3 py-1.5 rounded-xl text-xs font-black border transition-all disabled:opacity-50"
                  style={{ borderColor: sm.color, color: sm.color, fontFamily: "var(--font-montserrat)" }}>
                  → {sm.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Traçabilité : qui a traité la demande */}
      {quote.handledByName && (
        <p className="text-xs text-gray-500 flex items-center gap-1.5" style={{ fontFamily: "var(--font-lato)" }}>
          <UserCheck size={13} className="text-gray-400" /> Traité par <strong className="text-gray-700">{quote.handledByName}</strong>
          {quote.handledAt && <span className="text-gray-400">· {fmtDate(quote.handledAt)}</span>}
        </p>
      )}

      {/* Marchandise sensible */}
      {quote.dangerous && (
        <div className="flex items-center gap-2 rounded-xl p-3 border border-red-200 bg-red-50">
          <AlertTriangle size={15} className="text-red-500 shrink-0" />
          <p className="text-xs font-black text-red-600" style={{ fontFamily: "var(--font-montserrat)" }}>
            Marchandise sensible / dangereuse signalée par le client
          </p>
        </div>
      )}

      {/* Devis établi (montant + détail) */}
      {quote.quotedPrice != null && (
        <div className="rounded-xl p-4 border" style={{ borderColor: "rgba(124,58,237,0.3)", backgroundColor: "rgba(124,58,237,0.06)" }}>
          <p className="text-xs font-black uppercase tracking-wider mb-2 flex items-center gap-1" style={{ color: "#7c3aed", fontFamily: "var(--font-montserrat)" }}>
            <Coins size={12} /> Devis établi
          </p>
          {quote.quoteItems && quote.quoteItems.length > 0 && (
            <div className="space-y-1 mb-2">
              {quote.quoteItems.map((it, i) => (
                <div key={i} className="flex items-center justify-between text-sm" style={{ fontFamily: "var(--font-lato)" }}>
                  <span className="text-gray-600">{it.label}</span>
                  <span className="text-gray-800 font-semibold">{fmtMoney(it.amount, quote.quotedCurrency || "XAF")}</span>
                </div>
              ))}
              <div className="border-t border-gray-200 my-1" />
            </div>
          )}
          <p className="text-2xl font-black" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>
            {fmtMoney(quote.quotedPrice, quote.quotedCurrency || "XAF")}
          </p>
          {quote.quoteMessage && <p className="text-sm text-gray-600 mt-1" style={{ fontFamily: "var(--font-lato)" }}>{quote.quoteMessage}</p>}
          {quote.quotedAt && <p className="text-[11px] text-gray-400 mt-1" style={{ fontFamily: "var(--font-lato)" }}>Envoyé le {fmtDate(quote.quotedAt)}</p>}
        </div>
      )}

      {/* Établir / mettre à jour le devis chiffré (détail par poste) */}
      <div className="rounded-xl p-4 border-2 bg-white" style={{ borderColor: "rgba(124,58,237,0.35)" }}>
        <p className="text-sm font-black uppercase tracking-wider mb-3 flex items-center gap-1.5" style={{ color: "#7c3aed", fontFamily: "var(--font-montserrat)" }}>
          <Coins size={14} /> {quote.quotedPrice != null ? "Mettre à jour le devis" : "Établir le devis"}
        </p>

        {/* Lignes de coût */}
        <div className="space-y-2 mb-2">
          {items.map((it, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                type="text"
                value={it.label}
                onChange={(e) => setItem(i, "label", e.target.value)}
                placeholder="Poste (ex : Douane)"
                className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#1A3A6B] focus:ring-2 focus:ring-[#1A3A6B]/10"
                style={{ fontFamily: "var(--font-lato)" }}
              />
              <input
                type="number" min="0" step="any" inputMode="decimal"
                value={it.amount}
                onChange={(e) => setItem(i, "amount", e.target.value)}
                placeholder="Montant"
                className="w-32 px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#1A3A6B] focus:ring-2 focus:ring-[#1A3A6B]/10"
                style={{ fontFamily: "var(--font-lato)" }}
              />
              <button
                onClick={() => removeItem(i)}
                disabled={items.length <= 1}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-30 shrink-0"
                title="Retirer la ligne"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* Ajout de lignes */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <button onClick={() => addItem()} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-black border border-gray-200 text-gray-600 hover:bg-gray-50" style={{ fontFamily: "var(--font-montserrat)" }}>
            <Plus size={12} /> Ligne
          </button>
          {PRESET_LABELS.map((p) => (
            <button key={p} onClick={() => addItem(p)} className="px-2.5 py-1.5 rounded-lg text-xs font-black border border-gray-200 text-gray-500 hover:bg-gray-50" style={{ fontFamily: "var(--font-montserrat)" }}>
              + {p}
            </button>
          ))}
        </div>

        {/* Devise + total */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <label className="text-[11px] font-black uppercase tracking-wider text-gray-400" style={{ fontFamily: "var(--font-montserrat)" }}>Devise</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#1A3A6B] bg-white"
              style={{ fontFamily: "var(--font-lato)" }}
            >
              {CURRENCIES.map((c) => <option key={c} value={c}>{c === "XAF" ? "FCFA" : c}</option>)}
            </select>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-black uppercase tracking-wider text-gray-400" style={{ fontFamily: "var(--font-montserrat)" }}>Total</p>
            <p className="text-lg font-black" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>{fmtMoney(total, currency)}</p>
          </div>
        </div>

        <div className="mb-3">
          <label className="block text-[11px] font-black uppercase tracking-wider text-gray-400 mb-1" style={{ fontFamily: "var(--font-montserrat)" }}>Message au client (facultatif)</label>
          <textarea
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Conditions, délais, validité de l'offre…"
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#1A3A6B] focus:ring-2 focus:ring-[#1A3A6B]/10 resize-none"
            style={{ fontFamily: "var(--font-lato)" }}
          />
        </div>
        <button
          onClick={submitQuotePrice}
          disabled={saving || !priceValid}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-black uppercase text-white hover:opacity-90 transition-opacity disabled:opacity-50"
          style={{ backgroundColor: "#7c3aed", fontFamily: "var(--font-montserrat)" }}
        >
          <Send size={14} /> {saving ? "Envoi…" : quote.quotedPrice != null ? "Renvoyer le devis au client" : "Envoyer le devis au client"}
        </button>
        <p className="text-[11px] text-gray-400 mt-2 text-center" style={{ fontFamily: "var(--font-lato)" }}>
          Le client recevra le devis détaillé par email et le verra dans son espace.
        </p>
      </div>

      {/* Contact */}
      <div className="bg-gray-50 rounded-xl p-4 space-y-2">
        <p className="text-xs font-black uppercase tracking-wider text-gray-400 mb-3" style={{ fontFamily: "var(--font-montserrat)" }}>Contact</p>
        <p className="text-sm font-black" style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}>{quote.name}</p>
        <p className="text-xs text-gray-500 flex items-center gap-2" style={{ fontFamily: "var(--font-lato)" }}><Mail size={12} /> {quote.email}</p>
        <p className="text-xs text-gray-500 flex items-center gap-2" style={{ fontFamily: "var(--font-lato)" }}><Phone size={12} /> {quote.phone}</p>
      </div>

      {/* Détails de la demande */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: Package, label: "Service", value: SERVICE_LABELS[quote.serviceType] ?? quote.serviceType },
          { icon: MapPin, label: "Origine", value: quote.origin },
          { icon: MapPin, label: "Destination", value: quote.destination },
          { icon: Package, label: "Type de cargaison", value: quote.cargoType },
          ...(quote.transportMode ? [{ icon: Ship, label: "Mode de transport", value: quote.transportMode }] : []),
          ...(quote.preferredDate ? [{ icon: Calendar, label: "Date souhaitée", value: quote.preferredDate }] : []),
          ...(quote.weight ? [{ icon: Weight, label: "Poids", value: `${quote.weight} kg` }] : []),
          ...(quote.volume ? [{ icon: Weight, label: "Volume", value: `${quote.volume} m³` }] : []),
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs font-black uppercase tracking-wider text-gray-400 mb-1 flex items-center gap-1" style={{ fontFamily: "var(--font-montserrat)" }}>
              <Icon size={11} /> {label}
            </p>
            <p className="text-sm text-gray-700" style={{ fontFamily: "var(--font-lato)" }}>{value}</p>
          </div>
        ))}
      </div>

      {quote.notes && (
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-xs font-black uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1" style={{ fontFamily: "var(--font-montserrat)" }}>
            <StickyNote size={11} /> Notes
          </p>
          <p className="text-sm text-gray-600" style={{ fontFamily: "var(--font-lato)" }}>{quote.notes}</p>
        </div>
      )}

      {/* Signature (si le devis a été accepté & signé) */}
      {quote.signature && (
        <div className="rounded-xl p-4 border border-green-100 bg-green-50/60">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="text-xs text-green-700 flex items-center gap-1.5" style={{ fontFamily: "var(--font-lato)" }}>
              <ShieldCheck size={14} className="shrink-0" /> Signé par <strong>{quote.signature.signerName}</strong> le {fmtDate(quote.signature.signedAt)}
            </p>
            <button onClick={() => setSigOpen((v) => !v)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-black uppercase border border-green-200 text-green-700 hover:bg-green-100 transition-colors shrink-0" style={{ fontFamily: "var(--font-montserrat)" }}>
              <Eye size={13} /> {sigOpen ? "Masquer" : "Voir"}
            </button>
          </div>
          {sigOpen && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`/api/signatures/${quote.id}`} alt="Signature" className="w-full rounded-xl border border-gray-200 bg-white mt-3" />
          )}
        </div>
      )}

      {/* Pied : PDF + date */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button
          onClick={downloadPdf}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-black uppercase text-white hover:opacity-90 transition-opacity"
          style={{ backgroundColor: "#E8520A", fontFamily: "var(--font-montserrat)" }}
        >
          <Download size={13} /> Exporter en PDF
        </button>
        <p className="text-xs text-gray-400 text-right" style={{ fontFamily: "var(--font-lato)" }}>
          Reçu le {new Date(quote.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}
