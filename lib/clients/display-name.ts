/**
 * Resolution canonique du nom à afficher pour un client SAFE.
 *
 * Priorité:
 *   1. raisonSociale (personne morale)
 *   2. prenom + nom (personne physique)
 *   3. fallback (par défaut "Client sans nom")
 *
 * Utilisé par l'API honoraires et tout module qui agrège ou liste des clients.
 * Garantit que les particuliers sans raisonSociale ne disparaissent pas des
 * agrégations facturables.
 */

export type ClientNameSource = {
  raisonSociale?: string | null;
  prenom?: string | null;
  nom?: string | null;
} | null | undefined;

export function displayClientName(client: ClientNameSource): string | null {
  if (!client) return null;
  const company = client.raisonSociale?.trim();
  if (company) return company;
  const person = [client.prenom, client.nom]
    .map((p) => (p ?? "").trim())
    .filter(Boolean)
    .join(" ")
    .trim();
  return person || null;
}

export function displayClientNameOrFallback(
  client: ClientNameSource,
  fallback: string = "Client sans nom",
): string {
  return displayClientName(client) ?? fallback;
}
