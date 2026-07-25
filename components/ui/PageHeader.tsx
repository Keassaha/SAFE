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
  variant?: "default" | "dashboard" | "compact";
}

export function PageHeader({
  title,
  description,
  action,
  backHref,
  backLabel,
  breadcrumbs,
  variant = "default",
}: PageHeaderProps) {
  const t = useTranslations("ui");

  // Define styles based on Design System variant
  const containerClasses = {
    default: "dash-header relative overflow-hidden rounded-lg bg-si-forest p-8 [&>*]:relative [&>*]:z-10",
    dashboard: "bg-transparent py-4",
    compact: "dash-header relative overflow-hidden rounded-lg bg-si-forest p-5 [&>*]:relative [&>*]:z-10",
  }[variant] || "dash-header relative overflow-hidden rounded-lg bg-si-forest p-8 [&>*]:relative [&>*]:z-10";

  const titleClasses = {
    default: "text-[31px] font-serif text-si-surface",
    dashboard: "font-serif text-[32px] font-normal text-si-ink",
    compact: "text-[22px] font-serif text-si-surface",
  }[variant] || "text-[31px] font-serif text-si-surface";

  const descriptionClasses = variant === "dashboard" ? "max-w-[65ch] font-sans text-[14px] text-si-muted" : "max-w-[65ch] font-sans text-[14px] text-si-surface/70";
  const backTextClasses = variant === "dashboard" ? "text-si-muted hover:text-si-ink" : "text-si-surface/70 hover:text-si-surface";
  const breadcrumbTextClasses = variant === "dashboard" ? "text-si-muted" : "font-mono text-si-surface/60";
  const breadcrumbHoverClasses = variant === "dashboard" ? "hover:text-si-ink" : "hover:text-si-surface";
  const breadcrumbActiveClasses = variant === "dashboard" ? "text-si-ink" : "text-si-surface";

  return (
    <header className={containerClasses}>
      {backHref && (
        <Link
          href={backHref}
          className={`inline-flex items-center gap-1 text-sm font-medium transition-colors duration-200 mb-2 ${backTextClasses}`}
        >
          <ChevronLeft className="w-4 h-4" aria-hidden />
          {backLabel ?? t("back")}
        </Link>
      )}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label={t("breadcrumbs")} className={`flex items-center gap-1.5 text-sm mb-2 ${breadcrumbTextClasses}`}>
          {breadcrumbs.map((item, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <span aria-hidden>/</span>}
              {item.href ? (
                <Link href={item.href} className={`transition-colors duration-200 ${breadcrumbHoverClasses}`}>
                  {item.label}
                </Link>
              ) : (
                <span className={`${breadcrumbActiveClasses}`}>{item.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`${titleClasses} tracking-tight`}>
            {title}
          </h1>
          {description && (
            <p className={`mt-1 ${descriptionClasses}`}>{description}</p>
          )}
        </div>
        {action && <div className="shrink-0 flex items-center gap-3 pageheader-action">{action}</div>}
      </div>
    </header>
  );
}
