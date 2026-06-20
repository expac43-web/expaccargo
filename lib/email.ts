/**
 * Emails transactionnels EXPAC via Resend.
 *
 * ⚠️ Tant que RESEND_API_KEY n'est pas configurée, `resend` vaut null :
 * chaque fonction d'envoi renvoie `false` SANS lever d'erreur (les fonctionnalités
 * appelantes continuent de marcher). Une fois Resend branché + le domaine vérifié,
 * l'envoi s'active automatiquement, sans changer le code applicatif.
 *
 * Toutes les fonctions `send*` renvoient `Promise<boolean>` (true = email parti).
 * Pour récupérer juste le HTML (prévisualisation, tests), utilisez les `render*`.
 */
import { Resend } from "resend";
import { sbGet, enc } from "@/lib/supabase-admin";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Expéditeur unique de tous les emails système (domaine à vérifier dans Resend).
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "support@expaccargo.com";
const FROM = `EXPAC — Express Africa Cargo <${FROM_EMAIL}>`;
const SITE = "https://expaccargo.com";
const LOGIN_URL = `${SITE}/login`;

const NAVY = "#1A3A6B";
const TEAL = "#0e5f72";
const ORANGE = "#E8520A";

export type StaffRole = "MANAGER" | "AGENCY";

/** Indique si l'envoi d'emails est actif (clé Resend présente). */
export function isEmailConfigured(): boolean {
  return resend !== null;
}

/**
 * Convertit le HTML d'un email en texte brut lisible.
 * Fournir une partie text/plain (email multipart) est un signal anti-spam fort
 * et garantit la lecture sur les clients sans HTML.
 */
function htmlToPlain(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, "$2 ($1)")
    .replace(/<\/(p|h1|h2|h3|div|tr|li)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&middot;/gi, "·")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Envoi bas-niveau. Renvoie true si parti, false sinon (clé absente ou erreur). */
async function sendEmail(opts: { to: string; subject: string; html: string; replyTo?: string }): Promise<boolean> {
  if (!resend) return false;
  // Liste de suppression (anti-spam) : ne jamais réémettre vers une adresse
  // ayant fait un bounce dur ou une plainte (alimentée par le webhook Resend).
  try {
    const [suppressed] = await sbGet<{ email: string }>(
      "EmailSuppression",
      `email=eq.${enc(opts.to.trim().toLowerCase())}&select=email&limit=1`
    );
    if (suppressed) {
      console.warn(`[email] adresse en liste de suppression, envoi ignoré : ${opts.to}`);
      return false;
    }
  } catch {
    // En cas d'échec de lecture, on n'empêche pas l'envoi.
  }
  try {
    await resend.emails.send({
      from: FROM,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: htmlToPlain(opts.html), // partie texte (anti-spam + accessibilité)
      // Reply-To = l'agence concernée → la réponse du client arrive dans sa boîte,
      // l'expéditeur restant support@expaccargo.com.
      ...(opts.replyTo ? { replyTo: opts.replyTo } : {}),
    });
    return true;
  } catch (e) {
    console.error("[email] envoi échoué:", e);
    return false;
  }
}

// ───────────────────────────── Gabarit de marque ─────────────────────────────

