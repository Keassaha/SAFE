import Link from "next/link";
import type { ReactNode } from "react";
import type { UserRole } from "@prisma/client";
import {
  Building2,
  ChevronRight,
  CircleDollarSign,
  CreditCard,
  FileClock,
  Receipt,
  Send,
  ShieldCheck,
  Users,
} from "lucide-react";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { whereInvoiceOverdue } from "@/lib/billing/invoice-status";
import { routes } from "@/lib/routes";
import { Card, CardContent } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  parseCabinetConfig,
  getEnvoiFactureClientConfig,
} from "@/lib/cabinet-config";
import {
  canManageCabinetSettings,
  canManageInvoices,
  canManageRetentionPolicies,
  canManageUsers,
  canViewAuditLog,
} from "@/lib/auth/permissions";
import { PLANS, canonicalPlanKey } from "@/lib/stripe";
import { getTranslations, getLocale } from "next-intl/server";
import { toIntlLocale } from "@/lib/i18n/locale";

type StatusVariant = "success" | "warning" | "neutral" | "error";

function formatDate(value: Date | null | undefined, fallback: string, locale: string) {
  if (!value) return fallback;
  return new Intl.DateTimeFormat(toIntlLocale(locale), {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(value);
}

function formatPlanPrice(plan: string, locale: string) {
  const key = canonicalPlanKey(plan);
  const planDef = PLANS[key];
  return new Intl.NumberFormat(toIntlLocale(locale), {
    style: "currency",
    currency: planDef.currency.toUpperCase(),
    maximumFractionDigits: 0,
  }).format(planDef.price / 100);
}

function FieldRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5 text-sm">
      <span className="safe-text-secondary text-xs uppercase tracking-wide">{label}</span>
      <span className={`safe-text-title font-medium text-right ${mono ? "tabular-nums" : ""}`}>{value}</span>
    </div>
  );
}

