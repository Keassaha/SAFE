"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  certifyAnnualReportAction,
  generateAnnualReportAction,
  markSubmittedAction,
  type ActionResult,
} from "@/app/(app)/inspection/rapport-annuel/actions";
import {
  BlockHeader,
  EmptyLine,
  ErrorBanner,
  Field,
  Panel,
  Pill,
  PrimaryButton,
  SecondaryButton,
  Table,
  day,
  inputClass,
  inputNumberClass,
  money,
  monthLabel,
} from "./primitives";

/**
 * Rapport comptable annuel — art. 42 B-1 r.5.
 *
 * ── Ce que cet écran refuse de faire ─────────────────────────────────────────
 *
 * INVENTER UNE ÉCHÉANCE. Le délai de trente jours court depuis la réception d'une
 * demande du directeur de l'inspection professionnelle, pas depuis une date de
 * calendrier. Sans demande, l'écran n'affiche aucune date : il rappelle seulement
 * l'obligation de rendre compte au moins une fois par an.
 *
 * RECALCULER LES DOUZE MOIS. Les totaux du 42(4) reprennent les rapports mensuels
 * déjà certifiés. Les recalculer depuis le registre pourrait produire un chiffre
 * différent de celui que l'avocate a signé, et c'est précisément ce qu'un inspecteur
 * recoupe.
 *
 * TRANSMETTRE. Le formulaire prescrit par le Comité exécutif n'a pas été obtenu, et
 * l'envoi est l'acte de l'avocate. L'écran consigne la date, rien de plus.
 */

interface Deadline {
  dueAt: string | null;
  daysRemaining: number | null;
  overdue: boolean;
  noteFr: string;
}

interface Block {
  id: string;
  titleFr: string;
  reference: string;
  requiredFieldsFr: string[];
  newVersusMonthly: boolean;
}

interface Blocker {
  code: string;
  messageFr: string;
  reference: string;
  remedyFr: string;
}

export interface AnnualDetail {
  id: string;
  periodStart: string;
  periodEnd: string;
  accountLabel: string;
  accountLast4: string | null;
  bankStatementBalance: number;
  journalBalance: number;
  ledgerSumBalance: number;
  outstandingChequesTotal: number;
  depositsInTransitTotal: number;
  reconciledBalance: number;
  ecartPeriode: number;
  ecartCartesClients: number;
  certifiedAt: string | null;
  submittedAt: string | null;
  declarationText: string | null;
  deadline: Deadline | null;
  monthlyTotals: {
    periode: string;
    totalReceipts: number;
    totalDisbursements: number;
    certified: boolean;
  }[];
  closedAccounts: {
    accountLabel: string;
    accountType: string;
    institutionName: string;
    clientName: string | null;
    closedAt: string;
    closureReason: string | null;
  }[];
  ledgerCount: number;
  chequeCount: number;
  depositCount: number;
  blockers: Blocker[];
}

interface Props {
  canEdit: boolean;
  accounts: { id: string; label: string; last4: string | null }[];
  reports: { id: string; periodStart: string; periodEnd: string; certifiedAt: string | null }[];
  detail: AnnualDetail | null;
  defaultPeriodStart: string;
  blocks: Block[];
}

