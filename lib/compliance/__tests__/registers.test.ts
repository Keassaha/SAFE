import { describe, expect, it } from "vitest";
import {
  getRegister,
  getRegisters,
  getRegulatoryColumns,
  type RegisterId,
} from "../registers";

/**
 * CH-04 — Définition des registres réglementaires.
 *
 * L'obligation n'est pas de tenir les registres — SAFE les tient en base — mais de
 * pouvoir en produire une copie « immédiatement, en tout temps » (art. 30 B-1 r.5)
 * ou « promptly on request » (s. 21(2) By-Law 9). Une base de données n'est pas un
 * registre tant qu'on ne peut pas l'imprimer.
 */

describe("Registres applicables par province", () => {
  it("sert au Québec les neuf registres du régime québécois", () => {
    const ids = getRegisters("QC").map((r) => r.id);
    expect(ids).toEqual([
      "TRUST_CASH_JOURNAL",
      "CLIENT_LEDGERS",
      "PARTICULAR_ACCOUNT_LEDGERS",
      "CHEQUE_REGISTER",
      "TRUST_PROPERTY_REGISTER",
      "ADMIN_CASH_JOURNAL",
      "FEES_BOOK",
      "ACTIVE_MATTERS",
      "CLOSED_MATTERS",
    ]);
  });

  it("N'IMPOSE PAS en Ontario les registres propres au Québec", () => {
    // Le compte particulier (art. 66) et la liste des dossiers (art. 9) n'ont aucun
    // équivalent dans By-Law 9, qui ne traite que des registres financiers. Les
    // exiger inventerait une obligation.
    const ids = getRegisters("ON").map((r) => r.id);
    expect(ids).not.toContain("PARTICULAR_ACCOUNT_LEDGERS");
    expect(ids).not.toContain("ACTIVE_MATTERS");
    expect(ids).not.toContain("CLOSED_MATTERS");
  });

  it("renvoie undefined pour un registre hors régime", () => {
    expect(getRegister("PARTICULAR_ACCOUNT_LEDGERS", "ON")).toBeUndefined();
    expect(getRegister("PARTICULAR_ACCOUNT_LEDGERS", "QC")).toBeDefined();
  });
});

describe("Journal de caisse en fidéicommis (art. 38 / s. 18(1)(2))", () => {
  const qc = getRegister("TRUST_CASH_JOURNAL", "QC")!;
  const on = getRegister("TRUST_CASH_JOURNAL", "ON")!;

  it("porte toutes les colonnes énumérées par l'art. 38", () => {
    const keys = qc.columns.map((c) => c.key);
    expect(keys).toEqual(
      expect.arrayContaining([
        "date",
        "payerOrPayee",
        "clientName",
        "dossierRef",
        "purpose",
        "method",
        "chequeNumber",
        "cash",
        "receipt",
        "disbursement",
        "balance",
      ]),
    );
  });

  it("cite l'article québécois de chaque colonne", () => {
    const purpose = qc.columns.find((c) => c.key === "purpose")!;
    expect(purpose.reference).toBe("art. 38(1)f, (2)f");
    const cheque = qc.columns.find((c) => c.key === "chequeNumber")!;
    expect(cheque.reference).toBe("art. 38(2)h");
  });

  it("cite l'article ontarien pour un cabinet ontarien (PR-7)", () => {
    expect(on.reference).toBe("By-Law 9, s. 18(1), (2)");
    expect(on.columns.find((c) => c.key === "chequeNumber")!.reference).toBe("s. 18(2)");
  });

  it("marque le solde comme non réglementaire en Ontario", () => {
    // Le « solde après chaque inscription » est explicite à l'art. 38(1)h québécois ;
    // il découle du grand livre en Ontario, sans article dédié. On ne lui attribue
    // donc pas de référence ontarienne.
    expect(qc.columns.find((c) => c.key === "balance")!.reference).toBe("art. 38(1)h, (2)i");
    expect(on.columns.find((c) => c.key === "balance")!.reference).toBeNull();
  });

  it("totalise les colonnes monétaires", () => {
    const money = qc.columns.filter((c) => c.money).map((c) => c.key);
    expect(money).toEqual(["receipt", "disbursement", "balance"]);
  });
});

describe("Registre de cartes-clients (art. 39 / s. 18(3))", () => {
  it("prévoit le dossier, exigé au Québec par l'art. 39 al. 3", () => {
    const qc = getRegister("CLIENT_LEDGERS", "QC")!;
    expect(qc.columns.find((c) => c.key === "dossierRef")!.reference).toBe("art. 39 al. 3");
  });

  it("ne rattache pas le dossier à un article ontarien", () => {
    // La s. 18(3) exige un grand livre PAR CLIENT, sans imposer la ventilation par
    // dossier que fait l'art. 39 al. 3.
    const on = getRegister("CLIENT_LEDGERS", "ON")!;
    expect(on.columns.find((c) => c.key === "dossierRef")!.reference).toBeNull();
  });

  it("porte le solde non dépensé, exigé des deux côtés", () => {
    expect(getRegister("CLIENT_LEDGERS", "ON")!.columns.find((c) => c.key === "balance")!.reference)
      .toBe("s. 18(3)");
  });
});

