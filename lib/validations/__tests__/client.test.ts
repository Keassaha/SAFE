import { describe, it, expect } from "vitest";
import { clientSchema } from "../client";

describe("clientSchema", () => {
  describe("personne morale", () => {
    it("accepte un client morale avec raison sociale", () => {
      const r = clientSchema.safeParse({
        typeClient: "personne_morale",
        raisonSociale: "Acme Inc.",
      });
      expect(r.success).toBe(true);
    });

    it("rejette un client morale sans raison sociale", () => {
      const r = clientSchema.safeParse({
        typeClient: "personne_morale",
        raisonSociale: "",
      });
      expect(r.success).toBe(false);
      if (!r.success) {
        expect(r.error.issues.some((i) => i.path[0] === "raisonSociale")).toBe(true);
      }
    });

    it("rejette un client morale avec raisonSociale en espaces seulement", () => {
      const r = clientSchema.safeParse({
        typeClient: "personne_morale",
        raisonSociale: "   ",
      });
      expect(r.success).toBe(false);
    });
  });

  describe("personne physique", () => {
    it("accepte un client physique avec prénom + nom", () => {
      const r = clientSchema.safeParse({
        typeClient: "personne_physique",
        prenom: "Marie",
        nom: "Tremblay",
      });
      expect(r.success).toBe(true);
    });

    it("rejette un client physique sans prénom", () => {
      const r = clientSchema.safeParse({
        typeClient: "personne_physique",
        nom: "Tremblay",
      });
      expect(r.success).toBe(false);
    });

    it("rejette un client physique sans nom", () => {
      const r = clientSchema.safeParse({
        typeClient: "personne_physique",
        prenom: "Marie",
      });
      expect(r.success).toBe(false);
    });

    it("accepte un client physique sans raisonSociale (champ absent du formulaire)", () => {
      // Régression : avant le fix, formData.get('raisonSociale') === null faisait
      // échouer la validation alors que le champ était simplement caché par
      // le rendu conditionnel du wizard (typeClient = personne_physique).
      const r = clientSchema.safeParse({
        typeClient: "personne_physique",
        prenom: "Marie",
        nom: "Tremblay",
        // raisonSociale absent → undefined
      });
      expect(r.success).toBe(true);
    });
  });

  describe("régression : null versus undefined", () => {
    it("rejette explicitement raisonSociale=null (l'action doit normaliser en undefined)", () => {
      // Garantit que clientSchema reste strict sur le typage : null n'est pas un
      // string. La normalisation null → undefined doit être faite côté action
      // serveur (formData.get(...) || undefined), PAS dans le schéma.
      const r = clientSchema.safeParse({
        typeClient: "personne_morale",
        raisonSociale: null,
      });
      expect(r.success).toBe(false);
    });

    it("accepte raisonSociale=undefined si typeClient=personne_physique", () => {
      const r = clientSchema.safeParse({
        typeClient: "personne_physique",
        prenom: "Jane",
        nom: "Doe",
        raisonSociale: undefined,
      });
      expect(r.success).toBe(true);
    });
  });

  describe("typeClient", () => {
    it("défaut à personne_morale si absent", () => {
      const r = clientSchema.safeParse({ raisonSociale: "Acme" });
      expect(r.success).toBe(true);
      if (r.success) {
        expect(r.data.typeClient).toBe("personne_morale");
      }
    });

    it("accepte typeClient = undefined", () => {
      const r = clientSchema.safeParse({
        typeClient: undefined,
        raisonSociale: "Acme",
      });
      expect(r.success).toBe(true);
    });
  });
});