/** Enveloppe HTML commune (en-tête + pied) ; `inner` = contenu central. */
function shell(opts: { accent: string; preheader?: string; inner: string }): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:Arial,Helvetica,sans-serif;">
  ${opts.preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${opts.preheader}</div>` : ""}
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;max-width:600px;">
        <tr><td style="background:linear-gradient(135deg,#0e2248 0%,${opts.accent} 100%);padding:28px 40px;">
          <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:900;text-transform:uppercase;letter-spacing:0.05em;">EXPRESS AFRICA CARGO</h1>
          <p style="margin:6px 0 0;color:rgba(255,255,255,0.7);font-size:12px;">Commissionnaire agréé en douane — Sûr &amp; Rapide</p>
        </td></tr>
        <tr><td style="padding:36px 40px;">
          ${opts.inner}
        </td></tr>
        <tr><td style="padding:0 40px 32px;">
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 20px;">
          <p style="margin:0;color:#9ca3af;font-size:11px;text-align:center;line-height:1.6;">
            Express Africa Cargo Ltd (EXPAC) · RC : CG-BZV-01-2021-B12-00199 · NIU : M21000002026220<br>
            ${FROM_EMAIL}
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();
}

function button(label: string, url: string, accent: string): string {
  return `
  <div style="text-align:center;margin:28px 0 8px;">
    <a href="${url}" style="display:inline-block;background:${accent};color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:900;font-size:14px;text-transform:uppercase;letter-spacing:0.05em;">${label}</a>
  </div>`;
}

function heading(text: string): string {
  return `<h2 style="margin:0 0 16px;color:#0c3d4a;font-size:20px;font-weight:900;">${text}</h2>`;
}

function paragraph(text: string): string {
  return `<p style="margin:0 0 18px;color:#555;font-size:15px;line-height:1.6;">${text}</p>`;
}

function infoBox(rows: [string, string][], accent: string): string {
  const lines = rows
    .map(([k, v]) => `<p style="margin:0 0 8px;color:#333;font-size:14px;"><strong>${k} :</strong> ${v}</p>`)
    .join("");
  return `<div style="background:#f0f9ff;border:2px solid ${accent};border-radius:12px;padding:20px;margin:0 0 20px;">${lines}</div>`;
}

const SERVICE_LABELS: Record<string, string> = {
  TRANSIT: "Transit", MULTIMODAL: "Transport multimodal", STORAGE: "Stockage",
  MARITIME_CONSIGNMENT: "Consignation maritime", GROUPAGE: "Groupage",
};

// ───────────────────────────── 1. Compte staff créé ─────────────────────────────

export function renderStaffWelcome(opts: {
  name: string; email: string; password: string; role: StaffRole; agencyName?: string | null;
}): { subject: string; html: string } {
  const isManager = opts.role === "MANAGER";
  const space = isManager ? "espace gérant" : "espace agence";
  const accent = isManager ? NAVY : TEAL;
  const rows: [string, string][] = [];
  if (opts.agencyName) rows.push(["Agence", opts.agencyName]);
  rows.push(["Email", opts.email], ["Mot de passe", `<code style="background:#e0f2fe;padding:2px 8px;border-radius:4px;font-family:monospace;">${opts.password}</code>`]);

  const inner =
    heading(`Bienvenue, ${opts.name} !`) +
    paragraph(`Votre compte <strong>${isManager ? "Gérant" : "Agent d'agence"}</strong> EXPAC a été créé. Connectez-vous à votre ${space} avec les identifiants ci-dessous.`) +
    infoBox(rows, accent) +
    paragraph(`🔒 <strong>Important :</strong> changez votre mot de passe dès la première connexion, depuis votre profil.`) +
    button("Se connecter", LOGIN_URL, accent);

  return { subject: `Vos identifiants d'accès — ${space} EXPAC`, html: shell({ accent, preheader: "Votre compte EXPAC est prêt.", inner }) };
}

export async function sendStaffWelcomeEmail(opts: {
  name: string; email: string; password: string; role: StaffRole; agencyName?: string | null;
}): Promise<boolean> {
  const { subject, html } = renderStaffWelcome(opts);
  return sendEmail({ to: opts.email, subject, html });
}

// ───────────────────────────── 2. Bienvenue client ─────────────────────────────

export function renderClientWelcome(opts: { name: string }): { subject: string; html: string } {
  const accent = NAVY;
  const inner =
    heading(`Bienvenue chez EXPAC, ${opts.name} !`) +
    paragraph(`Votre compte client est créé. Depuis votre espace, vous pouvez suivre vos expéditions en temps réel, échanger avec votre agence, déposer vos documents et demander des devis.`) +
    button("Accéder à mon espace", LOGIN_URL, accent);
  return { subject: "Bienvenue chez Express Africa Cargo", html: shell({ accent, preheader: "Votre espace client EXPAC est prêt.", inner }) };
}

export async function sendClientWelcomeEmail(opts: { name: string; email: string }): Promise<boolean> {
  const { subject, html } = renderClientWelcome(opts);
  return sendEmail({ to: opts.email, subject, html });
}

// ───────────────────────────── 3. Accusé de demande de devis ─────────────────────────────

export function renderQuoteAck(opts: {
  name: string; serviceType: string; origin: string; destination: string;
}): { subject: string; html: string } {
  const accent = ORANGE;
  const inner =
    heading("Demande de devis bien reçue") +
    paragraph(`Bonjour ${opts.name}, nous avons bien reçu votre demande de devis. Notre équipe l'étudie et vous répondra sous 48h ouvrées.`) +
    infoBox([
      ["Service", SERVICE_LABELS[opts.serviceType] ?? opts.serviceType],
      ["Trajet", `${opts.origin} → ${opts.destination}`],
    ], accent) +
    paragraph("Vous recevrez notre proposition par email dès qu'elle sera prête.");
  return { subject: "Votre demande de devis EXPAC a bien été reçue", html: shell({ accent, preheader: "Nous avons bien reçu votre demande.", inner }) };
}

