import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  backHref?: string;
  backLabel?: string;
  breadcrumbs?: BreadcrumbItem[];
}

export function PageHeader({
  title,
  description,
  action,
  backHref,
  backLabel,
  breadcrumbs,
}: PageHeaderProps) {
  const t = useTranslations("ui");
  return (
    <header className="space-y-2">
      {backHref && (
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-sm font-medium text-[#E6F4EF]/80 hover:text-[#E6F4EF] transition-colors duration-200"
        >
          <ChevronLeft className="w-4 h-4" aria-hidden />
          {backLabel ?? t("back")}
        </Link>
      )}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label={t("breadcrumbs")} className="flex items-center gap-1.5 text-sm text-[#E6F4EF]/80">
          {breadcrumbs.map((item, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <span aria-hidden>/</span>}
              {item.href ? (
                <Link href={item.href} className="hover:text-[#E6F4EF] transition-colors duration-200">
                  {item.label}
                </Link>
              ) : (
                <span className="text-[#E6F4EF]">{item.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-[#E6F4EF] tracking-tight">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-sm text-[#E6F4EF]/80">{description}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </header>
  );
}
