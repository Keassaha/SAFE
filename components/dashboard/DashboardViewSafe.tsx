import { getFormatteurs } from "@/lib/i18n/formatteurs-serveur";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { DashboardPayload, ActivityFeedItem } from "@/lib/dashboard/types";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import { GettingStarted } from "@/components/dashboard/GettingStarted";
import { CashflowChart } from "@/components/dashboard/CashflowChart";
import {
  ComplianceStrip,
  KpiCard,
  Obligations,
  type ComplianceItem,
  type Obligation,
} from "@/components/ds-safe/sections";
import { Card, CardTitle } from "@/components/ds-safe/core";
import { ArrowUpRight } from "lucide-react";
import { routes } from "@/lib/routes";

/**
 * Tableau de bord — design system safe-interface (variante froide albâtre).
 *
 * Consomme le MÊME `DashboardPayload` que `DashboardView` (aucune re-requête) :
 * on ne change que la présentation. `DashboardView` reste disponible comme repli
 * (revert = remettre `<DashboardView>` dans la page).
 */
/**
 * Ordre de lecture du tableau de bord.
 *
 * ## Ce qui n'allait pas (constat CEO, 2026-08-12)
 *
 * « L'info n'est pas claire et bien hiérarchisée. » Trois défauts mesurables :
 *
 * 1. La carte de priorité occupait la totalité du premier écran — un titre
 *    sérif de 35 px, deux montants et un bouton — pour afficher deux fois
 *    « 0,00 $ ». Le premier écran d'un cockpit doit porter des chiffres, pas
 *    une phrase.
 * 2. Le fidéicommis, seul montant que le Barreau vient vérifier, était la
 *    quatrième tuile sur quatre, sous la ligne de flottaison. Rien ne le
 *    distinguait du chiffre d'affaires.
 * 3. Aucun diagramme. Les douze mois de facturé et d'encaissé existaient dans
 *    la charge utile depuis toujours et n'étaient dessinés nulle part ; les
 *    ratios de performance étaient dispersés dans une petite carte de bas de
 *    page.
 *
 * ## L'ordre retenu
 *
 *   1. la décision du jour, en une bande compacte avec son geste ;
 *   2. l'état réglementaire, en une bande fine ;
 *   3. LES MONTANTS, fidéicommis en tête et en grand ;
 *   4. le diagramme des flux et les ratios de performance, côte à côte ;
 *   5. ce que le cabinet attend de vous (Navette) ;
 *   6. obligations, lecture financière, activité ;
 *   7. la configuration, en dernier, parce qu'elle finit par disparaître.
 */
