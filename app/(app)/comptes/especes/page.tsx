import { requireCabinetAndUser } from "@/lib/auth/session";
import { canViewBillingTrust, canEditBillingTrust } from "@/lib/auth/permissions";
import type { UserRole } from "@prisma/client";
import { PageHeader } from "@/components/ui/PageHeader";
import { routes } from "@/lib/routes";
import { prisma } from "@/lib/db";
import { getCabinetProvince } from "@/lib/cabinet/get-province";
import { resolveProvince } from "@/lib/compliance/rules";
import {
  getPendingCashDeclarations,
  listCashReceipts,
  CASH_THRESHOLD_CAD,
} from "@/lib/services/fideicommis/cash-service";
import { CashScreen } from "@/components/conformite/CashScreen";

/**
 * Espèces : reçus et déclarations.
 *
 * Art. 69 à 73 B-1 r.5 · s. 4 à 6 et 19 By-Law 9.
 *
 * La chaîne complète existe depuis CH-05. Ce qui manquait, c'est l'endroit où voir
 * qu'une déclaration arrive à échéance dans onze jours.
 */

export default async function EspecesPage() {
  const { cabinetId, role } = await requireCabinetAndUser();
  if (!canViewBillingTrust(role as UserRole)) {
    return (
      <div className="p-6">
        <p className="text-[#B84A3E]">Vous n'avez pas accès à la comptabilité en fidéicommis.</p>
      </div>
    );
  }

  const province = resolveProvince(await getCabinetProvince(cabinetId));
  const canEdit = canEditBillingTrust(role as UserRole);

  const [receipts, pending] = await Promise.all([
    listCashReceipts({ cabinetId }),
    getPendingCashDeclarations({ cabinetId }),
  ]);

  // Les noms de clients et de dossiers en un seul aller-retour : un `include` par
  // reçu multiplierait les requêtes sur un registre qui peut être long.
  const clientIds = [...new Set(receipts.map((r) => r.clientId).filter(Boolean))] as string[];
  const dossierIds = [...new Set(receipts.map((r) => r.dossierId).filter(Boolean))] as string[];

  const [clients, dossiers] = await Promise.all([
    clientIds.length
      ? prisma.client.findMany({
          where: { cabinetId, id: { in: clientIds } },
          select: { id: true, raisonSociale: true, prenom: true, nom: true },
        })
      : [],
    dossierIds.length
      ? prisma.dossier.findMany({
          where: { cabinetId, id: { in: dossierIds } },
          select: { id: true, numeroDossier: true, intitule: true },
        })
      : [],
  ]);

  const nomClient = new Map(
    clients.map((c) => [
      c.id,
      c.raisonSociale ?? [c.prenom, c.nom].filter(Boolean).join(" ") ?? "—",
    ]),
  );
  const refDossier = new Map(dossiers.map((d) => [d.id, d.numeroDossier ?? d.intitule]));

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Espèces"
        description="Les sommes reçues en argent comptant, leurs reçus et les déclarations à transmettre."
        backHref={routes.comptes}
        backLabel="Retour aux comptes"
      />

      <CashScreen
        province={province}
        canEdit={canEdit}
        threshold={CASH_THRESHOLD_CAD}
        receipts={receipts.map((r) => ({
          id: r.id,
          receiptNumber: r.receiptNumber,
          date: r.date.toISOString(),
          payerName: r.payerName,
          cadAmount: r.cadAmount,
          currency: r.currency,
          clientName: r.clientId ? (nomClient.get(r.clientId) ?? null) : null,
          dossierRef: r.dossierId ? (refDossier.get(r.dossierId) ?? null) : null,
          purpose: r.purpose,
          exemptionInvoked: r.exemptionInvoked,
          declarationDueAt: r.declarationDueAt ? r.declarationDueAt.toISOString() : null,
          declarationSentAt: r.declarationSentAt ? r.declarationSentAt.toISOString() : null,
        }))}
        pending={pending.map((p) => ({
          id: p.id,
          receiptNumber: p.receiptNumber,
          date: p.date.toISOString(),
          cadAmount: p.cadAmount,
          payerName: p.payerName,
          dueAt: p.dueAt.toISOString(),
          daysRemaining: p.daysRemaining,
          overdue: p.overdue,
        }))}
      />
    </div>
  );
}
