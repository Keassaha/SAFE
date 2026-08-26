"use client";

import { useTranslations } from "next-intl";
import { RegistrePagination } from "@/components/ui/registre";
import { FACTURE_LISTE_TAILLE_PAGE } from "@/lib/facturation/liste-query";

/**
 * Pied du registre de facturation. Toute la mécanique vient de
 * `RegistrePagination` : ce fichier ne fait que traduire, comme
 * `ClientPagination` et `DossierPagination`.
 */
export function FacturationPagination({
  totalCount,
  currentPage,
  pageSize = FACTURE_LISTE_TAILLE_PAGE,
}: {
  totalCount: number;
  currentPage: number;
  pageSize?: number;
}) {
  const t = useTranslations("facturation");
  const tc = useTranslations("common");
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const start = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalCount);

  return (
    <RegistrePagination
      totalCount={totalCount}
      currentPage={currentPage}
      pageSize={pageSize}
      resume={
        totalCount === 0
          ? t("paginationNone")
          : t("paginationRange", { start, end, total: totalCount })
      }
      labelPage={t("paginationPage", { current: currentPage, total: totalPages })}
      labelPrecedent={tc("previous")}
      labelSuivant={tc("next")}
    />
  );
}