describe("Livre des honoraires", () => {
  it("est une exigence explicite en Ontario (s. 18(7))", () => {
    expect(getRegister("FEES_BOOK", "ON")!.reference).toBe("By-Law 9, s. 18(7)");
  });

  it("découle de l'obligation générale au Québec, et le dit", () => {
    // B-1 r.5 n'a pas d'article dédié au livre des honoraires. Lui en inventer un
    // serait aussi faux que de l'omettre.
    const qc = getRegister("FEES_BOOK", "QC")!;
    expect(qc.reference).toBe("B-1 r.5, art. 28");
    expect(qc.noteFr).toContain("n'impose pas de livre des honoraires distinct");
  });
});

describe("Colonnes réglementaires", () => {
  it("écarte les colonnes de confort", () => {
    const on = getRegister("FEES_BOOK", "ON")!;
    const regulatory = getRegulatoryColumns(on).map((c) => c.key);
    expect(regulatory).not.toContain("dossierRef");
    expect(regulatory).toContain("numero");
  });

  it("un registre sans colonne sourcée doit expliquer POURQUOI", () => {
    // Invariant : certains registres découlent d'une obligation générale sans
    // qu'aucun article n'énumère leurs colonnes. C'est le cas du livre des
    // honoraires au Québec (art. 28, obligation de tenir les livres à jour). Dans
    // ce cas on n'invente pas de référence de colonne, mais on l'explique en note.
    // Un registre muet sur les deux plans serait une affirmation sans source.
    for (const province of ["QC", "ON"] as const) {
      for (const def of getRegisters(province)) {
        if (getRegulatoryColumns(def).length === 0) {
          expect(def.noteFr, `${def.id} (${province}) : ni colonne sourcée ni note`).toBeTruthy();
        }
      }
    }
  });

  it("seul le livre des honoraires québécois n'a pas de colonne sourcée", () => {
    // Si un autre registre le devient un jour, c'est probablement une régression
    // dans le sourçage, pas une nuance réglementaire.
    const sansSource = (["QC", "ON"] as const).flatMap((p) =>
      getRegisters(p)
        .filter((d) => getRegulatoryColumns(d).length === 0)
        .map((d) => `${d.id}/${p}`),
    );
    expect(sansSource).toEqual(["FEES_BOOK/QC"]);
  });

  it("chaque registre cite l'article qui impose sa tenue", () => {
    for (const province of ["QC", "ON"] as const) {
      for (const def of getRegisters(province)) {
        expect(def.reference, `${def.id} (${province})`).toMatch(/B-1 r\.5|By-Law 9/);
      }
    }
  });
});

describe("Registre des autres biens (art. 43 / s. 18(9))", () => {
  it("s'applique dans les deux provinces", () => {
    expect(getRegister("TRUST_PROPERTY_REGISTER", "QC")).toBeDefined();
    expect(getRegister("TRUST_PROPERTY_REGISTER", "ON")).toBeDefined();
  });

  it("porte au Québec le lieu de garde et l'affectation, PAS la valeur", () => {
    const keys = getRegister("TRUST_PROPERTY_REGISTER", "QC")!.columns.map((c) => c.key);
    expect(keys).toEqual(expect.arrayContaining(["storageLocation", "purpose"]));
    expect(keys).not.toContain("estimatedValue");
    expect(keys).not.toContain("receivedFromName");
  });

  it("porte en Ontario la valeur et le détenteur précédent, PAS le lieu de garde", () => {
    // L'ecart entre les deux regimes est reel : l'aplatir produirait soit un
    // registre incomplet, soit des colonnes inventees.
    const keys = getRegister("TRUST_PROPERTY_REGISTER", "ON")!.columns.map((c) => c.key);
    expect(keys).toEqual(expect.arrayContaining(["estimatedValue", "receivedFromName"]));
    expect(keys).not.toContain("storageLocation");
    expect(keys).not.toContain("purpose");
  });

  it("rattache le lieu de garde a l'art. 45 et l'affectation a l'art. 46", () => {
    const cols = getRegister("TRUST_PROPERTY_REGISTER", "QC")!.columns;
    expect(cols.find((c) => c.key === "storageLocation")!.reference).toBe("art. 45");
    expect(cols.find((c) => c.key === "purpose")!.reference).toBe("art. 46");
  });
});

describe("Liste des dossiers (art. 9)", () => {
  it("limite les dossiers fermés aux sept dernières années", () => {
    const closed = getRegister("CLOSED_MATTERS", "QC")!;
    expect(closed.titleFr).toContain("7 dernières années");
    expect(closed.columns.map((c) => c.key)).toContain("closedAt");
  });

  it("n'affiche pas de date de fermeture sur les dossiers actifs", () => {
    const active = getRegister("ACTIVE_MATTERS", "QC")!;
    expect(active.columns.map((c) => c.key)).not.toContain("closedAt");
  });
});

describe("Couverture", () => {
  it("tous les identifiants déclarés sont servis dans au moins une province", () => {
    const ids: RegisterId[] = [
      "TRUST_CASH_JOURNAL",
      "CLIENT_LEDGERS",
      "PARTICULAR_ACCOUNT_LEDGERS",
      "CHEQUE_REGISTER",
      "TRUST_PROPERTY_REGISTER",
      "ADMIN_CASH_JOURNAL",
      "FEES_BOOK",
      "ACTIVE_MATTERS",
      "CLOSED_MATTERS",
    ];
    const served = new Set([
      ...getRegisters("QC").map((r) => r.id),
      ...getRegisters("ON").map((r) => r.id),
    ]);
    for (const id of ids) expect(served.has(id), id).toBe(true);
  });
});
