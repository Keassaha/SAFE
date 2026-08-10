"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  recordClientOriginalAction,
  setSuccessionPlanAction,
  type ActionResult,
} from "@/app/(app)/inspection/cycle-de-vie/actions";
import {
  BlockHeader,
  Disclosure,
  EmptyLine,
  ErrorBanner,
  Field,
  Panel,
  Pill,
  PrimaryButton,
  Table,
  day,
  inputClass,
} from "./primitives";

/**
 * Cycle de vie du cabinet — art. 7, 9, 19, 74 à 82 B-1 r.5.
 *
 * ── Ce que cet écran met en avant, et pourquoi ───────────────────────────────
 *
 * LE CESSIONNAIRE D'ABORD. C'est l'obligation la plus facile à manquer : elle se tient
 * à froid, des années avant de servir, et rien ne la rappelle. Un cabinet qui ne l'a
 * pas prévue ne s'en aperçoit jamais par lui-même.
 *
 * LES PRESCRIPTIONS DÉPASSÉES NE DISPARAISSENT PAS. Une prescription franchie reste
 * affichée en permanence : c'est précisément le moment où il faut agir, aviser le
 * client et l'assureur. La faire disparaître le lendemain aiderait à l'oublier.
 *
 * LES PRÉAVIS SONT DES CHOIX, PAS DES ARTICLES. L'art. 7 exige un système « à jour »
 * de rappel ; il ne fixe ni 180, ni 90, ni 30 jours. L'écran le dit.
 */

interface DeadlineLine {
  dossierId: string;
  reference: string | null;
  titre: string;
  kind: string;
  dueAt: string;
  qualified: boolean;
  alert: {
    daysRemaining: number;
    overdue: boolean;
    severity: string;
    messageFr: string;
    reference: string;
  };
}

interface Duty {
  id: string;
  labelFr: string;
  reference: string;
  anticipatory: boolean;
  detailFr: string;
}

interface Props {
  canEditPlan: boolean;
  canEditDocuments: boolean;
  succession: {
    hasPlan: boolean;
    successorName: string | null;
    successorBarreauNo: string | null;
    successorEmail: string | null;
    successorPhone: string | null;
    successorConfirmedAt: string | null;
    lastReviewedAt: string | null;
    missing: Duty[];
    duties: Duty[];
  };
  deadlines: DeadlineLine[];
  closedMatters: {
    dossierId: string;
    reference: string | null;
    clientName: string;
    closedAt: string | null;
    missingClosureDate: boolean;
  }[];
  activeMattersCount: number;
  closedMattersYears: number;
  originals: { id: string; nom: string; dossierRef: string | null; note: string | null }[];
  documents: { id: string; nom: string }[];
}