export async function sendQuoteAckEmail(opts: {
  name: string; email: string; serviceType: string; origin: string; destination: string;
}): Promise<boolean> {
  const { subject, html } = renderQuoteAck(opts);
  return sendEmail({ to: opts.email, subject, html });
}

// ───────────────────────────── 4. Réponse au devis (récap) ─────────────────────────────

export function renderQuoteResponse(opts: {
  name: string; reference?: string; serviceType: string; origin: string; destination: string;
  cargoType?: string; weight?: number | null; volume?: number | null;
  statusLabel: string; message?: string;
}): { subject: string; html: string } {
  const accent = NAVY;
  const rows: [string, string][] = [
    ["Référence", opts.reference ?? "—"],
    ["Service", SERVICE_LABELS[opts.serviceType] ?? opts.serviceType],
    ["Trajet", `${opts.origin} → ${opts.destination}`],
  ];
  if (opts.cargoType) rows.push(["Marchandise", opts.cargoType]);
  if (opts.weight != null) rows.push(["Poids", `${opts.weight} kg`]);
  if (opts.volume != null) rows.push(["Volume", `${opts.volume} m³`]);
  rows.push(["Statut", opts.statusLabel]);

  const inner =
    heading(`Réponse à votre demande de devis`) +
    paragraph(`Bonjour ${opts.name}, voici le suivi de votre demande de devis.`) +
    infoBox(rows, accent) +
    (opts.message ? paragraph(opts.message) : "") +
    button("Voir dans mon espace", `${SITE}/dashboard/devis`, accent);
  return { subject: `Votre devis EXPAC${opts.reference ? ` — ${opts.reference}` : ""}`, html: shell({ accent, preheader: "Votre devis a été mis à jour.", inner }) };
}

export async function sendQuoteResponseEmail(opts: {
  name: string; email: string; reference?: string; serviceType: string; origin: string; destination: string;
  cargoType?: string; weight?: number | null; volume?: number | null; statusLabel: string; message?: string;
  replyTo?: string;
}): Promise<boolean> {
  const { subject, html } = renderQuoteResponse(opts);
  return sendEmail({ to: opts.email, subject, html, replyTo: opts.replyTo });
}

// ───────────────────────────── 4 bis. Devis chiffré (offre de prix) ─────────────────────────────

function fmtMoney(amount: number, currency: string): string {
  const n = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(Math.round(amount));
  return `${n} ${currency === "XAF" ? "FCFA" : currency}`;
}

/** Envoyé au client quand la société établit le devis (prix fixé). */
export async function sendQuoteOfferEmail(opts: {
  name: string; email: string; reference: string;
  serviceType: string; origin: string; destination: string;
  price: number; currency: string; message?: string | null;
  items?: { label: string; amount: number }[] | null; replyTo?: string;
}): Promise<boolean> {
  const accent = ORANGE;
  const rows: [string, string][] = [
    ["Référence", opts.reference],
    ["Service", SERVICE_LABELS[opts.serviceType] ?? opts.serviceType],
    ["Trajet", `${opts.origin} → ${opts.destination}`],
  ];
  if (opts.items && opts.items.length) {
    for (const it of opts.items) rows.push([it.label, fmtMoney(it.amount, opts.currency)]);
  }
  rows.push(["Montant total", `<strong>${fmtMoney(opts.price, opts.currency)}</strong>`]);
  const inner =
    heading("Votre devis est prêt") +
    paragraph(`Bonjour ${opts.name}, suite à votre demande, voici notre proposition de devis.`) +
    infoBox(rows, accent) +
    (opts.message ? paragraph(opts.message) : "") +
    paragraph("Connectez-vous à votre espace pour <strong>accepter et signer</strong> votre devis en ligne.") +
    button("Voir & accepter mon devis", `${SITE}/dashboard/devis`, accent);
  const html = shell({ accent, preheader: `Votre devis : ${fmtMoney(opts.price, opts.currency)}`, inner });
  return sendEmail({
    to: opts.email,
    subject: `Votre devis EXPAC ${opts.reference} — ${fmtMoney(opts.price, opts.currency)}`,
    html,
    replyTo: opts.replyTo,
  });
}

