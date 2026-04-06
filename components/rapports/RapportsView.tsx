"use client";

import { useState } from "react";
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
} from "lucide-react";
import type { RapportsPayload } from "@/lib/rapports/types";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { RapportsFilters } from "./RapportsFilters";
import { DashboardFinancier } from "./DashboardFinancier";
import { RapportFacturationTable } from "./RapportFacturationTable";
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

export function RapportsView({ payload }: { payload: RapportsPayload }) {
  const t = useTranslations("rapports");
  const tc = useTranslations("common");
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { filters } = payload;
  const dateDebutStr = filters.dateDebut;
  const dateFinStr = filters.dateFin;
  const annee = parseInt(filters.dateFin.slice(0, 4), 10);

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
      <aside className="hidden lg:flex flex-col w-56 shrink-0">
        <nav className="sticky top-6 space-y-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-safe-sm text-sm font-medium transition-all duration-200 text-left ${
                  isActive
                    ? "bg-gradient-to-r from-[#051F20] to-[#163832] text-white shadow-md"
                    : "text-[var(--safe-text-secondary)] hover:bg-[var(--safe-neutral-100)] hover:text-[var(--safe-text-title)]"
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
        <div className="lg:hidden">
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value as TabId)}
            className="w-full h-11 px-4 rounded-safe-sm border border-[var(--safe-neutral-border)] bg-white text-[var(--safe-text-title)] font-medium"
          >
            {TABS.map((tab) => (
              <option key={tab.id} value={tab.id}>{tab.label}</option>
            ))}
          </select>
        </div>

        {/* Filters toggle */}
        <button
          type="button"
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-safe-sm border border-[var(--safe-neutral-border)] bg-white text-sm font-medium text-[var(--safe-text-secondary)] hover:text-[var(--safe-text-title)] hover:border-[var(--safe-neutral-300)] transition-colors"
        >
          <SlidersHorizontal className="w-4 h-4" />
          {tc("filters")}
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${filtersOpen ? "rotate-180" : ""}`} />
        </button>

        {filtersOpen && (
          <div className="p-4 rounded-safe-sm border border-[var(--safe-neutral-border)] bg-white/60 backdrop-blur-sm">
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
            <CardHeader title={t("accountsReceivable")} />
            <CardContent>
              <ComptesRecevoirSection data={payload.comptesRecevoir} />
            </CardContent>
          </Card>
        )}

        {activeTab === "performance-avocats" && (
          <Card>
            <CardHeader
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
            <CardHeader title={t("trustReport")} />
            <CardContent>
              <RapportFideicommisSection data={payload.fideicommis} />
            </CardContent>
          </Card>
        )}

        {activeTab === "taxes" && (
          <Card>
            <CardHeader title={t("taxReport")} />
            <CardContent>
              <RapportTaxesSection data={payload.taxes} />
            </CardContent>
          </Card>
        )}

        {activeTab === "debours" && (
          <Card>
            <CardHeader
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
            <CardHeader title={t("annualTaxReport")} />
            <CardContent>
              <RapportAnnuelImpotsSection data={payload.annuelImpots} annee={annee} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
