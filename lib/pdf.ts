/**
 * Génération de PDF côté client (jsPDF) avec l'identité visuelle EXPAC.
 * Tout est exécuté dans le navigateur — aucune charge serveur (idéal Vercel).
 */
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { formatPrice } from "@/lib/tariffs";

const NAVY: [number, number, number] = [26, 58, 107]; // #1A3A6B
const ORANGE: [number, number, number] = [232, 82, 10]; // #E8520A
const GREY: [number, number, number] = [107, 114, 128];

const MARGIN = 14;

type Doc = jsPDF & { lastAutoTable?: { finalY: number } };

type LogoData = { dataUrl: string; w: number; h: number };

// Logo chargé une seule fois puis mis en cache (génération PDF côté navigateur).
let logoCache: LogoData | null | undefined;
async function getLogo(): Promise<LogoData | null> {
  if (logoCache !== undefined) return logoCache;
  try {
    const r = await fetch("/images/logo.jpeg");
    if (!r.ok) throw new Error("logo introuvable");
    const blob = await r.blob();
    const dataUrl = await new Promise<string>((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => res(fr.result as string);
      fr.onerror = rej;
      fr.readAsDataURL(blob);
    });
    const dims = await new Promise<{ w: number; h: number }>((res) => {
      const im = new window.Image();
      im.onload = () => res({ w: im.naturalWidth || 130, h: im.naturalHeight || 44 });
      im.onerror = () => res({ w: 130, h: 44 });
      im.src = dataUrl;
    });
    logoCache = { dataUrl, w: dims.w, h: dims.h };
  } catch {
    logoCache = null;
  }
  return logoCache;
}

/** En-tête de marque + titre du document. Retourne le Y de départ du contenu. */
function header(doc: Doc, title: string, subtitle?: string, logo?: LogoData | null): number {
  const w = doc.internal.pageSize.getWidth();

  // Bandeau navy
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, w, 26, "F");
  // Accent orange
  doc.setFillColor(...ORANGE);
  doc.rect(0, 26, w, 1.5, "F");

  if (logo) {
    // Pastille blanche + logo (le logo a un fond clair, lisible sur le bandeau navy)
    const lh = 15;
    const lw = Math.min(60, (logo.w / logo.h) * lh);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(MARGIN - 1, 5.5, lw + 4, lh + 4, 1.5, 1.5, "F");
    try { doc.addImage(logo.dataUrl, "JPEG", MARGIN + 1, 7.5, lw, lh); } catch { /* image invalide → ignorée */ }
  } else {
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("EXPRESS AFRICA CARGO", MARGIN, 13);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Commissionnaire agréé en douane — CEMAC 2023 · Sûr & Rapide", MARGIN, 19);
  }

  // Titre du document (à droite)
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(title.toUpperCase(), w - MARGIN, 13, { align: "right" });
  if (subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(subtitle, w - MARGIN, 19, { align: "right" });
  }

  return 38;
}

/** Pied de page légal + pagination sur toutes les pages. */
function footer(doc: Doc) {
  const pages = doc.getNumberOfPages();
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setDrawColor(...GREY);
    doc.setLineWidth(0.2);
    doc.line(MARGIN, h - 14, w - MARGIN, h - 14);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...GREY);
    doc.text(
      "Express Africa Cargo Ltd (EXPAC) · Commissionnaire agréé en douane N° CDA 265 · RC : CG-BZV-01-2021-B12-00199 · NIU : M21000002026220",
      MARGIN,
      h - 9
    );
    doc.text(`Page ${i}/${pages}`, w - MARGIN, h - 9, { align: "right" });
    doc.text(
      `Généré le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`,
      MARGIN,
      h - 5
    );
  }
}

/** Titre de section orange. */
function sectionTitle(doc: Doc, text: string, y: number): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...ORANGE);
  doc.text(text.toUpperCase(), MARGIN, y);
  return y + 5;
}

function keyValueTable(doc: Doc, rows: [string, string][], startY: number): number {
  autoTable(doc, {
    startY,
    theme: "plain",
    styles: { fontSize: 9, cellPadding: 1.5 },
    columnStyles: {
      0: { fontStyle: "bold", textColor: NAVY, cellWidth: 50 },
      1: { textColor: [40, 40, 40] },
    },
    body: rows.map(([k, v]) => [k, v || "—"]),
  });
  return (doc.lastAutoTable?.finalY ?? startY) + 6;
}

