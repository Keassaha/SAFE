import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { AlertTriangle, AlertCircle, CheckCircle2 } from "lucide-react";
import { routes } from "@/lib/routes";
import type { ReadinessReport, ReadinessDomainId } from "@/lib/admin/readiness";

/**
 * Bande « risques admin prioritaires » (spec §7). Liste les domaines bloquants
 * puis en avertissement, chacun cliquable vers la surface à corriger. Texte
 * visible 100 % i18n ; alimentée par l'Administrative Readiness Engine (P2).
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

export async function AdminReadinessStrip({ report }: { report: ReadinessReport }) {
  const t = await getTranslations("parametres");
  const issues = [...report.blocking, ...report.warnings];

  const scoreColor =
    report.score >= 80 ? "text-emerald-600" : report.score >= 50 ? "text-amber-600" : "text-red-600";

  return (
    <div className="rounded-[var(--safe-radius-lg)] border border-neutral-border bg-neutral-surface/50 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium safe-text-title">{t("readinessTitle")}</span>
          <span className={`text-sm font-semibold tabular-nums ${scoreColor}`}>
            {t("readinessScore", { score: report.score })}
          </span>
        </div>
        <div className="text-xs">
          {report.blocking.length > 0 && (
            <span className="text-red-600 font-medium mr-3">
              {t("readinessBlockingCount", { count: report.blocking.length })}
            </span>
          )}
          {report.warnings.length > 0 && (
            <span className="text-amber-600 font-medium">
              {t("readinessWarningCount", { count: report.warnings.length })}
            </span>
          )}
        </div>
      </div>

      {issues.length === 0 ? (
        <div className="mt-2 flex items-center gap-2 text-sm text-emerald-600">
          <CheckCircle2 className="h-4 w-4" aria-hidden />
          {t("readinessAllClear")}
        </div>
      ) : (
        <ul className="mt-2 space-y-1.5">
          {issues.map((d) => (
            <li key={d.domain} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-2">
                {d.state === "blocking" ? (
                  <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-600" aria-hidden />
                ) : (
                  <AlertTriangle className="h-4 w-4 flex-shrink-0 text-amber-600" aria-hidden />
                )}
                <span className="safe-text-secondary">{t(DOMAIN_TITLE_KEY[d.domain])}</span>
              </span>
              <Link
                href={DOMAIN_ROUTE[d.domain]}
                className="text-primary-700 hover:underline whitespace-nowrap"
              >
                {t("readinessFix")}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
