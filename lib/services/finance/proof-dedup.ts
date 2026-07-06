import { createHash } from "crypto";
import { prisma } from "@/lib/db";

/**
 * Anti-doublon de preuve de paiement (import intelligent).
 * Deux signaux : le HASH du fichier (même image/PDF exact) et la RÉFÉRENCE Interac
 * (même virement, capture différente). L'un ou l'autre suffit à bloquer un doublon.
 */

/** Empreinte SHA-256 des octets du fichier de preuve. */
export function hashProofFile(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

export interface DuplicatePayment {
  id: string;
  datePaiement: Date;
  montant: number;
  clientLabel: string | null;
  matchedBy: "hash" | "reference";
}

/**
 * Cherche un paiement existant du cabinet correspondant à la même preuve
 * (même fichier via `hash`) ou au même virement (même `providerRef`).
 * Retourne le paiement en doublon, ou `null`.
 */
export async function findDuplicateProofPayment(
  cabinetId: string,
  opts: { hash?: string | null; providerRef?: string | null },
): Promise<DuplicatePayment | null> {
  const or: { preuveHash?: string; providerRef?: string }[] = [];
  if (opts.hash) or.push({ preuveHash: opts.hash });
  if (opts.providerRef) or.push({ providerRef: opts.providerRef });
  if (or.length === 0) return null;

  const existing = await prisma.payment.findFirst({
    where: { cabinetId, OR: or },
    select: {
      id: true,
      datePaiement: true,
      montant: true,
      preuveHash: true,
      client: { select: { raisonSociale: true, prenom: true, nom: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  if (!existing) return null;

  const clientLabel = existing.client
    ? existing.client.raisonSociale?.trim() ||
      [existing.client.prenom, existing.client.nom].filter(Boolean).join(" ").trim() ||
      null
    : null;

  return {
    id: existing.id,
    datePaiement: existing.datePaiement,
    montant: existing.montant,
    clientLabel,
    matchedBy: opts.hash && existing.preuveHash === opts.hash ? "hash" : "reference",
  };
}
