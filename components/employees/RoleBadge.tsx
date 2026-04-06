"use client";

import type { EmployeeRole } from "@prisma/client";
import { EMPLOYEE_ROLE_LABELS } from "@/lib/auth/rbac";

const ROLE_STYLES: Record<EmployeeRole, string> = {
  ADMIN_ACCOUNTANT: "bg-amber-100 text-amber-800 border-amber-200",
  LEAD_LAWYER: "bg-blue-100 text-blue-800 border-blue-200",
  LAWYER: "bg-sky-50 text-sky-700 border-sky-200",
  LEGAL_ASSISTANT: "bg-violet-50 text-violet-700 border-violet-200",
  ACCOUNTING_TECHNICIAN: "bg-emerald-50 text-emerald-700 border-emerald-200",
  INTERN: "bg-neutral-100 text-neutral-600 border-neutral-200",
  READ_ONLY: "bg-neutral-50 text-neutral-500 border-neutral-200",
};

interface RoleBadgeProps {
  role: EmployeeRole;
  className?: string;
}

export function RoleBadge({ role, className = "" }: RoleBadgeProps) {
  const label = EMPLOYEE_ROLE_LABELS[role] ?? role;
  const style = ROLE_STYLES[role] ?? "bg-neutral-100 text-neutral-600";
  return (
    <span
      className={`inline-flex items-center rounded-safe-sm border px-2 py-0.5 text-xs font-medium ${style} ${className}`}
    >
      {label}
    </span>
  );
}
