"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { EmployeeRole, EmployeeStatus } from "@prisma/client";
import { EmployeeForm } from "./EmployeeForm";
import type { EmployeeFormData } from "./EmployeeForm";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Pencil } from "lucide-react";

interface EmployeeInfoTabProps {
  employee: {
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
  };
  canEdit: boolean;
  supervisorOptions: { id: string; fullName: string }[];
}

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat("fr-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(d));
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
  }).format(value);
}

export function EmployeeInfoTab({
  employee,
  canEdit,
  supervisorOptions,
}: EmployeeInfoTabProps) {
  const t = useTranslations("employees");
  const tc = useTranslations("common");
  const [editing, setEditing] = useState(false);

  const formData: EmployeeFormData = {
    firstName: employee.firstName,
    lastName: employee.lastName,
    email: employee.email,
    phone: employee.phone ?? undefined,
    address: employee.address ?? undefined,
    hireDate: new Date(employee.hireDate).toISOString().slice(0, 10),
    status: employee.status,
    role: employee.role,
    jobTitle: employee.jobTitle ?? undefined,
    hourlyRate: employee.hourlyRate,
    supervisorId: employee.supervisorId ?? undefined,
    responsibilities: employee.responsibilities ?? undefined,
  };

  if (editing && canEdit) {
    return (
      <Card>
        <CardHeader
          title={t("editInfo")}
          action={
            <Button variant="secondary" type="button" onClick={() => setEditing(false)}>
              {tc("cancel")}
            </Button>
          }
        />
        <CardContent>
          <EmployeeForm
            mode="edit"
            employeeId={employee.id}
            initialData={formData}
            supervisorOptions={supervisorOptions}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title={t("information")}
        action={
          canEdit && (
            <Button type="button" onClick={() => setEditing(true)}>
              <Pencil className="w-4 h-4 mr-2 inline-block" aria-hidden />
              {tc("edit")}
            </Button>
          )
        }
      />
      <CardContent className="space-y-6">
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <dt className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
              {t("fullName")}
            </dt>
            <dd className="mt-1 text-sm font-medium">{employee.fullName}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-neutral-500 uppercase tracking-wider">{tc("email")}</dt>
            <dd className="mt-1 text-sm">{employee.email}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
              {tc("phone")}
            </dt>
            <dd className="mt-1 text-sm">{employee.phone ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
              {t("hireDate")}
            </dt>
            <dd className="mt-1 text-sm">{formatDate(employee.hireDate)}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-neutral-500 uppercase tracking-wider">{tc("status")}</dt>
            <dd className="mt-1 text-sm">
              {employee.status === "active" ? tc("active") : tc("inactive")}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
              {t("jobTitle")}
            </dt>
            <dd className="mt-1 text-sm">{employee.jobTitle ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
              {t("hourlyRate")}
            </dt>
            <dd className="mt-1 text-sm">{formatCurrency(employee.hourlyRate)}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
              {t("supervisor")}
            </dt>
            <dd className="mt-1 text-sm">
              {employee.supervisor?.fullName ?? "—"}
            </dd>
          </div>
        </dl>
        {employee.address && (
          <div>
            <dt className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
              {tc("address")}
            </dt>
            <dd className="mt-1 text-sm whitespace-pre-wrap">{employee.address}</dd>
          </div>
        )}
        {employee.responsibilities && (
          <div>
            <dt className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
              {t("responsibilities")}
            </dt>
            <dd className="mt-1 text-sm whitespace-pre-wrap">{employee.responsibilities}</dd>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
