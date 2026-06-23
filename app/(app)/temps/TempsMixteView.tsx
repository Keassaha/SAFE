"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Plus, Package, Clock, Layers } from "lucide-react";
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

const money = new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD" });
const dateFmt = new Intl.DateTimeFormat("fr-CA", { day: "2-digit", month: "short" });

export function TempsMixteView({ cabinetId, userId, role, dossiers, overview }: TempsMixteViewProps) {
  const t = useTranslations("temps.mixte");
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

  return (
    <div className="space-y-6 animate-fade-in">
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <SummaryCard
                icon={<Clock className="w-5 h-5" />}
                label={t("cards.timeUnbilled")}
                count={t("cards.entries", { count: overview.tempsCount })}
                amount={money.format(overview.tempsMontant)}
              />
              <SummaryCard
                icon={<Package className="w-5 h-5" />}
                label={t("cards.forfaitsToBill")}
                count={t("cards.tasks", { count: overview.forfaitCount })}
                amount={money.format(overview.forfaitMontant)}
              />
              <SummaryCard
                icon={<Layers className="w-5 h-5" />}
                label={t("cards.totalToBill")}
                count={t("cards.items", { count: totalCount })}
                amount={money.format(totalMontant)}
                highlight
              />
            </div>

            <Card>
              <CardHeader title={t("recent.title")} />
              <CardContent className="p-0">
                {overview.recent.length === 0 ? (
                  <div className="p-8 text-center text-sm text-si-muted">
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
                          <span
                            className={`inline-flex items-center gap-1 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                              item.type === "forfait"
                                ? "bg-si-amber/[0.13] text-si-amber-ink"
                                : "bg-si-forest/[0.06] text-si-forest"
                            }`}
                          >
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
                          <span className="text-sm font-medium text-si-ink tabular-nums">
                            {money.format(item.montant)}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Horaire ── */}
        <TabsContent value="horaire">
          <TempsPageClient
            cabinetId={cabinetId}
            userId={userId}
            role={role}
            hideAddButton
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

function SummaryCard({
  icon,
  label,
  count,
  amount,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  count: string;
  amount: string;
  highlight?: boolean;
}) {
  return (
    <Card className={highlight ? "border-si-forest" : undefined}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-sm text-si-muted">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-si-verified/10 text-si-verified">
            {icon}
          </span>
          {label}
        </div>
        <div className="mt-3 text-2xl font-semibold text-si-ink tabular-nums">{amount}</div>
        <div className="mt-1 text-xs text-si-muted">{count}</div>
      </CardContent>
    </Card>
  );
}
