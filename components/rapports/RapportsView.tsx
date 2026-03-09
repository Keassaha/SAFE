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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title={tc("filters")} />
        <CardContent>
          <RapportsFilters
            clients={payload.clients}
            avocats={payload.avocats}
            defaultDateDebut={dateDebutStr}
            defaultDateFin={dateFinStr}
            defaultClientId={payload.filters.clientId ?? ""}
            defaultUserId={payload.filters.userId ?? ""}
            defaultStatut={payload.filters.statut ?? ""}
          />
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2 border-b border-[var(--safe-neutral-border)] pb-2">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-[var(--safe-green-600)] text-white"
                  : "safe-text-secondary hover:bg-white/80 hover:safe-text-title"
              }`}
            >
              <Icon className="w-4 h-4" aria-hidden />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "dashboard" && (
        <Card>
          <CardHeader title={t("financialDashboard")} />
          <CardContent>
            <DashboardFinancier
              kpis={payload.kpis}
              revenueByMonth={payload.revenueByMonth}
            />
          </CardContent>
        </Card>
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
  );
}
