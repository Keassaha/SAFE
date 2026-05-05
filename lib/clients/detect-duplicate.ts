import { prisma } from "@/lib/db";
import { clientDedupeKey } from "./normalize-name";

export type DuplicateCandidateInput = {
  cabinetId: string;
  typeClient?: string | null;
  raisonSociale?: string | null;
  prenom?: string | null;
  nom?: string | null;
  /** Si fourni, exclu des résultats (utile lors d'un update). */
  excludeId?: string;
};

export type DuplicateMatch = {
  id: string;
  raisonSociale: string | null;
  prenom: string | null;
  nom: string | null;
  typeClient: string;
  email: string | null;
};

/**
 * Cherche un client existant dans le même cabinet dont la clé de dédoublonnage
 * (nom normalisé) correspond à celle des données passées. Retourne `null` si la
 * clé est vide (pas assez d'info pour comparer) ou si rien ne match.
 *
 * Implémentation : on scanne les clients du cabinet et on compare les clés en
 * mémoire. Pour les cabinets de l'ordre du millier de clients ça reste sub-100ms ;
 * au-delà il faudra ajouter un index normalisé en base.
 */
export async function findClientDuplicate(input: DuplicateCandidateInput): Promise<DuplicateMatch | null> {
  const incomingKey = clientDedupeKey({
    typeClient: input.typeClient,
    raisonSociale: input.raisonSociale,
    prenom: input.prenom,
    nom: input.nom,
  });
  if (!incomingKey) return null;

  const candidates = await prisma.client.findMany({
    where: {
      cabinetId: input.cabinetId,
      ...(input.excludeId ? { id: { not: input.excludeId } } : {}),
      status: { not: "archive" },
    },
    select: {
      id: true,
      raisonSociale: true,
      prenom: true,
      nom: true,
      typeClient: true,
      email: true,
    },
  });

  for (const c of candidates) {
    const candidateKey = clientDedupeKey({
      typeClient: c.typeClient,
      raisonSociale: c.raisonSociale,
      prenom: c.prenom,
      nom: c.nom,
    });
    if (candidateKey && candidateKey === incomingKey) {
      return c;
    }
  }
  return null;
}

/**
 * Format human-friendly du nom d'un client, utile pour le message d'erreur.
 */
export function formatClientDisplayName(c: {
  typeClient?: string | null;
  raisonSociale?: string | null;
  prenom?: string | null;
  nom?: string | null;
}): string {
  if (c.typeClient === "personne_physique") {
    const full = [c.prenom, c.nom].filter(Boolean).join(" ").trim();
    if (full) return full;
  }
  return c.raisonSociale?.trim() || [c.prenom, c.nom].filter(Boolean).join(" ").trim() || "—";
}