function save(doc: Doc, filename: string) {
  footer(doc);
  doc.save(filename);
}

// ─────────────────────────────────────────── DEVIS ───────────────────────────────────────────

export type DevisPDF = {
  reference?: string;
  name: string;
  email: string;
  phone: string;
  serviceType: string;
  origin: string;
  destination: string;
  cargoType: string;
  weight?: number | null;
  volume?: number | null;
  notes?: string | null;
  status?: string;
  createdAt: string;
  // Devis chiffré établi par la société — optionnel.
  quotedPrice?: number | null;
  quotedCurrency?: string | null;
  quoteMessage?: string | null;
  quoteItems?: { label: string; amount: number }[] | null;
  transportMode?: string | null;
  preferredDate?: string | null;
  // Signature électronique (devis accepté) — optionnelle.
  signatureDataUrl?: string | null;
  signerName?: string;
  signedAt?: string;
};

function devisMoney(amount: number, currency?: string | null): string {
  const n = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(Math.round(amount));
  return `${n} ${!currency || currency === "XAF" ? "FCFA" : currency}`;
}

const SERVICE_LABELS: Record<string, string> = {
  TRANSIT: "Transit",
  MULTIMODAL: "Transport multimodal",
  STORAGE: "Stockage",
  MARITIME_CONSIGNMENT: "Consignation maritime",
  GROUPAGE: "Groupage",
};

export async function exportDevisPDF(d: DevisPDF) {
  const doc = new jsPDF() as Doc;
  const logo = await getLogo();
  const w = doc.internal.pageSize.getWidth();
  const ref = d.reference ?? "—";
  const priced = d.quotedPrice != null;
  let y = header(doc, priced ? "Devis" : "Demande de devis", `Réf : ${ref}`, logo);

  y = sectionTitle(doc, "Demandeur", y);
  y = keyValueTable(
    doc,
    [
      ["Nom", d.name],
      ["Email", d.email],
      ["Téléphone", d.phone],
      ["Date", new Date(d.createdAt).toLocaleDateString("fr-FR")],
      ["Statut", d.status ?? "Nouveau"],
    ],
    y
  );

  y = sectionTitle(doc, "Détails de l'expédition", y);
  y = keyValueTable(
    doc,
    [
      ["Service", SERVICE_LABELS[d.serviceType] ?? d.serviceType],
      ["Origine", d.origin],
      ["Destination", d.destination],
      ["Type de marchandise", d.cargoType],
      ...(d.transportMode ? [["Mode de transport", d.transportMode] as [string, string]] : []),
      ...(d.preferredDate ? [["Date souhaitée", d.preferredDate] as [string, string]] : []),
      ["Poids", d.weight != null ? `${d.weight} kg` : "—"],
      ["Volume", d.volume != null ? `${d.volume} m³` : "—"],
    ],
    y
  );

  // Devis chiffré établi par la société (postes : transport, douane, etc.).
  if (priced) {
    y = sectionTitle(doc, "Devis proposé", y);
    const body: [string, string][] =
      d.quoteItems && d.quoteItems.length
        ? d.quoteItems.map((it) => [it.label, devisMoney(it.amount, d.quotedCurrency)] as [string, string])
        : [["Montant", devisMoney(d.quotedPrice as number, d.quotedCurrency)]];
    autoTable(doc, {
      startY: y,
      head: [["Poste", "Montant"]],
      body,
      foot: [["Total", devisMoney(d.quotedPrice as number, d.quotedCurrency)]],
      headStyles: { fillColor: NAVY, fontSize: 9 },
      footStyles: { fillColor: ORANGE, fontSize: 11, textColor: [255, 255, 255] },
      styles: { fontSize: 9, cellPadding: 2.5 },
    });
    y = (doc.lastAutoTable?.finalY ?? y) + 6;
    if (d.quoteMessage) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(...GREY);
      const lines = doc.splitTextToSize(`Note : ${d.quoteMessage}`, w - MARGIN * 2);
      doc.text(lines, MARGIN, y);
      y += lines.length * 4 + 4;
    }
  }

  if (d.notes) {
    y = sectionTitle(doc, "Notes", y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(40, 40, 40);
    const lines = doc.splitTextToSize(d.notes, doc.internal.pageSize.getWidth() - MARGIN * 2);
    doc.text(lines, MARGIN, y);
    y += lines.length * 4 + 4;
  }

  if (d.signatureDataUrl) {
    const h = doc.internal.pageSize.getHeight();
    if (y > h - 60) { doc.addPage(); y = 40; }
    y = sectionTitle(doc, "Signature électronique", y + 6);
    try {
      doc.addImage(d.signatureDataUrl, "PNG", MARGIN, y, 58, 27);
    } catch {
      /* image invalide → ignorée */
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...GREY);
    const meta = [
      `Signé par : ${d.signerName ?? "—"}`,
      d.signedAt ? `Le : ${d.signedAt}` : "",
      "Acceptation du devis (signature électronique simple).",
    ].filter(Boolean);
    doc.text(meta, MARGIN + 66, y + 8);
    y += 32;
  }

  save(doc, `devis-${ref}.pdf`);
}

