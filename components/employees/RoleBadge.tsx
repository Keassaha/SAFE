"use client";

import type { EmployeeRole } from "@prisma/client";
import { EMPLOYEE_ROLE_LABELS } from "@/lib/auth/rbac";

const ROLE_STYLES: Record<EmployeeRole, string> = {
  ADMIN_ACCOUNTANT: "bg-si-amber/[0.13] text-si-amber-ink border-si-amber/30",
  LEAD_LAWYER: "bg-si-canvas text-si-ink border-si-line",
  LAWYER: "bg-sky-50 text-sky-700 border-sky-200",
  LEGAL_ASSISTANT: "bg-violet-50 text-violet-700 border-violet-200",
  ACCOUNTING_TECHNICIAN: "bg-emerald-50 text-emerald-700 border-emerald-200",
  INTERN: "bg-si-canvas text-si-muted border-si-line",
  READ_ONLY: "bg-si-canvas text-si-muted border-si-line",
};

interface RoleBadgeProps {
  role: EmployeeRole;
  className?: string;
}

export function RoleBadge({ role, className = "" }: RoleBadgeProps) {
  const label = EMPLOYEE_ROLE_LABELS[role] ?? role;
  const style = ROLE_STYLES[role] ?? "bg-si-canvas text-si-muted";
  return (
    <span
      className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-xs font-medium ${style} ${className}`}
    >
      {label}
    </span>
  );
}
