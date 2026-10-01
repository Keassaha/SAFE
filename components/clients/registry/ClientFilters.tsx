"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { registreSelectClass } from "@/components/ui/registre";

const PARAMS = {
  status: "status",
  type: "type",
} as const;

export function ClientFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const t = useTranslations("clients");

  const STATUS_OPTIONS = [
    { value: "", label: t("filterStatusAll") },
    { value: "actif", label: t("statusActive") },
    { value: "inactif", label: t("statusInactive") },
    { value: "archive", label: t("statusArchived") },
  ];

  const TYPE_OPTIONS = [
    { value: "", label: t("filterTypeAll") },
    { value: "personne_physique", label: t("individual") },
    { value: "personne_morale", label: t("company") },
  ];

  function updateFilter(key: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    startTransition(() => {
      router.push(`/clients?${next.toString()}`);
    });
  }


  const selectClass = registreSelectClass;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        aria-label={t("filterByStatus")}
        value={searchParams.get(PARAMS.status) ?? ""}
        onChange={(e) => updateFilter(PARAMS.status, e.target.value)}
        className={selectClass}
      >
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value || "all"} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <select
        aria-label={t("filterByType")}
        value={searchParams.get(PARAMS.type) ?? ""}
        onChange={(e) => updateFilter(PARAMS.type, e.target.value)}
        className={selectClass}
      >
        {TYPE_OPTIONS.map((o) => (
          <option key={o.value || "all"} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {/* Bouton « Actualiser » retiré le 2026-10-01, comme sur Dossiers :
          la liste se recharge déjà à chaque filtre et après chaque action. */}
    </div>
  );
}
