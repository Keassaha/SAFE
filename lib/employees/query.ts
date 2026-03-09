import type { Prisma } from "@prisma/client";

export const EMPLOYEE_LIST_PAGE_SIZE = 20;

export function buildEmployeeListWhere(
  cabinetId: string,
  filters: {
    q?: string | null;
    status?: string | null;
    role?: string | null;
  }
): Prisma.EmployeeWhereInput {
  const { q, status, role } = filters;
  const where: Prisma.EmployeeWhereInput = { cabinetId };

  if (q?.trim()) {
    const term = q.trim();
    where.OR = [
      { fullName: { contains: term } },
      { firstName: { contains: term } },
      { lastName: { contains: term } },
      { email: { contains: term } },
      { jobTitle: { contains: term } },
    ];
  }

  if (status && ["active", "inactive"].includes(status)) {
    where.status = status as "active" | "inactive";
  }

  if (role?.trim()) {
    where.role = role.trim() as Prisma.EnumEmployeeRoleFilter["equals"];
  }

  return where;
}

export type EmployeeSortField =
  | "fullName"
  | "email"
  | "role"
  | "status"
  | "hireDate"
  | "hourlyRate"
  | "updatedAt";

export type EmployeeSortOrder = "asc" | "desc";

export function getEmployeeListOrderBy(
  sortBy: EmployeeSortField,
  sortOrder: EmployeeSortOrder
): Prisma.EmployeeOrderByWithRelationInput[] {
  return [{ [sortBy]: sortOrder }];
}
