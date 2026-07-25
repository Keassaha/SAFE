import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { CheckCircle2, AlertTriangle, AlertCircle, MinusCircle, ShieldCheck } from "lucide-react";
import { routes } from "@/lib/routes";
import type { ReadinessReport, ReadinessDomainId, ReadinessState, DomainResult } from "@/lib/admin/readiness";

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
    dot: "bg-[#B84A3E]",
    chipBg: "bg-[#B84A3E]/10 border-[#B84A3E]/30",
    chipText: "text-[#B84A3E]",
    Icon: AlertCircle,
    iconColor: "text-[#B84A3E]",
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
    report.score >= 80 ? "text-si-verified" : report.score >= 50 ? "text-si-amber-ink" : "text-[#B84A3E]";
  const ringColor = scoreColor;

  const compliant = report.counts.complete;
  const toTreat =
    report.counts.blocking + report.counts.to_complete + report.counts.warning;

  const domains: DomainResult[] = [...report.domains].sort(
    (a, b) => STATE_ORDER[a.state] - STATE_ORDER[b.state]
  );

  return (
    <div className="space-y-6">
      {/* En-tête : score « prêt pour l'inspection » */}
      <div className="rounded-[var(--safe-radius-lg)] border-2 border-si-line bg-si-surface p-6 flex items-center gap-6">
        <div className={`text-5xl font-bold tabular-nums ${scoreColor}`}>{report.score}%</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className={`w-5 h-5 ${scoreColor}`} aria-hidden />
            <h2 className="text-lg font-semibold text-si-ink">{t("readyTitle")}</h2>
          </div>
          <p className="mt-1 text-sm text-si-muted">
            {t("summary", { compliant, toTreat })}
          </p>
        </div>
        <div className="relative w-16 h-16 shrink-0" aria-hidden>
          <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="4" className="text-si-muted/25" />
            <circle
              cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="4"
              strokeDasharray={`${(report.score / 100) * 176} 176`}
              strokeLinecap="round"
              className={ringColor}
            />
          </svg>
        </div>
      </div>

      {/* Grille des 14 domaines */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {domains.map((d) => {
          const style = STATE_STYLE[d.state];
          const Icon = style.Icon;
          const actionable = d.state !== "complete" && d.state !== "not_applicable";
          return (
            <div
              key={d.domain}
              className="rounded-[var(--safe-radius-lg)] border border-si-line bg-si-surface p-4 flex flex-col gap-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${style.iconColor}`} aria-hidden />
                  <h3 className="text-sm font-semibold text-si-ink truncate">
                    {td(DOMAIN_TITLE_KEY[d.domain])}
                  </h3>
                </div>
                <span
                  className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium ${style.chipBg} ${style.chipText}`}
                >
                  {t(style.labelKey)}
                </span>
              </div>

              {(d.evidence || d.action) && (
                <p className="text-xs text-si-muted leading-snug">
                  {actionable ? d.action ?? d.evidence : d.evidence}
                </p>
              )}

              {actionable && (
                <Link
                  href={DOMAIN_ROUTE[d.domain]}
                  className="mt-auto text-xs font-medium text-si-forest hover:underline"
                >
                  {t("fix")}
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
