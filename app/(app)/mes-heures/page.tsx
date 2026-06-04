import { getLocale, getTranslations } from "next-intl/server";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { normalizeAppLocale } from "@/lib/i18n/locale";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { getCurrentEmployee, getMyHours } from "@/lib/payroll/employee-hours-service";
import { MyHoursPanel } from "@/components/temps/MyHoursPanel";
import { DigestPreferenceToggle } from "@/components/temps/DigestPreferenceToggle";

/**
 * « Mon temps & ma paye » (N8) — l'employée (Aaliyah) soumet ses heures
 * travaillées pour être payée. Distinct du temps facturable client.
 * Doctrine : docs/product/SPEC_aaliyah_home_navette.md §7bis.
 */
export default async function MesHeuresPage() {
  const { cabinetId, userId } = await requireCabinetAndUser();
  const locale = normalizeAppLocale(await getLocale());
  const t = await getTranslations("hoursUi");

  const [employee, currentUser] = await Promise.all([
    getCurrentEmployee(cabinetId, userId),
    prisma.user.findUnique({ where: { id: userId }, select: { digestOptOut: true } }),
  ]);
  const digestEnabled = !(currentUser?.digestOptOut ?? false);

  // Aucune fiche employé liée (ex. compte avocate/admin sans fiche) → message clair.
  if (!employee) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader title={t("pageTitle")} description={t("pageDescription")} />
        <DigestPreferenceToggle enabled={digestEnabled} />
        <EmptyState title={t("noEmployeeTitle")} description={t("noEmployeeBody")} />
      </div>
    );
  }

  const [view, dossiers] = await Promise.all([
    getMyHours(cabinetId, employee.id),
    prisma.dossier.findMany({
      where: { cabinetId, statut: { in: ["ouvert", "actif", "en_attente"] } },
      select: { id: true, intitule: true, numeroDossier: true },
      orderBy: { updatedAt: "desc" },
      take: 100,
    }),
  ]);

  const matters = dossiers.map((d) => ({
    id: d.id,
    label: d.numeroDossier?.trim() ? `${d.numeroDossier} — ${d.intitule}` : d.intitule,
  }));

  const data = {
    employee: view!.employee,
    summary: view!.summary,
    entries: view!.entries.map((e) => ({
      id: e.id,
      date: e.date.toISOString(),
      hours: e.hours,
      status: e.status,
      note: e.note,
      dossierLabel: e.dossierLabel,
      rejectionReason: e.rejectionReason,
    })),
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title={t("pageTitle")} description={t("pageDescription")} />
      <MyHoursPanel data={data} matters={matters} locale={locale} today={today} />
      <DigestPreferenceToggle enabled={digestEnabled} />
    </div>
  );
}
