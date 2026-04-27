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
    default: "dash-header relative overflow-hidden rounded-lg p-8 [&>*]:relative [&>*]:z-10",
    dashboard: "bg-transparent py-4",
    compact: "dash-header relative overflow-hidden rounded-lg p-5 [&>*]:relative [&>*]:z-10",
  }[variant] || "dash-header relative overflow-hidden rounded-lg p-8 [&>*]:relative [&>*]:z-10";

  const containerStyle: React.CSSProperties =
    variant === "default" || variant === "compact"
      ? {
          background:
            "linear-gradient(115deg, #0F2A22 0%, #1F3A2E 35%, #234539 65%, #2B6A4E 100%)",
        }
      : {};

  const titleClasses = {
    default: "text-[32px] font-sans font-semibold text-forest-50",
    dashboard: "text-[32px] font-sans font-semibold text-slate-900",
    compact: "text-[22px] font-sans font-semibold text-forest-50",
  }[variant] || "text-[32px] font-sans font-semibold text-forest-50";

  const descriptionClasses = variant === "dashboard" ? "text-[14px] text-slate-600 font-sans" : "text-[14px] text-forest-200 font-sans";
  const backTextClasses = variant === "dashboard" ? "text-slate-600 hover:text-slate-900" : "text-forest-50/70 hover:text-forest-50";
  const breadcrumbTextClasses = variant === "dashboard" ? "text-slate-600" : "text-forest-50/70";
  const breadcrumbHoverClasses = variant === "dashboard" ? "hover:text-slate-900" : "hover:text-forest-50";
  const breadcrumbActiveClasses = variant === "dashboard" ? "text-slate-900" : "text-forest-50";

  return (
    <header className={`${containerClasses}`} style={containerStyle}>
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
