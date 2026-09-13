"use client";
import { useFormatteurs } from "@/lib/i18n/formatteurs";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { routes } from "@/lib/routes";
import { PageHeader } from "@/components/ui/PageHeader";
import { MovementLegend } from "@/components/comptabilite/MovementLegend";
import { JournauxOnglets } from "@/components/comptabilite/JournauxOnglets";
// Types Prisma générés (pas d'instance prisma sur le namespace @prisma/client)
import type { BankImportSession, BankImportTransaction, ExpenseCategory } from "@prisma/client";
import type { JournalKpiData } from "@/types/journal";
import type { ExpenseJournalKpisData } from "@/app/(app)/journal/depenses/ExpenseJournalPageView";
import type { DepenseListe } from "@/lib/expense-journal/charger";
import { GeneralJournalPageView } from "@/app/(app)/journal/general/GeneralJournalPageView";
import { ExpenseJournalPageView } from "@/app/(app)/journal/depenses/ExpenseJournalPageView";
import type { DepenseATaxeEstimee } from "@/components/expense-journal/TaxesAConfirmerSection";
import { FacturationPaiementsView } from "@/app/(app)/facturation/paiements/PaiementsView";

export type ComptabiliteTabId = "general" | "depenses" | "paiements";

type SessionWithCount = BankImportSession & { _count: { transactions: number } };

interface ComptabilitePageViewProps {
  cabinetId: string;
  initialJournalKpis: JournalKpiData;
  expenseData: {
    kpis: ExpenseJournalKpisData;
    sessions: SessionWithCount[];
    categories: ExpenseCategory[];
    transactions: BankImportTransaction[];
    depenses: DepenseListe[];
    taxesAConfirmer: DepenseATaxeEstimee[];
    taxesSansOrigine: number;
  };
  /** Mode consultant SAFE Inc. : masque le fidéicommis (non pertinent). */
  isSafeInc?: boolean;
  /** Nombre d'entrées par journal, porté par l'onglet. */
  comptes?: { general: number; depenses: number; paiements: number };
  /** Tenir les livres (saisie, import, validation). Sinon : lecture seule. */
  canWriteJournal?: boolean;
  /** Accès au module Paiements (même droit que /facturation/paiements). */
  canSeePayments?: boolean;
}

