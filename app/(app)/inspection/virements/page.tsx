import { requireCabinetAndUser } from "@/lib/auth/session";
import { canEditBillingTrust, canViewBillingTrust } from "@/lib/auth/permissions";
import type { UserRole } from "@prisma/client";
import { PageHeader } from "@/components/ui/PageHeader";
import { routes } from "@/lib/routes";
import { prisma } from "@/lib/db";
import { getCabinetProvince } from "@/lib/cabinet/get-province";
import { resolveProvince } from "@/lib/compliance/rules";
import {
  electronicTransferRegime,
  findMissingConfirmationFields,
  getConfirmationFields,
  getCountersignatureDuty,
  getPermittedWithdrawalMethods,
} from "@/lib/compliance/electronic-transfer";
import { listTrustBankAccounts } from "@/lib/services/fideicommis/trust-bank-account-service";
import { clientDisplayName } from "@/lib/clients/normalize-name";
import { TransfersScreen } from "@/components/conformite/TransfersScreen";
import { Panel } from "@/components/conformite/primitives";

/**
 * Écran des virements électroniques depuis un compte en fiducie.
 *
 * By-Law 9, s. 10, 11, 12 · B-1 r.5, art. 58.
 *
 * ⚠️ ONTARIO SEULEMENT, et c'est la conclusion principale du chantier. La s. 12 impose
 * un appareil complet ; B-1 r.5 n'a AUCUN équivalent. Un cabinet québécois voit donc
 * ce que son propre règlement dit, sourcé, plutôt qu'un formulaire qui ne le concerne
 * pas.
 */

const LIBELLES_MODES: Record<string, string> = {
  CHEQUE_TO_LICENSEE: "Chèque tiré à l'ordre de l'avocat",
  TRANSFER_TO_NON_TRUST: "Virement vers un compte non fiduciaire ouvert au nom de l'avocat",
  ELECTRONIC_TRANSFER: "Virement électronique",
};

