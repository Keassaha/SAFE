import { describe, expect, it } from "vitest";
import { deriveCabinetSubscriptionState } from "@/lib/services/subscription-state";
import {
  isSubscriptionExemptPath,
  shouldBlockForSubscription,
} from "@/lib/services/subscription-guard";

/** Horloge figée : la règle ne doit jamais dépendre du moment où le test tourne. */
const NOW = new Date("2026-08-20T12:00:00.000Z");
const DEMAIN = new Date("2026-08-21T12:00:00.000Z");
const HIER = new Date("2026-08-19T12:00:00.000Z");

describe("deriveCabinetSubscriptionState — source Stripe", () => {
  it("active et trialing donnent accès", () => {
    expect(deriveCabinetSubscriptionState({ plan: "professionnel", stripeSubscriptionStatus: "active" }).active).toBe(true);
    const trialing = deriveCabinetSubscriptionState({ plan: "professionnel", stripeSubscriptionStatus: "trialing" });
    expect(trialing.active).toBe(true);
    expect(trialing.isTrialing).toBe(true);
  });

  it("canceled, unpaid et null bloquent", () => {
    expect(deriveCabinetSubscriptionState({ plan: "essentiel", stripeSubscriptionStatus: "canceled" }).active).toBe(false);
    expect(deriveCabinetSubscriptionState({ plan: "essentiel", stripeSubscriptionStatus: "unpaid" }).active).toBe(false);
    expect(deriveCabinetSubscriptionState({ plan: "essentiel", stripeSubscriptionStatus: null }).active).toBe(false);
  });

  it("un cabinet sans aucune des deux sources est refusé pour absence d'abonnement", () => {
    const s = deriveCabinetSubscriptionState({ plan: "essentiel", stripeSubscriptionStatus: null }, NOW);
    expect(s.source).toBeNull();
    expect(s.reason).toBe("no_active_subscription");
  });
});

describe("deriveCabinetSubscriptionState — source accès payé (Interac)", () => {
  it("une échéance future donne accès sans aucun abonnement Stripe", () => {
    const s = deriveCabinetSubscriptionState(
      { plan: "essentiel", stripeSubscriptionStatus: null, accesPayeJusquau: DEMAIN },
      NOW,
    );
    expect(s.active).toBe(true);
    expect(s.source).toBe("acces_paye");
    expect(s.reason).toBeNull();
  });

  it("une échéance passée ne donne pas accès", () => {
    const s = deriveCabinetSubscriptionState(
      { plan: "essentiel", stripeSubscriptionStatus: null, accesPayeJusquau: HIER },
      NOW,
    );
    expect(s.active).toBe(false);
    expect(s.source).toBeNull();
  });

  it("le jour même de l'échéance donne encore accès (date incluse)", () => {
    const s = deriveCabinetSubscriptionState(
      { plan: "essentiel", stripeSubscriptionStatus: null, accesPayeJusquau: NOW },
      NOW,
    );
    expect(s.active).toBe(true);
  });

  it("un accès payé prime sur un abonnement Stripe annulé", () => {
    // Le cas qui motive toute la règle : le cabinet a viré son mois par Interac,
    // son abonnement Stripe historique est mort. Le bloquer serait un faux refus.
    const s = deriveCabinetSubscriptionState(
      { plan: "essentiel", stripeSubscriptionStatus: "canceled", accesPayeJusquau: DEMAIN },
      NOW,
    );
    expect(s.active).toBe(true);
    expect(s.source).toBe("acces_paye");
  });

  it("une échéance expirée est distinguée d'une absence d'abonnement", () => {
    const s = deriveCabinetSubscriptionState(
      { plan: "essentiel", stripeSubscriptionStatus: null, accesPayeJusquau: HIER },
      NOW,
    );
    expect(s.reason).toBe("acces_expire");
  });

  it("l'échéance affichée est celle de la source qui donne réellement l'accès", () => {
    const s = deriveCabinetSubscriptionState(
      {
        plan: "essentiel",
        stripeSubscriptionStatus: null,
        stripeCurrentPeriodEnd: HIER,
        accesPayeJusquau: DEMAIN,
      },
      NOW,
    );
    expect(s.currentPeriodEnd).toEqual(DEMAIN);
  });

  it("un accès payé n'est jamais présenté comme un essai", () => {
    const s = deriveCabinetSubscriptionState(
      { plan: "essentiel", stripeSubscriptionStatus: null, accesPayeJusquau: DEMAIN },
      NOW,
    );
    expect(s.isTrialing).toBe(false);
  });
});

