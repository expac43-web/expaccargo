/**
 * Grille tarifaire EXPAC — devis de TRANSIT / DÉDOUANEMENT (Pointe-Noire).
 *
 * Module PUR (client-safe : n'importe aucun secret). Distinct de `lib/tariffs.ts`
 * (qui, lui, estime un fret par trajet origine→destination au kilo).
 *
 * Valeurs = grille « PN 2024 », confirmée inchangée en 2026 par le client.
 * Les DROITS DE DOUANE ne sont PAS dans ce module : ils restent une ligne
 * « débours à l'identique » saisie manuellement, en attendant le barème par
 * code HS que le client fournira — le moteur les additionne comme n'importe
 * quel débours, donc l'automatisation future se branchera sans le modifier.
 */
import { formatPrice } from "./tariffs";

export { formatPrice };

// ───────────────────────────── Taux & constantes ─────────────────────────────

export const TVA_RATE = 0.18;         // TVA sur les prestations
export const CA_RATE = 0.05;          // Centimes additionnels, assis sur la TVA
export const COMMISSION_RATE = 0.035; // Commission sur débours (total préfinancé)
export const FRAIS_OUVERTURE = 40_000; // Frais d'ouverture de dossier (par dossier)
export const ENGAGEMENT_IM5_RATE = 0.01; // Engagement cautionné IM5 = 1 % valeur douane

/**
 * Assiette de la TVA — paramétrable (le client peut changer d'avis) :
 *  - "FULL" (défaut, recommandé) : prestations + frais d'ouverture + commission.
 *  - "PRESTATIONS" : honoraires de prestation uniquement.
 * Dans les deux cas, les débours (avances pass-through) ne sont jamais taxés.
 */
export type TvaBase = "FULL" | "PRESTATIONS";
export const DEFAULT_TVA_BASE: TvaBase = "FULL";

export type Mode = "AERIEN" | "MARITIME";
export type MaritimeType = "CONVENTIONNEL" | "CONTENEUR";
export type ContainerSize = "20" | "40";

// ── Aérien : tranches de poids → forfait par dossier. Au-delà, prix au kilo. ──
export const AERIEN_BRACKETS: { maxKg: number; price: number; label: string }[] = [
  { maxKg: 100, price: 80_000, label: "Jusqu'à 100 kg" },
  { maxKg: 200, price: 120_000, label: "101 à 200 kg" },
  { maxKg: 500, price: 180_000, label: "201 à 500 kg" },
  { maxKg: 750, price: 220_000, label: "501 à 750 kg" },
  { maxKg: 1_000, price: 280_000, label: "751 à 1 000 kg" },
  { maxKg: 1_500, price: 300_000, label: "1 001 à 1 500 kg" },
  { maxKg: 2_000, price: 350_000, label: "1 500 à 2 000 kg" },
];
export const AERIEN_OVER_2000_PER_KG = 180; // au-delà de 2 000 kg

// ── Maritime ──
export const MARITIME_CONV_PER_TONNE = 30_000; // conventionnel : 30 000 F / tonne
export const MARITIME_CONV_MIN = 180_000;       // minimum de facturation / dossier
export const MARITIME_TC_PRICE: Record<ContainerSize, number> = { "20": 300_000, "40": 500_000 };

// Manutention / dépotage (débours maritime) : 12 000 F/T, min 12 T (40') / 6 T (20').
export const MANUTENTION_PER_TONNE = 12_000;
export const MANUTENTION_MIN_TONNES: Record<ContainerSize, number> = { "40": 12, "20": 6 };

// ───────────────────────────── Catalogue des débours fixes ─────────────────────────────

export type DebourFixe = {
  code: string;
  label: string;
  amount: number;        // 0 si calculé (voir percentValeurDouane)
  unit: string;          // base de facturation, à titre indicatif
  modes: Mode[];
  percentValeurDouane?: number; // ex. engagement cautionné IM5 = 1 % de la valeur en douane
};

