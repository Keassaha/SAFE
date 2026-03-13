import { prisma } from "@/lib/db";

/**
 * Formate un numéro de facture (format ANNEE-XXX).
 * Utilisé pour les tests unitaires et par getNextInvoiceNumero.
 */
export function formatInvoiceNumero(year: number, sequence: number): string {
  return `${year}-${String(sequence).padStart(3, "0")}`;
}

/**
 * Génère le prochain numéro de facture pour le cabinet (format ANNEE-XXX).
 */
export async function getNextInvoiceNumero(cabinetId: string): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year + 1, 0, 1);

  const count = await prisma.invoice.count({
    where: {
      cabinetId,
      dateEmission: { gte: yearStart, lt: yearEnd },
    },
  });

  const sequence = count + 1;
  return formatInvoiceNumero(year, sequence);
}
