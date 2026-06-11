import { describe, it, expect } from "vitest";
import { computeJournalKpis, type KpiEntry, type KpiPeriod } from "../kpi";

/**
 * Tests métier des indicateurs du journal. Vérifient la SÉPARATION DES FLUX :
 *  - une FACTURE augmente « Facturé » mais JAMAIS le solde opérationnel (cash) ;
 *  - un PAIEMENT augmente « Encaissé » ET le solde opérationnel ;
 *  - facture + paiement ne se double-comptent pas dans le cash ;
 *  - dépenses/débours réduisent le solde opérationnel ;
 *  - un dépôt en fidéicommis n'affecte QUE le solde fidéicommis ;
 *  - une écriture antidatée est classée par DATE, jamais par le solde stocké.
 */

const PERIOD: KpiPeriod = {
  from: new Date("2026-06-01T00:00:00"),
  to: new Date("2026-06-30T23:59:59"),
  prevFrom: new Date("2026-05-01T00:00:00"),
  prevTo: new Date("2026-05-31T23:59:59"),
};
const IN_MONTH = new Date("2026-06-15T12:00:00");

function mk(
  typeTransaction: KpiEntry["typeTransaction"],
  montantEntree: number,
  montantSortie: number,
  dateTransaction: Date = IN_MONTH,
  sourceModule: KpiEntry["sourceModule"] = "AJUSTEMENT_MANUEL",
): KpiEntry {
  return { typeTransaction, sourceModule, montantEntree, montantSortie, dateTransaction };
}

describe("computeJournalKpis — séparation des flux", () => {
  it("facture seule : augmente Facturé, PAS le solde opérationnel ni l'encaissé", () => {
    const k = computeJournalKpis([mk("FACTURE", 1000, 0)], 0, PERIOD);
    expect(k.totalFacture).toBe(1000);
    expect(k.soldeOperationnelEstime).toBe(0);
    expect(k.totalEncaisse).toBe(0);
  });

  it("paiement seul : augmente Encaissé ET le solde opérationnel", () => {
    const k = computeJournalKpis([mk("PAIEMENT", 800, 0)], 0, PERIOD);
    expect(k.totalEncaisse).toBe(800);
    expect(k.soldeOperationnelEstime).toBe(800);
    expect(k.totalFacture).toBe(0);
  });

  it("facture + paiement du même montant : pas de double comptage dans le cash", () => {
    const k = computeJournalKpis(
      [mk("FACTURE", 1000, 0), mk("PAIEMENT", 1000, 0)],
      0,
      PERIOD,
    );
    expect(k.totalFacture).toBe(1000);
    expect(k.totalEncaisse).toBe(1000);
    // Le solde opérationnel = SEULEMENT le paiement (cash), pas 2000.
    expect(k.soldeOperationnelEstime).toBe(1000);
  });

  it("dépense : réduit le solde opérationnel", () => {
    const k = computeJournalKpis(
      [mk("PAIEMENT", 1000, 0), mk("DEPENSE", 0, 300)],
      0,
      PERIOD,
    );
    expect(k.totalDepenses).toBe(300);
    expect(k.soldeOperationnelEstime).toBe(700);
  });

  it("débours payé par le cabinet : réduit le solde opérationnel et reste compté en dépenses", () => {
    const k = computeJournalKpis([mk("DEBOURS", 0, 150)], 0, PERIOD);
    expect(k.totalDepenses).toBe(150);
    expect(k.soldeOperationnelEstime).toBe(-150);
  });

  it("dépôt en fidéicommis : augmente le solde fidéicommis SEULEMENT, jamais l'opérationnel", () => {
    const k = computeJournalKpis([mk("DEPOT_FIDEICOMMIS", 3000, 0)], 0, PERIOD);
    expect(k.soldeFideicommis).toBe(3000);
    expect(k.soldeOperationnelEstime).toBe(0);
  });

  it("retrait en fidéicommis : réduit le solde fidéicommis seulement", () => {
    const k = computeJournalKpis(
      [mk("DEPOT_FIDEICOMMIS", 3000, 0), mk("RETRAIT_FIDEICOMMIS", 0, 500)],
      0,
      PERIOD,
    );
    expect(k.soldeFideicommis).toBe(2500);
    expect(k.soldeOperationnelEstime).toBe(0);
  });

  it("ajustements et corrections cash affectent le solde opérationnel", () => {
    const k = computeJournalKpis(
      [mk("AJUSTEMENT", 50, 0), mk("CORRECTION", 0, 20, IN_MONTH, "CORRECTION_SYSTEME")],
      0,
      PERIOD,
    );
    expect(k.soldeOperationnelEstime).toBe(30);
    expect(k.soldeFideicommis).toBe(0);
  });

  it("CORRECTION de fidéicommis (sourceModule FIDEICOMMIS) : ajuste le fidéicommis, JAMAIS l'opérationnel", () => {
    // Régression R1 : une correction d'argent client ne doit pas fuiter dans le cash du cabinet.
    const k = computeJournalKpis(
      [mk("CORRECTION", 200, 0, IN_MONTH, "FIDEICOMMIS")],
      0,
      PERIOD,
    );
    expect(k.soldeFideicommis).toBe(200);
    expect(k.soldeOperationnelEstime).toBe(0);
  });

  it("CORRECTION cash (CORRECTION_SYSTEME) et CORRECTION manuelle (AJUSTEMENT_MANUEL) restent opérationnelles", () => {
    const k = computeJournalKpis(
      [
        mk("CORRECTION", 0, 80, IN_MONTH, "CORRECTION_SYSTEME"), // correction de dépense
        mk("CORRECTION", 30, 0, IN_MONTH, "AJUSTEMENT_MANUEL"), // ajustement manuel documenté
      ],
      0,
      PERIOD,
    );
    expect(k.soldeOperationnelEstime).toBe(-50); // 30 − 80
    expect(k.soldeFideicommis).toBe(0);
  });

  it("comptes à recevoir : repris depuis le module facturation (balanceDue), pas du journal", () => {
    const k = computeJournalKpis([], 1250.5, PERIOD);
    expect(k.comptesARecevoir).toBe(1250.5);
  });

  it("scénario mixte : le fidéicommis n'est jamais agrégé au solde opérationnel", () => {
    const k = computeJournalKpis(
      [
        mk("FACTURE", 1000, 0),
        mk("PAIEMENT", 1000, 0),
        mk("DEPOT_FIDEICOMMIS", 5000, 0),
        mk("DEPENSE", 0, 200),
      ],
      4321,
      PERIOD,
    );
    expect(k.soldeOperationnelEstime).toBe(800); // 1000 paiement − 200 dépense
    expect(k.soldeFideicommis).toBe(5000);
    expect(k.totalFacture).toBe(1000);
    expect(k.totalEncaisse).toBe(1000);
    expect(k.comptesARecevoir).toBe(4321);
  });
});

