"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { routes } from "@/lib/routes";
import { useCabinetProvince } from "@/components/providers/CabinetProvinceProvider";
import { getTrustRegulatorCopy } from "@/lib/trust/regulator";
import { AddTransactionButton } from "./AddTransactionButton";
import { TrustSummaryBar } from "./TrustSummaryBar";
import { TransactionsTable, type FiltresOperations } from "./TransactionsTable";
import { ReleveModal, type ReleveInitial } from "./ReleveModal";

interface ClientOption {
  id: string;
  raisonSociale: string | null;
  prenom: string | null;
  nom: string | null;
}

interface DossierOption {
  id: string;
  clientId: string;
  intitule: string;
  numeroDossier: string | null;
}

export interface FideicommisDashboardProps {
  cabinetId: string | null;
  canEdit: boolean;
  clients: ClientOption[];
  dossiers: DossierOption[];
}

const lienClasse =
  "min-h-tap inline-flex items-center rounded px-1 text-[13px] text-si-body underline decoration-si-line underline-offset-2 transition-colors hover:text-si-ink hover:decoration-si-ink-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-si-verified";

/**
 * L'écran du fidéicommis.
 *
 * Huit blocs précédaient le tableau : un lien de retour, l'en-tête, une carte
 * vers l'Inspection, un bandeau de rapprochement, un panneau de surveillance,
 * quatre cartes de chiffres, trois boutons et une carte d'information. Quand
 * tout allait bien, deux cartes vertes le disaient chacune de leur côté.
 *
 * Il reste l'en-tête, une barre de chiffres, une rangée de liens, puis le
 * registre sur toute la largeur. Le relevé PDF, qui prenait un tiers de
 * l'écran avec deux listes que les filtres proposaient déjà, devient une
 * fenêtre pré-remplie. Demande CEO du 2026-09-12.
 */
export function FideicommisDashboard({ cabinetId, canEdit, clients, dossiers }: FideicommisDashboardProps) {
  const tf = useTranslations("fideicommis");
  const copy = getTrustRegulatorCopy(useCabinetProvince());
  const searchParams = useSearchParams();

  /* La fiche client envoie ici avec `?clientId=` depuis toujours, et l'écran
     l'ignorait : on re-choisissait le client dans le filtre. */
  const clientDemande = searchParams.get("clientId") ?? "";
  const [filtres, setFiltres] = useState<FiltresOperations>({
    clientId: clients.some((c) => c.id === clientDemande) ? clientDemande : "",
    dossierId: "",
    dateFrom: "",
    dateTo: "",
  });
  useEffect(() => {
    if (clientDemande && clients.some((c) => c.id === clientDemande)) {
      setFiltres((f) => (f.clientId === clientDemande ? f : { ...f, clientId: clientDemande, dossierId: "" }));
    }
  }, [clientDemande, clients]);

  const [releveOuvert, setReleveOuvert] = useState(false);
  const releveInitial = useMemo<ReleveInitial>(() => {
    const base = filtres.dateFrom ? new Date(`${filtres.dateFrom}T12:00:00`) : new Date();
    return {
      mois: base.getMonth() + 1,
      annee: base.getFullYear(),
      clientId: filtres.clientId,
      dossierId: filtres.dossierId,
    };
  }, [filtres]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <PageHeader variant="dashboard" title={tf("pageTitle")} description={tf("pageIntro")} />
        <div className="flex flex-wrap items-center gap-2 pb-4">
          <Button type="button" variant="secondary" onClick={() => setReleveOuvert(true)} disabled={!cabinetId}>
            {tf("statementPdf")}
          </Button>
          <AddTransactionButton canEdit={canEdit} cabinetId={cabinetId} clients={clients} dossiers={dossiers} />
        </div>
      </div>

      <TrustSummaryBar cabinetId={cabinetId} />

      {/* Une rangée de liens, plus une carte, trois boutons et un encart :
          ce sont des destinations qu'on consulte, pas des étapes du geste. */}
      <nav aria-label={tf("trustLinksLabel")} className="flex flex-wrap items-center gap-x-1 gap-y-1 text-[13px]">
        <Link href="/comptes/rapprochement" className={lienClasse}>
          {copy.reconciliationButton}
        </Link>
        <span className="text-si-muted" aria-hidden>·</span>
        <Link href="/comptes/rapports" className={lienClasse}>
          {copy.complianceReportsButton}
        </Link>
        <span className="text-si-muted" aria-hidden>·</span>
        <Link href={routes.inspection} className={lienClasse}>
          {tf("linkInspection")}
        </Link>
        <span className="text-si-muted" aria-hidden>·</span>
        <Link href={routes.securite} className={lienClasse}>
          {tf("linkWatch")}
        </Link>
        {/* « …depuis la Facturation. section Facturation » : la phrase
            nommait la Facturation, puis le lien la renommait. Le mot de la
            phrase est désormais le lien (2026-10-01). */}
        <span className="ml-3 text-si-muted">
          {tf.rich("allocateHintLink", {
            link: (chunks) => (
              <Link
                href={routes.facturation}
                className="underline decoration-si-line underline-offset-2 hover:text-si-ink"
              >
                {chunks}
              </Link>
            ),
          })}
        </span>
      </nav>

      <TransactionsTable
        cabinetId={cabinetId}
        clients={clients}
        dossiers={dossiers}
        filtres={filtres}
        onFiltres={setFiltres}
      />

      <ReleveModal
        open={releveOuvert}
        onClose={() => setReleveOuvert(false)}
        clients={clients}
        dossiers={dossiers}
        initial={releveInitial}
      />
    </div>
  );
}
