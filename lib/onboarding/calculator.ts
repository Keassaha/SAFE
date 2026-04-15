/* ─────────────────────────────────────────────
   Onboarding — Calcul silencieux de la valeur
   ───────────────────────────────────────────── */

import type { OnboardingData, CalculationResult } from "./types";

export function calculateOnboardingValue(data: OnboardingData): CalculationResult {
  const items: CalculationResult["lineItems"] = [];

  /* ── Facturation ── */
  const complexBilling = ["flat_fee", "per_task", "mixed"].includes(data.billingMethod);
  items.push({
    label: {
      fr: "Configuration de la facturation",
      en: "Billing configuration",
    },
    amount: complexBilling ? 800 : 400,
  });

  /* ── Fidéicommis ── */
  if (data.hasTrustAccount === "yes") {
    const multiAccount = ["2", "3+"].includes(data.trustAccountCount);
    items.push({
      label: {
        fr: "Configuration du fidéicommis",
        en: "Trust account configuration",
      },
      amount: multiAccount ? 600 : 300,
    });
  }

  /* ── Migration de données ── */
  if (data.hasDataToMigrate === "yes") {
    items.push({
      label: {
        fr: "Migration de vos données",
        en: "Data migration",
      },
      amount: 500,
    });
  }

  /* ── Utilisateurs multiples ── */
  const userCount = parseUserCount(data.totalUsers);
  if (userCount >= 3) {
    items.push({
      label: {
        fr: "Configuration multi-utilisateurs",
        en: "Multi-user configuration",
      },
      amount: 400,
    });
  }

  /* ── Formation équipe ── */
  if (userCount >= 2) {
    items.push({
      label: {
        fr: "Formation de votre équipe",
        en: "Team training",
      },
      amount: 300,
    });
  }

  /* ── Domaines multiples ── */
  if ((data.practiceAreas ?? []).length >= 3) {
    items.push({
      label: {
        fr: "Configuration multi-domaines",
        en: "Multi-practice configuration",
      },
      amount: 300,
    });
  }

  /* ── Support dédié (toujours inclus) ── */
  items.push({
    label: {
      fr: "Support dédié 30 jours",
      en: "30-day dedicated support",
    },
    amount: 400,
  });

  /* ── Total ── */
  const totalValue = items.reduce((sum, item) => sum + item.amount, 0);

  /* ── Plan selon nombre d'utilisateurs ── */
  const plan = determinePlan(userCount);

  return { lineItems: items, totalValue, plan };
}

function parseUserCount(value: string): number {
  switch (value) {
    case "1":
      return 1;
    case "2":
      return 2;
    case "3-5":
      return 4;
    case "6-15":
      return 10;
    default:
      return 1;
  }
}

function determinePlan(userCount: number): CalculationResult["plan"] {
  if (userCount <= 1) {
    return { name: { fr: "Solo", en: "Solo" }, price: 99 };
  }
  if (userCount <= 5) {
    return { name: { fr: "Cabinet", en: "Firm" }, price: 149 };
  }
  // 6 utilisateurs et plus → plan Cabinet+
  return { name: { fr: "Cabinet+", en: "Firm+" }, price: 499 };
}