export async function DashboardViewSafe({
  payload,
  glance,
}: {
  payload: DashboardPayload;
  /** Bloc Navette. Injecté par la page, qui seule sait le construire. */
  glance?: React.ReactNode;
}) {
  const { intlLocale } = await getFormatteurs();
  const t = await getTranslations("dashboard");
  const {
    kpis,
    alerts,
    lastReconciliation,
    indicators,
    activeClientsCount,
    activeDossiersCount,
    soldeFideicommis,
    activityFeed,
    onboardingChecklist,
    revenueChartData,
  } = payload;

  // Cabinet neuf : tant que l'onboarding n'est pas complet, on guide d'abord.
  const onboardingComplete = onboardingChecklist
    ? Object.values(onboardingChecklist).every(Boolean)
    : true;
  const showOnboarding = Boolean(onboardingChecklist) && !onboardingComplete;

  const recon = lastReconciliation;
  const trustToReconcile = !recon || recon.status !== "certified" || recon.daysSince > 31;

  const dateLabel = new Date().toLocaleDateString(intlLocale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const compliance: ComplianceItem[] = [
    { label: "Dossiers actifs", value: String(activeDossiersCount), state: "ok" },
    { label: "Clients actifs", value: String(activeClientsCount), state: "ok" },
    {
      label: "Fidéicommis",
      value: trustToReconcile ? "À rapprocher" : "À jour",
      state: trustToReconcile ? "warn" : "ok",
    },
  ];

  const obligations: Obligation[] = [
    {
      title: "Rapprochement fidéicommis",
      detail: recon ? `Période ${recon.periode}` : "Jamais effectué",
      status: trustToReconcile ? "À faire" : "À jour",
      state: trustToReconcile ? "warn" : "ok",
    },
    {
      title: "Clients avec fonds en fiducie",
      detail: "Sommes détenues en fiducie (B-1 r.5)",
      status: String(indicators.activeTrustAccounts),
      state: "ok",
    },
    {
      title: "Factures impayées",
      detail: "Solde à recevoir",
      status: String(indicators.invoicesPending),
      state: indicators.invoicesPending > 0 ? "warn" : "ok",
    },
    {
      title: "Temps non facturé",
      detail: "Entrées prêtes à facturer",
      status: String(indicators.unbilledEntries),
      state: indicators.unbilledEntries > 0 ? "warn" : "ok",
    },
  ];

  return (
    <div className="bg-si-canvas text-si-ink font-sans rounded-2xl p-6 sm:p-8">
      {/* L'écran porte son nom, comme les 76 autres. La bascule sur cette vue
          l'avait perdu : la page s'ouvrait directement sur la décision du jour,
          seule de l'application à ne pas se présenter. Titre seul, sans
          sous-titre : le premier écran doit rester des chiffres. */}
      <PageHeader title={t("title")} />

      {/* 1. La décision du jour, en une bande. */}
      <BandeauAction
        titre={
          trustToReconcile
            ? "Rapprochez le fidéicommis"
            : "Suivez vos sommes à recevoir"
        }
        contexte={
          trustToReconcile
            ? recon
              ? `Dernier rapprochement certifié il y a ${recon.daysSince} jours.`
              : "Aucun rapprochement n'a encore été effectué."
            : "Le fidéicommis est à jour. Reste à suivre les créances."
        }
        alertes={(alerts ?? []).slice(0, 2)}
        actionHref="/comptes/rapprochement"
        actionLabel="Rapprocher le fidéicommis"
      />

      {/* 2. L'état réglementaire, en une bande fine. */}
      <ComplianceStrip items={compliance} rightNote={dateLabel} />

      {/* 3. Les montants, fidéicommis en tête. */}
      <MontantsEssentiels
        fiducie={soldeFideicommis ?? kpis.trustBalance.value}
        clientsEnFiducie={indicators.activeTrustAccounts}
        fiducieARapprocher={trustToReconcile}
        resteARecevoir={kpis.outstandingInvoices.value}
        encaisse={kpis.paymentsReceived.value}
        factured={kpis.revenueThisMonth.value}
      />

      {/* 4. Le diagramme des flux et les ratios, côte à côte. */}
      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[1.7fr_1fr]">
        <Card className="px-6 py-[22px]">
          <div className="mb-1">
            <div className="font-mono text-[11px] uppercase tracking-[1.4px] text-si-verified">
              Flux du cabinet
            </div>
            <CardTitle className="mt-2">Facturé et encaissé</CardTitle>
          </div>
          <p className="mb-4 text-[12.5px] text-si-muted">
            L&apos;écart entre les deux barres, c&apos;est l&apos;argent que vous avez gagné mais
            qui n&apos;est pas encore rentré.
          </p>
          <CashflowChart data={revenueChartData} />
        </Card>

        <Performances
          items={[
            {
              label: "Taux d'encaissement",
              value: kpis.recoveryRate.value,
              aide: "Part du facturé réellement rentrée.",
            },
            {
              label: "Taux de facturation",
              value: kpis.billingRate.value,
              aide: "Part des heures travaillées qui a été facturée.",
            },
            {
              label: "Heures travaillées",
              value: kpis.hoursWorked.value,
              aide: "Total saisi sur la période.",
            },
            {
              label: "Heures facturées",
              value: kpis.hoursBilled.value,
              aide: "Portion portée à une facture.",
            },
            {
              label: "Valeur non facturée",
              value: kpis.unbilledHoursValue.value,
              aide: "Travail fait, pas encore porté à une facture.",
              appel: true,
            },
          ]}
        />
      </div>

      {/* 5. Ce que le cabinet attend de vous. */}
      {glance ? <div className="mt-6">{glance}</div> : null}

      {/* 6. Colonnes égales : aucun de ces blocs ne prime sur les autres. */}
      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Obligations items={obligations} />
        <div className="flex flex-col gap-5">
          <KpiCard
            title="Lecture financière du mois"
            kpis={[
              { label: "Sorties", value: kpis.expensesThisMonth.value },
              { label: "Cash non reçu", value: kpis.cashNotReceived.value },
            ]}
          />
          <ActivityCard items={activityFeed ?? []} />
        </div>
      </div>

      {/* 7. La configuration ferme la page : elle finira par disparaître. */}
      {showOnboarding && onboardingChecklist && (
        <div className="mt-8 border-t border-si-line pt-8">
          <GettingStarted checklist={onboardingChecklist} />
        </div>
      )}
    </div>
  );
}

/**
 * Bande d'action du jour.
 *
 * Remplace une carte qui prenait tout le premier écran. Le titre descend de
 * 35 px à 24 px, les deux montants qu'elle portait rejoignent le bloc des
 * montants — c'est leur place — et il reste ce que la bande doit dire : quoi
 * faire, pourquoi, et le bouton pour le faire.
 */
function BandeauAction({
  titre,
  contexte,
  alertes,
  actionHref,
  actionLabel,
}: {
  titre: string;
  contexte: string;
  alertes: { type: string; message: string; href: string }[];
  actionHref: string;
  actionLabel: string;
}) {
  return (
    <Card elevated className="mb-5 px-6 py-5 sm:px-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="font-mono text-[11px] uppercase tracking-[1.4px] text-si-verified">
            À traiter maintenant
          </div>
          {/* `h2` et non `h1` : le titre de la page est celui de l'écran. */}
          <h2 className="mt-1.5 font-serif text-[24px] leading-[1.15] text-si-ink sm:text-[26px]">
            {titre}
          </h2>
          <p className="mt-1 text-[13px] text-si-muted">{contexte}</p>
        </div>
        <Link
          href={actionHref}
          className="safe-zoom shrink-0 self-start rounded-xl safe-action-degrade px-[22px] py-3 text-center font-sans text-sm font-medium text-si-surface no-underline lg:self-auto"
        >
          {actionLabel}
        </Link>
      </div>

      {alertes.length > 0 && (
        <div className="mt-4 border-t border-si-line2 pt-3">
          {alertes.map((a) => (
            <Link
              key={a.message}
              href={a.href}
              className="safe-zoom-menu -mx-2 flex items-center gap-2.5 rounded-lg px-2 py-1.5 no-underline"
            >
              <span
                aria-hidden
                className={cn(
                  "h-[6px] w-[6px] shrink-0 rounded-full",
                  /trust|fidei|overdue|retard|urgent/i.test(a.type)
                    ? "bg-si-amber"
                    : "bg-si-verified",
                )}
              />
              <span className="min-w-0 flex-1 truncate text-[13px] text-si-body">{a.message}</span>
              <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-si-muted" aria-hidden />
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}

/**
 * Les montants du cabinet, fidéicommis en tête.
 *
 * Le fidéicommis occupe deux colonnes sur quatre et porte son compte de clients
 * et son état de rapprochement. Ce n'est pas une préférence de mise en page :
 * c'est le seul de ces quatre montants qui n'appartient pas au cabinet, le seul
 * que le Barreau vient vérifier, et le seul dont un écart met le permis en jeu.
 * Il ne peut pas être la quatrième tuile d'une rangée de quatre.
 */
function MontantsEssentiels({
  fiducie,
  clientsEnFiducie,
  fiducieARapprocher,
  resteARecevoir,
  encaisse,
  factured,
}: {
  fiducie: string;
  clientsEnFiducie: number;
  fiducieARapprocher: boolean;
  resteARecevoir: string;
  encaisse: string;
  factured: string;
}) {
  const secondaires = [
    {
      label: "Reste à recevoir",
      value: resteARecevoir,
      href: routes.facturationCreancesAging,
      pill: "Créances",
    },
    {
      label: "Encaissé ce mois",
      value: encaisse,
      href: routes.facturationPaiements,
      pill: "Encaissements",
    },
    {
      label: "Facturé ce mois",
      value: factured,
      href: routes.facturation,
      pill: "Facturation",
    },
  ];

  return (
    <section aria-label="Montants du cabinet" className="mt-5">
      <div className="mb-3 font-mono text-[11px] uppercase tracking-[1.4px] text-si-muted">
        Les montants à surveiller
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {/* Fidéicommis : deux colonnes sur cinq, chiffre au double de la taille. */}
        <Link
          href={routes.comptes}
          className="safe-carte-chiffre safe-zoom group relative overflow-hidden rounded-2xl safe-action-degrade px-[26px] py-6 text-si-surface no-underline sm:col-span-2"
          aria-label="Fidéicommis client"
        >
          <div
            aria-hidden
            className="absolute -left-[50px] -bottom-[70px] h-[220px] w-[220px] glow-verified"
          />
          <span className="relative z-10 mb-3.5 inline-flex items-center gap-2 rounded-full bg-si-verified/25 px-2.5 py-[5px] font-mono text-[10.5px] uppercase tracking-wider text-si-verified-on-forest">
            <span className="h-1.5 w-1.5 rounded-full bg-si-verified-dot" aria-hidden />
            Fidéicommis
          </span>
          <ArrowUpRight
            className="absolute right-[26px] top-6 z-10 h-4 w-4 opacity-50"
            aria-hidden
          />
          <div className="relative z-10 text-xs opacity-75">Sommes détenues pour vos clients</div>
          <div
            title={fiducie}
            className="safe-chiffre-porteur relative z-10 mt-1 font-mono"
          >
            {fiducie}
          </div>
          <div className="relative z-10 mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] opacity-80">
            <span>
              {clientsEnFiducie} client{clientsEnFiducie > 1 ? "s" : ""} avec des fonds
            </span>
            <span aria-hidden className="opacity-50">
              ·
            </span>
            <span>{fiducieARapprocher ? "Rapprochement à faire" : "Rapprochement à jour"}</span>
          </div>
        </Link>

        {secondaires.map((tile) => (
          <Link
            key={tile.label}
            href={tile.href}
            className="safe-carte-chiffre safe-zoom group relative overflow-hidden rounded-2xl safe-action-degrade px-[26px] py-6 text-si-surface no-underline"
            aria-label={tile.label}
          >
            <div
              aria-hidden
              className="absolute -left-[50px] -bottom-[70px] h-[200px] w-[200px] glow-verified"
            />
            <span className="relative z-10 mb-3.5 inline-flex items-center gap-2 rounded-full bg-si-verified/25 px-2.5 py-[5px] font-mono text-[10.5px] uppercase tracking-wider text-si-verified-on-forest">
              <span className="h-1.5 w-1.5 rounded-full bg-si-verified-dot" aria-hidden />
              {tile.pill}
            </span>
            <ArrowUpRight
              className="absolute right-[26px] top-6 z-10 h-4 w-4 opacity-50"
              aria-hidden
            />
            <div className="relative z-10 text-xs opacity-75">{tile.label}</div>
            <div title={tile.value} className="safe-chiffre relative z-10 mt-1 font-mono">
              {tile.value}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

/** Ratios de performance. Un chiffre, son nom, et ce qu'il veut dire. */
function Performances({
  items,
}: {
  items: { label: string; value: string; aide: string; appel?: boolean }[];
}) {
  return (
    <Card className="px-6 py-[22px]">
      <div className="font-mono text-[11px] uppercase tracking-[1.4px] text-si-verified">
        Vos performances
      </div>
      <CardTitle className="mb-1 mt-2">Ce que ça donne</CardTitle>
      <div className="mt-3">
        {items.map((k, i) => (
          <div
            key={k.label}
            className={cn("py-[11px]", i > 0 && "border-t border-si-line2")}
          >
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[13px] text-si-body">{k.label}</span>
              <span
                className={cn(
                  "font-mono text-base tabular-nums",
                  k.appel ? "text-si-amber-ink" : "text-si-ink",
                )}
              >
                {k.value}
              </span>
            </div>
            <p className="mt-0.5 text-[11.5px] text-si-muted">{k.aide}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function formatRelativeFr(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  if (hours < 24) return `il y a ${hours} h`;
  if (days < 7) return `il y a ${days} j`;
  return date.toLocaleDateString("fr-CA", { day: "numeric", month: "short" });
}

/* Fil des dernières actions du cabinet */
function ActivityCard({ items }: { items: ActivityFeedItem[] }) {
  return (
    <Card className="px-6 py-[22px]">
      <div className="flex items-baseline justify-between mb-3.5">
        <CardTitle>Activité récente</CardTitle>
        {items.length > 0 && (
          <Link
            href={routes.parametresAudit}
            className="text-xs text-si-verified font-medium no-underline hover:opacity-80"
          >
            Tout voir
          </Link>
        )}
      </div>
      {items.length === 0 ? (
        <p className="text-[13px] text-si-muted py-3">Aucune activité récente.</p>
      ) : (
        items.slice(0, 5).map((item, i) => (
          <div
            key={item.id}
            className={cn("flex items-start gap-3 py-[10px]", i > 0 && "border-t border-si-line2")}
          >
            <span className="mt-[7px] w-[7px] h-[7px] rounded-full bg-si-verified shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-[13px] text-si-ink truncate">
                <span className="font-medium">{item.action}</span>
                <span className="text-si-muted"> — {item.entityType}</span>
              </div>
              <div className="text-[11.5px] text-si-muted mt-0.5">
                {formatRelativeFr(item.timestamp)}
                {item.userDisplayName ? ` · ${item.userDisplayName}` : ""}
              </div>
            </div>
          </div>
        ))
      )}
    </Card>
  );
}
