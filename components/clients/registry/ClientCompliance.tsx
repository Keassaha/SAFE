"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { ShieldCheck, AlertTriangle } from "lucide-react";

interface ClientComplianceProps {
  conflictChecked: boolean;
  conflictCheckDate: Date | null;
  conflictNotes: string | null;
  identityVerified: boolean;
  verificationDate: Date | null;
}

export function ClientCompliance({
  conflictChecked,
  conflictCheckDate,
  conflictNotes,
  identityVerified,
  verificationDate,
}: ClientComplianceProps) {
  const t = useTranslations("clients");
  const tc = useTranslations("common");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title={t("conflictControl")} />
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2">
            {conflictChecked ? (
              <ShieldCheck className="w-4 h-4 text-status-success" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-status-warning" />
            )}
            <span className="text-sm font-medium">
              {conflictChecked ? t("conflictDone") : t("conflictNotDone")}
            </span>
          </div>
          {conflictCheckDate && (
            <p className="text-xs text-neutral-muted">
              {tc("date")} :{" "}
              {new Intl.DateTimeFormat("fr-CA", { dateStyle: "medium" }).format(
                conflictCheckDate
              )}
            </p>
          )}
          {conflictNotes && (
            <p className="text-sm text-neutral-text-secondary mt-2 whitespace-pre-wrap">
              {conflictNotes}
            </p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader title={t("identityVerification")} />
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2">
            {identityVerified ? (
              <ShieldCheck className="w-4 h-4 text-status-success" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-status-warning" />
            )}
            <span className="text-sm font-medium">
              {identityVerified ? t("verified") : t("notVerified")}
            </span>
          </div>
          {verificationDate && (
            <p className="text-xs text-neutral-muted">
              {tc("date")} :{" "}
              {new Intl.DateTimeFormat("fr-CA", { dateStyle: "medium" }).format(
                verificationDate
              )}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
