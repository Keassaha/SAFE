"use client";
import { useFormatteurs } from "@/lib/i18n/formatteurs";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { tMicro } from "@/lib/motion";
import { BookOpen, CreditCard, Receipt } from "lucide-react";
import { routes } from "@/lib/routes";
import { PageHeader } from "@/components/ui/PageHeader";
import { Figure } from "@/components/ui/Figure";
import { MovementLegend } from "@/components/comptabilite/MovementLegend";
// Types Prisma générés (pas d'instance prisma sur le namespace @prisma/client)
import type { BankImportSession, BankImportTransaction, ExpenseCategory } from "@prisma/client";
import type { JournalKpiData } from "@/types/journal";
import type { ExpenseJournalKpisData } from "@/app/(app)/journal/depenses/ExpenseJournalPageView";
import { GeneralJournalPageView } from "@/app/(app)/journal/general/GeneralJournalPageView";
import { ExpenseJournalPageView } from "@/app/(app)/journal/depenses/ExpenseJournalPageView";
import type { DepenseATaxeEstimee } from "@/components/expense-journal/TaxesAConfirmerSection";
import { FacturationPaiementsView } from "@/app/(app)/facturation/paiements/PaiementsView";

export type ComptabiliteTabId = "general" | "depenses" | "paiements";

const TABS: {
  id: ComptabiliteTabId;
  labelKey: "tabGeneralJournal" | "tabExpenseJournal" | "tabPayments";
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}[] = [
  { id: "general", labelKey: "tabGeneralJournal", icon: BookOpen },
  { id: "depenses", labelKey: "tabExpenseJournal", icon: Receipt },
  { id: "paiements", labelKey: "tabPayments", icon: CreditCard },
];

type SessionWithCount = BankImportSession & { _count: { transactions: number } };

