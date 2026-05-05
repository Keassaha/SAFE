/**
 * SAFE — Présentation canonique d'une facture (phase 1 de la refonte facturation).
 *
 * Source unique d'affichage utilisée par :
 *   - l'éditeur de facture
 *   - l'aperçu interne
 *   - la page publique client (/facture/[token])
 *   - le PDF officiel (lib/services/billing/invoice-pdf.ts)
 *   - le courriel d'accompagnement (sujet, métadonnées, log d'envoi)
 *
 * Règle clé pour cette phase :
 *   Le pipeline canonique est `InvoiceLine`, mais les rabais legacy stockés
 *   dans `InvoiceItem` doivent rester visibles tant que la migration des
 *   rabais vers `InvoiceLine` n'est pas terminée. Le presenter convertit
 *   donc les `InvoiceItem(type=rabais)` en lignes de présentation
 *   `type: "rabais"` avec montant négatif et raison libre.
 *
 * Les totaux ne sont PAS recalculés ici : on lit `Invoice.subtotalTaxable`,
 * `tps`, `tvq`, `montantTotal`, etc. déjà persistés par `recalculateInvoiceTotals`.
 * Le presenter n'invente pas de logique fiscale : c'est un projecteur, pas
 * un moteur.
 */

import type {
  Invoice,
  InvoiceLine,
  InvoiceItem,
  Client,
  Cabinet,
  Dossier,
  TimeEntry,
  User,
} from "@prisma/client";
import { parseCabinetConfig, getCabinetTaxNumbers } from "@/lib/cabinet-config";

/**
 * Lit les numéros de taxes du cabinet depuis le JSON `Cabinet.config`.
 * Doctrine : ces numéros sont obligatoires sur une facture canadienne
 * lorsque le cabinet collecte des taxes.
 */
function extractTaxNumbers(rawConfig: string | null) {
  const taxes = getCabinetTaxNumbers(parseCabinetConfig(rawConfig));
  return {
    hstNumber: taxes.hstNumber ?? null,
    gstNumber: taxes.gstNumber ?? null,
    qstNumber: taxes.qstNumber ?? null,
    businessNumber: taxes.businessNumber ?? null,
  };
}

export type PresentedLineType =
  | "honoraires"
  | "debours_taxable"
  | "debours_non_taxable"
  | "frais_rappel"
  | "interets"
  | "rabais"
  | "ajustement";

export interface PresentedLine {
  /** Identifiant stable pour key React (préfixé selon la source). */
  id: string;
  /** Type sémantique pour le rendu (rabais → ligne négative, honoraires → ligne d'honoraires…). */
  type: PresentedLineType;
  /** Description visible sur la facture. Pour un rabais : "Rabais — [raison]" si raison. */
  description: string;
  /** Date affichée (ISO string ou Date). */
  date: string | Date;
  /** Heures (mode horaire seulement). null si forfait ou rabais simple. */
  hours: number | null;
  /** Taux horaire. null hors mode horaire. */
  rate: number | null;
  /** Montant brut (positif pour honoraires/débours, négatif pour rabais). */
  amount: number;
  /** Nom de l'avocat/professionnel responsable, si applicable. */
  userNom: string | null;
  /** Si rabais : id de la ligne parente (rabais ciblé) ou null (rabais global). */
  parentLineId: string | null;
  /** Source brute dans la base : utile pour tests, debug, audit. */
  source: "invoice_line" | "invoice_item";
}

export interface PresentedClient {
  id: string;
  raisonSociale: string | null;
  prenom: string | null;
  nom: string | null;
  typeClient: string;
  email: string | null;
  billingAddress: string | null;
  billingCity: string | null;
  billingProvince: string | null;
  billingPostalCode: string | null;
  billingCountry: string | null;
}

export interface PresentedCabinet {
  id: string;
  nom: string;
  adresse: string | null;
  telephone: string | null;
  email: string | null;
  /** N° d'avocat·e (LSO en Ontario, Barreau du Québec, etc.). */
  barreauNumero: string | null;
  /** Logo URL (https). */
  logoUrl: string | null;
  /** Numéros d'inscription fiscaux (HST/GST/QST + n° d'entreprise CRA). */
  taxNumbers: {
    hstNumber: string | null;
    gstNumber: string | null;
    qstNumber: string | null;
    businessNumber: string | null;
  };
}

export interface PresentedDossier {
  id: string;
  intitule: string;
  numeroDossier: string | null;
  /** Le mode de facturation du dossier influe sur le rendu (forfait → pas de heures × taux). */
  modeFacturation: string | null;
}

