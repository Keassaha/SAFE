import { randomUUID } from "crypto";
import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  formatInvoiceNumero,
  isProvisionalInvoiceNumero,
  displayInvoiceNumero,
  PROVISIONAL_INVOICE_PREFIX,
} from "./invoice-numero-format";

// Ré-export des helpers purs (compat avec les imports existants).
export { formatInvoiceNumero, isProvisionalInvoiceNumero, displayInvoiceNumero };

type DbClient = PrismaClient | Prisma.TransactionClient;

/**
 * Numéro PROVISOIRE pour un brouillon. Un brouillon ne consomme PAS la séquence
 * officielle : il reçoit un identifiant unique non séquentiel, remplacé par le
 * numéro officiel `YYYY-NNN` au moment de l'émission (conformité Barreau : la
 * séquence des factures ÉMISES doit être sans trou, donc un brouillon annulé ne
 * doit pas créer de trou).
 */
export function makeProvisionalInvoiceNumero(): string {
  // randomUUID est suffisamment unique pour respecter @@unique([cabinetId, numero]).
  return `${PROVISIONAL_INVOICE_PREFIX}${randomUUID()}`;
}

/**
 * Génère le prochain numéro OFFICIEL séquentiel à l'ÉMISSION (format ANNEE-XXX).
 *
 * Base : `max(séquence) + 1` parmi les factures du cabinet/année qui possèdent
 * déjà un numéro officiel `ANNEE-XXX` (donc déjà émises, y compris annulées
 * après émission). Les brouillons (numéro provisoire) sont exclus → aucun trou.
 *
 * Doit être appelé dans la transaction d'émission avec le `client` de
 * transaction pour que l'advisory lock `pg_advisory_xact_lock` sérialise les
 * émissions concurrentes du même cabinet/année. Sans client de transaction
 * (aperçu hors transaction), il calcule simplement le prochain numéro probable.
 */
export async function getNextIssuedInvoiceNumero(
  cabinetId: string,
  client: DbClient = prisma,
): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();

  if (client !== prisma) {
    await client.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`invoice-numero:${cabinetId}:${year}`}))`;
  }

  const issued = await client.invoice.findMany({
    where: { cabinetId, numero: { startsWith: `${year}-` } },
    select: { numero: true },
  });

  let maxSequence = 0;
  for (const { numero } of issued) {
    const match = /^(\d{4})-(\d+)$/.exec(numero ?? "");
    if (match && Number(match[1]) === year) {
      const seq = Number(match[2]);
      if (seq > maxSequence) maxSequence = seq;
    }
  }

  return formatInvoiceNumero(year, maxSequence + 1);
}
