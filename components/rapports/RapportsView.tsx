"use client";

import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  FileText,
  Receipt,
  Users,
  Briefcase,
  Landmark,
  Percent,
  Coins,
  Calendar,
  SlidersHorizontal,
  ChevronDown,
  Download,
} from "lucide-react";
import dynamic from "next/dynamic";
import type { RapportsPayload } from "@/lib/rapports/types";
import { formatDate } from "@/lib/utils/format";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { RapportsFilters } from "./RapportsFilters";
import { RapportFacturationTable } from "./RapportFacturationTable";

/* Lazy-load recharts-heavy component */
const DashboardFinancier = dynamic(
  () => import("./DashboardFinancier").then(m => ({ default: m.DashboardFinancier })),
  { loading: () => <div className="h-80 bg-si-canvas rounded-lg animate-pulse" /> }
);
import { ComptesRecevoirSection } from "./ComptesRecevoirSection";
import { PerformanceAvocatsTable } from "./PerformanceAvocatsTable";
import { RentabiliteDossierTable } from "./RentabiliteDossierTable";
import { RapportFideicommisSection } from "./RapportFideicommisSection";
import { RapportTaxesSection } from "./RapportTaxesSection";
import { RapportDeboursSection } from "./RapportDeboursSection";
import { RapportAnnuelImpotsSection } from "./RapportAnnuelImpotsSection";
import { ExportButtons } from "./ExportButtons";
import { useTranslations } from "next-intl";

type TabId =
  | "dashboard"
  | "facturation"
  | "comptes-recevoir"
  | "performance-avocats"
  | "rentabilite-dossier"
  | "fideicommis"
  | "taxes"
  | "debours"
  | "annuel-impots";

