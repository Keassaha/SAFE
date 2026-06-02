import { describe, expect, it } from "vitest";
import {
  NOT_SENT_INVOICE_STATUSES,
  buildBillableTimeEntryWhere,
  buildUnsentBillableTimeEntryWhere,
  buildFacturableKpiRegistreTacheWhere,
  buildHonorairesRegistreTacheWhere,
} from "@/lib/billing/queries";

/**
 * Invariant clé du flow "prestation → facture brouillon → envoyée" :
 * une fois la facture émise (ISSUED, PAID, etc.), ses lignes sources
 * ne doivent plus apparaître comme facturables. Les requêtes utilisées
 * partout dans /facturation #facturables et l'API honoraires reposent
 * sur la constante `NOT_SENT_INVOICE_STATUSES`.
 *
 * Ces tests garantissent qu'aucune dérive ne réintroduise ISSUED dans
 * le panier facturable.
 */
describe("Sortie de Facturables — invariants de query", () => {
  it("NOT_SENT_INVOICE_STATUSES = exactement DRAFT + READY_TO_ISSUE", () => {
    expect([...NOT_SENT_INVOICE_STATUSES]).toEqual(["DRAFT", "READY_TO_ISSUE"]);
  });

  it("ne contient pas ISSUED, PAID, OVERDUE, CANCELLED, CREDITED", () => {
    const arr = [...NOT_SENT_INVOICE_STATUSES] as string[];
    expect(arr).not.toContain("ISSUED");
    expect(arr).not.toContain("PARTIALLY_PAID");
    expect(arr).not.toContain("PAID");
    expect(arr).not.toContain("OVERDUE");
    expect(arr).not.toContain("CANCELLED");
    expect(arr).not.toContain("CREDITED");
  });

  it("buildBillableTimeEntryWhere — invoiceId null + isWrittenOff false", () => {
    const where = buildBillableTimeEntryWhere("cab1") as Record<string, unknown>;
    expect(where.cabinetId).toBe("cab1");
    expect(where.facturable).toBe(true);
    expect(where.invoiceId).toBeNull();
    expect(where.invoiceLineId).toBeNull();
    expect(where.isWrittenOff).toBe(false);
  });

  it("buildBillableTimeEntryWhere — exige une description avant le panier facturable", () => {
    const where = buildBillableTimeEntryWhere("cab1");
    const json = JSON.stringify(where);
    expect(json).toContain('"description":{"not":null}');
    expect(json).toContain('"description":{"not":""}');
  });

  it("buildUnsentBillableTimeEntryWhere — autorise IN_DRAFT_INVOICE uniquement si invoice est DRAFT/READY_TO_ISSUE", () => {
    const where = buildUnsentBillableTimeEntryWhere("cab1");
    const json = JSON.stringify(where);

    // Les statuts non-envoyés sont présents
    expect(json).toContain("DRAFT");
    expect(json).toContain("READY_TO_ISSUE");

    // ISSUED n'apparaît jamais (la sous-chaîne "ISSUED" entre guillemets est exclue
    // — "READY_TO_ISSUE" se termine par E", pas par D")
    expect(json).not.toMatch(/"ISSUED"/);
    expect(json).not.toMatch(/"PAID"/);
    expect(json).not.toMatch(/"OVERDUE"/);
    expect(json).not.toMatch(/"CANCELLED"/);
  });

  it("buildUnsentBillableTimeEntryWhere — propage le cabinetId au top", () => {
    const where = buildUnsentBillableTimeEntryWhere("cab-xyz") as { cabinetId?: string };
    expect(where.cabinetId).toBe("cab-xyz");
  });
});

/**
 * RegistreTache — le `OR` métier "non envoyé" doit toujours s'appliquer,
 * même quand un `q` de recherche est fourni. Avant correction, le `OR` text
 * écrasait le `OR` métier (deux propriétés `OR` au même niveau dans l'objet
 * Prisma WhereInput → la dernière prend effet).
 *
 * On valide ici la structure AND-de-OR qui empêche cette dérive.
 */
