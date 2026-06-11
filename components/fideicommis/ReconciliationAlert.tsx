"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import Link from "next/link";
import { useCabinetProvince } from "@/components/providers/CabinetProvinceProvider";
import { getTrustRegulatorCopy } from "@/lib/trust/regulator";

interface ReconciliationStatus {
  expectedPeriode: string;
  daysSinceMonthEnd: number;
  overdue: boolean;
  critical: boolean;
  lastCertifiedPeriode: string | null;
}

export function ReconciliationAlert() {
  const copy = getTrustRegulatorCopy(useCabinetProvince());
  const { data, isLoading } = useQuery({
    queryKey: ["reconciliation", "status"],
    queryFn: async () => {
      const res = await fetch("/api/fideicommis/reconciliation?statusOnly=true");
      if (!res.ok) throw new Error("Error loading reconciliation status");
      return res.json() as Promise<ReconciliationStatus>;
    },
  });

  if (isLoading || !data) return null;

  // Current period is reconciled — show green
  if (!data.overdue && !data.critical && data.lastCertifiedPeriode === data.expectedPeriode) {
    return (
      <Card className="border-green-200 bg-green-50/50">
        <CardContent className="p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 shrink-0" aria-hidden />
          <div className="flex-1">
            <p className="text-sm font-medium text-green-800">
              {copy.alertUpToDate}
            </p>
            <p className="text-xs text-green-600">
              {copy.isQuebec
                ? `Période ${data.lastCertifiedPeriode} certifiée`
                : `Period ${data.lastCertifiedPeriode} certified`}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Critical — past 25 days
  if (data.critical) {
    return (
      <Link href="/comptes/rapprochement">
        <Card className="border-red-300 bg-red-50/50 cursor-pointer hover:bg-red-100/50 transition-colors">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" aria-hidden />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">
                {copy.alertOverdueCritical(data.daysSinceMonthEnd)}
              </p>
              <p className="text-xs text-red-600">
                {copy.alertOverdueCriticalDetail(data.expectedPeriode)}
              </p>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  // Warning — approaching deadline
  if (data.overdue) {
    return (
      <Link href="/comptes/rapprochement">
        <Card className="border-amber-200 bg-amber-50/50 cursor-pointer hover:bg-amber-100/50 transition-colors">
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-600 shrink-0" aria-hidden />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800">
                {copy.alertDue(25 - data.daysSinceMonthEnd)}
              </p>
              <p className="text-xs text-amber-600">
                {copy.alertDueDetail(data.expectedPeriode)}
              </p>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  // Not yet due but not done
  return (
    <Link href="/comptes/rapprochement">
      <Card className="border-blue-200 bg-blue-50/50 cursor-pointer hover:bg-blue-100/50 transition-colors">
        <CardContent className="p-4 flex items-center gap-3">
          <Clock className="w-5 h-5 text-blue-600 shrink-0" aria-hidden />
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-800">
              {copy.alertPending(data.expectedPeriode)}
            </p>
            <p className="text-xs text-blue-600">
              {copy.alertPendingDetail(25 - data.daysSinceMonthEnd)}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
