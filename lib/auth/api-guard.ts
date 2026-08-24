/**
 * SAFE — Garde de rôle pour les routes d'API.
 *
 * Constat C-05 de l'audit : quatorze routes authentifiées ne vérifiaient que la
 * session, jamais le rôle. Elles étaient atteignables par n'importe quel compte
 * du cabinet, quel que soit ce que son écran lui montre. Un bouton absent de
 * l'interface n'a jamais été un contrôle d'accès.
 *
 * La garde est volontairement minuscule et sans plomberie : les routes
 * existantes obtiennent leur session par trois helpers différents, et les
 * réécrire toutes pour un seul idiome aurait produit un large diff dans des
 * fichiers qui n'ont pas de tests. Deux lignes s'insèrent après ce que la route
 * fait déjà.
 *
 *   const refus = refusSiRoleInsuffisant(role, canViewDossiers);
 *   if (refus) return refus;
 */

import { NextResponse } from "next/server";
import type { UserRole } from "@prisma/client";

/**
 * Rend une réponse 403 à retourner, ou `null` quand le rôle porte la permission.
 *
 * La décision n'est jamais prise ici : elle est déléguée à la fonction de
 * permission, qui est le seul endroit où les arbitrages du cabinet sont écrits.
 * Dupliquer une liste de rôles dans cette garde l'aurait fait diverger le jour
 * où l'un de ces arbitrages change.
 *
 * Un rôle absent est refusé. `requireCabinetAndUser` retombe sur « avocat »
 * quand la session n'en porte pas, ce qui convient à une page qui affiche moins,
 * mais accorderait ici des droits à une session incomplète. Les fonctions de
 * permission refusent d'elles-mêmes tout rôle qu'elles ne listent pas, donc un
 * rôle futur reste refusé tant que quelqu'un ne l'a pas explicitement admis.
 */
export function refusSiRoleInsuffisant(
  role: string | null | undefined,
  permission: (role: UserRole) => boolean,
): NextResponse | null {
  if (!role) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  if (!permission(role as UserRole)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  return null;
}