/** Catalogue « débours fixes » — l'utilisateur coche ceux qui s'appliquent (avec quantité). */
export const DEBOURS_FIXES: DebourFixe[] = [
  { code: "AETEX_SOUS", label: "Souscription AETEX", amount: 80_000, unit: "demande", modes: ["AERIEN", "MARITIME"] },
  { code: "AETEX_ESC", label: "Frais d'escorte AETEX", amount: 20_000, unit: "demande", modes: ["AERIEN"] },
  { code: "TRANSFERT", label: "Frais transfert", amount: 20_000, unit: "demande", modes: ["AERIEN"] },
  { code: "ESC_DECL", label: "Frais d'escorte (IM5, IM7, IM8, EX3)", amount: 30_000, unit: "déclaration", modes: ["AERIEN", "MARITIME"] },
  { code: "ESC_TC", label: "Frais d'escorte TC", amount: 30_000, unit: "TC", modes: ["MARITIME"] },
  { code: "PASSAGE_MAG", label: "Frais passage au magasin", amount: 36_000, unit: "forfait", modes: ["AERIEN"] },
  { code: "MAJ", label: "Frais demande de mise à jour", amount: 20_000, unit: "demande", modes: ["AERIEN", "MARITIME"] },
  { code: "ASSUR_SOUS", label: "Souscription + soumission assurance", amount: 15_000, unit: "document", modes: ["AERIEN", "MARITIME"] },
  { code: "GUOT", label: "Prime d'utilisation plateforme GUOT", amount: 7_000, unit: "document", modes: ["AERIEN", "MARITIME"] },
  { code: "ASSUR_CERT", label: "Frais certification assurance", amount: 5_000, unit: "document", modes: ["AERIEN", "MARITIME"] },
  { code: "DECL_FIXE", label: "Frais fixes déclaration", amount: 15_550, unit: "document", modes: ["AERIEN", "MARITIME"] },
  { code: "SIGN_ATN", label: "Frais signature ATN", amount: 20_000, unit: "document", modes: ["AERIEN"] },
  { code: "SIGN_IM5", label: "Frais signature IM5", amount: 20_000, unit: "demande", modes: ["MARITIME"] },
  { code: "IM5_CAUT", label: "Engagement cautionné IM5 (1 % valeur douane)", amount: 0, unit: "1 % valeur douane", modes: ["AERIEN", "MARITIME"], percentValeurDouane: ENGAGEMENT_IM5_RATE },
  { code: "BE", label: "Bon à Enlever ou à Embarquer (B.E)", amount: 10_000, unit: "LTA", modes: ["AERIEN"] },
  { code: "BE_APUR", label: "Frais apurement B.E", amount: 6_000, unit: "document", modes: ["AERIEN"] },
  { code: "TI_TE", label: "Souscription T.I / T.E", amount: 75_000, unit: "document", modes: ["AERIEN", "MARITIME"] },
  { code: "DI_DE", label: "Souscription D.I / D.E", amount: 30_000, unit: "document", modes: ["AERIEN", "MARITIME"] },
  { code: "VISITE_COM", label: "Frais visite commerce", amount: 20_000, unit: "certificat", modes: ["AERIEN"] },
  { code: "CHG_DEST", label: "Frais changement de destination", amount: 25_000, unit: "demande", modes: ["AERIEN"] },
  { code: "CERT_ORIG", label: "Frais certificat d'origine", amount: 45_000, unit: "document", modes: ["AERIEN"] },
  { code: "BESC_SUIVI", label: "Frais suivi B.E.S.C", amount: 25_000, unit: "dossier", modes: ["MARITIME"] },
  { code: "BESC_EXPORT", label: "Souscription B.E.S.C (export)", amount: 25_000, unit: "document", modes: ["MARITIME"] },
  { code: "BSC_IMPORT", label: "Souscription B.S.C (import)", amount: 25_000, unit: "déclaration", modes: ["MARITIME"] },
  { code: "AUTRES", label: "Autres débours", amount: 90_000, unit: "déclaration", modes: ["AERIEN", "MARITIME"] },
  { code: "DECL_SUP", label: "Déclaration supplémentaire", amount: 30_000, unit: "déclaration", modes: ["AERIEN", "MARITIME"] },
];

/** Débours « à l'identique » (pass-through, coût réel → saisie manuelle) — libellés proposés. */
export const DEBOURS_IDENTIQUE_SUGGESTIONS = [
  "Droits de douane",
  "Assurance locale",
  "Acconage",
  "Magasinage",
  "Ouverture de bureau (jour ouvrable)",
  "Ouverture de bureau (week-end)",
  "Ouverture de bureau (jour férié)",
  "Traitement D.I.",
  "Traitement D.E. + attestation de conformité",
  "Redevance AERCO",
  "Autres débours supplémentaires",
];

// ───────────────────────────── Prestations (honoraires) ─────────────────────────────

/** Honoraire de prestation en aérien (par tranche de poids ; au-delà de 2 t, au kilo). */
export function prestationAerien(weightKg: number): number {
  const w = Number.isFinite(weightKg) && weightKg > 0 ? weightKg : 0;
  if (w > 2_000) return Math.round(w * AERIEN_OVER_2000_PER_KG);
  const bracket = AERIEN_BRACKETS.find((b) => w <= b.maxKg);
  return bracket ? bracket.price : AERIEN_BRACKETS[0].price;
}

