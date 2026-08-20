"use client";

import { useState } from "react";
import { Figure } from "@/components/ui/Figure";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Plus, Package, Clock } from "lucide-react";
import { TempsPageClient } from "./TempsPageClient";
import { RegistreTachesPage } from "./RegistreTachesPage";
import { AjoutEntreeChooser } from "@/components/temps/AjoutEntreeChooser";
import type { UserRole } from "@prisma/client";

interface DossierOption {
  id: string;
  intitule: string;
  numeroDossier: string | null;
  type: string | null;
  statut: string;
  clientId: string;
  client: {
    id: string;
    typeClient: string;
    raisonSociale: string | null;
    prenom: string | null;
    nom: string | null;
  } | null;
}

export interface MixteRecentItem {
  id: string;
  type: "horaire" | "forfait";
  date: string;
  label: string;
  montant: number;
}

export interface MixteOverviewData {
  tempsCount: number;
  tempsMontant: number;
  forfaitCount: number;
  forfaitMontant: number;
  recent: MixteRecentItem[];
}

interface TempsMixteViewProps {
  cabinetId: string;
  userId: string;
  role: UserRole;
  dossiers: DossierOption[];
  overview: MixteOverviewData;
}

export function TempsMixteView({ cabinetId, userId, role, dossiers, overview }: TempsMixteViewProps) {
  const t = useTranslations("temps.mixte");
  const locale = useLocale();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [chooserOpen, setChooserOpen] = useState(false);
  const [horaireAddOpen, setHoraireAddOpen] = useState(false);
  const [forfaitAddOpen, setForfaitAddOpen] = useState(false);

  const handleChoose = (kind: "forfait" | "horaire") => {
    setChooserOpen(false);
    if (kind === "forfait") {
      setActiveTab("forfait");
      setForfaitAddOpen(true);
    } else {
      setActiveTab("horaire");
      setHoraireAddOpen(true);
    }
  };

  const handleAddClick = () => {
    if (activeTab === "horaire") {
      setHoraireAddOpen(true);
      return;
    }
    if (activeTab === "forfait") {
      setForfaitAddOpen(true);
      return;
    }
    setChooserOpen(true);
  };

  const handleEntrySaved = () => {
    setHoraireAddOpen(false);
    setForfaitAddOpen(false);
    router.refresh();
  };

  const totalMontant = overview.tempsMontant + overview.forfaitMontant;
  const totalCount = overview.tempsCount + overview.forfaitCount;
  const money = new Intl.NumberFormat(locale === "fr" ? "fr-CA" : "en-CA", {
    style: "currency",
    currency: "CAD",
  });
  // `TimeEntry.date` et `RegistreTache.date` sont des jours de calendrier posés
  // à minuit UTC par le formulaire. Sans `timeZone: "UTC"`, le Québec les lit à
  // 20 h la veille et l'activité récente affiche un jour de moins que le
  // registre juste à côté. Même règle que `formatCalendarDate`.
  const dateFmt = new Intl.DateTimeFormat(locale === "fr" ? "fr-CA" : "en-CA", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  });

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <TabsList>
            <TabsTrigger value="overview">{t("tabs.overview")}</TabsTrigger>
            <TabsTrigger value="horaire">{t("tabs.horaire")}</TabsTrigger>
            <TabsTrigger value="forfait">{t("tabs.forfait")}</TabsTrigger>
          </TabsList>
          <Button variant="primary" onClick={handleAddClick}>
            <Plus className="w-4 h-4" /> {t("addEntry")}
          </Button>
        </div>

        {/* ── Vue d'ensemble ── */}
        <TabsContent value="overview">
          <div className="space-y-6">
            <div className="grid border-y border-si-line bg-si-surface sm:grid-cols-3">
              <SummaryMetric
                label={t("cards.timeUnbilled")}
                count={t("cards.entries", { count: overview.tempsCount })}
                amount={money.format(overview.tempsMontant)}
              />
              <SummaryMetric
                label={t("cards.forfaitsToBill")}
                count={t("cards.tasks", { count: overview.forfaitCount })}
                amount={money.format(overview.forfaitMontant)}
              />
              <SummaryMetric
                label={t("cards.totalToBill")}
                count={t("cards.items", { count: totalCount })}
                amount={money.format(totalMontant)}
              />
            </div>

            <section className="border-y border-si-line bg-si-surface" aria-labelledby="recent-activity-title">
              <h2 id="recent-activity-title" className="px-4 py-3 text-sm font-medium text-si-ink">
                {t("recent.title")}
              </h2>
              <div className="border-t border-si-line">
                {overview.recent.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-si-muted">
                    {t("recent.empty")}
                  </div>
                ) : (
                  <ul className="divide-y divide-si-line">
                    {overview.recent.map((item) => (
                      <li
                        key={`${item.type}-${item.id}`}
                        className="flex items-center justify-between gap-3 px-4 py-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-si-muted">
                            {item.type === "forfait" ? (
                              <Package className="w-3 h-3" />
                            ) : (
                              <Clock className="w-3 h-3" />
                            )}
                            {item.type === "forfait" ? t("tabs.forfait") : t("tabs.horaire")}
                          </span>
                          <span className="truncate text-sm text-si-ink">{item.label}</span>
                        </div>
                        <div className="flex items-center gap-4 shrink-0">
                          <span className="text-xs text-si-muted">
                            {dateFmt.format(new Date(item.date))}
                          </span>
                          <span className="font-mono text-sm font-medium tabular-nums text-si-ink">
                            {money.format(item.montant)}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          </div>
        </TabsContent>

        {/* ── Horaire ── */}
        <TabsContent value="horaire">
          <TempsPageClient
            cabinetId={cabinetId}
            userId={userId}
            role={role}
            hideAddButton
            hideHeader
            addModalOpen={horaireAddOpen}
            onAddModalOpenChange={setHoraireAddOpen}
            onAddSuccess={handleEntrySaved}
          />
        </TabsContent>

        {/* ── Forfait ── */}
        <TabsContent value="forfait">
          <RegistreTachesPage
            dossiers={dossiers}
            hideAddButton
            addModalOpen={forfaitAddOpen}
            onAddModalOpenChange={setForfaitAddOpen}
            onAddSuccess={handleEntrySaved}
          />
        </TabsContent>
      </Tabs>

      <AjoutEntreeChooser
        open={chooserOpen}
        onClose={() => setChooserOpen(false)}
        onChoose={handleChoose}
      />
    </div>
  );
}

function SummaryMetric({
  label,
  count,
  amount,
}: {
  label: string;
  count: string;
  amount: string;
}) {
  return (
    <div className="border-b border-si-line2 px-4 py-3 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
      <p className="text-xs font-medium text-si-muted">{label}</p>
      <p className="mt-2 text-right">
        <Figure taille="secondaire">{amount}</Figure>
      </p>
      <p className="mt-1 text-right text-xs text-si-muted">{count}</p>
    </div>
  );
}
