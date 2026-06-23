"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { AlertTriangle, FileSignature, ShieldAlert, UserX } from "lucide-react";

interface ClientProfileAlertsProps {
  retainerSigned: boolean;
  conflictChecked: boolean;
  identityVerified: boolean;
  overdueInvoicesCount: number;
  verificationIdentiteHref: string;
}

export function ClientProfileAlerts({
  retainerSigned,
  conflictChecked,
  identityVerified,
  overdueInvoicesCount,
  verificationIdentiteHref,
}: ClientProfileAlertsProps) {
  const t = useTranslations("clients");

  const alerts: { id: string; message: string; icon: React.ComponentType<{ className?: string }>; href?: string }[] = [];

  if (!retainerSigned) {
    alerts.push({
      id: "mandat",
      message: t("retainerNotSigned"),
      icon: FileSignature,
    });
  }
  if (!conflictChecked) {
    alerts.push({
      id: "conflit",
      message: t("conflictNotChecked"),
      icon: ShieldAlert,
    });
  }
  if (!identityVerified) {
    alerts.push({
      id: "identite",
      message: t("identityNotVerified"),
      icon: UserX,
      href: verificationIdentiteHref,
    });
  }
  if (overdueInvoicesCount > 0) {
    alerts.push({
      id: "factures",
      message: t("overdueInvoices", { count: overdueInvoicesCount }),
      icon: AlertTriangle,
    });
  }

  if (alerts.length === 0) return null;

  return (
    <div className="rounded-xl border border-si-amber/30 bg-si-amber/[0.08] p-4 space-y-2">
      <p className="text-sm font-medium text-si-amber-ink flex items-center gap-2">
        <AlertTriangle className="w-4 h-4" />
        {t("alerts")}
      </p>
      <ul className="space-y-1.5">
        {alerts.map((a) => {
          const Icon = a.icon;
          const content = (
            <>
              <Icon className="w-4 h-4 shrink-0 text-si-amber-ink" />
              <span className="text-sm text-si-muted">{a.message}</span>
            </>
          );
          return (
            <li key={a.id} className="flex items-center gap-2">
              {a.href ? (
                <Link href={a.href} className="flex items-center gap-2 hover:text-si-forest">
                  {content}
                </Link>
              ) : (
                content
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
