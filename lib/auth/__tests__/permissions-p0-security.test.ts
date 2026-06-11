import { describe, it, expect } from "vitest";
import {
  canViewReports,
  canViewComptabilite,
  canManageCabinetSettings,
} from "@/lib/auth/permissions";
import type { UserRole } from "@prisma/client";

const ALL_ROLES: UserRole[] = ["admin_cabinet", "avocat", "assistante", "comptabilite"];

describe("P0 sécurité — gardes financières et de gestion", () => {
  it("canViewReports : les 4 rôles du cabinet oui ; un rôle inconnu NON (plus de blanc-seing)", () => {
    expect(ALL_ROLES.every((r) => canViewReports(r))).toBe(true);
    // Plus de `return true` aveugle : un rôle hors des 4 (futur stagiaire / lecture seule) est refusé.
    expect(canViewReports("stagiaire" as UserRole)).toBe(false);
    expect(canViewReports("lecture_seule" as UserRole)).toBe(false);
  });

  it("canViewComptabilite : admin, comptabilité, assistante oui ; avocat NON (cohérent avec la nav)", () => {
    expect(canViewComptabilite("admin_cabinet")).toBe(true);
    expect(canViewComptabilite("comptabilite")).toBe(true);
    expect(canViewComptabilite("assistante")).toBe(true);
    expect(canViewComptabilite("avocat")).toBe(false);
  });

  it("canManageCabinetSettings : admin SEUL (garde portail Stripe + Console)", () => {
    expect(canManageCabinetSettings("admin_cabinet")).toBe(true);
    expect(canManageCabinetSettings("avocat")).toBe(false);
    expect(canManageCabinetSettings("assistante")).toBe(false);
    expect(canManageCabinetSettings("comptabilite")).toBe(false);
  });
});
