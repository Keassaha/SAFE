import { requireCabinetAndUser } from "@/lib/auth/session";
import {
  canManageCabinetSettings,
  canManageDocuments,
  canViewBillingTrust,
} from "@/lib/auth/permissions";
import type { UserRole } from "@prisma/client";
import { PageHeader } from "@/components/ui/PageHeader";
import { routes } from "@/lib/routes";
import { prisma } from "@/lib/db";
import { getCabinetProvince } from "@/lib/cabinet/get-province";
import { resolveProvince } from "@/lib/compliance/rules";
import { CLOSED_MATTERS_LIST_YEARS } from "@/lib/compliance/practice-lifecycle";
import {
  getClosedMattersList,
  getDeadlineAlerts,
  getSuccessionStatus,
  listProtectedClientOriginals,
} from "@/lib/services/compliance/practice-lifecycle-service";
import { clientDisplayName } from "@/lib/clients/normalize-name";
import { LifecycleScreen } from "@/components/conformite/LifecycleScreen";
import { Panel } from "@/components/conformite/primitives";

/**
 * Écran du cycle de vie du cabinet.
 *
 * Art. 7 (rappel des délais), 9 (listes de dossiers), 19 (originaux du client) et
 * 74 à 82 (cessation d'exercice) B-1 r.5.
 *
 * Ces articles ne parlent pas de fidéicommis : ils décrivent ce qu'un cabinet doit
 * tenir pour être un cabinet. Un inspecteur les vérifie au même titre que la
 * comptabilité, et c'est pourquoi ils vivent ici plutôt que dans un module comptable.
 *
 * ⚠️ QUÉBEC SEULEMENT. By-Law 9 ne contient aucun de ces articles. Une obligation de
 * plan de succession existe au LSO, mais elle a été relevée en recherche web et n'a
 * jamais été lue dans un texte officiel : la modéliser reviendrait à inventer sa
 * teneur.
 */

export default async function CycleDeViePage() {
  const { cabinetId, role } = await requireCabinetAndUser();
  if (!canViewBillingTrust(role as UserRole)) {
    return (
      <div className="p-6">
        <p className="text-si-danger-ink">Vous n&apos;avez pas accès aux écrans d&apos;inspection.</p>
      </div>
    );
  }

  const province = resolveProvince(await getCabinetProvince(cabinetId));

  const header = (
    <PageHeader
      title="Cycle de vie du cabinet"
      description={
        province === "QC"
          ? "Les délais, les listes de dossiers, les originaux du client et le jour où le cabinet s'arrête."
          : "Ces obligations sont propres au Québec."
      }
      backHref={routes.inspection}
      backLabel="Retour à l'inspection"
    />
  );

  if (province !== "QC") {
    return (
      <div className="animate-fade-in space-y-6">
        {header}
        <Panel className="p-6">
          <h2 className="text-base font-medium text-[var(--si-ink)]">
            Ces obligations ne figurent pas dans By-Law 9
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--si-muted)]">
            Le rappel des délais, les listes de dossiers actifs et fermés, la protection des
            originaux du client et la cession en cas de cessation d&apos;exercice viennent des
            articles 7, 9, 19 et 74 à 82 du règlement québécois. By-Law 9, lu intégralement, n&apos;en
            contient aucun équivalent.
          </p>
          <p className="mt-3 max-w-2xl text-xs leading-relaxed text-[var(--si-muted)]">
            Le Barreau de l&apos;Ontario impose par ailleurs un plan de succession. Cette
            obligation a été relevée en recherche web, jamais lue dans un texte officiel : SAFE ne
            la modélise pas plutôt que d&apos;en inventer la teneur.
          </p>
        </Panel>
      </div>
    );
  }

  const canEditPlan = canManageCabinetSettings(role as UserRole);
  const canEditDocuments = canManageDocuments(role as UserRole);

  const [succession, deadlines, closed, originals, activeMattersCount] = await Promise.all([
    getSuccessionStatus(cabinetId),
    getDeadlineAlerts({ cabinetId }),
    getClosedMattersList({ cabinetId }),
    listProtectedClientOriginals({ cabinetId }),
    prisma.dossier.count({
      where: { cabinetId, statut: { in: ["ouvert", "actif", "en_attente"] } },
    }),
  ]);

  // Les noms de clients et les références de dossiers sont résolus ici, pas dans le
  // service : celui-ci renvoie des identifiants, et un écran qui afficherait des cuid
  // ne servirait à personne.
  const [clients, dossiers, documents] = await Promise.all([
    closed.length
      ? prisma.client.findMany({
          where: { cabinetId, id: { in: [...new Set(closed.map((c) => c.clientId))] } },
          select: { id: true, prenom: true, nom: true, raisonSociale: true },
        })
      : Promise.resolve([]),
    originals.length
      ? prisma.dossier.findMany({
          where: {
            cabinetId,
            id: { in: [...new Set(originals.map((o) => o.dossierId).filter(Boolean))] as string[] },
          },
          select: { id: true, reference: true },
        })
      : Promise.resolve([]),
    canEditDocuments
      ? prisma.document.findMany({
          where: { cabinetId },
          select: { id: true, nom: true },
          orderBy: { createdAt: "desc" },
          take: 50,
        })
      : Promise.resolve([]),
  ]);

  const nomClient = new Map(clients.map((c) => [c.id, clientDisplayName(c)]));
  const refDossier = new Map(dossiers.map((d) => [d.id, d.reference]));

  return (
    <div className="animate-fade-in space-y-6">
      {header}

      <LifecycleScreen
        canEditPlan={canEditPlan}
        canEditDocuments={canEditDocuments}
        closedMattersYears={CLOSED_MATTERS_LIST_YEARS}
        activeMattersCount={activeMattersCount}
        succession={{
          hasPlan: succession.hasPlan,
          successorName: succession.successorName,
          successorBarreauNo: succession.successorBarreauNo,
          successorEmail: succession.successorEmail,
          successorPhone: succession.successorPhone,
          successorConfirmedAt: succession.successorConfirmedAt
            ? succession.successorConfirmedAt.toISOString()
            : null,
          lastReviewedAt: succession.lastReviewedAt
            ? succession.lastReviewedAt.toISOString()
            : null,
          missing: succession.missing,
          duties: succession.duties,
        }}
        deadlines={deadlines.map((d) => ({
          dossierId: d.dossierId,
          reference: d.reference,
          titre: d.titre,
          kind: d.kind,
          qualified: d.qualified,
          dueAt: d.dueAt.toISOString(),
          alert: {
            daysRemaining: d.alert.daysRemaining,
            overdue: d.alert.overdue,
            severity: d.alert.severity,
            messageFr: d.alert.messageFr,
            reference: d.alert.reference,
          },
        }))}
        closedMatters={closed.map((m) => ({
          dossierId: m.dossierId,
          reference: m.reference,
          clientName: nomClient.get(m.clientId) ?? "—",
          closedAt: m.closedAt ? m.closedAt.toISOString() : null,
          missingClosureDate: m.missingClosureDate,
        }))}
        originals={originals.map((o) => ({
          id: o.id,
          nom: o.nom,
          dossierRef: o.dossierId ? (refDossier.get(o.dossierId) ?? null) : null,
          note: o.note,
        }))}
        documents={documents}
      />
    </div>
  );
}
