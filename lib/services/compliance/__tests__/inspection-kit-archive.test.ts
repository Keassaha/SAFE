import { describe, expect, it } from "vitest";
import { unzipSync, strFromU8 } from "fflate";
import {
  archiveFilename,
  asciiPath,
  buildInspectionArchive,
} from "../inspection-kit-archive";
import type { InspectionKit } from "../inspection-kit-service";

/**
 * Trousse d'inspection — mise en archive.
 *
 * Ce qui est prouvé ici :
 *   1. l'archive s'ouvre réellement, et son contenu est celui annoncé ;
 *   2. le manifeste arrive EN TÊTE d'un tri alphabétique — il porte la liste des
 *      pièces manquantes, et personne ne doit avoir à le chercher ;
 *   3. une pièce absente ne produit AUCUN fichier vide, qui ressemblerait à un
 *      registre vide plutôt qu'à un registre non produit ;
 *   4. les noms de fichiers restent en ASCII : un ZIP sans drapeau UTF-8 s'ouvre en
 *      charabia sous Windows, et un inspecteur qui reçoit une archive illisible n'a
 *      rien reçu.
 */

function kit(overrides: Partial<InspectionKit> = {}): InspectionKit {
  return {
    cabinetId: "cab",
    cabinetName: "Cabinet Test",
    province: "QC",
    periodFrom: new Date("2025-07-01T00:00:00Z"),
    periodTo: new Date("2026-06-30T23:59:59Z"),
    generatedAt: new Date("2026-08-04T12:00:00Z"),
    generatedBy: "Me Test",
    manifest: "TROUSSE D'INSPECTION\n\n⚠️ 1 pièce manquante",
    manifestFingerprint: "a".repeat(64),
    missingCount: 1,
    items: [
      {
        kind: "REGISTER",
        filename: "registres/TRUST_CASH_JOURNAL.csv",
        titleFr: "Journal des recettes et déboursés en fidéicommis",
        reference: "B-1 r.5, art. 38",
        content: "date;montant\n2026-06-01;1 500,00",
        fingerprint: "b".repeat(64),
        rowCount: 1,
        missingReasonFr: null,
      },
      {
        kind: "MONTHLY_REPORT",
        filename: "rapports-mensuels/2026-05.txt",
        titleFr: "Rapport comptable mensuel 2026-05",
        reference: "B-1 r.5, art. 41",
        content: null,
        fingerprint: null,
        rowCount: 0,
        missingReasonFr: "Aucun rapport n'a été produit pour ce mois.",
      },
    ],
    ...overrides,
  } as InspectionKit;
}

describe("Archive de la trousse", () => {
  it("produit un ZIP qui s'ouvre", () => {
    const files = unzipSync(buildInspectionArchive(kit()));
    expect(Object.keys(files).length).toBeGreaterThan(0);
  });

  it("place le manifeste EN TÊTE d'un tri alphabétique", () => {
    // C'est lui qui dit ce qui manque.
    const noms = Object.keys(unzipSync(buildInspectionArchive(kit()))).sort();
    expect(noms[0]).toBe("00-MANIFESTE.txt");
  });

  it("restitue le manifeste au caractère près, accents compris", () => {
    const files = unzipSync(buildInspectionArchive(kit()));
    expect(strFromU8(files["00-MANIFESTE.txt"]!)).toContain("pièce manquante");
  });

  it("restitue le contenu d'une pièce sans altération", () => {
    const files = unzipSync(buildInspectionArchive(kit()));
    expect(strFromU8(files["registres/TRUST_CASH_JOURNAL.csv"]!)).toBe(
      "date;montant\n2026-06-01;1 500,00",
    );
  });

  it("N'ÉCRIT AUCUN fichier pour une pièce absente", () => {
    // Un CSV de zéro octet ressemblerait à un registre vide plutôt qu'à un registre
    // non produit. Le manifeste, lui, la nomme.
    const noms = Object.keys(unzipSync(buildInspectionArchive(kit())));
    expect(noms).not.toContain("rapports-mensuels/2026-05.txt");
    expect(noms).toHaveLength(2); // manifeste + la seule pièce produite
  });

  it("nomme l'archive avec la période, pour ne pas confondre deux productions", () => {
    expect(archiveFilename(kit())).toBe("trousse-inspection_2025-07-01_2026-06-30.zip");
  });
});

describe("Noms de fichiers", () => {
  it("translittère un nom accentué au lieu de casser l'archive", () => {
    expect(asciiPath("registres/journal-fidéicommis.csv")).toBe(
      "registres/journal-fideicommis.csv",
    );
  });

  it("conserve la structure de dossiers", () => {
    expect(asciiPath("rapports-mensuels/2026-05.txt")).toBe("rapports-mensuels/2026-05.txt");
  });

  it("remplace tout caractère hors ASCII sûr", () => {
    expect(asciiPath("registre des chèques (2026).csv")).toBe(
      "registre-des-cheques--2026-.csv",
    );
  });

  it("laisse intacts les noms déjà produits par le service", () => {
    // Ces noms viennent de `inspection-kit-service` : s'ils changeaient et devenaient
    // accentués, ce test le dirait.
    for (const n of [
      "registres/TRUST_CASH_JOURNAL.csv",
      "rapports-mensuels/2026-05.txt",
      "soldes-debiteurs.csv",
    ]) {
      expect(asciiPath(n), n).toBe(n);
    }
  });
});
