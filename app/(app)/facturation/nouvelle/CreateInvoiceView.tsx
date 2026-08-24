"use client";

import { useEffect, useMemo, useState } from "react";
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
import { parseCabinetConfig, getCabinetTaxNumbers, getCabinetInvoiceConfig } from "@/lib/cabinet-config";
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
} from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type DueDatePreset = "3" | "7" | "14" | "30" | "custom";

interface LineItem {
  id: string;
  sourceId?: string | null;
  sourceType?: "manual" | "time_entry" | "expense" | "registre_tache";
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
function clientDisplayName(c: Pick<ClientInfo, "typeClient" | "raisonSociale" | "prenom" | "nom">): string {
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
  sourceType: "time_entry" | "expense" | "registre_tache";
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
  "h-11 w-full appearance-none rounded-md border border-si-line bg-si-surface px-3 pr-9 text-sm text-si-ink outline-none transition-colors hover:border-si-muted focus:border-si-accent focus:ring-2 focus:ring-si-accent/20";

const inputBase =
  "h-11 w-full rounded-md border border-si-line bg-si-surface px-3 text-sm text-si-ink outline-none transition-colors hover:border-si-muted focus:border-si-accent focus:ring-2 focus:ring-si-accent/20";

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
}: CreateInvoiceViewProps) {
  const router = useRouter();
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
    toISODate(addDays(new Date(), 30))
  );
  const [clientNote, setClientNote] = useState("");

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
      rate: 0,
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
    [clientBillables, selectedClientId]
  );
  const selectedSourceLines = useMemo(
    () => lines.filter((line) => line.sourceType && line.sourceType !== "manual" && line.sourceId),
    [lines]
  );

  // Rabais lines store positive amounts but reduce the subtotal.
  // Frais (admin fees) add to the subtotal like a regular taxable line.
  const totals = useMemo(() => {
    let subtotalHonoraires = 0;
    let totalRabais = 0;
    let totalFrais = 0;
    let taxableBase = 0;
    for (const l of lines) {
      const amt = l.amount || 0;
      if (l.type === "rabais") {
        totalRabais += amt;
        if (l.taxable !== false) taxableBase -= amt;
      } else if (l.type === "frais_administratifs") {
        totalFrais += amt;
        if (l.taxable !== false) taxableBase += amt;
      } else {
        subtotalHonoraires += amt;
        if (l.taxable !== false) taxableBase += amt;
        if (l.rabais && l.rabais > 0) {
          totalRabais += l.rabais;
          if (l.taxable !== false) taxableBase -= l.rabais;
        }
      }
    }
    const subtotal = subtotalHonoraires + totalFrais - totalRabais;
    // Taxes province-aware : Ontario -> TVH 13 %, Québec -> TPS 5 % + TVQ 9,975 %.
    // Stockage Option A : `tps`/`tvq` portent les colonnes DB (en TVH, tps=hst, tvq=0),
    // `hst` est la valeur d'affichage dérivée.
    //
    // La config du cabinet prime, exactement comme côté serveur
    // (`getCabinetTaxConfigById`). Avant, cet aperçu partait de la province de
    // facturation du client et retombait sur QC quand elle était vide : un
    // cabinet ontarien voyait TPS + TVQ à l'écran puis recevait une facture en
    // TVH 13 %. Deux totaux différents pour la même facture, celui affiché
    // avant création étant le faux.
    const taxConfig =
      cabinetTaxConfig ?? getDefaultTaxConfig(selectedClient?.billingProvince ?? "QC");
    const applied = applyTaxes(taxableBase, true, taxConfig);
    const cols = toInvoiceTaxColumns(applied, taxConfig.mode);
    const display = toDisplayTaxes(cols.tps, cols.tvq, taxConfig.mode);
    return {
      subtotalHonoraires,
      totalRabais,
      totalFrais,
      subtotal,
      mode: taxConfig.mode,
      tps: cols.tps,
      tvq: cols.tvq,
      hst: display.hst,
      total: subtotal + applied.taxesTotal,
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
      // honoraires + forfait → "honoraires"
      return "honoraires";
    };

    const presentedLines: PresentedLine[] = lines.flatMap<PresentedLine>((l) => {
      const baseLine: PresentedLine = {
        id: l.id,
        type: lineToType(l),
        description: l.description || "—",
        date: l.date,
        hours: l.type === "rabais" || l.type === "frais_administratifs" ? null : l.hours || null,
        rate: l.type === "rabais" || l.type === "frais_administratifs" ? null : l.rate || null,
        amount: l.type === "rabais" ? -Math.abs(l.amount) : l.amount,
        userNom: l.type === "rabais" || l.type === "frais_administratifs" ? null : l.responsableNom,
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
          description: l.rabaisRaison ? `Rabais — ${l.rabaisRaison}` : `Rabais — ${l.description || "ligne"}`,
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
    });

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
      dossier:
        selectedClient?.dossiers && selectedClient.dossiers.length > 0
          ? {
              id: selectedClient.dossiers[0].id,
              intitule: selectedClient.dossiers[0].intitule,
              numeroDossier: selectedClient.dossiers[0].numeroDossier,
              modeFacturation: isForfait ? "forfait" : "horaire",
            }
          : null,
      lines: presentedLines,
      isForfait,
      totals: {
        subtotalTaxable: totals.subtotal,
        tps: totals.tps,
        tvq: totals.tvq,
        hst: totals.hst,
        taxRegime:
          totals.mode === "hst" ? "HST" : totals.mode === "tps_tvq" ? "GST_QST" : "GST_ONLY",
        deboursNonTaxableTotal: 0,
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
    lines,
    documentNumber,
    dateEmission,
    dateEcheance,
    currency,
    isForfait,
    totals,
    clientNote,
  ]);


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
          rate: 0,
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

    setLines(
      billablesForSelectedClient.map((item) => ({
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
          item.sourceType === "expense"
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
      }))
    );
  }, [billablesForSelectedClient, defaultResponsableId, defaultResponsableNom, isForfait, selectedClientId]);

  /* ---- handlers ---- */
  function handleDueDatePreset(preset: DueDatePreset) {
    setDueDatePreset(preset);
    if (preset !== "custom") {
      setDateEcheance(toISODate(addDays(new Date(dateEmission), Number(preset))));
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
      })
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
      })
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
      })
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
        rate: 0,
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

  function selectResponsable(lineId: string, userId: string) {
    const user = lawyers.find((u) => u.id === userId) ?? null;
    updateLine(lineId, {
      responsableUserId: user?.id ?? null,
      responsableNom: user?.nom ?? null,
    });
  }

  function removeLine(id: string) {
    setLines((prev) => (prev.length > 1 ? prev.filter((l) => l.id !== id) : prev));
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
      (l) => (l.sourceType ?? "manual") === "manual" && l.description.trim().length > 0 && l.amount > 0
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

  return (
    <div className="min-h-screen bg-transparent">
      {/* ── Top bar ── */}
      {/* Plan 3, niveau subtle : la barre reste au-dessus du formulaire pendant
          le défilement et recouvre les lignes de facturation. */}
      <div className="safe-glass-subtle sticky top-0 z-30 border-b">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href={routes.facturation}
              className="safe-zoom inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-si-muted hover:bg-si-surface2 hover:text-si-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-si-ink/25"
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
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => router.push(routes.facturation)}
              disabled={isSubmitting}
            >
              {t("cancel")}
            </Button>
            <Button variant="primary" onClick={handleCreate} disabled={isSubmitting}>
              {isSubmitting ? t("creating") : t("createInvoice")}
            </Button>
          </div>
        </div>
      </div>

      {submitError && (
        <div className="mx-auto max-w-[1600px] px-4 pt-4 sm:px-6 lg:px-8">
          <div className="flex items-start gap-3 border-l-2 border-status-error bg-status-error-bg p-4 text-sm text-status-error" role="alert">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <p className="flex-1">{submitError}</p>
            <button
              type="button"
              onClick={() => setSubmitError(null)}
              className="min-h-11 text-xs font-medium text-status-error underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-error/30"
            >
              {t("close")}
            </button>
          </div>
        </div>
      )}

      {/* ── Main: form + preview side-by-side ── */}
      <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-6 p-4 sm:p-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)] lg:p-8">
        {/* ======== LEFT — Form ======== */}
        <div className="space-y-5">
          {/* Language & Currency */}
          <div className={card}>
            <div className="p-5 sm:p-6">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className={`block mb-2 ${sectionTitle}`}>{t("language")}</label>
                  <div className="relative">
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value as "fr" | "en")}
                      className={selectBase}
                    >
                      <option value="fr">Français</option>
                      <option value="en">English</option>
                    </select>
                    <ChevronDown
                      size={14}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-si-muted/50 pointer-events-none"
                    />
                  </div>
                </div>
                <div>
                  <label className={`block mb-2 ${sectionTitle}`}>{t("currency")}</label>
                  <div
                    className={`${inputBase} flex items-center justify-between bg-si-canvas text-si-ink cursor-not-allowed select-none`}
                    aria-readonly="true"
                    title={t("currencyLockedTitle")}
                  >
                    <span className="font-medium">CAD</span>
                    <span className="text-xs text-si-muted/50">{t("canadianDollar")}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cabinet details */}
          <div className={card}>
            <div className="p-5 sm:p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className={sectionTitle}>{t("myContactInfo")}</h3>
                <button
                  type="button"
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-md px-3 text-xs font-medium text-si-verified transition-colors hover:bg-si-verified/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-si-accent/30"
                >
                  <Pencil size={12} />
                  {t("edit")}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
                <div className="col-span-2">
                  <span className="text-si-muted/50 text-xs">{t("firm")}</span>
                  <p className="font-medium text-si-ink mt-0.5">
                    {cabinet.nom}
                  </p>
                </div>
                {cabinet.adresse && (
                  <div>
                    <span className="text-si-muted/50 text-xs">{t("address")}</span>
                    <p className="text-si-ink mt-0.5">{cabinet.adresse}</p>
                  </div>
                )}
                {cabinet.telephone && (
                  <div>
                    <span className="text-si-muted/50 text-xs">{t("phone")}</span>
                    <p className="text-si-ink mt-0.5">{cabinet.telephone}</p>
                  </div>
                )}
                {cabinet.email && (
                  <div>
                    <span className="text-si-muted/50 text-xs">{t("email")}</span>
                    <p className="text-si-ink mt-0.5">{cabinet.email}</p>
                  </div>
                )}
                {/* NB: numéro du Barreau volontairement omis — donnée confidentielle */}
              </div>
            </div>
          </div>

          {/* Invoice details */}
          <div className={card}>
            <div className="p-5 sm:p-6">
              <h3 className={`mb-5 ${sectionTitle}`}>{t("invoiceDetails")}</h3>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className={`block mb-2 ${sectionTitle}`}>
                    {t("documentType")}
                  </label>
                  <div className="relative">
                    <select
                      value={documentType}
                      onChange={(e) => setDocumentType(e.target.value)}
                      className={selectBase}
                    >
                      <option value="Facture">{t("docTypeInvoice")}</option>
                      <option value="Facture pro forma">{t("docTypeProForma")}</option>
                      <option value="Note d'honoraires">{t("docTypeFeeNote")}</option>
                    </select>
                    <ChevronDown
                      size={14}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-si-muted/50 pointer-events-none"
                    />
                  </div>
                </div>
                <div>
                  <label className={`block mb-2 ${sectionTitle}`}>
                    {t("documentNumber")}
                  </label>
                  <input
                    value={documentNumber}
                    readOnly
                    aria-readonly="true"
                    className={`${inputBase} bg-si-canvas text-si-muted cursor-not-allowed`}
                  />
                  <p className="mt-1.5 text-[11px] text-si-muted/50">
                    {t("autoAssignedOnCreation")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className={card}>
            <div className="p-5 sm:p-6">
              <h3 className={`mb-5 ${sectionTitle}`}>{t("dates")}</h3>
              <div className="grid grid-cols-2 gap-5 mb-5">
                <div>
                  <label className={`block mb-2 ${sectionTitle}`}>
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
                  <label className={`block mb-2 ${sectionTitle}`}>
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
                </div>
              </div>

              {/* Échéances usuelles : filtre compact, pas une deuxième action primaire. */}
              <div className="flex gap-2">
                {(["3", "7", "14", "30"] as DueDatePreset[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => handleDueDatePreset(p)}
                    className={`min-h-11 rounded-md border px-4 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-si-accent/30 ${
                      dueDatePreset === p
                        ? "border-si-forest bg-si-canvas text-si-verified"
                        : "border-si-line bg-si-surface text-si-muted hover:border-si-muted hover:text-si-ink"
                    }`}
                  >
                    {t("daysCount", { count: p })}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Client selection — Name first, then dossier, then contact info */}
          <div className={card}>
            <div className="p-5 sm:p-6">
              <h3 className={`mb-5 ${sectionTitle}`}>{t("client")}</h3>
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-si-muted/50 pointer-events-none"
                />
              </div>

              {selectedClient && (
                <div className="mt-4 rounded-lg border border-si-line bg-si-canvas/50 text-sm">
                  {/* 1. Client name (always first) */}
                  <div className="px-4 pt-4">
                    <p className="font-medium text-si-ink text-base leading-tight">
                      {clientDisplayName(selectedClient)}
                    </p>
                  </div>

                  {/* 2. Dossiers ouverts du client */}
                  {selectedClient.dossiers && selectedClient.dossiers.length > 0 && (
                    <div className="mt-2.5 border-b border-si-line px-4 pb-2.5">
                      <p className="mb-1.5 text-xs font-medium text-si-muted">
                        {t("openMatters", { count: selectedClient.dossiers.length })}
                      </p>
                      <div className="space-y-0.5">
                        {selectedClient.dossiers.slice(0, 4).map((d) => (
                          <p key={d.id} className="text-si-ink text-[13px] leading-snug">
                            {d.numeroDossier && (
                              <span className="mr-1.5 font-mono text-si-verified">
                                {d.numeroDossier}
                              </span>
                            )}
                            <span>{d.intitule}</span>
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 3. Coordonnées */}
                  <div className="px-4 py-3 space-y-0.5">
                    {selectedClient.billingAddress && (
                      <p className="text-si-muted">{selectedClient.billingAddress}</p>
                    )}
                    {(selectedClient.billingCity ||
                      selectedClient.billingProvince ||
                      selectedClient.billingPostalCode) && (
                      <p className="text-si-muted">
                        {[
                          selectedClient.billingCity,
                          selectedClient.billingProvince,
                          selectedClient.billingPostalCode,
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      </p>
                    )}
                    {selectedClient.telephone && (
                      <p className="text-si-muted">{selectedClient.telephone}</p>
                    )}
                    {selectedClient.email && (
                      <p className="text-si-muted">{selectedClient.email}</p>
                    )}
                  </div>
                </div>
              )}

              {selectedClient && (
                <div className="mt-4 rounded-lg border border-si-line bg-si-surface p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-medium text-si-muted uppercase tracking-[0.08em]">
                      {t("detectedItems")}
                    </p>
                    <span className="font-mono text-xs font-medium tabular-nums text-si-verified">
                      {t("linesCount", { count: billablesForSelectedClient.length })}
                    </span>
                  </div>
                  {billablesForSelectedClient.length > 0 ? (
                    <p className="mt-2 text-sm text-si-muted">
                      {t("autoLoadedItems")}
                    </p>
                  ) : (
                    <p className="mt-2 text-sm text-si-muted">
                      {t("noExistingItems")}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Line items */}
          <div className={card}>
            <div className="p-5 sm:p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className={sectionTitle}>
                    {isForfait ? t("billedTasks") : t("invoiceLines")}
                  </h3>
                  {isForfait && (
                    <p className="text-[11px] text-si-muted/50 mt-1">
                      {t("selectPresetTaskHint")}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={addLine}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-md px-3 text-xs font-medium text-si-verified transition-colors hover:bg-si-verified/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-si-accent/30"
                  >
                    <Plus size={14} />
                    {t("line")}
                  </button>
                  <button
                    onClick={addRabais}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-md px-3 text-xs font-medium text-si-verified transition-colors hover:bg-si-verified/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-si-accent/30"
                    title={t("addDiscountTitle")}
                  >
                    <Percent size={14} />
                    {t("discount")}
                  </button>
                  <button
                    onClick={addFrais}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-md px-3 text-xs font-medium text-si-amber-ink transition-colors hover:bg-si-amber/[0.10] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-si-amber/30"
                    title={t("addAdminChargesTitle")}
                  >
                    <Receipt size={14} />
                    {t("charges")}
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {lines.map((line) => {
                  const detailsRow = (
                    <div className="col-span-12 flex items-center gap-4 pt-2.5 mt-1 border-t border-si-line/80">
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <CalendarDays size={12} className="text-si-muted/50 shrink-0" />
                        <span className="text-[10px] text-si-muted/50 uppercase tracking-wide shrink-0">
                          {t("date")}
                        </span>
                        <input
                          type="date"
                          value={line.date}
                          onChange={(e) => updateLine(line.id, { date: e.target.value })}
                          className="h-8 flex-1 rounded-md border border-transparent bg-transparent px-2 text-xs tabular-nums text-si-muted outline-none hover:border-si-line focus:border-si-accent focus:ring-1 focus:ring-si-accent/20"
                        />
                      </div>
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <UserIcon size={12} className="text-si-muted/50 shrink-0" />
                        <span className="text-[10px] text-si-muted/50 uppercase tracking-wide shrink-0">
                          {t("responsible")}
                        </span>
                        <div className="relative flex-1">
                          <select
                            value={line.responsableUserId ?? ""}
                            onChange={(e) => selectResponsable(line.id, e.target.value)}
                            className="h-8 w-full appearance-none rounded-md border border-transparent bg-transparent pl-2 pr-6 text-xs text-si-muted outline-none hover:border-si-line focus:border-si-accent focus:ring-1 focus:ring-si-accent/20"
                          >
                            <option value="">—</option>
                            {lawyers.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.nom}
                              </option>
                            ))}
                          </select>
                          <ChevronDown
                            size={11}
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 text-si-muted/50 pointer-events-none"
                          />
                        </div>
                        {line.responsableNom && (
                          <span
                            className="inline-flex h-5 min-w-[26px] shrink-0 items-center justify-center rounded-md border border-si-line bg-si-canvas px-1.5 text-[9px] font-medium tracking-wide text-si-verified"
                            title={line.responsableNom}
                          >
                            {initialsOf(line.responsableNom)}
                          </span>
                        )}
                      </div>
                    </div>
                  );

                  // Mode mixte : toggle Forfait / Heures pour les lignes
                  // manuelles (pas pour les éléments importés ni les ajustements).
                  const showForfait = lineIsForfait(line);
                  const modeToggle =
                    isMixed && line.sourceType === "manual" ? (
                      <div className="col-span-12 flex items-center gap-2 mb-1">
                        <span className="text-[10px] text-si-muted/50 uppercase tracking-wide">
                          {t("type")}
                        </span>
                        <div className="inline-flex rounded-md border border-si-line bg-si-surface p-0.5">
                          <button
                            type="button"
                            onClick={() => setLineMode(line.id, "forfait")}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all duration-150 ${
                              showForfait
                                ? "safe-action-degrade text-white"
                                : "text-si-muted hover:text-si-ink"
                            }`}
                          >
                            {t("flatFee")}
                          </button>
                          <button
                            type="button"
                            onClick={() => setLineMode(line.id, "honoraires")}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all duration-150 ${
                              !showForfait
                                ? "safe-action-degrade text-white"
                                : "text-si-muted hover:text-si-ink"
                            }`}
                          >
                            {t("hours")}
                          </button>
                        </div>
                      </div>
                    ) : null;

                  const isAdjustment = line.type === "rabais" || line.type === "frais_administratifs";
                  if (isAdjustment) {
                    const isRabais = line.type === "rabais";
                    return (
                      <div
                        key={line.id}
                        className={`grid grid-cols-12 items-end gap-3 rounded-lg border p-4 transition-colors ${
                          isRabais
                            ? "border-si-line bg-si-verified/[0.05]"
                            : "border-si-amber/30 bg-si-amber/[0.10]"
                        }`}
                      >
                        <div className="col-span-9">
                          <label
                            className={`mb-1 flex items-center gap-1.5 text-xs font-medium ${
                              isRabais ? "text-si-verified" : "text-si-amber-ink"
                            }`}
                          >
                            {isRabais ? <Percent size={11} /> : <Receipt size={11} />}
                            {isRabais ? t("discount") : t("adminCharges")}
                          </label>
                          <input
                            value={line.description}
                            onChange={(e) =>
                              updateLine(line.id, { description: e.target.value })
                            }
                            placeholder={
                              isRabais
                                ? t("discountReasonPlaceholder")
                                : t("chargesDescriptionPlaceholder")
                            }
                            className={lineInput}
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-[11px] text-si-muted/50 font-medium mb-1">
                            {t("amount")}
                          </label>
                          <div className="relative">
                            {isRabais && (
                              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-medium text-si-verified">
                                −
                              </span>
                            )}
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={line.amount || ""}
                              onChange={(e) =>
                                updateLine(line.id, {
                                  amount: parseFloat(e.target.value) || 0,
                                })
                              }
                              className={`${lineInput} text-right font-medium ${isRabais ? "pl-7" : ""}`}
                            />
                          </div>
                          <label className="mt-1.5 flex items-center gap-1.5 text-[10px] text-si-muted/50">
                            <input
                              type="checkbox"
                              checked={line.taxable !== false}
                              onChange={(e) => updateLine(line.id, { taxable: e.target.checked })}
                              className="rounded border-si-line"
                            />
                            {t("taxableGstQst")}
                          </label>
                        </div>
                        <div className="col-span-1 flex justify-end">
                          <button
                            onClick={() => removeLine(line.id)}
                            className="inline-flex h-11 w-11 items-center justify-center rounded-md text-si-muted transition-colors hover:bg-status-error-bg hover:text-status-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-error/30"
                            title={t("delete")}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return showForfait ? (
                    /* ── Forfait mode: task picker + editable amount ── */
                    <div
                      key={line.id}
                      className="grid grid-cols-12 items-end gap-3 rounded-lg border border-si-line bg-si-canvas/35 p-4 transition-colors hover:border-si-muted"
                    >
                      {modeToggle}
                      <div className="col-span-9">
                        <label className="block text-[11px] text-si-muted/50 font-medium mb-1">
                          {line.sourceType === "manual" ? t("presetTask") : t("billableItem")}
                        </label>
                        {line.sourceType === "manual" ? (
                          <div className="space-y-2">
                            <div className="relative">
                              <select
                                value={line.forfaitServiceId ?? ""}
                                onChange={(e) =>
                                  selectForfaitService(line.id, e.target.value)
                                }
                                className={`${lineInput} pr-8 appearance-none`}
                              >
                                <option value="">
                                  {forfaitServices.length === 0
                                    ? t("freeEntry")
                                    : t("selectTaskOrFree")}
                                </option>
                                {forfaitServices.map((svc) => (
                                <option key={svc.id} value={svc.id}>
                                  {svc.nom} · {formatMoney(svc.montant)}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown
                                size={14}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-si-muted/50 pointer-events-none"
                              />
                            </div>
                            <input
                              value={line.description}
                              onChange={(e) =>
                                updateLine(line.id, { description: e.target.value })
                              }
                              placeholder={t("freeDescriptionPlaceholder")}
                              className={lineInput}
                            />
                          </div>
                        ) : (
                          <input
                            value={line.description}
                            readOnly
                            className={`${lineInput} bg-si-canvas text-si-muted`}
                          />
                        )}
                        {line.dossierLabel && (
                          <p className="mt-1 text-[10px] text-si-muted/50 truncate">
                            {line.dossierLabel}
                          </p>
                        )}
                        {((line.ajustement ?? 0) !== 0 || (line.rabais ?? 0) > 0) && (
                          <div className="mt-2 flex flex-wrap gap-2 text-[10px]">
                            {(line.ajustement ?? 0) !== 0 && (
                              <span className="rounded-md bg-si-amber/[0.13] px-2 py-1 font-medium text-si-amber-ink">
                                {t("adjustment")} {(line.ajustement ?? 0) > 0 ? "+" : ""}{(line.ajustement ?? 0).toFixed(2)} $
                              </span>
                            )}
                            {(line.rabais ?? 0) > 0 && (
                              <span className="rounded-md bg-si-verified/[0.06] px-2 py-1 font-medium text-si-verified">
                                {t("discount")} -{formatMoney(line.rabais ?? 0)}{line.rabaisRaison ? ` · ${line.rabaisRaison}` : ""}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[11px] text-si-muted/50 font-medium mb-1">
                          {t("amount")}
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={line.amount || ""}
                          readOnly={line.sourceType !== "manual"}
                          onChange={(e) =>
                            updateLine(line.id, {
                              amount: parseFloat(e.target.value) || 0,
                            })
                          }
                          className={`${lineInput} text-right font-medium ${line.sourceType !== "manual" ? "bg-si-canvas text-si-muted" : ""}`}
                        />
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <button
                          onClick={() => removeLine(line.id)}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-md text-si-muted transition-colors hover:bg-status-error-bg hover:text-status-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-error/30"
                          title={t("delete")}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      {detailsRow}
                    </div>
                  ) : (
                    /* ── Horaire mode: description + hours × rate ── */
                    <div
                      key={line.id}
                      className="grid grid-cols-12 items-end gap-3 rounded-lg border border-si-line bg-si-canvas/35 p-4 transition-colors hover:border-si-muted"
                    >
                      {modeToggle}
                      <div className="col-span-5">
                        <label className="block text-[11px] text-si-muted/50 font-medium mb-1">
                          {t("description")}
                        </label>
                        <input
                          value={line.description}
                          readOnly={line.sourceType !== "manual"}
                          onChange={(e) =>
                            updateLine(line.id, { description: e.target.value })
                          }
                          placeholder={t("serviceDescriptionPlaceholder")}
                          className={`${lineInput} ${line.sourceType !== "manual" ? "bg-si-canvas text-si-muted" : ""}`}
                        />
                        {line.dossierLabel && (
                          <p className="mt-1 text-[10px] text-si-muted/50 truncate">
                            {line.dossierLabel}
                          </p>
                        )}
                        {((line.ajustement ?? 0) !== 0 || (line.rabais ?? 0) > 0) && (
                          <div className="mt-2 flex flex-wrap gap-2 text-[10px]">
                            {(line.ajustement ?? 0) !== 0 && (
                              <span className="rounded-md bg-si-amber/[0.13] px-2 py-1 font-medium text-si-amber-ink">
                                {t("adjustment")} {(line.ajustement ?? 0) > 0 ? "+" : ""}{(line.ajustement ?? 0).toFixed(2)} $
                              </span>
                            )}
                            {(line.rabais ?? 0) > 0 && (
                              <span className="rounded-md bg-si-verified/[0.06] px-2 py-1 font-medium text-si-verified">
                                {t("discount")} -{formatMoney(line.rabais ?? 0)}{line.rabaisRaison ? ` · ${line.rabaisRaison}` : ""}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[11px] text-si-muted/50 font-medium mb-1">
                          {t("hours")}
                        </label>
                        <input
                          type="number"
                          step="0.25"
                          min="0"
                          value={line.hours || ""}
                          onChange={(e) =>
                            updateLine(line.id, {
                              hours: parseFloat(e.target.value) || 0,
                            })
                          }
                          className={`${lineInput} text-right`}
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[11px] text-si-muted/50 font-medium mb-1">
                          {t("rate")}
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={line.rate || ""}
                          onChange={(e) =>
                            updateLine(line.id, {
                              rate: parseFloat(e.target.value) || 0,
                            })
                          }
                          className={`${lineInput} text-right`}
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[11px] text-si-muted/50 font-medium mb-1">
                          {t("amount")}
                        </label>
                        <p className="h-10 flex items-center justify-end text-sm font-medium text-si-ink tabular-nums">
                          {formatMoney(line.amount)}
                        </p>
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <button
                          onClick={() => removeLine(line.id)}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-md text-si-muted transition-colors hover:bg-status-error-bg hover:text-status-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-error/30"
                          title={t("delete")}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      {detailsRow}
                    </div>
                  );
                })}
              </div>

              {/* Totals summary */}
              <div className="mt-5 pt-5 border-t border-si-line space-y-2.5 text-sm">
                <div className="flex justify-between text-si-muted">
                  <span>{t("subtotalFees")}</span>
                  <span className="font-mono tabular-nums">{formatMoney(totals.subtotalHonoraires)}</span>
                </div>
                {totals.totalFrais > 0 && (
                  <div className="flex justify-between text-si-amber-ink">
                    <span>{t("adminCharges")}</span>
                    <span className="font-mono tabular-nums">+{formatMoney(totals.totalFrais)}</span>
                  </div>
                )}
                {totals.totalRabais > 0 && (
                  <div className="flex justify-between text-si-verified">
                    <span>{t("discountGranted")}</span>
                    <span className="font-mono tabular-nums">−{formatMoney(totals.totalRabais)}</span>
                  </div>
                )}
                <div className="flex justify-between text-si-muted pt-1.5 border-t border-si-line/60">
                  <span>{t("subtotal")}</span>
                  <span className="font-mono font-medium tabular-nums">{formatMoney(totals.subtotal)}</span>
                </div>
                {totals.mode === "hst" ? (
                  <div className="flex justify-between text-si-muted/50">
                    <span>TVH (13%)</span>
                    <span className="font-mono tabular-nums">{formatMoney(totals.hst)}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-si-muted/50">
                      <span>TPS (5%)</span>
                      <span className="font-mono tabular-nums">{formatMoney(totals.tps)}</span>
                    </div>
                    <div className="flex justify-between text-si-muted/50">
                      <span>TVQ (9,975%)</span>
                      <span className="font-mono tabular-nums">{formatMoney(totals.tvq)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between font-medium text-si-ink text-base pt-3 border-t border-si-line">
                  <span>{t("total")}</span>
                  <span className="font-mono tabular-nums">{formatMoney(totals.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Note to client */}
          <div className={card}>
            <div className="p-6">
              <h3 className={`mb-4 ${sectionTitle}`}>{t("noteToClient")}</h3>
              <textarea
                value={clientNote}
                onChange={(e) => setClientNote(e.target.value)}
                placeholder={t("optionalMessagePlaceholder")}
                rows={3}
                className="w-full resize-none rounded-md border border-si-line bg-si-surface px-3 py-3 text-sm text-si-ink outline-none transition-colors placeholder:text-si-muted focus:border-si-accent focus:ring-2 focus:ring-si-accent/20"
              />
            </div>
          </div>
        </div>

        {/* ======== RIGHT — Live Preview ======== */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <Card className="mb-3 grid grid-cols-2">
            <div className="border-r border-si-line px-4 py-3">
              <p className="text-xs text-si-muted">{t("total")}</p>
              <p className="mt-1 text-right font-mono text-xl font-medium tabular-nums text-si-ink">
                {formatMoney(totals.total)}
              </p>
            </div>
            <div className="px-4 py-3">
              <p className="text-xs text-si-muted">{t("dueDate")}</p>
              <p className="mt-1 text-right font-mono text-sm font-medium tabular-nums text-si-ink">
                {dateEcheance}
              </p>
            </div>
          </Card>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className={sectionTitle}>{t("livePreview")}</h2>
            {presentedPreview.cabinet?.invoiceTemplate === "derisier" &&
            presentedPreview.cabinet?.invoiceSignature ? (
              <label className="flex items-center gap-2 cursor-pointer text-sm text-si-muted select-none">
                <input
                  type="checkbox"
                  checked={showSignature}
                  onChange={(e) => setShowSignature(e.target.checked)}
                  className="h-4 w-4 rounded border-si-line text-si-verified focus:ring-si-accent/30"
                />
                {t("addMySignature")}
              </label>
            ) : null}
          </div>
          <div className="overflow-hidden rounded-lg border border-si-line bg-si-surface">
            {/*
             * Aperçu canonique : rend le document via @react-pdf/renderer.
             * Le PDF téléchargé final utilisera EXACTEMENT le même composant
             * <InvoiceDocument>, garantissant un rendu strictement identique.
             */}
            <InvoicePreview
              invoice={presentedPreview}
              language={language}
              showSignature={showSignature}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
