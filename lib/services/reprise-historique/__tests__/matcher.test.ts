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

  it("retrouve le dossier existant du client, casse et accents mis de côté", () => {
    const result = matchFacturePassee(
      { clientNom: "Nadine Ouellet", dossierIntitule: "SEPARATION DE CORPS" },
      clients,
    );
    expect(result.dossier).toEqual({
      statut: "existant",
      dossierId: "d1",
      dossierIntitule: "Séparation de corps",
    });
  });

  it("un mot seul ne rattache rien : « Séparation » peut être de corps ou de biens", () => {
    const result = matchFacturePassee(
      { clientNom: "Nadine Ouellet", dossierIntitule: "Séparation" },
      clients,
    );
    expect(result.dossier.statut).toBe("nouveau");
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

  it("un client qui a plusieurs dossiers : on ne rattache que sur une preuve sérieuse", () => {
    // Un même client, quatre dossiers, quatre conventions de nommage.
    const multi: ClientCandidat[] = [
      {
        id: "c1",
        nom: "Tremblay inc.",
        dossiers: [
          { id: "d1", intitule: "2026-050 — Bail commercial rue Laurier" },
          { id: "d2", intitule: "Divorce" },
          { id: "d3", intitule: "Divorce 2" },
          { id: "d4", intitule: "Dossier 12" },
        ],
      },
    ];
    const pour = (intitule: string | null) =>
      matchFacturePassee({ clientNom: "Tremblay inc.", dossierIntitule: intitule }, multi).dossier;

    // Un intitulé parlant retrouve le dossier numéroté du cabinet.
    expect(pour("Bail commercial rue Laurier")).toMatchObject({ statut: "existant", dossierId: "d1" });

    // Un mot seul ne suffit pas : « Divorce » ne doit pas se coller à « Divorce 2 »,
    // ni l'inverse. Deux dossiers distincts du même client restent distincts.
    expect(pour("Divorce").dossierId).toBe("d2"); // égalité franche, pas inclusion
    expect(pour("Divorce 3").statut).toBe("nouveau");

    // Un numéro court ne prouve rien.
    expect(pour("Dossier 1").statut).toBe("nouveau");

    // Une convention étrangère au cabinet ne rattache rien : un dossier de trop
    // se voit et se corrige, une facture mal rangée ne se voit pas.
    expect(pour("Tremblay c. Ville de Gatineau").statut).toBe("nouveau");
  });

  it("l'inclusion doit tomber sur des mots entiers", () => {
    const clients: ClientCandidat[] = [
      { id: "c1", nom: "ACME", dossiers: [{ id: "d1", intitule: "contre-bail commercialisation" }] },
    ];
    const r = matchFacturePassee({ clientNom: "ACME", dossierIntitule: "bail commercial" }, clients);
    expect(r.dossier.statut).toBe("nouveau");
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
