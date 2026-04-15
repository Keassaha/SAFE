"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import Link from "next/link";

interface ReconciliationStatus {
  expectedPeriode: string;
  daysSinceMonthEnd: number;
  overdue: boolean;
  critical: boolean;
  lastCertifiedPeriode: string | null;
}

export function ReconciliationAlert() {
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
              Trust reconciliation up to date
            </p>
            <p className="text-xs text-green-600">
              Period {data.lastCertifiedPeriode} certified
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
                Trust reconciliation overdue — {data.daysSinceMonthEnd} days since month-end
              </p>
              <p className="text-xs text-red-600">
                By-Law 9 requires reconciliation within 25 days. Period {data.expectedPeriode} not certified.
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
                Trust reconciliation due — {25 - data.daysSinceMonthEnd} days remaining
              </p>
              <p className="text-xs text-amber-600">
                Period {data.expectedPeriode} needs to be reconciled and certified.
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
              Trust reconciliation pending for {data.expectedPeriode}
            </p>
            <p className="text-xs text-blue-600">
              {25 - data.daysSinceMonthEnd} days until By-Law 9 deadline.
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