function SectionCard({
  icon,
  title,
  description,
  badge,
  badgeVariant,
  children,
  primaryHref,
  primaryLabel,
  primaryDisabled,
  primaryDisabledHint,
  secondaryHref,
  secondaryLabel,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  badge?: string;
  badgeVariant?: StatusVariant;
  children: ReactNode;
  primaryHref?: string;
  primaryLabel?: string;
  primaryDisabled?: boolean;
  primaryDisabledHint?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <Card className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-[var(--safe-neutral-border)]/60 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-safe-sm bg-[var(--safe-green-100)] text-[var(--safe-icon-default)]">
          {icon}
        </span>
        <h2 className="text-base font-semibold safe-text-title tracking-tight">{title}</h2>
        {badge ? <StatusBadge label={badge} variant={badgeVariant ?? "neutral"} /> : null}
      </div>
      <CardContent className="flex-1 flex flex-col">
        <p className="text-sm safe-text-secondary mb-3">{description}</p>
        <div className="space-y-1 mb-4 flex-1">{children}</div>
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-neutral-border/60">
          {primaryHref && primaryLabel && !primaryDisabled ? (
            <Link
              href={primaryHref}
              className="inline-flex items-center gap-1 text-sm font-semibold text-[#1F3A2E] hover:underline"
            >
              {primaryLabel}
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Link>
          ) : primaryDisabled && primaryDisabledHint ? (
            <span className="text-xs safe-text-secondary">{primaryDisabledHint}</span>
          ) : null}
          {secondaryHref && secondaryLabel ? (
            <Link
              href={secondaryHref}
              className="ml-auto inline-flex items-center gap-1 text-xs safe-text-secondary hover:safe-text-title"
            >
              {secondaryLabel}
              <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

export default async function ParametresPage() {
  const { cabinetId, role } = await requireCabinetAndUser();
  const userRole = role as UserRole;

  const [
    cabinet,
    activeEmployeesCount,
    usersCount,
    overdueInvoicesCount,
    retentionPoliciesCount,
    latestAuditLog,
  ] = await Promise.all([
    prisma.cabinet.findUnique({
      where: { id: cabinetId },
      select: {
        nom: true,
        adresse: true,
        email: true,
        telephone: true,
        barreauNumero: true,
        logoUrl: true,
        config: true,
        plan: true,
        stripeCustomerId: true,
        stripeSubscriptionStatus: true,
        stripeCurrentPeriodEnd: true,
      },
    }),
    prisma.employee.count({ where: { cabinetId, status: "active" } }),
    prisma.user.count({ where: { cabinetId } }),
    // Doctrine : voir docs/accounting/INVOICE_STATUS_NORMALIZATION.md
    prisma.invoice.count({ where: { cabinetId, ...whereInvoiceOverdue() } }),
    prisma.documentRetentionPolicy.count({ where: { cabinetId } }),
    prisma.auditLog.findFirst({
      where: { cabinetId },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
  ]);

  const t = await getTranslations("parametres");
  const tc = await getTranslations("common");
  const locale = await getLocale();

  const config = parseCabinetConfig(cabinet?.config ?? null);
  const envoi = getEnvoiFactureClientConfig(config);
  const isAdmin = canManageCabinetSettings(userRole);
  const canManageTeam = canManageUsers(userRole);
  const canAccessBilling = canManageInvoices(userRole);
  const canAccessAudit = canViewAuditLog(userRole);
  const canAccessRetention = canManageRetentionPolicies(userRole);

  const lastAuditDate = formatDate(latestAuditLog?.createdAt, tc("never"), locale);
  const adminOnly = t("adminOnly");
  const hasCabinetIdentity = Boolean(
    cabinet?.nom && cabinet?.adresse && cabinet?.email && cabinet?.barreauNumero,
  );
  const hasLogo = Boolean(cabinet?.logoUrl);

  const planKey = canonicalPlanKey(cabinet?.plan ?? "essentiel");
  const planPrice = formatPlanPrice(cabinet?.plan ?? "essentiel", locale);
  const renewalDate = formatDate(cabinet?.stripeCurrentPeriodEnd ?? null, t("subscriptionNoRenewal"), locale);
  const subscriptionConfigured = cabinet?.stripeSubscriptionStatus === "active" || cabinet?.stripeSubscriptionStatus === "trialing";

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title={t("title")} description={t("description")} />

      <div className="grid gap-4 lg:grid-cols-2">
        {/* 1. Cabinet — identité publique */}
        <SectionCard
          icon={<Building2 className="h-4 w-4" aria-hidden />}
          title={t("cardCabinetTitle")}
          description={t("cardCabinetDescription")}
          badge={hasCabinetIdentity ? t("statusComplete") : t("statusToComplete")}
          badgeVariant={hasCabinetIdentity ? "success" : "warning"}
          primaryHref={isAdmin ? routes.parametresCabinet : undefined}
          primaryLabel={isAdmin ? t("cardCabinetCta") : undefined}
          primaryDisabled={!isAdmin}
          primaryDisabledHint={adminOnly}
        >
          <FieldRow label={t("cabinetLegalName")} value={cabinet?.nom ?? "—"} />
          <FieldRow label={t("cabinetAddress")} value={cabinet?.adresse ?? t("notConfigured")} />
          <FieldRow label={t("cabinetEmail")} value={cabinet?.email ?? t("notConfigured")} />
          <FieldRow label={t("cabinetPhone")} value={cabinet?.telephone ?? t("notConfigured")} />
          <FieldRow label={t("cabinetBarreauNumber")} value={cabinet?.barreauNumero ?? t("notConfigured")} />
          <FieldRow label={t("cabinetLogo")} value={hasLogo ? t("logoConfigured") : t("notConfigured")} />
        </SectionCard>

        {/* 2. Facturation — lecture seule en V1, lien vers /parametres/envoi-facture */}
        <SectionCard
          icon={<Receipt className="h-4 w-4" aria-hidden />}
          title={t("cardBillingTitle")}
          description={t("cardBillingDescription")}
          badge={envoi.activer ? t("statusEnabled") : t("statusDisabled")}
          badgeVariant={envoi.activer ? "success" : "neutral"}
          primaryHref={isAdmin ? routes.parametresEnvoiFacture : undefined}
          primaryLabel={isAdmin ? t("cardBillingCta") : undefined}
          primaryDisabled={!isAdmin}
          primaryDisabledHint={adminOnly}
          secondaryHref={isAdmin ? routes.parametresFacture : undefined}
          secondaryLabel={isAdmin ? t("cardInvoiceAppearanceCta") : undefined}
        >
          <FieldRow label={t("billingCurrency")} value="CAD" />
          <FieldRow label={t("billingTaxes")} value={t("billingTaxesHST")} />
          <FieldRow label={t("billingPrimaryMode")} value={t("billingForfait")} />
          <FieldRow label={t("billingFormat")} value={config.formatFacture ?? t("notConfigured")} />
          <FieldRow
            label={t("billingSecureLink")}
            value={
              envoi.activer
                ? t("billingSecureLinkActive", { days: envoi.lienExpirationJours ?? 30 })
                : t("billingSecureLinkOff")
            }
          />
          <FieldRow label={t("billingDiscountsNote")} value={t("billingDiscountsExplicit")} />
        </SectionCard>

        {/* 3. Équipe & accès — pointe direct vers /employees */}
        <SectionCard
          icon={<Users className="h-4 w-4" aria-hidden />}
          title={t("cardTeamTitle")}
          description={t("cardTeamDescription")}
          badge={canManageTeam ? t("statusManageable") : t("statusReadOnly")}
          badgeVariant={canManageTeam ? "success" : "neutral"}
          primaryHref={canManageTeam ? routes.employees : undefined}
          primaryLabel={canManageTeam ? t("cardTeamCta") : undefined}
          primaryDisabled={!canManageTeam}
          primaryDisabledHint={adminOnly}
        >
          <FieldRow label={t("teamActiveEmployees")} value={String(activeEmployeesCount)} mono />
          <FieldRow label={t("teamLoginAccounts")} value={String(usersCount)} mono />
          <FieldRow label={t("teamRoles")} value={t("teamRolesValue")} />
        </SectionCard>

        {/* 4. Conformité — liens vers les surfaces existantes */}
        <SectionCard
          icon={<ShieldCheck className="h-4 w-4" aria-hidden />}
          title={t("cardComplianceTitle")}
          description={t("cardComplianceDescription")}
          badge={retentionPoliciesCount > 0 ? t("statusInForce") : t("statusToFrame")}
          badgeVariant={retentionPoliciesCount > 0 ? "success" : "warning"}
          primaryHref={canAccessRetention ? routes.parametresRetention : undefined}
          primaryLabel={canAccessRetention ? t("cardComplianceCta") : undefined}
          primaryDisabled={!canAccessRetention}
          primaryDisabledHint={adminOnly}
          secondaryHref={canAccessAudit ? routes.parametresAudit : undefined}
          secondaryLabel={canAccessAudit ? t("cardComplianceAudit") : undefined}
        >
          <FieldRow
            label={t("complianceRetention")}
            value={
              retentionPoliciesCount > 0
                ? t("complianceRetentionCount", { count: retentionPoliciesCount })
                : t("notConfigured")
            }
          />
          <FieldRow label={t("complianceAuditLog")} value={lastAuditDate} />
          <FieldRow label={t("complianceConsents")} value={t("complianceConsentsValue")} />
          <FieldRow label={t("complianceConflicts")} value={t("complianceConflictsValue")} />
        </SectionCard>

        {/* 5. Abonnement SAFE — état lecture seule, pas de bouton vers les routes 404 */}
        <SectionCard
          icon={<CreditCard className="h-4 w-4" aria-hidden />}
          title={t("cardSubscriptionTitle")}
          description={t("cardSubscriptionDescription")}
          badge={subscriptionConfigured ? t("subscriptionActive") : t("subscriptionNotConfigured")}
          badgeVariant={subscriptionConfigured ? "success" : "warning"}
          primaryHref={isAdmin ? routes.parametresAbonnement : undefined}
          primaryLabel={isAdmin ? t("cardSubscriptionCta") : undefined}
          primaryDisabled={!isAdmin}
          primaryDisabledHint={adminOnly}
        >
          <FieldRow
            label={t("subscriptionPlan")}
            value={PLANS[planKey].name}
          />
          <FieldRow label={t("subscriptionMonthlyPrice")} value={`${planPrice}/${tc("perMonthShort")}`} mono />
          <FieldRow
            label={t("subscriptionStatus")}
            value={cabinet?.stripeSubscriptionStatus ?? t("subscriptionNotConfigured")}
          />
          <FieldRow label={t("subscriptionRenewal")} value={renewalDate} />
        </SectionCard>

        {/* 6. Actions opérationnelles compactes — bas de page */}
        <Card className="lg:col-span-2">
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              href={routes.parametresEnvoiFacture}
              className="flex items-center gap-3 rounded-safe-sm border border-neutral-border/60 px-3 py-2.5 text-sm hover:bg-neutral-50 transition-colors"
            >
              <Send className="h-4 w-4 safe-text-secondary" aria-hidden />
              <span className="safe-text-title font-medium">{t("quickInvoiceSend")}</span>
            </Link>
            {isAdmin && (
              <Link
                href={routes.parametresFacture}
                className="flex items-center gap-3 rounded-safe-sm border border-neutral-border/60 px-3 py-2.5 text-sm hover:bg-neutral-50 transition-colors"
              >
                <Receipt className="h-4 w-4 safe-text-secondary" aria-hidden />
                <span className="safe-text-title font-medium">{t("cardInvoiceAppearanceCta")}</span>
              </Link>
            )}
            {canAccessAudit && (
              <Link
                href={routes.parametresAudit}
                className="flex items-center gap-3 rounded-safe-sm border border-neutral-border/60 px-3 py-2.5 text-sm hover:bg-neutral-50 transition-colors"
              >
                <FileClock className="h-4 w-4 safe-text-secondary" aria-hidden />
                <span className="safe-text-title font-medium">{t("quickAudit")}</span>
              </Link>
            )}
            {canAccessRetention && (
              <Link
                href={routes.parametresRetention}
                className="flex items-center gap-3 rounded-safe-sm border border-neutral-border/60 px-3 py-2.5 text-sm hover:bg-neutral-50 transition-colors"
              >
                <ShieldCheck className="h-4 w-4 safe-text-secondary" aria-hidden />
                <span className="safe-text-title font-medium">{t("quickRetention")}</span>
              </Link>
            )}
            {overdueInvoicesCount > 0 && canAccessBilling && (
              <Link
                href={routes.facturation}
                className="flex items-center gap-3 rounded-safe-sm border border-status-warning/40 bg-status-warning/5 px-3 py-2.5 text-sm hover:bg-status-warning/10 transition-colors"
              >
                <CircleDollarSign className="h-4 w-4 text-status-warning" aria-hidden />
                <span className="safe-text-title font-medium">
                  {t("quickOverdue", { count: overdueInvoicesCount })}
                </span>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