// ──────────────────────────────────────── EXPÉDITION ────────────────────────────────────────

export type ExpeditionPDF = {
  reference: string;
  status: string;
  serviceType: string;
  origin: string;
  destination: string;
  weight?: number | null;
  volume?: number | null;
  eta?: string | null;
  clientName?: string;
  agencyName?: string;
  createdAt: string;
  milestones?: { label: string; date?: string | null; done?: boolean }[];
  documents?: { name: string; type: string }[];
};

export async function exportExpeditionPDF(e: ExpeditionPDF) {
  const doc = new jsPDF() as Doc;
  const logo = await getLogo();
  let y = header(doc, "Fiche d'expédition", `Réf : ${e.reference}`, logo);

  y = sectionTitle(doc, "Informations générales", y);
  y = keyValueTable(
    doc,
    [
      ["Référence", e.reference],
      ["Statut", e.status],
      ["Service", SERVICE_LABELS[e.serviceType] ?? e.serviceType],
      ["Origine", e.origin],
      ["Destination", e.destination],
      ["Poids", e.weight != null ? `${e.weight} kg` : "—"],
      ["Volume", e.volume != null ? `${e.volume} m³` : "—"],
      ["ETA", e.eta ? new Date(e.eta).toLocaleDateString("fr-FR") : "—"],
      ["Client", e.clientName ?? "—"],
      ["Agence", e.agencyName ?? "—"],
      ["Créée le", new Date(e.createdAt).toLocaleDateString("fr-FR")],
    ],
    y
  );

  if (e.milestones && e.milestones.length > 0) {
    y = sectionTitle(doc, "Suivi", y);
    autoTable(doc, {
      startY: y,
      head: [["Étape", "Date", "État"]],
      body: e.milestones.map((m) => [
        m.label,
        m.date ? new Date(m.date).toLocaleDateString("fr-FR") : "—",
        m.done ? "Terminé" : "En attente",
      ]),
      headStyles: { fillColor: NAVY, fontSize: 9 },
      styles: { fontSize: 9, cellPadding: 2 },
    });
    y = (doc.lastAutoTable?.finalY ?? y) + 6;
  }

  if (e.documents && e.documents.length > 0) {
    y = sectionTitle(doc, "Documents liés", y);
    autoTable(doc, {
      startY: y,
      head: [["Document", "Type"]],
      body: e.documents.map((d) => [d.name, d.type]),
      headStyles: { fillColor: NAVY, fontSize: 9 },
      styles: { fontSize: 9, cellPadding: 2 },
    });
  }

  save(doc, `expedition-${e.reference}.pdf`);
}

// ──────────────────────────────────── LISTE DE DOCUMENTS ────────────────────────────────────

export type DocumentRow = { name: string; type: string; createdAt: string; owner?: string };

export async function exportDocumentsListPDF(docs: DocumentRow[], subtitle?: string) {
  const doc = new jsPDF() as Doc;
  const logo = await getLogo();
  const y = header(doc, "Liste des documents", subtitle, logo);

  autoTable(doc, {
    startY: y,
    head: [["Nom", "Type", ...(docs.some((d) => d.owner) ? ["Propriétaire"] : []), "Date"]],
    body: docs.map((d) => [
      d.name,
      d.type,
      ...(docs.some((x) => x.owner) ? [d.owner ?? "—"] : []),
      new Date(d.createdAt).toLocaleDateString("fr-FR"),
    ]),
    headStyles: { fillColor: NAVY, fontSize: 9 },
    styles: { fontSize: 9, cellPadding: 2 },
    alternateRowStyles: { fillColor: [245, 247, 250] },
  });

  save(doc, "documents.pdf");
}