export function AnnualReportScreen({
  canEdit,
  accounts,
  reports,
  detail,
  defaultPeriodStart,
  blocks,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(!detail);

  function run(action: (fd: FormData) => Promise<ActionResult>, fd: FormData) {
    setError(null);
    startTransition(async () => {
      const r = await action(fd);
      if (!r.ok) setError(r.error);
      else {
        setShowForm(false);
        router.refresh();
      }
    });
  }

  if (accounts.length === 0) {
    return (
      <Panel className="p-6">
        <h2 className="text-base font-medium text-[var(--si-ink)]">
          Aucun compte en fidéicommis n&apos;est enregistré
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--si-muted)]">
          Le rapport annuel se produit compte par compte. Sans compte déclaré, il n&apos;y a rien
          à rapporter.
        </p>
      </Panel>
    );
  }

  const certified = Boolean(detail?.certifiedAt);
  // Le blocage « déjà certifié » n'est pas un défaut à corriger : il dit seulement que le
  // document est figé. L'afficher en rouge ferait paniquer pour un travail terminé.
  const blockers = (detail?.blockers ?? []).filter((b) => b.code !== "ALREADY_CERTIFIED");

  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
      {/* ── Les périodes ─────────────────────────────────────────── */}
      <aside className="min-w-0 space-y-3">
        {canEdit && (
          <SecondaryButton type="button" onClick={() => setShowForm((v) => !v)} className="w-full">
            Produire un rapport
          </SecondaryButton>
        )}
        <Panel>
          <div className="border-b border-[var(--si-line)] px-3 py-2">
            <h2 className="text-xs font-medium uppercase tracking-wide text-[var(--si-muted)]">
              Périodes
            </h2>
          </div>
          {reports.length === 0 ? (
            <EmptyLine>Aucun rapport annuel produit.</EmptyLine>
          ) : (
            <ul>
              {reports.map((r) => (
                <li key={r.id} className="border-b border-[var(--si-line)] last:border-b-0">
                  <button
                    type="button"
                    onClick={() => router.push(`/inspection/rapport-annuel?rapport=${r.id}`)}
                    className={`flex w-full flex-col items-start gap-1 px-3 py-2.5 text-left transition-colors ${
                      detail?.id === r.id ? "bg-si-forest/[0.05]" : "hover:bg-si-forest/[0.03]"
                    }`}
                  >
                    <span className="text-sm text-[var(--si-ink)]">
                      {monthLabel(r.periodStart)} — {monthLabel(r.periodEnd)}
                    </span>
                    {r.certifiedAt ? (
                      <Pill tone="done">Certifié</Pill>
                    ) : (
                      <Pill tone="info">À certifier</Pill>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </aside>

      <div className="min-w-0 space-y-6">
        <ErrorBanner>{error}</ErrorBanner>

        {/* ── Production ───────────────────────────────────────────── */}
        {showForm && canEdit && (
          <Panel>
            <BlockHeader title="Produire le rapport d'une période" reference="B-1 r.5, art. 42" />
            <form className="space-y-4 p-4" action={(fd) => run(generateAnnualReportAction, fd)}>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Premier mois de la période">
                  <input
                    type="month"
                    name="periodStart"
                    defaultValue={defaultPeriodStart}
                    className={inputClass}
                  />
                </Field>
                <Field label="Compte en fidéicommis">
                  <select
                    name="trustBankAccountId"
                    defaultValue={accounts[0]?.id}
                    className={inputClass}
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.label}
                        {a.last4 ? ` ••${a.last4}` : ""}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Solde au relevé, fin de période">
                  <input
                    name="bankStatementBalance"
                    inputMode="decimal"
                    placeholder="0,00"
                    className={inputNumberClass}
                  />
                </Field>
                <Field
                  label="Demande du directeur reçue le"
                  hint="Facultatif. Sans demande, aucun délai ne court."
                >
                  <input type="date" name="requestReceivedAt" className={inputClass} />
                </Field>
              </div>
              <PrimaryButton type="submit" disabled={pending}>
                {pending ? "Production en cours" : "Produire le rapport"}
              </PrimaryButton>
            </form>
          </Panel>
        )}

        {!detail ? (
          !showForm && (
            <Panel className="p-6">
              <h2 className="text-base font-medium text-[var(--si-ink)]">Aucun rapport annuel</h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--si-muted)]">
                Le directeur de l&apos;inspection professionnelle peut le demander à tout moment,
                et vous avez alors trente jours pour le produire.
              </p>
            </Panel>
          )
        ) : (
          <>
            {/* ── L'état ───────────────────────────────────────────── */}
            <Panel className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-base font-medium text-[var(--si-ink)]">
                    {monthLabel(detail.periodStart)} au {monthLabel(detail.periodEnd)}
                  </h2>
                  <p className="mt-0.5 text-sm text-[var(--si-muted)]">
                    {detail.accountLabel}
                    {detail.accountLast4 ? ` ••${detail.accountLast4}` : ""}
                  </p>
                </div>
                <div className="max-w-md">
                  <div className="flex justify-start sm:justify-end">
                    {certified ? (
                      <Pill tone="done">Certifié le {day(detail.certifiedAt)}</Pill>
                    ) : detail.deadline?.overdue ? (
                      <Pill tone="action">En retard depuis le {day(detail.deadline.dueAt)}</Pill>
                    ) : detail.deadline?.dueAt ? (
                      <Pill tone="action">À remettre le {day(detail.deadline.dueAt)}</Pill>
                    ) : (
                      <Pill tone="info">À certifier</Pill>
                    )}
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-[var(--si-muted)]">
                    {detail.deadline
                      ? detail.deadline.noteFr
                      : "Aucune demande du directeur n'est enregistrée : aucun délai de trente jours ne court. L'obligation qui demeure est de rendre compte au moins une fois par an."}
                  </p>
                </div>
              </div>

              {certified && detail.declarationText && (
                <blockquote className="mt-4 border-l-2 border-[var(--si-forest)]/30 pl-3 text-sm leading-relaxed text-[var(--si-ink)]">
                  {detail.declarationText}
                </blockquote>
              )}
            </Panel>

            {/* ── Ce qui bloque ────────────────────────────────────── */}
            {blockers.length > 0 && !certified && (
              <Panel tone="alert" className="p-4">
                <h3 className="text-base font-medium text-si-danger-ink">
                  {blockers.length === 1
                    ? "Un point empêche la certification"
                    : `${blockers.length} points empêchent la certification`}
                </h3>
                <ul className="mt-3">
                  {blockers.map((b) => (
                    <li
                      key={b.code}
                      className="border-t border-si-danger/15 py-2.5 text-sm first:border-t-0 first:pt-0"
                    >
                      <span className="text-[var(--si-ink)]">{b.messageFr}</span>
                      <span className="text-[var(--si-muted)]"> · {b.reference}</span>
                      <p className="mt-0.5 text-[var(--si-muted)]">{b.remedyFr}</p>
                    </li>
                  ))}
                </ul>
              </Panel>
            )}

            {/* ── Art. 42(4) — les douze mois ──────────────────────── */}
            <Panel>
              <BlockHeader
                title="Total des recettes et des débours de chaque mois"
                reference="B-1 r.5, art. 42(4)"
                count={detail.monthlyTotals.length}
                countLabel="mois"
              />
              <Table
                head={["Mois", "Recettes", "Débours", "Rapport mensuel"]}
                align={["left", "right", "right", "left"]}
                firstColumnWidth="w-1/3"
                rows={detail.monthlyTotals.map((m) => [
                  monthLabel(m.periode),
                  money(m.totalReceipts),
                  money(m.totalDisbursements),
                  m.certified ? (
                    <Pill key="e" tone="done">
                      certifié
                    </Pill>
                  ) : (
                    <Pill key="e" tone="action">
                      non certifié
                    </Pill>
                  ),
                ])}
              />
              <p className="border-t border-[var(--si-line)] px-4 py-3 text-xs leading-relaxed text-[var(--si-muted)]">
                Ces totaux reprennent les rapports mensuels. Un mois non certifié empêche la
                certification annuelle : le rapport reposerait sur des chiffres que personne
                n&apos;a rapprochés.
              </p>
            </Panel>

            {/* ── Art. 42(5) — l'état comparatif ───────────────────── */}
            <Panel>
              <BlockHeader
                title="État comparatif à la fin de la période"
                reference="B-1 r.5, art. 42(5)"
              />
              <dl className="px-4 py-2">
                {(
                  [
                    ["Solde au relevé de l'institution", detail.bankStatementBalance, false],
                    ["Chèques en circulation", -detail.outstandingChequesTotal, false],
                    ["Recettes en circulation", detail.depositsInTransitTotal, false],
                    ["Solde rapproché", detail.reconciledBalance, false],
                    ["Solde au journal", detail.journalBalance, false],
                    [
                      "Écart de période",
                      detail.ecartPeriode,
                      Math.abs(detail.ecartPeriode) > 0.005,
                    ],
                    ["Somme des cartes-clients", detail.ledgerSumBalance, false],
                    [
                      "Écart avec les cartes-clients",
                      detail.ecartCartesClients,
                      Math.abs(detail.ecartCartesClients) > 0.005,
                    ],
                  ] as [string, number, boolean][]
                ).map(([label, valeur, flag]) => (
                  <div
                    key={label}
                    className="flex items-baseline justify-between gap-4 border-b border-[var(--si-line)] py-2 last:border-b-0"
                  >
                    <dt className="min-w-0 text-sm text-[var(--si-muted)]">{label}</dt>
                    <dd
                      className={`shrink-0 text-sm tabular-nums ${
                        flag ? "text-si-danger-ink" : "text-[var(--si-ink)]"
                      }`}
                    >
                      {money(valeur)}
                    </dd>
                  </div>
                ))}
              </dl>
            </Panel>

            {/* ── Art. 42(7) — les comptes fermés ──────────────────── */}
            <Panel>
              <BlockHeader
                title="Comptes fermés au cours de la période"
                reference="B-1 r.5, art. 42(7)"
                count={detail.closedAccounts.length}
                countLabel="compte"
              />
              {detail.closedAccounts.length === 0 ? (
                <EmptyLine>Aucun compte n&apos;a été fermé durant la période.</EmptyLine>
              ) : (
                <Table
                  head={["Compte", "Nature", "Institution", "Fermé le"]}
                  align={["left", "left", "left", "left"]}
                  rows={detail.closedAccounts.map((c) => [
                    <span key="l">
                      {c.accountLabel}
                      {c.clientName ? (
                        <span className="text-[var(--si-muted)]"> · {c.clientName}</span>
                      ) : null}
                      {c.closureReason ? (
                        <span className="mt-0.5 block text-xs text-[var(--si-muted)]">
                          {c.closureReason}
                        </span>
                      ) : null}
                    </span>,
                    c.accountType === "PARTICULIER" ? "Particulier" : "Général",
                    c.institutionName,
                    day(c.closedAt),
                  ])}
                />
              )}
              <p className="border-t border-[var(--si-line)] px-4 py-3 text-xs leading-relaxed text-[var(--si-muted)]">
                Cette obligation n&apos;a pas d&apos;équivalent au rapport mensuel. C&apos;est
                aussi pourquoi SAFE ne supprime jamais un compte fermé : il doit pouvoir figurer
                ici, parfois des mois plus tard.
              </p>
            </Panel>

            {/* ── Les listes reprises du mensuel ───────────────────── */}
            <Panel>
              <BlockHeader
                title="Listes jointes au rapport"
                reference="B-1 r.5, art. 42(1), 42(2), 42(3)"
              />
              <Table
                head={["Liste", "Lignes"]}
                align={["left", "right"]}
                rows={[
                  ["Soldes aux cartes-clients à la fin de la période", detail.ledgerCount],
                  ["Chèques en circulation", detail.chequeCount],
                  ["Recettes en circulation", detail.depositCount],
                ].map(([l, n]) => [l as string, String(n)])}
              />
              <p className="border-t border-[var(--si-line)] px-4 py-3 text-xs leading-relaxed text-[var(--si-muted)]">
                Ces trois listes sont figées avec le rapport et s&apos;impriment depuis les
                registres. Elles reprennent, à la fin de la période, ce que le rapport mensuel
                montre chaque mois.
              </p>
            </Panel>

            {/* ── Ce que l'article exige ───────────────────────────── */}
            <Panel>
              <BlockHeader title="Ce que l'article 42 exige" reference="B-1 r.5, art. 42" />
              <ul className="px-4 py-2">
                {blocks.map((b) => (
                  <li
                    key={b.id}
                    className="border-b border-[var(--si-line)] py-2.5 text-sm last:border-b-0"
                  >
                    <span className="text-[var(--si-ink)]">{b.titleFr}</span>
                    <span className="text-[var(--si-muted)]"> · {b.reference}</span>
                    {b.newVersusMonthly && (
                      <span className="ml-2 align-middle">
                        <Pill tone="info">propre à l&apos;annuel</Pill>
                      </span>
                    )}
                    <p className="mt-0.5 text-xs text-[var(--si-muted)]">
                      {b.requiredFieldsFr.join(" · ")}
                    </p>
                  </li>
                ))}
              </ul>
            </Panel>

            {/* ── Signature et transmission ────────────────────────── */}
            {canEdit && (
              <Panel className="p-4">
                {!certified ? (
                  <>
                    <h3 className="text-sm font-medium text-[var(--si-ink)]">
                      Certifier ce rapport
                    </h3>
                    <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[var(--si-muted)]">
                      La certification fige le document. Elle exige les douze rapports mensuels
                      certifiés et le relevé du dernier mois joint : cette exigence découle de la
                      combinaison des articles 40 et 42, elle n&apos;est pas une phrase du
                      règlement.
                    </p>
                    <form className="mt-3" action={(fd) => run(certifyAnnualReportAction, fd)}>
                      <input type="hidden" name="reportId" value={detail.id} />
                      <PrimaryButton type="submit" disabled={pending}>
                        {pending ? "Certification en cours" : "Certifier le rapport"}
                      </PrimaryButton>
                    </form>
                  </>
                ) : detail.submittedAt ? (
                  <p className="text-sm text-[var(--si-ink)]">
                    Transmis au directeur de l&apos;inspection professionnelle le{" "}
                    {day(detail.submittedAt)}.
                  </p>
                ) : (
                  <>
                    <h3 className="text-sm font-medium text-[var(--si-ink)]">
                      Consigner la transmission
                    </h3>
                    <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[var(--si-muted)]">
                      SAFE ne transmet pas le rapport. Il se dépose sur le formulaire prescrit par
                      le Comité exécutif, que SAFE n&apos;a pas obtenu, et l&apos;envoi est votre
                      acte. Inscrivez la date à laquelle vous l&apos;avez fait.
                    </p>
                    <form
                      className="mt-3 flex flex-wrap items-end gap-2"
                      action={(fd) => run(markSubmittedAction, fd)}
                    >
                      <input type="hidden" name="reportId" value={detail.id} />
                      <Field label="Transmis le">
                        <input type="date" name="submittedAt" required className={inputClass} />
                      </Field>
                      <PrimaryButton type="submit" disabled={pending}>
                        {pending ? "Enregistrement" : "Consigner"}
                      </PrimaryButton>
                    </form>
                  </>
                )}
              </Panel>
            )}
          </>
        )}
      </div>
    </div>
  );
}
