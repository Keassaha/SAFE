"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Download } from "lucide-react";

export function FacturationActions() {
  const tf = useTranslations("facturation");

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Button variant="secondary" className="gap-2" disabled title={tf("comingSoon")}>
        <Download className="h-4 w-4" aria-hidden />
        {tf("exportCsv")}
      </Button>
    </div>
  );
}
