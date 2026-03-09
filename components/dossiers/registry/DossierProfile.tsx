"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  DossierProfileTabs,
  useDefaultDossierTabs,
  type DossierProfileTabId,
} from "./DossierProfileTabs";
import { DossierOverview, type DossierOverviewData } from "./DossierOverview";
import { DossierBilling, type TimeEntryRow } from "./DossierBilling";
import { DossierTrustAccount } from "./DossierTrustAccount";
import { DossierNotes } from "./DossierNotes";
import { DossierTasks, type DossierTacheItem } from "./DossierTasks";
import { DossierEvents, type DossierEvenementItem } from "./DossierEvents";
import { DossierDebours, type DeboursDossierRow } from "./DossierDebours";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";

export type DossierNoteItem = {
  id: string;
  content: string;
  createdAt: Date;
  createdByNom: string | null;
};

export type DossierProfileData = {
  overview: DossierOverviewData;
  dossierId: string;
  timeEntries: TimeEntryRow[];
  totalHeures: number;
  totalMontant: number;
  documentsSlot: React.ReactNode;
  tasks: DossierTacheItem[];
  events: DossierEvenementItem[];
  notes: DossierNoteItem[];
  taskUsers: { id: string; nom: string }[];
  descriptionConfidentielle: string | null;
  notesStrategieJuridique: string | null;
  soldeFiducieDossier: number | null;
  autoriserPaiementFiducie: boolean;
  clientTrustLink?: React.ReactNode;
  debours: DeboursDossierRow[];
  deboursTypes: { id: string; nom: string; categorie: string }[];
};

interface DossierProfileProps {
  data: DossierProfileData;
}

export function DossierProfile({ data }: DossierProfileProps) {
  const t = useTranslations("matters");
  const [activeTab, setActiveTab] = useState<DossierProfileTabId>("overview");

  const defaultTabs = useDefaultDossierTabs();
  const proceduresCount =
    data.tasks.length + data.events.length;
  const tabs = defaultTabs.map((tab) =>
    tab.id === "procedures"
      ? { ...tab, count: proceduresCount > 0 ? proceduresCount : undefined }
      : tab.id === "time"
        ? { ...tab, count: data.timeEntries.length > 0 ? data.timeEntries.length : undefined }
        : tab.id === "debours"
          ? { ...tab, count: data.debours.length > 0 ? data.debours.length : undefined }
          : tab
  );

  return (
    <div className="space-y-6">
      <DossierProfileTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DossierOverview data={data.overview} />
          <DossierTrustAccount
            soldeFiducieDossier={data.soldeFiducieDossier}
            autoriserPaiementFiducie={data.autoriserPaiementFiducie}
            clientTrustLink={data.clientTrustLink}
          />
        </div>
      )}

      {activeTab === "procedures" && (
        <div className="space-y-8">
          <section aria-labelledby="documents-heading">
            <Card>
              <CardHeader title={t("matterDocuments")} />
              <CardContent>{data.documentsSlot}</CardContent>
            </Card>
          </section>
          <section aria-labelledby="tasks-heading">
            <DossierTasks
              dossierId={data.dossierId}
              tasks={data.tasks}
              users={data.taskUsers}
            />
          </section>
          <section aria-labelledby="events-heading">
            <DossierEvents dossierId={data.dossierId} events={data.events} />
          </section>
        </div>
      )}

      {activeTab === "time" && (
        <div className="space-y-8">
          <section aria-labelledby="time-heading">
            <DossierBilling
              dossierId={data.dossierId}
              totalHeures={data.totalHeures}
              totalMontant={data.totalMontant}
              timeEntries={data.timeEntries}
            />
          </section>
        </div>
      )}

      {activeTab === "debours" && (
        <section aria-labelledby="debours-heading">
          <DossierDebours
            dossierId={data.dossierId}
            clientId={data.overview.clientId}
            debours={data.debours}
            deboursTypes={data.deboursTypes}
          />
        </section>
      )}

      {activeTab === "notes" && (
        <DossierNotes
          dossierId={data.dossierId}
          notes={data.notes}
          descriptionConfidentielle={data.descriptionConfidentielle}
          notesStrategieJuridique={data.notesStrategieJuridique}
        />
      )}
    </div>
  );
}
