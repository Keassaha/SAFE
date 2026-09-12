"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useFormatteurs } from "@/lib/i18n/formatteurs";
import {
  registreCellClass,
  registreCellMutedClass,
  registreCellNumClass,
  registreHeadCellClass,
  registreHeadRowClass,
  registreRowClass,
  RegistrePlainHeader,
} from "@/components/ui/registre";

export interface TrustSummary {
  soldeTotal: number;
  depotsMois: number;
  retraitsMois: number;
  nbDossiersAvecProvision: number;
}

export interface TrustReconciliationStatus {
  expectedPeriode: string;
  daysSinceMonthEnd: number;
  overdue: boolean;
  critical: boolean;
  lastCertifiedPeriode: string | null;
}

export interface TrustAccountAlert {
  accountId: string;
  clientNom: string;
  dossierIntitule: string | null;
  currentBalance: number;
  derniereActivite: string;
  inactifJours: number;
}

export interface TrustAlertsReport {
  soldesNegatifs: TrustAccountAlert[];
  fondsDormants: TrustAccountAlert[];
  ecartRapprochement: { periode: string; ecart: number; status: string } | null;
  summary: { nbCritiques: number; nbAvertissements: number };
}

const ANCRE_SURVEILLANCE = "comptes-a-surveiller";

/**
 * Barre de synthèse du fidéicommis, présentationnelle.
 *
 * Remplace deux cartes d'état et quatre cartes de chiffres. Quand tout va
 * bien, le calme se dit en une ligne. Quand quelque chose cloche, la ligne
 * passe en ambre ou en rouge, en toutes lettres, et devient un lien : la
 * couleur ne travaille jamais seule (WCAG 1.4.1). Grammaire de la barre de
 * synthèse de la Facturation. Demande CEO du 2026-09-12.
 */
