import { requireCabinetAndUser } from "@/lib/auth/session";
import { canCreateEmployees } from "@/lib/auth/permissions";
import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { routes } from "@/lib/routes";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { EmployeeForm } from "@/components/employees/EmployeeForm";
import { redirect } from "next/navigation";

export default async function NouveauEmployePage() {
  const { cabinetId, role } = await requireCabinetAndUser();
  if (!canCreateEmployees(role as UserRole)) {
    redirect(routes.employees);
  }

  const supervisors = await prisma.employee.findMany({
    where: { cabinetId, status: "active" },
    select: { id: true, fullName: true },
    orderBy: { fullName: "asc" },
  });

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Nouvel employé"
        description="Ajoutez un employé au cabinet."
        backHref={routes.employees}
        backLabel="Retour à la liste"
      />
      <Card>
        <CardHeader title="Informations de l'employé" />
        <CardContent>
          <EmployeeForm
            mode="create"
            initialData={{
              firstName: "",
              lastName: "",
              email: "",
              hireDate: today,
              status: "active",
              role: "LAWYER",
              hourlyRate: 0,
            }}
            supervisorOptions={supervisors}
          />
        </CardContent>
      </Card>
    </div>
  );
}
