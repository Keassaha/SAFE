import Link from "next/link";
import type { ReactNode } from "react";
import type { UserRole } from "@prisma/client";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  BellRing,
  Building2,
  FileClock,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { routes } from "@/lib/routes";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  ROLES,
  canManageCabinetSettings,
  canManageInvoices,
  canManageRetentionPolicies,
  canManageUsers,
  canViewAuditLog,
  canViewBillingTrust,
} from "@/lib/auth/permissions";
import { getTranslations, getLocale } from "next-intl/server";

type CabinetConfig = Partial<{
  devise: string;
  tauxInteret: number;
  formatFacture: string;
}>;

function parseCabinetConfig(rawConfig: string | null): CabinetConfig {
  if (!rawConfig) return {};
  try {
    return JSON.parse(rawConfig) as CabinetConfig;
  } catch {
    return {};
  }
}

function formatDate(value: Date | null | undefined, neverLabel: string, locale: string) {
  if (!value) return neverLabel;
  return new Intl.DateTimeFormat(locale === "en" ? "en-CA" : "fr-CA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(value);
}

function SummaryCard({
  title,
  value,
  subtitle,
  badge,
}: {
  title: string;
  value: string;
  subtitle: string;
  badge?: ReactNode;
}) {
  return (
    <Card>
      <CardContent className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-medium safe-text-title">{title}</p>
          {badge}
        </div>
        <div>
          <p className="text-2xl font-semibold safe-text-metric">{value}</p>
          <p className="mt-1 text-sm safe-text-secondary">{subtitle}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function SettingsHubCard({
  icon,
  title,
  description,
  highlights,
  statusLabel,
  statusVariant,
  href,
  cta,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  highlights: string[];
  statusLabel: string;
  statusVariant: "success" | "warning" | "neutral" | "error";
  href?: string;
  cta?: string;
}) {
  return (
    <Card className="h-full">
      <CardContent className="flex h-full flex-col gap-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-safe-md bg-[var(--safe-green-100)] text-[var(--safe-icon-default)]">
              {icon}
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-semibold safe-text-title tracking-tight">{title}</h2>
              <p className="text-sm safe-text-secondary">{description}</p>
            </div>
          </div>
          <StatusBadge label={statusLabel} variant={statusVariant} />
        </div>
        <ul className="space-y-2 text-sm safe-text-secondary">
          {highlights.map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--safe-green-700)]" aria-hidden />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        {href && cta ? (
          <div className="mt-auto">
            <Link href={href}>
              <Button variant="secondary" className="w-full sm:w-auto">
                {cta}
              </Button>
            </Link>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ChecklistItem({
  title,
  description,
  badgeLabel,
  badgeVariant,
}: {
  title: string;
  description: string;
  badgeLabel: string;
  badgeVariant: "success" | "warning" | "neutral" | "error";
}) {
  return (
    <div className="flex flex-col gap-3 rounded-safe-md border border-[var(--safe-neutral-border)]/50 bg-white/5 p-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-1">
        <p className="text-sm font-semibold safe-text-title">{title}</p>
        <p className="text-sm safe-text-secondary">{description}</p>
      </div>
      <StatusBadge label={badgeLabel} variant={badgeVariant} className="self-start" />
    </div>
  );
}

export default async function ParametresPage() {
  const { cabinetId, role } = await requireCabinetAndUser();
  const userRole = role as UserRole;

  const [
    cabinet,
    activeEmployeesCount,
    usersCount,
    trustAccountsCount,
    overdueInvoicesCount,
    retentionPoliciesCount,
    activeCategorizationRulesCount,
    latestAuditLog,
    latestImport,
  ] = await Promise.all([
    prisma.cabinet.findUnique({
      where: { id: cabinetId },
      select: { nom: true, adresse: true, config: true },
    }),
    prisma.employee.count({
      where: { cabinetId, status: "active" },
    }),
    prisma.user.count({
      where: { cabinetId },
    }),
    prisma.trustAccount.count({
      where: { cabinetId },
    }),
    prisma.invoice.count({
      where: { cabinetId, statut: "en_retard" },
    }),
    prisma.documentRetentionPolicy.count({
      where: { cabinetId },
    }),
    prisma.expenseCategorizationRule.count({
      where: { cabinetId, isActive: true },
    }),
    prisma.auditLog.findFirst({
      where: { cabinetId },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
    prisma.importHistory.findFirst({
      where: { cabinetId },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true, status: true, documentType: true },
    }),
  ]);

  const t = await getTranslations("parametres");
  const tc = await getTranslations("common");
  const locale = await getLocale();

  const config = parseCabinetConfig(cabinet?.config ?? null);
  const hasBillingDefaults = Boolean(config.devise && config.formatFacture) || typeof config.tauxInteret === "number";
  const hasCabinetIdentity = Boolean(cabinet?.nom && cabinet?.adresse);
  const roleLabel = ROLES[userRole] ?? t("user");
  const canManageSettings = canManageCabinetSettings(userRole);
  const canManageTeam = canManageUsers(userRole);
  const canAccessBilling = canManageInvoices(userRole);
  const canAccessTrust = canViewBillingTrust(userRole);
  const canAccessAudit = canViewAuditLog(userRole);
  const canAccessRetention = canManageRetentionPolicies(userRole);

  return (
    <div className="max-w-6xl space-y-6 animate-fade-in">
      <PageHeader
        title={t("title")}
        description={t("description")}
        action={
          <div className="flex flex-wrap gap-3">
            {canAccessAudit ? (
              <Link href={routes.parametresAudit}>
                <Button variant="soft">{t("auditTrail")}</Button>
              </Link>
            ) : null}
            {canAccessRetention ? (
              <Link href={routes.parametresRetention}>
                <Button variant="secondary">{t("retention")}</Button>
              </Link>
            ) : null}
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title={t("cabinet")}
          value={cabinet?.nom ?? t("cabinet")}
          subtitle={t("profileRole", { role: roleLabel.toLowerCase() })}
          badge={
            <StatusBadge
              label={hasCabinetIdentity ? t("profileReady") : t("profileIncomplete")}
              variant={hasCabinetIdentity ? "success" : "warning"}
            />
          }
        />
        <SummaryCard
          title={t("team")}
          value={`${activeEmployeesCount}`}
          subtitle={t("activeUsersCount", { count: usersCount })}
          badge={<StatusBadge label={canManageTeam ? t("activeManagement") : t("readOnly")} variant="neutral" />}
        />
        <SummaryCard
          title={t("compliance")}
          value={`${retentionPoliciesCount}`}
          subtitle={t("retentionPoliciesAudit", { date: formatDate(latestAuditLog?.createdAt, tc("never"), locale) })}
          badge={
            <StatusBadge
              label={retentionPoliciesCount > 0 ? t("regulated") : t("toDefine")}
              variant={retentionPoliciesCount > 0 ? "success" : "warning"}
            />
          }
        />
        <SummaryCard
          title={t("finances")}
          value={`${overdueInvoicesCount}`}
          subtitle={t("overdueInvoicesTrust", { count: trustAccountsCount })}
          badge={
            <StatusBadge
              label={overdueInvoicesCount > 0 ? t("followUpRequired") : t("underControl")}
              variant={overdueInvoicesCount > 0 ? "warning" : "success"}
            />
          }
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <SettingsHubCard
          icon={<Building2 className="h-5 w-5" aria-hidden />}
          title={t("governanceTitle")}
          description={t("governanceDesc")}
          highlights={[
            hasCabinetIdentity
              ? t("govIdentityReady", { suffix: cabinet?.adresse ? t("govIdentityReadySuffix") : "" })
              : t("govIdentityMissing"),
            t("govEmployeesCount", { employees: activeEmployeesCount, users: usersCount }),
            canManageSettings
              ? t("govCanManage")
              : t("govRestricted"),
          ]}
          statusLabel={hasCabinetIdentity ? t("structured") : t("toComplete")}
          statusVariant={hasCabinetIdentity ? "success" : "warning"}
          href={canManageTeam ? routes.employees : undefined}
          cta={canManageTeam ? t("manageTeam") : undefined}
        />

        <SettingsHubCard
          icon={<ReceiptText className="h-5 w-5" aria-hidden />}
          title={t("billingTaxesTitle")}
          description={t("billingTaxesDesc")}
          highlights={[
            hasBillingDefaults
              ? t("billingConfigDetected", { details: `${config.devise ? `: ${config.devise}` : ""}${typeof config.tauxInteret === "number" ? `, ${config.tauxInteret}%` : ""}` })
              : t("billingConfigMissing"),
            overdueInvoicesCount > 0
              ? t("billingOverdueCount", { count: overdueInvoicesCount })
              : t("billingNoOverdue"),
            t("billingKeepVisible"),
          ]}
          statusLabel={hasBillingDefaults ? t("frameworkEstablished") : t("toConfigure")}
          statusVariant={hasBillingDefaults ? "success" : "warning"}
          href={canAccessBilling ? routes.facturation : undefined}
          cta={canAccessBilling ? t("openBilling") : undefined}
        />
        {canManageSettings && (
          <Card className="h-full">
            <CardContent className="flex flex-col gap-3 pt-6">
              <p className="text-sm font-semibold safe-text-title">
                {t("envoiFactureClientTitle")}
              </p>
              <p className="text-sm safe-text-secondary flex-1">
                {t("envoiFactureClientDesc")}
              </p>
              <Link href={routes.parametresEnvoiFacture}>
                <Button variant="secondary" className="w-full sm:w-auto">
                  {t("envoiFactureClientCta")}
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        <SettingsHubCard
          icon={<ShieldCheck className="h-5 w-5" aria-hidden />}
          title={t("complianceAuditTitle")}
          description={t("complianceAuditDesc")}
          highlights={[
            retentionPoliciesCount > 0
              ? t("complianceRetentionConfigured", { count: retentionPoliciesCount })
              : t("complianceRetentionNone"),
            canAccessAudit
              ? t("complianceAuditAccess", { date: formatDate(latestAuditLog?.createdAt, tc("never"), locale) })
              : t("complianceAuditRestricted"),
            t("complianceEssentials"),
          ]}
          statusLabel={retentionPoliciesCount > 0 ? t("complianceInProgress") : t("vigilance")}
          statusVariant={retentionPoliciesCount > 0 ? "success" : "warning"}
          href={canAccessRetention ? routes.parametresRetention : canAccessAudit ? routes.parametresAudit : undefined}
          cta={
            canAccessRetention
              ? t("manageCompliance")
              : canAccessAudit
                ? t("consultAudit")
                : undefined
          }
        />

        <SettingsHubCard
          icon={<Sparkles className="h-5 w-5" aria-hidden />}
          title={t("automationTitle")}
          description={t("automationDesc")}
          highlights={[
            latestImport
              ? t("automationLastImport", { type: latestImport.documentType, date: formatDate(latestImport.createdAt, tc("never"), locale), status: latestImport.status })
              : t("automationNoImport"),
            t("automationRulesCount", { count: activeCategorizationRulesCount }),
            canAccessTrust
              ? t("automationTrustCount", { count: trustAccountsCount })
              : t("automationNotifications"),
          ]}
          statusLabel={activeCategorizationRulesCount > 0 || latestImport ? t("operational") : t("toEnrich")}
          statusVariant={activeCategorizationRulesCount > 0 || latestImport ? "neutral" : "warning"}
          href={latestImport ? routes.safeImport : routes.outilsGenerateurDocuments}
          cta={latestImport ? t("viewImports") : t("openTools")}
        />
      </div>

      <Card>
        <CardHeader
          title={t("checklistTitle")}
          action={
            <Link href={routes.rapports} className="inline-flex items-center gap-2 text-sm font-medium safe-text-secondary hover:safe-text-title transition-colors">
              {t("viewOperationalImpact")}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          }
        />
        <CardContent className="space-y-4">
          <ChecklistItem
            title={t("checkIdentityTitle")}
            description={t("checkIdentityDesc")}
            badgeLabel={hasCabinetIdentity ? t("completed") : t("toComplete")}
            badgeVariant={hasCabinetIdentity ? "success" : "warning"}
          />
          <ChecklistItem
            title={t("checkSecurityTitle")}
            description={t("checkSecurityDesc")}
            badgeLabel={canManageTeam ? t("manageable") : t("restricted")}
            badgeVariant={canManageTeam ? "success" : "neutral"}
          />
          <ChecklistItem
            title={t("checkBillingTitle")}
            description={t("checkBillingDesc")}
            badgeLabel={hasBillingDefaults ? t("partiallyConfigured") : t("priority")}
            badgeVariant={hasBillingDefaults ? "neutral" : "warning"}
          />
          <ChecklistItem
            title={t("checkRetentionTitle")}
            description={t("checkRetentionDesc")}
            badgeLabel={retentionPoliciesCount > 0 ? t("inPlace") : t("toFrame")}
            badgeVariant={retentionPoliciesCount > 0 ? "success" : "warning"}
          />
          <ChecklistItem
            title={t("checkNotificationsTitle")}
            description={t("checkNotificationsDesc")}
            badgeLabel={activeCategorizationRulesCount > 0 || latestImport ? t("activeLabel") : t("toConfigure")}
            badgeVariant={activeCategorizationRulesCount > 0 || latestImport ? "success" : "warning"}
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-safe-md bg-status-success-bg text-status-success">
                <BadgeCheck className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <p className="text-sm font-semibold safe-text-title">{t("whatIAdded")}</p>
                <p className="text-sm safe-text-secondary">{t("whatIAddedSub")}</p>
              </div>
            </div>
            <p className="text-sm safe-text-secondary">
              {t("whatIAddedDesc")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-safe-md bg-status-warning-bg text-status-warning">
                <FileClock className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <p className="text-sm font-semibold safe-text-title">{t("nextSteps")}</p>
                <p className="text-sm safe-text-secondary">{t("nextStepsSub")}</p>
              </div>
            </div>
            <p className="text-sm safe-text-secondary">
              {t("nextStepsDesc")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-safe-md bg-[var(--safe-green-100)] text-[var(--safe-icon-default)]">
                <BellRing className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <p className="text-sm font-semibold safe-text-title">{t("nextImprovement")}</p>
                <p className="text-sm safe-text-secondary">{t("nextImprovementSub")}</p>
              </div>
            </div>
            <p className="text-sm safe-text-secondary">
              {t("nextImprovementDesc")}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-start gap-3">
            <Users className="mt-1 h-5 w-5 text-[var(--safe-icon-default)]" aria-hidden />
            <div>
              <p className="text-sm font-semibold safe-text-title">{t("teamAndRoles")}</p>
              <p className="mt-1 text-sm safe-text-secondary">
                {t("teamAndRolesDesc")}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-start gap-3">
            <Wallet className="mt-1 h-5 w-5 text-[var(--safe-icon-default)]" aria-hidden />
            <div>
              <p className="text-sm font-semibold safe-text-title">{t("financesAndTrust")}</p>
              <p className="mt-1 text-sm safe-text-secondary">
                {t("financesAndTrustDesc")}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-start gap-3">
            <AlertTriangle className="mt-1 h-5 w-5 text-status-warning" aria-hidden />
            <div>
              <p className="text-sm font-semibold safe-text-title">{t("complianceAndRisks")}</p>
              <p className="mt-1 text-sm safe-text-secondary">
                {t("complianceAndRisksDesc")}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
