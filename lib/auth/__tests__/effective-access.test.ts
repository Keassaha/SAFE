import { describe, expect, it } from "vitest";
import type { EmployeeRole, UserRole } from "@prisma/client";
import { getEffectiveAccess, getEmployeeAccessSummary } from "../effective-access";
import { canEditBillingTrust, canViewBillingTrust } from "../permissions";

/**
 * Accès réellement appliqué.
 *
 * Ce que ces tests protègent : l'onglet « Accès et rôle » affichait une grille de
 * permissions tirée d'une matrice que RIEN n'applique. `can()` de `rbac.ts` n'est
 * appelée nulle part.
 *
 * Deux mensonges vérifiables en découlaient :
 *   - un stagiaire, qui ne peut pas se connecter du tout, se voyait attribuer des
 *     permissions à l'écran ;
 *   - « Avocat responsable » et « Avocat » affichaient deux grilles différentes pour
 *     un accès identique.
 */

const AVOCAT = "avocat" as UserRole;
const ADMIN = "admin_cabinet" as UserRole;
const ASSISTANTE = "assistante" as UserRole;
const COMPTA = "comptabilite" as UserRole;

const r = (v: string) => v as EmployeeRole;

describe("La grille vient de la garde, pas d'une copie", () => {
  it("chaque ligne concorde avec la fonction qui bloque vraiment", () => {
    // C'est la propriété centrale : si quelqu'un durcit `canEditBillingTrust`,
    // l'écran change le jour même. Aucune valeur n'est recopiée.
    for (const role of [ADMIN, AVOCAT, ASSISTANTE, COMPTA]) {
      const fid = getEffectiveAccess(role).find((m) => m.module === "fideicommis")!;
      expect(fid.view, role).toBe(canViewBillingTrust(role));
      expect(fid.edit, role).toBe(canEditBillingTrust(role));
    }
  });

  it("couvre les modules qui comptent", () => {
    const modules = getEffectiveAccess(AVOCAT).map((m) => m.module);
    for (const m of ["clients", "dossiers", "fideicommis", "facturation", "audit"]) {
      expect(modules).toContain(m);
    }
  });

  it("ne promet jamais de modifier sans pouvoir consulter", () => {
    // Une ligne « modifier oui, voir non » serait incoherente et signalerait que la
    // derivation a ete mal branchee.
    for (const role of [ADMIN, AVOCAT, ASSISTANTE, COMPTA]) {
      for (const m of getEffectiveAccess(role)) {
        if (m.edit) expect(m.view, `${role} / ${m.module}`).toBe(true);
      }
    }
  });
});

describe("Rôles RH sans accès", () => {
  it("un stagiaire ne peut pas se connecter, et AUCUNE permission ne s'affiche", () => {
    const s = getEmployeeAccessSummary(r("INTERN"));
    expect(s.canSignIn).toBe(false);
    expect(s.portalRole).toBeNull();
    expect(s.modules).toEqual([]);
  });

  it("le dit en clair plutôt que d'afficher une grille vide", () => {
    const s = getEmployeeAccessSummary(r("READ_ONLY"));
    expect(s.messageFr).toContain("ne peut pas se connecter");
  });
});

describe("Rôles RH qui donnent le même accès", () => {
  it("« Avocat responsable » et « Avocat » ont un accès IDENTIQUE", () => {
    const lead = getEmployeeAccessSummary(r("LEAD_LAWYER"));
    const avocat = getEmployeeAccessSummary(r("LAWYER"));
    expect(lead.portalRole).toBe(avocat.portalRole);
    expect(lead.modules).toEqual(avocat.modules);
  });

  it("le NOMME, au lieu de laisser croire à une différence", () => {
    // C'est l'information qui manquait le plus : un administrateur qui hésite entre
    // les deux doit savoir que le choix ne change rien aux droits.
    const lead = getEmployeeAccessSummary(r("LEAD_LAWYER"));
    expect(lead.sameAccessAs).toContain("LAWYER");
    expect(lead.messageFr).toContain("Accès identique");
  });

  it("un rôle unique ne prétend pas partager son accès", () => {
    const admin = getEmployeeAccessSummary(r("ADMIN_ACCOUNTANT"));
    expect(admin.sameAccessAs).toEqual([]);
    expect(admin.messageFr).toContain("son propre niveau");
  });
});

describe("Ce que chaque rôle obtient réellement", () => {
  it("l'admin est le seul à gérer les utilisateurs", () => {
    const gere = (role: UserRole) =>
      getEffectiveAccess(role).find((m) => m.module === "employes")!.edit;
    expect(gere(ADMIN)).toBe(true);
    expect(gere(AVOCAT)).toBe(false);
    expect(gere(ASSISTANTE)).toBe(false);
    expect(gere(COMPTA)).toBe(false);
  });

  it("signale qui peut toucher à l'argent des clients", () => {
    const fid = getEffectiveAccess(ADMIN).find((m) => m.module === "fideicommis")!;
    expect(fid.edit).toBe(true);
    expect(fid.noteFr).toContain("argent des clients");
  });

  it("n'ajoute pas de note quand il n'y a rien à dire", () => {
    // Une note de remplissage sur chaque ligne les rendrait toutes invisibles.
    const sansNote = getEffectiveAccess(ASSISTANTE).filter((m) => !m.noteFr);
    expect(sansNote.length).toBeGreaterThan(0);
  });
});
