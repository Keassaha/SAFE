import { requireCabinetAndUser } from "@/lib/auth/session";
import { canManageInvoices, canViewBillingTrust } from "@/lib/auth/permissions";
import type { UserRole } from "@prisma/client";
import { PageHeader } from "@/components/ui/PageHeader";
import { routes } from "@/lib/routes";
import { getCabinetProvince } from "@/lib/cabinet/get-province";
import { resolveProvince } from "@/lib/compliance/rules";
import {
  DELIVERY_DECOUPLING_DATE,
  getChannelInfo,
  getSelectableDeliveryChannels,
} from "@/lib/compliance/invoice-delivery";
import {
  listUndeliveredIssuedInvoices,
  listUnprovenDeliveries,
} from "@/lib/services/billing/invoice-delivery-service";
import { InvoiceDeliveryScreen } from "@/components/conformite/InvoiceDeliveryScreen";

/**
 * Écran de transmission des factures.
 *
 * Art. 56(2) B-1 r.5 · s. 9(1)3 By-Law 9.
 *
 * Cet écran est la surface d'une porte de sortie, pas d'un garde-fou de plus. Le
 * garde-fou vit dans le service de retrait ; ce qui manquait, c'était le moyen de le
 * satisfaire honnêtement quand la facture a été postée ou remise en main propre.
 */

export default async function TransmissionFacturesPage() {
  const { cabinetId, role } = await requireCabinetAndUser();
  if (!canViewBillingTrust(role as UserRole)) {
    return (
      <div className="p-6">
        <p className="text-[#B84A3E]">Vous n&apos;avez pas accès aux écrans d&apos;inspection.</p>
      </div>
    );
  }

  const province = resolveProvince(await getCabinetProvince(cabinetId));
  const qc = province === "QC";

  const [undelivered, unproven] = await Promise.all([
    listUndeliveredIssuedInvoices({ cabinetId }),
    listUnprovenDeliveries({ cabinetId }),
  ]);

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Transmission des factures"
        description={
          qc
            ? "Se payer sur le fidéicommis suppose une facture transmise, pas seulement émise."
            : "Withdrawing from trust requires a billing delivered to the client, not merely issued."
        }
        backHref={routes.inspection}
        backLabel="Retour à l'inspection"
      />

      <InvoiceDeliveryScreen
        canEdit={canManageInvoices(role as UserRole)}
        reference={qc ? "B-1 r.5, art. 56(2)" : "By-Law 9, s. 9(1)3"}
        citation={
          qc
            ? "« pour lesquels la facturation a été envoyée »"
            : "« for which a billing has been delivered »"
        }
        undelivered={undelivered.map((f) => ({
          id: f.id,
          numero: f.numero,
          dateEmission: f.dateEmission.toISOString(),
          montantTotal: f.montantTotal,
          clientName: f.clientName,
          dossierRef: f.dossierRef,
        }))}
        unproven={unproven.map((u) => ({
          id: u.id,
          numero: u.numero,
          deliveredAt: u.deliveredAt ? u.deliveredAt.toISOString() : null,
          // Un canal inconnu est nommé comme tel : le masquer derrière un tiret
          // laisserait croire à une donnée manquante alors que c'est une valeur qui
          // n'appartient à aucun canal connu.
          channelLabel: getChannelInfo(u.channel)?.labelFr ?? `Canal inconnu (${u.channel ?? "—"})`,
          presumed: u.presumed,
        }))}
        channels={getSelectableDeliveryChannels().map((c) => ({
          channel: c.channel,
          labelFr: c.labelFr,
          noteFr: c.noteFr,
        }))}
        decouplingDate={DELIVERY_DECOUPLING_DATE}
        // Le préfixe est dérivé de `routes` plutôt qu'écrit en dur : la fonction elle-même
        // ne peut pas traverser la frontière serveur / client.
        invoiceHrefBase={routes.facturationFactureApercu("").replace(/\/$/, "")}
      />
    </div>
  );
}
