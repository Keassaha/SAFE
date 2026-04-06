"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { FileText, Plus, ArrowLeft } from "lucide-react";
import { routes } from "@/lib/routes";

export function FacturationPageHero({
  backHref,
  backLabel,
}: {
  backHref?: string;
  backLabel?: string;
} = {}) {
  const tf = useTranslations("facturation");

  return (
    <header className="rounded-safe bg-gradient-to-r from-[#051F20] via-[#0B2B26] to-[#163832] text-white p-6 shadow-lg">
      {backHref && (
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm mb-3"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden />
          {tf("returnTo", { label: backLabel ?? tf("backToOverview") })}
        </Link>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <FileText className="h-7 w-7 opacity-90" aria-hidden />
            {tf("billingAndFollowUp")}
          </h1>
          <p className="mt-1 text-white/80 text-sm">
            {tf("billingDescription")}
          </p>
        </div>
        <Link
          href={routes.facturationHonoraires}
          className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-safe font-medium bg-white/20 text-white border border-white/30 hover:bg-white/30 shadow-md transition-all duration-200 shrink-0"
        >
          <Plus className="h-4 w-4" aria-hidden />
          {tf("newInvoice")}
        </Link>
      </div>
    </header>
  );
}