export interface PresentedInvoice {
  id: string;
  numero: string;
  dateEmission: Date;
  dateEcheance: Date;
  statut: string;
  invoiceStatus: string | null;
  currency: string;
  cabinet: PresentedCabinet | null;
  client: PresentedClient | null;
  dossier: PresentedDossier | null;
  lines: PresentedLine[];
  /** True si le dossier est au forfait : le rendu ne doit pas montrer heures × taux comme principal. */
  isForfait: boolean;
  totals: {
    subtotalTaxable: number;
    tps: number;
    tvq: number;
    deboursNonTaxableTotal: number;
    montantTotal: number;
    montantPaye: number;
    balanceDue: number;
    /** Somme absolue des rabais affichés (informational). */
    totalRabais: number;
  };
  clientNote: string | null;
  /** True si la facture est verrouillée (ISSUED ou plus tard). */
  isLocked: boolean;
}

/** Données Prisma minimales nécessaires au presenter.
 *
 * `logoUrl` et `config` sont optionnels pour rester rétro-compatible avec
 * les anciens callers qui ne sélectionnaient pas ces colonnes. Les nouveaux
 * appelants devraient les inclure pour bénéficier des n° de taxes.
 */
export type PresenterInput = Invoice & {
  cabinet?:
    | (Pick<Cabinet, "id" | "nom" | "adresse" | "telephone" | "email" | "barreauNumero"> &
        Partial<Pick<Cabinet, "logoUrl" | "config">>)
    | null;
  client?:
    | (Pick<
        Client,
        | "id"
        | "raisonSociale"
        | "prenom"
        | "nom"
        | "typeClient"
        | "email"
        | "billingAddress"
        | "billingCity"
        | "billingProvince"
        | "billingPostalCode"
        | "billingCountry"
      > | null);
  dossier?:
    | (Pick<Dossier, "id" | "intitule" | "numeroDossier" | "modeFacturation"> | null);
  invoiceLines: Array<
    InvoiceLine & {
      timeEntry?: (TimeEntry & { user?: Pick<User, "nom"> | null }) | null;
    }
  >;
  invoiceItems: Array<
    InvoiceItem & {
      user?: Pick<User, "nom"> | null;
    }
  >;
};

/** Converti un `InvoiceLineType` Prisma en `PresentedLineType`. */
function mapLineType(line: InvoiceLine): PresentedLineType {
  // Une ligne `adjustment` est un rabais si elle a une raison, un parent,
  // un montant négatif, ou une description qui commence par "Rabais".
  if (line.lineType === "adjustment") {
    const isRabais =
      Boolean(line.parentLineId) ||
      Boolean(line.discountReason) ||
      (line.lineSubtotal ?? line.montant) < 0 ||
      /^rabais\b/i.test(line.description ?? "");
    return isRabais ? "rabais" : "ajustement";
  }
  switch (line.lineType) {
    case "fee":
      return "honoraires";
    case "expense":
      return line.taxable === false ? "debours_non_taxable" : "debours_taxable";
    case "interest":
      return "interets";
    case "credit":
      return "rabais";
    case "trust_application":
      return "ajustement";
    default:
      return "honoraires";
  }
}

/**
 * Format final affichable d'une ligne de rabais :
 *  - raison explicite fournie  → "Rabais — [raison]"
 *  - description legacy déjà au format "Rabais — XYZ" → conservée telle quelle
 *  - description legacy "Rabais" tout court → "Rabais"
 *  - description legacy autre (ex. "Courtoisie 10%")  → "Rabais — Courtoisie 10%"
 */
function buildRabaisDescription(reason: string | null | undefined, fallback: string): string {
  const cleanReason = reason?.trim();
  if (cleanReason) return `Rabais — ${cleanReason}`;
  const fallbackTrim = (fallback ?? "").trim();
  if (!fallbackTrim) return "Rabais";
  if (/^rabais\s*$/i.test(fallbackTrim)) return "Rabais";
  // Préfixé "Rabais — ..." ou "Rabais - ..." ou "Rabais : ..." → on conserve la forme existante.
  if (/^rabais\s*[—\-:]\s*\S/i.test(fallbackTrim)) return fallbackTrim;
  return `Rabais — ${fallbackTrim}`;
}

/**
 * Construit le modèle de présentation canonique à partir des données Prisma brutes.
 */
