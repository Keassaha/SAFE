import Link from "next/link";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { canViewBillingTrust } from "@/lib/auth/permissions";
import type { UserRole } from "@prisma/client";
import { PageHeader } from "@/components/ui/PageHeader";
import { routes } from "@/lib/routes";
import { getCabinetProvince } from "@/lib/cabinet/get-province";
import { resolveProvince } from "@/lib/compliance/rules";
import { getOpenShortfalls } from "@/lib/services/fideicommis/trust-shortfall-service";
import { getPendingCashDeclarations } from "@/lib/services/fideicommis/cash-service";
import { getPendingPropertyNotices } from "@/lib/services/fideicommis/trust-property-service";
import { listMonthlyReports } from "@/lib/services/fideicommis/monthly-report-service";
import { listAnnualReports } from "@/lib/services/fideicommis/annual-report-service";
import {
  getDeadlineAlerts,
  getSuccessionStatus,
} from "@/lib/services/compliance/practice-lifecycle-service";
import { getFiscalYearEnd } from "@/lib/services/compliance/retention-service";
import { listUndeliveredIssuedInvoices } from "@/lib/services/billing/invoice-delivery-service";
import { getPendingCountersignatures } from "@/lib/services/fideicommis/electronic-transfer-service";
import { Panel, Pill } from "@/components/conformite/primitives";

/**
 * Section Inspection.
 *
 * ── Pourquoi cette section existe ────────────────────────────────────────────
 *
 * Ces écrans vivaient sous « Comptes en fidéicommis », et c'était faux. Quatre des
 * neuf registres ne concernent pas l'argent des clients — journal d'administration,
 * livre des honoraires, listes de dossiers actifs et fermés — et la trousse
 * d'inspection rassemble tout ce qu'un inspecteur demande, y compris ce qui n'a
 * jamais touché un dollar client.
 *
 * Le classement suit désormais la question posée : « qu'est-ce qu'un inspecteur va
 * me demander ? », et non « à quel module appartient ce code ».
 *
 * ── Ce que la page montre ────────────────────────────────────────────────────
 *
 * Chaque porte, avec l'article qui la fonde et CE QUI RÉCLAME VOTRE ATTENTION. Une
 * liste de liens sans état ne dit pas où regarder ; c'est ce qui manque qui compte.
 */

interface Porte {
  href: string;
  titre: string;
  quoi: string;
  reference: string;
  alerte?: { texte: string; grave: boolean } | null;
}

