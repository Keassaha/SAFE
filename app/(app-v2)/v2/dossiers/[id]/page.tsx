import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { getCabinetDossierTaxonomyById } from "@/lib/dossiers/cabinet-dossier-taxonomy";
import { localizedLabel } from "@/lib/dossiers/taxonomy";
import { getDossierFinancialSummary } from "@/lib/dossiers/financial-summary";
import s from "../../v2.module.css";
import { SetCrumbs } from "../../_components/crumbs";
import { clientDisplayName } from "../../_components/primitives";
import { MatterHeader } from "./_components/MatterHeader";
import { MatterTabsNav, normalizeTab } from "./_components/MatterTabsNav";
import { OverviewTab } from "./_components/OverviewTab";
import { FinancialStrip } from "./_components/FinancialStrip";
import { TimeTab } from "./_components/TimeTab";
import { BillingTab } from "./_components/BillingTab";
import { TrustTab } from "./_components/TrustTab";
import { ActivityTab } from "./_components/ActivityTab";
import { DocumentsTab } from "./_components/DocumentsTab";

export const metadata: Metadata = {
  title: "Dossier | SAFE",
};

/**
 * Page dossier v2 « Calme opérationnel » — structure parallèle d'évaluation.
 * Onglets pilotés par ?tab= : seule la donnée de l'onglet actif est chargée.
 * Référence des chargements : app/(app)/dossiers/[id]/page.tsx (legacy).
 */
export default async function DossierDetailV2Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab: rawTab } = await searchParams;
  const tab = normalizeTab(rawTab);
  const { cabinetId, userId, role } = await requireCabinetAndUser();

  const summaryPromise = getDossierFinancialSummary(cabinetId, id);
  const dossier = await prisma.dossier.findFirst({
    where: { id, cabinetId },
    include: {
      client: {
        select: {
          id: true,
          typeClient: true,
          raisonSociale: true,
          prenom: true,
          nom: true,
        },
      },
      avocatResponsable: { select: { nom: true } },
      mandate: { select: { checklist: true, statutDossier: true } },
    },
  });
  if (!dossier) notFound();

  const clientName = clientDisplayName(dossier.client);
  const numeroDossier = dossier.numeroDossier ?? dossier.reference ?? "Dossier";

  // Libellé du domaine via la taxonomie du cabinet (ex. immobilier → Immobilier).
  let typeLabel: string | null = null;
  if (dossier.type) {
    const taxonomy = await getCabinetDossierTaxonomyById(cabinetId);
    const subject = taxonomy?.subjects.find((sub) => sub.code === dossier.type);
    typeLabel = subject
      ? localizedLabel(subject, "fr")
      : dossier.type.charAt(0).toUpperCase() + dossier.type.slice(1).replace(/_/g, " ");
  }

  // Badge « Mandat incomplet » — même dérivation que la page legacy.
  const mandatChecklist =
    (dossier.mandate?.checklist as Array<{
      obligatoire?: boolean;
      checked?: boolean;
    }> | null) ?? [];
  const mandatIncomplet = mandatChecklist.some(
    (item) => item.obligatoire === true && item.checked !== true,
  );

  const summary = await summaryPromise;

  return (
    <>
      <SetCrumbs
        items={[
          { label: "Dossiers", href: "/v2/dossiers" },
          { label: clientName },
          { label: numeroDossier, strong: true },
        ]}
      />
      <MatterHeader
        dossierId={id}
        numeroDossier={numeroDossier}
        intitule={dossier.intitule}
        statut={dossier.statut}
        typeLabel={typeLabel}
        clientId={dossier.client.id}
        clientName={clientName}
        avocatNom={dossier.avocatResponsable?.nom ?? null}
        mandatIncomplet={mandatIncomplet}
        tauxHoraire={dossier.tauxHoraire}
        userId={userId}
      />

      <FinancialStrip dossierId={id} summary={summary} />

      <MatterTabsNav
        dossierId={id}
        active={tab}
        counts={{
          time: summary.readyToBillCount || undefined,
          billing: summary.issuedInvoiceCount || undefined,
        }}
      />

      <div className={s.content}>
        {tab === "overview" ? (
          <OverviewTab
            cabinetId={cabinetId}
            dossierId={id}
            userId={userId}
            role={role}
            clientId={dossier.client.id}
            clientName={clientName}
            avocatNom={dossier.avocatResponsable?.nom ?? null}
            dateOuverture={dossier.dateOuverture}
            modeFacturation={dossier.modeFacturation}
            tauxHoraire={dossier.tauxHoraire}
            resumeDossier={dossier.resumeDossier}
          />
        ) : tab === "time" ? (
          <TimeTab
            cabinetId={cabinetId}
            dossierId={id}
            numeroDossier={numeroDossier}
            intitule={dossier.intitule}
            clientName={clientName}
            userId={userId}
            summary={summary}
          />
        ) : tab === "billing" ? (
          <BillingTab cabinetId={cabinetId} dossierId={id} summary={summary} />
        ) : tab === "trust" ? (
          <TrustTab
            cabinetId={cabinetId}
            dossierId={id}
            numeroDossier={numeroDossier}
            summary={summary}
          />
        ) : tab === "activity" ? (
          <ActivityTab cabinetId={cabinetId} dossierId={id} />
        ) : (
          <DocumentsTab
            cabinetId={cabinetId}
            dossierId={id}
            statutDossier={dossier.mandate?.statutDossier ?? dossier.statut}
            dossierType={dossier.type}
            sousType={dossier.sousType}
          />
        )}
      </div>
    </>
  );
}
