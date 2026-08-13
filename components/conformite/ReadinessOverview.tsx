import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { CheckCircle2, AlertTriangle, AlertCircle, MinusCircle, ShieldCheck } from "lucide-react";
import { routes } from "@/lib/routes";
import type { ReadinessReport, ReadinessDomainId, ReadinessState, DomainResult } from "@/lib/admin/readiness";
import { Figure } from "@/components/ui/Figure";

/**
 * Vue conformité pleine page, orientée cabinet (étape 3 du plan de différenciation).
 * Rend le vrai moteur de readiness (14 domaines) en « prêt pour l'inspection » :
 * score en tête + état vert/jaune/rouge par domaine, chacun cliquable vers l'écran
 * à corriger. Doctrine « jamais conforme sans preuve » (moteur). Les libellés de
 * preuve/action proviennent du moteur (FR) ; le cadre de page est i18n FR/EN.
 */

const DOMAIN_TITLE_KEY: Record<ReadinessDomainId, string> = {
  identity: "readinessDomainIdentity",
  province: "readinessDomainProvince",
  taxes: "readinessDomainTaxes",
  billing: "readinessDomainBilling",
  trust: "readinessDomainTrust",
  team: "readinessDomainTeam",
  user_access: "readinessDomainUserAccess",
  roles: "readinessDomainRoles",
  subscription: "readinessDomainSubscription",
  retention: "readinessDomainRetention",
  audit_log: "readinessDomainAuditLog",
  security: "readinessDomainSecurity",
  onboarding: "readinessDomainOnboarding",
  console: "readinessDomainConsole",
};

const DOMAIN_ROUTE: Record<ReadinessDomainId, string> = {
  identity: routes.parametresCabinet,
  province: routes.parametresCabinet,
  taxes: routes.parametresFacture,
  billing: routes.parametresFacture,
  trust: routes.parametres,
  team: routes.employees,
  user_access: routes.employees,
  roles: routes.employees,
  subscription: routes.parametresAbonnement,
  retention: routes.parametresRetention,
  audit_log: routes.parametresAudit,
  security: routes.parametres,
  onboarding: routes.parametres,
  console: routes.parametres,
};

type StateStyle = {
  labelKey: string;
  dot: string;
  chipBg: string;
  chipText: string;
  Icon: typeof CheckCircle2;
  iconColor: string;
};

const STATE_STYLE: Record<ReadinessState, StateStyle> = {
  complete: {
    labelKey: "stateComplete",
    dot: "bg-si-verified",
    chipBg: "bg-si-verified/10 border-si-verified/30",
    chipText: "text-si-verified",
    Icon: CheckCircle2,
    iconColor: "text-si-verified",
  },
  warning: {
    labelKey: "stateWarning",
    dot: "bg-si-amber",
    chipBg: "bg-si-amber/[0.13] border-si-amber/30",
    chipText: "text-si-amber-ink",
    Icon: AlertTriangle,
    iconColor: "text-si-amber-ink",
  },
  to_complete: {
    labelKey: "stateToComplete",
    dot: "bg-si-amber",
    chipBg: "bg-si-amber/[0.13] border-si-amber/30",
    chipText: "text-si-amber-ink",
    Icon: AlertTriangle,
    iconColor: "text-si-amber-ink",
  },
  blocking: {
    labelKey: "stateBlocking",
    dot: "bg-status-error",
    chipBg: "bg-status-error-bg border-status-error/30",
    chipText: "text-status-error",
    Icon: AlertCircle,
    iconColor: "text-status-error",
  },
  not_applicable: {
    labelKey: "stateNotApplicable",
    dot: "bg-si-muted/40",
    chipBg: "bg-si-canvas border-si-line",
    chipText: "text-si-muted",
    Icon: MinusCircle,
    iconColor: "text-si-muted/60",
  },
};

/** Ordre d'affichage : ce qui demande une action d'abord, puis conforme, puis non applicable. */
const STATE_ORDER: Record<ReadinessState, number> = {
  blocking: 0,
  to_complete: 1,
  warning: 2,
  complete: 3,
  not_applicable: 4,
};

