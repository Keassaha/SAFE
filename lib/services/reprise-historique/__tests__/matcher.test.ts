import { describe, it, expect } from "vitest";
import { matchFacturePassee, type ClientCandidat } from "@/lib/services/reprise-historique/matcher";

const clients: ClientCandidat[] = [
  {
    id: "c1",
    nom: "Nadine Ouellet",
    dossiers: [{ id: "d1", intitule: "Séparation de corps" }],
  },
  {
    id: "c2",
    nom: "Société Kaboré et fils",
    dossiers: [],
  },
];

describe("matchFacturePassee", () => {
  it("retrouve un client existant même si les mots du nom sont dans un autre ordre", () => {
    const result = matchFacturePassee(
      { clientNom: "Ouellet Nadine", dossierIntitule: null },
      clients,
    );
    expect(result.client).toEqual({ statut: "existant", clientId: "c1", clientNom: "Nadine Ouellet" });
  });

  it("retrouve le dossier existant du client par recoupement d'intitulé", () => {
    const result = matchFacturePassee(
      { clientNom: "Nadine Ouellet", dossierIntitule: "Séparation" },
      clients,
    );
    expect(result.dossier).toEqual({
      statut: "existant",
      dossierId: "d1",
      dossierIntitule: "Séparation de corps",
    });
  });

  it("propose un nouveau client quand le nom ne correspond à personne", () => {
    const result = matchFacturePassee(
      { clientNom: "Transport Gatineau-Ottawa inc.", dossierIntitule: "Réclamation contractuelle" },
      clients,
    );
    expect(result.client.statut).toBe("nouveau");
    expect(result.client.clientId).toBeNull();
    expect(result.dossier.statut).toBe("nouveau");
    expect(result.dossier.dossierIntitule).toBe("Réclamation contractuelle");
  });

  it("un client existant sans dossier correspondant propose un nouveau dossier, pas le mauvais", () => {
    const result = matchFacturePassee(
      { clientNom: "Nadine Ouellet", dossierIntitule: "Bail commercial" },
      clients,
    );
    expect(result.client.statut).toBe("existant");
    expect(result.dossier.statut).toBe("nouveau");
    expect(result.dossier.dossierIntitule).toBe("Bail commercial");
  });

  it("un nom illisible (null) ne matche jamais par accident et reste 'nouveau'", () => {
    const result = matchFacturePassee({ clientNom: null, dossierIntitule: null }, clients);
    expect(result.client.statut).toBe("nouveau");
    expect(result.client.clientId).toBeNull();
  });

  it("intitulé de dossier absent retombe sur le libellé par défaut « Dossier »", () => {
    const result = matchFacturePassee(
      { clientNom: "Société Kaboré et fils", dossierIntitule: null },
      clients,
    );
    expect(result.dossier).toEqual({ statut: "nouveau", dossierId: null, dossierIntitule: "Dossier" });
  });
});