interface ComptabilitePageViewProps {
  cabinetId: string;
  initialJournalKpis: JournalKpiData;
  expenseData: {
    kpis: ExpenseJournalKpisData;
    sessions: SessionWithCount[];
    categories: ExpenseCategory[];
    transactions: BankImportTransaction[];
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
  const availableTabs = TABS.filter((tab_) => tab_.id !== "paiements" || canSeePayments);
  const effectiveTab = availableTabs.some((tab_) => tab_.id === tab) ? tab : "general";
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
    { id: "general" as const, label: t("tabGeneralJournal"), desc: t("journalGeneralDesc"), icon: BookOpen },
    { id: "depenses" as const, label: t("tabExpenseJournal"), desc: t("journalExpensesDesc"), icon: Receipt },
    // Les paiements dépendent du droit de facturation : l'API qui les sert le
    // vérifie. Proposer l'onglet sans le droit n'afficherait qu'une erreur.
    ...(canSeePayments
      ? [{ id: "paiements" as const, label: t("tabPayments"), desc: t("journalPaymentsDesc"), icon: CreditCard }]
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

  const compteDe = (id: ComptabiliteTabId) =>
    id === "general" ? comptes?.general : id === "depenses" ? comptes?.depenses : comptes?.paiements;

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
      <PageHeader
        variant="dashboard"
        title={t("pageTitle")}
        description={
          isSafeInc
            ? "Une vue claire des flux : cash, factures, créances et dépenses."
            : t("pageDescription")
        }
      />

      {/* ── Bloc 1 : synthèse financière ── */}
      <section className="mt-8">
        <h2 className="font-serif text-[22px] leading-tight text-si-ink">{t("snapshotTitle")}</h2>

        {/* La grammaire est celle de la page Facturation (`FacturationMainKpis`) :
            libellé en petites capitales, montant en mono tabulaire, un mot
            d'appoint à côté, aucun cadre, aucun filet vertical, un seul filet
            en bas. Les deux écrans d'argent du produit se lisent donc de la
            même façon. Demande CEO du 2026-09-09.

            Les explications étaient des phrases entières. Elles deviennent le
            mot d'appoint, à la place et au rôle que Facturation lui donne. */}
        <dl className="mt-4 grid grid-cols-1 gap-x-8 gap-y-4 border-b border-si-line pb-5 min-[400px]:grid-cols-2 sm:gap-y-5 lg:flex lg:gap-x-12">
          {summaryRows.map((row) => {
            const mesure = (
              <>
                <dt className="text-[11px] font-medium uppercase tracking-[0.08em] text-si-muted">
                  {row.title}
                </dt>
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
      </section>

      {/* ── Bloc 2 : les trois journaux ──────────────────────────────────
          Onglets horizontaux, en EN-TÊTE DE LA CARTE. La colonne verticale
          mangeait 224 px de largeur, et c'est ce qui poussait le registre à
          défiler de gauche à droite. Signalé par le CEO le 2026-09-09.

          Le motif est celui de la fiche dossier, avec deux ajouts : les
          onglets et le registre forment un seul objet au lieu d'une barre
          posée au-dessus d'une boîte, et chaque onglet porte son compte,
          comme « Cartable (9) ». */}
      <section className="mt-10">
        <p className="mb-4 max-w-[65ch] text-[13px] leading-relaxed text-si-muted">
          {t("detailsDesc")}{" "}
          <button
            type="button"
            onClick={() => setShowHelp((v) => !v)}
            aria-expanded={showHelp}
            className="font-medium text-si-ink-strong underline decoration-si-line underline-offset-2 hover:decoration-si-ink-strong"
          >
            {showHelp ? t("hideHelp") : t("showHelp")}
          </button>
        </p>

        {showHelp && (
          <div className="mb-4">
            <MovementLegend />
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-si-line bg-si-surface">
          <nav
            /* Pas de `overflow-x-auto` : trois onglets tiennent toujours, et
               le conteneur défilant faisait apparaître une barre de défilement
               à l'intérieur de la carte. Sous 640 px ils passent à la ligne. */
            className="flex flex-wrap gap-1 border-b border-si-line px-2"
            aria-label={t("tabsAriaLabel")}
          >
            {journalItems.map((j) => {
              const Icon = j.icon;
              const actif = ongletActif === j.id;
              const n = compteDe(j.id);
              return (
                <button
                  key={j.id}
                  type="button"
                  onClick={() => choisirOnglet(j.id)}
                  aria-current={actif ? "page" : undefined}
                  title={j.desc}
                  /* `safe-zoom` : la surface se soulève au survol, elle ne se
                     peint pas en gris. Règle dure du 2026-08-11. */
                  className={`min-h-tap safe-zoom relative -mb-px flex shrink-0 items-center gap-2.5 whitespace-nowrap px-4 py-3.5 text-sm font-medium ${
                    actif ? "text-si-ink" : "text-si-muted hover:text-si-body"
                  }`}
                >
                  {actif && (
                    /* Le trait GLISSE d'un onglet à l'autre au lieu de sauter :
                       l'onglet est un état local, donc le composant n'est plus
                       démonté à chaque changement. */
                    <motion.span
                      layoutId="compta-onglet"
                      className="absolute inset-x-0 bottom-0 h-0.5 rounded-t bg-si-ink"
                      transition={tMicro}
                      aria-hidden
                    />
                  )}
                  <Icon className="relative z-10 h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden />
                  <span className="relative z-10">{j.label}</span>
                  {typeof n === "number" && (
                    <span
                      className={`relative z-10 rounded-full px-1.5 py-0.5 font-mono text-[12px] tabular-nums ${
                        actif ? "bg-si-ink/10 text-si-ink" : "bg-si-ink/[0.055] text-si-muted"
                      }`}
                    >
                      {n}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="p-5">
            {/* Plus de titre de section : l'onglet actif nomme déjà le journal,
                et il le nommait une deuxième fois quarante pixels plus bas, avec
                la même icône. Signalé par le CEO le 2026-09-09. Restent les
                boutons, qui se posent sur la ligne des filtres du journal. */}
            <div
              id="compta-journal-actions"
              className="mb-4 flex flex-wrap items-center justify-end gap-2 empty:mb-0"
            />

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
              taxesAConfirmer={expenseData.taxesAConfirmer}
              taxesSansOrigine={expenseData.taxesSansOrigine}
              canWrite={canWriteJournal}
            />
          )}
          {ongletActif === "paiements" && canSeePayments && (
            <FacturationPaiementsView cabinetId={cabinetId} embeddedInComptabilite />
          )}
          </div>
        </div>
      </section>
    </div>
  );
}
