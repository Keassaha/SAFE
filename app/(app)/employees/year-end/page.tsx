import { notFound } from "next/navigation";
import Link from "next/link";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { canManagePayroll } from "@/lib/auth/permissions";
import { getYearEndSummary, getAvailableYearEndYears } from "@/lib/payroll/year-end-service";
import { PageHeader } from "@/components/ui/PageHeader";
import { routes } from "@/lib/routes";
import type { UserRole } from "@prisma/client";
import { YearEndReportClient } from "@/components/employees/YearEndReportClient";

export default async function YearEndPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const { cabinetId, role } = await requireCabinetAndUser();
  const userRole = role as UserRole;

  if (!canManagePayroll(userRole)) notFound();

  const { year: yearParam } = await searchParams;
  const currentYear = new Date().getFullYear();
  const year = yearParam ? parseInt(yearParam, 10) : currentYear;

  const [summary, availableYears] = await Promise.all([
    getYearEndSummary(cabinetId, year),
    getAvailableYearEndYears(cabinetId),
  ]);

  // Si aucune année disponible, offrir l'année courante au moins
  const years = availableYears.length > 0 ? availableYears : [currentYear];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Récapitulatif de fin d'année"
        description="Feuillets T4 / T4A — document à remettre à votre comptable"
        backHref={routes.employees}
        backLabel="Retour aux employés"
        breadcrumbs={[
          { label: "Employés", href: routes.employees },
          { label: "Fin d'année" },
        ]}
      />

      <YearEndReportClient
        summary={summary}
        availableYears={years}
        selectedYear={year}
      />
    </div>
  );
}
