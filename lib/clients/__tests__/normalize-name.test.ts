import { describe, it, expect } from "vitest";
import { normalizeClientName, clientDedupeKey, clientDisplayName, clientNomListe, clientNomDocument } from "../normalize-name";

describe("clientDisplayName", () => {
  it("utilise la raison sociale pour une personne morale", () => {
    expect(clientDisplayName({ raisonSociale: "Acme Inc." })).toBe("Acme Inc.");
  });

  it("retombe sur prénom + nom quand raisonSociale est null (personne physique)", () => {
    expect(
      clientDisplayName({ raisonSociale: null, prenom: "Marie", nom: "Tremblay" }),
    ).toBe("Marie Tremblay");
  });

  it("gère prénom ou nom manquant", () => {
    expect(clientDisplayName({ prenom: "Marie", nom: null })).toBe("Marie");
    expect(clientDisplayName({ prenom: null, nom: "Tremblay" })).toBe("Tremblay");
  });

  it("retourne le repli par défaut quand aucun nom n'est disponible", () => {
    expect(clientDisplayName({})).toBe("—");
    expect(clientDisplayName({ raisonSociale: "  " })).toBe("—");
    expect(clientDisplayName({}, "Sans client")).toBe("Sans client");
  });
});

describe("normalizeClientName", () => {
  it("retourne une chaîne vide pour une entrée vide ou nulle", () => {
    expect(normalizeClientName("")).toBe("");
    expect(normalizeClientName(null)).toBe("");
    expect(normalizeClientName(undefined)).toBe("");
  });

  it("ignore la casse", () => {
    expect(normalizeClientName("ACME")).toBe(normalizeClientName("acme"));
    expect(normalizeClientName("Acme")).toBe(normalizeClientName("ACME"));
  });

  it("ignore les accents", () => {
    expect(normalizeClientName("Société Générale")).toBe(normalizeClientName("Societe Generale"));
    expect(normalizeClientName("Café Du Coin")).toBe("cafe du coin");
    expect(normalizeClientName("Hôtel-Dieu")).toBe("hotel dieu");
  });

  it("ignore les espaces multiples et autour", () => {
    expect(normalizeClientName("  Acme   Inc.  ")).toBe(normalizeClientName("Acme Inc."));
    expect(normalizeClientName("Café  Du  Coin")).toBe("cafe du coin");
  });

  it("ignore la ponctuation usuelle", () => {
    expect(normalizeClientName("Smith, Jones & Co.")).toBe(normalizeClientName("Smith Jones"));
    expect(normalizeClientName("Acme/Plus")).toBe("acme plus");
    expect(normalizeClientName("Marie d'Or")).toBe("marie d or");
  });

  it("ignore les abréviations légales courantes", () => {
    expect(normalizeClientName("Acme Inc.")).toBe("acme");
    expect(normalizeClientName("Acme Ltée")).toBe("acme");
    expect(normalizeClientName("Acme Corp.")).toBe("acme");
    expect(normalizeClientName("Acme LLP")).toBe("acme");
    expect(normalizeClientName("Acme S.A.")).toBe("acme");
  });

  it("préserve les noms réellement distincts", () => {
    expect(normalizeClientName("Acme")).not.toBe(normalizeClientName("Acme Holdings"));
    expect(normalizeClientName("Tremblay")).not.toBe(normalizeClientName("Tremblay Junior"));
    expect(normalizeClientName("Smith")).not.toBe(normalizeClientName("Smith & Wesson"));
  });
});

describe("clientDedupeKey", () => {
  it("normalise une raison sociale (personne morale)", () => {
    const a = clientDedupeKey({ typeClient: "personne_morale", raisonSociale: "Acme Inc." });
    const b = clientDedupeKey({ typeClient: "personne_morale", raisonSociale: "ACME, INC" });
    expect(a).toBe(b);
    expect(a).toBe("acme");
  });

  it("combine prénom + nom (personne physique)", () => {
    const a = clientDedupeKey({ typeClient: "personne_physique", prenom: "Marie", nom: "Tremblay" });
    const b = clientDedupeKey({ typeClient: "personne_physique", prenom: "marie", nom: "TREMBLAY" });
    expect(a).toBe(b);
    expect(a).not.toBe("");
  });

  it("absorbe l'inversion prénom / nom", () => {
    const a = clientDedupeKey({ typeClient: "personne_physique", prenom: "Marie", nom: "Tremblay" });
    const b = clientDedupeKey({ typeClient: "personne_physique", prenom: "Tremblay", nom: "Marie" });
    expect(a).toBe(b);
  });

  it("traite Marie Tremblay vs Marie-Eve Tremblay comme distincts", () => {
    const a = clientDedupeKey({ typeClient: "personne_physique", prenom: "Marie", nom: "Tremblay" });
    const b = clientDedupeKey({ typeClient: "personne_physique", prenom: "Marie-Eve", nom: "Tremblay" });
    expect(a).not.toBe(b);
  });

  it("retourne une clé vide si aucun nom utilisable", () => {
    expect(clientDedupeKey({ typeClient: "personne_morale" })).toBe("");
    expect(clientDedupeKey({ typeClient: "personne_physique", prenom: "", nom: "" })).toBe("");
  });

  it("tombe en fallback sur raisonSociale si type physique mais nom vide", () => {
    const key = clientDedupeKey({
      typeClient: "personne_physique",
      prenom: null,
      nom: null,
      raisonSociale: "Marie Tremblay",
    });
    expect(key).toBe("marie tremblay");
  });
});

describe("clientNomListe / clientNomDocument (règle CEO du 2026-10-01)", () => {
  it("écrit une personne « Nom, Prénom » dans une liste", () => {
    expect(clientNomListe({ typeClient: "personne_physique", prenom: "Marie", nom: "Tremblay" })).toBe("Tremblay, Marie");
  });
  it("écrit la même personne « Prénom Nom » dans un document", () => {
    expect(clientNomDocument({ prenom: "Marie", nom: "Tremblay" })).toBe("Marie Tremblay");
  });
  it("garde la raison sociale d'une personne morale", () => {
    expect(clientNomListe({ typeClient: "personne_morale", raisonSociale: "Constructions Beaulieu inc." })).toBe("Constructions Beaulieu inc.");
  });
  it("préfère le nom de la personne physique à une raison sociale résiduelle", () => {
    expect(clientNomListe({ typeClient: "personne_physique", raisonSociale: "Ancien nom", prenom: "Marie", nom: "Tremblay" })).toBe("Tremblay, Marie");
  });
  it("sans type, retombe sur la raison sociale puis sur Nom, Prénom", () => {
    expect(clientNomListe({ prenom: "Marie", nom: "Tremblay" })).toBe("Tremblay, Marie");
    expect(clientNomListe({ raisonSociale: "Acme" , prenom: "X", nom: "Y" })).toBe("Acme");
  });
  it("n'écrit ni virgule orpheline ni espaces", () => {
    expect(clientNomListe({ prenom: " ", nom: "Tremblay" })).toBe("Tremblay");
    expect(clientNomListe({}, "?")).toBe("?");
  });
});