export function RapportsView({
  payload,
  cabinet,
}: {
  payload: RapportsPayload;
  cabinet: { nom: string; adresse: string | null; logoUrl: string | null };
}) {
  const t = useTranslations("rapports");
  const tc = useTranslations("common");
  const tr = useTranslations("reportsUi");
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [filtersOpen, setFiltersOpen] = useState(false);
  // Date de génération : rendue côté client uniquement pour éviter tout
  // décalage d'hydratation (fuseau/locale) entre le serveur et le navigateur.
  const [generatedAt, setGeneratedAt] = useState<string>("");
  useEffect(() => {
    setGeneratedAt(formatDate(new Date()));
  }, []);
  const { filters } = payload;
  const dateDebutStr = filters.dateDebut;
  const dateFinStr = filters.dateFin;
  const annee = parseInt(filters.dateFin.slice(0, 4), 10);
  const periodLabel = `${formatDate(dateDebutStr)} – ${formatDate(dateFinStr)}`;

  const handlePrint = () => window.print();

  const TABS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "dashboard", label: t("financialDashboard"), icon: LayoutDashboard },
    { id: "facturation", label: t("billingReport"), icon: FileText },
    { id: "comptes-recevoir", label: t("accountsReceivable"), icon: Receipt },
    { id: "performance-avocats", label: t("lawyerPerformance"), icon: Users },
    { id: "rentabilite-dossier", label: t("matterProfitability"), icon: Briefcase },
    { id: "fideicommis", label: t("trustReport"), icon: Landmark },
    { id: "taxes", label: t("taxReport"), icon: Percent },
    { id: "debours", label: t("disbursementsReport"), icon: Coins },
    { id: "annuel-impots", label: t("annualTaxReport"), icon: Calendar },
  ];

  const activeTabData = TABS.find((t) => t.id === activeTab)!;

  return (
    <div className="flex gap-6 min-h-[600px]">
      {/* Sidebar navigation */}
      <aside className="hidden lg:flex flex-col w-56 shrink-0 no-print">
        <nav className="sticky top-6 space-y-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 text-left ${
                  isActive
                    ? "bg-gradient-to-r from-[#051F20] to-[#163832] text-white shadow-md"
                    : "text-si-muted hover:bg-si-canvas hover:text-si-ink"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" aria-hidden />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0 space-y-5">
        {/* Mobile tab selector */}
        <div className="lg:hidden no-print">
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value as TabId)}
            className="w-full h-11 px-4 rounded-lg border border-si-line bg-si-surface text-si-ink font-medium"
          >
            {TABS.map((tab) => (
              <option key={tab.id} value={tab.id}>{tab.label}</option>
            ))}
          </select>
        </div>

        {/* Barre d'outils du rapport actif : titre, période, filtres, export PDF */}
        <div className="no-print flex flex-wrap items-end justify-between gap-3 border-b border-si-line pb-4">
          <div className="min-w-0">
            <h2 className="font-serif text-xl md:text-2xl text-si-ink tracking-tight truncate">
              {activeTabData.label}
            </h2>
            <p className="text-sm text-si-muted mt-0.5">
              {tr("period")} : {periodLabel}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-si-line bg-si-surface text-sm font-medium text-si-muted hover:text-si-ink transition-colors"
            >
              <SlidersHorizontal className="w-4 h-4" />
              {tc("filters")}
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${filtersOpen ? "rotate-180" : ""}`} />
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#051F20] to-[#163832] text-white text-sm font-medium shadow-sm hover:opacity-95 transition-opacity"
            >
              <Download className="w-4 h-4" />
              {tr("downloadPdf")}
            </button>
          </div>
        </div>

        {filtersOpen && (
          <div className="no-print p-4 rounded-lg border border-si-line bg-si-surface/60 backdrop-blur-sm">
            <RapportsFilters
              clients={payload.clients}
              avocats={payload.avocats}
              defaultDateDebut={dateDebutStr}
              defaultDateFin={dateFinStr}
              defaultClientId={payload.filters.clientId ?? ""}
              defaultUserId={payload.filters.userId ?? ""}
              defaultStatut={payload.filters.statut ?? ""}
            />
          </div>
        )}

        {/* Zone imprimable : seule cette section apparaît dans le PDF */}
        <div id="rapport-print-area" className="space-y-5">
          {/* En-tête de document (visible uniquement à l'impression / PDF) */}
          <div className="hidden print:block mb-4">
            <div className="flex items-start justify-between gap-4 border-b-2 border-[#163832] pb-3">
              <div className="flex items-start gap-3 min-w-0">
                {cabinet.logoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={cabinet.logoUrl}
                    alt={cabinet.nom}
                    className="h-12 w-auto max-w-[160px] object-contain shrink-0"
                  />
                )}
                <div className="min-w-0">
                  {cabinet.nom && (
                    <div className="text-lg font-semibold text-si-ink">{cabinet.nom}</div>
                  )}
                  {cabinet.adresse && (
                    <div className="text-xs text-si-muted mt-0.5">{cabinet.adresse}</div>
                  )}
                </div>
              </div>
              <div className="text-right text-xs text-si-muted shrink-0">
                {generatedAt && <div>{tr("generatedOn")} {generatedAt}</div>}
                <div className="uppercase tracking-wider mt-1">{tr("confidential")}</div>
              </div>
            </div>
            <div className="mt-3">
              <h1 className="font-serif text-2xl text-si-ink">{activeTabData.label}</h1>
              <p className="text-sm text-si-muted mt-0.5">
                {tr("period")} : {periodLabel}
              </p>
            </div>
          </div>

          {/* Active report content */}
        {activeTab === "dashboard" && (
          <DashboardFinancier
            kpis={payload.kpis}
            revenueByMonth={payload.revenueByMonth}
          />
        )}

        {activeTab === "facturation" && (
          <Card>
            <CardHeader
              className="print:hidden"
              title={t("billingReport")}
              action={
                <ExportButtons
                  sectionId="facturation"
                  sectionTitle={t("billingReport")}
                  data={payload.facturationRows as unknown as Record<string, unknown>[]}
                  columns={[
                    { key: "numero", header: tc("invoiceNumber") },
                    { key: "client", header: tc("client") },
                    { key: "dossier", header: tc("dossier") },
                    { key: "avocat", header: t("lawyer") },
                    { key: "date", header: tc("date") },
                    { key: "montantHT", header: t("amountHT") },
                    { key: "rabais", header: tr("discount") },
                    { key: "taxes", header: t("taxes") },
                    { key: "total", header: tc("total") },
                    { key: "paiementRecu", header: t("paymentReceived") },
                    { key: "solde", header: tc("balance") },
                    { key: "statut", header: tc("status") },
                  ]}
                  filenamePrefix="rapport-facturation"
                />
              }
            />
            <CardContent>
              <RapportFacturationTable data={payload.facturationRows} />
            </CardContent>
          </Card>
        )}

        {activeTab === "comptes-recevoir" && (
          <Card>
            <CardHeader title={t("accountsReceivable")} className="print:hidden" />
            <CardContent>
              <ComptesRecevoirSection data={payload.comptesRecevoir} />
            </CardContent>
          </Card>
        )}

        {activeTab === "performance-avocats" && (
          <Card>
            <CardHeader
              className="print:hidden"
              title={t("lawyerPerformance")}
              action={
                <ExportButtons
                  sectionId="performance"
                  sectionTitle={t("lawyerPerformance")}
                  data={payload.performanceAvocats as unknown as Record<string, unknown>[]}
                  columns={[
                    { key: "nom", header: t("lawyer") },
                    { key: "heuresTravaillees", header: t("hoursWorked") },
                    { key: "heuresFacturees", header: t("billedHours") },
                    { key: "revenusGeneres", header: t("revenueGenerated") },
                    { key: "tauxHoraireMoyen", header: t("avgHourlyRate") },
                    { key: "tauxRealisation", header: t("realizationRate") },
                  ]}
                  filenamePrefix="performance-avocats"
                />
              }
            />
            <CardContent>
              <PerformanceAvocatsTable data={payload.performanceAvocats} />
            </CardContent>
          </Card>
        )}

        {activeTab === "rentabilite-dossier" && (
          <Card>
            <CardHeader
              className="print:hidden"
              title={t("matterProfitability")}
              action={
                <ExportButtons
                  sectionId="rentabilite"
                  sectionTitle={t("matterProfitability")}
                  data={payload.rentabiliteDossiers as unknown as Record<string, unknown>[]}
                  columns={[
                    { key: "intitule", header: tc("dossier") },
                    { key: "client", header: tc("client") },
                    { key: "revenus", header: t("revenue") },
                    { key: "heures", header: t("hours") },
                    { key: "paiements", header: t("paymentsReceived") },
                    { key: "profitEstime", header: t("estimatedProfit") },
                  ]}
                  filenamePrefix="rentabilite-dossiers"
                />
              }
            />
            <CardContent>
              <RentabiliteDossierTable data={payload.rentabiliteDossiers} />
            </CardContent>
          </Card>
        )}

        {activeTab === "fideicommis" && (
          <Card>
            <CardHeader title={t("trustReport")} className="print:hidden" />
            <CardContent>
              <RapportFideicommisSection data={payload.fideicommis} />
            </CardContent>
          </Card>
        )}

        {activeTab === "taxes" && (
          <Card>
            <CardHeader title={t("taxReport")} className="print:hidden" />
            <CardContent>
              <RapportTaxesSection data={payload.taxes} />
            </CardContent>
          </Card>
        )}

        {activeTab === "debours" && (
          <Card>
            <CardHeader
              className="print:hidden"
              title={t("disbursementsReport")}
              action={
                <ExportButtons
                  sectionId="debours"
                  sectionTitle={t("disbursementsReport")}
                  data={payload.deboursRows as unknown as Record<string, unknown>[]}
                  columns={[
                    { key: "date", header: tc("date") },
                    { key: "client", header: tc("client") },
                    { key: "dossier", header: tc("dossier") },
                    { key: "description", header: tc("description") },
                    { key: "montant", header: tc("amount") },
                    { key: "factureNumero", header: t("invoice") },
                  ]}
                  filenamePrefix="rapport-debours"
                />
              }
            />
            <CardContent>
              <RapportDeboursSection data={payload.deboursRows} />
            </CardContent>
          </Card>
        )}

        {activeTab === "annuel-impots" && (
          <Card>
            <CardHeader title={t("annualTaxReport")} className="print:hidden" />
            <CardContent>
              <RapportAnnuelImpotsSection data={payload.annuelImpots} annee={annee} />
            </CardContent>
          </Card>
        )}
        </div>
      </div>
    </div>
  );
}
