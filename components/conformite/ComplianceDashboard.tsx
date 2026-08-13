"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import Link from "next/link";
import {
  Shield,
  CheckCircle,
  AlertTriangle,
  Scale,
  FileText,
  Users,
  Clock,
  ExternalLink,
} from "lucide-react";
import { useCabinetProvince } from "@/components/providers/CabinetProvinceProvider";
import { getTrustRegulatorCopy } from "@/lib/trust/regulator";

interface ComplianceStatus {
  score: number;
  scoreVariant: "success" | "warning" | "error";
  issues: {
    id: string;
    label: string;
    severity: "error" | "warning";
    count: number;
    href: string;
  }[];
  obligations?: {
    id: string;
    domain: string;
    statement: string;
    source: string;
    confidence: "CONFIRME" | "PARTIEL" | "INCERTAIN";
    deadline: string | null;
  }[];
  reconciliation: {
    status: string;
    lastCertified: string | null;
    expectedPeriode: string;
    daysSinceMonthEnd: number;
  };
  counts: {
    totalActiveDossiers: number;
    dossiersWithoutFintrac: number;
    dossiersWithoutMandate: number;
    unresolvedConflicts: number;
    expiredDocuments: number;
    expiringSoonDocuments: number;
  };
}

const OBLIGATION_DOMAIN_LABELS: Record<string, { fr: string; en: string }> = {
  fideicommis: { fr: "Fidéicommis", en: "Trust accounting" },
  cash: { fr: "Espèces", en: "Cash" },
  retention: { fr: "Conservation", en: "Retention" },
  conflicts: { fr: "Conflits d'intérêts", en: "Conflicts of interest" },
  fintrac: { fr: "FINTRAC", en: "FINTRAC" },
  privacy: { fr: "Vie privée", en: "Privacy" },
  billing: { fr: "Facturation et taxes", en: "Billing and taxes" },
  federal: { fr: "Fédéral", en: "Federal" },
};

const OBLIGATION_COPY = {
  fr: { heading: "Vos obligations de conformité", toConfirm: "à confirmer", due: "échéance" },
  en: { heading: "Your compliance obligations", toConfirm: "to confirm", due: "due" },
};

/** Traduit un incident opérationnel par son id (le label serveur reste un repli). */
function issueLabel(t: ReturnType<typeof useTranslations>, issue: ComplianceStatus["issues"][number]): string {
  switch (issue.id) {
    case "reconciliation":
      return issue.severity === "error" ? t("issueReconOverdue") : t("issueReconDueSoon");
    case "fintrac":
      return t("issueFintrac");
    case "conflicts":
      return t("issueConflicts");
    case "mandates":
      return t("issueMandates");
    case "expired_docs":
      return t("issueExpiredDocs");
    case "expiring_docs":
      return t("issueExpiringDocs");
    default:
      return issue.label;
  }
}

