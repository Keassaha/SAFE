"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  hourlyRate: number;
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
}: EmployeeProfileProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<EmployeeProfileTabId>("info");

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

      {activeTab === "payroll" && (
        <div className="space-y-4">
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