export function LifecycleScreen({
  canEditPlan,
  canEditDocuments,
  succession,
  deadlines,
  closedMatters,
  activeMattersCount,
  closedMattersYears,
  originals,
  documents,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showPlanForm, setShowPlanForm] = useState(!succession.hasPlan);

  function run(action: (fd: FormData) => Promise<ActionResult>, fd: FormData) {
    setError(null);
    startTransition(async () => {
      const r = await action(fd);
      if (!r.ok) setError(r.error);
      else {
        setShowPlanForm(false);
        router.refresh();
      }
    });
  }

  const depassees = deadlines.filter((d) => d.alert.overdue);
  const critiques = deadlines.filter((d) => !d.alert.overdue && d.alert.severity === "CRITICAL");
  const proches = deadlines.filter(
    (d) => !d.alert.overdue && d.alert.severity !== "CRITICAL" && d.alert.severity !== "NONE",
  );
  const nonQualifiees = deadlines.filter((d) => !d.qualified).length;
  const sansDate = closedMatters.filter((m) => m.missingClosureDate).length;

  return (
    <div className="min-w-0 space-y-6">
      <ErrorBanner>{error}</ErrorBanner>

      {/* ── Art. 78 — le cessionnaire ───────────────────────────── */}
      <Panel tone={succession.missing.length > 0 ? "alert" : "neutral"} className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h2
              className={`text-base font-medium ${
                succession.missing.length > 0 ? "text-si-danger-ink" : "text-[var(--si-ink)]"
              }`}
            >
              {succession.hasPlan
                ? `Cessionnaire désigné : ${succession.successorName}`
                : "Aucun cessionnaire n'est désigné"}
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[var(--si-muted)]">
              {succession.hasPlan
                ? "En cas de décès ou d'inaptitude, cette personne reprend les dossiers, livres et registres du cabinet."
                : "L'article 78 impose de prévoir à qui les dossiers, livres et registres seront cédés en cas de décès ou d'inaptitude. C'est l'obligation la plus facile à manquer : elle se tient à froid, souvent des années avant de servir."}
            </p>
          </div>
          {succession.hasPlan &&
            (succession.successorConfirmedAt ? (
              <Pill tone="done">Confirmé le {day(succession.successorConfirmedAt)}</Pill>
            ) : (
              <Pill tone="info">Accord non confirmé</Pill>
            ))}
        </div>

        {succession.hasPlan && (
          <>
            <dl className="mt-4 grid gap-x-8 gap-y-2 sm:grid-cols-2">
              {(
                [
                  ["Numéro au Barreau", succession.successorBarreauNo],
                  ["Courriel", succession.successorEmail],
                  ["Téléphone", succession.successorPhone],
                  ["Dernière revue", succession.lastReviewedAt ? day(succession.lastReviewedAt) : null],
                ] as [string, string | null][]
              )
                .filter(([, v]) => Boolean(v))
                .map(([label, v]) => (
                  <div key={label} className="flex items-baseline justify-between gap-4">
                    <dt className="text-sm text-[var(--si-muted)]">{label}</dt>
                    <dd className="min-w-0 text-sm text-[var(--si-ink)]">{v}</dd>
                  </div>
                ))}
            </dl>
            {!succession.successorConfirmedAt && (
              <p className="mt-3 max-w-2xl text-xs leading-relaxed text-[var(--si-muted)]">
                Le règlement n&apos;exige pas la preuve de l&apos;accord du cessionnaire. Un
                cabinet qui découvrirait son refus le jour venu n&apos;aurait toutefois plus de
                plan : la confirmation se note ici, sans rien bloquer.
              </p>
            )}
          </>
        )}

        {canEditPlan && (
          <div className="mt-4">
            {!showPlanForm ? (
              <PrimaryButton type="button" onClick={() => setShowPlanForm(true)}>
                {succession.hasPlan ? "Modifier la désignation" : "Désigner un cessionnaire"}
              </PrimaryButton>
            ) : (
              <form
                className="space-y-4 border-t border-[var(--si-line)] pt-4"
                action={(fd) => run(setSuccessionPlanAction, fd)}
              >
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Field label="Nom de l'avocat cessionnaire">
                    <input
                      name="successorName"
                      required
                      defaultValue={succession.successorName ?? ""}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Numéro au Barreau">
                    <input
                      name="successorBarreauNo"
                      defaultValue={succession.successorBarreauNo ?? ""}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Courriel">
                    <input
                      type="email"
                      name="successorEmail"
                      defaultValue={succession.successorEmail ?? ""}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Téléphone">
                    <input
                      name="successorPhone"
                      defaultValue={succession.successorPhone ?? ""}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Accord confirmé le" hint="Facultatif.">
                    <input
                      type="date"
                      name="successorConfirmedAt"
                      defaultValue={succession.successorConfirmedAt?.slice(0, 10) ?? ""}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Note">
                    <input name="notes" className={inputClass} />
                  </Field>
                </div>
                <PrimaryButton type="submit" disabled={pending}>
                  {pending ? "Enregistrement" : "Enregistrer la désignation"}
                </PrimaryButton>
              </form>
            )}
          </div>
        )}
      </Panel>

      {/* ── Art. 7 — les échéances ──────────────────────────────── */}
      <Panel>
        <BlockHeader
          title="Système de rappel des délais"
          reference="B-1 r.5, art. 7"
          count={deadlines.length}
          countLabel="échéance"
        />
        {deadlines.length === 0 ? (
          <EmptyLine>
            Aucune échéance n&apos;est inscrite au calendrier. L&apos;article 7 exige un système
            à jour de rappel des prescriptions et de tout délai influant sur les recours.
          </EmptyLine>
        ) : (
          <>
            {depassees.length > 0 && (
              <Section
                titre={
                  depassees.length === 1
                    ? "Une échéance est dépassée"
                    : `${depassees.length} échéances sont dépassées`
                }
                lignes={depassees}
                grave
              />
            )}
            {critiques.length > 0 && <Section titre="À traiter maintenant" lignes={critiques} />}
            {proches.length > 0 && <Section titre="À surveiller" lignes={proches} />}
            {depassees.length + critiques.length + proches.length === 0 && (
              <EmptyLine>
                Aucune échéance n&apos;entre dans un palier d&apos;alerte. Les {deadlines.length}{" "}
                inscrites au calendrier restent lointaines.
              </EmptyLine>
            )}
          </>
        )}
        <div className="space-y-1 border-t border-[var(--si-line)] px-4 py-3 text-xs leading-relaxed text-[var(--si-muted)]">
          <p>
            Les préavis de 180, 90, 30 et 7 jours sont des choix de produit. L&apos;article 7
            exige un système « à jour », il ne fixe aucun délai d&apos;avertissement.
          </p>
          {nonQualifiees > 0 && (
            <p>
              {nonQualifiees}{" "}
              {nonQualifiees === 1 ? "échéance est traitée" : "échéances sont traitées"} comme un
              rappel interne, sans effet juridique déclaré : leur nature n&apos;a pas été saisie.
              SAFE ne la devine pas depuis l&apos;intitulé, au risque d&apos;afficher un faux
              calme sur une prescription.
            </p>
          )}
        </div>
      </Panel>

      {/* ── Art. 9 — les dossiers ───────────────────────────────── */}
      <Panel>
        <BlockHeader
          title="Dossiers fermés au cours des sept dernières années"
          reference="B-1 r.5, art. 9"
          count={closedMatters.length}
          countLabel="dossier"
        />
        {closedMatters.length === 0 ? (
          <EmptyLine>Aucun dossier fermé sur la période.</EmptyLine>
        ) : (
          <Table
            head={["Dossier", "Client", "Fermé le"]}
            align={["left", "left", "left"]}
            rows={closedMatters.map((m) => [
              m.reference ?? "—",
              m.clientName,
              m.missingClosureDate ? (
                <Pill key="d" tone="action">
                  date manquante
                </Pill>
              ) : (
                day(m.closedAt)
              ),
            ])}
          />
        )}
        <div className="space-y-1 border-t border-[var(--si-line)] px-4 py-3 text-xs leading-relaxed text-[var(--si-muted)]">
          <p>
            L&apos;article 9 demande deux listes à jour : les dossiers actifs, au nombre de{" "}
            {activeMattersCount}, et les dossiers fermés au cours des {closedMattersYears}{" "}
            dernières années. Ce n&apos;est pas l&apos;obligation de conservation de
            l&apos;article 31 : un cabinet peut tout avoir gardé sans pouvoir produire la liste.
          </p>
          {sansDate > 0 && (
            <p>
              {sansDate}{" "}
              {sansDate === 1
                ? "dossier fermé n'a pas de date de fermeture. Il est affiché"
                : "dossiers fermés n'ont pas de date de fermeture. Ils sont affichés"}{" "}
              quand même : les écarter transformerait un défaut de saisie en absence pure et
              simple.
            </p>
          )}
        </div>
      </Panel>

      {/* ── Art. 19 — les originaux du client ───────────────────── */}
      <Panel>
        <BlockHeader
          title="Originaux appartenant au client"
          reference="B-1 r.5, art. 19"
          count={originals.length}
          countLabel="document"
        />
        {originals.length === 0 ? (
          <EmptyLine>
            Aucun document n&apos;est marqué comme original du client. Le marquage est un geste
            humain : SAFE ne peut pas deviner qu&apos;un fichier numérisé est l&apos;original
            notarié d&apos;un client.
          </EmptyLine>
        ) : (
          <Table
            head={["Document", "Note"]}
            align={["left", "left"]}
            rows={originals.map((o) => [
              <span key="n">
                {o.nom}
                {o.dossierRef ? (
                  <span className="text-[var(--si-muted)]"> · {o.dossierRef}</span>
                ) : null}
              </span>,
              o.note ?? "—",
            ])}
          />
        )}
        <p className="border-t border-[var(--si-line)] px-4 py-3 text-xs leading-relaxed text-[var(--si-muted)]">
          Ces documents ne peuvent pas être détruits. Deux portes de sortie, et elles sont
          ALTERNATIVES : l&apos;autorisation écrite du client, ou la remise offerte au client.
          L&apos;une suffit.
        </p>
      </Panel>

      {canEditDocuments && documents.length > 0 && (
        <Disclosure label="Marquer un document, ou consigner une porte de sortie" meta="art. 19">
          <form className="space-y-4 p-4" action={(fd) => run(recordClientOriginalAction, fd)}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Document">
                <select name="documentId" className={inputClass}>
                  {documents.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nom}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Nature">
                <select name="isClientOriginal" defaultValue="1" className={inputClass}>
                  <option value="1">Original appartenant au client</option>
                  <option value="0">Ce n&apos;est pas un original du client</option>
                </select>
              </Field>
              <Field label="Client a autorisé la destruction le" hint="Première porte de sortie.">
                <input type="date" name="clientAuthorizedDestroyAt" className={inputClass} />
              </Field>
              <Field label="Remise offerte au client le" hint="Seconde porte, équivalente.">
                <input type="date" name="returnOfferedAt" className={inputClass} />
              </Field>
              <Field label="Note" className="sm:col-span-2">
                <input name="note" className={inputClass} />
              </Field>
            </div>
            <PrimaryButton type="submit" disabled={pending}>
              {pending ? "Enregistrement" : "Enregistrer"}
            </PrimaryButton>
          </form>
        </Disclosure>
      )}

      {/* ── Art. 74 à 82 — la cessation ─────────────────────────── */}
      <Panel>
        <BlockHeader title="Le jour où le cabinet s'arrête" reference="B-1 r.5, art. 74 à 82" />
        <ul className="px-4 py-2">
          {succession.duties.map((d) => (
            <li
              key={d.id}
              className="border-b border-[var(--si-line)] py-2.5 text-sm last:border-b-0"
            >
              <span className="text-[var(--si-ink)]">{d.labelFr}</span>
              <span className="text-[var(--si-muted)]"> · {d.reference}</span>
              {d.anticipatory && (
                <span className="ml-2 align-middle">
                  <Pill tone={succession.hasPlan ? "done" : "action"}>à prévoir d&apos;avance</Pill>
                </span>
              )}
              <p className="mt-0.5 text-xs leading-relaxed text-[var(--si-muted)]">{d.detailFr}</p>
            </li>
          ))}
        </ul>
        <p className="border-t border-[var(--si-line)] px-4 py-3 text-xs leading-relaxed text-[var(--si-muted)]">
          Une seule de ces obligations se tient à l&apos;avance, et c&apos;est la désignation du
          cessionnaire. Les trois autres se déclenchent le jour venu ; elles sont listées pour
          que personne ne les découvre à ce moment-là.
        </p>
      </Panel>
    </div>
  );
}

