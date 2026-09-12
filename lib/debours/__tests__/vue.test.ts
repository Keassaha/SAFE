import { describe, it, expect } from "vitest";
import {
  filtrer,
  grouperParClient,
  moisPresents,
  resteARefacturer,
  totaux,
  type DeboursLigne,
} from "../vue";

const l = (p: Partial<DeboursLigne>): DeboursLigne => ({
  id: p.id ?? "d1",
  date: p.date ?? "2026-09-01",
  description: p.description ?? "Frais de greffe",
  quantite: p.quantite ?? 1,
  montant: p.montant ?? 100,
  taxable: p.taxable ?? false,
  payeParCabinet: p.payeParCabinet ?? true,
  refacturable: p.refacturable ?? true,
  statutDebours: p.statutDebours ?? "NON_FACTURE",
  clientId: p.clientId ?? "c1",
  clientNom: p.clientNom ?? "Jean Tremblay",
  dossierId: p.dossierId ?? "do1",
  dossierLabel: p.dossierLabel ?? "2026-014",
  factureId: p.factureId ?? null,
  factureNumero: p.factureNumero ?? null,
});

describe("ce qui reste à refacturer", () => {
  it("retient un débours refacturable pas encore facturé", () => {
    expect(resteARefacturer(l({}))).toBe(true);
  });

  it("écarte un débours déjà porté sur une facture", () => {
    expect(resteARefacturer(l({ statutDebours: "FACTURE" }))).toBe(false);
  });

  it("écarte un débours que le cabinet a décidé de ne pas refacturer", () => {
    expect(resteARefacturer(l({ refacturable: false }))).toBe(false);
  });

  it("écarte un débours radié : le cabinet renonce à le récupérer", () => {
    expect(resteARefacturer(l({ statutDebours: "RADIE" }))).toBe(false);
  });
});

describe("totaux", () => {
  it("rend zéro partout sur une liste vide", () => {
    expect(totaux([])).toEqual({
      aRefacturer: 0,
      avanceNonRembourse: 0,
      recouvre: 0,
      radie: 0,
    });
  });

  it("ne compte PAS comme avancé un débours payé directement par le client", () => {
    // Cet argent n'a jamais quitté le compte du cabinet : le compter
    // fabriquerait une créance qui n'existe pas.
    const t = totaux([l({ montant: 500, payeParCabinet: false })]);
    expect(t.avanceNonRembourse).toBe(0);
    expect(t.aRefacturer).toBe(500);
  });

  it("sort un débours recouvré de l'avance non remboursée", () => {
    const t = totaux([l({ montant: 300, statutDebours: "RECOUVRE" })]);
    expect(t.avanceNonRembourse).toBe(0);
    expect(t.recouvre).toBe(300);
  });

  it("garde un débours facturé mais pas encore payé dans l'avance", () => {
    const t = totaux([l({ montant: 200, statutDebours: "FACTURE" })]);
    expect(t.avanceNonRembourse).toBe(200);
    expect(t.aRefacturer).toBe(0);
  });

  it("isole les radiations", () => {
    const t = totaux([l({ montant: 850, statutDebours: "RADIE" })]);
    expect(t.radie).toBe(850);
    expect(t.avanceNonRembourse).toBe(0);
    expect(t.aRefacturer).toBe(0);
  });

  it("arrondit au cent", () => {
    expect(totaux([l({ montant: 0.1 }), l({ montant: 0.2 })]).aRefacturer).toBe(0.3);
  });
});

describe("regroupement par client", () => {
  it("rend une liste vide sans lignes", () => {
    expect(grouperParClient([])).toEqual([]);
  });

  it("compte les dossiers distincts, pas les lignes", () => {
    const g = grouperParClient([
      l({ id: "a", dossierId: "do1" }),
      l({ id: "b", dossierId: "do1" }),
      l({ id: "c", dossierId: "do2" }),
    ]);
    expect(g[0].nbDossiers).toBe(2);
    expect(g[0].lignes).toHaveLength(3);
  });

  it("met devant le client dont il reste le plus à récupérer", () => {
    const g = grouperParClient([
      l({ id: "a", clientId: "c1", clientNom: "Alpha", montant: 100 }),
      l({ id: "b", clientId: "c2", clientNom: "Beta", montant: 900 }),
    ]);
    expect(g.map((x) => x.clientNom)).toEqual(["Beta", "Alpha"]);
  });

  it("départage à égalité par ordre alphabétique, pour que la page ne bouge pas", () => {
    const g = grouperParClient([
      l({ id: "a", clientId: "c2", clientNom: "Zébu", montant: 100 }),
      l({ id: "b", clientId: "c1", clientNom: "Alpha", montant: 100 }),
    ]);
    expect(g.map((x) => x.clientNom)).toEqual(["Alpha", "Zébu"]);
  });

  it("sépare le total du groupe de son reste à refacturer", () => {
    const g = grouperParClient([
      l({ id: "a", montant: 100 }),
      l({ id: "b", montant: 850, statutDebours: "RADIE" }),
    ]);
    expect(g[0].total).toBe(950);
    expect(g[0].aRefacturer).toBe(100);
  });
});

describe("filtres", () => {
  const lignes = [
    l({ id: "a", clientId: "c1", date: "2026-09-01", statutDebours: "NON_FACTURE" }),
    l({ id: "b", clientId: "c2", date: "2026-08-15", statutDebours: "FACTURE" }),
    l({ id: "c", clientId: "c1", date: "2026-08-02", statutDebours: "RADIE" }),
  ];

  it("ne filtre rien sans critère", () => {
    expect(filtrer(lignes, {})).toHaveLength(3);
  });

  it("filtre par client", () => {
    expect(filtrer(lignes, { clientId: "c1" }).map((x) => x.id)).toEqual(["a", "c"]);
  });

  it("filtre par état", () => {
    expect(filtrer(lignes, { statut: "FACTURE" }).map((x) => x.id)).toEqual(["b"]);
  });

  it("filtre par mois", () => {
    expect(filtrer(lignes, { mois: "2026-08" }).map((x) => x.id)).toEqual(["b", "c"]);
  });

  it("combine les critères", () => {
    expect(filtrer(lignes, { clientId: "c1", mois: "2026-08" }).map((x) => x.id)).toEqual(["c"]);
  });

  it("liste les mois du plus récent au plus ancien", () => {
    expect(moisPresents(lignes)).toEqual(["2026-09", "2026-08"]);
  });
});
