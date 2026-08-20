/**
 * SAFE — Fermeture d'un espace cabinet.
 *
 * Fermer n'est pas supprimer. Doctrine du dépôt, déjà appliquée à la
 * comptabilité (`DOCTRINE_ANNULATION_CORRECTION.md`) et aux clients, où
 * « supprimer » a été remplacé par « archiver » : une donnée professionnelle
 * ne disparaît pas parce qu'une relation commerciale s'arrête.
 *
 * Un cabinet fermé :
 *   - ne peut plus ouvrir les écrans de l'application ;
 *   - conserve l'intégralité de ses données ;
 *   - garde ses routes d'export accessibles, pour repartir avec ses dossiers ;
 *   - se rouvre en effaçant la date, dans l'état exact où il a été laissé.
 */

/** Vue minimale suffisant à décider. Testable sans Prisma. */
export interface CabinetFermetureView {
  fermeLe?: Date | null;
  fermeMotif?: string | null;
}

/**
 * L'espace est-il fermé à cet instant ?
 *
 * La date est comparée à `now` plutôt que traitée comme un simple booléen :
 * une fermeture peut être datée du futur (préavis convenu avec le cabinet),
 * et dans ce cas l'espace reste ouvert jusqu'au jour dit.
 */
export function isCabinetFerme(
  cabinet: CabinetFermetureView | null | undefined,
  now: Date = new Date(),
): boolean {
  const d = cabinet?.fermeLe ?? null;
  if (!d) return false;
  return d.getTime() <= now.getTime();
}

/**
 * Chemins qui restent accessibles à un cabinet fermé.
 *
 * Volontairement court. Le blocage ne vise que le RENDU DES PAGES : les routes
 * d'API ne passent jamais par le layout, donc l'export des données fonctionne
 * déjà sans rien exempter. Cette liste ne sert qu'aux pages que le cabinet doit
 * pouvoir atteindre pour partir proprement.
 */
export function isFermetureExemptPath(pathname: string): boolean {
  return pathname === "/parametres" || pathname.startsWith("/parametres/retention");
}

export function shouldBlockForFermeture(
  pathname: string,
  cabinet: CabinetFermetureView | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!isCabinetFerme(cabinet, now)) return false;
  return !isFermetureExemptPath(pathname);
}