// ───────────────────────────────────────── CONVERSATION ─────────────────────────────────────

export type ConversationMsgPDF = {
  senderLabel: string;
  date: string;
  content: string;
  fromMe?: boolean;
};

export async function exportConversationPDF(title: string, messages: ConversationMsgPDF[]) {
  const doc = new jsPDF() as Doc;
  const logo = await getLogo();
  const w = doc.internal.pageSize.getWidth();
  let y = header(doc, "Conversation", title, logo);

  doc.setFontSize(9);
  for (const m of messages) {
    // En-tête de message (expéditeur + date)
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...(m.fromMe ? ORANGE : NAVY));
    const meta = `${m.senderLabel} · ${new Date(m.date).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })}`;
    doc.text(meta, MARGIN, y);
    y += 4.5;

    // Contenu
    doc.setFont("helvetica", "normal");
    doc.setTextColor(40, 40, 40);
    const lines = doc.splitTextToSize(m.content, w - MARGIN * 2);
    for (const line of lines as string[]) {
      if (y > doc.internal.pageSize.getHeight() - 20) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, MARGIN, y);
      y += 4.5;
    }
    y += 3;
    if (y > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage();
      y = 20;
    }
  }

  save(doc, "conversation.pdf");
}

// ───────────────────────────── ESTIMATION (CALCULATEUR) ─────────────────────────────

export type EstimatePDF = {
  serviceLabel: string;
  origin: string;
  destination: string;
  weight: number;
  volume: number;
  volumetricFactor: number;
  volumetricWeight: number;
  chargeableWeight: number;
  baseFee: number;
  pricePerKg: number;
  weightCost: number;
  total: number;
  currency: string;
  note?: string | null;
};

export async function exportEstimatePDF(e: EstimatePDF) {
  const doc = new jsPDF() as Doc;
  const logo = await getLogo();
  const w = doc.internal.pageSize.getWidth();
  let y = header(doc, "Estimation de devis", new Date().toLocaleDateString("fr-FR"), logo);

  y = sectionTitle(doc, "Votre demande", y);
  y = keyValueTable(
    doc,
    [
      ["Service", e.serviceLabel],
      ["Origine", e.origin],
      ["Destination", e.destination],
      ["Poids réel", e.weight > 0 ? `${e.weight} kg` : "—"],
      ["Volume", e.volume > 0 ? `${e.volume} m³` : "—"],
      ["Poids volumétrique", `${Math.round(e.volumetricWeight)} kg (${e.volume || 0} m³ × ${e.volumetricFactor})`],
      ["Poids facturable retenu", `${Math.round(e.chargeableWeight)} kg`],
    ],
    y
  );

  y = sectionTitle(doc, "Détail de l'estimation", y);
  autoTable(doc, {
    startY: y,
    head: [["Poste", "Montant"]],
    body: [
      ["Frais de base", formatPrice(e.baseFee, e.currency)],
      [`Poids facturable (${Math.round(e.chargeableWeight)} kg × ${formatPrice(e.pricePerKg, e.currency)})`, formatPrice(e.weightCost, e.currency)],
    ],
    foot: [["Total estimé", formatPrice(e.total, e.currency)]],
    headStyles: { fillColor: NAVY, fontSize: 9 },
    footStyles: { fillColor: ORANGE, fontSize: 11, textColor: [255, 255, 255] },
    styles: { fontSize: 9, cellPadding: 2.5 },
  });
  y = (doc.lastAutoTable?.finalY ?? y) + 8;

  // Encadré "prix approximatif"
  doc.setFillColor(255, 247, 237); // amber-50
  doc.setDrawColor(251, 191, 36);
  doc.roundedRect(MARGIN, y, w - MARGIN * 2, 22, 2, 2, "FD");
  doc.setTextColor(180, 83, 9);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("⚠ PRIX APPROXIMATIF — NON CONTRACTUEL", MARGIN + 4, y + 7);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  const disc = doc.splitTextToSize(
    "Cette estimation est indicative et peut varier selon les caractéristiques réelles de l'expédition, les taxes et frais de douane. Pour un devis ferme, contactez Express Africa Cargo.",
    w - MARGIN * 2 - 8
  );
  doc.text(disc, MARGIN + 4, y + 12);
  y += 28;

  if (e.note) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(...GREY);
    doc.text(`Note : ${e.note}`, MARGIN, y);
  }

  save(doc, "estimation-devis.pdf");
}
