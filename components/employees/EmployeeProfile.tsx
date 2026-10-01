"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { EmployeeRole, EmployeeStatus, EmploymentType } from "@prisma/client";
import { EmployeeProfileTabs, type EmployeeProfileTabId } from "./EmployeeProfileTabs";
import { EmployeeInfoTab } from "./EmployeeInfoTab";
import { EmployeeAccessTab } from "./EmployeeAccessTab";
import { EmployeePayrollTab } from "./EmployeePayrollTab";
import { EmployeeActivityTab } from "./EmployeeActivityTab";
import type { PayslipRow } from "./EmployeePayrollTab";
import type { SerializedPendingHour, ApprovedSummary } from "./PendingHoursApproval";
import type { ActivityRow } from "./EmployeeActivityTab";
import { updateEmployee, generatePayslipForCurrentWeek } from "@/app/(app)/employees/actions";
import { EmployeeYearEndPanel } from "./EmployeeYearEndPanel";
import { ValidationPaiePanel } from "@/components/paie/ValidationPaiePanel";
import type { SerializedPayView } from "@/lib/payroll/remuneration-service";

export type EmployeeProfileData = {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string | null;
  address: string | null;
  hireDate: Date;
  status: EmployeeStatus;
  role: EmployeeRole;
  jobTitle: string | null;
  /** Ce que la personne est payée (paie). */
  hourlyRate: number;
  /** Ce que le client paie pour une heure de cette personne (facturation). */
  billableRate: number | null;
  employmentType: EmploymentType;
  sinMasked: string | null;
  supervisorId: string | null;
  responsibilities: string | null;
  supervisor?: { fullName: string } | null;
  hasLoginAccess: boolean;
};

interface EmployeeProfileProps {
  employee: EmployeeProfileData;
  canEdit: boolean;
  canManagePayroll: boolean;
  supervisorOptions: { id: string; fullName: string }[];
  payslips: PayslipRow[];
  activities: ActivityRow[];
  pendingHours?: SerializedPendingHour[];
  approvedSummary?: ApprovedSummary | null;
  locale?: "fr" | "en";
  /** Rémunération à trois sources, quand l'utilisateur gère la paie. */
  remuneration?: { view: SerializedPayView; subjects: { code: string; label: string }[] } | null;
  initialTab?: EmployeeProfileTabId;
}

export function EmployeeProfile({
  employee,
  canEdit,
  canManagePayroll,
  supervisorOptions,
  payslips,
  activities,
  pendingHours = [],
  approvedSummary = null,
  locale = "en",
  remuneration = null,
  initialTab = "info",
}: EmployeeProfileProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<EmployeeProfileTabId>(initialTab);
  const [showPlanSetup, setShowPlanSetup] = useState(false);
  const tr = useTranslations("remuneration");
  const hasPlan = !!remuneration?.view.plan;

  async function handleRoleChange(newRole: EmployeeRole) {
    await updateEmployee(employee.id, { role: newRole });
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <EmployeeProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === "info" && (
        <EmployeeInfoTab
          employee={employee}
          canEdit={canEdit}
          supervisorOptions={supervisorOptions}
        />
      )}

      {activeTab === "access" && (
        <EmployeeAccessTab
          role={employee.role}
          hasLoginAccess={employee.hasLoginAccess}
          canChangeRole={canEdit}
          onRoleChange={handleRoleChange}
        />
      )}

      {activeTab === "payroll" && hasPlan && remuneration && (
        <ValidationPaiePanel view={remuneration.view} employeeId={employee.id} subjects={remuneration.subjects} />
      )}

      {activeTab === "payroll" && !hasPlan && (
        <div className="space-y-4">
          {remuneration ? (
            showPlanSetup ? (
              <ValidationPaiePanel view={remuneration.view} employeeId={employee.id} subjects={remuneration.subjects} />
            ) : (
              <button
                type="button"
                onClick={() => setShowPlanSetup(true)}
                className="text-sm text-si-ink underline underline-offset-2"
              >
                {tr("setupPlan")}
              </button>
            )
          ) : null}
          <EmployeeYearEndPanel
            employeeId={employee.id}
            employmentType={employee.employmentType}
            sinMasked={employee.sinMasked}
            canEdit={canEdit}
          />
          <EmployeePayrollTab
            payslips={payslips}
            canGenerate={canManagePayroll}
            employeeId={employee.id}
            hourlyRate={employee.hourlyRate}
            pendingHours={pendingHours}
            approvedSummary={approvedSummary}
            locale={locale}
            onGenerate={async () => {
              await generatePayslipForCurrentWeek(employee.id);
              router.refresh();
            }}
          />
        </div>
      )}

      {activeTab === "activity" && <EmployeeActivityTab activities={activities} />}
    </div>
  );
}
