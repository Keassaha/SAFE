"use client";
import { useFormatteurs } from "@/lib/i18n/formatteurs";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card } from "@/components/ui/Card";
import { routes } from "@/lib/routes";
import { useLocale, useTranslations } from "next-intl";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { InvoicePreview } from "@/lib/invoice-template/InvoicePreview";
import type {
  PresentedInvoice,
  PresentedLine,
} from "@/lib/services/billing/invoice-presenter";
import {
  parseCabinetConfig,
  getCabinetTaxNumbers,
  getCabinetInvoiceConfig,
} from "@/lib/cabinet-config";
import { resoudreTauxHoraire } from "@/lib/temps/taux-horaire";
import {
  calculerSousTotaux,
  estDebours,
  estHonoraire,
  estRabais,
} from "@/lib/facturation/preparation-lignes";
import {
  applyTaxes,
  toInvoiceTaxColumns,
  toDisplayTaxes,
  getDefaultTaxConfig,
} from "@/lib/billing/taxes";
import type { CabinetTaxConfig } from "@/lib/billing/types";
import {
  ArrowLeft,
  Plus,
  Trash2,
  CalendarDays,
  ChevronDown,
  Pencil,
  User as UserIcon,
  AlertCircle,
  Percent,
  Receipt,
  RotateCcw,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type DueDatePreset = "3" | "7" | "14" | "30" | "custom";

interface LineItem {
  id: string;
  sourceId?: string | null;
  sourceType?: "manual" | "time_entry" | "expense" | "registre_tache" | "debours";
  description: string;
  date: string;
  hours: number;
  rate: number;
  amount: number;
  type: string;
  /** Only used in forfait mode — links the line to the catalog entry */
  forfaitServiceId?: string | null;
  /** Responsable de la tâche (avocat·e). */
  responsableUserId: string | null;
  responsableNom: string | null;
  taxable?: boolean;
  dossierLabel?: string | null;
  montantBase?: number;
  ajustement?: number;
  rabais?: number;
  rabaisRaison?: string | null;
}

export interface UserLite {
  id: string;
  nom: string;
  /** Ce que le client paie pour une heure de cette personne. */
  defaultHourlyRate?: number | null;
}

/** Extracts initials from a lawyer's name, stripping "Me" prefix. Ex: "Me M.-A. Derisier" → "MD" */
function initialsOf(fullName: string | null | undefined): string {
  if (!fullName) return "";
  return fullName
    .replace(/^Me\.?\s+/i, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((token) => token.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ]/g, "").charAt(0))
    .filter(Boolean)
    .join("")
    .toUpperCase();
}

export interface ForfaitServiceLite {
  id: string;
  code: string;
  nom: string;
  description: string | null;
  montant: number;
  categorie: string | null;
  sousType: string | null;
  taxable: boolean;
}

interface CabinetInfo {
  nom: string;
  adresse?: string | null;
  telephone?: string | null;
  email?: string | null;
  barreauNumero?: string | null;
  logoUrl?: string | null;
  config?: string | null;
}

interface ClientDossierLite {
  id: string;
  intitule: string;
  numeroDossier: string | null;
  reference: string | null;
  /** Taux négocié pour ce mandat ; prime sur celui de l'avocat. */
  tauxHoraire?: number | null;
}

interface ClientInfo {
  id: string;
  typeClient?: string | null;
  raisonSociale: string | null;
  prenom?: string | null;
  nom?: string | null;
  billingAddress?: string | null;
  billingCity?: string | null;
  billingProvince?: string | null;
  billingPostalCode?: string | null;
  billingCountry?: string | null;
  telephone?: string | null;
  email?: string | null;
  dossiers?: ClientDossierLite[];
}

/** Display label for a client option/picker — handles morale + physique uniformly. */
function clientDisplayName(
  c: Pick<ClientInfo, "typeClient" | "raisonSociale" | "prenom" | "nom">,
): string {
  if (c.typeClient === "personne_physique") {
    const composed = [c.prenom, c.nom].filter(Boolean).join(" ").trim();
    if (composed) return composed;
  }
  if (c.raisonSociale && c.raisonSociale.trim()) return c.raisonSociale.trim();
  const composed = [c.prenom, c.nom].filter(Boolean).join(" ").trim();
  return composed || "Client sans nom";
}

type ClientBillable = {
  id: string;
  /** `debours` : une somme avancée pour le client, portée par `DeboursDossier`. */
  sourceType: "time_entry" | "expense" | "registre_tache" | "debours";
  clientId: string;
  dossierId: string | null;
  dossierLabel: string | null;
  description: string;
  date: string;
  hours: number;
  rate: number;
  amount: number;
  montantBase: number;
  ajustement: number;
  taxable: boolean;
  responsableUserId: string | null;
  responsableNom: string | null;
  rabais: number;
  rabaisRaison: string | null;
};

