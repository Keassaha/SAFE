import { describe, expect, it } from "vitest";
import { adresseDeReponse } from "@/lib/email";

/**
 * Lot 0 de SAFE Correspondance : le client doit pouvoir répondre à son avocate.
 * Un `Reply-To` mal formé fait rejeter TOUT le message par le fournisseur, donc
 * la fonction préfère rendre `undefined` plutôt qu'une valeur douteuse.
 */
describe("adresseDeReponse", () => {
  it("garde une adresse valide, sans espace autour", () => {
    expect(adresseDeReponse("  me@derisierlaw.ca ")).toBe("me@derisierlaw.ca");
  });

  it("rend undefined quand le cabinet n'a pas d'adresse", () => {
    expect(adresseDeReponse(null)).toBeUndefined();
    expect(adresseDeReponse(undefined)).toBeUndefined();
    expect(adresseDeReponse("   ")).toBeUndefined();
  });

  it("refuse ce qui n'est pas une adresse", () => {
    expect(adresseDeReponse("Cabinet Derisier")).toBeUndefined();
  });

  it("refuse une adresse porteuse d'espaces ou de séparateurs d'en-tête", () => {
    // Deux destinataires, un chevron ou un point-virgule dans un Reply-To
    // cassent l'en-tête. On n'envoie rien plutôt que d'envoyer de travers.
    expect(adresseDeReponse("a@a.ca, b@b.ca")).toBeUndefined();
    expect(adresseDeReponse("a@a.ca; b@b.ca")).toBeUndefined();
    expect(adresseDeReponse("Cabinet <a@a.ca>")).toBeUndefined();
    expect(adresseDeReponse("a b@a.ca")).toBeUndefined();
  });
});
