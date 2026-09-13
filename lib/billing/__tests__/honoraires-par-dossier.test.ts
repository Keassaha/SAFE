import { describe, it, expect } from "vitest";
import { regrouperHonorairesParDossier } from "@/lib/billing/honoraires-par-dossier";
import type { CabinetTaxConfig } from "@/lib/billing/types";

const QC: CabinetTaxConfig = {
  province: "QC",
  mode: "tps_tvq",
  rates: { tps: 5, tvq: 9.975 },
} as CabinetTaxConfig;

const NOW = new Date("2026-09-12T12:00:00Z");
const northfield = { id: "c1", raisonSociale: "Northfield inc.", prenom: null, nom: null };
const ouellet = { id: "c2", raisonSociale: null, prenom: "Marie-Ève", nom: "Ouellet" };
const d42 = { id: "d42", intitule: "Recours", numeroDossier: "2026-0042", clientId: "c1", client: northfield };
const d35 = { id: "d35", intitule: "Bail", numeroDossier: "2026-0035", clientId: "c1", client: northfield };
const d44 = { id: "d44", intitule: "Pension", numeroDossier: "2026-0044", clientId: "c2", client: ouellet };

function fiche(o: Partial<Parameters<typeof regrouperHonorairesParDossier>[0]["fiches"][number]> & { id: string }) {
  return {
    date: new Date("2026-09-01T00:00:00Z"),
    dureeMinutes: 60,
    montant: 300,
    feeAmount: null,
    taxable: true,
    clientId: null,
    client: null,
    dossierId: null,
    dossier: null,
    userNom: "Me Derisier",
    invoiceId: null,
    invoiceStatus: null,
    ...o,
  };
}

describe("regrouperHonorairesParDossier", () => {
  it("fait une ligne par dossier, pas par client, et trie client puis numéro", () => {
    const rows = regrouperHonorairesParDossier(
      {
        fiches: [
          fiche({ id: "f1", dossierId: "d42", dossier: d42, montant: 600, dureeMinutes: 120 }),
          fiche({ id: "f2", dossierId: "d42", dossier: d42, montant: 300, userNom: "Me Ngo",
            date: new Date("2026-07-01T00:00:00Z") }),
          fiche({ id: "f3", dossierId: "d35", dossier: d35, montant: 600 }),
          fiche({ id: "f4", dossierId: "d44", dossier: d44, montant: 75, dureeMinutes: 15 }),
        ],
        expenses: [],
        debours: [
          { id: "db1", date: new Date("2026-09-02T00:00:00Z"), montant: 100, taxable: true,
            clientId: "c1", dossierId: "d42", dossier: d42, invoiceId: null, invoiceStatus: null },
        ],
        taches: [],
      },
      QC,
      100,
      NOW,
    );

    expect(rows.map((r) => r.key)).toEqual(["d35", "d42", "d44"]);

    const r42 = rows[1];
    expect(r42.clientName).toBe("Northfield inc.");
    expect(r42.count).toBe(3);
    expect(r42.totalHeures).toBe(3);
    expect(r42.totalHonoraires).toBe(900);
    expect(r42.totalDebours).toBe(100);
    expect(r42.totalAFacturer).toBe(1149.75);
    expect(r42.timeEntryIds).toEqual(["f1", "f2"]);
    expect(r42.deboursIds).toEqual(["db1"]);
    expect(r42.avocats).toEqual(["Me Derisier", "Me Ngo"]);
    expect(r42.ageMaxJours).toBe(73);
    expect(r42.sousSeuil).toBe(false);

    const r44 = rows[2];
    expect(r44.clientName).toBe("Ouellet, Marie-Ève");
    expect(r44.totalAFacturer).toBe(86.23);
    expect(r44.sousSeuil).toBe(true);
  });

  it("un seuil à zéro propose tout, et une pièce en brouillon ne compte pas comme libre", () => {
    const rows = regrouperHonorairesParDossier(
      {
        fiches: [
          fiche({ id: "f1", dossierId: "d44", dossier: d44, montant: 20 }),
          fiche({ id: "f2", dossierId: "d44", dossier: d44, montant: 500, invoiceId: "inv1", invoiceStatus: "DRAFT" }),
        ],
        expenses: [],
        debours: [],
        taches: [],
      },
      QC,
      0,
      NOW,
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].timeEntryIds).toEqual(["f1"]);
    expect(rows[0].draftInvoiceIds).toEqual(["inv1"]);
    expect(rows[0].totalLibre).toBe(23);
    expect(rows[0].sousSeuil).toBe(false);
  });

  it("une fiche sans dossier fait une ligne « sans dossier » sous son client", () => {
    const rows = regrouperHonorairesParDossier(
      {
        fiches: [fiche({ id: "f1", clientId: "c2", client: ouellet, montant: 200 })],
        expenses: [],
        debours: [],
        taches: [],
      },
      QC,
      100,
      NOW,
    );
    expect(rows[0].key).toBe("client:c2");
    expect(rows[0].dossierId).toBeNull();
    expect(rows[0].clientName).toBe("Ouellet, Marie-Ève");
  });
});