describe("deriveCabinetSubscriptionState — cohabitation des deux sources", () => {
  it("Stripe prime quand les deux sont valides", () => {
    const s = deriveCabinetSubscriptionState(
      {
        plan: "essentiel",
        stripeSubscriptionStatus: "active",
        stripeCurrentPeriodEnd: DEMAIN,
        accesPayeJusquau: DEMAIN,
      },
      NOW,
    );
    expect(s.source).toBe("stripe");
  });

  it("l'absence d'échéance laisse le comportement Stripe inchangé", () => {
    // Non-régression : tout cabinet existant a `accesPayeJusquau = NULL`.
    const avant = deriveCabinetSubscriptionState({ plan: "essentiel", stripeSubscriptionStatus: "active" }, NOW);
    expect(avant.active).toBe(true);
    expect(avant.source).toBe("stripe");
    expect(avant.accesPayeJusquau).toBeNull();
  });
});

describe("subscription guard", () => {
  it("la page abonnement reste accessible sans abonnement actif", () => {
    expect(isSubscriptionExemptPath("/parametres/abonnement")).toBe(true);
    expect(shouldBlockForSubscription("/parametres/abonnement", { active: false })).toBe(false);
  });

  it("ne bloque plus les pages app sans abonnement actif", () => {
    // Comportement CHANGÉ volontairement le 2026-08-20 : le mur enfermait un
    // cabinet réel avec ses données dedans. La créance est passée au centre
    // d'alertes. Le mur reste rallumable, cf. le bloc dédié plus bas.
    expect(shouldBlockForSubscription("/tableau-de-bord", { active: false })).toBe(false);
    expect(shouldBlockForSubscription("/facturation", { active: false })).toBe(false);
    expect(shouldBlockForSubscription("/facturation", { active: true })).toBe(false);
  });

  it("un accès payé par Interac débloque les pages app", () => {
    const s = deriveCabinetSubscriptionState(
      { plan: "essentiel", stripeSubscriptionStatus: null, accesPayeJusquau: DEMAIN },
      NOW,
    );
    expect(shouldBlockForSubscription("/tableau-de-bord", s)).toBe(false);
  });
});

describe("le mur d'abonnement n'enferme plus personne", () => {
  it("un cabinet sans abonnement travaille normalement", () => {
    // Le cas vécu : jamais de ligne Stripe, donc `active: false`, donc l'écran
    // « abonnement requis » à chaque chargement de page. Il ne bloque plus.
    expect(shouldBlockForSubscription("/tableau-de-bord", { active: false })).toBe(false);
    expect(shouldBlockForSubscription("/facturation", { active: false })).toBe(false);
    expect(shouldBlockForSubscription("/comptes", { active: false })).toBe(false);
  });

  it("un abonnement actif ne bloque évidemment rien", () => {
    expect(shouldBlockForSubscription("/tableau-de-bord", { active: true })).toBe(false);
  });

  it("l'interrupteur rallume le mur exactement comme avant", () => {
    const avant = process.env.SAFE_BLOCAGE_ABONNEMENT;
    process.env.SAFE_BLOCAGE_ABONNEMENT = "on";
    try {
      expect(shouldBlockForSubscription("/tableau-de-bord", { active: false })).toBe(true);
      expect(shouldBlockForSubscription("/facturation", { active: false })).toBe(true);
      // La page d'abonnement reste la porte de sortie.
      expect(shouldBlockForSubscription("/parametres/abonnement", { active: false })).toBe(false);
      // Un abonnement actif passe, mur allumé ou non.
      expect(shouldBlockForSubscription("/tableau-de-bord", { active: true })).toBe(false);
    } finally {
      if (avant == null) delete process.env.SAFE_BLOCAGE_ABONNEMENT;
      else process.env.SAFE_BLOCAGE_ABONNEMENT = avant;
    }
  });

  it("une valeur qui n'est pas une activation explicite laisse le mur éteint", () => {
    const avant = process.env.SAFE_BLOCAGE_ABONNEMENT;
    for (const v of ["off", "false", "0", "", "peut-être"]) {
      process.env.SAFE_BLOCAGE_ABONNEMENT = v;
      expect(shouldBlockForSubscription("/tableau-de-bord", { active: false })).toBe(false);
    }
    if (avant == null) delete process.env.SAFE_BLOCAGE_ABONNEMENT;
    else process.env.SAFE_BLOCAGE_ABONNEMENT = avant;
  });
});

/**
 * C-08 — l'accès était décidé par un statut que rien ne met à jour.
 *
 * Le cas de référence est réel : un cabinet en essai depuis le 7 juin, essai
 * terminé depuis onze semaines, à qui l'application annonçait toujours un
 * abonnement actif. Le statut Stripe est écrit une fois puis jamais relu ;
 * seule la date dit ce qui s'est passé depuis.
 */
