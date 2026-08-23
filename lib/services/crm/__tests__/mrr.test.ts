import { describe, expect, it } from "vitest";
import { calculerMrr } from "@/lib/services/crm/mrr";

const NOW = new Date("2026-08-23T12:00:00.000Z");
const DEMAIN = new Date("2026-08-24T12:00:00.000Z");
const HIER = new Date("2026-08-22T12:00:00.000Z");

describe("calculerMrr", () => {
  it("compte ce que le cabinet PAIE, pas le prix catalogue", () => {
    // Le cas vécu : Derisier, forfait « cabinet » (299,99 $ au catalogue),
    // tarif fondateur réel 75 $. L'écart était de 4×.
    const r = calculerMrr(
      [{ plan: "cabinet", abonnementMontantMensuel: 75, accesPayeJusquau: DEMAIN }],
      NOW,
    );
    expect(r.montant).toBe(75);
    expect(r.payants).toBe(1);
  });

  it("un essai n'est PAS du revenu, mais reste compté à part", () => {
    const r = calculerMrr([{ plan: "cabinet", stripeSubscriptionStatus: "trialing" }], NOW);
    expect(r.montant).toBe(0);
    expect(r.payants).toBe(0);
    expect(r.enEssai).toBe(1);
  });

  it("un essai expiré sans accès payé ne compte nulle part comme revenu", () => {
    const r = calculerMrr(
      [{ plan: "cabinet", stripeSubscriptionStatus: "trialing", accesPayeJusquau: HIER }],
      NOW,
    );
    expect(r.montant).toBe(0);
  });

  it("un forfait inconnu du catalogue ne disparaît plus quand le montant est connu", () => {
    // « fondateur » n'est pas une clé de PLANS : la cohorte comptait pour zéro.
    const r = calculerMrr(
      [{ plan: "fondateur", abonnementMontantMensuel: 50, accesPayeJusquau: DEMAIN }],
      NOW,
    );
    expect(r.montant).toBe(50);
  });

  it("retombe sur le catalogue quand aucun montant réel n'est enregistré", () => {
    const r = calculerMrr([{ plan: "essentiel", stripeSubscriptionStatus: "active" }], NOW);
    expect(r.montant).toBe(99);
  });

  it("un abonnement Stripe actif compte, même sans accès payé hors Stripe", () => {
    const r = calculerMrr(
      [{ plan: "professionnel", stripeSubscriptionStatus: "active" }],
      NOW,
    );
    expect(r.montant).toBe(149.99);
  });

  it("accepte un Decimal de Prisma aussi bien qu'un nombre", () => {
    const decimal = { toString: () => "75.50" };
    const r = calculerMrr([{ abonnementMontantMensuel: decimal, accesPayeJusquau: DEMAIN }], NOW);
    expect(r.montant).toBe(75.5);
  });

  it("additionne plusieurs abonnés et arrondit au cent", () => {
    const r = calculerMrr(
      [
        { abonnementMontantMensuel: 75, accesPayeJusquau: DEMAIN },
        { abonnementMontantMensuel: 50, accesPayeJusquau: DEMAIN },
        { plan: "professionnel", stripeSubscriptionStatus: "active" },
        { plan: "cabinet", stripeSubscriptionStatus: "trialing" },
      ],
      NOW,
    );
    expect(r.montant).toBe(274.99);
    expect(r.payants).toBe(3);
    expect(r.enEssai).toBe(1);
  });

  it("aucun abonné payant donne zéro, pas un chiffre rassurant", () => {
    expect(calculerMrr([], NOW)).toEqual({ montant: 0, payants: 0, enEssai: 0 });
  });
});
