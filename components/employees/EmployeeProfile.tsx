"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { EmployeeRole, EmployeeStatus } from "@prisma/client";
import { EmployeeProfileTabs, type EmployeeProfileTabId } from "./EmployeeProfileTabs";
import { EmployeeInfoTab } from "./EmployeeInfoTab";
import { EmployeeAccessTab } from "./EmployeeAccessTab";
import { EmployeePayrollTab } from "./EmployeePayrollTab";
import { EmployeeActivityTab } from "./EmployeeActivityTab";
import type { PayslipRow } from "./EmployeePayrollTab";
import type { ActivityRow } from "./EmployeeActivityTab";
import { updateEmployee, generatePayslipForCurrentWeek } from "@/app/(app)/employees/actions";

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
}

export function EmployeeProfile({
  employee,
  canEdit,
  canManagePayroll,
  supervisorOptions,
  payslips,
  activities,
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
        <EmployeePayrollTab
          payslips={payslips}
          canGenerate={canManagePayroll}
          onGenerate={async () => {
            await generatePayslipForCurrentWeek(employee.id);
            router.refresh();
          }}
        />
      )}

      {activeTab === "activity" && <EmployeeActivityTab activities={activities} />}
    </div>
  );
}