export function TrustSummaryBarView({
  summary,
  reconciliation,
  alerts,
}: {
  summary: TrustSummary | null;
  reconciliation: TrustReconciliationStatus | null;
  alerts: TrustAlertsReport | null;
}) {
  const tf = useTranslations("fideicommis");
  const { formatCurrency, intlLocale } = useFormatteurs();

  /* ── Rapprochement ── */
  let rapprochement: { texte: string; ton: "ok" | "amber" | "danger" | "muted"; lien: boolean } = {
    texte: "—",
    ton: "muted",
    lien: false,
  };
  if (reconciliation) {
    const aJour =
      !reconciliation.overdue &&
      !reconciliation.critical &&
      reconciliation.lastCertifiedPeriode === reconciliation.expectedPeriode;
    if (aJour) rapprochement = { texte: tf("reconciliationCertified"), ton: "ok", lien: false };
    else if (reconciliation.critical)
      rapprochement = {
        texte: tf("reconciliationLate", { days: reconciliation.daysSinceMonthEnd }),
        ton: "danger",
        lien: true,
      };
    else if (reconciliation.overdue) rapprochement = { texte: tf("reconciliationDue"), ton: "amber", lien: true };
    else rapprochement = { texte: tf("reconciliationPending"), ton: "muted", lien: true };
  }

  /* ── Surveillance ── */
  const nbNegatifs = alerts?.soldesNegatifs.length ?? 0;
  const nbDormants = alerts?.fondsDormants.length ?? 0;
  const ecart = alerts?.ecartRapprochement ?? null;
  const parts: string[] = [];
  if (nbNegatifs > 0) parts.push(tf("negativeBalancesCount", { count: nbNegatifs }));
  if (nbDormants > 0) parts.push(tf("dormantFundsCount", { count: nbDormants }));
  if (ecart) parts.push(tf("reconciliationGapShort"));
  const rienASurveiller = alerts ? parts.length === 0 : null;
  const tonSurveillance: "danger" | "amber" | "muted" =
    nbNegatifs > 0 || ecart ? "danger" : nbDormants > 0 ? "amber" : "muted";

  const couleur = (ton: "ok" | "amber" | "danger" | "muted") =>
    ton === "ok"
      ? "text-si-verified"
      : ton === "amber"
        ? "text-si-amber-ink"
        : ton === "danger"
          ? "text-si-danger-ink"
          : "text-si-muted";

  const dt = "text-[11px] font-medium uppercase tracking-[0.08em] text-si-muted";
  const chiffre =
    "font-mono text-[18px] font-medium leading-[24px] tabular-nums text-si-ink sm:text-[22px] sm:leading-[26px]";
  const mot = "text-[15px] font-medium leading-[24px] sm:leading-[26px]";
  const lienClasse =
    "underline decoration-si-line underline-offset-2 hover:decoration-current focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-si-verified";

  const periodeLisible = (p: string | null | undefined) => {
    if (!p) return "—";
    const [a, m] = p.split("-").map(Number);
    if (!a || !m) return p;
    const s = new Intl.DateTimeFormat(intlLocale, { month: "long", year: "numeric" }).format(new Date(a, m - 1, 1));
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  return (
    <>
      <dl
        aria-label={tf("summaryLabel")}
        className="grid grid-cols-1 gap-x-8 gap-y-4 border-b border-si-line pb-5 min-[400px]:grid-cols-2 sm:gap-y-5 lg:flex lg:flex-wrap lg:gap-x-10"
      >
        <div className="min-w-0">
          <dt className={dt}>{tf("totalBalanceShort")}</dt>
          <dd className="mt-1.5 flex items-baseline gap-2">
            <span className={chiffre}>{summary ? formatCurrency(summary.soldeTotal) : "—"}</span>
            {summary ? (
              <span className="truncate text-[12px] text-si-muted">
                {tf("mattersWithProvisionCount", { count: summary.nbDossiersAvecProvision })}
              </span>
            ) : null}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className={dt}>{tf("monthlyDeposits")}</dt>
          <dd className="mt-1.5">
            <span className={chiffre}>{summary ? formatCurrency(summary.depotsMois) : "—"}</span>
          </dd>
        </div>
        <div className="min-w-0">
          <dt className={dt}>{tf("monthlyWithdrawals")}</dt>
          <dd className="mt-1.5">
            <span className={chiffre}>{summary ? formatCurrency(summary.retraitsMois) : "—"}</span>
          </dd>
        </div>
        <div className="min-w-0">
          <dt className={dt}>
            {reconciliation
              ? tf("reconciliationOf", { period: periodeLisible(reconciliation.expectedPeriode) })
              : tf("reconciliationOf", { period: "—" })}
          </dt>
          <dd className="mt-1.5">
            {rapprochement.lien ? (
              <Link href="/comptes/rapprochement" className={`${mot} ${couleur(rapprochement.ton)} ${lienClasse}`}>
                {rapprochement.texte}
              </Link>
            ) : (
              <span className={`${mot} ${couleur(rapprochement.ton)}`}>{rapprochement.texte}</span>
            )}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className={dt}>{tf("toWatch")}</dt>
          <dd className="mt-1.5">
            {rienASurveiller === null ? (
              <span className={`${mot} text-si-muted`}>—</span>
            ) : rienASurveiller ? (
              <span className={`${mot} font-normal text-si-muted`}>{tf("nothingToWatch")}</span>
            ) : (
              <a href={`#${ANCRE_SURVEILLANCE}`} className={`${mot} ${couleur(tonSurveillance)} ${lienClasse}`}>
                {parts.join(" · ")}
              </a>
            )}
          </dd>
        </div>
      </dl>

      {/* La liste des comptes concernés, seulement quand il y en a. Un
          inspecteur veut les noms, pas seulement le compte. */}
      {alerts && parts.length > 0 ? (
        <section
          id={ANCRE_SURVEILLANCE}
          aria-label={tf("watchListTitle")}
          className="safe-feuille overflow-hidden scroll-mt-24"
        >
          <div className="border-b border-si-line px-5 py-3">
            <h2 className="text-[15px] font-medium text-si-ink">{tf("watchListTitle")}</h2>
          </div>
          <table className="w-full border-collapse">
            <thead>
              <tr className={registreHeadRowClass}>
                <th scope="col" className={registreHeadCellClass}>
                  <RegistrePlainHeader label={tf("colClientMatter")} />
                </th>
                <th scope="col" className={registreHeadCellClass}>
                  <RegistrePlainHeader label={tf("toWatch")} />
                </th>
                <th scope="col" className={`${registreHeadCellClass} text-right`}>
                  <RegistrePlainHeader label={tf("colAmount")} align="right" />
                </th>
              </tr>
            </thead>
            <tbody>
              {ecart ? (
                <tr className={registreRowClass}>
                  <td className={registreCellClass}>
                    <Link href="/comptes/rapprochement" className={`text-si-ink ${lienClasse}`}>
                      {tf("reconciliationOf", { period: periodeLisible(ecart.periode) })}
                    </Link>
                  </td>
                  <td className={`${registreCellMutedClass} text-si-danger-ink`}>{tf("watchGap")}</td>
                  <td className={`${registreCellNumClass} text-si-danger-ink`}>{formatCurrency(ecart.ecart)}</td>
                </tr>
              ) : null}
              {alerts.soldesNegatifs.map((a) => (
                <tr key={`n-${a.accountId}`} className={registreRowClass}>
                  <td className={registreCellClass}>
                    <span className="block text-[14px] font-medium leading-5">{a.clientNom}</span>
                    {a.dossierIntitule ? (
                      <span className="block text-[12px] leading-4 text-si-muted">{a.dossierIntitule}</span>
                    ) : null}
                  </td>
                  <td className={`${registreCellMutedClass} text-si-danger-ink`}>{tf("watchNegative")}</td>
                  <td className={`${registreCellNumClass} text-si-danger-ink`}>{formatCurrency(a.currentBalance)}</td>
                </tr>
              ))}
              {alerts.fondsDormants.map((a) => (
                <tr key={`d-${a.accountId}`} className={registreRowClass}>
                  <td className={registreCellClass}>
                    <span className="block text-[14px] font-medium leading-5">{a.clientNom}</span>
                    {a.dossierIntitule ? (
                      <span className="block text-[12px] leading-4 text-si-muted">{a.dossierIntitule}</span>
                    ) : null}
                  </td>
                  <td className={`${registreCellMutedClass} text-si-amber-ink`}>
                    {tf("watchDormant", { days: a.inactifJours })}
                  </td>
                  <td className={registreCellNumClass}>{formatCurrency(a.currentBalance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}
    </>
  );
}

/** La barre, branchée sur les trois lectures existantes. */
export function TrustSummaryBar({ cabinetId }: { cabinetId: string | null }) {
  const { data: summary } = useQuery({
    queryKey: ["fideicommis", "summary"],
    queryFn: async () => {
      const res = await fetch("/api/fideicommis/summary");
      if (!res.ok) throw new Error("Erreur chargement");
      return res.json() as Promise<TrustSummary>;
    },
    enabled: Boolean(cabinetId),
  });
  const { data: reconciliation } = useQuery({
    queryKey: ["reconciliation", "status"],
    queryFn: async () => {
      const res = await fetch("/api/fideicommis/reconciliation?statusOnly=true");
      if (!res.ok) throw new Error("Error loading reconciliation status");
      return res.json() as Promise<TrustReconciliationStatus>;
    },
  });
  const { data: alerts } = useQuery({
    queryKey: ["fideicommis", "alerts"],
    queryFn: async () => {
      const res = await fetch("/api/fideicommis/alerts");
      if (!res.ok) throw new Error("Erreur chargement des alertes");
      return res.json() as Promise<TrustAlertsReport>;
    },
  });
  return (
    <TrustSummaryBarView summary={summary ?? null} reconciliation={reconciliation ?? null} alerts={alerts ?? null} />
  );
}
