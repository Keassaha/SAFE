"use client";

import { useTranslations } from "next-intl";
import type { EmployeeRole } from "@prisma/client";
import { RoleBadge } from "./RoleBadge";
import {
  RBAC_MODULES,
  RBAC_ACTIONS,
  ROLE_MODULE_PERMISSIONS,
  EMPLOYEE_ROLE_LABELS,
} from "@/lib/auth/rbac";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import type { RBACModule, RBACAction } from "@/lib/auth/rbac";

interface EmployeeAccessTabProps {
  role: EmployeeRole;
  hasLoginAccess: boolean;
  canChangeRole: boolean;
  onRoleChange?: (newRole: EmployeeRole) => void;
}

export function EmployeeAccessTab({
  role,
  hasLoginAccess,
  canChangeRole,
  onRoleChange,
}: EmployeeAccessTabProps) {
  const t = useTranslations("employees");
  const permissions = ROLE_MODULE_PERMISSIONS[role];
  if (!permissions) return null;

  return (
    <Card>
      <CardHeader title={t("accessAndRole")} />
      <CardContent className="space-y-6">
        <div>
          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">
            {t("currentRole")}
          </p>
          <RoleBadge role={role} className="text-sm px-3 py-1" />
        </div>

        <div>
          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">
            {t("loginAccount")}
          </p>
          <p className="text-sm text-neutral-800">
            {hasLoginAccess ? t("configured") : t("notConfigured")}
          </p>
        </div>

        <div>
          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">
            {t("permissionsByModule")}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-neutral-border rounded-safe-sm overflow-hidden">
              <thead>
                <tr className="bg-neutral-surface/70 border-b border-neutral-border">
                  <th className="text-left px-4 py-2 font-medium text-neutral-700">{t("module")}</th>
                  {RBAC_ACTIONS.map((action) => (
                    <th
                      key={action}
                      className="text-center px-2 py-2 font-medium text-neutral-700 w-20"
                    >
                      {t(`permissions.${action}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {RBAC_MODULES.map((module) => {
                  const actions = permissions[module] ?? [];
                  return (
                    <tr
                      key={module}
                      className="border-b border-neutral-border last:border-b-0 hover:bg-neutral-surface/30"
                    >
                      <td className="px-4 py-2 font-medium text-neutral-800">
                        {t(`modules.${module}`)}
                      </td>
                      {RBAC_ACTIONS.map((action) => {
                        const allowed = actions.includes(action);
                        return (
                          <td key={action} className="text-center px-2 py-2">
                            {allowed ? (
                              <span className="text-status-success" aria-label={t("allowed")}>
                                ✓
                              </span>
                            ) : (
                              <span className="text-neutral-300" aria-label={t("notAllowed")}>
                                —
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {canChangeRole && onRoleChange && (
          <div className="pt-4 border-t border-neutral-border">
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">
              {t("changeRole")}
            </p>
            <select
              value={role}
              onChange={(e) => onRoleChange(e.target.value as EmployeeRole)}
              className="rounded-safe-sm border border-neutral-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30"
            >
              {(Object.keys(EMPLOYEE_ROLE_LABELS) as EmployeeRole[]).map((r) => (
                <option key={r} value={r}>
                  {EMPLOYEE_ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
