import { requireCabinetAndUser } from "@/lib/auth/session";
import { canEditBillingTrust, canViewBillingTrust } from "@/lib/auth/permissions";
import type { UserRole } from "@prisma/client";
import { PageHeader } from "@/components/ui/PageHeader";
import { routes } from "@/lib/routes";
import { prisma } from "@/lib/db";
import { getCabinetProvince } from "@/lib/cabinet/get-province";
import { resolveProvince } from "@/lib/compliance/rules";
import {
  getPostOpeningDuties,
  type TrustBankAccountType,
} from "@/lib/compliance/trust-bank-account";
import {
  getTrustBankAccountBalance,
  listTrustBankAccounts,
} from "@/lib/services/fideicommis/trust-bank-account-service";
import { clientDisplayName } from "@/lib/clients/normalize-name";
import { TrustAccountsScreen } from "@/components/conformite/TrustAccountsScreen";

/**
 * Déclaration des comptes en fidéicommis — la marche zéro de la section Inspection.
 *
 * Art. 50, 51, 62 à 68 B-1 r.5 · s. 7, 8 By-Law 9.
 *
 * ⚠️ CE QUE CET ÉCRAN DÉBLOQUE. `openTrustBankAccount` existait depuis CH-01 et
 * n'était appelé que depuis `scripts/seed-trust-demo.ts`. Aucun cabinet ne pouvait
 * déclarer son compte, et les onze autres écrans d'inspection affichaient donc tous
 * « Aucun compte en fidéicommis n'est enregistré », définitivement.
 *
 * L'ouverture est un ACTE EXPLICITE (PR-6), jamais un effet de bord d'un premier
 * dépôt : choisir une institution ayant conclu l'entente B-1 r.10, une succursale
 * québécoise, un libellé portant la mention « en fidéicommis », puis transmettre le
 * formulaire prescrit. Rien de cela ne se déduit d'un montant saisi.
 */

const INTERET: Record<string, string> = {
  QC: "Les intérêts d'un compte général vont au Fonds d'études juridiques du Barreau (art. 50, renvoyant à B-1 r.10). Ceux d'un compte particulier reviennent au client : c'est sa raison d'être (art. 62).",
  ON: "Interest on a general trust account goes to the Law Foundation of Ontario (s. 57, Law Society Act).",
};

export default async function ComptesFiduciePage() {
  const { cabinetId, role } = await requireCabinetAndUser();
  if (!canViewBillingTrust(role as UserRole)) {
    return (
      <div className="p-6">
        <p className="text-si-danger-ink">
          Vous n&apos;avez pas accès aux écrans d&apos;inspection.
        </p>
      </div>
    );
  }

  const province = resolveProvince(await getCabinetProvince(cabinetId));
  const canEdit = canEditBillingTrust(role as UserRole);

  // Les comptes FERMÉS sont inclus : l'art. 42(7) exige leur liste au rapport annuel,
  // et un compte fermé qui disparaît de l'écran donne l'impression d'avoir été
  // supprimé, ce que SAFE ne fait jamais.
  const accounts = await listTrustBankAccounts(cabinetId, { includeClosed: true });

  const [soldes, clients, clientsDuCabinet] = await Promise.all([
    Promise.all(
      accounts.map((a) =>
        getTrustBankAccountBalance(cabinetId, a.id).catch(() => 0),
      ),
    ),
    accounts.some((a) => a.clientId)
      ? prisma.client.findMany({
          where: {
            cabinetId,
            id: { in: accounts.map((a) => a.clientId).filter(Boolean) as string[] },
          },
          select: { id: true, prenom: true, nom: true, raisonSociale: true },
        })
      : Promise.resolve([]),
    canEdit && province === "QC"
      ? prisma.client.findMany({
          where: { cabinetId },
          select: { id: true, prenom: true, nom: true, raisonSociale: true },
          orderBy: { nom: "asc" },
          take: 500,
        })
      : Promise.resolve([]),
  ]);

  const nomClient = new Map(clients.map((c) => [c.id, clientDisplayName(c)]));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Comptes en fidéicommis"
        description={
          province === "QC"
            ? "Déclarer vos comptes, et les démarches à faire sans délai après l'ouverture."
            : "Declare your trust accounts."
        }
        backHref={routes.inspection}
        backLabel="Retour à l'inspection"
      />

      <TrustAccountsScreen
        canEdit={canEdit}
        province={province}
        interestNoteFr={INTERET[province] ?? INTERET.QC!}
        clients={clientsDuCabinet.map((c) => ({ id: c.id, name: clientDisplayName(c) }))}
        accounts={accounts.map((a, i) => ({
          id: a.id,
          type: a.type,
          accountLabel: a.accountLabel,
          institutionName: a.institutionName,
          institutionBranch: a.institutionBranch,
          branchProvince: a.branchProvince,
          accountNumberLast4: a.accountNumberLast4,
          currency: a.currency,
          barreauAgreementConfirmed: a.barreauAgreementConfirmed,
          regulatorNotifiedAt: a.regulatorNotifiedAt ? a.regulatorNotifiedAt.toISOString() : null,
          clientCopySentAt: a.clientCopySentAt ? a.clientCopySentAt.toISOString() : null,
          openedAt: a.openedAt.toISOString(),
          closedAt: a.closedAt ? a.closedAt.toISOString() : null,
          closureReason: a.closureReason,
          clientName: a.clientId ? (nomClient.get(a.clientId) ?? null) : null,
          // Le solde vient du registre append-only, jamais du cache `currentBalance` (PR-1).
          balance: soldes[i] ?? 0,
          // Un compte fermé ne réclame plus rien : afficher ses démarches en retard
          // ferait crier sur un dossier clos.
          duties: a.closedAt
            ? []
            : getPostOpeningDuties(province, a.type as TrustBankAccountType, {
                regulatorNotifiedAt: a.regulatorNotifiedAt,
                clientCopySentAt: a.clientCopySentAt,
              }),
        }))}
      />
    </div>
  );
}
