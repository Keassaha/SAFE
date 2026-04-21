"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { InvoiceTemplateClean } from "@/components/facturation/InvoiceTemplateClean";
import type { InvoiceCleanItem } from "@/components/facturation/InvoiceTemplateClean";
import { TPS_RATE, TVQ_RATE } from "@/lib/invoice-calculations";
import {
  ArrowLeft,
  Plus,
  Trash2,
  CalendarDays,
  ChevronDown,
  Pencil,
  FileText,
  Sparkles,
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
  raisonSociale: string;
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

export function CreateInvoiceView({ cabinet, clients }: CreateInvoiceViewProps) {
  const router = useRouter();

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

  const [lines, setLines] = useState<LineItem[]>([
    {
      id: uid(),
      description: "",
      date: toISODate(new Date()),
      hours: 0,
      rate: 0,
      amount: 0,
      type: "honoraires",
    },
  ]);

  /* ---- derived ---- */
  const selectedClient = clients.find((c) => c.id === selectedClientId) ?? null;

  const totals = useMemo(() => {
    const subtotal = lines.reduce((s, l) => s + l.amount, 0);
    const tps = Math.round(subtotal * TPS_RATE * 100) / 100;
    const tvq = Math.round(subtotal * TVQ_RATE * 100) / 100;
    return { subtotal, tps, tvq, total: subtotal + tps + tvq };
  }, [lines]);

  const previewItems: InvoiceCleanItem[] = lines.map((l) => ({
    id: l.id,
    type: l.type,
    description: l.description || "—",
    date: l.date,
    hours: l.hours || null,
    rate: l.rate || null,
    amount: l.amount,
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
        if ("hours" in patch || "rate" in patch) {
          updated.amount =
            Math.round((updated.hours ?? 0) * (updated.rate ?? 0) * 100) / 100;
        }
        return updated;
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
        type: "honoraires",
      },
    ]);
  }

  function removeLine(id: string) {
    setLines((prev) => (prev.length > 1 ? prev.filter((l) => l.id !== id) : prev));
  }

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "conic-gradient(from 220deg at 70% 20%, #f0fdf4 0deg, #ecfdf5 60deg, #f0f9ff 120deg, #fefce8 200deg, #fdf4ff 280deg, #f0fdf4 360deg)",
      }}
    >
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
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-neutral-600 bg-white/80 border border-neutral-200/60 hover:bg-white hover:border-neutral-300 transition-all duration-200 hover:shadow-sm"
          >
            Annuler
          </button>
          <button className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">
            <span className="flex items-center gap-2">
              <Sparkles size={14} />
              Créer la facture
            </span>
          </button>
        </div>
      </div>

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
                      <option value="fr">Fran\u00e7ais</option>
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
                {cabinet.barreauNumero && (
                  <div>
                    <span className="text-neutral-400 text-xs">Barreau</span>
                    <p className="text-neutral-700 mt-0.5">{cabinet.barreauNumero}</p>
                  </div>
                )}
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
                <h3 className={sectionTitle}>Lignes de facturation</h3>
                <button
                  onClick={addLine}
                  className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition-all duration-200"
                >
                  <Plus size={14} />
                  Ajouter
                </button>
              </div>

              <div className="space-y-3">
                {lines.map((line) => (
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
                  </div>
                ))}
              </div>

              {/* Totals summary */}
              <div className="mt-5 pt-5 border-t border-neutral-100 space-y-2.5 text-sm">
                <div className="flex justify-between text-neutral-400">
                  <span>Sous-total</span>
                  <span className="tabular-nums">{totals.subtotal.toFixed(2)} $</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>TPS (5%)</span>
                  <span className="tabular-nums">{totals.tps.toFixed(2)} $</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>TVQ (9,975%)</span>
                  <span className="tabular-nums">{totals.tvq.toFixed(2)} $</span>
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
              tps={totals.tps}
              tvq={totals.tvq}
              montantTotal={totals.total}
              clientNote={clientNote || undefined}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
