"use client";

import { useTranslations } from "next-intl";
import type { EmployeeRole } from "@prisma/client";
import { RoleBadge } from "./RoleBadge";
import { EMPLOYEE_ROLE_LABELS } from "@/lib/auth/rbac";
import { getEmployeeAccessSummary } from "@/lib/auth/effective-access";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";

/**
 * ⚠️ CET ONGLET AFFICHAIT DES PERMISSIONS QUE RIEN N'APPLIQUAIT.
 *
 * La grille venait de `ROLE_MODULE_PERMISSIONS`, une matrice dont la fonction `can()`
 * n'est appelée nulle part dans l'application. Un stagiaire, qui ne peut pas se
 * connecter du tout, s'y voyait attribuer des droits ; « Avocat responsable » et
 * « Avocat » y montraient deux grilles pour un accès identique.
 *
 * La grille est désormais dérivée des VRAIES fonctions de garde (`permissions.ts`),
 * celles que les pages appellent pour bloquer. Elle ne peut donc plus diverger de ce
 * qui se passe réellement.
 */

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
  const acces = getEmployeeAccessSummary(role);

  return (
    <Card>
      <CardHeader title={t("accessAndRole")} />
      <CardContent className="space-y-6">
        <div>
          <p className="text-xs font-medium text-si-muted uppercase tracking-wider mb-2">
            {t("currentRole")}
          </p>
          <RoleBadge role={role} className="text-sm px-3 py-1" />
        </div>

        <div>
          <p className="text-xs font-medium text-si-muted uppercase tracking-wider mb-2">
            {t("loginAccount")}
          </p>
          <p className="text-sm text-si-ink">
            {hasLoginAccess ? t("configured") : t("notConfigured")}
          </p>
        </div>

        <div>
          <p className="text-xs font-medium text-si-muted uppercase tracking-wider mb-2">
            Accès réel dans SAFE
          </p>
          <p className="mb-3 max-w-2xl text-sm leading-relaxed text-si-muted">
            {acces.messageFr}
          </p>

          {!acces.canSignIn ? null : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-si-line rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-si-surface/70 border-b border-si-line">
                    <th className="text-left px-4 py-2 font-medium text-si-ink">Module</th>
                    <th className="text-center px-2 py-2 font-medium text-si-ink w-24">Consulter</th>
                    <th className="text-center px-2 py-2 font-medium text-si-ink w-24">Modifier</th>
                  </tr>
                </thead>
                <tbody>
                  {acces.modules.map((m) => (
                    <tr key={m.module} className="safe-zoom-rang border-b border-si-line last:border-b-0 " >
                      <td className="px-4 py-2 text-si-ink">
                        {m.labelFr}
                        {m.noteFr && (
                          <span className="mt-0.5 block text-xs text-si-muted">{m.noteFr}</span>
                        )}
                      </td>
                      {[m.view, m.edit].map((ok, k) => (
                        <td key={k} className="text-center px-2 py-2">
                          {ok ? (
                            <span className="text-si-verified" aria-label="Autorisé">✓</span>
                          ) : (
                            <span className="text-si-muted/40" aria-label="Non autorisé">—</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="mt-3 max-w-2xl text-xs leading-relaxed text-si-muted">
            Ce tableau est calculé à partir des contrôles que SAFE applique réellement,
            et non d'une description séparée. Si un contrôle change, ce tableau change
            avec lui.
          </p>
        </div>

        {canChangeRole && onRoleChange && (
          <div className="pt-4 border-t border-si-line">
            <p className="text-xs font-medium text-si-muted uppercase tracking-wider mb-2">
              {t("changeRole")}
            </p>
            <select
              value={role}
              onChange={(e) => onRoleChange(e.target.value as EmployeeRole)}
              className="rounded-lg border border-si-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-si-verified/25"
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
