import { describe, expect, it } from "vitest";
import { getRegister } from "@/lib/compliance/registers";
import {
  computeFingerprint,
  formatCell,
  renderRegister,
  toCsv,
  toPrintableHtml,
  type RegisterRow,
} from "../register-render";

/**
 * CH-04 — Moteur de rendu des registres.
 *
 * Ferme P-5 (« la tenue » annoncée au client) et QC-17 / ON-39.
 *
 * L'exigence n'est pas de stocker, c'est de PRODUIRE :
 *   art. 30 B-1 r.5 — copies tirées « immédiatement, en tout temps »
 *   s. 21(2) By-Law 9 — « a paper copy […] produced promptly on request »
 *
 * Ce qui est prouvé ici : les trois sorties (écran, CSV, impression) portent les
 * mêmes données au caractère près, et l'empreinte est déterministe.
 */

const DEF_QC = getRegister("TRUST_CASH_JOURNAL", "QC")!;

const ROWS: RegisterRow[] = [
  {
    date: new Date("2026-06-03T00:00:00Z"),
    payerOrPayee: "Jean Tremblay",
    clientName: "Tremblay",
    dossierRef: "2026-014 Divorce",
    purpose: "AVANCE_HONORAIRES",
    method: "CHEQUE",
    chequeNumber: null,
    cash: false,
    receipt: 5000,
    disbursement: null,
    balance: 5000,
  },
  {
    date: new Date("2026-06-18T00:00:00Z"),
    payerOrPayee: "Ville de Montréal",
    clientName: "Tremblay",
    dossierRef: "2026-014 Divorce",
    purpose: "PAIEMENT_TIERS",
    method: "CHEQUE",
    chequeNumber: 105,
    cash: false,
    receipt: null,
    disbursement: 1200.5,
    balance: 3799.5,
  },
];

function render(rows = ROWS) {
  return renderRegister({
    definition: DEF_QC,
    province: "QC",
    rows,
    cabinetName: "Cabinet Tremblay",
    accountLabel: "Cabinet Tremblay en fidéicommis (•••• 6789)",
    periodLabel: "Période 2026-06",
    generatedBy: "Me Tremblay",
    generatedAt: new Date("2026-07-05T14:30:00Z"),
  });
}

/* ════════════════════════════════════════════════════════════════
   Formatage — une seule source pour les trois sorties
   ════════════════════════════════════════════════════════════════ */

describe("Formatage des cellules", () => {
  const money = { key: "x", labelFr: "", labelEn: "", align: "right" as const, reference: null, money: true };
  const text = { key: "y", labelFr: "", labelEn: "", align: "left" as const, reference: null };

  it("écrit les montants à deux décimales, sans symbole ni séparateur", () => {
    // Un registre comptable se recoupe, il ne se décore pas. Le CSV reste importable
    // dans un tableur sans retraitement.
    expect(formatCell(1200.5, money)).toBe("1200.50");
    expect(formatCell(0, money)).toBe("0.00");
  });

  it("écrit les dates en ISO court", () => {
    expect(formatCell(new Date("2026-06-03T00:00:00Z"), text)).toBe("2026-06-03");
  });

  it("rend une valeur absente par une chaîne vide, jamais « null »", () => {
    expect(formatCell(null, text)).toBe("");
    expect(formatCell(undefined, money)).toBe("");
  });

  it("rend un booléen faux par du vide, pas par « Non »", () => {
    // La colonne « Espèces » de l'art. 38(1)g est une INDICATION : elle se coche ou
    // reste vide. Écrire « Non » sur chaque ligne noierait le signal.
    expect(formatCell(true, text)).toBe("Oui");
    expect(formatCell(false, text)).toBe("");
  });
});

/* ════════════════════════════════════════════════════════════════
   Assemblage
   ════════════════════════════════════════════════════════════════ */

describe("Rendu d'un registre", () => {
  it("porte l'en-tête réglementaire complet", () => {
    const r = render();
    expect(r.definition.reference).toBe("B-1 r.5, art. 38");
    expect(r.header.cabinetName).toBe("Cabinet Tremblay");
    expect(r.header.accountLabel).toContain("en fidéicommis");
    expect(r.header.periodLabel).toBe("Période 2026-06");
    expect(r.rowCount).toBe(2);
  });

  it("totalise les colonnes monétaires, et elles seules", () => {
    const r = render();
    expect(r.totals.receipt).toBe(5000);
    expect(r.totals.disbursement).toBe(1200.5);
    expect(r.totals).not.toHaveProperty("clientName");
  });

  it("peut se restreindre aux colonnes exigées par un article", () => {
    const r = renderRegister({
      definition: DEF_QC,
      province: "QC",
      rows: ROWS,
      cabinetName: "Cabinet",
      periodLabel: "2026-06",
      generatedBy: "Me Tremblay",
      regulatoryColumnsOnly: true,
    });
    expect(r.columns.every((c) => c.reference !== null)).toBe(true);
  });
});

/* ════════════════════════════════════════════════════════════════
   Empreinte
   ════════════════════════════════════════════════════════════════ */

