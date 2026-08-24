import { describe, expect, it } from "vitest";
import {
  limiteUtilisateurs,
  peutAjouterUnUtilisateur,
} from "@/lib/services/abonnement/places";

describe("limiteUtilisateurs", () => {
  it("lit la limite des forfaits du catalogue", () => {
    expect(limiteUtilisateurs("essentiel")).toBe(1);
    expect(limiteUtilisateurs("professionnel")).toBe(5);
  });

  it("le forfait illimité ne porte aucune limite", () => {
    expect(limiteUtilisateurs("cabinet")).toBeNull();
  });

  it("un forfait INCONNU ne porte aucune limite", () => {
    /* « fondateur » n'est pas une clé du catalogue. Un fondateur a acheté une
       offre négociée : lui appliquer un plafond qu'il n'a jamais vu serait lui
       retirer ce qu'on lui a vendu. */
    expect(limiteUtilisateurs("fondateur")).toBeNull();
    expect(limiteUtilisateurs(null)).toBeNull();
    expect(limiteUtilisateurs(undefined)).toBeNull();
  });
});

describe("peutAjouterUnUtilisateur", () => {
  it("laisse ajouter tant qu'il reste une place", () => {
    expect(peutAjouterUnUtilisateur({ plan: "professionnel", utilisateursActifs: 3 })).toEqual({
      autorise: true,
      restantes: 2,
    });
  });

  it("REFUSE quand le forfait est plein", () => {
    const r = peutAjouterUnUtilisateur({ plan: "essentiel", utilisateursActifs: 1 });
    expect(r).toEqual({ autorise: false, limite: 1, actuels: 1 });
  });

  it("n'ampute JAMAIS un cabinet déjà au-dessus de la limite", () => {
    /* Cabinet Test a deux comptes sur un forfait à une place. La règle ne vaut
       que pour les AJOUTS : on ne retire pas un accès à quelqu'un parce qu'un
       plafond a changé. Elle refuse le troisième, elle ne touche pas aux deux. */
    const r = peutAjouterUnUtilisateur({ plan: "essentiel", utilisateursActifs: 2 });
    expect(r.autorise).toBe(false);
    expect(!r.autorise && r.actuels).toBe(2);
  });

  it("le forfait illimité accepte toujours", () => {
    expect(peutAjouterUnUtilisateur({ plan: "cabinet", utilisateursActifs: 40 })).toEqual({
      autorise: true,
      restantes: null,
    });
  });

  it("un forfait inconnu accepte toujours", () => {
    expect(
      peutAjouterUnUtilisateur({ plan: "fondateur", utilisateursActifs: 12 }).autorise,
    ).toBe(true);
  });
});

describe("les limites retirées ne sont plus déclarées", () => {
  it("PLANS ne promet plus que ce qui est appliqué", async () => {
    /* Cinq limites décrivaient un produit inexistant, dont
       `essentiel.trustAccounts: false` — alors que la page publique vend Solo
       sur « Fidéicommis, dossiers, temps et facturation ». Les redéclarer sans
       les appliquer referait mentir la carte de prix. */
    const { PLANS } = await import("@/lib/stripe");
    for (const forfait of Object.values(PLANS)) {
      expect(Object.keys(forfait.features)).toEqual(["maxUsers"]);
    }
  });
});