export function presentInvoice(invoice: PresenterInput): PresentedInvoice {
  const isForfait = invoice.dossier?.modeFacturation === "forfait";

  // 1. Lignes canoniques venant de InvoiceLine.
  const linesFromInvoiceLine: PresentedLine[] = (invoice.invoiceLines ?? [])
    .slice()
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((line) => {
      const presentedType = mapLineType(line);
      const amount = line.lineSubtotal ?? line.montant;
      const isRabais = presentedType === "rabais";
      const description = isRabais
        ? buildRabaisDescription(line.discountReason, line.description)
        : line.description;
      // En mode forfait, on ne projette pas heures × taux comme rendu principal :
      // les fiches de temps internes restent dans la donnée (quantite/taux) mais
      // ne doivent pas devenir un service horaire client. Une ligne d'honoraires
      // au forfait est typiquement quantite=1, taux=montant : on masque.
      const showHourly = !isForfait && presentedType === "honoraires" && line.lineType === "fee";
      return {
        id: `line:${line.id}`,
        type: presentedType,
        description,
        date: line.serviceDate ?? line.createdAt,
        hours: showHourly ? line.quantite : null,
        rate: showHourly ? line.tauxUnitaire : null,
        amount: isRabais ? -Math.abs(amount) : amount,
        userNom: line.timeEntry?.user?.nom ?? null,
        parentLineId: line.parentLineId ?? null,
        source: "invoice_line",
      };
    });

  // 2. Lignes legacy InvoiceItem — incluent honoraires manuels, débours, frais, intérêts ET rabais.
  //    Les rabais y vivent encore tant que la migration n'est pas finie : on les convertit en
  //    PresentedLine type "rabais" avec montant négatif et raison.
  const linesFromInvoiceItem: PresentedLine[] = (invoice.invoiceItems ?? []).map((item) => {
    const isRabais = item.type === "rabais";
    const amount = item.amount;
    const description = isRabais
      ? buildRabaisDescription(/* legacy n'a pas de discountReason */ null, item.description)
      : item.description;
    const showHourly =
      !isForfait && item.type === "honoraires" && item.hours != null && item.rate != null;
    return {
      id: `item:${item.id}`,
      type: (isRabais ? "rabais" : (item.type as PresentedLineType)) ?? "honoraires",
      description,
      date: item.date,
      hours: showHourly ? item.hours : null,
      rate: showHourly ? item.rate : null,
      amount: isRabais ? -Math.abs(amount) : amount,
      userNom: item.professionalDisplayName ?? item.user?.nom ?? null,
      parentLineId: item.parentLineId ?? null,
      source: "invoice_item",
    };
  });

  const lines = [...linesFromInvoiceLine, ...linesFromInvoiceItem];
  const totalRabais = lines
    .filter((l) => l.type === "rabais")
    .reduce((s, l) => s + Math.abs(l.amount), 0);

  // 3. Statut verrouillé : facture émise ou plus.
  const lockedStatuses = new Set([
    "ISSUED",
    "PARTIALLY_PAID",
    "PAID",
    "OVERDUE",
    "CANCELLED",
    "CREDITED",
  ]);
  const isLocked = invoice.invoiceStatus
    ? lockedStatuses.has(invoice.invoiceStatus)
    : invoice.statut !== "brouillon";

  return {
    id: invoice.id,
    numero: invoice.numero,
    dateEmission: invoice.dateEmission,
    dateEcheance: invoice.dateEcheance,
    statut: invoice.statut,
    invoiceStatus: invoice.invoiceStatus ?? null,
    currency: invoice.currency ?? "CAD",
    cabinet: invoice.cabinet
      ? {
          id: invoice.cabinet.id,
          nom: invoice.cabinet.nom,
          adresse: invoice.cabinet.adresse ?? null,
          telephone: invoice.cabinet.telephone ?? null,
          email: invoice.cabinet.email ?? null,
          barreauNumero: invoice.cabinet.barreauNumero ?? null,
          logoUrl: invoice.cabinet.logoUrl ?? null,
          taxNumbers: extractTaxNumbers(invoice.cabinet.config ?? null),
        }
      : null,
    client: invoice.client
      ? {
          id: invoice.client.id,
          raisonSociale: invoice.client.raisonSociale ?? null,
          prenom: invoice.client.prenom ?? null,
          nom: invoice.client.nom ?? null,
          typeClient: invoice.client.typeClient,
          email: invoice.client.email ?? null,
          billingAddress: invoice.client.billingAddress ?? null,
          billingCity: invoice.client.billingCity ?? null,
          billingProvince: invoice.client.billingProvince ?? null,
          billingPostalCode: invoice.client.billingPostalCode ?? null,
          billingCountry: invoice.client.billingCountry ?? null,
        }
      : null,
    dossier: invoice.dossier
      ? {
          id: invoice.dossier.id,
          intitule: invoice.dossier.intitule,
          numeroDossier: invoice.dossier.numeroDossier ?? null,
          modeFacturation: invoice.dossier.modeFacturation ?? null,
        }
      : null,
    lines,
    isForfait,
    totals: {
      subtotalTaxable: invoice.subtotalTaxable ?? 0,
      tps: invoice.tps ?? 0,
      tvq: invoice.tvq ?? 0,
      deboursNonTaxableTotal: invoice.deboursNonTaxableTotal ?? 0,
      montantTotal: invoice.montantTotal ?? 0,
      montantPaye: invoice.montantPaye ?? 0,
      balanceDue: invoice.balanceDue ?? 0,
      totalRabais,
    },
    clientNote: invoice.clientNote ?? null,
    isLocked,
  };
}

/** Format affichable du nom du client (utilisé par sujet de courriel + PDF). */
export function presentClientDisplayName(client: PresentedClient | null): string {
  if (!client) return "Client";
  if (client.typeClient === "personne_physique") {
    const full = [client.prenom, client.nom].filter(Boolean).join(" ").trim();
    if (full) return full;
  }
  return client.raisonSociale?.trim() || "Client";
}
