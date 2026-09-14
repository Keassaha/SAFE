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
import {
  parseCabinetConfig,
  getCabinetTaxNumbers,
  getCabinetInvoiceConfig,
  type CabinetInvoiceTemplate,
} from "@/lib/cabinet-config";
import { toDisplayTaxes } from "@/lib/billing/taxes";
import type { CabinetTaxConfig, TaxMode } from "@/lib/billing/types";

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

/**
 * Lit le modèle de facture + le bloc N.B. configurés pour le cabinet.
 * Permet de rendre une facture propre au cabinet (ex. Derisier) sans
 * coder de logique métier dans le composant PDF.
 */
function extractInvoiceTemplate(rawConfig: string | null) {
  const inv = getCabinetInvoiceConfig(parseCabinetConfig(rawConfig));
  return {
    template: inv.template,
    notice: inv.notice,
    signature: inv.signature,
    accentColor: inv.accentColor,
  };
}

/** Comment le prix d'une ligne d'honoraires a été formé. */
export type LineBasis = "horaire" | "forfait";

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
  /**
   * @deprecated Employer `quantite`. Conservé le temps que les gabarits HTML
   * historiques migrent ; porte exactement la même valeur.
   */
  hours: number | null;
  /** @deprecated Employer `taux`. */
  rate: number | null;
  /**
   * Ce qui est compté sur la ligne : des heures en mode horaire, un nombre
   * d'unités au forfait. Vient de `InvoiceLine.quantite`, qui l'a toujours porté.
   *
   * Jusqu'au 2026-09-14, ce champ était mis à `null` dès que le DOSSIER était au
   * forfait : une facture au forfait perdait alors ses deux colonnes, et le
   * client ne voyait aucun prix unitaire. Une heure travaillée sur un dossier au
   * forfait perdait son taux pour la même raison. Demande CEO du 2026-09-14.
   */
  quantite: number | null;
  /** Le prix de l'unité : le taux horaire, ou le montant du forfait. */
  taux: number | null;
  /**
   * D'où vient le prix de cette ligne. Sert au document à séparer les deux
   * familles sur une facture mixte, et il se lit sur la LIGNE, non sur le mode
   * du dossier : une facture porte parfois les deux.
   *
   * `null` sur ce qui n'est pas un honoraire (débours, rabais, intérêts).
   */
  basis: LineBasis | null;
  /** Montant brut (positif pour honoraires/débours, négatif pour rabais). */
  amount: number;
  /** Nom de l'avocat/professionnel responsable, si applicable. */
  userNom: string | null;
  /** Si rabais : id de la ligne parente (rabais ciblé) ou null (rabais global). */
  parentLineId: string | null;
  /** Source brute dans la base : utile pour tests, debug, audit. */
  source: "invoice_line" | "invoice_item";
}


/* ── Ordre chronologique des lignes ────────────────────────────────────────── */

const tempsDe = (d: string | Date | null | undefined): number | null => {
  if (!d) return null;
  const t = d instanceof Date ? d.getTime() : new Date(d).getTime();
  return Number.isFinite(t) ? t : null;
};

/**
 * Remet les lignes dans l'ordre où le travail a été fait.
 *
 * POURQUOI CE TRI EXISTE
 *
 * Les lignes étaient rendues dans l'ordre de `sortOrder`, lui-même attribué en deux
 * passes à la création : TOUTES les prestations, puis TOUS les débours, chacun dans
 * l'ordre non déterministe que renvoyait la base faute d'`orderBy`.
 *
 * Sur une facture qui mêle honoraires et débours, le client lisait donc une suite de
 * dates qui montait, retombait, puis remontait. Une facture d'avocat se lit comme un
 * récit du dossier : si les dates sautent, le client cherche l'erreur au lieu de lire
 * le travail.
 *
 * TROIS RÈGLES, DANS CET ORDRE
 *
 * 1. Un rabais CIBLÉ colle à sa ligne parente. Le détacher pour le ranger à sa
 *    propre date rendrait illisible ce qu'il vient réduire.
 * 2. Le reste se trie par date croissante, à égalité l'ordre d'origine est conservé.
 * 3. Ce qui n'a pas de date passe en fin : une ligne sans date n'a pas de place dans
 *    une chronologie, et l'inventer en tête serait pire que de l'y laisser.
 *
 * Les rabais GLOBAUX ferment la facture : ils portent sur l'ensemble, pas sur un jour.
 */
