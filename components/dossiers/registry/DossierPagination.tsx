"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";

const DEFAULT_PAGE_SIZE = 20;

interface DossierPaginationProps {
  totalCount: number;
  currentPage: number;
  pageSize?: number;
}

export function DossierPagination({
  totalCount,
  currentPage,
  pageSize = DEFAULT_PAGE_SIZE,
}: DossierPaginationProps) {
  const t = useTranslations("matters");
  const tc = useTranslations("common");
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const searchParams = useSearchParams();
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  function buildUrl(page: number) {
    const next = new URLSearchParams(searchParams.toString());
    next.set("page", String(page));
    return `/dossiers?${next.toString()}`;
  }

  const start = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalCount);

  if (totalCount <= pageSize) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-border bg-neutral-surface/30">
      <p className="text-sm text-neutral-muted">
        {totalCount === 0
          ? t("noMatterCount")
          : t("paginationRange", { start, end, total: totalCount, plural: totalCount > 1 ? "s" : "" })}
      </p>
      <div className="flex items-center gap-2">
        <Link
          href={hasPrev ? buildUrl(currentPage - 1) : "#"}
          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            hasPrev
              ? "text-primary-700 hover:bg-primary-50"
              : "text-neutral-400 pointer-events-none"
          }`}
          aria-disabled={!hasPrev}
        >
          <ChevronLeft className="w-4 h-4" />
          {tc("previous")}
        </Link>
        <span className="text-sm text-neutral-muted">
          {t("page", { current: currentPage, total: totalPages })}
        </span>
        <Link
          href={hasNext ? buildUrl(currentPage + 1) : "#"}
          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            hasNext
              ? "text-primary-700 hover:bg-primary-50"
              : "text-neutral-400 pointer-events-none"
          }`}
          aria-disabled={!hasNext}
        >
          {tc("next")}
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
