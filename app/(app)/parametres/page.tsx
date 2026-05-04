import Link from "next/link";
import type { ReactNode } from "react";
import type { UserRole } from "@prisma/client";
import {
  BellRing,
  Building2,
  FileClock,
  FileSignature,
  Receipt,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { whereInvoiceOverdue } from "@/lib/billing/invoice-status";
import { routes } from "@/lib/routes";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  parseCabinetConfig,
  getEnvoiFactureClientConfig,
} from "@/lib/cabinet-config";
import {
  ROLES,
  canManageCabinetSettings,
  canManageInvoices,
  canManageRetentionPolicies,
  canManageUsers,
  canViewAuditLog,
} from "@/lib/auth/permissions";
import { getTranslations, getLocale } from "next-intl/server";
import { toIntlLocale } from "@/lib/i18n/locale";

type StatusVariant = "success" | "warning" | "neutral" | "error";

function formatDate(value: Date | null | undefined, neverLabel: string, locale: string) {
  if (!value) return neverLabel;
  return new Intl.DateTimeFormat(toIntlLocale(locale), {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(value);
}

function StatItem({
  label,
  value,
  hint,
  status,
  statusVariant,
}: {
  label: string;
  value: string;
  hint: string;
  status?: string;
  statusVariant?: StatusVariant;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-medium uppercase tracking-wide safe-text-secondary">{label}</p>
      <p className="text-xl font-semibold safe-text-metric leading-tight">{value}</p>
      <div className="flex items-center gap-2 text-xs safe-text-secondary">
        <span>{hint}</span>
        {status ? <StatusBadge label={status} variant={statusVariant ?? "neutral"} /> : null}
      </div>
    </div>
  );
}

function SettingRow({
  icon,
  title,
  description,
  meta,
  statusLabel,
  statusVariant,
  href,
  cta,
  restrictedNote,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  meta?: string;
  statusLabel?: string;
  statusVariant?: StatusVariant;
  href?: string;
  cta?: string;
  restrictedNote?: string;
}) {
  return (
    <div className="flex flex-col gap-3 py-5 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <div className="flex items-start gap-3 sm:max-w-xl">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-safe-md bg-[var(--safe-green-100)] text-[var(--safe-icon-default)]">
          {icon}
        </div>
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold safe-text-title">{title}</h3>
            {statusLabel ? <StatusBadge label={statusLabel} variant={statusVariant ?? "neutral"} /> : null}
          </div>
          <p className="text-sm safe-text-secondary">{description}</p>
          {meta ? <p className="text-xs safe-text-secondary">{meta}</p> : null}
        </div>
      </div>
      <div className="sm:shrink-0 sm:self-center">
        {href && cta ? (
          <Link href={href}>
            <Button variant="secondary" className="w-full sm:w-auto">
              {cta}
            </Button>
          </Link>
        ) : restrictedNote ? (
          <p className="text-xs safe-text-secondary sm:max-w-[12rem] sm:text-right">{restrictedNote}</p>
        ) : null}
      </div>
    </div>
  );
}

function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="space-y-1 px-1">
        <h2 className="text-base font-semibold safe-text-title tracking-tight">{title}</h2>
        <p className="text-sm safe-text-secondary">{description}</p>
      </div>
      <Card>
        <CardContent className="divide-y divide-[var(--safe-neutral-border)]/40 py-2">
          {children}
        </CardContent>
      </Card>
    </section>
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
    prisma.employee.count({ where: { cabinetId, status: "active" } }),
    prisma.user.count({ where: { cabinetId } }),
    prisma.trustAccount.count({ where: { cabinetId } }),
    // Doctrine: voir docs/accounting/INVOICE_STATUS_NORMALIZATION.md
    prisma.invoice.count({ where: { cabinetId, ...whereInvoiceOverdue() } }),
    prisma.documentRetentionPolicy.count({ where: { cabinetId } }),
    prisma.expenseCategorizationRule.count({ where: { cabinetId, isActive: true } }),
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
  const envoi = getEnvoiFactureClientConfig(config);
  const hasBillingDefaults =
    Boolean(config.devise || config.formatFacture) || typeof config.tauxInteret === "number";
  const hasCabinetIdentity = Boolean(cabinet?.nom && cabinet?.adresse);
  const roleLabel = ROLES[userRole] ?? t("user");

  const isAdmin = canManageCabinetSettings(userRole);
  const canManageTeam = canManageUsers(userRole);
  const canAccessBilling = canManageInvoices(userRole);
  const canAccessAudit = canViewAuditLog(userRole);
  const canAccessRetention = canManageRetentionPolicies(userRole);

  const lastAuditDate = formatDate(latestAuditLog?.createdAt, tc("never"), locale);
  const adminOnly = t("adminOnly");
  const comingSoon = t("comingSoon");

  return (
    <div className="max-w-5xl space-y-8 animate-fade-in">
      <PageHeader title={t("title")} description={t("description")} />

      {/* Bandeau état du cabinet */}
      <Card>
        <CardContent className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatItem
            label={t("stateCabinetLabel")}
            value={cabinet?.nom ?? t("cabinet")}
            hint={t("stateCabinetHint", { role: roleLabel })}
            status={hasCabinetIdentity ? t("stateProfileReady") : t("stateProfileIncomplete")}
            statusVariant={hasCabinetIdentity ? "success" : "warning"}
          />
          <StatItem
            label={t("stateTeamLabel")}
            value={`${activeEmployeesCount}`}
            hint={t("stateTeamHint", { count: usersCount })}
          />
          <StatItem
            label={t("stateRetentionLabel")}
            value={`${retentionPoliciesCount}`}
            hint={t("stateRetentionHint", { date: lastAuditDate })}
            status={retentionPoliciesCount > 0 ? t("stateRetentionActive") : t("stateRetentionTodo")}
            statusVariant={retentionPoliciesCount > 0 ? "success" : "warning"}
          />
          <StatItem
            label={t("stateOverdueLabel")}
            value={`${overdueInvoicesCount}`}
            hint={t("stateOverdueHint", { count: trustAccountsCount })}
            status={overdueInvoicesCount > 0 ? t("stateOverdueWarning") : t("stateOverdueOk")}
            statusVariant={overdueInvoicesCount > 0 ? "warning" : "success"}
          />
        </CardContent>
      </Card>

      {/* Section: Cabinet */}
      <SettingsSection title={t("sectionCabinetTitle")} description={t("sectionCabinetDesc")}>
        <SettingRow
          icon={<Building2 className="h-5 w-5" aria-hidden />}
          title={t("rowIdentityTitle")}
          description={t("rowIdentityDesc")}
          meta={
            cabinet?.adresse
              ? t("rowIdentityMetaWithAddress", { address: cabinet.adresse })
              : t("rowIdentityMetaNoAddress")
          }
          statusLabel={hasCabinetIdentity ? t("statusComplete") : t("statusToComplete")}
          statusVariant={hasCabinetIdentity ? "success" : "warning"}
          restrictedNote={isAdmin ? comingSoon : adminOnly}
        />
        <SettingRow
          icon={<Wallet className="h-5 w-5" aria-hidden />}
          title={t("rowBillingDefaultsTitle")}
          description={t("rowBillingDefaultsDesc")}
          meta={t("rowBillingDefaultsMeta", {
            currency: config.devise ?? "CAD",
            interest: typeof config.tauxInteret === "number" ? `${config.tauxInteret}%` : "—",
            format: config.formatFacture ?? "—",
          })}
          statusLabel={hasBillingDefaults ? t("statusConfigured") : t("statusDefault")}
          statusVariant={hasBillingDefaults ? "success" : "neutral"}
          restrictedNote={isAdmin ? comingSoon : adminOnly}
        />
        <SettingRow
          icon={<Users className="h-5 w-5" aria-hidden />}
          title={t("rowTeamTitle")}
          description={t("rowTeamDesc")}
          meta={t("rowTeamMeta", { active: activeEmployeesCount, accounts: usersCount })}
          statusLabel={canManageTeam ? t("statusManageable") : t("statusReadOnly")}
          statusVariant={canManageTeam ? "success" : "neutral"}
          href={canManageTeam ? routes.employees : undefined}
          cta={canManageTeam ? t("ctaManageTeam") : undefined}
          restrictedNote={canManageTeam ? undefined : adminOnly}
        />
      </SettingsSection>

      {/* Section: Conformité & confidentialité */}
      <SettingsSection
        title={t("sectionComplianceTitle")}
        description={t("sectionComplianceDesc")}
      >
        <SettingRow
          icon={<ShieldCheck className="h-5 w-5" aria-hidden />}
          title={t("rowRetentionTitle")}
          description={t("rowRetentionDesc")}
          meta={t("rowRetentionMeta", { count: retentionPoliciesCount })}
          statusLabel={retentionPoliciesCount > 0 ? t("statusInForce") : t("statusToFrame")}
          statusVariant={retentionPoliciesCount > 0 ? "success" : "warning"}
          href={canAccessRetention ? routes.parametresRetention : undefined}
          cta={canAccessRetention ? t("ctaManageRetention") : undefined}
          restrictedNote={canAccessRetention ? undefined : adminOnly}
        />
        <SettingRow
          icon={<FileClock className="h-5 w-5" aria-hidden />}
          title={t("rowAuditTitle")}
          description={t("rowAuditDesc")}
          meta={t("rowAuditMeta", { date: lastAuditDate })}
          statusLabel={t("statusActive")}
          statusVariant="neutral"
          href={canAccessAudit ? routes.parametresAudit : undefined}
          cta={canAccessAudit ? t("ctaViewAudit") : undefined}
        />
        <SettingRow
          icon={<FileSignature className="h-5 w-5" aria-hidden />}
          title={t("rowConsentTitle")}
          description={t("rowConsentDesc")}
          meta={t("rowConsentMeta")}
          statusLabel={t("statusActive")}
          statusVariant="neutral"
        />
      </SettingsSection>

      {/* Section: Opérations */}
      <SettingsSection
        title={t("sectionOperationsTitle")}
        description={t("sectionOperationsDesc")}
      >
        <SettingRow
          icon={<Send className="h-5 w-5" aria-hidden />}
          title={t("rowInvoiceSendTitle")}
          description={t("rowInvoiceSendDesc")}
          meta={
            envoi.activer
              ? t("rowInvoiceSendMetaActive", { days: envoi.lienExpirationJours ?? 30 })
              : t("rowInvoiceSendMetaDisabled")
          }
          statusLabel={envoi.activer ? t("statusEnabled") : t("statusDisabled")}
          statusVariant={envoi.activer ? "success" : "neutral"}
          href={isAdmin ? routes.parametresEnvoiFacture : undefined}
          cta={isAdmin ? t("ctaConfigure") : undefined}
          restrictedNote={isAdmin ? undefined : adminOnly}
        />
        <SettingRow
          icon={<Sparkles className="h-5 w-5" aria-hidden />}
          title={t("rowImportsTitle")}
          description={t("rowImportsDesc")}
          meta={
            latestImport
              ? t("rowImportsMetaWithLast", {
                  count: activeCategorizationRulesCount,
                  type: latestImport.documentType,
                  date: formatDate(latestImport.createdAt, tc("never"), locale),
                })
              : t("rowImportsMetaNoImport", { count: activeCategorizationRulesCount })
          }
          statusLabel={
            activeCategorizationRulesCount > 0 || latestImport
              ? t("statusOperational")
              : t("statusToEnrich")
          }
          statusVariant={
            activeCategorizationRulesCount > 0 || latestImport ? "success" : "neutral"
          }
          href={routes.safeImport}
          cta={t("ctaViewImports")}
        />
        <SettingRow
          icon={<Receipt className="h-5 w-5" aria-hidden />}
          title={t("rowBillingShortcutTitle")}
          description={t("rowBillingShortcutDesc")}
          meta={t("rowBillingShortcutMeta", { count: overdueInvoicesCount })}
          href={canAccessBilling ? routes.facturation : undefined}
          cta={canAccessBilling ? t("ctaOpenBilling") : undefined}
          restrictedNote={canAccessBilling ? undefined : adminOnly}
        />
        <SettingRow
          icon={<BellRing className="h-5 w-5" aria-hidden />}
          title={t("rowNotificationsTitle")}
          description={t("rowNotificationsDesc")}
          statusLabel={comingSoon}
          statusVariant="neutral"
          restrictedNote={comingSoon}
        />
      </SettingsSection>

      <p className="px-1 text-xs safe-text-secondary">{t("v1Note")}</p>
    </div>
  );
}
