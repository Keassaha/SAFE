import { describe, it, expect } from "vitest";
import {
  canManageInvoices,
  canViewBilling,
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

  it("canViewComptabilite : les 4 rôles du cabinet oui (décision CEO 2026-08-12) ; un rôle inconnu NON", () => {
    expect(ALL_ROLES.every((r) => canViewComptabilite(r))).toBe(true);
    // L'avocat y est entré le 2026-08-12 : son tableau de bord affiche déjà les
    // mêmes chiffres, le refus n'ouvrait qu'une porte de menu qui le renvoyait
    // au tableau de bord. L'écriture reste gardée ailleurs.
    expect(canViewComptabilite("avocat")).toBe(true);
    // La liste reste explicite : pas de blanc-seing pour un rôle futur.
    expect(canViewComptabilite("stagiaire" as UserRole)).toBe(false);
    expect(canViewComptabilite("lecture_seule" as UserRole)).toBe(false);
  });

  it("canViewBilling : les 4 rôles du cabinet lisent ; un rôle inconnu NON", () => {
    expect(ALL_ROLES.every((r) => canViewBilling(r))).toBe(true);
    // L'avocat lit le suivi, les débours et les paiements : son tableau de bord
    // les affiche déjà en chiffres, les liens ne rebondissent plus.
    expect(canViewBilling("avocat")).toBe(true);
    expect(canViewBilling("stagiaire" as UserRole)).toBe(false);
    expect(canViewBilling("lecture_seule" as UserRole)).toBe(false);
  });

  it("lire n'est pas facturer : l'avocat lit, il n'écrit pas", () => {
    expect(canManageInvoices("avocat")).toBe(false);
  });

  it("qui écrit peut lire : `canManageInvoices` reste inclus dans `canViewBilling`", () => {
    // Invariant de sécurité : un droit d'écriture sans droit de lecture
    // signalerait que les deux gardes ont divergé.
    for (const role of ALL_ROLES) {
      if (canManageInvoices(role)) expect(canViewBilling(role), role).toBe(true);
    }
  });

  it("canManageCabinetSettings : admin SEUL (garde portail Stripe + Console)", () => {
    expect(canManageCabinetSettings("admin_cabinet")).toBe(true);
    expect(canManageCabinetSettings("avocat")).toBe(false);
    expect(canManageCabinetSettings("assistante")).toBe(false);
    expect(canManageCabinetSettings("comptabilite")).toBe(false);
  });
});