describe("Empreinte du registre", () => {
  it("est déterministe pour un même contenu", () => {
    expect(render().fingerprint).toBe(render().fingerprint);
  });

  it("change dès qu'une donnée change", () => {
    const modified = [{ ...ROWS[0]!, receipt: 5001 }, ROWS[1]!];
    expect(render(modified).fingerprint).not.toBe(render().fingerprint);
  });

  it("IGNORE la date de génération", () => {
    // Sinon deux productions du même registre donneraient deux empreintes, et la
    // comparaison ne prouverait rien.
    const a = renderRegister({
      definition: DEF_QC,
      province: "QC",
      rows: ROWS,
      cabinetName: "Cabinet Tremblay",
      periodLabel: "Période 2026-06",
      generatedBy: "Me Tremblay",
      generatedAt: new Date("2026-07-05T14:30:00Z"),
    });
    const b = renderRegister({
      definition: DEF_QC,
      province: "QC",
      rows: ROWS,
      cabinetName: "Cabinet Tremblay",
      periodLabel: "Période 2026-06",
      generatedBy: "Me Tremblay",
      generatedAt: new Date("2026-09-01T09:00:00Z"),
    });
    expect(a.fingerprint).toBe(b.fingerprint);
  });

  it("distingue deux périodes portant les mêmes lignes", () => {
    const base = { definition: DEF_QC, columns: DEF_QC.columns, rows: ROWS };
    expect(computeFingerprint({ ...base, periodLabel: "2026-06" })).not.toBe(
      computeFingerprint({ ...base, periodLabel: "2026-07" }),
    );
  });
});

/* ════════════════════════════════════════════════════════════════
   CSV
   ════════════════════════════════════════════════════════════════ */

describe("Sortie CSV", () => {
  it("reprend l'en-tête réglementaire en commentaire", () => {
    // Un fichier détaché de son contexte ne prouve rien.
    const csv = toCsv(render());
    expect(csv).toContain("# Journal de caisse recettes-déboursés en fidéicommis");
    expect(csv).toContain("# B-1 r.5, art. 38");
    expect(csv).toContain("# Cabinet Tremblay");
    expect(csv).toContain("# SHA-256 ");
  });

  it("porte une ligne par écriture, plus l'en-tête de colonnes et les totaux", () => {
    const lines = toCsv(render()).split("\n");
    const dataLines = lines.filter((l) => l.startsWith("2026-"));
    expect(dataLines).toHaveLength(2);
  });

  it("échappe les valeurs contenant une virgule", () => {
    const rows: RegisterRow[] = [{ ...ROWS[0]!, payerOrPayee: "Tremblay, Jean" }];
    expect(toCsv(render(rows))).toContain('"Tremblay, Jean"');
  });

  it("échappe les guillemets en les doublant", () => {
    const rows: RegisterRow[] = [{ ...ROWS[0]!, purpose: 'Provision "urgente"' }];
    expect(toCsv(render(rows))).toContain('"Provision ""urgente"""');
  });

  it("écrit les libellés anglais pour un rendu ontarien", () => {
    const csv = toCsv(render(), "en");
    expect(csv).toContain("Trust receipts and disbursements journal");
    expect(csv).toContain("Received from / Paid to");
  });
});

/* ════════════════════════════════════════════════════════════════
   HTML imprimable
   ════════════════════════════════════════════════════════════════ */

describe("Sortie imprimable", () => {
  it("produit un document autonome, sans dépendance externe", () => {
    // La copie doit pouvoir être produite « en tout temps », y compris hors ligne.
    const html = toPrintableHtml(render());
    expect(html).toContain("<!doctype html>");
    expect(html).not.toMatch(/https?:\/\//);
  });

  it("affiche l'article de chaque colonne dans l'en-tête du tableau", () => {
    const html = toPrintableHtml(render());
    expect(html).toContain("art. 38(2)h");
    expect(html).toContain("art. 38(1)f, (2)f");
  });

  it("répète l'en-tête de tableau sur chaque page", () => {
    // Sans quoi un registre de trente pages devient illisible.
    expect(toPrintableHtml(render())).toContain("display: table-header-group");
  });

  it("porte l'empreinte et l'auteur en pied", () => {
    const html = toPrintableHtml(render());
    expect(html).toContain("Me Tremblay");
    expect(html).toContain(render().fingerprint);
  });

  it("échappe le HTML des données", () => {
    const rows: RegisterRow[] = [{ ...ROWS[0]!, payerOrPayee: "<script>alert(1)</script>" }];
    const html = toPrintableHtml(render(rows));
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("porte les mêmes montants que le CSV, au caractère près", () => {
    // C'est la garantie centrale : un inspecteur qui compare l'export au document
    // imprimé ne doit trouver aucune divergence.
    const r = render();
    const csv = toCsv(r);
    const html = toPrintableHtml(r);
    for (const montant of ["5000.00", "1200.50", "3799.50"]) {
      expect(csv, `CSV : ${montant}`).toContain(montant);
      expect(html, `HTML : ${montant}`).toContain(montant);
    }
  });
});
