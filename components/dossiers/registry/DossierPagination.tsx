"use client";

import { useTranslations } from "next-intl";
import { RegistrePagination, REGISTRE_TAILLE_PAGE } from "@/components/ui/registre";

interface DossierPaginationProps {
  totalCount: number;
  currentPage: number;
  pageSize?: number;
}

/** Pied du registre dossiers. Mécanique partagée, libellés locaux. */
export function DossierPagination({
  totalCount,
  currentPage,
  pageSize = REGISTRE_TAILLE_PAGE,
}: DossierPaginationProps) {
  const t = useTranslations("matters");
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
          ? t("noMatterCount")
          : t("paginationRange", {
              start,
              end,
              total: totalCount,
              plural: totalCount > 1 ? "s" : "",
            })
      }
      labelPage={t("page", { current: currentPage, total: totalPages })}
      labelPrecedent={tc("previous")}
      labelSuivant={tc("next")}
    />
  );
}
