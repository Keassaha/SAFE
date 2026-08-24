import { describe, it, expect } from "vitest";
import type { UserRole } from "@prisma/client";
import { refusSiRoleInsuffisant } from "../api-guard";
import {
  canViewDossiers,
  canManageDossiers,
  canViewBilling,
  canManageInvoices,
  canViewBillingTrust,
} from "../permissions";

const laisse = (role: string | null | undefined, p: (r: UserRole) => boolean) =>
  refusSiRoleInsuffisant(role, p) === null;

describe("garde de rôle des routes d'API", () => {
  it("laisse passer un rôle qui porte la permission", () => {
    expect(laisse("admin_cabinet", canViewDossiers)).toBe(true);
    expect(laisse("assistante", canManageDossiers)).toBe(true);
  });

  it("refuse par 403, pas par 401 : la session est valide, c'est le rôle qui ne l'est pas", () => {
    const refus = refusSiRoleInsuffisant("comptabilite", canManageDossiers);
    expect(refus?.status).toBe(403);
  });

  /* `requireCabinetAndUser` retombe sur « avocat » quand la session ne porte
     pas de rôle. Acceptable pour une page qui affiche moins, inacceptable pour
     une garde : une session incomplète n'hérite d'aucun droit. */
  it("refuse un rôle absent au lieu de lui en supposer un", () => {
    expect(laisse(null, canViewDossiers)).toBe(false);
    expect(laisse(undefined, canViewDossiers)).toBe(false);
    expect(laisse("", canViewDossiers)).toBe(false);
  });

  it("refuse un rôle inconnu, aujourd'hui comme demain", () => {
    expect(laisse("stagiaire", canViewDossiers)).toBe(false);
    expect(laisse("admin", canViewDossiers)).toBe(false);
  });

  /* Les deux seuls rôles présents en production le 2026-08-24. Une garde qui
     les refuserait fermerait l'application à des gens qui travaillent : c'est
     le risque principal de ce correctif, il est donc testé et non supposé. */
  it("n'enferme aucun des deux rôles réellement en service", () => {
    for (const role of ["admin_cabinet", "assistante"]) {
      for (const p of [canViewDossiers, canManageDossiers, canViewBilling, canManageInvoices]) {
        expect(laisse(role, p)).toBe(true);
      }
    }
  });

  /* Rappel écrit : `canViewBillingTrust` exclut l'assistante. L'employer sur
     une route de facturation ordinaire fermerait la porte à deux personnes chez
     Derisier Law. */
  it("documente pourquoi canViewBillingTrust ne convient pas aux routes de facturation", () => {
    expect(laisse("assistante", canViewBillingTrust)).toBe(false);
    expect(laisse("assistante", canViewBilling)).toBe(true);
  });
});
