"use client";

import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/ui/PageHeader";

export function FacturationPageHero({
  backHref,
  backLabel,
}: {
  backHref?: string;
  backLabel?: string;
} = {}) {
  const tf = useTranslations("facturation");

  return (
    <PageHeader
      title={tf("billingAndFollowUp")}
      description={tf("billingDescription")}
      backHref={backHref}
      backLabel={backLabel ? tf("returnTo", { label: backLabel }) : undefined}
    />
  );
}