/** Bloc d'échéances d'un même niveau d'urgence. */
function Section({
  titre,
  lignes,
  grave = false,
}: {
  titre: string;
  lignes: DeadlineLine[];
  grave?: boolean;
}) {
  return (
    <div className="border-b border-[var(--si-line)] last:border-b-0">
      <h4
        className={`px-4 pb-1 pt-3 text-xs font-medium uppercase tracking-wide ${
          grave ? "text-si-danger-ink" : "text-[var(--si-muted)]"
        }`}
      >
        {titre}
      </h4>
      <ul>
        {lignes.map((d, i) => (
          <li
            key={`${d.dossierId}-${d.titre}-${i}`}
            className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-2.5"
          >
            <div className="min-w-0">
              <span className="text-sm text-[var(--si-ink)]">{d.titre}</span>
              {d.reference && (
                <span className="text-sm text-[var(--si-muted)]"> · {d.reference}</span>
              )}
              <p
                className={`mt-0.5 text-xs leading-relaxed ${
                  d.alert.severity === "CRITICAL" ? "text-si-danger-ink" : "text-[var(--si-muted)]"
                }`}
              >
                {d.alert.messageFr}
              </p>
            </div>
            <span className="shrink-0 text-sm tabular-nums text-[var(--si-muted)]">
              {day(d.dueAt)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