export default async function InspectionPage() {
  const { cabinetId, role } = await requireCabinetAndUser();
  if (!canViewBillingTrust(role as UserRole)) {
    return (
      <div className="p-6">
        <p className="text-si-danger-ink">Vous n&apos;avez pas accès aux écrans d&apos;inspection.</p>
      </div>
    );
  }

  const province = resolveProvince(await getCabinetProvince(cabinetId));
  const qc = province === "QC";

  // Les compteurs sont lus ici plutôt que dans chaque écran : une page d'accueil qui
  // n'affiche que des liens oblige à ouvrir les six pour savoir laquelle demande
  // quelque chose.
  const [
    decouverts,
    declarations,
    avis,
    rapports,
    annuels,
    echeances,
    plan,
    exercice,
    nonTransmisesRows,
    contresignatures,
  ] = await Promise.all([
      getOpenShortfalls({ cabinetId }).catch(() => ({ openCount: 0 })),
      getPendingCashDeclarations({ cabinetId }).catch(() => []),
      getPendingPropertyNotices({ cabinetId }).catch(() => []),
      listMonthlyReports(cabinetId).catch(() => []),
      qc ? listAnnualReports(cabinetId).catch(() => []) : Promise.resolve([]),
      qc ? getDeadlineAlerts({ cabinetId }).catch(() => []) : Promise.resolve([]),
      qc ? getSuccessionStatus(cabinetId).catch(() => null) : Promise.resolve(null),
      getFiscalYearEnd(cabinetId).catch(() => null),
      listUndeliveredIssuedInvoices({ cabinetId }).catch(() => []),
      // La s. 12 n'existe qu'en Ontario : ne rien interroger ailleurs évite de compter
      // des contresignatures qu'aucun règlement n'exige du cabinet.
      qc ? Promise.resolve([]) : getPendingCountersignatures({ cabinetId }).catch(() => []),
    ]);

  const nonCertifies = rapports.filter((r) => !r.certifiedAt).length;
  const declarationsEnRetard = declarations.filter((d) => d.overdue).length;

  // Le rapport annuel n'a d'échéance QUE si une demande du directeur a été reçue.
  // Marquer « en retard » un cabinet sans demande inventerait un délai que l'art. 42
  // ne pose pas.
  const annuelsEnRetard = annuels.filter((r) => r.deadline?.overdue).length;
  const annuelsNonCertifies = annuels.filter((r) => !r.certifiedAt).length;

  // Seules les prescriptions dépassées remontent ici. Une échéance de procédure en
  // retard se rattrape ; une prescription franchie éteint le droit du client, et c'est
  // la seule qui mérite de crier depuis l'accueil.
  const prescriptionsDepassees = echeances.filter(
    (e) => e.kind === "PRESCRIPTION" && e.alert.overdue,
  ).length;
  const cessionnaire = plan?.hasPlan ?? true;
  const exerciceRegle = exercice !== null;
  const nonTransmises = nonTransmisesRows.length;
  const contresignaturesEnRetard = contresignatures.filter((c) => c.overdue).length;

  const portes: Porte[] = [
    {
      href: routes.rapportMensuel,
      titre: "Rapport mensuel",
      quoi: "Le premier document qu'un inspecteur demande.",
      reference: qc ? "art. 41" : "s. 18(8)",
      alerte:
        rapports.length === 0
          ? { texte: "aucun rapport produit", grave: true }
          : nonCertifies > 0
            ? { texte: `${nonCertifies} à certifier`, grave: false }
            : null,
    },
    {
      href: routes.trousseInspection,
      titre: "Trousse d'inspection",
      quoi: "Tout rassembler pour une période, en un fichier.",
      reference: qc ? "art. 29, 30, 33" : "par. 21(2)",
    },
    {
      href: routes.registres,
      titre: "Registres",
      quoi: "Les livres à tenir, prêts à imprimer.",
      reference: qc ? "art. 30" : "par. 21(2)",
    },
    {
      href: routes.soldesDebiteurs,
      titre: "Soldes débiteurs",
      quoi: "Les cartes-clients passées sous zéro.",
      reference: qc ? "art. 59, 60" : "s. 9(3), 14",
      alerte:
        decouverts.openCount > 0
          ? { texte: `${decouverts.openCount} à combler`, grave: true }
          : null,
    },
    {
      href: routes.especes,
      titre: "Espèces",
      quoi: "Reçus, seuils et déclarations à transmettre.",
      reference: qc ? "art. 69 à 73" : "s. 4 à 6, 19",
      alerte:
        declarationsEnRetard > 0
          ? { texte: `${declarationsEnRetard} en retard`, grave: true }
          : declarations.length > 0
            ? { texte: `${declarations.length} à transmettre`, grave: false }
            : null,
    },
    {
      href: routes.autresBiens,
      titre: "Autres biens",
      quoi: "Ce que vous détenez et qui n'est pas de l'argent.",
      reference: qc ? "art. 43 à 46" : "s. 18(9)",
      alerte: avis.length > 0 ? { texte: `${avis.length} avis à donner`, grave: false } : null,
    },
    {
      href: routes.transmissionFactures,
      titre: "Transmission des factures",
      quoi: "Ce qui vous empêche de vous payer sur le fidéicommis.",
      reference: qc ? "art. 56(2)" : "s. 9(1)3",
      alerte:
        nonTransmises > 0
          ? { texte: `${nonTransmises} bloque${nonTransmises === 1 ? "" : "nt"} un retrait`, grave: true }
          : null,
    },
    {
      href: routes.rapportAnnuel,
      titre: "Rapport annuel",
      quoi: "Les douze mois, sur demande du directeur de l'inspection.",
      reference: "art. 42",
      alerte:
        annuelsEnRetard > 0
          ? { texte: `${annuelsEnRetard} en retard`, grave: true }
          : annuels.length === 0
            ? { texte: "aucun rapport produit", grave: false }
            : annuelsNonCertifies > 0
              ? { texte: `${annuelsNonCertifies} à certifier`, grave: false }
              : null,
    },
    {
      href: routes.cycleDeVie,
      titre: "Cycle de vie du cabinet",
      quoi: "Prescriptions, dossiers fermés, cessionnaire désigné.",
      reference: "art. 7, 9, 19, 78",
      alerte:
        prescriptionsDepassees > 0
          ? { texte: `${prescriptionsDepassees} prescription${prescriptionsDepassees === 1 ? "" : "s"} dépassée${prescriptionsDepassees === 1 ? "" : "s"}`, grave: true }
          : !cessionnaire
            ? { texte: "aucun cessionnaire", grave: true }
            : null,
    },
    {
      href: routes.virements,
      titre: "Virements électroniques",
      quoi: qc
        ? "Les seules formes admises pour un retrait."
        : "Form 9A, double contrôle, contresignature.",
      reference: qc ? "art. 58" : "s. 10, 12",
      alerte:
        contresignaturesEnRetard > 0
          ? {
              texte: `${contresignaturesEnRetard} contresignature${contresignaturesEnRetard === 1 ? "" : "s"} en retard`,
              grave: true,
            }
          : null,
    },
    {
      href: routes.conservation,
      titre: "Conservation",
      quoi: "Combien de temps garder quoi, et l'accès de l'inspecteur.",
      reference: qc ? "art. 29 à 33" : "s. 21 à 23",
      // Sans fin d'exercice, aucune durée ancrée dessus ne se calcule. Ce n'est pas un
      // détail de réglage : c'est ce qui rend tout le bloc conservation inopérant.
      alerte: exerciceRegle ? null : { texte: "fin d'exercice non réglée", grave: true },
    },
  ];

  // Le rapport annuel et le cycle de vie sont québécois. Les proposer à un cabinet
  // ontarien lui ferait croire à une obligation qu'il n'a pas.
  const visibles = portes.filter((p) => qc || !["Rapport annuel", "Cycle de vie du cabinet"].includes(p.titre));

  const alertesGraves = visibles.filter((p) => p.alerte?.grave).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Inspection"
        description={
          qc
            ? "Ce que le Barreau du Québec demande de produire, au même endroit."
            : "What the Law Society of Ontario asks you to produce, in one place."
        }
      />

      {alertesGraves > 0 && (
        <Panel tone="alert" className="p-4">
          <h2 className="text-base font-medium text-si-danger-ink">
            {alertesGraves} point{alertesGraves === 1 ? "" : "s"} demande
            {alertesGraves === 1 ? "" : "nt"} votre attention
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[var(--si-ink)]">
            Ce sont les écrans marqués en rouge ci-dessous. Le reste peut attendre.
          </p>
        </Panel>
      )}

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibles.map((p) => (
          <li key={p.href}>
            <Link
              href={p.href}
              className="block h-full rounded-xl border border-[var(--si-line)] bg-[var(--si-surface)] p-4 transition-colors hover:bg-si-forest/[0.03]"
            >
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="text-sm font-medium text-[var(--si-ink)]">{p.titre}</h3>
                {p.alerte && <Pill tone={p.alerte.grave ? "action" : "info"}>{p.alerte.texte}</Pill>}
              </div>
              <p className="mt-1 text-sm leading-relaxed text-[var(--si-muted)]">{p.quoi}</p>
              <p className="mt-2 text-xs text-[var(--si-muted)]">{p.reference}</p>
            </Link>
          </li>
        ))}
      </ul>

      <Panel className="p-4">
        <h2 className="text-sm font-medium text-[var(--si-ink)]">
          Ce que ces écrans ne font pas
        </h2>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-[var(--si-muted)]">
          Ils rassemblent et produisent ce que le règlement exige, et ils nomment ce qui
          manque. Ils ne certifient pas que votre cabinet est conforme : c&apos;est le contenu de
          vos livres qui le décide, et c&apos;est vous qui signez.
        </p>
        <p className="mt-2 text-xs text-[var(--si-muted)]">
          Pour l&apos;état d&apos;ensemble du cabinet, voir{" "}
          <Link href={routes.conformite} className="underline">
            Conformité
          </Link>
          . Pour les mouvements de fidéicommis, voir{" "}
          <Link href={routes.comptes} className="underline">
            Comptes en fidéicommis
          </Link>
          .
        </p>
      </Panel>
    </div>
  );
}
