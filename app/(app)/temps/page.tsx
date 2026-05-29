import { getTranslations } from "next-intl/server";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { TempsPageClient } from "./TempsPageClient";
import { RegistreTachesPage } from "./RegistreTachesPage";
import { TempsMixteView, type MixteRecentItem } from "./TempsMixteView";
import { getCabinetBillingMode } from "@/lib/services/cabinet-interface";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import type { UserRole } from "@prisma/client";

const DOSSIER_SELECT = {
  id: true,
  intitule: true,
  numeroDossier: true,
  type: true,
  statut: true,
  clientId: true,
  client: {
    select: {
      id: true,
      typeClient: true,
      raisonSociale: true,
      prenom: true,
      nom: true,
    },
  },
} as const;

function clientLabel(c: {
  raisonSociale: string | null;
  prenom: string | null;
  nom: string | null;
} | null): string {
  if (!c) return "—";
  if (c.raisonSociale) return c.raisonSociale;
  return [c.prenom, c.nom].filter(Boolean).join(" ") || "—";
}

export default async function TempsPage() {
  const { cabinetId, userId, role } = await requireCabinetAndUser();

  const billingMode = await getCabinetBillingMode(cabinetId);

  // ── Mode forfait pur : registre des tâches (inchangé) ──
  if (billingMode === "forfait") {
    const [dossiers, t] = await Promise.all([
      prisma.dossier.findMany({
        where: { cabinetId, statut: { in: ["ouvert", "actif", "en_attente"] } },
        select: DOSSIER_SELECT,
        orderBy: { intitule: "asc" },
      }),
      getTranslations("temps.taskRegister"),
    ]);

    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader title={t("title")} description={t("description")} />
        <RegistreTachesPage dossiers={dossiers} />
      </div>
    );
  }

  // ── Mode mixte : vue d'ensemble + onglets Horaire / Forfait ──
  if (billingMode === "mixed") {
    const [dossiers, tempsAgg, forfaitAgg, recentTemps, recentForfaits, t] = await Promise.all([
      prisma.dossier.findMany({
        where: { cabinetId, statut: { in: ["ouvert", "actif", "en_attente"] } },
        select: DOSSIER_SELECT,
        orderBy: { intitule: "asc" },
      }),
      // Temps non facturé : facturable, pas encore facturé, non radié.
      prisma.timeEntry.aggregate({
        where: {
          cabinetId,
          facturable: true,
          isWrittenOff: false,
          billingStatus: { not: "BILLED" },
        },
        _count: { _all: true },
        _sum: { montant: true },
      }),
      // Forfaits à facturer : tâches complètes non encore rattachées à une ligne de facture.
      prisma.registreTache.aggregate({
        where: { cabinetId, statut: "complete", invoiceLineId: null },
        _count: { _all: true },
        _sum: { montantFinal: true },
      }),
      prisma.timeEntry.findMany({
        where: { cabinetId, facturable: true, isWrittenOff: false },
        select: { id: true, date: true, description: true, montant: true },
        orderBy: { date: "desc" },
        take: 10,
      }),
      prisma.registreTache.findMany({
        where: { cabinetId },
        select: {
          id: true,
          date: true,
          description: true,
          montantFinal: true,
          dossier: { select: { client: { select: { raisonSociale: true, prenom: true, nom: true } } } },
        },
        orderBy: { date: "desc" },
        take: 10,
      }),
      getTranslations("temps.mixte"),
    ]);

    const recent: MixteRecentItem[] = [
      ...recentTemps.map((e) => ({
        id: e.id,
        type: "horaire" as const,
        date: e.date.toISOString(),
        label: e.description || t("recent.untitledTime"),
        montant: e.montant,
      })),
      ...recentForfaits.map((r) => ({
        id: r.id,
        type: "forfait" as const,
        date: r.date.toISOString(),
        label: r.description || clientLabel(r.dossier?.client ?? null),
        montant: r.montantFinal,
      })),
    ]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 10);

    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader title={t("title")} description={t("description")} />
        <TempsMixteView
          cabinetId={cabinetId}
          userId={userId}
          role={role as UserRole}
          dossiers={dossiers}
          overview={{
            tempsCount: tempsAgg._count._all,
            tempsMontant: tempsAgg._sum.montant ?? 0,
            forfaitCount: forfaitAgg._count._all,
            forfaitMontant: forfaitAgg._sum.montantFinal ?? 0,
            recent,
          }}
        />
      </div>
    );
  }

  // ── Mode horaire pur (défaut) : saisie horaire (inchangé) ──
  return (
    <TempsPageClient
      cabinetId={cabinetId}
      userId={userId}
      role={role as UserRole}
    />
  );
}