describe("buildHonorairesRegistreTacheWhere — AND-de-OR garantit le filtre métier", () => {
  it("filtre métier (DRAFT/READY_TO_ISSUE) reste appliqué même avec q", () => {
    const where = buildHonorairesRegistreTacheWhere("cab1", { q: "Dupont" });
    const json = JSON.stringify(where);
    expect(json).toContain("DRAFT");
    expect(json).toContain("READY_TO_ISSUE");
    // Aucun statut envoyé n'est jamais autorisé
    expect(json).not.toMatch(/"ISSUED"/);
    expect(json).not.toMatch(/"PAID"/);
    // La structure expose bien un AND, pas un seul OR au top
    expect(where).toHaveProperty("AND");
    expect(Array.isArray(where.AND)).toBe(true);
    // Le terme de recherche est bien présent dans la structure
    expect(json).toContain("Dupont");
  });

  it("DRAFT/READY_TO_ISSUE (non envoyée) reste visible — la branche métier l'autorise", () => {
    const where = buildHonorairesRegistreTacheWhere("cab1", {});
    const json = JSON.stringify(where);
    // Les deux branches du OR métier sont là
    expect(json).toContain("DRAFT");
    expect(json).toContain("READY_TO_ISSUE");
    // statut "complete" + invoiceLineId null : tâches libres
    expect(json).toContain("complete");
  });

  it("clientId filter accepte direct OU dossier.clientId", () => {
    const where = buildHonorairesRegistreTacheWhere("cab1", { clientId: "cli42" });
    const json = JSON.stringify(where);
    // Les deux chemins sont présents
    expect(json).toContain('"clientId":"cli42"');
    expect(json).toContain('"dossier":{"clientId":"cli42"}');
  });

  it("sans clientId, n'ajoute pas de filtre client (le schéma garantit dossierId/dossier.clientId présents)", () => {
    const where = buildHonorairesRegistreTacheWhere("cab1", {});
    const json = JSON.stringify(where);
    // Aucun filtre `clientId not null` top-level ne doit exclure les tâches
    // dont `clientId` direct est null mais `dossier.clientId` est défini.
    expect(json).not.toMatch(/"clientId":\{"not":null\}/);
  });

  it("tâche ISSUED ne revient jamais — même avec un q de recherche", () => {
    const whereWithSearch = buildHonorairesRegistreTacheWhere("cab1", { q: "Fondation" });
    const json = JSON.stringify(whereWithSearch);
    expect(json).not.toMatch(/"ISSUED"/);
    expect(json).not.toMatch(/"PAID"/);
    // Même avec q, la branche métier non-envoyée reste appliquée
    expect(json).toContain("DRAFT");
    expect(json).toContain("READY_TO_ISSUE");
  });

  it("propage le cabinetId au top", () => {
    const where = buildHonorairesRegistreTacheWhere("cab-xyz", {}) as { cabinetId?: string };
    expect(where.cabinetId).toBe("cab-xyz");
  });
});

/**
 * Helper KPI : structure simple (un seul OR métier au top), pas de filtre
 * `clientId not null` qui exclurait les tâches reliées via dossier.
 */
describe("buildFacturableKpiRegistreTacheWhere — n'exclut plus les tâches via dossier", () => {
  it("ne contient pas de filtre `clientId not null` top-level", () => {
    const where = buildFacturableKpiRegistreTacheWhere("cab1");
    const json = JSON.stringify(where);
    expect(json).not.toMatch(/"clientId":\{"not":null\}/);
  });

  it("autorise les statuts non envoyés et exclut les statuts envoyés", () => {
    const where = buildFacturableKpiRegistreTacheWhere("cab1");
    const json = JSON.stringify(where);
    expect(json).toContain("DRAFT");
    expect(json).toContain("READY_TO_ISSUE");
    expect(json).not.toMatch(/"ISSUED"/);
    expect(json).not.toMatch(/"PAID"/);
  });
});
