import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { canManagePayroll } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";
import { routes } from "@/lib/routes";
import type { UserRole } from "@prisma/client";
import { toCalendarDayUTC, toIsoDay } from "@/lib/utils/calendar-date";
import { getPayView, serializePayView } from "@/lib/payroll/remuneration-service";
import { EspacePaiePanel } from "@/components/paie/EspacePaiePanel";

/**
 * Espace de paie de l'employée, ouvert depuis le compte de l'avocate.
 * Me Derisier n'ouvre pas SAFE : son adjointe passe par son compte pour
 * déclarer. Le journal d'audit garde la porte d'entrée (`via`).
 * Doctrine : docs/product/SPEC_REMUNERATION_AALIYAH.md
 */
export default async function EspaceEmployeePage({
  params,
}: {
  params: Promise<{ "employee-id": string }>;
}) {
  const { "employee-id": employeeId } = await params;
  const { cabinetId, userId, role } = await requireCabinetAndUser();
  if (!canManagePayroll(role as UserRole)) notFound();

  const today = toCalendarDayUTC(new Date());
  const [view, owner] = await Promise.all([
    getPayView(cabinetId, employeeId, today),
    prisma.user.findUnique({ where: { id: userId }, select: { nom: true } }),
  ]);
  if (!view) notFound();
  const t = await getTranslations("remuneration");
  const name = view.employee.firstName || view.employee.fullName;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-si-line bg-si-surface2 px-5 py-3 text-sm text-si-body">
        <span>{t("espaceBanner", { name, owner: owner?.nom ?? "" })}</span>
        <Link
          href={`${routes.employee(employeeId)}?onglet=paie`}
          className="font-medium text-si-ink underline underline-offset-2"
        >
          {t("espaceBack")}
        </Link>
      </div>
      <EspacePaiePanel view={serializePayView(view)} employeeId={employeeId} today={toIsoDay(today)} />
    </div>
  );
}