// ───────────────────────────── 5. Mise à jour de statut d'expédition ─────────────────────────────
// Couvre notamment « colis arrivé à l'agence », « en transit », « livré », etc.

export function renderShipmentStatus(opts: {
  name: string; reference: string; statusLabel: string; location?: string | null; note?: string | null;
}): { subject: string; html: string } {
  const accent = TEAL;
  const rows: [string, string][] = [
    ["Expédition", opts.reference],
    ["Nouveau statut", opts.statusLabel],
  ];
  if (opts.location) rows.push(["Lieu", opts.location]);
  const inner =
    heading("Mise à jour de votre expédition") +
    paragraph(`Bonjour ${opts.name}, le statut de votre expédition <strong>${opts.reference}</strong> vient d'évoluer.`) +
    infoBox(rows, accent) +
    (opts.note ? paragraph(opts.note) : "") +
    button("Suivre mon expédition", `${SITE}/tracking?ref=${encodeURIComponent(opts.reference)}`, accent);
  return { subject: `Expédition ${opts.reference} : ${opts.statusLabel}`, html: shell({ accent, preheader: `Statut : ${opts.statusLabel}`, inner }) };
}

export async function sendShipmentStatusEmail(opts: {
  name: string; email: string; reference: string; statusLabel: string; location?: string | null; note?: string | null;
  replyTo?: string;
}): Promise<boolean> {
  const { subject, html } = renderShipmentStatus(opts);
  return sendEmail({ to: opts.email, subject, html, replyTo: opts.replyTo });
}

// ───────────────────────────── 6. Document partagé ─────────────────────────────

export function renderDocumentShared(opts: {
  name: string; documentName: string; documentType?: string;
}): { subject: string; html: string } {
  const accent = NAVY;
  const rows: [string, string][] = [["Document", opts.documentName]];
  if (opts.documentType) rows.push(["Type", opts.documentType]);
  const inner =
    heading("Un document a été partagé avec vous") +
    paragraph(`Bonjour ${opts.name}, votre agence EXPAC vient de déposer un document dans votre espace.`) +
    infoBox(rows, accent) +
    button("Voir mes documents", `${SITE}/dashboard/documents`, accent);
  return { subject: "Nouveau document disponible — EXPAC", html: shell({ accent, preheader: "Un document vous attend.", inner }) };
}

export async function sendDocumentSharedEmail(opts: {
  name: string; email: string; documentName: string; documentType?: string; replyTo?: string;
}): Promise<boolean> {
  const { subject, html } = renderDocumentShared(opts);
  return sendEmail({ to: opts.email, subject, html, replyTo: opts.replyTo });
}

// ───────────────────────────── 7. Réinitialisation mot de passe (client) ─────────────────────────────

export function renderPasswordReset(opts: { name: string; resetUrl: string }): { subject: string; html: string } {
  const accent = NAVY;
  const inner =
    heading("Réinitialisation de votre mot de passe") +
    paragraph(`Bonjour ${opts.name}, vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous pour en définir un nouveau. Ce lien expire dans 1 heure.`) +
    button("Réinitialiser mon mot de passe", opts.resetUrl, accent) +
    paragraph(`Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet email — votre mot de passe reste inchangé.`);
  return { subject: "Réinitialisation de votre mot de passe — EXPAC", html: shell({ accent, preheader: "Lien de réinitialisation (valable 1h).", inner }) };
}

export async function sendPasswordResetEmail(opts: { name: string; email: string; resetUrl: string }): Promise<boolean> {
  const { subject, html } = renderPasswordReset(opts);
  return sendEmail({ to: opts.email, subject, html });
}

// ── 7 bis. Mot de passe temporaire (client « mot de passe oublié ») ──

export function renderClientTempPassword(opts: { name: string; email: string; password: string }): { subject: string; html: string } {
  const accent = NAVY;
  const inner =
    heading("Votre mot de passe temporaire") +
    paragraph(`Bonjour ${opts.name}, suite à votre demande, voici un mot de passe temporaire pour accéder à votre espace client. Connectez-vous avec, puis <strong>changez-le immédiatement</strong> depuis votre profil.`) +
    infoBox([
      ["Email", opts.email],
      ["Mot de passe temporaire", `<code style="background:#e0f2fe;padding:2px 8px;border-radius:4px;font-family:monospace;">${opts.password}</code>`],
    ], accent) +
    button("Se connecter", LOGIN_URL, accent) +
    paragraph(`Si vous n'êtes pas à l'origine de cette demande, contactez-nous rapidement : votre mot de passe a été modifié.`);
  return { subject: "Votre mot de passe temporaire — EXPAC", html: shell({ accent, preheader: "Mot de passe temporaire (à changer après connexion).", inner }) };
}

