import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-04-30.basil",
  typescript: true,
});

// Plans SAFE — correspondance avec Stripe Price IDs
// Ces IDs seront créés automatiquement au premier démarrage via /api/stripe/setup
export const PLANS = {
  essentiel: {
    name: "Essentiel",
    price: 8900, // en cents
    currency: "cad",
    interval: "month" as const,
    features: {
      maxUsers: 1,
      trustAccounts: false,
      virtualEmployees: false,
      clientPortal: false,
      advancedReports: false,
      api: false,
    },
  },
  professionnel: {
    name: "Professionnel",
    price: 14900,
    currency: "cad",
    interval: "month" as const,
    features: {
      maxUsers: 5,
      trustAccounts: true,
      virtualEmployees: true,
      clientPortal: true,
      advancedReports: false,
      api: false,
    },
  },
  cabinet: {
    name: "Cabinet",
    price: 29900,
    currency: "cad",
    interval: "month" as const,
    features: {
      maxUsers: -1, // illimité
      trustAccounts: true,
      virtualEmployees: true,
      clientPortal: true,
      advancedReports: true,
      api: true,
    },
  },
} as const;

export type PlanKey = keyof typeof PLANS;
