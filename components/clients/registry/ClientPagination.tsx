"use client";

import { useTranslations } from "next-intl";
import { RegistrePagination, REGISTRE_TAILLE_PAGE } from "@/components/ui/registre";

interface ClientPaginationProps {
  totalCount: number;
  currentPage: number;
  pageSize?: number;
}

/**
 * Pied du registre clients. Toute la mécanique vient de `RegistrePagination` :
 * ce fichier ne fait plus que traduire. Les trois pieds du produit étaient
 * recopiés à l'identique, chacun codant en dur le chemin de sa page.
 */
export function ClientPagination({
  totalCount,
  currentPage,
  pageSize = REGISTRE_TAILLE_PAGE,
}: ClientPaginationProps) {
  const t = useTranslations("clients");
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
