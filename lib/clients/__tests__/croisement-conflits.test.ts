import { describe, it, expect } from "vitest";
import {
  croiserConflits,
  compterParGravite,
  cleCroisement,
  type EntiteCroisement,
} from "../croisement-conflits";

/** Un client, avec sa clé calculée par la règle commune du produit. */
function client(id: string, prenom: string, nom: string, email?: string): EntiteCroisement {
  return {
    id,
    nature: "client",
    libelle: `${prenom} ${nom}`,
    cle: cleCroisement(`${prenom} ${nom}`),
    email: email ?? null,
  };
}

function partie(
  id: string,
  nomAffiche: string,
  o: { nature?: "partie_adverse" | "tiers"; dossierIntitule?: string; dossierClientId?: string } = {},
): EntiteCroisement {
  return {
    id,
    nature: o.nature ?? "partie_adverse",
    libelle: nomAffiche,
    cle: cleCroisement(nomAffiche),
    dossierId: `d-${id}`,
    dossierIntitule: o.dossierIntitule ?? "Un dossier",
    dossierClientId: o.dossierClientId ?? "autre-client",
  };
}

describe("croiserConflits", () => {
  it("ne trouve rien quand personne ne se ressemble", () => {
    expect(croiserConflits([client("c1", "Marielle", "Aubin"), partie("p1", "Entrepôts Chaudière inc.")])).toEqual([]);
  });

  it("signale un conflit quand un client est partie adverse ailleurs", () => {
    const resultat = croiserConflits([
      client("c1", "Marielle", "Aubin"),
      partie("p1", "Marielle Aubin", { dossierIntitule: "Tremblay c. Aubin" }),
    ]);
    expect(resultat).toHaveLength(1);
    expect(resultat[0].gravite).toBe("conflit");
    expect(resultat[0].a.id).toBe("c1");
    expect(resultat[0].explication).toContain("Tremblay c. Aubin");
  });

  it("nomme doublon, et non conflit, deux fiches du même client", () => {
    const resultat = croiserConflits([client("c1", "Marielle", "Aubin"), client("c2", "Marielle", "Aubin")]);
    expect(resultat).toHaveLength(1);
    expect(resultat[0].gravite).toBe("doublon");
  });

  it("classe le conflit avant le doublon et le doublon avant le signal", () => {
    const resultat = croiserConflits([
      client("c1", "Marielle", "Aubin"),
      client("c2", "Marielle", "Aubin"),
      partie("p1", "Marielle Aubin"),
      client("c3", "Jean", "Bédard"),
      partie("p2", "Jean Bédard", { nature: "tiers" }),
    ]);
    expect(resultat.map((r) => r.gravite)).toEqual(["conflit", "conflit", "doublon", "signal"]);
  });

  it("écarte deux parties adverses portant le même nom", () => {
    // Le même adversaire dans deux dossiers est courant et ne dit rien de nous.
    const resultat = croiserConflits([
      partie("p1", "Entrepôts Chaudière inc.", { dossierIntitule: "Dossier A" }),
      partie("p2", "Entrepôts Chaudière", { dossierIntitule: "Dossier B" }),
    ]);
    expect(resultat).toEqual([]);
  });

  it("écarte une partie rattachée au dossier de ce client même", () => {
    // Erreur de saisie, pas conflit : le signaler ferait douter du reste.
    const resultat = croiserConflits([
      client("c1", "Marielle", "Aubin"),
      partie("p1", "Marielle Aubin", { dossierClientId: "c1" }),
    ]);
    expect(resultat).toEqual([]);
  });

  it("rapproche par le courriel quand le nom a changé", () => {
    const resultat = croiserConflits([
      client("c1", "Marielle", "Aubin", "m.aubin@courriel.ca"),
      client("c2", "Marielle", "Tremblay", "M.Aubin@Courriel.ca"),
    ]);
    expect(resultat).toHaveLength(1);
    expect(resultat[0].gravite).toBe("doublon");
    expect(resultat[0].motif).toBe("courriel");
  });

  it("ne montre qu'une fois une paire rapprochée par le nom ET par le courriel", () => {
    const resultat = croiserConflits([
      client("c1", "Marielle", "Aubin", "m.aubin@courriel.ca"),
      client("c2", "Marielle", "Aubin", "m.aubin@courriel.ca"),
    ]);
    expect(resultat).toHaveLength(1);
    expect(resultat[0].motif).toBe("nom");
  });

  it("ignore les entités sans nom exploitable plutôt que de les rapprocher entre elles", () => {
    const vide = (id: string): EntiteCroisement => ({ id, nature: "client", libelle: "", cle: "" });
    expect(croiserConflits([vide("c1"), vide("c2")])).toEqual([]);
  });

  it("absorbe les formes juridiques et l'inversion du prénom et du nom", () => {
    // La normalisation vient de `normalizeClientName`, partagée avec le produit.
    const resultat = croiserConflits([
      { id: "c1", nature: "client", libelle: "Acme Inc.", cle: cleCroisement("Acme Inc.") },
      partie("p1", "ACME, Incorporated"),
    ]);
    expect(resultat.map((r) => r.gravite)).toEqual(["conflit"]);

    const inverse = croiserConflits([client("c1", "Marielle", "Aubin"), client("c2", "Aubin", "Marielle")]);
    expect(inverse).toHaveLength(1);
  });

  it("produit une seule ligne par paire même dans un groupe de trois homonymes", () => {
    const resultat = croiserConflits([
      client("c1", "Jean", "Tremblay"),
      client("c2", "Jean", "Tremblay"),
      client("c3", "Jean", "Tremblay"),
    ]);
    expect(resultat).toHaveLength(3); // c1-c2, c1-c3, c2-c3
  });
});

describe("compterParGravite", () => {
  it("compte chaque gravité, y compris celles à zéro", () => {
    const resultat = croiserConflits([
      client("c1", "Marielle", "Aubin"),
      partie("p1", "Marielle Aubin"),
      client("c2", "Jean", "Bédard"),
      client("c3", "Jean", "Bédard"),
    ]);
    expect(compterParGravite(resultat)).toEqual({ conflit: 1, doublon: 1, signal: 0 });
  });
});