interface CreateInvoiceViewProps {
  cabinet: CabinetInfo;
  clients: ClientInfo[];
  billingMode?: "forfait" | "horaire" | "mixed";
  forfaitServices?: ForfaitServiceLite[];
  currentUser: UserLite;
  lawyers: UserLite[];
  nextInvoiceNumber: string;
  initialClientId?: string;
  clientBillables: ClientBillable[];
  /** Régime de taxes résolu côté serveur, identique à celui qui sera appliqué
   *  à la création. Sans lui, l'aperçu retomberait sur la province du client. */
  cabinetTaxConfig?: CabinetTaxConfig;
  /** Taux horaire par défaut du cabinet — dernier échelon de la cascade. */
  tauxHoraireDefaut?: number | null;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function toISODate(date: Date) {
  return date.toISOString().split("T")[0];
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

/* ------------------------------------------------------------------ */
/*  Shared classes                                                     */
/* ------------------------------------------------------------------ */

const card = "rounded-lg border border-si-line bg-si-surface";

const sectionTitle = "text-sm font-medium text-si-ink";

const selectBase =
  "h-tap w-full appearance-none rounded-md border border-si-line bg-si-surface px-3 pr-9 text-sm text-si-ink outline-none transition-colors hover:border-si-muted focus:border-si-accent focus:ring-2 focus:ring-si-accent/20";

const inputBase =
  "h-tap w-full rounded-md border border-si-line bg-si-surface px-3 text-sm text-si-ink outline-none transition-colors hover:border-si-muted focus:border-si-accent focus:ring-2 focus:ring-si-accent/20";

const lineInput =
  "h-10 w-full rounded-md border border-si-line bg-si-surface px-3 text-sm text-si-ink outline-none transition-colors focus:border-si-accent focus:ring-2 focus:ring-si-accent/20";

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function CreateInvoiceView({
  cabinet,
  clients,
  billingMode = "horaire",
  forfaitServices = [],
  currentUser,
  lawyers,
  nextInvoiceNumber,
  initialClientId = "",
  clientBillables,
  cabinetTaxConfig,
  tauxHoraireDefaut = null,
}: CreateInvoiceViewProps) {
  const router = useRouter();
  const { formatCurrency } = useFormatteurs();
  const t = useTranslations("billingUi");
  const locale = useLocale();
  const formatMoney = (amount: number) => formatCurrency(amount, "CAD", locale);
  const isForfait = billingMode === "forfait";
  // Mode mixte : chaque ligne porte son propre type (forfait OU honoraires).
  // L'utilisateur bascule le type ligne par ligne via un petit toggle.
  const isMixed = billingMode === "mixed";
  /** Affichage forfait d'une ligne donnée : en mixte, dépend du type de la
   *  ligne ; sinon, dépend du mode global du cabinet. */
  const lineIsForfait = (line: LineItem) =>
    isMixed ? line.type === "forfait" : isForfait;

  /* ---- form state ---- */
  const [language, setLanguage] = useState<"fr" | "en">("fr");
  // Signature reproduite — option cochée à la facture (rien par défaut).
  const [showSignature, setShowSignature] = useState(false);
  // Currency is locked to CAD — Canadian cabinets only. Surfaced as a read-only badge.
  const currency = "CAD";
  const [documentType, setDocumentType] = useState("Facture");
  const [documentNumber] = useState(nextInvoiceNumber);
  const [selectedClientId, setSelectedClientId] = useState(initialClientId);
  const [dateEmission, setDateEmission] = useState(toISODate(new Date()));
  const [dueDatePreset, setDueDatePreset] = useState<DueDatePreset>("30");
  const [dateEcheance, setDateEcheance] = useState(
    toISODate(addDays(new Date(), 30)),
  );
  const [clientNote, setClientNote] = useState("");

  /* Le dossier auquel rattacher la facture. Jusqu'ici il était DEVINÉ par le
     serveur à partir du premier élément repris : un client qui a trois
     dossiers ouverts recevait sa facture rattachée à celui du hasard. */
  const [selectedDossierId, setSelectedDossierId] = useState("");

  /* Les réglages (langue, devise, type, numéro, dates, coordonnées) tiennent
     dans une bande d'une ligne. Ils occupaient quatre cartes en tête d'écran,
     devant la seule question qu'on vient poser : pour qui, et quoi. */
  const [reglagesOuverts, setReglagesOuverts] = useState(false);

  /* Deux temps, pas deux colonnes : on prépare, puis on regarde. L'aperçu
     occupait 45 % de la largeur en permanence, vide tant qu'aucun client
     n'était choisi, pendant que les lignes tenaient dans un tiers d'écran. */
  const [vue, setVue] = useState<"preparation" | "apercu">("preparation");

  /* ---- submit state ---- */
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const defaultResponsableId = currentUser.id;
  const defaultResponsableNom = currentUser.nom ?? null;

  const [lines, setLines] = useState<LineItem[]>([
    {
      id: uid(),
      sourceType: "manual",
      sourceId: null,
      description: "",
      date: toISODate(new Date()),
      hours: 0,
      /* Aucun dossier n'est encore choisi au montage : avocat, puis cabinet. */
      rate: resoudreTauxHoraire({
        avocat: lawyers.find((u) => u.id === currentUser.id)?.defaultHourlyRate,
        cabinet: tauxHoraireDefaut,
      }).taux,
      amount: 0,
      type: isForfait ? "forfait" : "honoraires",
      forfaitServiceId: null,
      responsableUserId: defaultResponsableId,
      responsableNom: defaultResponsableNom,
      taxable: true,
      dossierLabel: null,
      rabais: 0,
      rabaisRaison: null,
    },
  ]);

  /* ---- derived ---- */
  const selectedClient = clients.find((c) => c.id === selectedClientId) ?? null;
  const billablesForSelectedClient = useMemo(
    () => clientBillables.filter((item) => item.clientId === selectedClientId),
    [clientBillables, selectedClientId],
  );
  /* Mémoïsé : `?? []` fabrique un tableau neuf à chaque rendu, et l'effet qui
     pose le dossier unique se redéclencherait sans fin. */
  const dossiersDuClient = useMemo(
    () => selectedClient?.dossiers ?? [],
    [selectedClient],
  );
  const dossierChoisi =
    dossiersDuClient.find((d) => d.id === selectedDossierId) ??
    (dossiersDuClient.length === 1 ? dossiersDuClient[0] : null);

  const selectedSourceLines = useMemo(
    () =>
      lines.filter(
        (line) =>
          line.sourceType && line.sourceType !== "manual" && line.sourceId,
      ),
    [lines],
  );

  /* Trois natures, trois sous-totaux — les mêmes que sur le document.
   *
   * L'ancien calcul rangeait tout ce qui n'était ni rabais ni frais dans
   * « honoraires », débours compris. Le total final restait juste, mais le
   * sous-total taxable envoyé à l'aperçu incluait les débours NON taxables
   * (frais de greffe, frais gouvernementaux) : l'assiette affichée ne
   * correspondait plus à la TPS calculée juste en dessous, et un client qui
   * refaisait le calcul ne retombait pas sur le chiffre.
   */
  const totals = useMemo(() => {
    const sous = calculerSousTotaux(lines);

    // Taxes province-aware : Ontario -> TVH 13 %, Québec -> TPS 5 % + TVQ 9,975 %.
    // Stockage Option A : `tps`/`tvq` portent les colonnes DB (en TVH, tps=hst,
    // tvq=0), `hst` est la valeur d'affichage dérivée.
    //
    // La config du cabinet prime, exactement comme côté serveur
    // (`getCabinetTaxConfigById`). Avant, cet aperçu partait de la province de
    // facturation du client et retombait sur QC quand elle était vide : un
    // cabinet ontarien voyait TPS + TVQ à l'écran puis recevait une facture en
    // TVH 13 %. Deux totaux différents pour la même facture, celui affiché
    // avant création étant le faux.
    const taxConfig =
      cabinetTaxConfig ??
      getDefaultTaxConfig(selectedClient?.billingProvince ?? "QC");
    const applied = applyTaxes(sous.baseTaxable, true, taxConfig);
    const cols = toInvoiceTaxColumns(applied, taxConfig.mode);
    const display = toDisplayTaxes(cols.tps, cols.tvq, taxConfig.mode);

    return {
      sousTotalHonoraires: sous.honoraires,
      deboursTaxables: sous.deboursTaxables,
      deboursNonTaxables: sous.deboursNonTaxables,
      totalDebours: sous.debours,
      totalRabais: sous.rabais,
      baseTaxable: sous.baseTaxable,
      mode: taxConfig.mode,
      tps: cols.tps,
      tvq: cols.tvq,
      hst: display.hst,
      /* Les débours non taxables s'ajoutent APRÈS la taxe : les compter dans
         l'assiette gonflerait la TPS. */
      total:
        Math.round(
          (sous.baseTaxable + applied.taxesTotal + sous.deboursNonTaxables) *
            100,
        ) / 100,
    };
  }, [lines, selectedClient?.billingProvince, cabinetTaxConfig]);

  /**
   * Construit un `PresentedInvoice` "fictif" à partir de l'état du form,
   * pour alimenter le composant canonique `InvoiceDocument` via PDFViewer.
   * Garantit que l'aperçu est strictement le même rendu que le PDF final.
   */
  const presentedPreview: PresentedInvoice = useMemo(() => {
    const cabinetParsedConfig = parseCabinetConfig(cabinet.config ?? null);
    const cabinetTaxes = getCabinetTaxNumbers(cabinetParsedConfig);
    const cabinetInvoiceCfg = getCabinetInvoiceConfig(cabinetParsedConfig);
    const lineToType = (l: LineItem): PresentedLine["type"] => {
      if (l.type === "rabais") return "rabais";
      if (l.type === "frais_administratifs") return "debours_taxable";
      if (l.type === "debours_non_taxable") return "debours_non_taxable";
      if (l.type === "debours_taxable") return "debours_taxable";
      // Un débours saisi à la main : sa case « taxable » décide de sa nature,
      // et c'est elle qui change l'assiette de la TPS et de la TVQ.
      if (l.type === "debours")
        return l.taxable ? "debours_taxable" : "debours_non_taxable";
      // honoraires + forfait → "honoraires"
      return "honoraires";
    };

    const presentedLines: PresentedLine[] = lines.flatMap<PresentedLine>(
      (l) => {
        /* L'aperçu en direct doit dire exactement ce que le document dira :
           une ligne au forfait porte une quantité de 1 au prix du forfait, une
           ligne horaire porte ses heures et son taux. Demande CEO du
           2026-09-14. */
        const estHonoraireApercu = !["rabais", "frais_administratifs", "debours", "debours_taxable", "debours_non_taxable"].includes(
          l.type,
        );
        const auForfait = estHonoraireApercu && l.type === "forfait";
        const quantiteApercu = !estHonoraireApercu
          ? null
          : auForfait
            ? (l.hours || 1)
            : l.hours || null;
        const tauxApercu = !estHonoraireApercu
          ? null
          : auForfait
            ? (l.rate || l.amount)
            : l.rate || null;
        const baseLine: PresentedLine = {
          id: l.id,
          type: lineToType(l),
          description: l.description || "—",
          date: l.date,
          hours: quantiteApercu,
          rate: tauxApercu,
          quantite: quantiteApercu,
          taux: tauxApercu,
          basis: estHonoraireApercu ? (auForfait ? "forfait" : "horaire") : null,
          amount: l.type === "rabais" ? -Math.abs(l.amount) : l.amount,
          userNom:
            l.type === "rabais" || l.type === "frais_administratifs"
              ? null
              : l.responsableNom,
          parentLineId: null,
          source: "invoice_line",
        };

        const out: PresentedLine[] = [baseLine];

        // Si la ligne porte un rabais (provenant d'un registre_tache), le rendre
        // explicitement comme une ligne de rabais distincte sur la facture.
        if (l.type !== "rabais" && l.rabais && l.rabais > 0) {
          out.push({
            id: `${l.id}-rabais`,
            type: "rabais",
            quantite: null,
            taux: null,
            basis: null,
            description: l.rabaisRaison
              ? `Rabais — ${l.rabaisRaison}`
              : `Rabais — ${l.description || "ligne"}`,
            date: l.date,
            hours: null,
            rate: null,
            amount: -Math.abs(l.rabais),
            userNom: null,
            parentLineId: l.id,
            source: "invoice_line",
          });
        }

        return out;
      },
    );

    return {
      id: "preview",
      numero: documentNumber || "BROUILLON",
      dateEmission: new Date(dateEmission),
      dateEcheance: new Date(dateEcheance),
      statut: "brouillon",
      invoiceStatus: null,
      paymentStatus: null,
      currency,
      cabinet: {
        id: "preview-cabinet",
        nom: cabinet.nom ?? "—",
        adresse: cabinet.adresse ?? null,
        telephone: cabinet.telephone ?? null,
        email: cabinet.email ?? null,
        barreauNumero: cabinet.barreauNumero ?? null,
        logoUrl: cabinet.logoUrl ?? null,
        taxNumbers: {
          hstNumber: cabinetTaxes.hstNumber ?? null,
          gstNumber: cabinetTaxes.gstNumber ?? null,
          qstNumber: cabinetTaxes.qstNumber ?? null,
          businessNumber: cabinetTaxes.businessNumber ?? null,
        },
        invoiceTemplate: cabinetInvoiceCfg.template,
        invoiceNotice: cabinetInvoiceCfg.notice,
        invoiceSignature: cabinetInvoiceCfg.signature,
        invoiceAccentColor: cabinetInvoiceCfg.accentColor,
      },
      client: selectedClient
        ? {
            id: selectedClient.id,
            raisonSociale: selectedClient.raisonSociale ?? null,
            prenom: selectedClient.prenom ?? null,
            nom: selectedClient.nom ?? null,
            typeClient: selectedClient.typeClient ?? "personne_morale",
            email: selectedClient.email ?? null,
            billingAddress: selectedClient.billingAddress ?? null,
            billingCity: selectedClient.billingCity ?? null,
            billingProvince: selectedClient.billingProvince ?? null,
            billingPostalCode: selectedClient.billingPostalCode ?? null,
            billingCountry: selectedClient.billingCountry ?? null,
          }
        : null,
      dossier: dossierChoisi
        ? {
            id: dossierChoisi.id,
            intitule: dossierChoisi.intitule,
            numeroDossier: dossierChoisi.numeroDossier,
            modeFacturation: isForfait ? "forfait" : "horaire",
          }
        : null,
      lines: presentedLines,
      isForfait,
      totals: {
        subtotalTaxable: totals.baseTaxable,
        tps: totals.tps,
        tvq: totals.tvq,
        hst: totals.hst,
        taxRegime:
          totals.mode === "hst"
            ? "HST"
            : totals.mode === "tps_tvq"
              ? "GST_QST"
              : "GST_ONLY",
        deboursNonTaxableTotal: totals.deboursNonTaxables,
        montantTotal: totals.total,
        montantPaye: 0,
        balanceDue: totals.total,
        totalRabais: totals.totalRabais,
      },
      clientNote: clientNote || null,
      isLocked: false,
    };
  }, [
    cabinet,
    selectedClient,
    dossierChoisi,
    lines,
    documentNumber,
    dateEmission,
    dateEcheance,
    currency,
    isForfait,
    totals,
    clientNote,
  ]);

  /**
   * Convertit un élément à facturer (temps, dépense, tâche du registre) en
   * ligne du formulaire. Extrait de l'effet pour être rejoué à la demande
   * par « Reprendre le temps non facturé » : sans ça, une ligne supprimée
   * par erreur ne pouvait plus revenir qu'en rechargeant la page.
   */
  const billableEnLigne = useCallback(
    (item: ClientBillable): LineItem => ({
      id: `${item.sourceType}-${item.id}`,
      sourceType: item.sourceType,
      sourceId: item.id,
      description:
        item.ajustement !== 0
          ? `${item.description} (ajustement ${item.ajustement > 0 ? "+" : ""}${item.ajustement.toFixed(2)} $)`
          : item.description,
      date: item.date,
      hours: item.hours,
      rate: item.rate,
      amount: item.amount,
      type:
        /* Un débours garde sa nature : c'est sa case « taxable » qui décide
           s'il entre dans l'assiette de la TPS, pas son origine. */
        item.sourceType === "debours"
          ? "debours"
          : item.sourceType === "expense"
            ? "debours_taxable"
            : isForfait || item.sourceType === "registre_tache"
              ? "forfait"
              : "honoraires",
      forfaitServiceId: null,
      responsableUserId: item.responsableUserId,
      responsableNom: item.responsableNom,
      taxable: item.taxable,
      dossierLabel: item.dossierLabel,
      montantBase: item.montantBase,
      ajustement: item.ajustement,
      rabais: item.rabais,
      rabaisRaison: item.rabaisRaison,
    }),
    [isForfait],
  );

  /**
   * Le taux à proposer pour une ligne d'honoraires neuve.
   *
   * Elle partait systématiquement à 0 : l'avocate retapait le même nombre à
   * chaque ligne, et un zéro oublié passait en facture. Même cascade que la
   * saisie de temps — dossier, puis avocat, puis cabinet — et le champ reste
   * modifiable ligne par ligne.
   */
  const tauxProposePour = useCallback(
    (responsableUserId: string | null): number =>
      resoudreTauxHoraire({
        dossier: dossierChoisi?.tauxHoraire,
        avocat: lawyers.find((u) => u.id === responsableUserId)?.defaultHourlyRate,
        cabinet: tauxHoraireDefaut,
      }).taux,
    [dossierChoisi, lawyers, tauxHoraireDefaut],
  );

  /* Changer de client remet le dossier à zéro : garder l'ancien rattacherait
     la facture au dossier de quelqu'un d'autre. */
  useEffect(() => {
    setSelectedDossierId("");
  }, [selectedClientId]);

  /* Un client qui n'a qu'un dossier ouvert : on le pose. Le laisser vide
     faisait dire deux choses à l'écran, « Sélectionner un dossier… » dans le
     champ et le numéro du dossier dans la barre du haut. */
  useEffect(() => {
    if (selectedDossierId) return;
    if (dossiersDuClient.length === 1)
      setSelectedDossierId(dossiersDuClient[0].id);
  }, [dossiersDuClient, selectedDossierId]);

  useEffect(() => {
    if (!selectedClientId) return;
    if (billablesForSelectedClient.length === 0) {
      setLines([
        {
          id: uid(),
          sourceType: "manual",
          sourceId: null,
          description: "",
          date: toISODate(new Date()),
          hours: 0,
          rate: tauxProposePour(defaultResponsableId),
          amount: 0,
          type: isForfait ? "forfait" : "honoraires",
          forfaitServiceId: null,
          responsableUserId: defaultResponsableId,
          responsableNom: defaultResponsableNom,
          taxable: true,
          dossierLabel: null,
          rabais: 0,
          rabaisRaison: null,
        },
      ]);
      return;
    }

    setLines(billablesForSelectedClient.map(billableEnLigne));
  }, [
    billableEnLigne,
    billablesForSelectedClient,
    defaultResponsableId,
    defaultResponsableNom,
    isForfait,
    selectedClientId,
    tauxProposePour,
  ]);

  /** Les éléments à facturer du client qui ne sont pas (ou plus) sur la facture. */
  const billablesNonRepris = billablesForSelectedClient.filter(
    (b) =>
      !lines.some((l) => l.sourceId === b.id && l.sourceType === b.sourceType),
  );
  const heuresNonReprises = billablesNonRepris.reduce(
    (somme, b) => somme + (b.hours || 0),
    0,
  );
  const heuresNonReprisesTexte = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(heuresNonReprises);

  function reprendreBillables() {
    if (billablesNonRepris.length === 0) return;
    setLines((prev) => {
      // Une ligne vierge encore intacte n'a pas à rester au milieu de lignes
      // reprises : on la retire plutôt que de la laisser en trou.
      const utiles = prev.filter(
        (l) =>
          l.description.trim().length > 0 || (l.amount || 0) > 0 || l.sourceId,
      );
      return [...utiles, ...billablesNonRepris.map(billableEnLigne)];
    });
  }

  /* ---- handlers ---- */
  function handleDueDatePreset(preset: DueDatePreset) {
    setDueDatePreset(preset);
    if (preset !== "custom") {
      setDateEcheance(
        toISODate(addDays(new Date(dateEmission), Number(preset))),
      );
    }
  }

  function updateLine(id: string, patch: Partial<LineItem>) {
    setLines((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        const updated = { ...l, ...patch };
        // In horaire mode, amount is derived from hours × rate.
        // In forfait mode, amount is set directly (from the service catalog
        // or via manual edit), so we leave it alone here.
        // En mixte, on se base sur le type de la ligne mise à jour.
        const updatedIsForfait = isMixed
          ? updated.type === "forfait"
          : isForfait;
        if (!updatedIsForfait && ("hours" in patch || "rate" in patch)) {
          updated.amount =
            Math.round((updated.hours ?? 0) * (updated.rate ?? 0) * 100) / 100;
        }
        return updated;
      }),
    );
  }

  /** Pick a forfait service from the catalog — autofills description + montant */
  function selectForfaitService(lineId: string, serviceId: string) {
    const svc = forfaitServices.find((s) => s.id === serviceId) ?? null;
    setLines((prev) =>
      prev.map((l) => {
        if (l.id !== lineId) return l;
        if (!svc) {
          return { ...l, forfaitServiceId: null };
        }
        return {
          ...l,
          forfaitServiceId: svc.id,
          description: svc.nom,
          amount: svc.montant,
          type: "forfait",
        };
      }),
    );
  }

  /** Mode mixte : bascule une ligne manuelle entre forfait et honoraires. */
  function setLineMode(lineId: string, mode: "forfait" | "honoraires") {
    setLines((prev) =>
      prev.map((l) => {
        if (l.id !== lineId) return l;
        if (mode === "forfait") {
          // Passage en forfait : on neutralise heures/taux, on garde le montant.
          return { ...l, type: "forfait", hours: 0, rate: 0 };
        }
        // Passage en honoraires : on détache le pack et on repart d'un montant
        // recalculé à partir des heures × taux (0 tant que non saisis).
        return {
          ...l,
          type: "honoraires",
          forfaitServiceId: null,
          amount: Math.round((l.hours ?? 0) * (l.rate ?? 0) * 100) / 100,
        };
      }),
    );
  }


  function addLine() {
    setLines((prev) => [
      ...prev,
      {
        id: uid(),
        sourceType: "manual",
        sourceId: null,
        description: "",
        date: toISODate(new Date()),
        hours: 0,
        rate: tauxProposePour(defaultResponsableId),
        amount: 0,
        type: isForfait ? "forfait" : "honoraires",
        forfaitServiceId: null,
        responsableUserId: defaultResponsableId,
        responsableNom: defaultResponsableNom,
        taxable: true,
        dossierLabel: null,
        rabais: 0,
        rabaisRaison: null,
      },
    ]);
  }

  function addRabais() {
    setLines((prev) => [
      ...prev,
      {
        id: uid(),
        sourceType: "manual",
        sourceId: null,
        description: "Rabais — ",
        date: toISODate(new Date()),
        hours: 0,
        rate: 0,
        amount: 0,
        type: "rabais",
        forfaitServiceId: null,
        responsableUserId: null,
        responsableNom: null,
        taxable: true,
        dossierLabel: null,
        rabais: 0,
        rabaisRaison: null,
      },
    ]);
  }

  function addFrais() {
    setLines((prev) => [
      ...prev,
      {
        id: uid(),
        sourceType: "manual",
        sourceId: null,
        description: "Frais administratifs",
        date: toISODate(new Date()),
        hours: 0,
        rate: 0,
        amount: 0,
        type: "frais_administratifs",
        forfaitServiceId: null,
        responsableUserId: null,
        responsableNom: null,
        taxable: true,
        dossierLabel: null,
        rabais: 0,
        rabaisRaison: null,
      },
    ]);
  }

  /**
   * Ajoute un DÉBOURS saisi à la main.
   *
   * Jusqu'ici, une somme avancée pour le client ne pouvait entrer que par
   * l'import des dépenses du dossier. Tapée au clavier, elle passait par
   * « Frais administratifs » et arrivait en base comme un HONORAIRE : le
   * sous-total du travail du cabinet s'en trouvait gonflé, et la facture ne
   * distinguait plus ce qu'il a fait de ce qu'il a avancé.
   *
   * Non taxable par défaut : les frais de greffe et de tribunal, qui sont le
   * cas courant, ne le sont pas. Demande CEO du 2026-09-10.
   */
  /* Trois natures, trois tableaux, les mêmes que sur le document envoyé au
     client. Un débours n'est pas du travail : il ne se taxe pas de la même
     façon et ne se conteste pas de la même façon. Un rabais non plus. */
  const lignesHonoraires = lines.filter((l) => estHonoraire(l.type));
  const lignesDebours = lines.filter((l) => estDebours(l.type));
  const lignesRabais = lines.filter((l) => estRabais(l.type));

  function addDebours() {
    setLines((prev) => [
      ...prev,
      {
        id: uid(),
        sourceType: "manual",
        sourceId: null,
        description: "",
        date: toISODate(new Date()),
        hours: 0,
        rate: 0,
        amount: 0,
        type: "debours",
        forfaitServiceId: null,
        responsableUserId: null,
        responsableNom: null,
        taxable: false,
        dossierLabel: null,
        rabais: 0,
        rabaisRaison: null,
      },
    ]);
  }

  /* ── Cellules d'un tableau éditable ───────────────────────────────
     Le champ ne se dessine qu'au survol et à la saisie. Une grille de
     bordures permanentes sur cinq colonnes et dix rangées devient un
     quadrillage : on ne lit plus les lignes, on lit la grille. */
  const cellule =
    "w-full rounded-md border border-transparent bg-transparent px-2 py-1.5 text-[13px] text-si-ink outline-none transition-colors placeholder:text-si-muted hover:border-si-line focus:border-si-border-strong focus:bg-si-surface focus:ring-2 focus:ring-si-ink/[0.06]";
  const celluleNombre = `${cellule} text-right tabular-nums`;
  const celluleLecture =
    "block w-full truncate px-2 py-1.5 text-[13px] text-si-muted";

  const boutonSupprimer = (line: LineItem) => (
    <button
      type="button"
      onClick={() => removeLine(line.id)}
      className="inline-flex h-tap w-tap items-center justify-center rounded-md text-si-muted transition-colors hover:bg-status-error-bg hover:text-status-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-error/30"
      title={t("delete")}
    >
      <Trash2 size={14} />
    </button>
  );

  /** Les mentions portées par une ligne reprise d'un registre (ajustement, rabais). */
  const mentionsDeLigne = (line: LineItem) =>
    line.dossierLabel ||
    (line.ajustement ?? 0) !== 0 ||
    (line.rabais ?? 0) > 0 ? (
      <div className="flex flex-wrap items-center gap-2 px-2 pb-1 text-[10px]">
        {line.dossierLabel && (
          <span className="truncate text-si-muted">{line.dossierLabel}</span>
        )}
        {(line.ajustement ?? 0) !== 0 && (
          <span className="rounded-md bg-si-amber/[0.13] px-2 py-0.5 font-medium text-si-amber-ink">
            {t("adjustment")} {(line.ajustement ?? 0) > 0 ? "+" : ""}
            {(line.ajustement ?? 0).toFixed(2)} $
          </span>
        )}
        {(line.rabais ?? 0) > 0 && (
          <span className="rounded-md bg-si-verified/[0.06] px-2 py-0.5 font-medium text-si-verified">
            {t("discount")} -{formatMoney(line.rabais ?? 0)}
            {line.rabaisRaison ? ` · ${line.rabaisRaison}` : ""}
          </span>
        )}
      </div>
    ) : null;

  /** Une rangée du tableau « Honoraires professionnels ». */
  const rangeeHonoraire = (line: LineItem) => {
    const enForfait = lineIsForfait(line);
    const importee = (line.sourceType ?? "manual") !== "manual";
    return (
      <tr key={line.id} className="border-b border-si-line last:border-b-0">
        <td className="w-[128px] py-0.5 align-top">
          <input
            type="date"
            value={line.date}
            onChange={(e) => updateLine(line.id, { date: e.target.value })}
            className={`${cellule} tabular-nums`}
            aria-label={t("date")}
          />
        </td>
        <td className="py-0.5 align-top">
          {/* Mode mixte : chaque ligne dit si elle est au forfait ou à l'heure. */}
          {isMixed && !importee && (
            <div className="inline-flex rounded-md border border-si-line bg-si-surface p-0.5 ml-2 mb-1">
              <button
                type="button"
                onClick={() => setLineMode(line.id, "forfait")}
                className={`safe-zoom min-h-tap rounded-md px-2.5 text-[11px] font-medium ${
                  enForfait ? "safe-action-degrade text-white" : "text-si-muted"
                }`}
              >
                {t("flatFee")}
              </button>
              <button
                type="button"
                onClick={() => setLineMode(line.id, "honoraires")}
                className={`safe-zoom min-h-tap rounded-md px-2.5 text-[11px] font-medium ${
                  !enForfait
                    ? "safe-action-degrade text-white"
                    : "text-si-muted"
                }`}
              >
                {t("hours")}
              </button>
            </div>
          )}
          {enForfait && !importee && forfaitServices.length > 0 && (
            <div className="relative mb-1">
              <select
                value={line.forfaitServiceId ?? ""}
                onChange={(e) => selectForfaitService(line.id, e.target.value)}
                className={`${cellule} appearance-none pr-7`}
                aria-label={t("presetTask")}
              >
                <option value="">{t("selectTaskOrFree")}</option>
                {forfaitServices.map((svc) => (
                  <option key={svc.id} value={svc.id}>
                    {svc.nom} · {formatMoney(svc.montant)}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={13}
                className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-si-muted"
              />
            </div>
          )}
          {importee ? (
            <span className={celluleLecture}>{line.description || "—"}</span>
          ) : (
            <input
              value={line.description}
              onChange={(e) =>
                updateLine(line.id, { description: e.target.value })
              }
              placeholder={t("serviceDescriptionPlaceholder")}
              className={cellule}
              aria-label={t("colService")}
            />
          )}
          {mentionsDeLigne(line)}
        </td>
        <td className="w-[172px] py-0.5 align-top">
          <div className="relative">
            <select
              value={line.responsableUserId ?? ""}
              onChange={(e) => selectResponsable(line.id, e.target.value)}
              className={`${cellule} appearance-none pr-7`}
              aria-label={t("responsible")}
            >
              <option value="">—</option>
              {lawyers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nom}
                </option>
              ))}
            </select>
            <ChevronDown
              size={13}
              className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-si-muted"
            />
          </div>
        </td>
        <td className="w-[86px] py-0.5 align-top">
          {enForfait ? (
            <span className={`${celluleLecture} text-right`}>—</span>
          ) : (
            <input
              type="number"
              step="0.25"
              min="0"
              value={line.hours || ""}
              onChange={(e) =>
                updateLine(line.id, { hours: parseFloat(e.target.value) || 0 })
              }
              placeholder="0,00"
              className={celluleNombre}
              aria-label={t("hours")}
            />
          )}
        </td>
        <td className="w-[106px] py-0.5 align-top">
          {enForfait ? (
            <span className={`${celluleLecture} text-right`}>—</span>
          ) : (
            <input
              type="number"
              step="0.01"
              min="0"
              value={line.rate || ""}
              onChange={(e) =>
                updateLine(line.id, { rate: parseFloat(e.target.value) || 0 })
              }
              placeholder="0,00"
              className={celluleNombre}
              aria-label={t("rate")}
            />
          )}
        </td>
        <td className="w-[124px] py-0.5 align-top">
          {enForfait && !importee ? (
            <input
              type="number"
              step="0.01"
              min="0"
              value={line.amount || ""}
              onChange={(e) =>
                updateLine(line.id, { amount: parseFloat(e.target.value) || 0 })
              }
              placeholder="0,00"
              className={`${celluleNombre} font-medium`}
              aria-label={t("amount")}
            />
          ) : (
            <span className="block px-2 py-1.5 text-right text-[13px] font-medium tabular-nums text-si-ink">
              {formatMoney(line.amount)}
            </span>
          )}
        </td>
        <td className="w-[44px] py-0.5 align-top text-right">
          {boutonSupprimer(line)}
        </td>
      </tr>
    );
  };

  /** Une rangée du tableau « Débours et frais ». */
  const rangeeDebours = (line: LineItem) => {
    const importee = (line.sourceType ?? "manual") !== "manual";
    return (
      <tr key={line.id} className="border-b border-si-line last:border-b-0">
        <td className="w-[128px] py-0.5 align-top">
          <input
            type="date"
            value={line.date}
            onChange={(e) => updateLine(line.id, { date: e.target.value })}
            className={`${cellule} tabular-nums`}
            aria-label={t("date")}
          />
        </td>
        <td className="py-0.5 align-top">
          {importee ? (
            <span className={celluleLecture}>{line.description || "—"}</span>
          ) : (
            <input
              value={line.description}
              onChange={(e) =>
                updateLine(line.id, { description: e.target.value })
              }
              placeholder={
                line.type === "frais_administratifs"
                  ? t("chargesDescriptionPlaceholder")
                  : t("colNature")
              }
              className={cellule}
              aria-label={t("colNature")}
            />
          )}
          {mentionsDeLigne(line)}
        </td>
        <td className="w-[118px] py-0.5 text-center align-top">
          {/* Taxable ou non : c'est ce qui décide si la somme entre dans
              l'assiette de la TPS. Une case à cocher perdue en petit sous le
              montant se rate ; ici, elle a sa colonne. */}
          <label className="inline-flex min-h-tap cursor-pointer items-center gap-2 px-2 text-[13px] text-si-ink">
            <input
              type="checkbox"
              checked={line.taxable !== false}
              onChange={(e) =>
                updateLine(line.id, { taxable: e.target.checked })
              }
              className="rounded border-si-line text-si-verified focus:ring-si-accent/30"
            />
            {line.taxable !== false ? t("yes") : t("no")}
          </label>
        </td>
        <td className="w-[124px] py-0.5 align-top">
          {importee ? (
            <span className="block px-2 py-1.5 text-right text-[13px] font-medium tabular-nums text-si-ink">
              {formatMoney(line.amount)}
            </span>
          ) : (
            <input
              type="number"
              step="0.01"
              min="0"
              value={line.amount || ""}
              onChange={(e) =>
                updateLine(line.id, { amount: parseFloat(e.target.value) || 0 })
              }
              placeholder="0,00"
              className={`${celluleNombre} font-medium`}
              aria-label={t("amount")}
            />
          )}
        </td>
        <td className="w-[44px] py-0.5 align-top text-right">
          {boutonSupprimer(line)}
        </td>
      </tr>
    );
  };

  /** Une rangée du tableau « Ajustements » (rabais accordés). */
  const rangeeRabais = (line: LineItem) => (
    <tr key={line.id} className="border-b border-si-line last:border-b-0">
      <td className="w-[128px] py-0.5 align-top">
        <input
          type="date"
          value={line.date}
          onChange={(e) => updateLine(line.id, { date: e.target.value })}
          className={`${cellule} tabular-nums`}
          aria-label={t("date")}
        />
      </td>
      <td className="py-0.5 align-top">
        <input
          value={line.description}
          onChange={(e) => updateLine(line.id, { description: e.target.value })}
          placeholder={t("discountReasonPlaceholder")}
          className={cellule}
          aria-label={t("colReason")}
        />
      </td>
      <td className="w-[118px] py-0.5 text-center align-top">
        <label className="inline-flex min-h-tap cursor-pointer items-center gap-2 px-2 text-[13px] text-si-ink">
          <input
            type="checkbox"
            checked={line.taxable !== false}
            onChange={(e) => updateLine(line.id, { taxable: e.target.checked })}
            className="rounded border-si-line text-si-verified focus:ring-si-accent/30"
          />
          {line.taxable !== false ? t("yes") : t("no")}
        </label>
      </td>
      <td className="w-[124px] py-0.5 align-top">
        <div className="relative">
          <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-[13px] font-medium text-si-verified">
            -
          </span>
          <input
            type="number"
            step="0.01"
            min="0"
            value={line.amount || ""}
            onChange={(e) =>
              updateLine(line.id, { amount: parseFloat(e.target.value) || 0 })
            }
            placeholder="0,00"
            className={`${celluleNombre} pl-5 font-medium`}
            aria-label={t("amount")}
          />
        </div>
      </td>
      <td className="w-[44px] py-0.5 align-top text-right">
        {boutonSupprimer(line)}
      </td>
    </tr>
  );

  function selectResponsable(lineId: string, userId: string) {
    const user = lawyers.find((u) => u.id === userId) ?? null;
    const ligne = lines.find((l) => l.id === lineId);
    /* Le taux suit l'intervenant TANT QU'IL N'A PAS ÉTÉ TOUCHÉ : s'il vaut
       encore exactement ce qui avait été proposé pour l'ancien intervenant,
       il n'a pas été retouché à la main et peut suivre. Sinon on n'y touche
       pas : un taux corrigé exprès ne doit pas se faire écraser. */
    const taux =
      ligne && ligne.rate === tauxProposePour(ligne.responsableUserId)
        ? tauxProposePour(user?.id ?? null)
        : undefined;
    updateLine(lineId, {
      responsableUserId: user?.id ?? null,
      responsableNom: user?.nom ?? null,
      ...(taux !== undefined ? { rate: taux } : {}),
    });
  }

  function removeLine(id: string) {
    setLines((prev) =>
      prev.length > 1 ? prev.filter((l) => l.id !== id) : prev,
    );
  }

  /** Affiche une erreur ET remonte en haut de page pour qu'elle soit visible :
   *  le bouton "Créer" est sticky, mais la bannière d'erreur est en flux normal
   *  et se retrouve hors écran quand on a défilé jusqu'aux lignes. */
  function raiseError(message: string) {
    setSubmitError(message);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  async function handleCreate() {
    if (isSubmitting) return;
    setSubmitError(null);

    // --- Validation ---
    if (!selectedClientId) {
      raiseError(t("errorSelectClient"));
      return;
    }
    const manualLines = lines.filter(
      (l) =>
        (l.sourceType ?? "manual") === "manual" &&
        l.description.trim().length > 0 &&
        l.amount > 0,
    );
    if (manualLines.length === 0 && selectedSourceLines.length === 0) {
      raiseError(t("errorNoLines"));
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/registre-taches/facturer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "client-billables",
          clientId: selectedClientId,
          /* Le dossier CHOISI, plus celui deviné à partir du premier élément
             repris. Voir `createInvoiceFromClientBillables`. */
          dossierId: dossierChoisi?.id ?? null,
          dateEmission,
          dateEcheance,
          currency,
          clientNote,
          timeEntryIds: selectedSourceLines
            .filter((l) => l.sourceType === "time_entry")
            .map((l) => l.sourceId)
            .filter((id): id is string => typeof id === "string"),
          expenseIds: selectedSourceLines
            .filter((l) => l.sourceType === "expense")
            .map((l) => l.sourceId)
            .filter((id): id is string => typeof id === "string"),
          deboursIds: selectedSourceLines
            .filter((l) => l.sourceType === "debours")
            .map((l) => l.sourceId)
            .filter((id): id is string => typeof id === "string"),
          registreTacheIds: selectedSourceLines
            .filter((l) => l.sourceType === "registre_tache")
            .map((l) => l.sourceId)
            .filter((id): id is string => typeof id === "string"),
          lignesManuelles: manualLines.map((l) => ({
            description: l.description.trim(),
            // Rabais stored positive in form, sent as negative to the accounting engine
            // so the line behaves as a credit. Frais and honoraires keep positive sign.
            montant: l.type === "rabais" ? -Math.abs(l.amount) : l.amount,
            taxable: l.taxable ?? true,
            /* La DATE DU TRAVAIL. Le champ existait dans le formulaire et
               l'aperçu l'affichait, mais il s'arrêtait ici : la ligne partait
               sans elle et arrivait en base sans elle. L'avocate voyait donc à
               l'écran une facture que le produit n'enregistrait pas.
               Corrigé le 2026-09-10. */
            serviceDate: l.date || null,
            lineType:
              l.type === "debours" ? ("expense" as const) : ("fee" as const),
          })),
        }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        invoice?: { id?: string };
        error?: string;
      };

      if (!res.ok || !data.success) {
        throw new Error(data.error || t("errorCreateInvoice"));
      }

      // La facture existe désormais en base. On le dit tout de suite : le rendu
      // serveur de l'aperçu qui suit prend plusieurs secondes, et sans ce
      // message l'écran reste strictement identique pendant tout ce temps —
      // mesuré à ~3 s sur le parcours réel. L'avocate cliquait, ne voyait rien,
      // et recommençait. C'est le « le système ne le signale pas » remonté par
      // Me Dadié.
      toast.success(t("toastInvoiceCreated"));

      const invoiceId = data.invoice?.id;
      if (invoiceId) {
        router.push(`/facturation/factures/${invoiceId}`);
      } else {
        router.push("/facturation");
      }
      // `refresh()` APRÈS `push()`, et pas l'inverse.
      // Le compteur « à facturer » de la barre latérale (getSidebarCounts,
      // rendu par le layout partagé) compte les brouillons — exactement le
      // statut de la facture qu'on vient de créer. Une navigation douce ne
      // rejoue pas le layout partagé, d'où le besoin d'invalider.
      // Inverser les deux appels a été essayé et écarté : le `push` supplante
      // le `refresh` encore en vol, la navigation aboutit mais le compteur
      // reste périmé (3 en base, 2 affiché). Dans cet ordre-ci, le refresh
      // s'applique à la route d'arrivée et le compteur suit.
      router.refresh();
    } catch (err) {
      raiseError(err instanceof Error ? err.message : t("errorUnexpected"));
      setIsSubmitting(false);
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  /* ── Fragments de mise en page partagés ────────────────────────── */

  /** Un en-tête de section : le titre à gauche, son sous-total à droite. */
  const enTeteSection = (titre: string, montant?: number) => (
    /* Un filet FIN. Quatre traits noirs descendaient la page, un sous chaque
       titre de section : le reste du produit emploie la hairline.
       Demande CEO du 2026-09-13. */
    <div className="flex items-baseline justify-between border-b border-si-line pb-1.5">
      <h2 className="text-[11px] font-medium uppercase tracking-[0.09em] text-si-ink">
        {titre}
      </h2>
      {montant !== undefined && (
        <span className="font-mono text-[14px] font-medium tabular-nums text-si-ink">
          {formatMoney(montant)}
        </span>
      )}
    </div>
  );

  const corpsSection =
    "rounded-b-lg border border-t-0 border-si-line bg-si-surface px-4 pb-3 pt-1";
  /* 12 px et le même suivi que les registres du produit (`registre.tsx`). Les
     trois tableaux de cet écran étaient seuls à 10 px. Demande CEO du 2026-09-13. */
  const enTeteColonne =
    "px-2 pb-2 pt-2.5 text-left text-[12px] font-medium uppercase tracking-[0.06em] text-si-muted";
  const boutonAjout =
    "safe-zoom inline-flex min-h-tap items-center gap-1.5 rounded-md border border-si-line bg-si-surface px-3 text-xs font-medium text-si-ink transition-colors hover:border-si-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-si-accent/30";
  /* Ce que les sections repliées proposent, en une ligne sous le tableau des
     honoraires.
     « Débours et frais » et « Ajustements » ne s'affichent plus vides : sur une
     facture d'honoraires ordinaire, deux sections sur quatre n'étaient qu'un
     titre, un filet, un sous-total à 0,00 $ et des boutons. Leurs actions
     restent atteignables ici, et chaque section réapparaît entière dès qu'elle
     porte une ligne — c'est l'ajout lui-même qui la fait revenir, sans état de
     plus. Demande CEO du 2026-09-13. */
  const actionsRepliees = [
    ...(lignesDebours.length === 0
      ? [
          { cle: "debours", label: t("addDisbursementShort"), onClick: addDebours },
          { cle: "frais", label: t("addAdminChargeShort"), onClick: addFrais },
        ]
      : []),
    ...(lignesRabais.length === 0
      ? [{ cle: "rabais", label: t("addDiscountShort"), onClick: addRabais }]
      : []),
  ];

  const boutonAjoutDiscret =
    "safe-zoom inline-flex min-h-tap items-center gap-1.5 rounded-md px-3 text-xs font-medium text-si-muted transition-colors hover:text-si-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-si-accent/30";

  return (
    <div className="min-h-screen bg-transparent">
      {/* ── Barre du haut : qui, combien, quoi faire ──────────────── */}
      {/* `top-0` colle au bord visible de `main` parce que le rembourrage
          vertical du gabarit est sur la colonne, pas sur le conteneur de
          défilement (voir AppChrome). Sinon la barre s'arrête 24 px trop bas
          et la ligne des réglages passe au-dessus d'elle. */}
      <div className="safe-glass-subtle sticky top-0 z-30 border-b">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href={routes.facturation}
              className="safe-zoom inline-flex h-tap w-tap shrink-0 items-center justify-center rounded-md text-si-muted hover:text-si-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-si-ink/25"
              aria-label={t("invoices")}
            >
              <ArrowLeft size={17} aria-hidden="true" />
            </Link>
            <div className="min-w-0">
              <p className="text-xs text-si-muted">{t("invoices")}</p>
              <h1 className="truncate text-lg font-medium tracking-tight text-si-ink">
                {t("newInvoice")}
              </h1>
            </div>
            {/* Pour qui, rappelé en permanence : on facture rarement une seule
                chose d'affilée, et l'écran ne disait plus le nom une fois le
                client replié plus bas. */}
            {selectedClient && (
              <p className="hidden min-w-0 truncate border-l border-si-line pl-3 text-[13px] text-si-muted lg:block">
                <span className="font-medium text-si-ink">
                  {clientDisplayName(selectedClient)}
                </span>
                {dossierChoisi?.numeroDossier ? (
                  <> · {dossierChoisi.numeroDossier}</>
                ) : null}
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 sm:ml-auto">
            <div className="mr-2 hidden border-r border-si-line pr-4 text-right sm:block">
              <p className="text-[10px] uppercase tracking-[0.09em] text-si-muted">
                {t("total")}
              </p>
              <p className="font-mono text-[17px] font-medium tabular-nums text-si-ink">
                {formatMoney(totals.total)}
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={() => router.push(routes.facturation)}
              disabled={isSubmitting}
            >
              {t("cancel")}
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                setVue(vue === "apercu" ? "preparation" : "apercu")
              }
              disabled={isSubmitting}
            >
              {vue === "apercu" ? t("backToPreparation") : t("viewPreview")}
            </Button>
            <Button
              variant="primary"
              onClick={handleCreate}
              disabled={isSubmitting}
            >
              {isSubmitting ? t("creating") : t("createInvoice")}
            </Button>
          </div>
        </div>
      </div>

      {submitError && (
        <div className="mx-auto max-w-[1400px] px-4 pt-4 sm:px-6 lg:px-8">
          <div
            className="flex items-start gap-3 border-l-2 border-status-error bg-status-error-bg p-4 text-sm text-status-error"
            role="alert"
          >
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <p className="flex-1">{submitError}</p>
            <button
              type="button"
              onClick={() => setSubmitError(null)}
              className="min-h-tap text-xs font-medium text-status-error underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-error/30"
            >
              {t("close")}
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
        {vue === "apercu" ? (
          /* ── Le document, en pleine page ─────────────────────────
             Demandé le 2026-09-10 : « une version qui prend tout l'écran
             avec les options et ensuite au moment d'enregistrer on peut
             voir l'aperçu ». */
          <div className="mx-auto max-w-[900px]">
            {presentedPreview.cabinet?.invoiceTemplate === "derisier" &&
            presentedPreview.cabinet?.invoiceSignature ? (
              <label className="mb-3 flex cursor-pointer select-none items-center gap-2 text-sm text-si-muted">
                <input
                  type="checkbox"
                  checked={showSignature}
                  onChange={(e) => setShowSignature(e.target.checked)}
                  className="rounded border-si-line text-si-verified focus:ring-si-accent/30"
                />
                {t("addMySignature")}
              </label>
            ) : null}
            <div className="overflow-hidden rounded-lg border border-si-line bg-si-surface">
              {/*
               * Aperçu canonique : rend le document via @react-pdf/renderer.
               * Le PDF téléchargé final utilise EXACTEMENT le même composant
               * <InvoiceDocument>, garantissant un rendu identique.
               */}
              <InvoicePreview
                invoice={presentedPreview}
                language={language}
                showSignature={showSignature}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-7">
            {/* ── Les réglages, repliés en une ligne ───────────────── */}
            <div className="rounded-lg border border-si-line bg-si-surface">
              <div className="flex flex-wrap items-center gap-x-1 gap-y-1 px-4 py-2.5 text-[12.5px] text-si-muted">
                <span className="font-medium text-si-ink">
                  {documentNumber}
                </span>
                <span className="px-2 text-si-line">·</span>
                <span>{documentType}</span>
                <span className="px-2 text-si-line">·</span>
                <span>{language === "fr" ? "Français" : "English"}</span>
                <span className="px-2 text-si-line">·</span>
                <span>{currency}</span>
                <span className="px-2 text-si-line">·</span>
                <span>
                  {t("issueDate")}&nbsp;
                  <span className="tabular-nums text-si-ink">
                    {dateEmission}
                  </span>
                </span>
                <span className="px-2 text-si-line">·</span>
                <span>
                  {t("dueDate")}&nbsp;
                  <span className="tabular-nums text-si-ink">
                    {dateEcheance}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setReglagesOuverts((v) => !v)}
                  aria-expanded={reglagesOuverts}
                  className="safe-zoom ml-auto inline-flex min-h-tap items-center gap-1.5 rounded-md px-3 text-xs font-medium text-si-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-si-accent/30"
                >
                  <Pencil size={12} />
                  {t("editSettings")}
                  <ChevronDown
                    size={13}
                    className={`transition-transform duration-200 ${reglagesOuverts ? "rotate-180" : ""}`}
                  />
                </button>
              </div>

              {reglagesOuverts && (
                <div className="grid grid-cols-1 gap-5 border-t border-si-line px-4 py-5 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-si-muted">
                      {t("language")}
                    </label>
                    <div className="relative">
                      <select
                        value={language}
                        onChange={(e) =>
                          setLanguage(e.target.value as "fr" | "en")
                        }
                        className={selectBase}
                      >
                        <option value="fr">Français</option>
                        <option value="en">English</option>
                      </select>
                      <ChevronDown
                        size={14}
                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-si-muted"
                      />
                    </div>
                  </div>

                  {/* La DEVISE et le NUMÉRO ont quitté ce panneau le 2026-09-14.
                      Ni l'un ni l'autre ne se règle : la devise est verrouillée à
                      CAD, le numéro est attribué à la création. Ils se lisent sur
                      la ligne repliée juste au-dessus, qui est l'endroit où on les
                      cherche. Le bloc « Mes coordonnées » est parti pour la même
                      raison : il s'affichait sans rien régler, et il est sur
                      l'aperçu. Demande CEO du 2026-09-13. */}
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-si-muted">
                      {t("documentType")}
                    </label>
                    <div className="relative">
                      <select
                        value={documentType}
                        onChange={(e) => setDocumentType(e.target.value)}
                        className={selectBase}
                      >
                        <option value="Facture">{t("docTypeInvoice")}</option>
                        <option value="Facture pro forma">
                          {t("docTypeProForma")}
                        </option>
                        <option value="Note d'honoraires">
                          {t("docTypeFeeNote")}
                        </option>
                      </select>
                      <ChevronDown
                        size={14}
                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-si-muted"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-si-muted">
                      {t("issueDate")}
                    </label>
                    <input
                      type="date"
                      value={dateEmission}
                      onChange={(e) => setDateEmission(e.target.value)}
                      className={inputBase}
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-si-muted">
                      {t("dueDate")}
                    </label>
                    <input
                      type="date"
                      value={dateEcheance}
                      onChange={(e) => {
                        setDateEcheance(e.target.value);
                        setDueDatePreset("custom");
                      }}
                      className={inputBase}
                    />
                    {/* Les quatre échéances usuelles tiennent sur une ligne
                        sous le champ : à px-3 elles débordaient de la colonne
                        et « 30 jours » repassait seul à la ligne. */}
                    <div className="mt-2 flex flex-nowrap gap-1.5">
                      {(["3", "7", "14", "30"] as DueDatePreset[]).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => handleDueDatePreset(p)}
                          className={`safe-zoom min-h-tap flex-1 rounded-md border px-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-si-accent/30 ${
                            dueDatePreset === p
                              ? "border-si-ink-strong bg-si-canvas text-si-ink"
                              : "border-si-line bg-si-surface text-si-muted"
                          }`}
                        >
                          {t("daysCount", { count: p })}
                        </button>
                      ))}
                    </div>
                  </div>

                </div>
              )}
            </div>

            {/* ── Pour qui ─────────────────────────────────────────── */}
            <section>
              {enTeteSection(t("forWhom"))}
              <div className={`${corpsSection} pt-4`}>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-si-muted">
                      {t("client")}
                    </label>
                    <div className="relative">
                      <select
                        value={selectedClientId}
                        onChange={(e) => setSelectedClientId(e.target.value)}
                        className={selectBase}
                      >
                        <option value="">{t("selectClient")}</option>
                        {clients.map((c) => (
                          <option key={c.id} value={c.id}>
                            {clientDisplayName(c)}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={14}
                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-si-muted"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-si-muted">
                      {t("matter")}
                    </label>
                    <div className="relative">
                      <select
                        value={selectedDossierId}
                        onChange={(e) => setSelectedDossierId(e.target.value)}
                        disabled={dossiersDuClient.length === 0}
                        className={`${selectBase} disabled:cursor-not-allowed disabled:bg-si-canvas disabled:text-si-muted`}
                      >
                        <option value="">
                          {dossiersDuClient.length === 0
                            ? t("noMatter")
                            : t("selectMatter")}
                        </option>
                        {dossiersDuClient.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.numeroDossier ? `${d.numeroDossier} — ` : ""}
                            {d.intitule}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={14}
                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-si-muted"
                      />
                    </div>
                  </div>
                </div>

                {selectedClient && (
                  <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-si-line pt-3 text-[12.5px] text-si-muted">
                    {[
                      selectedClient.email,
                      [
                        selectedClient.billingAddress,
                        [
                          selectedClient.billingCity,
                          selectedClient.billingProvince,
                          selectedClient.billingPostalCode,
                        ]
                          .filter(Boolean)
                          .join(" "),
                      ]
                        .filter(Boolean)
                        .join(", "),
                      selectedClient.telephone,
                    ]
                      .filter(Boolean)
                      .map((info, i) => (
                        <span
                          key={i}
                          className="after:px-2 after:text-si-line after:content-['·'] last:after:content-['']"
                        >
                          {info}
                        </span>
                      ))}
                    <Link
                      href={`/clients/${selectedClient.id}`}
                      className="safe-zoom ml-auto inline-flex min-h-tap items-center gap-1.5 rounded-md px-2 text-xs font-medium text-si-ink"
                    >
                      <Pencil size={11} />
                      {t("edit")}
                    </Link>
                  </div>
                )}
              </div>
            </section>

            {/* ── Honoraires professionnels ────────────────────────── */}
            <section>
              {enTeteSection(t("groupFees"), totals.sousTotalHonoraires)}
              <div className={corpsSection}>
                <div className="-mx-1 overflow-x-auto px-1">
                  <table className="w-full min-w-[760px]">
                    <thead>
                      <tr className="border-b border-si-line">
                        <th className={enTeteColonne}>{t("date")}</th>
                        <th className={enTeteColonne}>{t("colService")}</th>
                        <th className={enTeteColonne}>{t("responsible")}</th>
                        <th className={`${enTeteColonne} text-right`}>
                          {t("hours")}
                        </th>
                        <th className={`${enTeteColonne} text-right`}>
                          {t("rate")}
                        </th>
                        <th className={`${enTeteColonne} text-right`}>
                          {t("amount")}
                        </th>
                        <th className={enTeteColonne}>
                          <span className="sr-only">{t("delete")}</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>{lignesHonoraires.map(rangeeHonoraire)}</tbody>
                  </table>
                </div>
                {lignesHonoraires.length === 0 && (
                  <p className="px-2 py-4 text-[13px] text-si-muted">
                    {t("noLinesYet")}
                  </p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={addLine}
                    className={boutonAjout}
                  >
                    <Plus size={14} />
                    {t("addService")}
                  </button>
                  {/* Le temps déjà saisi dans le dossier, repris d'un clic.
                      Une ligne supprimée par erreur ne pouvait revenir
                      qu'en rechargeant la page. */}
                  {billablesNonRepris.length > 0 && (
                    <button
                      type="button"
                      onClick={reprendreBillables}
                      className={boutonAjoutDiscret}
                    >
                      <RotateCcw size={13} />
                      {t("reuseUnbilledTime", {
                        count: billablesNonRepris.length,
                        hours: heuresNonReprisesTexte,
                      })}
                    </button>
                  )}
                  {actionsRepliees.length > 0 && (
                    <span className="ml-auto flex flex-wrap items-center gap-1.5 text-xs text-si-muted">
                      {t("addMore")}
                      {actionsRepliees.map((a, i) => (
                        <span key={a.cle} className="flex items-center gap-1.5">
                          {i > 0 ? (
                            <span className="text-si-line" aria-hidden>
                              ·
                            </span>
                          ) : null}
                          <button
                            type="button"
                            onClick={a.onClick}
                            className="min-h-tap rounded px-0.5 text-si-body underline decoration-si-line underline-offset-2 transition-colors hover:text-si-ink hover:decoration-si-ink-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-si-accent/30"
                          >
                            {a.label}
                          </button>
                        </span>
                      ))}
                    </span>
                  )}
                </div>
              </div>
            </section>

            {/* ── Débours et frais ───────────────────────────────────
                Repliée tant qu'elle ne porte rien : ses deux actions vivent
                alors sous le tableau des honoraires. */}
            {lignesDebours.length > 0 && (
            <section>
              {enTeteSection(t("groupExpenses"), totals.totalDebours)}
              <div className={corpsSection}>
                {lignesDebours.length > 0 ? (
                  <div className="-mx-1 overflow-x-auto px-1">
                    <table className="w-full min-w-[620px]">
                      <thead>
                        <tr className="border-b border-si-line">
                          <th className={enTeteColonne}>{t("date")}</th>
                          <th className={enTeteColonne}>{t("colNature")}</th>
                          <th className={`${enTeteColonne} text-center`}>
                            {t("taxable")}
                          </th>
                          <th className={`${enTeteColonne} text-right`}>
                            {t("amount")}
                          </th>
                          <th className={enTeteColonne}>
                            <span className="sr-only">{t("delete")}</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>{lignesDebours.map(rangeeDebours)}</tbody>
                    </table>
                  </div>
                ) : null}
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={addDebours}
                    className={boutonAjout}
                  >
                    <Plus size={14} />
                    {t("addDisbursement")}
                  </button>
                  <button
                    type="button"
                    onClick={addFrais}
                    className={boutonAjoutDiscret}
                  >
                    <Receipt size={13} />
                    {t("addAdminCharge")}
                  </button>
                </div>
              </div>
            </section>
            )}

            {/* ── Ajustements ────────────────────────────────────────
                Repliée tant qu'elle ne porte rien, comme les débours. */}
            {lignesRabais.length > 0 && (
            <section>
              {enTeteSection(
                t("groupAdjustments"),
                totals.totalRabais > 0 ? -totals.totalRabais : undefined,
              )}
              <div className={corpsSection}>
                {lignesRabais.length > 0 ? (
                  <div className="-mx-1 overflow-x-auto px-1">
                    <table className="w-full min-w-[620px]">
                      <thead>
                        <tr className="border-b border-si-line">
                          <th className={enTeteColonne}>{t("date")}</th>
                          <th className={enTeteColonne}>{t("colReason")}</th>
                          <th className={`${enTeteColonne} text-center`}>
                            {t("taxable")}
                          </th>
                          <th className={`${enTeteColonne} text-right`}>
                            {t("amount")}
                          </th>
                          <th className={enTeteColonne}>
                            <span className="sr-only">{t("delete")}</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>{lignesRabais.map(rangeeRabais)}</tbody>
                    </table>
                  </div>
                ) : null}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={addRabais}
                    className={boutonAjout}
                  >
                    <Percent size={13} />
                    {t("addDiscount")}
                  </button>
                </div>
              </div>
            </section>
            )}

            {/* ── La note, et ce que le client verra ───────────────── */}
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
              <div className="flex-1">
                <h3 className="mb-2 text-[11px] font-medium uppercase tracking-[0.09em] text-si-muted">
                  {t("noteToClient")}
                </h3>
                <textarea
                  value={clientNote}
                  onChange={(e) => setClientNote(e.target.value)}
                  placeholder={t("optionalMessagePlaceholder")}
                  rows={4}
                  className="w-full resize-none rounded-lg border border-si-line bg-si-surface px-3 py-3 text-sm text-si-ink outline-none transition-colors placeholder:text-si-muted focus:border-si-border-strong focus:ring-2 focus:ring-si-ink/[0.06]"
                />
              </div>

              <div className="w-full lg:w-[420px] lg:shrink-0">
                <div className="rounded-lg border border-si-line bg-si-surface px-4 pb-4">
                  <h3 className="border-b border-si-ink py-3 text-[11px] font-medium uppercase tracking-[0.09em] text-si-muted">
                    {t("whatClientSees")}
                  </h3>
                  <dl className="text-[13.5px]">
                    <div className="flex justify-between border-b border-si-line py-2">
                      <dt className="text-si-muted">{t("subtotalFees")}</dt>
                      <dd className="font-mono tabular-nums text-si-ink">
                        {formatMoney(totals.sousTotalHonoraires)}
                      </dd>
                    </div>
                    {totals.deboursTaxables > 0 && (
                      <div className="flex justify-between border-b border-si-line py-2">
                        <dt className="text-si-muted">
                          {t("taxableDisbursements")}
                        </dt>
                        <dd className="font-mono tabular-nums text-si-ink">
                          {formatMoney(totals.deboursTaxables)}
                        </dd>
                      </div>
                    )}
                    {totals.totalRabais > 0 && (
                      <div className="flex justify-between border-b border-si-line py-2">
                        <dt className="text-si-muted">
                          {t("discountGranted")}
                        </dt>
                        <dd className="font-mono tabular-nums text-si-ink">
                          -{formatMoney(totals.totalRabais)}
                        </dd>
                      </div>
                    )}
                    {/* L'assiette de la taxe. Sans elle, personne ne peut
                        refaire le calcul de la TPS affichée en dessous. */}
                    <div className="flex justify-between border-b border-si-line py-2">
                      <dt className="font-medium text-si-ink">
                        {t("subtotalTaxableLabel")}
                      </dt>
                      <dd className="font-mono font-medium tabular-nums text-si-ink">
                        {formatMoney(totals.baseTaxable)}
                      </dd>
                    </div>
                    {totals.mode === "hst" ? (
                      <div className="flex justify-between border-b border-si-line py-2">
                        <dt className="text-si-muted">TVH (13 %)</dt>
                        <dd className="font-mono tabular-nums text-si-ink">
                          {formatMoney(totals.hst)}
                        </dd>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between border-b border-si-line py-2">
                          <dt className="text-si-muted">TPS (5 %)</dt>
                          <dd className="font-mono tabular-nums text-si-ink">
                            {formatMoney(totals.tps)}
                          </dd>
                        </div>
                        <div className="flex justify-between border-b border-si-line py-2">
                          <dt className="text-si-muted">TVQ (9,975 %)</dt>
                          <dd className="font-mono tabular-nums text-si-ink">
                            {formatMoney(totals.tvq)}
                          </dd>
                        </div>
                      </>
                    )}
                    {/* Les débours non taxables entrent APRÈS la taxe :
                        les compter avant gonflerait la TPS. */}
                    {totals.deboursNonTaxables > 0 && (
                      <div className="flex justify-between border-b border-si-line py-2">
                        <dt className="text-si-muted">
                          {t("nonTaxableDisbursements")}
                        </dt>
                        <dd className="font-mono tabular-nums text-si-ink">
                          {formatMoney(totals.deboursNonTaxables)}
                        </dd>
                      </div>
                    )}
                  </dl>
                  <div className="mt-3 flex items-center justify-between rounded-md bg-si-ink-strong px-4 py-2.5">
                    <span className="text-[11px] font-medium uppercase tracking-[0.09em] text-white">
                      {t("total")}
                    </span>
                    <span className="font-mono text-[17px] font-medium tabular-nums text-white">
                      {formatMoney(totals.total)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
