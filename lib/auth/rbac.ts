import type { EmployeeRole, UserRole } from "@prisma/client";

export type RBACModule =
  | "dashboard"
  | "clients"
  | "dossiers"
  | "time_tracking"
  | "billing"
  | "payments"
  | "trust_accounting"
  | "expenses"
  | "journal"
  | "reports"
  | "employees"
  | "settings";

export type RBACAction = "view" | "create" | "edit" | "delete" | "approve" | "export";

const ALL_ACTIONS: RBACAction[] = ["view", "create", "edit", "delete", "approve", "export"];
const VIEW_ONLY: RBACAction[] = ["view"];
const VIEW_EXPORT: RBACAction[] = ["view", "export"];
const VIEW_CREATE_EDIT: RBACAction[] = ["view", "create", "edit"];
const VIEW_CREATE_EDIT_DELETE: RBACAction[] = ["view", "create", "edit", "delete"];
const BILLING_ACTIONS: RBACAction[] = ["view", "create", "edit", "approve", "export"];

/** Build a module map with given actions for each listed module. */
function modulesWith(
  actions: RBACAction[],
  ...moduleNames: RBACModule[]
): Partial<Record<RBACModule, RBACAction[]>> {
  const out: Partial<Record<RBACModule, RBACAction[]>> = {};
  for (const m of moduleNames) {
    out[m] = actions;
  }
  return out;
}

/** Full access to all modules. */
const FULL_ACCESS: Record<RBACModule, RBACAction[]> = {
  dashboard: ALL_ACTIONS,
  clients: ALL_ACTIONS,
  dossiers: ALL_ACTIONS,
  time_tracking: ALL_ACTIONS,
  billing: ALL_ACTIONS,
  payments: ALL_ACTIONS,
  trust_accounting: ALL_ACTIONS,
  expenses: ALL_ACTIONS,
  journal: ALL_ACTIONS,
  reports: ALL_ACTIONS,
  employees: ALL_ACTIONS,
  settings: ALL_ACTIONS,
};

export const RBAC_MODULES: RBACModule[] = [
  "dashboard",
  "clients",
  "dossiers",
  "time_tracking",
  "billing",
  "payments",
  "trust_accounting",
  "expenses",
  "journal",
  "reports",
  "employees",
  "settings",
];

export const RBAC_ACTIONS: RBACAction[] = ["view", "create", "edit", "delete", "approve", "export"];