export default async function VirementsPage() {
  const { cabinetId, role } = await requireCabinetAndUser();
  if (!canViewBillingTrust(role as UserRole)) {
    return (
      <div className="p-6">
        <p className="text-[#B84A3E]">Vous n&apos;avez pas accès aux écrans d&apos;inspection.</p>
      </div>
    );
  }

  const province = resolveProvince(await getCabinetProvince(cabinetId));
  const regime = electronicTransferRegime(province);
  const modes = getPermittedWithdrawalMethods(province);

  const header = (
    <PageHeader
      title="Virements électroniques"
      description={
        regime.applies
          ? "Réquisition signée, double contrôle, confirmation de l'institution, contresignature."
          : "Ce que le règlement québécois exige d'un virement, et ce qu'il n'exige pas."
      }
      backHref={routes.inspection}
      backLabel="Retour à l'inspection"
    />
  );

  if (!regime.applies) {
    return (
      <div className="animate-fade-in space-y-6">
        {header}
        <Panel className="p-6">
          <h2 className="text-base font-medium text-[var(--si-ink)]">
            Aucune réquisition ni formulaire prescrit ne vous est imposé
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[var(--si-muted)]">
            {regime.noteFr}
          </p>
          <p className="mt-3 text-xs text-[var(--si-muted)]">{regime.reference}</p>

          <h3 className="mt-6 text-sm font-medium text-[var(--si-ink)]">
            Les seules formes admises pour un retrait
          </h3>
          <ul className="mt-2">
            {modes.methods.map((m) => (
              <li
                key={m}
                className="border-b border-[var(--si-line)] py-2 text-sm text-[var(--si-ink)] last:border-b-0"
              >
                {LIBELLES_MODES[m] ?? m}
              </li>
            ))}
          </ul>
          <p className="mt-2 max-w-3xl text-xs leading-relaxed text-[var(--si-muted)]">
            {modes.noteFr} Cette liste est limitative : un retrait d&apos;honoraires ne peut
            prendre aucune autre forme. {modes.reference}
          </p>

          <p className="mt-6 max-w-3xl text-xs leading-relaxed text-[var(--si-muted)]">
            L&apos;appareil ontarien de la s. 12, avec son formulaire 9A et sa contresignature
            au jour bancaire suivant, existe dans SAFE mais reste fermé ici. Vous l&apos;imposer
            inventerait une obligation, ce qui est aussi grave que d&apos;en omettre une.
          </p>
        </Panel>
      </div>
    );
  }

  const now = new Date();

  const [accounts, rows, users, clients] = await Promise.all([
    listTrustBankAccounts(cabinetId),
    prisma.electronicTrustTransferRequisition.findMany({
      where: { cabinetId },
      orderBy: { signedAt: "desc" },
      take: 100,
    }),
    // Tous les utilisateurs du cabinet, sans filtrer sur le statut du permis : la s. 12
    // demande QUI a autorisé, y compris quand cette personne s'avère suspendue. Le
    // contrôle du pouvoir de signature vit dans le service, pas dans la liste déroulante.
    prisma.user.findMany({
      where: { cabinetId },
      select: { id: true, nom: true },
      orderBy: { nom: "asc" },
    }),
    prisma.client.findMany({
      where: { cabinetId },
      select: { id: true, prenom: true, nom: true, raisonSociale: true },
      orderBy: { nom: "asc" },
      take: 500,
    }),
  ]);

  return (
    <div className="animate-fade-in space-y-6">
      {header}

      <TransfersScreen
        canEdit={canEditBillingTrust(role as UserRole)}
        regimeNoteFr={regime.noteFr}
        regimeReference={regime.reference}
        withdrawalMethods={modes.methods.map((m) => ({
          labelFr: LIBELLES_MODES[m] ?? m,
          reference: modes.reference,
        }))}
        accounts={accounts.map((a) => ({
          id: a.id,
          label: a.accountLabel,
          last4: a.accountNumberLast4 ?? null,
        }))}
        requisitions={rows.map((r) => {
          // L'échéance est RECALCULÉE quand elle manque plutôt que laissée vide : une
          // colonne nulle en base ferait disparaître une contresignature qui est due.
          const due =
            r.countersignDueAt ??
            (r.confirmationSentAt
              ? getCountersignatureDuty({ confirmationSentAt: r.confirmationSentAt }).dueAt
              : null);

          return {
            id: r.id,
            formType: r.formType,
            clientName: r.clientName,
            dossierRef: r.dossierRef,
            amount: r.amount,
            recipientName: r.recipientName,
            recipientInstitution: r.recipientInstitution,
            purpose: r.purpose,
            signedAt: r.signedAt.toISOString(),
            dataEnteredAt: r.dataEnteredAt ? r.dataEnteredAt.toISOString() : null,
            authorizedAt: r.authorizedAt ? r.authorizedAt.toISOString() : null,
            // La même personne aux deux étapes n'est admise qu'au praticien
            // véritablement seul (s. 12(3)), et l'exemption est consignée.
            sameSigner:
              Boolean(r.dataEnteredByUserId) &&
              r.dataEnteredByUserId === r.authorizedByUserId &&
              !r.solePractitionerExemption,
            confirmationSentAt: r.confirmationSentAt ? r.confirmationSentAt.toISOString() : null,
            missingConfirmationFields: r.confirmationSentAt
              ? findMissingConfirmationFields({
                  sourceAccountNumber: r.confirmationSourceAccount,
                  recipientInstitution: r.confirmationRecipientInstitution,
                  recipientName: r.confirmationRecipientName,
                  recipientAccountNumber: r.confirmationRecipientAccount,
                  institutionReceivedAt: r.confirmationInstitutionReceivedAt,
                  confirmationSentAt: r.confirmationSentAt,
                })
              : [],
            countersignDueAt: due ? due.toISOString() : null,
            countersignedAt: r.countersignedAt ? r.countersignedAt.toISOString() : null,
            overdue: Boolean(due && !r.countersignedAt && now.getTime() > due.getTime()),
          };
        })}
        users={users.map((u) => ({ id: u.id, name: u.nom }))}
        clients={clients.map((c) => ({ id: c.id, name: clientDisplayName(c) }))}
        countersignSteps={
          getCountersignatureDuty({ confirmationSentAt: now }).steps
        }
        confirmationFields={getConfirmationFields()}
      />
    </div>
  );
}
