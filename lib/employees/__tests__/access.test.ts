import { describe, it, expect } from "vitest";
import { employeeRoleCanLogin, deriveEmployeeAccess } from "@/lib/employees/access";
import { employeeRoleToUserRole } from "@/lib/auth/rbac";
import type { EmployeeRole } from "@prisma/client";

const ALL_ROLES: EmployeeRole[] = [
  "ADMIN_ACCOUNTANT",
  "LEAD_LAWYER",
  "LAWYER",
  "LEGAL_ASSISTANT",
  "ACCOUNTING_TECHNICIAN",
  "INTERN",
  "READ_ONLY",
];

describe("Employee access — dédup du mapping (source unique = rbac.ts)", () => {
  it("employeeRoleCanLogin reflète exactement rbac.employeeRoleToUserRole pour tous les rôles", () => {
    for (const role of ALL_ROLES) {
      expect(employeeRoleCanLogin(role)).toBe(employeeRoleToUserRole(role) !== null);
    }
  });

  it("INTERN et READ_ONLY ne peuvent pas se connecter ; les autres oui", () => {
    expect(employeeRoleCanLogin("INTERN")).toBe(false);
    expect(employeeRoleCanLogin("READ_ONLY")).toBe(false);
    expect(employeeRoleCanLogin("ADMIN_ACCOUNTANT")).toBe(true);
    expect(employeeRoleCanLogin("LAWYER")).toBe(true);
  });
});

describe("Employee access — deriveEmployeeAccess (comportement inchangé)", () => {
  it("compte lié -> connected (quel que soit le statut)", () => {
    expect(deriveEmployeeAccess({ userId: "u1", status: "active", role: "LAWYER" })).toBe("connected");
    expect(deriveEmployeeAccess({ userId: "u1", status: "inactive", role: "LAWYER" })).toBe("connected");
  });

  it("inactif sans compte -> inactive", () => {
    expect(deriveEmployeeAccess({ userId: null, status: "inactive", role: "LAWYER" })).toBe("inactive");
  });

  it("actif, rôle connectable, sans compte -> pending", () => {
    expect(deriveEmployeeAccess({ userId: null, status: "active", role: "LEGAL_ASSISTANT" })).toBe("pending");
  });

  it("actif, rôle non connectable (stagiaire / lecture seule) -> no_access", () => {
    expect(deriveEmployeeAccess({ userId: null, status: "active", role: "INTERN" })).toBe("no_access");
    expect(deriveEmployeeAccess({ userId: null, status: "active", role: "READ_ONLY" })).toBe("no_access");
  });
});
