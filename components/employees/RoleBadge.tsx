"use client";

import type { EmployeeRole } from "@prisma/client";
import { EMPLOYEE_ROLE_LABELS } from "@/lib/auth/rbac";

// Palette cohérente si-* : verts pour les rôles juridiques, amber pour l'admin,
// neutres pour le personnel de soutien. Le libellé textuel porte la précision.
const ROLE_STYLES: Record<EmployeeRole, string> = {
  ADMIN_ACCOUNTANT: "bg-si-amber/[0.13] text-si-amber-ink border-si-amber/30",
  LEAD_LAWYER: "bg-si-forest/[0.08] text-si-forest border-si-forest/20",
  LAWYER: "bg-si-verified/10 text-si-verified border-si-verified/30",
  LEGAL_ASSISTANT: "bg-si-canvas text-si-ink border-si-line",
  ACCOUNTING_TECHNICIAN: "bg-si-verified/10 text-si-verified border-si-verified/30",
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
