"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { InvoiceTemplateClean } from "@/components/facturation/InvoiceTemplateClean";
import type { InvoiceCleanItem } from "@/components/facturation/InvoiceTemplateClean";

/**
 * Ontario HST rate (13%).
 * Aligned with the backend `createFreeformInvoice()` which also applies 13% HST
 * on taxable lines. If the cabinet operates in Québec, swap this for TPS/TVQ.
 */
const HST_RATE = 0.13;
import {
  ArrowLeft,
  Plus,
  Trash2,
  CalendarDays,
  ChevronDown,
  Pencil,
  FileText,
  Sparkles,
  User as UserIcon,
  Loader2,
  AlertCircle,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type DueDatePreset = "3" | "7" | "14" | "30" | "custom";

interface LineItem {
  id: string;
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
}

interface ClientInfo {
  id: string;
  raisonSociale: string | null;
  billingAddress?: string | null;
  billingCity?: string | null;
  billingProvince?: string | null;
  billingPostalCode?: string | null;
  billingCountry?: string | null;
  telephone?: string | null;
  email?: string | null;
}

interface CreateInvoiceViewProps {
  cabinet: CabinetInfo;
  clients: ClientInfo[];
  billingMode?: "forfait" | "horaire";
  forfaitServices?: ForfaitServiceLite[];
  currentUser: UserLite;
  lawyers: UserLite[];
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
/*  Shared classes (Popcorn-inspired)                                  */
/* ------------------------------------------------------------------ */

const card =
  "bg-white/70 backdrop-blur-sm rounded-2xl border border-white/60 shadow-[0_2px_16px_rgba(0,0,0,0.04)] transition-all duration-300 hover:shadow-[0_4px_24px_rgba(0,0,0,0.07)]";

const sectionTitle =
  "text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-400";

const selectBase =
  "w-full h-11 px-4 pr-9 rounded-xl border border-neutral-200/80 bg-white/80 text-sm text-neutral-800 appearance-none focus:ring-2 focus:ring-emerald-400/25 focus:border-emerald-400 outline-none transition-all duration-200 hover:border-neutral-300";

const inputBase =
  "w-full h-11 px-4 rounded-xl border border-neutral-200/80 bg-white/80 text-sm text-neutral-800 focus:ring-2 focus:ring-emerald-400/25 focus:border-emerald-400 outline-none transition-all duration-200 hover:border-neutral-300";

const lineInput =
  "w-full h-10 px-3 rounded-lg border border-neutral-200/60 bg-white/90 text-sm focus:ring-2 focus:ring-emerald-400/25 focus:border-emerald-400 outline-none transition-all duration-200";

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
}: CreateInvoiceViewProps) {
  const router = useRouter();
  const isForfait = billingMode === "forfait";

  /* ---- form state ---- */
  const [language, setLanguage] = useState<"fr" | "en">("fr");
  const [currency, setCurrency] = useState("CAD");
  const [documentType, setDocumentType] = useState("Facture");
  const [documentNumber, setDocumentNumber] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");
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
      description: "",
      date: toISODate(new Date()),
      hours: 0,
      rate: 0,
      amount: 0,
      type: isForfait ? "forfait" : "honoraires",
      forfaitServiceId: null,
      responsableUserId: defaultResponsableId,
      responsableNom: defaultResponsableNom,
    },
  ]);

  /* ---- derived ---- */
  const selectedClient = clients.find((c) => c.id === selectedClientId) ?? null;

  const totals = useMemo(() => {
    const subtotal = lines.reduce((s, l) => s + l.amount, 0);
    const hst = Math.round(subtotal * HST_RATE * 100) / 100;
    return { subtotal, hst, total: subtotal + hst };
  }, [lines]);

  const previewItems: InvoiceCleanItem[] = lines.map((l) => ({
    id: l.id,
    type: l.type,
    description: l.description || "—",
    date: l.date,
    hours: l.hours || null,
    rate: l.rate || null,
    amount: l.amount,
    responsable: l.responsableNom,
    responsableInitiales: initialsOf(l.responsableNom),
  }));

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
        if (!isForfait && ("hours" in patch || "rate" in patch)) {
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

  function addLine() {
    setLines((prev) => [
      ...prev,
      {
        id: uid(),
        description: "",
        date: toISODate(new Date()),
        hours: 0,
        rate: 0,
        amount: 0,
        type: isForfait ? "forfait" : "honoraires",
        forfaitServiceId: null,
        responsableUserId: defaultResponsableId,
        responsableNom: defaultResponsableNom,
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

  async function handleCreate() {
    if (isSubmitting) return;
    setSubmitError(null);

    // --- Validation ---
    if (!selectedClientId) {
      setSubmitError("Veuillez sélectionner un client.");
      return;
    }
    const validLines = lines.filter(
      (l) => l.description.trim().length > 0 && l.amount > 0
    );
    if (validLines.length === 0) {
      setSubmitError(
        "Ajoutez au moins une ligne avec une description et un montant."
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/registre-taches/facturer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "libre",
          clientId: selectedClientId,
          lignes: validLines.map((l) => ({
            description: l.description.trim(),
            montant: l.amount,
            taxable: true,
          })),
        }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        invoice?: { id?: string };
        error?: string;
      };

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Erreur lors de la création de la facture.");
      }

      const invoiceId = data.invoice?.id;
      if (invoiceId) {
        router.push(`/facturation/factures/${invoiceId}`);
      } else {
        router.push("/facturation");
      }
      router.refresh();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Erreur inattendue."
      );
      setIsSubmitting(false);
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="min-h-screen bg-transparent">
      {/* ── Top bar ── */}
      <div className="sticky top-0 z-30 flex items-center justify-between bg-white/60 backdrop-blur-xl border-b border-white/40 px-8 py-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2.5 text-sm text-neutral-500 hover:text-neutral-800 transition-colors duration-200"
        >
          <ArrowLeft size={16} />
          <span className="font-medium">Factures</span>
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
            <FileText size={16} className="text-white" />
          </div>
          <h1 className="text-lg font-bold text-neutral-800 tracking-tight">
            Nouvelle facture
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-neutral-600 bg-white/80 border border-neutral-200/60 hover:bg-white hover:border-neutral-300 transition-all duration-200 hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Annuler
          </button>
          <button
            onClick={handleCreate}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <span className="flex items-center gap-2">
              {isSubmitting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Sparkles size={14} />
              )}
              {isSubmitting ? "Création…" : "Créer la facture"}
            </span>
          </button>
        </div>
      </div>

      {submitError && (
        <div className="px-8 pt-4 max-w-[1600px] mx-auto">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <p className="flex-1">{submitError}</p>
            <button
              onClick={() => setSubmitError(null)}
              className="text-red-400 hover:text-red-600 text-xs font-medium"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* ── Main: form + preview side-by-side ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8 max-w-[1600px] mx-auto">
        {/* ======== LEFT — Form ======== */}
        <div className="space-y-5">
          {/* Language & Currency */}
          <div className={card}>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className={`block mb-2 ${sectionTitle}`}>Langue</label>
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
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
                    />
                  </div>
                </div>
                <div>
                  <label className={`block mb-2 ${sectionTitle}`}>Devise</label>
                  <div className="relative">
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className={selectBase}
                    >
                      <option value="CAD">$CAD</option>
                      <option value="USD">$USD</option>
                    </select>
                    <ChevronDown
                      size={14}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cabinet details */}
          <div className={card}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className={sectionTitle}>Mes coordonnées</h3>
                <button className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors duration-200 px-3 py-1.5 rounded-lg hover:bg-emerald-50">
                  <Pencil size={12} />
                  Modifier
                </button>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
                <div className="col-span-2">
                  <span className="text-neutral-400 text-xs">Cabinet</span>
                  <p className="font-semibold text-neutral-800 mt-0.5">
                    {cabinet.nom}
                  </p>
                </div>
                {cabinet.adresse && (
                  <div>
                    <span className="text-neutral-400 text-xs">Adresse</span>
                    <p className="text-neutral-700 mt-0.5">{cabinet.adresse}</p>
                  </div>
                )}
                {cabinet.telephone && (
                  <div>
                    <span className="text-neutral-400 text-xs">Téléphone</span>
                    <p className="text-neutral-700 mt-0.5">{cabinet.telephone}</p>
                  </div>
                )}
                {cabinet.email && (
                  <div>
                    <span className="text-neutral-400 text-xs">Courriel</span>
                    <p className="text-neutral-700 mt-0.5">{cabinet.email}</p>
                  </div>
                )}
                {/* NB: numéro du Barreau volontairement omis — donnée confidentielle */}
              </div>
            </div>
          </div>

          {/* Invoice details */}
          <div className={card}>
            <div className="p-6">
              <h3 className={`mb-5 ${sectionTitle}`}>Détails de la facture</h3>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className={`block mb-2 ${sectionTitle}`}>
                    Type de document
                  </label>
                  <div className="relative">
                    <select
                      value={documentType}
                      onChange={(e) => setDocumentType(e.target.value)}
                      className={selectBase}
                    >
                      <option value="Facture">Facture</option>
                      <option value="Facture pro forma">Facture pro forma</option>
                      <option value="Note d'honoraires">Note d&apos;honoraires</option>
                    </select>
                    <ChevronDown
                      size={14}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
                    />
                  </div>
                </div>
                <div>
                  <label className={`block mb-2 ${sectionTitle}`}>
                    Numéro de document
                  </label>
                  <input
                    value={documentNumber}
                    onChange={(e) => setDocumentNumber(e.target.value)}
                    placeholder="FV 00001/2026"
                    className={inputBase}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className={card}>
            <div className="p-6">
              <h3 className={`mb-5 ${sectionTitle}`}>Dates</h3>
              <div className="grid grid-cols-2 gap-5 mb-5">
                <div>
                  <label className={`block mb-2 ${sectionTitle}`}>
                    Date d&apos;émission
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
                    Date d&apos;échéance
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

              {/* Due date presets — pill style */}
              <div className="flex gap-2">
                {(["3", "7", "14", "30"] as DueDatePreset[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => handleDueDatePreset(p)}
                    className={`px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 ${
                      dueDatePreset === p
                        ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/25"
                        : "bg-white/80 text-neutral-500 border border-neutral-200/60 hover:bg-white hover:text-neutral-700 hover:border-neutral-300"
                    }`}
                  >
                    {p} jours
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Client selection */}
          <div className={card}>
            <div className="p-6">
              <h3 className={`mb-5 ${sectionTitle}`}>Client</h3>
              <div className="relative">
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className={selectBase}
                >
                  <option value="">Sélectionner un client…</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.raisonSociale}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
                />
              </div>

              {selectedClient && (
                <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-emerald-50/60 to-white border border-emerald-100/60 text-sm space-y-1">
                  <p className="font-semibold text-neutral-800">
                    {selectedClient.raisonSociale}
                  </p>
                  {selectedClient.billingAddress && (
                    <p className="text-neutral-500">
                      {selectedClient.billingAddress}
                    </p>
                  )}
                  {selectedClient.billingCity && (
                    <p className="text-neutral-500">
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
                    <p className="text-neutral-500">{selectedClient.telephone}</p>
                  )}
                  {selectedClient.email && (
                    <p className="text-neutral-500">{selectedClient.email}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Line items */}
          <div className={card}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className={sectionTitle}>
                    {isForfait ? "Tâches facturées" : "Lignes de facturation"}
                  </h3>
                  {isForfait && (
                    <p className="text-[11px] text-neutral-400 mt-1">
                      Sélectionnez une tâche préenregistrée — le montant se
                      remplit automatiquement.
                    </p>
                  )}
                </div>
                <button
                  onClick={addLine}
                  className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition-all duration-200"
                >
                  <Plus size={14} />
                  Ajouter
                </button>
              </div>

              <div className="space-y-3">
                {lines.map((line) => {
                  const detailsRow = (
                    <div className="col-span-12 flex items-center gap-4 pt-2.5 mt-1 border-t border-neutral-100/80">
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <CalendarDays size={12} className="text-neutral-400 shrink-0" />
                        <span className="text-[10px] text-neutral-400 uppercase tracking-wide shrink-0">
                          Date
                        </span>
                        <input
                          type="date"
                          value={line.date}
                          onChange={(e) => updateLine(line.id, { date: e.target.value })}
                          className="flex-1 h-7 px-2 rounded-md border border-transparent text-xs text-neutral-600 bg-transparent hover:border-neutral-200 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/20 outline-none tabular-nums"
                        />
                      </div>
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <UserIcon size={12} className="text-neutral-400 shrink-0" />
                        <span className="text-[10px] text-neutral-400 uppercase tracking-wide shrink-0">
                          Responsable
                        </span>
                        <div className="relative flex-1">
                          <select
                            value={line.responsableUserId ?? ""}
                            onChange={(e) => selectResponsable(line.id, e.target.value)}
                            className="w-full h-7 pl-2 pr-6 rounded-md border border-transparent text-xs text-neutral-600 bg-transparent hover:border-neutral-200 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/20 outline-none appearance-none"
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
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
                          />
                        </div>
                        {line.responsableNom && (
                          <span
                            className="shrink-0 inline-flex items-center justify-center min-w-[26px] h-[18px] px-1.5 rounded-md bg-emerald-50 border border-emerald-100 text-[9px] font-bold text-emerald-700 tracking-wide"
                            title={line.responsableNom}
                          >
                            {initialsOf(line.responsableNom)}
                          </span>
                        )}
                      </div>
                    </div>
                  );

                  return isForfait ? (
                    /* ── Forfait mode: task picker + editable amount ── */
                    <div
                      key={line.id}
                      className="grid grid-cols-12 gap-3 items-end p-4 rounded-xl bg-gradient-to-br from-neutral-50/80 to-white border border-neutral-100/80 transition-all duration-200 hover:border-neutral-200"
                    >
                      <div className="col-span-9">
                        <label className="block text-[11px] text-neutral-400 font-medium mb-1">
                          Tâche préenregistrée
                        </label>
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
                                ? "Aucune tâche — configurez le registre"
                                : "Sélectionner une tâche…"}
                            </option>
                            {forfaitServices.map((svc) => (
                              <option key={svc.id} value={svc.id}>
                                {svc.nom} — {svc.montant.toFixed(2)} $
                              </option>
                            ))}
                          </select>
                          <ChevronDown
                            size={14}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
                          />
                        </div>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[11px] text-neutral-400 font-medium mb-1">
                          Montant
                        </label>
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
                          className={`${lineInput} text-right font-semibold`}
                        />
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <button
                          onClick={() => removeLine(line.id)}
                          className="p-2 rounded-lg text-neutral-300 hover:text-red-500 hover:bg-red-50 transition-all duration-200"
                          title="Supprimer"
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
                      className="grid grid-cols-12 gap-3 items-end p-4 rounded-xl bg-gradient-to-br from-neutral-50/80 to-white border border-neutral-100/80 transition-all duration-200 hover:border-neutral-200"
                    >
                      <div className="col-span-5">
                        <label className="block text-[11px] text-neutral-400 font-medium mb-1">
                          Description
                        </label>
                        <input
                          value={line.description}
                          onChange={(e) =>
                            updateLine(line.id, { description: e.target.value })
                          }
                          placeholder="Description du service…"
                          className={lineInput}
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[11px] text-neutral-400 font-medium mb-1">
                          Heures
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
                        <label className="block text-[11px] text-neutral-400 font-medium mb-1">
                          Taux
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
                        <label className="block text-[11px] text-neutral-400 font-medium mb-1">
                          Montant
                        </label>
                        <p className="h-10 flex items-center justify-end text-sm font-bold text-neutral-800 tabular-nums">
                          {line.amount.toFixed(2)} $
                        </p>
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <button
                          onClick={() => removeLine(line.id)}
                          className="p-2 rounded-lg text-neutral-300 hover:text-red-500 hover:bg-red-50 transition-all duration-200"
                          title="Supprimer"
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
              <div className="mt-5 pt-5 border-t border-neutral-100 space-y-2.5 text-sm">
                <div className="flex justify-between text-neutral-400">
                  <span>Sous-total</span>
                  <span className="tabular-nums">{totals.subtotal.toFixed(2)} $</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>TVH (13%)</span>
                  <span className="tabular-nums">{totals.hst.toFixed(2)} $</span>
                </div>
                <div className="flex justify-between font-bold text-neutral-800 text-base pt-3 border-t border-neutral-100">
                  <span>Total</span>
                  <span className="tabular-nums">{totals.total.toFixed(2)} $</span>
                </div>
              </div>
            </div>
          </div>

          {/* Note to client */}
          <div className={card}>
            <div className="p-6">
              <h3 className={`mb-4 ${sectionTitle}`}>Note au client</h3>
              <textarea
                value={clientNote}
                onChange={(e) => setClientNote(e.target.value)}
                placeholder="Message optionnel visible sur la facture…"
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-neutral-200/80 bg-white/80 text-sm text-neutral-800 placeholder:text-neutral-300 focus:ring-2 focus:ring-emerald-400/25 focus:border-emerald-400 outline-none transition-all duration-200 resize-none"
              />
            </div>
          </div>
        </div>

        {/* ======== RIGHT — Live Preview ======== */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="mb-4 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <h2 className={sectionTitle}>Aperçu en direct</h2>
          </div>
          <div className="rounded-2xl border border-white/60 bg-white shadow-[0_8px_40px_rgba(0,0,0,0.06)] overflow-hidden transition-all duration-300 hover:shadow-[0_12px_48px_rgba(0,0,0,0.09)]">
            <InvoiceTemplateClean
              numero={documentNumber || "BROUILLON"}
              dateEmission={dateEmission}
              dateEcheance={dateEcheance}
              cabinet={cabinet}
              client={
                selectedClient
                  ? {
                      raisonSociale: selectedClient.raisonSociale,
                      billingAddress: selectedClient.billingAddress,
                      billingCity: selectedClient.billingCity,
                      billingProvince: selectedClient.billingProvince,
                      billingPostalCode: selectedClient.billingPostalCode,
                      billingCountry: selectedClient.billingCountry,
                      telephone: selectedClient.telephone,
                      email: selectedClient.email,
                    }
                  : null
              }
              items={previewItems}
              subtotalTaxable={totals.subtotal}
              hst={totals.hst}
              montantTotal={totals.total}
              clientNote={clientNote || undefined}
              language={language}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
