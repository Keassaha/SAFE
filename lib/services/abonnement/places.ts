/**
 * SAFE — Nombre de comptes qu'un forfait autorise.
 *
 * Constat C-07. `PLANS[].features` déclarait six limites (`maxUsers`,
 * `trustAccounts`, `virtualEmployees`, `clientPortal`, `advancedReports`,
 * `api`) qui n'étaient appliquées NULLE PART : elles ne servaient qu'à écrire
 * « 1 utilisateur » sur la carte de prix.
 *
 * Cinq d'entre elles ont été retirées, parce qu'elles décrivaient un produit
 * qui n'existe pas ou qui contredit ce qui est vendu. La page publique promet
 * en toutes lettres « Fidéicommis, dossiers, temps et facturation » sur le
 * palier Solo, quand `essentiel.trustAccounts` valait `false` : appliquer cette
 * limite aurait retiré le fidéicommis au forfait dont c'est l'argumentaire.
 *
 * `maxUsers` reste, parce que c'est la seule qui corresponde à ce que le site
 * distingue vraiment : « pour l'avocate qui exerce seul » contre « avec l'accès
 * pour votre équipe ».
 */

import { PLANS, type PlanKey } from "@/lib/stripe";

export type VerdictPlace =
  | { autorise: true; restantes: number | null }
  | { autorise: false; limite: number; actuels: number };

/**
 * Limite du forfait, ou `null` quand elle ne s'applique pas.
 *
 * `null` couvre deux cas volontairement traités pareil : le forfait illimité,
 * et le forfait INCONNU de `PLANS` — « fondateur », par exemple. Un fondateur a
 * acheté une offre négociée, pas un palier du catalogue : lui appliquer une
 * limite qu'il n'a jamais vue serait lui retirer ce qu'on lui a vendu.
 */
export function limiteUtilisateurs(plan: string | null | undefined): number | null {
  if (!plan || !(plan in PLANS)) return null;
  const max = PLANS[plan as PlanKey].features.maxUsers;
  return max === -1 ? null : max;
}

/**
 * Peut-on ajouter un compte de plus ?
 *
 * `utilisateursActifs` ne compte QUE les comptes actifs : un compte désactivé
 * ne consomme pas de place, sinon un cabinet resterait bloqué par le départ
 * qu'il vient d'acter.
 *
 * La limite ne vaut que pour les AJOUTS. Un cabinet déjà au-dessus n'est jamais
 * amputé : on ne retire pas un accès à quelqu'un parce qu'un plafond a changé.
 */
export function peutAjouterUnUtilisateur(params: {
  plan: string | null | undefined;
  utilisateursActifs: number;
}): VerdictPlace {
  const limite = limiteUtilisateurs(params.plan);
  if (limite === null) return { autorise: true, restantes: null };
  if (params.utilisateursActifs < limite) {
    return { autorise: true, restantes: limite - params.utilisateursActifs };
  }
  return { autorise: false, limite, actuels: params.utilisateursActifs };
}
