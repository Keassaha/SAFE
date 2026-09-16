import { describe, it, expect } from "vitest";
import { MemoireDuLot } from "@/lib/services/reprise-historique/memoire-du-lot";
import type { FactureRepriseSaisie } from "@/lib/services/reprise-historique/construire-lot";

function facture(
  id: string,
  clientNom: string,
  dossierIntitule: string,
  connu?: { clientId?: string; dossierId?: string },
): FactureRepriseSaisie {
  return {
    id,
    fichierNom: `${id}.pdf`,
    statutPaiement: "impayee",
    datePaiement: null,
    match: {
      client: connu?.clientId
        ? { statut: "existant", clientId: connu.clientId, clientNom }
        : { statut: "nouveau", clientId: null, clientNom },
      dossier: connu?.dossierId
        ? { statut: "existant", dossierId: connu.dossierId, dossierIntitule }
        : { statut: "nouveau", dossierId: null, dossierIntitule },
    },
    extraction: {
      numeroFacture: id,
      clientNom,
      dossierIntitule,
      dateEmission: "2026-04-10",
      montantTotal: 100,
      tps: null,
      tvq: null,
      lignes: [],
      confianceOcr: "haute",
      champsIllisibles: [],
    },
  };
}

describe("MemoireDuLot — un même client déposé deux fois ne fait qu'une fiche", () => {
  it("la deuxième facture du même client inconnu retrouve le client créé", () => {
    const memoire = new MemoireDuLot();
    const premiere = facture("f1", "Société Kaboré et fils", "Bail commercial");
    memoire.retenir(premiere, { clientId: "c-neuf", dossierId: "d-neuf" });

    const seconde = memoire.appliquer(facture("f2", "Société Kaboré et fils", "Réclamation"));
    expect(seconde.match.client).toEqual({
      statut: "existant",
      clientId: "c-neuf",
      clientNom: "Société Kaboré et fils",
    });
    // Dossier différent : il reste à créer.
    expect(seconde.match.dossier.statut).toBe("nouveau");
  });

  it("retrouve aussi le dossier quand l'intitulé est le même", () => {
    const memoire = new MemoireDuLot();
    memoire.retenir(facture("f1", "Nadine Ouellet", "Séparation de corps"), {
      clientId: "c1",
      dossierId: "d1",
    });

    const seconde = memoire.appliquer(facture("f2", "Nadine Ouellet", "séparation de CORPS"));
    expect(seconde.match.dossier).toEqual({
      statut: "existant",
      dossierId: "d1",
      dossierIntitule: "séparation de CORPS",
    });
  });

  it("reconnaît le client même si les mots du nom sont dans un autre ordre", () => {
    const memoire = new MemoireDuLot();
    memoire.retenir(facture("f1", "Nadine Ouellet", "Dossier"), { clientId: "c1", dossierId: "d1" });

    const seconde = memoire.appliquer(facture("f2", "Ouellet Nadine", "Dossier"));
    expect(seconde.match.client.clientId).toBe("c1");
  });

  it("ne mélange pas deux clients différents", () => {
    const memoire = new MemoireDuLot();
    memoire.retenir(facture("f1", "Nadine Ouellet", "Dossier"), { clientId: "c1", dossierId: "d1" });

    const autre = memoire.appliquer(facture("f2", "Transport Gatineau-Ottawa inc.", "Dossier"));
    expect(autre.match.client.statut).toBe("nouveau");
    expect(autre.match.client.clientId).toBeNull();
  });

  it("laisse intacte une facture déjà rapprochée d'un client de la base", () => {
    const memoire = new MemoireDuLot();
    const deja = facture("f1", "Nadine Ouellet", "Séparation", { clientId: "base-1", dossierId: "base-d" });
    expect(memoire.appliquer(deja).match).toEqual(deja.match);
  });

  it("une mémoire vide ne change rien", () => {
    const vierge = facture("f1", "Client inconnu", "Dossier");
    expect(new MemoireDuLot().appliquer(vierge)).toEqual(vierge);
  });
});
