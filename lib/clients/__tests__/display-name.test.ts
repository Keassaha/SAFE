import { describe, expect, it } from "vitest";
import { displayClientName, displayClientNameOrFallback } from "@/lib/clients/display-name";

describe("displayClientName — résolution canonique du nom client", () => {
  it("retourne raisonSociale si présente", () => {
    expect(displayClientName({ raisonSociale: "Acme Inc.", prenom: "John", nom: "Doe" })).toBe("Acme Inc.");
  });

  it("retourne prenom + nom si raisonSociale est null", () => {
    expect(displayClientName({ raisonSociale: null, prenom: "Ruth", nom: "Kouame" })).toBe("Ruth Kouame");
  });

  it("retourne prenom + nom si raisonSociale est vide ou whitespace", () => {
    expect(displayClientName({ raisonSociale: "   ", prenom: "Ruth", nom: "Kouame" })).toBe("Ruth Kouame");
  });

  it("trim chaque composant — particulier avec espaces parasites", () => {
    // Cas réel observé en base : prenom = "Test ", nom = "client " (espaces de saisie)
    expect(displayClientName({ raisonSociale: null, prenom: "Test ", nom: "client " })).toBe("Test client");
  });

  it("accepte prenom seul ou nom seul", () => {
    expect(displayClientName({ raisonSociale: null, prenom: "Ruth", nom: null })).toBe("Ruth");
    expect(displayClientName({ raisonSociale: null, prenom: null, nom: "Kouame" })).toBe("Kouame");
  });

  it("retourne null si client est null/undefined", () => {
    expect(displayClientName(null)).toBeNull();
    expect(displayClientName(undefined)).toBeNull();
  });

  it("retourne null si tous les champs sont null/vides — pas de chaîne vide silencieuse", () => {
    expect(displayClientName({ raisonSociale: null, prenom: null, nom: null })).toBeNull();
    expect(displayClientName({ raisonSociale: "", prenom: "", nom: "" })).toBeNull();
    expect(displayClientName({ raisonSociale: "   ", prenom: "  ", nom: "" })).toBeNull();
  });
});

describe("displayClientNameOrFallback — garantit qu'aucune ligne d'agrégation honoraires ne perd son client", () => {
  it("retourne 'Client sans nom' par défaut si rien n'est résoluble", () => {
    expect(displayClientNameOrFallback(null)).toBe("Client sans nom");
    expect(displayClientNameOrFallback({ raisonSociale: null, prenom: null, nom: null })).toBe("Client sans nom");
  });

  it("personne physique sans raisonSociale est conservée — invariant Facturables/Par client", () => {
    // Régression : avant correction, une fiche de temps d'un particulier
    // (raisonSociale = null) tombait du Map d'agrégation et "Par client"
    // affichait "Aucun honoraire à facturer" alors que le KPI comptait 1.
    expect(
      displayClientNameOrFallback({ raisonSociale: null, prenom: "Ruth-Esther", nom: "Kouame" }),
    ).toBe("Ruth-Esther Kouame");
  });

  it("personne morale conservée même quand prenom/nom sont vides", () => {
    expect(displayClientNameOrFallback({ raisonSociale: "Cabinet X", prenom: null, nom: null })).toBe("Cabinet X");
  });

  it("fallback paramétrable", () => {
    expect(displayClientNameOrFallback(null, "—")).toBe("—");
  });
});
