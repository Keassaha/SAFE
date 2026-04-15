"use client";

import { useQuery } from "@tanstack/react-query";
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

export function ComplianceDashboard() {
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
              <div className="h-20 bg-neutral-100 animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const scoreColor =
    data.scoreVariant === "success" ? "text-green-700" :
    data.scoreVariant === "warning" ? "text-amber-700" : "text-red-700";

  const scoreBg =
    data.scoreVariant === "success" ? "bg-green-50 border-green-200" :
    data.scoreVariant === "warning" ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200";

  return (
    <div className="space-y-6">
      {/* Score card */}
      <Card className={`border-2 ${scoreBg}`}>
        <CardContent className="p-6 flex items-center gap-6">
          <div className={`text-5xl font-bold tabular-nums ${scoreColor}`}>
            {data.score}%
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Shield className={`w-5 h-5 ${scoreColor}`} />
              <h2 className="text-lg font-semibold">
                Compliance Score
              </h2>
              <StatusBadge
                label={data.score >= 80 ? "Compliant" : data.score >= 60 ? "At Risk" : "Non-Compliant"}
                variant={data.scoreVariant}
              />
            </div>
            <p className="text-sm text-neutral-500">
              {data.counts.totalActiveDossiers} active files |{" "}
              {data.issues.length === 0
                ? "All checks passed"
                : `${data.issues.filter((i) => i.severity === "error").length} critical, ${data.issues.filter((i) => i.severity === "warning").length} warnings`
              }
            </p>
          </div>
          {/* Progress ring visual */}
          <div className="relative w-16 h-16 shrink-0">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="4" className="text-neutral-200" />
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
                issue.severity === "error" ? "border-red-200 bg-red-50/30" : "border-amber-200 bg-amber-50/30"
              }`}>
                <CardContent className="p-3 flex items-center gap-3">
                  <AlertTriangle className={`w-4 h-4 shrink-0 ${
                    issue.severity === "error" ? "text-red-600" : "text-amber-600"
                  }`} />
                  <span className={`text-sm font-medium flex-1 ${
                    issue.severity === "error" ? "text-red-800" : "text-amber-800"
                  }`}>
                    {issue.label}
                  </span>
                  <span className={`text-sm font-bold tabular-nums ${
                    issue.severity === "error" ? "text-red-700" : "text-amber-700"
                  }`}>
                    {issue.count}
                  </span>
                  <ExternalLink className="w-3 h-3 text-neutral-400" />
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
                <Scale className="w-4 h-4 text-blue-600" />
                <h4 className="text-sm font-semibold">Trust Reconciliation</h4>
              </div>
              <StatusBadge
                label={
                  data.reconciliation.status === "critical" ? "Overdue" :
                  data.reconciliation.status === "overdue" ? "Due Soon" : "Up to Date"
                }
                variant={
                  data.reconciliation.status === "critical" ? "error" :
                  data.reconciliation.status === "overdue" ? "warning" : "success"
                }
              />
              <p className="text-xs text-neutral-500">
                Expected: {data.reconciliation.expectedPeriode}
                {data.reconciliation.lastCertified && ` | Last: ${data.reconciliation.lastCertified}`}
              </p>
            </CardContent>
          </Card>
        </Link>

        {/* FINTRAC */}
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <h4 className="text-sm font-semibold">FINTRAC ID Verification</h4>
            </div>
            {data.counts.dossiersWithoutFintrac === 0 ? (
              <div className="flex items-center gap-1 text-green-600 text-sm">
                <CheckCircle className="w-4 h-4" /> All verified
              </div>
            ) : (
              <StatusBadge
                label={`${data.counts.dossiersWithoutFintrac} unverified`}
                variant="error"
              />
            )}
          </CardContent>
        </Card>

        {/* Conflicts */}
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <h4 className="text-sm font-semibold">Conflict of Interest</h4>
            </div>
            {data.counts.unresolvedConflicts === 0 ? (
              <div className="flex items-center gap-1 text-green-600 text-sm">
                <CheckCircle className="w-4 h-4" /> No unresolved conflicts
              </div>
            ) : (
              <StatusBadge
                label={`${data.counts.unresolvedConflicts} unresolved`}
                variant="error"
              />
            )}
          </CardContent>
        </Card>

        {/* Mandates */}
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <h4 className="text-sm font-semibold">Signed Mandates</h4>
            </div>
            {data.counts.dossiersWithoutMandate === 0 ? (
              <div className="flex items-center gap-1 text-green-600 text-sm">
                <CheckCircle className="w-4 h-4" /> All files have mandates
              </div>
            ) : (
              <StatusBadge
                label={`${data.counts.dossiersWithoutMandate} missing`}
                variant="warning"
              />
            )}
          </CardContent>
        </Card>

        {/* Document Expiry */}
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <h4 className="text-sm font-semibold">Immigration Documents</h4>
            </div>
            {data.counts.expiredDocuments === 0 && data.counts.expiringSoonDocuments === 0 ? (
              <div className="flex items-center gap-1 text-green-600 text-sm">
                <CheckCircle className="w-4 h-4" /> All documents valid
              </div>
            ) : (
              <div className="space-y-1">
                {data.counts.expiredDocuments > 0 && (
                  <StatusBadge label={`${data.counts.expiredDocuments} expired`} variant="error" />
                )}
                {data.counts.expiringSoonDocuments > 0 && (
                  <StatusBadge label={`${data.counts.expiringSoonDocuments} expiring soon`} variant="warning" />
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
                <FileText className="w-4 h-4 text-blue-600" />
                <h4 className="text-sm font-semibold">LSO Reports</h4>
              </div>
              <p className="text-sm text-neutral-500">
                Generate By-Law 9 compliance reports
              </p>
              <span className="text-xs text-primary-600 flex items-center gap-1">
                View Reports <ExternalLink className="w-3 h-3" />
              </span>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
