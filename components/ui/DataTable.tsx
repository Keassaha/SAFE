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
            className="rounded-safe-sm border border-[var(--safe-neutral-border)] bg-white p-3 space-y-1.5"
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
                        <span className="safe-text-title text-right truncate">
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
            <tr className="border-b border-[var(--safe-neutral-border)]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left text-xs font-medium safe-text-secondary uppercase tracking-wider"
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr
                key={keyExtractor(row)}
                className={`border-b border-[var(--safe-neutral-border)]/80 transition-colors duration-200 hover:bg-green-50/50 ${
                  i % 2 === 1 ? "bg-neutral-100/30" : ""
                }`}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className="px-4 py-3 text-sm safe-text-title"
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
