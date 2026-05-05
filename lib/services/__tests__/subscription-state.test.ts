import { describe, expect, it } from "vitest";
import { deriveCabinetSubscriptionState } from "@/lib/services/subscription-state";
import {
  isSubscriptionExemptPath,
  shouldBlockForSubscription,
} from "@/lib/services/subscription-guard";

describe("deriveCabinetSubscriptionState", () => {
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
});

describe("subscription guard", () => {
  it("la page abonnement reste accessible sans abonnement actif", () => {
    expect(isSubscriptionExemptPath("/parametres/abonnement")).toBe(true);
    expect(shouldBlockForSubscription("/parametres/abonnement", { active: false })).toBe(false);
  });

  it("bloque les pages app ordinaires sans abonnement actif", () => {
    expect(shouldBlockForSubscription("/tableau-de-bord", { active: false })).toBe(true);
    expect(shouldBlockForSubscription("/facturation", { active: false })).toBe(true);
    expect(shouldBlockForSubscription("/facturation", { active: true })).toBe(false);
  });
});