describe("échéance de l'abonnement Stripe", () => {
  const t0 = new Date("2026-08-23T12:00:00Z");
  const jours = (n: number) => new Date(t0.getTime() + n * 86400000);

  it("refuse l'accès quand l'essai est terminé", () => {
    const etat = deriveCabinetSubscriptionState(
      { plan: "cabinet", stripeSubscriptionStatus: "trialing", stripeTrialEnd: jours(-77) },
      t0,
    );
    expect(etat.active).toBe(false);
    expect(etat.isTrialing).toBe(false);
    expect(etat.reason).toBe("essai_expire");
    expect(etat.source).toBeNull();
  });

  it("laisse travailler un essai encore en cours", () => {
    const etat = deriveCabinetSubscriptionState(
      { plan: "cabinet", stripeSubscriptionStatus: "trialing", stripeTrialEnd: jours(25) },
      t0,
    );
    expect(etat.active).toBe(true);
    expect(etat.isTrialing).toBe(true);
    expect(etat.source).toBe("stripe");
  });

  it("garde l'accès le jour même où l'essai se termine", () => {
    const etat = deriveCabinetSubscriptionState(
      { plan: "cabinet", stripeSubscriptionStatus: "trialing", stripeTrialEnd: t0 },
      t0,
    );
    expect(etat.active).toBe(true);
  });

  /* Le doute profite au cabinet : une date absente ne prouve pas une expiration,
     et le prix d'une erreur n'est pas symétrique. */
  it("garde l'accès quand aucune échéance n'est enregistrée", () => {
    expect(
      deriveCabinetSubscriptionState(
        { plan: "cabinet", stripeSubscriptionStatus: "active" },
        t0,
      ).active,
    ).toBe(true);
    expect(
      deriveCabinetSubscriptionState(
        { plan: "cabinet", stripeSubscriptionStatus: "trialing" },
        t0,
      ).active,
    ).toBe(true);
  });

  it("tolère trois jours de retard sur un renouvellement, pas dix", () => {
    const enVol = deriveCabinetSubscriptionState(
      { plan: "cabinet", stripeSubscriptionStatus: "active", stripeCurrentPeriodEnd: jours(-2) },
      t0,
    );
    expect(enVol.active).toBe(true);

    const abandonne = deriveCabinetSubscriptionState(
      { plan: "cabinet", stripeSubscriptionStatus: "active", stripeCurrentPeriodEnd: jours(-10) },
      t0,
    );
    expect(abandonne.active).toBe(false);
    expect(abandonne.reason).toBe("abonnement_expire");
  });

  /* La fin d'un essai n'est pas un renouvellement en vol : rien ne la confirme
     après coup, donc elle ne mérite aucune tolérance. */
  it("n'accorde aucune tolérance à un essai terminé la veille", () => {
    expect(
      deriveCabinetSubscriptionState(
        { plan: "cabinet", stripeSubscriptionStatus: "trialing", stripeTrialEnd: jours(-1) },
        t0,
      ).active,
    ).toBe(false);
  });

  it("un virement confirmé rattrape un essai terminé", () => {
    const etat = deriveCabinetSubscriptionState(
      {
        plan: "cabinet",
        stripeSubscriptionStatus: "trialing",
        stripeTrialEnd: jours(-77),
        accesPayeJusquau: jours(20),
      },
      t0,
    );
    expect(etat.active).toBe(true);
    expect(etat.source).toBe("acces_paye");
    expect(etat.currentPeriodEnd).toEqual(jours(20));
  });

  /* Un cabinet qui a déjà payé par virement doit lire son virement, pas une
     ligne Stripe dont il n'a jamais entendu parler. */
  it("annonce l'accès payé expiré plutôt que l'essai expiré", () => {
    const etat = deriveCabinetSubscriptionState(
      {
        plan: "cabinet",
        stripeSubscriptionStatus: "trialing",
        stripeTrialEnd: jours(-77),
        accesPayeJusquau: jours(-3),
      },
      t0,
    );
    expect(etat.active).toBe(false);
    expect(etat.reason).toBe("acces_expire");
  });

  /* Tout motif renvoyé ici doit avoir une phrase dans les deux langues, sinon
     le cabinet lit un repli générique qui ne décrit pas sa situation. */
  it("chaque motif de refus a un libellé traduit", async () => {
    const fr = (await import("@/messages/fr.json")).default;
    const en = (await import("@/messages/en.json")).default;
    const motifs = [
      deriveCabinetSubscriptionState(
        { plan: "cabinet", stripeSubscriptionStatus: "trialing", stripeTrialEnd: jours(-1) },
        t0,
      ).reason,
      deriveCabinetSubscriptionState(
        { plan: "cabinet", stripeSubscriptionStatus: "active", stripeCurrentPeriodEnd: jours(-10) },
        t0,
      ).reason,
    ];
    for (const motif of motifs) {
      expect(Object.keys(fr.abonnementAlerte)).toContain(motif);
      expect(Object.keys(en.abonnementAlerte)).toContain(motif);
    }
  });
});
