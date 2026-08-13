"use client";

import { useTranslations } from "next-intl";
import { RegistrePagination, REGISTRE_TAILLE_PAGE } from "@/components/ui/registre";

interface EmployeePaginationProps {
  totalCount: number;
  currentPage: number;
  pageSize?: number;
}

/** Pied du registre employés. Mécanique partagée, libellés locaux. */
export function EmployeePagination({
  totalCount,
  currentPage,
  pageSize = REGISTRE_TAILLE_PAGE,
}: EmployeePaginationProps) {
  const t = useTranslations("employees");
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
          ? t("noEmployeeCount")
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
