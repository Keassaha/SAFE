import { requireCabinetAndUser } from "@/lib/auth/session";
import { canViewBillingTrust, canEditBillingTrust } from "@/lib/auth/permissions";
import type { UserRole } from "@prisma/client";
import { PageHeader } from "@/components/ui/PageHeader";
import { routes } from "@/lib/routes";
import { getCabinetProvince } from "@/lib/cabinet/get-province";
import { resolveProvince } from "@/lib/compliance/rules";
import {
  getPendingPropertyNotices,
  getPropertyRetention,
  listTrustProperties,
} from "@/lib/services/fideicommis/trust-property-service";
import { TrustPropertyScreen } from "@/components/conformite/TrustPropertyScreen";

/**
 * Autres biens en fidéicommis.
 *
 * Art. 43 à 46 B-1 r.5 · s. 18(9) By-Law 9.
 *
 * Le registre existe depuis CH-08. Ce qui manquait, c'est de voir qu'un testament
 * original dort dans le coffre depuis deux ans sans que le client ait été informé du
 * lieu de garde.
 */

function nomClient(c: { raisonSociale: string | null; prenom: string | null; nom: string | null } | null) {
  if (!c) return "—";
  return c.raisonSociale ?? [c.prenom, c.nom].filter(Boolean).join(" ") ?? "—";
}

export default async function AutresBiensPage() {
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

  const [all, notices, retention] = await Promise.all([
    listTrustProperties({ cabinetId, includeReleased: true }),
    getPendingPropertyNotices({ cabinetId }),
    getPropertyRetention(cabinetId),
  ]);

  const map = (p: (typeof all)[number]) => ({
    id: p.id,
    description: p.description,
    identificationNumber: p.identificationNumber,
    estimatedValue: p.estimatedValue,
    clientName: nomClient(p.client),
    receivedFromName: p.receivedFromName,
    receivedAt: p.receivedAt.toISOString(),
    storageLocation: p.storageLocation,
    purpose: p.purpose,
    fromThirdParty: p.fromThirdParty,
    clientNotifiedAt: p.clientNotifiedAt ? p.clientNotifiedAt.toISOString() : null,
    storageNotifiedAt: p.storageNotifiedAt ? p.storageNotifiedAt.toISOString() : null,
    releasedAt: p.releasedAt ? p.releasedAt.toISOString() : null,
    releasedToName: p.releasedToName,
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Autres biens en fidéicommis"
        description="Ce que vous détenez pour un client et qui n'est pas de l'argent."
        backHref={routes.inspection}
        backLabel="Retour à l'inspection"
      />

      <TrustPropertyScreen
        province={province}
        canEdit={canEdit}
        held={all.filter((p) => !p.releasedAt).map(map)}
        released={all.filter((p) => p.releasedAt).map(map)}
        notices={notices.flatMap((n) =>
          n.duties.map((d) => ({
            propertyId: n.property.id,
            description: n.property.description,
            clientName: nomClient(n.property.client),
            // Le service distingue déjà les deux obligations ; on ne les fusionne pas.
            // THIRD_PARTY_RECEIPT = art. 44 · STORAGE_LOCATION et son changement = art. 45.
            kind:
              d.code === "THIRD_PARTY_RECEIPT" ? ("THIRD_PARTY" as const) : ("STORAGE" as const),
            reference: d.reference,
            dutyFr: d.labelFr,
          })),
        )}
        retentionFr={`${retention.reference} — ${retention.noteFr}`}
      />
    </div>
  );
}