export async function ReadinessOverview({ report }: { report: ReadinessReport }) {
  const t = await getTranslations("conformite");
  const td = await getTranslations("parametres");

  const scoreColor =
    report.score >= 80 ? "text-si-verified" : report.score >= 50 ? "text-si-amber-ink" : "text-status-error";

  const domaines: DomainResult[] = [...report.domains].sort(
    (a, b) => STATE_ORDER[a.state] - STATE_ORDER[b.state]
  );
  const aTraiter = domaines.filter((d) => d.state !== "complete" && d.state !== "not_applicable");
  const conformes = domaines.filter((d) => d.state === "complete");
  const nonApplicables = domaines.filter((d) => d.state === "not_applicable");
  const pret = aTraiter.length === 0;

  return (
    <div className="space-y-6">
      {/* Une seule question en tête : le cabinet est-il en règle. Le score la
          précise, il ne la remplace pas. L'anneau qui redoublait le chiffre a
          été retiré : deux représentations de la même valeur ne renseignent
          pas deux fois. */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-lg border border-si-line bg-si-surface p-6">
        <ShieldCheck className={`h-6 w-6 shrink-0 ${scoreColor}`} aria-hidden />
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-medium leading-tight text-si-ink">
            {pret ? t("verdictReady") : t("verdictNotReady")}
          </h2>
          <p className="mt-1 text-sm text-si-muted">
            {t("summary", { compliant: conformes.length, toTreat: aTraiter.length })}
          </p>
        </div>
        <p className="shrink-0 text-right">
          <Figure taille="principale" teinte={report.score >= 80 ? "confirme" : "attention"}>
            {report.score} %
          </Figure>
          <span className="mt-0.5 block text-xs text-si-muted">{t("readyTitle")}</span>
        </p>
      </div>

      {/* Ce qui demande une action, et rien d'autre. Une ligne par obligation,
          pas une grille de tuiles identiques : la grille présentait les
          quatorze domaines au même poids, y compris ceux déjà en règle. */}
      <section>
        <h3 className="text-sm font-medium text-si-ink">{t("toTreatHeading")}</h3>
        {aTraiter.length === 0 ? (
          <p className="safe-feuille mt-3 px-5 py-6 text-sm text-si-muted">
            {t("nothingToTreat")}
          </p>
        ) : (
          <ul className="safe-feuille mt-3 divide-y divide-si-line2 overflow-hidden">
            {aTraiter.map((d) => {
              const style = STATE_STYLE[d.state];
              const Icon = style.Icon;
              return (
                <li
                  key={d.domain}
                  className="safe-zoom-rang flex flex-wrap items-start gap-x-4 gap-y-2 px-5 py-4"
                >
                  <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${style.iconColor}`} aria-hidden />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-medium text-si-ink">{td(DOMAIN_TITLE_KEY[d.domain])}</h4>
                      <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${style.chipBg} ${style.chipText}`}>
                        {t(style.labelKey)}
                      </span>
                    </div>
                    {d.action || d.evidence ? (
                      <p className="mt-1 text-xs leading-relaxed text-si-muted">{d.action ?? d.evidence}</p>
                    ) : null}
                  </div>
                  <Link
                    href={DOMAIN_ROUTE[d.domain]}
                    className="inline-flex min-h-11 shrink-0 items-center text-sm font-medium text-si-ink underline-offset-4 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-si-ink/25"
                  >
                    {t("fix")}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Le reste ne demande rien. Il reste consultable, il ne s'impose plus. */}
      {conformes.length > 0 ? (
        <details className="safe-feuille overflow-hidden">
          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-si-ink marker:content-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-si-verified">
            {t("compliantHeading", { count: conformes.length })}
          </summary>
          <ul className="divide-y divide-si-line2 border-t border-si-line">
            {conformes.map((d) => (
              <li key={d.domain} className="safe-zoom-rang flex items-start gap-3 px-5 py-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-si-verified" aria-hidden />
                <div className="min-w-0">
                  <p className="text-sm text-si-ink">{td(DOMAIN_TITLE_KEY[d.domain])}</p>
                  {d.evidence ? <p className="mt-0.5 text-xs text-si-muted">{d.evidence}</p> : null}
                </div>
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      {nonApplicables.length > 0 ? (
        <p className="text-xs text-si-muted">
          {t("notApplicableHeading", { count: nonApplicables.length })}
        </p>
      ) : null}
    </div>
  );
}