export function ComptabilitePageView({
  cabinetId,
  initialJournalKpis,
  expenseData,
  isSafeInc = false,
  canWriteJournal = true,
  canSeePayments = true,
  comptes,
}: ComptabilitePageViewProps) {
  const t = useTranslations("accountingUi");
  const { formatCurrency } = useFormatteurs();
  const searchParams = useSearchParams();
  const tab = (searchParams.get("tab") as ComptabiliteTabId) || "general";
  // Un onglet inconnu — ou refusé au rôle — retombe sur le journal général
  // plutôt que d'afficher une vue qui ne chargera pas.
  const availableTabs: ComptabiliteTabId[] = canSeePayments ? ["general", "depenses", "paiements"] : ["general", "depenses"];
  const effectiveTab = availableTabs.includes(tab) ? tab : "general";
  const k = initialJournalKpis;
  const [showHelp, setShowHelp] = useState(false);

  /* Les trois journaux, en onglets.
   *
   * Ils vivaient dans un menu déroulant qui portait aussi une colonne
   * « Raccourcis » de six liens vers Facturation, Fidéicommis, Rapprochement,
   * Créances, Taxes et Rapports. C'était un second menu à l'intérieur d'une
   * page, et les six destinations sont déjà atteignables : les trois premières
   * par le menu principal, les trois autres depuis l'écran Facturation.
   * Décision CEO du 2026-09-09. Trois choix ne se cachent pas derrière un clic.
   *
   * Le motif d'onglet est celui de la fiche dossier, validé le 2026-08-27 :
   * filet bas, souligné plein sur l'actif, jetons si-*. */
  const journalItems = [
    { id: "general" as const, label: t("tabGeneralJournal"), desc: t("journalGeneralDesc"), count: comptes?.general },
    { id: "depenses" as const, label: t("tabExpenseJournal"), desc: t("journalExpensesDesc"), count: comptes?.depenses },
    // Les paiements dépendent du droit de facturation : l'API qui les sert le
    // vérifie. Proposer l'onglet sans le droit n'afficherait qu'une erreur.
    ...(canSeePayments
      ? [{ id: "paiements" as const, label: t("tabPayments"), desc: t("journalPaymentsDesc"), count: comptes?.paiements }]
      : []),
  ];
  /* L'onglet courant est un état local, pas une navigation.
   *
   * Chaque onglet était un lien : changer de journal repartait au serveur, le
   * trait sous l'onglet sautait au lieu de glisser, et la page clignotait. Les
   * trois journaux sont pourtant déjà tous chargés dans ce composant.
   *
   * `history.replaceState` garde l'adresse partageable sans provoquer de
   * navigation. Contrepartie assumée, dite au CEO le 2026-09-09 : le bouton
   * Précédent ne revient plus à l'onglet précédent. */
  const [ongletLocal, setOngletLocal] = useState<ComptabiliteTabId | null>(null);
  const ongletActif = ongletLocal ?? effectiveTab;
  const choisirOnglet = (id: ComptabiliteTabId) => {
    setOngletLocal(id);
    window.history.replaceState(null, "", routes.comptabiliteTab(id));
  };

  // Synthèse financière en liste dense plutôt qu'en cartes KPI.
  // Doctrine interface intérieure §6 et §7 : pas de boîtes à ombre pour porter un
  // total, et tous les montants alignés sur un même bord droit (règle L2) pour
  // qu'ils se comparent d'un coup d'œil.
  const summaryRows = [
    {
      href: routes.facturation,
      title: t("cardBilledTitle"),
      amount: k.totalFacture,
      explanation: t("cardBilledExpl"),
      trust: false,
    },
    {
      // Le détail des encaissements vit dans l'onglet Paiements de cette page.
      // Pointer sur /facturation/paiements renvoyait au tableau de bord un rôle
      // sans droit de facturation : la synthèse garde son lecteur. Sans ce
      // droit, le chiffre reste lisible mais la ligne ne mène nulle part.
      href: canSeePayments ? routes.comptabiliteTab("paiements") : null,
      title: t("cardCollectedTitle"),
      amount: k.totalEncaisse,
      explanation: t("cardCollectedExpl"),
      trust: false,
    },
    {
      href: routes.facturationCreancesAging,
      title: t("cardReceivableTitle"),
      amount: k.comptesARecevoir,
      explanation: t("cardReceivableExpl"),
      trust: false,
    },
    {
      // Même raison : /journal/depenses n'est plus qu'une redirection 308 vers
      // cet onglet. Autant y aller directement.
      href: routes.comptabiliteTab("depenses"),
      title: t("cardExpensesTitle"),
      amount: k.totalDepenses,
      explanation: t("cardExpensesExpl"),
      trust: false,
    },
  ];
  /* Le solde de fidéicommis ne figure plus ici. Décision CEO du 2026-09-09.
   *
   * Les livres du fidéicommis sont des livres SÉPARÉS : compte bancaire propre,
   * registre propre, rapprochement propre. L'écran s'intitulait « L'argent du
   * cabinet, sans mélange » et la ligne disait « Jamais un revenu », puis posait
   * le montant dans la même liste que les revenus. Aligné sous eux, sur le même
   * bord droit, il invitait exactement la comparaison qu'un cabinet ne doit
   * jamais faire.
   *
   * Aucune alerte de fidéicommis non plus : le rapprochement en retard se voit
   * déjà au Fidéicommis, en Conformité et aux Points à surveiller. Une
   * quatrième copie n'aurait averti personne de plus. */

  return (
    /* Plus de largeur propre. La page s'imposait 1 180 px là où toute
       l'application en fait 1 280 : elle était la seule, et les cent pixels
       perdus tronquaient le client et le dossier dans le journal.
       Signalé par le CEO le 2026-09-09. */
    <div className="w-full px-2 pb-24 pt-4 font-sans">
      {/* Plus de bannière. Un écran de comptabilité s'ouvre sur des chiffres,
          pas sur un bandeau de marque : la hauteur gagnée sert à la lecture. */}
      {/* Un seul titre. « L'argent du cabinet » doublait « Comptabilité »
          trente pixels plus bas ; la barre de chiffres se pose sous le titre
          et sa phrase, comme sur les autres écrans d'argent. « Comprendre les
          mouvements » devient un lien discret à droite. Demande CEO du
          2026-09-12. */}
      <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <PageHeader
          variant="dashboard"
          title={t("pageTitle")}
          description={
            isSafeInc
              ? "Une vue claire des flux : cash, factures, créances et dépenses."
              : t("pageDescription")
          }
        />
        <button
          type="button"
          onClick={() => setShowHelp((v) => !v)}
          aria-expanded={showHelp}
          className="min-h-tap self-start pb-4 text-[13px] text-si-muted underline decoration-si-line underline-offset-2 hover:text-si-ink hover:decoration-si-ink-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-si-verified lg:self-auto"
        >
          {showHelp ? t("hideHelp") : t("understandTitle")}
        </button>
      </div>

      {/* ── La synthèse : la grammaire de la Facturation. ── */}
      <dl
        aria-label={t("snapshotTitle")}
        className="grid grid-cols-1 gap-x-8 gap-y-4 border-b border-si-line pb-5 min-[400px]:grid-cols-2 sm:gap-y-5 lg:flex lg:gap-x-12"
      >
        {summaryRows.map((row) => {
          const mesure = (
            <>
              <dt className="text-[11px] font-medium uppercase tracking-[0.08em] text-si-muted">{row.title}</dt>
              <dd className="mt-1.5 flex items-baseline gap-2">
                <span className="font-mono text-[18px] font-medium leading-[24px] tabular-nums text-si-ink sm:text-[22px] sm:leading-[26px]">
                  {formatCurrency(row.amount)}
                </span>
                <span className="truncate text-[12px] text-si-muted">{row.explanation}</span>
              </dd>
            </>
          );
          return row.href ? (
            <Link key={row.title} href={row.href} className="group min-w-0 rounded-md">
              {mesure}
            </Link>
          ) : (
            <div key={row.title} className="min-w-0">
              {mesure}
            </div>
          );
        })}
      </dl>

      {showHelp && (
        <div className="mt-4">
          <MovementLegend />
        </div>
      )}

      {/* ── Les trois journaux : une feuille, les onglets en tête, les boutons
          du journal actif sur la même ligne. ── */}
      <section className="safe-feuille mt-6 overflow-hidden">
        <JournauxOnglets
          items={journalItems}
          actif={ongletActif}
          onChoisir={choisirOnglet}
          ariaLabel={t("tabsAriaLabel")}
          actionsHostId="compta-journal-actions"
        />
        <div className={ongletActif === "general" ? "" : "p-5"}>
          {ongletActif === "general" && (
            <GeneralJournalPageView
              initialKpis={initialJournalKpis}
              embedded
              canWrite={canWriteJournal}
            />
          )}
          {ongletActif === "depenses" && (
            <ExpenseJournalPageView
              embedded
              cabinetId={cabinetId}
              kpis={expenseData.kpis}
              sessions={expenseData.sessions}
              categories={expenseData.categories}
              transactions={expenseData.transactions}
              depenses={expenseData.depenses}
              taxesAConfirmer={expenseData.taxesAConfirmer}
              taxesSansOrigine={expenseData.taxesSansOrigine}
              canWrite={canWriteJournal}
            />
          )}
          {ongletActif === "paiements" && canSeePayments && (
            <FacturationPaiementsView cabinetId={cabinetId} embeddedInComptabilite />
          )}
        </div>
      </section>
    </div>
  );
}