export function ComplianceDashboard() {
  const t = useTranslations("conformite");
  const copy = getTrustRegulatorCopy(useCabinetProvince());
  const { data, isLoading } = useQuery({
    queryKey: ["compliance-status"],
    queryFn: async () => {
      const res = await fetch("/api/conformite");
      if (!res.ok) throw new Error("Error loading compliance data");
      return res.json() as Promise<ComplianceStatus>;
    },
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="h-20 bg-si-canvas animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const scoreColor =
    data.scoreVariant === "success" ? "text-si-verified" :
    data.scoreVariant === "warning" ? "text-si-amber-ink" : "text-si-danger-ink";

  const scoreBg =
    data.scoreVariant === "success" ? "bg-si-verified/10 border-si-verified/30" :
    data.scoreVariant === "warning" ? "bg-si-amber/[0.13] border-si-amber/30" : "bg-si-danger/10 border-si-danger/30";

  const scoreLabel = data.score >= 80 ? t("opCompliant") : data.score >= 60 ? t("opAtRisk") : t("opNonCompliant");

  return (
    <div className="space-y-6">
      {/* Score card */}
      <Card className={`border-2 ${scoreBg}`}>
        <CardContent className="p-6 flex items-center gap-6">
          <div className={`text-5xl font-medium tabular-nums ${scoreColor}`}>
            {data.score}%
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Shield className={`w-5 h-5 ${scoreColor}`} />
              <h2 className="text-lg font-medium">
                {t("opScoreTitle")}
              </h2>
              <StatusBadge label={scoreLabel} variant={data.scoreVariant} />
            </div>
            <p className="text-sm text-si-muted">
              {t("opActiveFiles", { count: data.counts.totalActiveDossiers })} |{" "}
              {data.issues.length === 0
                ? t("opAllPassed")
                : t("opCriticalWarnings", {
                    critical: data.issues.filter((i) => i.severity === "error").length,
                    warnings: data.issues.filter((i) => i.severity === "warning").length,
                  })
              }
            </p>
          </div>
          {/* Progress ring visual */}
          <div className="relative w-16 h-16 shrink-0">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="4" className="text-si-muted/25" />
              <circle
                cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="4"
                strokeDasharray={`${(data.score / 100) * 176} 176`}
                strokeLinecap="round"
                className={scoreColor}
              />
            </svg>
          </div>
        </CardContent>
      </Card>

      {/* Issue list */}
      {data.issues.length > 0 && (
        <div className="space-y-2">
          {data.issues.map((issue) => (
            <Link key={issue.id} href={issue.href}>
              <Card className={`cursor-pointer hover:shadow-md transition-shadow border ${
                issue.severity === "error" ? "border-si-danger/30 bg-si-danger/10" : "border-si-amber/30 bg-si-amber/[0.13]"
              }`}>
                <CardContent className="p-3 flex items-center gap-3">
                  <AlertTriangle className={`w-4 h-4 shrink-0 ${
                    issue.severity === "error" ? "text-si-danger-ink" : "text-si-amber-ink"
                  }`} />
                  <span className={`text-sm font-medium flex-1 ${
                    issue.severity === "error" ? "text-si-danger-ink" : "text-si-amber-ink"
                  }`}>
                    {issueLabel(t, issue)}
                  </span>
                  <span className={`text-sm font-medium tabular-nums ${
                    issue.severity === "error" ? "text-si-danger-ink" : "text-si-amber-ink"
                  }`}>
                    {issue.count}
                  </span>
                  <ExternalLink className="w-3 h-3 text-si-muted/50" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Detail widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Trust Reconciliation */}
        <Link href="/comptes/rapprochement">
          <Card className="cursor-pointer hover:shadow-md transition-shadow h-full">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-si-ink" />
                <h4 className="text-sm font-medium">{copy.trustReconciliationTitle}</h4>
              </div>
              <StatusBadge
                label={
                  data.reconciliation.status === "critical" ? t("stReconOverdue") :
                  data.reconciliation.status === "overdue" ? t("stReconDueSoon") : t("stReconUpToDate")
                }
                variant={
                  data.reconciliation.status === "critical" ? "error" :
                  data.reconciliation.status === "overdue" ? "warning" : "success"
                }
              />
              <p className="text-xs text-si-muted">
                {t("lblExpected")}: {data.reconciliation.expectedPeriode}
                {data.reconciliation.lastCertified && ` | ${t("lblLast")}: ${data.reconciliation.lastCertified}`}
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* FINTRAC */}
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-si-ink" />
              <h4 className="text-sm font-medium">{t("wFintracTitle")}</h4>
            </div>
            {data.counts.dossiersWithoutFintrac === 0 ? (
              <div className="flex items-center gap-1 text-si-verified text-sm">
                <CheckCircle className="w-4 h-4" /> {t("stAllVerified")}
              </div>
            ) : (
              <StatusBadge
                label={t("stUnverified", { count: data.counts.dossiersWithoutFintrac })}
                variant="error"
              />
            )}
          </CardContent>
        </Card>

        {/* Conflicts */}
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-si-ink" />
              <h4 className="text-sm font-medium">{t("wConflictsTitle")}</h4>
            </div>
            {data.counts.unresolvedConflicts === 0 ? (
              <div className="flex items-center gap-1 text-si-verified text-sm">
                <CheckCircle className="w-4 h-4" /> {t("stNoConflicts")}
              </div>
            ) : (
              <StatusBadge
                label={t("stUnresolved", { count: data.counts.unresolvedConflicts })}
                variant="error"
              />
            )}
          </CardContent>
        </Card>

        {/* Mandates */}
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-si-ink" />
              <h4 className="text-sm font-medium">{t("wMandatesTitle")}</h4>
            </div>
            {data.counts.dossiersWithoutMandate === 0 ? (
              <div className="flex items-center gap-1 text-si-verified text-sm">
                <CheckCircle className="w-4 h-4" /> {t("stAllMandates")}
              </div>
            ) : (
              <StatusBadge
                label={t("stMissing", { count: data.counts.dossiersWithoutMandate })}
                variant="warning"
              />
            )}
          </CardContent>
        </Card>

        {/* Document Expiry */}
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-si-ink" />
              <h4 className="text-sm font-medium">{t("wDocsTitle")}</h4>
            </div>
            {data.counts.expiredDocuments === 0 && data.counts.expiringSoonDocuments === 0 ? (
              <div className="flex items-center gap-1 text-si-verified text-sm">
                <CheckCircle className="w-4 h-4" /> {t("stAllDocsValid")}
              </div>
            ) : (
              <div className="space-y-1">
                {data.counts.expiredDocuments > 0 && (
                  <StatusBadge label={t("stExpired", { count: data.counts.expiredDocuments })} variant="error" />
                )}
                {data.counts.expiringSoonDocuments > 0 && (
                  <StatusBadge label={t("stExpiringSoon", { count: data.counts.expiringSoonDocuments })} variant="warning" />
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* LSO Reports */}
        <Link href="/comptes/rapports">
          <Card className="cursor-pointer hover:shadow-md transition-shadow h-full">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-si-ink" />
                <h4 className="text-sm font-medium">{copy.complianceReportsButton}</h4>
              </div>
              <p className="text-sm text-si-muted">
                {copy.reportGeneratorDesc}
              </p>
              <span className="text-xs text-si-forest flex items-center gap-1">
                {t("viewReports")} <ExternalLink className="w-3 h-3" />
              </span>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Vos obligations de conformité (sourcées, province-aware) — ADR-011.
          Rendu seulement si l'API renvoie des obligations (flag COMPLIANCE_RULES_ENABLED). */}
      {data.obligations && data.obligations.length > 0 && (() => {
        const oc = copy.isQuebec ? OBLIGATION_COPY.fr : OBLIGATION_COPY.en;
        const lang: "fr" | "en" = copy.isQuebec ? "fr" : "en";
        return (
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-si-ink" />
              <h3 className="text-sm font-medium">{oc.heading}</h3>
              <span className="text-xs text-si-muted">
                {copy.isQuebec ? "Barreau du Québec" : "Law Society of Ontario"}
              </span>
            </div>
            {Object.entries(
              data.obligations.reduce<Record<string, typeof data.obligations>>((acc, o) => {
                (acc[o.domain] ??= []).push(o);
                return acc;
              }, {}),
            ).map(([domain, rules]) => (
              <div key={domain} className="space-y-2">
                <h4 className="text-xs font-medium uppercase tracking-wide text-si-muted">
                  {OBLIGATION_DOMAIN_LABELS[domain]?.[lang] ?? domain}
                </h4>
                <ul className="space-y-2">
                  {rules.map((o) => (
                    <li key={o.id} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-si-verified" />
                      <div className="min-w-0">
                        <p className="text-sm text-si-ink">{o.statement}</p>
                        <p className="text-xs text-si-muted">
                          {o.source}
                          {o.deadline && ` · ${oc.due} ${o.deadline}`}
                          {o.confidence === "PARTIEL" && ` · ${oc.toConfirm}`}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </CardContent>
        </Card>
        );
      })()}
    </div>
  );
}
