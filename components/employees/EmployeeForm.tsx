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
  enableLogin?: boolean;
  password?: string;
};

interface EmployeeFormProps {
  mode: "create" | "edit";
  employeeId?: string;
  initialData: EmployeeFormData;
  supervisorOptions?: { id: string; fullName: string }[];
}

export function EmployeeForm({
  mode,
  employeeId,
  initialData,
  supervisorOptions = [],
}: EmployeeFormProps) {
  const router = useRouter();
  const t = useTranslations("employees");
  const tc = useTranslations("common");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<EmployeeFormData>(initialData);
  const roleCanSignIn = canEmployeeRoleSignIn(form.role);
  const enableLogin = Boolean(form.enableLogin);

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
        <div className="rounded-safe-sm bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-neutral-700 mb-1">
            {t("firstName")} *
          </label>
          <input
            id="firstName"
            type="text"
            required
            value={form.firstName}
            onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
            className="w-full rounded-safe-sm border border-neutral-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30"
          />
        </div>
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-neutral-700 mb-1">
            {t("lastName")} *
          </label>
          <input
            id="lastName"
            type="text"
            required
            value={form.lastName}
            onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
            className="w-full rounded-safe-sm border border-neutral-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30"
          />
        </div>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1">
          {tc("email")} *
        </label>
        <input
          id="email"
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
          className="w-full rounded-safe-sm border border-neutral-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30"
          disabled={mode === "edit"}
        />
      </div>

      {mode === "create" && (
        <div className="rounded-safe-sm border border-neutral-border bg-neutral-surface/40 p-4 space-y-3">
          <label className="flex items-start gap-3 text-sm text-neutral-800">
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
            <p className="text-sm text-amber-700">
              {t("roleIncompatible")}
            </p>
          )}

          {enableLogin && roleCanSignIn && (
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-1">
                {t("temporaryPassword")} *
              </label>
              <input
                id="password"
                type="password"
                minLength={8}
                required
                value={form.password ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                className="w-full rounded-safe-sm border border-neutral-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30"
              />
              <p className="mt-1 text-xs text-neutral-500">
                {t("loginHint")}
              </p>
            </div>
          )}
        </div>
      )}

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-neutral-700 mb-1">
          {tc("phone")}
        </label>
        <input
          id="phone"
          type="tel"
          value={form.phone ?? ""}
          onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value || undefined }))}
          className="w-full rounded-safe-sm border border-neutral-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30"
        />
      </div>

      <div>
        <label htmlFor="address" className="block text-sm font-medium text-neutral-700 mb-1">
          {tc("address")}
        </label>
        <textarea
          id="address"
          rows={2}
          value={form.address ?? ""}
          onChange={(e) => setForm((p) => ({ ...p, address: e.target.value || undefined }))}
          className="w-full rounded-safe-sm border border-neutral-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="hireDate" className="block text-sm font-medium text-neutral-700 mb-1">
            {t("hireDate")} *
          </label>
          <input
            id="hireDate"
            type="date"
            required
            value={form.hireDate}
            onChange={(e) => setForm((p) => ({ ...p, hireDate: e.target.value }))}
            className="w-full rounded-safe-sm border border-neutral-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30"
          />
        </div>
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-neutral-700 mb-1">
            {tc("status")}
          </label>
          <select
            id="status"
            value={form.status}
            onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as EmployeeStatus }))}
            className="w-full rounded-safe-sm border border-neutral-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30"
          >
            <option value="active">{tc("active")}</option>
            <option value="inactive">{tc("inactive")}</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="role" className="block text-sm font-medium text-neutral-700 mb-1">
            {t("role")} *
          </label>
          <select
            id="role"
            required
            value={form.role}
            onChange={(e) => setForm((p) => ({ ...p, role: e.target.value as EmployeeRole }))}
            className="w-full rounded-safe-sm border border-neutral-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30"
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="jobTitle" className="block text-sm font-medium text-neutral-700 mb-1">
            {t("jobTitle")}
          </label>
          <input
            id="jobTitle"
            type="text"
            value={form.jobTitle ?? ""}
            onChange={(e) => setForm((p) => ({ ...p, jobTitle: e.target.value || undefined }))}
            className="w-full rounded-safe-sm border border-neutral-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="hourlyRate" className="block text-sm font-medium text-neutral-700 mb-1">
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
            className="w-full rounded-safe-sm border border-neutral-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30"
          />
        </div>
        {supervisorOptions.length > 0 && (
          <div>
            <label htmlFor="supervisorId" className="block text-sm font-medium text-neutral-700 mb-1">
              {t("supervisor")}
            </label>
            <select
              id="supervisorId"
              value={form.supervisorId ?? ""}
              onChange={(e) =>
                setForm((p) => ({ ...p, supervisorId: e.target.value || undefined }))
              }
              className="w-full rounded-safe-sm border border-neutral-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30"
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
        <label htmlFor="responsibilities" className="block text-sm font-medium text-neutral-700 mb-1">
          {t("responsibilities")}
        </label>
        <textarea
          id="responsibilities"
          rows={3}
          value={form.responsibilities ?? ""}
          onChange={(e) =>
            setForm((p) => ({ ...p, responsibilities: e.target.value || undefined }))
          }
          className="w-full rounded-safe-sm border border-neutral-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30"
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