describe("computeJournalKpis — robustesse à l'antidatage", () => {
  it("classe les écritures par DATE, indépendamment de l'ordre d'insertion", () => {
    const entries = [
      mk("PAIEMENT", 500, 0, new Date("2026-06-20")),
      // écriture antidatée, insérée « après » mais datée plus tôt dans le mois
      mk("PAIEMENT", 200, 0, new Date("2026-06-02")),
      // paiement d'un autre mois : NE doit PAS compter dans l'encaissé du mois courant
      mk("PAIEMENT", 999, 0, new Date("2026-04-10")),
    ];
    const k = computeJournalKpis(entries, 0, PERIOD);
    // Encaissé du mois = 500 + 200 (juin), pas le 999 d'avril.
    expect(k.totalEncaisse).toBe(700);
    // Solde opérationnel = tout le cash, tous exercices confondus.
    expect(k.soldeOperationnelEstime).toBe(1699);
    // Le nombre d'écritures du mois ne compte que les écritures de juin.
    expect(k.nbTransactionsCeMois).toBe(2);
  });

  it("le calcul ne lit aucun champ `solde` (impossible structurellement)", () => {
    // KpiEntry n'expose pas de champ `solde` : un solde cumulé erroné (antidatage)
    // ne peut donc PAS influencer les indicateurs. Ce test documente l'invariant.
    const k = computeJournalKpis([mk("PAIEMENT", 100, 0)], 0, PERIOD);
    expect(k.soldeOperationnelEstime).toBe(100);
  });

  it("comparatif mois précédent : facture de mai classée hors période courante", () => {
    const k = computeJournalKpis(
      [
        mk("FACTURE", 600, 0, new Date("2026-06-10")),
        mk("FACTURE", 400, 0, new Date("2026-05-10")),
      ],
      0,
      PERIOD,
    );
    expect(k.totalFacture).toBe(600);
    expect(k.totalFactureMoisPrecedent).toBe(400);
  });

  it("comparatif dépenses mois précédent : dépense de mai classée hors période courante", () => {
    const k = computeJournalKpis(
      [
        mk("DEPENSE", 0, 250, new Date("2026-06-12")),
        mk("DEPENSE", 0, 180, new Date("2026-05-12")),
      ],
      0,
      PERIOD,
    );
    expect(k.totalDepenses).toBe(250);
    expect(k.totalDepensesMoisPrecedent).toBe(180);
  });

  it("dépense avec remboursement partiel : convention montantSortie − montantEntree", () => {
    // 300 sorti, 50 remboursé sur la même ligne DEPENSE = 250 net dépensé.
    const k = computeJournalKpis([mk("DEPENSE", 50, 300)], 0, PERIOD);
    expect(k.totalDepenses).toBe(250);
    expect(k.soldeOperationnelEstime).toBe(-250); // net = 50 − 300
  });

  it("arrondis : 0,1 + 0,2 = 0,3 (round2 élimine la dérive flottante)", () => {
    const k = computeJournalKpis(
      [mk("PAIEMENT", 0.1, 0), mk("PAIEMENT", 0.2, 0)],
      0,
      PERIOD,
    );
    expect(k.totalEncaisse).toBe(0.3); // pas 0.30000000000000004
    expect(k.soldeOperationnelEstime).toBe(0.3);
  });
});