/** Honoraire de prestation en maritime conventionnel (30 000 F/T, min 180 000/dossier). */
export function prestationConventionnel(tonnes: number): number {
  const t = Number.isFinite(tonnes) && tonnes > 0 ? tonnes : 0;
  return Math.max(MARITIME_CONV_MIN, Math.round(t * MARITIME_CONV_PER_TONNE));
}

/** Honoraire de prestation en maritime conteneur (40' = 500 000, 20' = 300 000). */
export function prestationConteneur(tc20: number, tc40: number): number {
  const n20 = Math.max(0, Math.floor(tc20 || 0));
  const n40 = Math.max(0, Math.floor(tc40 || 0));
  return n20 * MARITIME_TC_PRICE["20"] + n40 * MARITIME_TC_PRICE["40"];
}

/** Coût de manutention / dépotage maritime (12 000 F/T avec minimum selon la taille du TC). */
export function manutention(size: ContainerSize, tonnes: number): number {
  const t = Math.max(MANUTENTION_MIN_TONNES[size], Number.isFinite(tonnes) && tonnes > 0 ? tonnes : 0);
  return Math.round(t * MANUTENTION_PER_TONNE);
}

// ───────────────────────────── Calcul complet d'un devis ─────────────────────────────

export type DevisLine = { label: string; amount: number };

export type DevisInput = {
  mode: Mode;
  // Aérien
  weightKg?: number;
  // Maritime
  maritimeType?: MaritimeType;
  tonnes?: number;
  tc20?: number;
  tc40?: number;
  // Débours déjà résolus en montants par l'appelant (le %valeur-douane est calculé côté UI)
  deboursFixes?: DevisLine[];
  deboursIdentique?: DevisLine[]; // inclut les droits de douane (manuel, pour l'instant)
  includeFraisOuverture?: boolean; // défaut : true
  tvaBase?: TvaBase;               // défaut : DEFAULT_TVA_BASE
};

export type DevisResult = {
  prestations: number;         // honoraires de prestation (hors ouverture & commission)
  fraisOuverture: number;
  deboursFixesTotal: number;
  deboursIdentiqueTotal: number;
  deboursTotal: number;        // total préfinancé (assiette de la commission)
  commission: number;          // 3,5 % des débours
  remuneration: number;        // rémunération EXPAC = prestations + ouverture + commission
  baseTaxable: number;         // assiette de la TVA (selon tvaBase)
  tva: number;                 // 18 % de l'assiette
  ca: number;                  // 5 % de la TVA
  totalHT: number;             // rémunération + débours (hors taxes)
  totalTTC: number;            // total HT + TVA + CA
};

/**
 * Calcul d'un devis de transit à partir de la grille.
 *
 * Hypothèses (à confirmer avec le client — voir la conversation) :
 *  - Assiette de la TVA = prestations + frais d'ouverture + commission (revenus EXPAC).
 *  - Les débours (fixes + à l'identique) sont des avances pass-through : NON soumis à
 *    la TVA d'EXPAC ; ils s'ajoutent tels quels au total.
 *  - La commission de 3,5 % porte sur le total des débours préfinancés.
 */
export function computeDevis(input: DevisInput): DevisResult {
  let prestations = 0;
  if (input.mode === "AERIEN") {
    prestations = prestationAerien(input.weightKg ?? 0);
  } else if (input.maritimeType === "CONTENEUR") {
    prestations = prestationConteneur(input.tc20 ?? 0, input.tc40 ?? 0);
  } else {
    prestations = prestationConventionnel(input.tonnes ?? 0);
  }

  const fraisOuverture = input.includeFraisOuverture === false ? 0 : FRAIS_OUVERTURE;

  const sum = (lines?: DevisLine[]) =>
    (lines ?? []).reduce((acc, l) => acc + (Number.isFinite(l.amount) ? l.amount : 0), 0);
  const deboursFixesTotal = sum(input.deboursFixes);
  const deboursIdentiqueTotal = sum(input.deboursIdentique);
  const deboursTotal = deboursFixesTotal + deboursIdentiqueTotal;

  const commission = Math.round(deboursTotal * COMMISSION_RATE);
  const remuneration = prestations + fraisOuverture + commission; // toujours (totaux)
  // L'assiette de la TVA dépend du paramètre choisi ; les débours restent hors champ.
  const baseTaxable = (input.tvaBase ?? DEFAULT_TVA_BASE) === "PRESTATIONS" ? prestations : remuneration;
  const tva = Math.round(baseTaxable * TVA_RATE);
  const ca = Math.round(tva * CA_RATE);
  const totalHT = remuneration + deboursTotal;
  const totalTTC = totalHT + tva + ca;

  return {
    prestations, fraisOuverture,
    deboursFixesTotal, deboursIdentiqueTotal, deboursTotal,
    commission, remuneration, baseTaxable, tva, ca, totalHT, totalTTC,
  };
}