export function ordonnerChronologiquement(lignes: PresentedLine[]): PresentedLine[] {
  const parPosition = new Map(lignes.map((l, i) => [l.id, i]));

  const cibles = new Map<string, PresentedLine[]>();
  const globales: PresentedLine[] = [];
  const principales: PresentedLine[] = [];

  for (const l of lignes) {
    if (l.parentLineId) {
      const groupe = cibles.get(l.parentLineId) ?? [];
      groupe.push(l);
      cibles.set(l.parentLineId, groupe);
    } else if (l.type === "rabais") {
      globales.push(l);
    } else {
      principales.push(l);
    }
  }

  principales.sort((a, b) => {
    const ta = tempsDe(a.date);
    const tb = tempsDe(b.date);
    if (ta == null && tb == null) return (parPosition.get(a.id) ?? 0) - (parPosition.get(b.id) ?? 0);
    if (ta == null) return 1;
    if (tb == null) return -1;
    if (ta !== tb) return ta - tb;
    // À date égale, l'ordre de saisie fait foi : deux prestations du même jour se
    // suivent comme elles ont été enregistrées.
    return (parPosition.get(a.id) ?? 0) - (parPosition.get(b.id) ?? 0);
  });

  const out: PresentedLine[] = [];
  for (const l of principales) {
    out.push(l);
    for (const rabais of cibles.get(l.id) ?? []) out.push(rabais);
  }
  // Un rabais dont la ligne parente a disparu ne doit pas disparaître avec elle.
  for (const [parentId, groupe] of cibles) {
    if (!principales.some((l) => l.id === parentId)) out.push(...groupe);
  }
  return [...out, ...globales];
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
  /** Modèle visuel de facture ("standard" ou variante propre au cabinet). */
  invoiceTemplate: CabinetInvoiceTemplate;
  /** Bloc N.B. (mentions + instructions de paiement) bilingue, propre au cabinet. */
  invoiceNotice: { fr: string[]; en: string[] };
  /**
   * Signature reproduite (nom + titre bilingue) à afficher en bas de facture.
   * `null` si le cabinet n'a pas configuré de signature. L'affichage reste
   * conditionné par une option « par facture » côté éditeur.
   */
  invoiceSignature: { name: string; title: { fr: string; en: string } } | null;
  /**
   * Couleur d'accent (hex « #rrggbb ») de la facture du cabinet. Sert au
   * bandeau, à l'en-tête de tableau et à l'encadré TOTAL. Toujours défini
   * (défaut marron Derisier) ; les teintes dérivées sont calculées au rendu.
   */
  invoiceAccentColor: string;
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
  invoiceStatus: Invoice["invoiceStatus"];
  paymentStatus: Invoice["paymentStatus"];
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
    /** TVH (Ontario/Atlantique). > 0 → le gabarit affiche « TVH » au lieu de TPS/TVQ. */
    hst: number;
    /**
     * Régime de taxe du CABINET (pilote l'affichage TPS/TVQ vs TVH). Dérivé du
     * mode de taxe du cabinet, JAMAIS de la province du client : une facture
     * d'un cabinet QC reste en TPS/TVQ même pour un client domicilié hors-QC.
     */
    taxRegime: "HST" | "GST_QST" | "GST_ONLY";
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
 * Régime de taxe à AFFICHER, dérivé du mode de taxe du CABINET (jamais de la
 * province du client). Repli sur l'inférence par montants si le mode est absent.
 */
function resolveTaxRegime(
  mode: TaxMode | undefined,
  display: { tps: number; tvq: number; hst: number },
): "HST" | "GST_QST" | "GST_ONLY" {
  switch (mode) {
    case "hst":
      return "HST";
    case "tps_tvq":
      return "GST_QST";
    case "tps_only":
    case "tps_pst":
    case "tps_rst":
    case "none":
      return "GST_ONLY";
    default:
      if (display.hst > 0) return "HST";
      if (display.tvq > 0) return "GST_QST";
      return "GST_ONLY";
  }
}

/**
 * Construit le modèle de présentation canonique à partir des données Prisma brutes.
 */
export function presentInvoice(
  invoice: PresenterInput,
  /**
   * Régime de taxes du cabinet. Si fourni en mode `hst`, le total stocké dans
   * `tps`/`tvq` est ré-exposé comme `hst` pour que le gabarit affiche « TVH ».
   * Si omis → comportement historique (TPS/TVQ tels quels).
   */
  taxConfig?: CabinetTaxConfig,
): PresentedInvoice {
  const isForfait = invoice.dossier?.modeFacturation === "forfait";
  const displayTaxes = toDisplayTaxes(
    invoice.tps ?? 0,
    invoice.tvq ?? 0,
    taxConfig?.mode ?? "tps_tvq",
  );
  const taxRegime = resolveTaxRegime(taxConfig?.mode, displayTaxes);

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
      /* La quantité et le taux se montrent sur toute ligne d'honoraires, quel
         que soit le mode du dossier. Un forfait vaut quantité 1 (ou N) au prix
         du forfait ; le client a le droit de le lire. Ils restent nuls sur ce
         qui n'est pas un honoraire : un débours a son propre tableau, sans
         colonne de quantité. */
      const estHonoraire = presentedType === "honoraires" && line.lineType === "fee";
      /* Le prix vient d'un temps saisi, ou d'un forfait. La source de la ligne
         le dit sans ambiguïté ; le rattachement à une fiche de temps tranche
         les lignes anciennes qui n'ont pas de `sourceType`. */
      const basis: LineBasis | null = !estHonoraire
        ? null
        : line.sourceType === "time_entry" || line.timeEntryId
          ? "horaire"
          : line.sourceType === "registre_tache"
            ? "forfait"
            : isForfait
              ? "forfait"
              : "horaire";
      const quantite = estHonoraire ? line.quantite : null;
      const taux = estHonoraire ? line.tauxUnitaire : null;
      return {
        id: `line:${line.id}`,
        type: presentedType,
        description,
        date: line.serviceDate ?? line.createdAt,
        hours: quantite,
        rate: taux,
        quantite,
        taux,
        basis,
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
    const estHonoraire = item.type === "honoraires";
    /* Une ligne héritée n'a pas de `sourceType` : des heures réelles disent
       l'horaire, leur absence dit le forfait. */
    const aDesHeures = item.hours != null && item.hours > 0 && item.rate != null;
    const basis: LineBasis | null = !estHonoraire
      ? null
      : aDesHeures
        ? "horaire"
        : "forfait";
    const quantite = estHonoraire ? (item.hours ?? (basis === "forfait" ? 1 : null)) : null;
    const taux = estHonoraire ? (item.rate ?? (basis === "forfait" ? amount : null)) : null;
    return {
      id: `item:${item.id}`,
      type: (isRabais ? "rabais" : (item.type as PresentedLineType)) ?? "honoraires",
      description,
      date: item.date,
      hours: quantite,
      rate: taux,
      quantite,
      taux,
      basis,
      amount: isRabais ? -Math.abs(amount) : amount,
      userNom: item.professionalDisplayName ?? item.user?.nom ?? null,
      parentLineId: item.parentLineId ?? null,
      source: "invoice_item",
    };
  });

  const lines = ordonnerChronologiquement([...linesFromInvoiceLine, ...linesFromInvoiceItem]);
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
    paymentStatus: invoice.paymentStatus ?? null,
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
          invoiceTemplate: extractInvoiceTemplate(invoice.cabinet.config ?? null).template,
          invoiceNotice: extractInvoiceTemplate(invoice.cabinet.config ?? null).notice,
          invoiceSignature: extractInvoiceTemplate(invoice.cabinet.config ?? null).signature,
          invoiceAccentColor: extractInvoiceTemplate(invoice.cabinet.config ?? null).accentColor,
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
      tps: displayTaxes.tps,
      tvq: displayTaxes.tvq,
      hst: displayTaxes.hst,
      taxRegime,
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
