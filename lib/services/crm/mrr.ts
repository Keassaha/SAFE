/**
 * SAFE — Revenu récurrent mensuel des cabinets abonnés.
 *
 * Trois défauts corrigés ici, tous dans le même chiffre (constat C-09) :
 *
 *   1. il additionnait le PRIX CATALOGUE, pas ce que le cabinet paie. Un
 *      fondateur à 75 $ comptait pour 299,99 $, soit quatre fois trop ;
 *   2. il comptait `trialing` comme du revenu. Un essai n'est pas un revenu :
 *      c'est même la promesse explicite qu'on ne facture pas encore ;
 *   3. un forfait absent de `PLANS` — « fondateur », par exemple — comptait
 *      pour zéro. La cohorte que SAFE vend disparaissait du calcul.
 *
 * C'est le chiffre que le CEO regarde pour juger l'affaire. Il vaut mieux qu'il
 * dise zéro quand la réponse est zéro.
 */

import { PLANS, type PlanKey } from "@/lib/stripe";

/** Vue minimale d'un cabinet abonné. Testable sans Prisma. */
export interface CabinetPourMrr {
  plan?: string | null;
  stripeSubscriptionStatus?: string | null;
  /** Ce que le cabinet paie réellement. Prime sur le prix catalogue. */
  abonnementMontantMensuel?: number | { toString(): string } | null;
  /** Accès payé hors Stripe (virement Interac). */
  accesPayeJusquau?: Date | null;
}

export interface Mrr {
  /** Somme qui rentre vraiment, chaque mois. */
  montant: number;
  /** Cabinets qui la produisent. */
  payants: number;
  /** Cabinets en essai : pas du revenu, mais à ne pas perdre de vue. */
  enEssai: number;
}

/** `Decimal` de Prisma, nombre, ou rien. */
function versNombre(v: CabinetPourMrr["abonnementMontantMensuel"]): number | null {
  if (v == null) return null;
  const n = typeof v === "number" ? v : Number(v.toString());
  return Number.isFinite(n) ? n : null;
}

/**
 * Un cabinet paie-t-il, à cet instant ?
 *
 * `trialing` est exclu à dessein : c'est la définition même d'un essai. Un accès
 * payé hors Stripe compte, lui, dès que son échéance n'est pas dépassée.
 */
function paie(c: CabinetPourMrr, maintenant: Date): boolean {
  if (c.stripeSubscriptionStatus === "active") return true;
  const e = c.accesPayeJusquau ?? null;
  return e != null && e.getTime() >= maintenant.getTime();
}

export function calculerMrr(
  cabinets: CabinetPourMrr[],
  maintenant: Date = new Date(),
): Mrr {
  let montant = 0;
  let payants = 0;
  let enEssai = 0;

  for (const c of cabinets) {
    if (c.stripeSubscriptionStatus === "trialing" && !paie(c, maintenant)) {
      enEssai += 1;
      continue;
    }
    if (!paie(c, maintenant)) continue;

    // Ce que le cabinet paie d'abord ; le catalogue seulement à défaut, et
    // seulement s'il correspond à un forfait connu.
    const reel = versNombre(c.abonnementMontantMensuel);
    const catalogue =
      c.plan && c.plan in PLANS ? PLANS[c.plan as PlanKey].price / 100 : null;
    const ligne = reel ?? catalogue ?? 0;

    montant += ligne;
    payants += 1;
  }

  return { montant: Math.round(montant * 100) / 100, payants, enEssai };
}
