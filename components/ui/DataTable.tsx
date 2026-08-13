import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  /** Hide this column on mobile card view (still visible in table scroll) */
  hideOnMobile?: boolean;
  /** Mark as primary — always shown prominently on mobile card */
  primary?: boolean;
  /** Right-align and use tabular mono numerals for amounts, dates and references. */
  numeric?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  emptyMessage?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage,
}: DataTableProps<T>) {
  const t = useTranslations("ui");

  if (data.length === 0) {
    return (
      <p className="px-4 py-8 text-center text-sm safe-text-secondary">
        {emptyMessage ?? t("empty")}
      </p>
    );
  }

  return (
    <>
      {/* ── Mobile card view (< sm) ── */}
      <div className="sm:hidden space-y-2">
        {data.map((row) => (
          <div
            key={keyExtractor(row)}
            className="space-y-1.5 rounded-lg border border-si-line bg-si-surface p-3"
          >
            {columns
              .filter((col) => !col.hideOnMobile)
              .map((col) => {
                const value = col.render
                  ? col.render(row)
                  : String((row as Record<string, unknown>)[col.key] ?? "");
                return (
                  <div
                    key={col.key}
                    className={
                      col.primary
                        ? "text-sm font-medium safe-text-title"
                        : "flex items-baseline justify-between gap-2 text-sm"
                    }
                  >
                    {col.primary ? (
                      value
                    ) : (
                      <>
                        <span className="text-xs safe-text-secondary shrink-0">
                          {col.header}
                        </span>
                        <span className={`truncate text-right text-si-ink ${col.numeric ? "font-mono tabular-nums" : ""}`}>
                          {value}
                        </span>
                      </>
                    )}
                  </div>
                );
              })}
          </div>
        ))}
      </div>

      {/* ── Desktop table view (>= sm) ── */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-si-line">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`h-9 px-3 text-[11px] font-medium text-si-muted ${
                    col.numeric ? "text-right font-mono tabular-nums" : "text-left"
                  }`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={keyExtractor(row)} className="safe-zoom-rang h-11 border-b border-si-line2 transition-colors duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] " >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-3 text-[13px] text-si-ink ${
                      col.numeric ? "text-right font-mono tabular-nums" : "text-left"
                    }`}
                  >
                    {col.render
                      ? col.render(row)
                      : String((row as Record<string, unknown>)[col.key] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