export async function sendClientTempPasswordEmail(opts: { name: string; email: string; password: string }): Promise<boolean> {
  const { subject, html } = renderClientTempPassword(opts);
  return sendEmail({ to: opts.email, subject, html });
}

// ───────────────────────────── 8. Reset staff traité (nouveaux identifiants) ─────────────────────────────

export function renderStaffResetProcessed(opts: { name: string; email: string; password: string; role: StaffRole }): { subject: string; html: string } {
  const accent = opts.role === "MANAGER" ? NAVY : TEAL;
  const inner =
    heading("Votre mot de passe a été réinitialisé") +
    paragraph(`Bonjour ${opts.name}, votre demande de réinitialisation a été traitée par l'administrateur. Voici votre nouveau mot de passe temporaire :`) +
    infoBox([
      ["Email", opts.email],
      ["Nouveau mot de passe", `<code style="background:#e0f2fe;padding:2px 8px;border-radius:4px;font-family:monospace;">${opts.password}</code>`],
    ], accent) +
    paragraph(`🔒 Changez-le dès votre prochaine connexion, depuis votre profil.`) +
    button("Se connecter", LOGIN_URL, accent);
  return { subject: "Votre mot de passe EXPAC a été réinitialisé", html: shell({ accent, preheader: "Nouveau mot de passe disponible.", inner }) };
}

export async function sendStaffResetProcessedEmail(opts: { name: string; email: string; password: string; role: StaffRole }): Promise<boolean> {
  const { subject, html } = renderStaffResetProcessed(opts);
  return sendEmail({ to: opts.email, subject, html });
}

// ───────────────────────────── 9. Devis accepté & signé (client) ─────────────────────────────

export function renderQuoteAccepted(opts: {
  name: string; reference: string; serviceType: string; origin: string; destination: string; signedAt: string;
}): { subject: string; html: string } {
  const accent = NAVY;
  const inner =
    heading("Votre acceptation a bien été enregistrée") +
    paragraph(`Bonjour ${opts.name}, nous confirmons l'acceptation et la <strong>signature électronique</strong> de votre devis. Notre équipe revient vers vous pour la suite.`) +
    infoBox([
      ["Référence", opts.reference],
      ["Service", SERVICE_LABELS[opts.serviceType] ?? opts.serviceType],
      ["Trajet", `${opts.origin} → ${opts.destination}`],
      ["Signé le", opts.signedAt],
    ], accent) +
    button("Voir dans mon espace", `${SITE}/dashboard/devis`, accent);
  return { subject: `Devis ${opts.reference} accepté — EXPAC`, html: shell({ accent, preheader: "Acceptation et signature enregistrées.", inner }) };
}

/** Confirmation envoyée au client après acceptation + signature du devis. */
export async function sendQuoteAcceptedEmail(opts: {
  name: string; email: string; reference: string; serviceType: string; origin: string; destination: string; signedAt: string;
}): Promise<boolean> {
  const { subject, html } = renderQuoteAccepted(opts);
  return sendEmail({ to: opts.email, subject, html });
}

/** Notification interne (équipe EXPAC) : un devis vient d'être signé par un client. */
export async function sendQuoteSignedInternalEmail(opts: {
  reference: string; signerName: string; signerEmail: string; serviceType: string; origin: string; destination: string;
}): Promise<boolean> {
  const accent = ORANGE;
  const inner =
    heading("Un devis vient d'être accepté et signé") +
    infoBox([
      ["Référence", opts.reference],
      ["Client", `${opts.signerName} (${opts.signerEmail})`],
      ["Service", SERVICE_LABELS[opts.serviceType] ?? opts.serviceType],
      ["Trajet", `${opts.origin} → ${opts.destination}`],
    ], accent) +
    button("Ouvrir le back-office", `${SITE}/dashboard`, accent);
  const html = shell({ accent, preheader: `Devis ${opts.reference} signé`, inner });
  return sendEmail({ to: FROM_EMAIL, subject: `✍️ Devis ${opts.reference} signé par ${opts.signerName}`, html });
}