/** Role → Module → Actions allowed. */
export const ROLE_MODULE_PERMISSIONS: Record<EmployeeRole, Record<RBACModule, RBACAction[]>> = {
  ADMIN_ACCOUNTANT: FULL_ACCESS,
  LEAD_LAWYER: FULL_ACCESS,

  LAWYER: {
    ...modulesWith(VIEW_ONLY, "dashboard", "clients", "reports"),
    ...modulesWith(["view", "create", "edit"], "dossiers", "time_tracking"),
    ...modulesWith(VIEW_EXPORT, "billing"),
    ...modulesWith(VIEW_ONLY, "payments", "trust_accounting", "expenses", "journal"),
    employees: VIEW_ONLY,
    settings: [],
  } as Record<RBACModule, RBACAction[]>,

  LEGAL_ASSISTANT: {
    ...modulesWith(VIEW_CREATE_EDIT_DELETE, "dashboard", "clients", "dossiers"),
    ...modulesWith(VIEW_ONLY, "time_tracking"),
    ...modulesWith(["view", "create", "edit"], "billing"),
    payments: [],
    trust_accounting: [],
    expenses: VIEW_ONLY,
    journal: [],
    reports: VIEW_EXPORT,
    employees: [],
    settings: [],
  } as Record<RBACModule, RBACAction[]>,

  ACCOUNTING_TECHNICIAN: {
    ...modulesWith(VIEW_ONLY, "dashboard", "clients", "dossiers"),
    ...modulesWith(VIEW_ONLY, "time_tracking"),
    ...modulesWith(BILLING_ACTIONS, "billing"),
    ...modulesWith(VIEW_CREATE_EDIT, "payments"),
    ...modulesWith(VIEW_ONLY, "trust_accounting"),
    ...modulesWith(VIEW_CREATE_EDIT, "expenses", "journal"),
    ...modulesWith(VIEW_EXPORT, "reports"),
    ...modulesWith(VIEW_CREATE_EDIT, "employees"),
    settings: VIEW_ONLY,
  } as Record<RBACModule, RBACAction[]>,

  INTERN: {
    ...modulesWith(VIEW_ONLY, "dashboard", "dossiers"),
    clients: VIEW_ONLY,
    time_tracking: ["view", "create"],
    billing: [],
    payments: [],
    trust_accounting: [],
    expenses: [],
    journal: [],
    reports: [],
    employees: [],
    settings: [],
  } as Record<RBACModule, RBACAction[]>,

  READ_ONLY: {
    dashboard: VIEW_ONLY,
    clients: VIEW_ONLY,
    dossiers: VIEW_ONLY,
    time_tracking: VIEW_ONLY,
    billing: VIEW_ONLY,
    payments: VIEW_ONLY,
    trust_accounting: VIEW_ONLY,
    expenses: VIEW_ONLY,
    journal: VIEW_ONLY,
    reports: VIEW_EXPORT,
    employees: VIEW_ONLY,
    settings: VIEW_ONLY,
  },
};

/**
 * Returns true if the role is allowed to perform the action on the module.
 */
export function can(
  role: EmployeeRole,
  module: RBACModule,
  action: RBACAction
): boolean {
  const actions = ROLE_MODULE_PERMISSIONS[role]?.[module] ?? [];
  return actions.includes(action);
}

/**
 * Maps legacy UserRole to EmployeeRole for users without an Employee record.
 */
export function userRoleToEmployeeRole(userRole: UserRole): EmployeeRole {
  const map: Record<UserRole, EmployeeRole> = {
    admin_cabinet: "ADMIN_ACCOUNTANT",
    avocat: "LAWYER",
    assistante: "LEGAL_ASSISTANT",
    comptabilite: "ACCOUNTING_TECHNICIAN",
  };
  return map[userRole] ?? "READ_ONLY";
}

/**
 * Returns the effective role for permission checks: Employee.role if present, else mapped User.role.
 */
export function getEffectiveRole(
  user: { role: UserRole },
  employee?: { role: EmployeeRole } | null
): EmployeeRole {
  if (employee?.role) return employee.role;
  return userRoleToEmployeeRole(user.role);
}

/**
 * Maps employee roles to legacy auth roles used across the existing app.
 * Returns null for roles that do not yet have a safe legacy equivalent.
 */
export function employeeRoleToUserRole(role: EmployeeRole): UserRole | null {
  const map: Partial<Record<EmployeeRole, UserRole>> = {
    ADMIN_ACCOUNTANT: "admin_cabinet",
    LEAD_LAWYER: "avocat",
    LAWYER: "avocat",
    LEGAL_ASSISTANT: "assistante",
    ACCOUNTING_TECHNICIAN: "comptabilite",
  };
  return map[role] ?? null;
}

export function canEmployeeRoleSignIn(role: EmployeeRole): boolean {
  return employeeRoleToUserRole(role) !== null;
}

export const EMPLOYEE_ROLE_LABELS: Record<EmployeeRole, string> = {
  ADMIN_ACCOUNTANT: "Admin / Comptable",
  LEAD_LAWYER: "Avocat principal",
  LAWYER: "Avocat",
  LEGAL_ASSISTANT: "Assistante juridique / Secrétaire",
  ACCOUNTING_TECHNICIAN: "Technicien comptable",
  INTERN: "Stagiaire",
  READ_ONLY: "Lecture seule",
};
