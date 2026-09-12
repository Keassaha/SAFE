"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { EmployeeRole, EmployeeStatus } from "@prisma/client";
import { Button } from "@/components/ui/Button";
import { EMPLOYEE_ROLE_LABELS, canEmployeeRoleSignIn } from "@/lib/auth/rbac";
import { createEmployee, updateEmployee, type CreateEmployeeInput } from "@/app/(app)/employees/actions";

const ROLES = (Object.keys(EMPLOYEE_ROLE_LABELS) as EmployeeRole[]).map((value) => ({
  value,
  label: EMPLOYEE_ROLE_LABELS[value],
}));

export type EmployeeFormData = Partial<CreateEmployeeInput> & {
  firstName: string;
  lastName: string;
  email: string;
  hireDate: string;
  status: EmployeeStatus;
  role: EmployeeRole;
  hourlyRate: number;
  billableRate?: number | null;
  enableLogin?: boolean;
  password?: string;
};

interface EmployeeFormProps {
  mode: "create" | "edit";
  employeeId?: string;
  initialData: EmployeeFormData;
  supervisorOptions?: { id: string; fullName: string }[];
  /** La personne a-t-elle un compte SAFE ? Le taux facturable y vit. */
  hasLoginAccess?: boolean;
}

export function EmployeeForm({
  mode,
  employeeId,
  initialData,
  supervisorOptions = [],
  hasLoginAccess = false,
}: EmployeeFormProps) {
  const router = useRouter();
  const t = useTranslations("employees");
  const tc = useTranslations("common");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<EmployeeFormData>(initialData);
  const roleCanSignIn = canEmployeeRoleSignIn(form.role);
  const enableLogin = Boolean(form.enableLogin);
  /* Le taux facturé au client vit sur le compte SAFE (`User.defaultHourlyRate`).
     Sans compte, il n'a nulle part où être écrit : mieux vaut le dire que
     laisser saisir un chiffre qui disparaîtrait en silence. */
  const peutPorterUnTauxFacturable = mode === "edit" ? hasLoginAccess : enableLogin;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "create") {
        await createEmployee({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          address: form.address,
          hireDate: form.hireDate,
          status: form.status,
          role: form.role,
          jobTitle: form.jobTitle,
          hourlyRate: form.hourlyRate,
          billableRate: form.billableRate ?? null,
          supervisorId: form.supervisorId,
          responsibilities: form.responsibilities,
          enableLogin,
          password: enableLogin ? form.password : undefined,
        });
      } else if (employeeId) {
        await updateEmployee(employeeId, form);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorOccurred"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <div className="rounded-lg bg-[#B84A3E]/10 border border-[#B84A3E]/30 px-4 py-3 text-sm text-[#B84A3E]">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-si-ink mb-1">
            {t("firstName")} *
          </label>
          <input
            id="firstName"
            type="text"
            required
            value={form.firstName}
            onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
            className="min-h-tap w-full rounded-lg border border-si-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-si-verified/25"
          />
        </div>
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-si-ink mb-1">
            {t("lastName")} *
          </label>
          <input
            id="lastName"
            type="text"
            required
            value={form.lastName}
            onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
            className="min-h-tap w-full rounded-lg border border-si-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-si-verified/25"
          />
        </div>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-si-ink mb-1">
          {tc("email")} *
        </label>
        <input
          id="email"
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
          className="min-h-tap w-full rounded-lg border border-si-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-si-verified/25"
          disabled={mode === "edit"}
        />
      </div>

      {mode === "create" && (
        <div className="rounded-lg border border-si-line bg-si-surface/40 p-4 space-y-3">
          <label className="flex items-start gap-3 text-sm text-si-ink">
            <input
              type="checkbox"
              className="mt-1"
              checked={enableLogin}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  enableLogin: e.target.checked,
                  password: e.target.checked ? p.password : "",
                }))
              }
            />
            <span>{t("createAccount")}</span>
          </label>

          {enableLogin && !roleCanSignIn && (
            <p className="text-sm text-si-amber-ink">
              {t("roleIncompatible")}
            </p>
          )}

          {enableLogin && roleCanSignIn && (
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-si-ink mb-1">
                {t("temporaryPassword")} *
              </label>
              <input
                id="password"
                type="password"
                minLength={8}
                required
                value={form.password ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                className="min-h-tap w-full rounded-lg border border-si-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-si-verified/25"
              />
              <p className="mt-1 text-xs text-si-muted">
                {t("loginHint")}
              </p>
            </div>
          )}
        </div>
      )}

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-si-ink mb-1">
          {tc("phone")}
        </label>
        <input
          id="phone"
          type="tel"
          value={form.phone ?? ""}
          onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value || undefined }))}
          className="min-h-tap w-full rounded-lg border border-si-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-si-verified/25"
        />
      </div>

      <div>
        <label htmlFor="address" className="block text-sm font-medium text-si-ink mb-1">
          {tc("address")}
        </label>
        <textarea
          id="address"
          rows={2}
          value={form.address ?? ""}
          onChange={(e) => setForm((p) => ({ ...p, address: e.target.value || undefined }))}
          className="min-h-tap w-full rounded-lg border border-si-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-si-verified/25"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="hireDate" className="block text-sm font-medium text-si-ink mb-1">
            {t("hireDate")} *
          </label>
          <input
            id="hireDate"
            type="date"
            required
            value={form.hireDate}
            onChange={(e) => setForm((p) => ({ ...p, hireDate: e.target.value }))}
            className="min-h-tap w-full rounded-lg border border-si-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-si-verified/25"
          />
        </div>
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-si-ink mb-1">
            {tc("status")}
          </label>
          <select
            id="status"
            value={form.status}
            onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as EmployeeStatus }))}
            className="min-h-tap w-full rounded-lg border border-si-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-si-verified/25"
          >
            <option value="active">{tc("active")}</option>
            <option value="inactive">{tc("inactive")}</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="role" className="block text-sm font-medium text-si-ink mb-1">
            {t("role")} *
          </label>
          <select
            id="role"
            required
            value={form.role}
            onChange={(e) => setForm((p) => ({ ...p, role: e.target.value as EmployeeRole }))}
            className="min-h-tap w-full rounded-lg border border-si-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-si-verified/25"
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="jobTitle" className="block text-sm font-medium text-si-ink mb-1">
            {t("jobTitle")}
          </label>
          <input
            id="jobTitle"
            type="text"
            value={form.jobTitle ?? ""}
            onChange={(e) => setForm((p) => ({ ...p, jobTitle: e.target.value || undefined }))}
            className="min-h-tap w-full rounded-lg border border-si-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-si-verified/25"
          />
        </div>
      </div>

      {/* DEUX taux, jamais le même nombre.
          « Taux horaire » écrivait le taux de PAIE. Le taux FACTURÉ au client
          vivait sur le compte de connexion et n'était réglable par aucun
          écran : il restait vide pour tout le monde, alors que la saisie de
          temps le lisait déjà. Les deux sont ici, côte à côte, chacun avec sa
          phrase, pour qu'on ne puisse plus les confondre. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="hourlyRate" className="block text-sm font-medium text-si-ink mb-1">
            {t("hourlyRate")} *
          </label>
          <input
            id="hourlyRate"
            type="number"
            step="0.01"
            min="0"
            required
            value={form.hourlyRate}
            onChange={(e) => setForm((p) => ({ ...p, hourlyRate: Number(e.target.value) || 0 }))}
            className="min-h-tap w-full rounded-lg border border-si-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-si-verified/25"
          />
          <p className="mt-1.5 text-xs text-si-muted">{t("payRateHint")}</p>
        </div>
        <div>
          <label htmlFor="billableRate" className="block text-sm font-medium text-si-ink mb-1">
            {t("billableRate")}
          </label>
          <input
            id="billableRate"
            type="number"
            step="0.01"
            min="0"
            disabled={!peutPorterUnTauxFacturable}
            value={form.billableRate ?? ""}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                /* Champ vidé : `null`, pas 0. Zéro serait pris pour un taux
                   réglé et bloquerait le repli sur le taux du cabinet. */
                billableRate: e.target.value === "" ? null : Number(e.target.value),
              }))
            }
            placeholder="250"
            className="min-h-tap w-full rounded-lg border border-si-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-si-verified/25 disabled:cursor-not-allowed disabled:bg-si-canvas disabled:text-si-muted"
          />
          <p className="mt-1.5 text-xs text-si-muted">
            {peutPorterUnTauxFacturable ? t("billableRateHint") : t("billableRateNeedsAccount")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {supervisorOptions.length > 0 && (
          <div>
            <label htmlFor="supervisorId" className="block text-sm font-medium text-si-ink mb-1">
              {t("supervisor")}
            </label>
            <select
              id="supervisorId"
              value={form.supervisorId ?? ""}
              onChange={(e) =>
                setForm((p) => ({ ...p, supervisorId: e.target.value || undefined }))
              }
              className="min-h-tap w-full rounded-lg border border-si-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-si-verified/25"
            >
              <option value="">—</option>
              {supervisorOptions
                .filter((s) => s.id !== employeeId)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName}
                  </option>
                ))}
            </select>
          </div>
        )}
      </div>

      <div>
        <label htmlFor="responsibilities" className="block text-sm font-medium text-si-ink mb-1">
          {t("responsibilities")}
        </label>
        <textarea
          id="responsibilities"
          rows={3}
          value={form.responsibilities ?? ""}
          onChange={(e) =>
            setForm((p) => ({ ...p, responsibilities: e.target.value || undefined }))
          }
          className="min-h-tap w-full rounded-lg border border-si-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-si-verified/25"
          placeholder={t("responsibilitiesPlaceholder")}
        />
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? tc("saving") : mode === "create" ? t("createEmployee") : tc("save")}
        </Button>
        {mode === "edit" && (
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.back()}
            disabled={loading}
          >
            {tc("cancel")}
          </Button>
        )}
      </div>
    </form>
  );
}
