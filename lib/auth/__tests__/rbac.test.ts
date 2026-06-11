import { describe, it, expect } from "vitest";
import {
  can,
  getEffectiveRole,
  userRoleToEmployeeRole,
  employeeRoleToUserRole,
  canEmployeeRoleSignIn,
  ROLE_MODULE_PERMISSIONS,
  RBAC_MODULES,
  RBAC_ACTIONS,
} from "@/lib/auth/rbac";
import type { EmployeeRole, UserRole } from "@prisma/client";

const ALL_EMPLOYEE_ROLES: EmployeeRole[] = [
  "ADMIN_ACCOUNTANT",
  "LEAD_LAWYER",
  "LAWYER",
  "LEGAL_ASSISTANT",
  "ACCOUNTING_TECHNICIAN",
  "INTERN",
  "READ_ONLY",
];

describe("RBAC — matrice bien formée", () => {
  it("chaque rôle couvre tous les modules (aucune permission indéfinie)", () => {
    for (const role of ALL_EMPLOYEE_ROLES) {
      for (const module of RBAC_MODULES) {
        expect(ROLE_MODULE_PERMISSIONS[role][module]).toBeDefined();
      }
    }
  });
});

describe("RBAC — accès complet admin / avocat principal", () => {
  it("ADMIN_ACCOUNTANT et LEAD_LAWYER peuvent tout faire sur tous les modules", () => {
    for (const role of ["ADMIN_ACCOUNTANT", "LEAD_LAWYER"] as EmployeeRole[]) {
      for (const module of RBAC_MODULES) {
        for (const action of RBAC_ACTIONS) {
          expect(can(role, module, action)).toBe(true);
        }
      }
    }
  });
});

describe("RBAC — correctif P3 : la comptabilité n'a aucun accès aux employés", () => {
  it("ACCOUNTING_TECHNICIAN ne peut ni voir ni créer ni modifier ni supprimer des employés", () => {
    for (const action of RBAC_ACTIONS) {
      expect(can("ACCOUNTING_TECHNICIAN", "employees", action)).toBe(false);
    }
  });

  it("mais conserve ses accès comptables (facturation, paiements, journal, dépenses)", () => {
    expect(can("ACCOUNTING_TECHNICIAN", "billing", "approve")).toBe(true);
    expect(can("ACCOUNTING_TECHNICIAN", "payments", "edit")).toBe(true);
    expect(can("ACCOUNTING_TECHNICIAN", "journal", "edit")).toBe(true);
    expect(can("ACCOUNTING_TECHNICIAN", "expenses", "edit")).toBe(true);
  });

  it("effet vivant : seul l'admin édite les employés (avocat et comptabilité : non)", () => {
    // Reproduit la chaîne des helpers canEditEmployees (getEffectiveRole sans Employee).
    const editEmployees = (ur: UserRole) =>
      can(getEffectiveRole({ role: ur }), "employees", "edit");
    expect(editEmployees("admin_cabinet")).toBe(true);
    expect(editEmployees("avocat")).toBe(false);
    expect(editEmployees("comptabilite")).toBe(false); // <- le trou refermé
    expect(editEmployees("assistante")).toBe(false);
  });
});

describe("RBAC — droits par rôle (verrou de comportement)", () => {
  it("LAWYER : dossiers create oui, paramètres non, employés vue seule", () => {
    expect(can("LAWYER", "dossiers", "create")).toBe(true);
    expect(can("LAWYER", "settings", "view")).toBe(false);
    expect(can("LAWYER", "employees", "view")).toBe(true);
    expect(can("LAWYER", "employees", "edit")).toBe(false);
  });

  it("LEGAL_ASSISTANT : clients delete oui, paiements non, paramètres non", () => {
    expect(can("LEGAL_ASSISTANT", "clients", "delete")).toBe(true);
    expect(can("LEGAL_ASSISTANT", "payments", "view")).toBe(false);
    expect(can("LEGAL_ASSISTANT", "settings", "view")).toBe(false);
  });

  it("INTERN : tableau de bord et dossiers en lecture, facturation aucune", () => {
    expect(can("INTERN", "dashboard", "view")).toBe(true);
    expect(can("INTERN", "time_tracking", "create")).toBe(true);
    expect(can("INTERN", "billing", "view")).toBe(false);
  });

  it("READ_ONLY : tout en lecture, rien en écriture, export des rapports", () => {
    for (const module of RBAC_MODULES) {
      expect(can("READ_ONLY", module, "view")).toBe(true);
      expect(can("READ_ONLY", module, "create")).toBe(false);
      expect(can("READ_ONLY", module, "edit")).toBe(false);
      expect(can("READ_ONLY", module, "delete")).toBe(false);
    }
    expect(can("READ_ONLY", "reports", "export")).toBe(true);
  });
});

describe("RBAC — rôle effectif et mappings", () => {
  it("getEffectiveRole : Employee.role prime sur le mapping UserRole", () => {
    expect(getEffectiveRole({ role: "avocat" }, { role: "READ_ONLY" })).toBe("READ_ONLY");
    expect(getEffectiveRole({ role: "avocat" })).toBe("LAWYER");
  });

  it("userRoleToEmployeeRole : 4 rôles portail mappés", () => {
    expect(userRoleToEmployeeRole("admin_cabinet")).toBe("ADMIN_ACCOUNTANT");
    expect(userRoleToEmployeeRole("avocat")).toBe("LAWYER");
    expect(userRoleToEmployeeRole("assistante")).toBe("LEGAL_ASSISTANT");
    expect(userRoleToEmployeeRole("comptabilite")).toBe("ACCOUNTING_TECHNICIAN");
  });

  it("employeeRoleToUserRole : INTERN et READ_ONLY n'ont aucun équivalent portail", () => {
    expect(employeeRoleToUserRole("ADMIN_ACCOUNTANT")).toBe("admin_cabinet");
    expect(employeeRoleToUserRole("LEAD_LAWYER")).toBe("avocat");
    expect(employeeRoleToUserRole("LAWYER")).toBe("avocat");
    expect(employeeRoleToUserRole("LEGAL_ASSISTANT")).toBe("assistante");
    expect(employeeRoleToUserRole("ACCOUNTING_TECHNICIAN")).toBe("comptabilite");
    expect(employeeRoleToUserRole("INTERN")).toBeNull();
    expect(employeeRoleToUserRole("READ_ONLY")).toBeNull();
  });

  it("canEmployeeRoleSignIn : stagiaire / lecture seule non connectables", () => {
    expect(canEmployeeRoleSignIn("INTERN")).toBe(false);
    expect(canEmployeeRoleSignIn("READ_ONLY")).toBe(false);
    expect(canEmployeeRoleSignIn("LAWYER")).toBe(true);
    expect(canEmployeeRoleSignIn("ADMIN_ACCOUNTANT")).toBe(true);
  });
});
