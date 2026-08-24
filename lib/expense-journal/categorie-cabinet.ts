/**
 * SAFE — Résolution d'une catégorie de dépense, bornée au cabinet.
 *
 * `ExpenseCategory` porte un `cabinetId`, mais trois chemins la lisaient par
 * `findUnique({ where: { id } })`, sans le vérifier, à partir d'un identifiant
 * venu du corps de la requête (constat C-02 de l'audit).
 *
 * Deux conséquences, dont une n'est pas cosmétique :
 *
 *   - une `CabinetExpense` du cabinet A pouvait référencer une catégorie du
 *     cabinet B : une ressource rattachée au mauvais cabinet, ce que
 *     l'isolation multi-cabinets interdit ;
 *   - surtout, le CODE de la catégorie décide du traitement fiscal
 *     (`decomposeExpenseTax` refuse de fabriquer une taxe sur un salaire ou une
 *     prime d'assurance). Une catégorie étrangère produisait donc une
 *     décomposition de taxe fausse sur une dépense réelle.
 *
 * On REFUSE plutôt que d'ignorer silencieusement : un identifiant qui n'est pas
 * le vôtre est soit un défaut d'appelant, soit une tentative. Le taire
 * laisserait passer une dépense mal catégorisée sans que personne ne le sache.
 */

import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/db";

type DbClient = PrismaClient | Prisma.TransactionClient;

export class CategorieHorsCabinetError extends Error {
  constructor() {
    super(
      "Cette catégorie de dépense n'appartient pas à votre cabinet. " +
        "Rechargez la page et choisissez une catégorie de la liste.",
    );
    this.name = "CategorieHorsCabinetError";
  }
}

/**
 * Code d'une catégorie du cabinet, ou `null` si aucune catégorie n'est demandée.
 *
 * Lève `CategorieHorsCabinetError` si l'identifiant désigne une catégorie
 * inexistante ou appartenant à un autre cabinet. Les deux cas se traitent
 * pareil, exprès : distinguer « n'existe pas » de « appartient à un autre »
 * renseignerait un appelant hostile sur ce qui existe ailleurs.
 */
export async function lireCodeCategorieDuCabinet(params: {
  cabinetId: string;
  categoryId: string | null | undefined;
  client?: DbClient;
}): Promise<string | null> {
  const { cabinetId, categoryId } = params;
  if (!categoryId) return null;

  const db = params.client ?? prisma;
  const categorie = await db.expenseCategory.findFirst({
    where: { id: categoryId, cabinetId },
    select: { code: true },
  });
  if (!categorie) throw new CategorieHorsCabinetError();
  return categorie.code;
}
