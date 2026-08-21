/**
 * SAFE — Un compte utilisateur est-il désactivé ?
 *
 * Pur et isolé pour deux raisons : la règle s'applique à DEUX endroits qui ne
 * doivent jamais diverger (la connexion et la revalidation des sessions déjà
 * ouvertes), et elle doit se tester sans base ni NextAuth.
 *
 * La date est comparée à `now` plutôt que traitée comme un booléen : une
 * désactivation peut être datée du futur, par exemple le dernier jour convenu
 * avec la personne qui part. L'accès s'arrête alors tout seul, ce jour-là,
 * sans que personne ait à y penser.
 */
export interface CompteDesactivableView {
  desactiveLe?: Date | null;
}

export function isCompteDesactive(
  user: CompteDesactivableView | null | undefined,
  now: Date = new Date(),
): boolean {
  const d = user?.desactiveLe ?? null;
  if (!d) return false;
  return d.getTime() <= now.getTime();
}
