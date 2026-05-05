import Stripe from "stripe";

let stripeSingleton: Stripe | null = null;

/** Initialisation paresseuse : évite d’exiger STRIPE_SECRET_KEY au build Next.js. */
/** ID d’abonnement sur une facture (champ `subscription` retiré des types récents). */
export function subscriptionIdFromInvoice(invoice: Stripe.Invoice): string | null {
  if (invoice.parent?.type === "subscription_details") {
    const sub = invoice.parent.subscription_details?.subscription;
    if (typeof sub === "string") return sub;
    if (sub && typeof sub === "object" && "id" in sub) return sub.id;
  }
  const legacy = (
    invoice as Stripe.Invoice & { subscription?: string | Stripe.Subscription | null }
  ).subscription;
  if (typeof legacy === "string") return legacy;
  if (legacy && typeof legacy === "object" && "id" in legacy) return legacy.id;
  return null;
}

/** Fin de période (secondes Unix) — l’API récente expose la période par ligne d’abonnement. */
export function subscriptionCurrentPeriodEndUnix(sub: Stripe.Subscription): number | null {
  const ends = sub.items.data
    .map((item) => item.current_period_end)
    .filter((n): n is number => typeof n === "number" && !Number.isNaN(n));
  if (ends.length === 0) return null;
  return Math.max(...ends);
}

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  stripeSingleton ??= new Stripe(key, {
    apiVersion: "2025-04-30.basil",
    typescript: true,
  });
  return stripeSingleton;
}

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

const PLAN_PRICE_ENV: Record<PlanKey, string> = {
  essentiel: "STRIPE_PRICE_ID_ESSENTIEL",
  professionnel: "STRIPE_PRICE_ID_PROFESSIONNEL",
  cabinet: "STRIPE_PRICE_ID_CABINET",
};

export function appBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXTAUTH_URL ??
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

export function stripePriceIdForPlan(plan: PlanKey): string | null {
  return process.env[PLAN_PRICE_ENV[plan]] ?? process.env.STRIPE_PRICE_ID ?? null;
}

export function planFromStripePriceId(priceId: string | null | undefined): PlanKey | null {
  if (!priceId) return null;
  for (const plan of Object.keys(PLAN_PRICE_ENV) as PlanKey[]) {
    if (process.env[PLAN_PRICE_ENV[plan]] === priceId) return plan;
  }
  if (process.env.STRIPE_PRICE_ID === priceId) return "professionnel";
  return null;
}
