"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ReportBlock } from "@/lib/compliance/monthly-report";
import type { CabinetProvince } from "@/lib/compliance/rules";
import {
  attachBankStatementAction,
  certifyReportAction,
  generateReportAction,
  recordDiscrepancyAction,
  type ActionResult,
} from "@/app/(app)/inspection/rapport-mensuel/actions";

/**
 * Écran du rapport comptable mensuel — art. 41 B-1 r.5 / s. 18(8) By-Law 9.
 *
 * ── Décisions de design, et pourquoi ─────────────────────────────────────────
 *
 * UNE INTENTION (M2) : certifier le rapport du mois. Tout le reste de l'écran existe
 * pour rendre cette signature possible ou pour dire ce qui l'empêche.
 *
 * LES DATES SONT ABSOLUES, contrairement à A13. La règle du temps relatif vaut pour
 * un flux d'activité récente ; ici les dates SONT la donnée réglementaire. Un
 * inspecteur qui lit « il y a 3 j » sur une date d'émission de chèque ne peut rien
 * recouper. Écart assumé et motivé.
 *
 * LES LISTES NE SONT PAS TRONQUÉES. L'art. 41(1) à (3) exige des listes complètes,
 * ligne par ligne. Une liste coupée à vingt lignes ressemblerait à la liste complète.
 *
 * PAS DE GRILLE (A14) : filets horizontaux à faible opacité, aucune bordure verticale.
 * Nombres à droite (L2), entêtes et données à la même taille, la graisse seule fait la
 * hiérarchie (T2). Une colonne porteuse large, métadonnées comprimées (L3).
 */

/* ── Types sérialisés côté serveur ────────────────────────────── */

interface Deadline {
  dueAt: string | null;
  daysRemaining: number | null;
  overdue: boolean;
  reference: string;
  noteFr: string;
}

interface ReportRow {
  id: string;
  periode: string;
  status: string;
  accountLabel: string;
  certifiedAt: string | null;
  deadline: Deadline;
}

interface LedgerLine {
  clientName: string;
  dossierRef: string | null;
  lastEntryDate: string | null;
  balance: number;
}

interface ChequeLine {
  chequeNumber: number;
  issueDate: string;
  amount: number;
  payeeName: string;
  clientName: string | null;
  dossierRef: string | null;
  stale: boolean;
}

interface DepositLine {
  receivedDate: string;
  amount: number;
  payerName: string | null;
  clientName: string | null;
  dossierRef: string | null;
}

interface ReportDetail {
  id: string;
  periode: string;
  status: string;
  accountLabel: string;
  accountLast4: string | null;
  totalReceipts: number;
  totalDisbursements: number;
  bankStatementBalance: number;
  journalBalance: number;
  ledgerSumBalance: number;
  outstandingChequesTotal: number;
  depositsInTransitTotal: number;
  reconciledBalance: number;
  ecartBanque: number;
  ecartCartesClients: number;
  certifiedAt: string | null;
  declarationText: string | null;
  bankStatement: { id: string; nom: string } | null;
  documents: { id: string; nom: string }[];
  deadline: Deadline;
  ledgerLines: LedgerLine[];
  chequeLines: ChequeLine[];
  depositLines: DepositLine[];
  discrepancies: { kind: string; amount: number; explanation: string }[];
}

interface Props {
  province: CabinetProvince;
  canEdit: boolean;
  blocks: ReportBlock[];
  accounts: { id: string; label: string; last4: string | null }[];
  reports: ReportRow[];
  detail: ReportDetail | null;
  defaultPeriode: string;
  defaultAccountId: string | null;
  depositCandidates: {
    id: string;
    receivedDate: string;
    amount: number;
    clientName: string | null;
    dossierRef: string | null;
  }[];
}

/* ── Formatage ────────────────────────────────────────────────── */

const EPSILON = 0.005;

function money(n: number): string {
  return n.toLocaleString("fr-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function day(iso: string | null): string {
  return iso ? iso.slice(0, 10) : "—";
}

function monthLabel(periode: string): string {
  const [y, m] = periode.split("-").map(Number);
  const noms = [
    "janvier", "février", "mars", "avril", "mai", "juin",
    "juillet", "août", "septembre", "octobre", "novembre", "décembre",
  ];
  return `${noms[(m ?? 1) - 1]} ${y}`;
}

/* ── Primitives visuelles ─────────────────────────────────────── */

/**
 * Pastille de statut.
 *
 * Deux registres, selon le conflit tranché en §11 de la base design : fond dilué
 * quand le statut appelle une action, contour quand il est purement informatif.
 */
function Pill({ tone, children }: { tone: "action" | "info" | "done"; children: React.ReactNode }) {
  const styles = {
    action: "bg-si-danger/10 text-si-danger-ink border-transparent",
    done: "bg-si-forest/[0.06] text-[var(--si-forest)] border-transparent",
    info: "border-[var(--si-line)] text-[var(--si-muted)]",
  }[tone];
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${styles}`}>
      {children}
    </span>
  );
}

/** Surface structurelle : mate, jamais de verre (système de profondeur, plan 1). */
function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section
      className={`rounded-xl border border-[var(--si-line)] bg-[var(--si-surface)] ${className}`}
    >
      {children}
    </section>
  );
}

/** Entête de bloc, avec son article. La source se lit sans clic (PR-4). */
function BlockHeader({
  title,
  reference,
  count,
}: {
  title: string;
  reference: string;
  count?: number;
}) {
  return (
    <header className="flex items-baseline justify-between gap-4 border-b border-[var(--si-line)] px-4 py-3">
      <div>
        <h3 className="text-sm font-medium text-[var(--si-ink)]">{title}</h3>
        <p className="mt-0.5 text-xs text-[var(--si-muted)]">{reference}</p>
      </div>
      {typeof count === "number" && count > 0 && (
        <span className="shrink-0 text-xs tabular-nums text-[var(--si-muted)]">
          {count} {count === 1 ? "ligne" : "lignes"}
        </span>
      )}
    </header>
  );
}

/**
 * Liste vide.
 *
 * Elle dit « aucune » et non « rien à afficher » : dans un rapport réglementaire,
 * l'absence de chèques en circulation est une information, pas un écran vide.
 */
function EmptyLine({ children }: { children: React.ReactNode }) {
  return <p className="px-4 py-6 text-sm text-[var(--si-muted)]">{children}</p>;
}

/* ── Écran ────────────────────────────────────────────────────── */

export function MonthlyReportScreen({
  province,
  canEdit,
  blocks,
  accounts,
  reports,
  detail,
  defaultPeriode,
  defaultAccountId,
  depositCandidates,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showGenerate, setShowGenerate] = useState(!detail);

  const blockOf = (id: string) => blocks.find((b) => b.id === id);
  const certified = Boolean(detail?.certifiedAt);

  function run(action: (fd: FormData) => Promise<ActionResult>, fd: FormData) {
    setError(null);
    startTransition(async () => {
      const r = await action(fd);
      if (!r.ok) setError(r.error);
      else {
        setShowGenerate(false);
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
        <p className="mt-2 max-w-2xl text-sm text-[var(--si-muted)]">
          Le rapport mensuel se produit pour un compte donné. L&apos;art. 36 impose des livres
          distincts pour chaque compte général en fidéicommis : SAFE ne peut donc pas
          produire un rapport tant qu&apos;aucun compte n&apos;est déclaré.
        </p>
      </Panel>
    );
  }

  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
      {/* ── Rail des périodes ──────────────────────────────────── */}
      <aside className="min-w-0 space-y-3">
        {canEdit && (
          <button
            type="button"
            onClick={() => setShowGenerate((v) => !v)}
            className="w-full rounded-lg border border-[var(--si-line)] bg-[var(--si-surface)] px-3 py-2 text-sm text-[var(--si-ink)] transition-colors hover:bg-si-forest/[0.04]"
          >
            Produire un rapport
          </button>
        )}

        <Panel>
          <div className="border-b border-[var(--si-line)] px-3 py-2">
            <h2 className="text-xs font-medium uppercase tracking-wide text-[var(--si-muted)]">
              Périodes
            </h2>
          </div>
          {reports.length === 0 ? (
            <EmptyLine>Aucun rapport produit.</EmptyLine>
          ) : (
            <ul>
              {reports.map((r) => {
                const actif = detail?.id === r.id;
                return (
                  <li key={r.id} className="border-b border-[var(--si-line)] last:border-b-0">
                    <button
                      type="button"
                      onClick={() => router.push(`/inspection/rapport-mensuel?rapport=${r.id}`)}
                      className={`flex w-full flex-col gap-1 px-3 py-2.5 text-left transition-colors ${
                        actif ? "bg-si-forest/[0.05]" : "hover:bg-si-forest/[0.03]"
                      }`}
                    >
                      <span className="text-sm text-[var(--si-ink)]">{monthLabel(r.periode)}</span>
                      <span className="flex items-center gap-1.5">
                        {r.certifiedAt ? (
                          <Pill tone="done">Certifié</Pill>
                        ) : r.deadline.overdue ? (
                          <Pill tone="action">En retard</Pill>
                        ) : (
                          <Pill tone="info">À certifier</Pill>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </aside>

      <div className="min-w-0 space-y-6">
        {error && (
          <div
            role="alert"
            className="rounded-lg border border-si-danger/30 bg-si-danger/[0.06] px-4 py-3 text-sm text-si-danger-ink"
          >
            {error}
          </div>
        )}

        {/* ── Production d'un rapport ──────────────────────────── */}
        {showGenerate && canEdit && (
          <Panel>
            <BlockHeader
              title="Produire le rapport d'un mois"
              reference={province === "QC" ? "B-1 r.5, art. 41" : "By-Law 9, s. 18(8)"}
            />
            <form
              className="space-y-4 p-4"
              action={(fd) => run(generateReportAction, fd)}
            >
              <div className="grid gap-4 sm:grid-cols-3">
                <label className="block">
                  <span className="text-xs text-[var(--si-muted)]">Mois</span>
                  <input
                    type="month"
                    name="periode"
                    defaultValue={defaultPeriode}
                    className="mt-1 w-full rounded-lg border border-[var(--si-line)] bg-white px-3 py-2 text-sm text-[var(--si-ink)] focus:border-[var(--si-forest)] focus:outline-none"
                  />
                </label>

                <label className="block">
                  <span className="text-xs text-[var(--si-muted)]">Compte en fidéicommis</span>
                  <select
                    name="trustBankAccountId"
                    defaultValue={defaultAccountId ?? ""}
                    className="mt-1 w-full rounded-lg border border-[var(--si-line)] bg-white px-3 py-2 text-sm text-[var(--si-ink)] focus:border-[var(--si-forest)] focus:outline-none"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.label}
                        {a.last4 ? ` ••${a.last4}` : ""}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-xs text-[var(--si-muted)]">Solde au relevé</span>
                  <input
                    name="bankStatementBalance"
                    inputMode="decimal"
                    placeholder="0,00"
                    className="mt-1 w-full rounded-lg border border-[var(--si-line)] bg-white px-3 py-2 text-right text-sm tabular-nums text-[var(--si-ink)] focus:border-[var(--si-forest)] focus:outline-none"
                  />
                </label>
              </div>

              <p className="max-w-2xl text-xs leading-relaxed text-[var(--si-muted)]">
                Le solde du relevé est la seule donnée que SAFE ne possède pas. La déduire du
                journal rendrait la comparaison circulaire, et l&apos;écart serait nul par
                construction.
              </p>

              {depositCandidates.length > 0 && (
                <fieldset className="rounded-lg border border-[var(--si-line)] p-3">
                  <legend className="px-1 text-xs text-[var(--si-muted)]">
                    Recettes que le relevé ne montre pas encore
                    {province === "QC" ? " (art. 41(3))" : " (s. 18(8))"}
                  </legend>
                  <ul className="mt-1 space-y-1">
                    {depositCandidates.map((d) => (
                      <li key={d.id}>
                        <label className="flex items-center gap-2 py-1 text-sm text-[var(--si-ink)]">
                          <input
                            type="checkbox"
                            name="depositInTransit"
                            value={d.id}
                            className="h-4 w-4 rounded border-[var(--si-line)] accent-[var(--si-forest)]"
                          />
                          <span className="tabular-nums text-[var(--si-muted)]">
                            {day(d.receivedDate)}
                          </span>
                          <span className="min-w-0 flex-1 truncate">
                            {d.clientName ?? "—"}
                            {d.dossierRef ? ` · ${d.dossierRef}` : ""}
                          </span>
                          <span className="tabular-nums">{money(d.amount)} $</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </fieldset>
              )}

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-lg bg-[var(--si-forest)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-si-forest-soft disabled:opacity-50"
                >
                  {pending ? "Production en cours" : "Produire le rapport"}
                </button>
                {detail && (
                  <button
                    type="button"
                    onClick={() => setShowGenerate(false)}
                    className="text-sm text-[var(--si-muted)] hover:text-[var(--si-ink)]"
                  >
                    Annuler
                  </button>
                )}
              </div>
            </form>
          </Panel>
        )}

        {!detail ? (
          !showGenerate && (
            <Panel className="p-6">
              <h2 className="text-base font-medium text-[var(--si-ink)]">Aucun rapport produit</h2>
              <p className="mt-2 max-w-2xl text-sm text-[var(--si-muted)]">
                C&apos;est le premier document qu&apos;un inspecteur demande.
              </p>
            </Panel>
          )
        ) : (
          <>
            {/* ── L'intention de l'écran ────────────────────────── */}
            <Panel className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-base font-medium text-[var(--si-ink)]">
                    {monthLabel(detail.periode)}
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
                  ) : detail.deadline.overdue ? (
                    <Pill tone="action">
                      En retard depuis le {day(detail.deadline.dueAt)}
                    </Pill>
                  ) : (
                    <Pill tone="info">À certifier</Pill>
                  )}
                  </div>
                  {/* Aligné à gauche, même dans la colonne de droite : du texte courant
                      en drapeau à droite se lit mal (A2). La colonne reste à droite,
                      le texte non. */}
                  <p className="mt-1.5 text-xs leading-relaxed text-[var(--si-muted)]">
                    {detail.deadline.noteFr}
                  </p>
                </div>
              </div>

              {certified && detail.declarationText && (
                <blockquote className="mt-4 border-l-2 border-[var(--si-forest)]/30 pl-3 text-sm leading-relaxed text-[var(--si-ink)]">
                  {detail.declarationText}
                </blockquote>
              )}
            </Panel>

            {/* ── Art. 41(5) : l'état comparatif ────────────────── */}
            <Panel>
              <BlockHeader
                title={blockOf("BANK_COMPARISON")?.titleFr ?? "État comparatif"}
                reference={blockOf("BANK_COMPARISON")?.reference ?? ""}
              />
              <div className="p-4">
                <dl className="space-y-0">
                  <Compare label="Solde au relevé de l'institution" value={detail.bankStatementBalance} />
                  <Compare
                    label="Moins les chèques en circulation"
                    value={-detail.outstandingChequesTotal}
                  />
                  <Compare
                    label="Plus les recettes en circulation"
                    value={detail.depositsInTransitTotal}
                  />
                  <Compare label="Solde rapproché" value={detail.reconciledBalance} strong />
                  <Compare label="Solde au journal" value={detail.journalBalance} />
                  <Compare
                    label="Écart avec la banque"
                    value={detail.ecartBanque}
                    flag={Math.abs(detail.ecartBanque) > EPSILON}
                  />
                  <Compare label="Somme des cartes-clients" value={detail.ledgerSumBalance} />
                  <Compare
                    label="Écart avec les cartes-clients"
                    value={detail.ecartCartesClients}
                    flag={Math.abs(detail.ecartCartesClients) > EPSILON}
                  />
                </dl>

                <p className="mt-4 max-w-2xl text-xs leading-relaxed text-[var(--si-muted)]">
                  Un écart n&apos;est pas interdit. Le texte exige un état comparatif et le motif de
                  toute différence : un écart motivé est conforme, un écart silencieux ne l&apos;est
                  pas.
                </p>

                {detail.discrepancies.length > 0 && (
                  <ul className="mt-3 space-y-2">
                    {detail.discrepancies.map((d, i) => (
                      <li
                        key={i}
                        className="rounded-lg border border-[var(--si-line)] px-3 py-2 text-sm"
                      >
                        <span className="text-[var(--si-muted)]">
                          {d.kind === "BANK" ? "Banque" : "Cartes-clients"} ·{" "}
                          <span className="tabular-nums">{money(d.amount)} $</span>
                        </span>
                        <p className="mt-0.5 text-[var(--si-ink)]">{d.explanation}</p>
                      </li>
                    ))}
                  </ul>
                )}

                {canEdit && !certified && (
                  <DiscrepancyForms
                    reportId={detail.id}
                    ecartBanque={detail.ecartBanque}
                    ecartCartes={detail.ecartCartesClients}
                    existing={detail.discrepancies}
                    pending={pending}
                    onSubmit={(fd) => run(recordDiscrepancyAction, fd)}
                  />
                )}
              </div>
            </Panel>

            {/* ── Art. 41(4) : totaux du mois ───────────────────── */}
            <Panel>
              <BlockHeader
                title={blockOf("PERIOD_TOTALS")?.titleFr ?? "Totaux du mois"}
                reference={blockOf("PERIOD_TOTALS")?.reference ?? ""}
              />
              <div className="grid gap-8 p-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-[var(--si-muted)]">Recettes</p>
                  <p className="mt-1 text-xl tabular-nums text-[var(--si-ink)]">
                    {money(detail.totalReceipts)} $
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--si-muted)]">Déboursés</p>
                  <p className="mt-1 text-xl tabular-nums text-[var(--si-ink)]">
                    {money(detail.totalDisbursements)} $
                  </p>
                </div>
              </div>
            </Panel>

            {/* ── Art. 41(1) : les cartes-clients ───────────────── */}
            <Panel>
              <BlockHeader
                title={blockOf("CLIENT_LEDGER_BALANCES")?.titleFr ?? "Soldes des cartes-clients"}
                reference={blockOf("CLIENT_LEDGER_BALANCES")?.reference ?? ""}
                count={detail.ledgerLines.length}
              />
              {detail.ledgerLines.length === 0 ? (
                <EmptyLine>
                  Aucune carte-client ne porte de solde. Un rapport sans aucune ligne ne peut pas
                  être certifié.
                </EmptyLine>
              ) : (
                <Table
                  head={["Client et dossier", "Dernière inscription", "Solde"]}
                  align={["left", "left", "right"]}
                  rows={detail.ledgerLines.map((l) => [
                    <span key="c" className="block truncate">
                      {l.clientName}
                      {l.dossierRef && (
                        <span className="text-[var(--si-muted)]"> · {l.dossierRef}</span>
                      )}
                    </span>,
                    day(l.lastEntryDate),
                    <span key="b" className={l.balance < -EPSILON ? "text-si-danger-ink" : undefined}>
                      {money(l.balance)} $
                    </span>,
                  ])}
                />
              )}
            </Panel>

            {/* ── Art. 41(2) : chèques en circulation ───────────── */}
            <Panel>
              <BlockHeader
                title={blockOf("OUTSTANDING_CHEQUES")?.titleFr ?? "Chèques en circulation"}
                reference={blockOf("OUTSTANDING_CHEQUES")?.reference ?? ""}
                count={detail.chequeLines.length}
              />
              {detail.chequeLines.length === 0 ? (
                <EmptyLine>Aucun chèque en circulation à la fin du mois.</EmptyLine>
              ) : (
                <Table
                  head={["Bénéficiaire, client et dossier", "N°", "Émis le", "Montant"]}
                  align={["left", "right", "left", "right"]}
                  rows={detail.chequeLines.map((c) => [
                    <span key="p" className="flex min-w-0 items-center gap-2">
                      <span className="min-w-0 truncate">
                        {c.payeeName}
                        {c.clientName && (
                          <span className="text-[var(--si-muted)]"> · {c.clientName}</span>
                        )}
                        {c.dossierRef && (
                          <span className="text-[var(--si-muted)]"> · {c.dossierRef}</span>
                        )}
                      </span>
                      {c.stale && (
                        <span className="shrink-0">
                          <Pill tone="info">plus de 6 mois</Pill>
                        </span>
                      )}
                    </span>,
                    String(c.chequeNumber),
                    day(c.issueDate),
                    `${money(c.amount)} $`,
                  ])}
                />
              )}
            </Panel>

            {/* ── Art. 41(3) : recettes en circulation ──────────── */}
            <Panel>
              <BlockHeader
                title={blockOf("DEPOSITS_IN_TRANSIT")?.titleFr ?? "Recettes en circulation"}
                reference={blockOf("DEPOSITS_IN_TRANSIT")?.reference ?? ""}
                count={detail.depositLines.length}
              />
              {detail.depositLines.length === 0 ? (
                <EmptyLine>Aucune recette en circulation à la fin du mois.</EmptyLine>
              ) : (
                <Table
                  head={["Client et dossier", "Reçue le", "Montant"]}
                  align={["left", "left", "right"]}
                  rows={detail.depositLines.map((d) => [
                    <span key="c" className="block truncate">
                      {d.clientName ?? d.payerName ?? "—"}
                      {d.dossierRef && (
                        <span className="text-[var(--si-muted)]"> · {d.dossierRef}</span>
                      )}
                    </span>,
                    day(d.receivedDate),
                    `${money(d.amount)} $`,
                  ])}
                />
              )}
            </Panel>

            {/* ── Art. 41(7) : le relevé ────────────────────────── */}
            <Panel>
              <BlockHeader
                title={blockOf("BANK_STATEMENT")?.titleFr ?? "Relevé de l'institution"}
                reference={blockOf("BANK_STATEMENT")?.reference ?? ""}
              />
              <div className="p-4">
                {detail.bankStatement ? (
                  <p className="text-sm text-[var(--si-ink)]">{detail.bankStatement.nom}</p>
                ) : (
                  <p className="max-w-2xl text-sm text-[var(--si-muted)]">
                    Aucun relevé rattaché. Un rapport sans relevé ne compare rien, et la
                    certification est bloquée tant qu&apos;il manque.
                  </p>
                )}

                {canEdit && !certified && detail.documents.length > 0 && (
                  <form
                    className="mt-3 flex flex-wrap items-center gap-2"
                    action={(fd) => run(attachBankStatementAction, fd)}
                  >
                    <input type="hidden" name="reportId" value={detail.id} />
                    <select
                      name="documentId"
                      defaultValue=""
                      className="min-w-0 flex-1 rounded-lg border border-[var(--si-line)] bg-white px-3 py-2 text-sm text-[var(--si-ink)] focus:border-[var(--si-forest)] focus:outline-none"
                    >
                      <option value="">Choisir le relevé du mois</option>
                      {detail.documents.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.nom}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      disabled={pending}
                      className="rounded-lg border border-[var(--si-line)] px-3 py-2 text-sm text-[var(--si-ink)] transition-colors hover:bg-si-forest/[0.04] disabled:opacity-50"
                    >
                      Rattacher
                    </button>
                  </form>
                )}
              </div>
            </Panel>

            {/* ── La signature ──────────────────────────────────── */}
            {canEdit && !certified && (
              <Panel className="p-4">
                <h3 className="text-sm font-medium text-[var(--si-ink)]">Certifier ce rapport</h3>
                <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[var(--si-muted)]">
                  L&apos;attestation est produite à partir des contrôles réellement exécutés, et le
                  rapport est figé : un recalcul ultérieur ne réécrira pas un rapport signé.
                  Si un élément manque, SAFE refuse et vous dira lequel.
                </p>
                <form className="mt-3" action={(fd) => run(certifyReportAction, fd)}>
                  <input type="hidden" name="reportId" value={detail.id} />
                  <button
                    type="submit"
                    disabled={pending}
                    className="rounded-lg bg-[var(--si-forest)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-si-forest-soft disabled:opacity-50"
                  >
                    {pending ? "Certification en cours" : "Certifier le rapport"}
                  </button>
                </form>
              </Panel>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ── Sous-composants ──────────────────────────────────────────── */

/** Ligne de l'état comparatif. Le libellé porte, le nombre s'aligne à droite (L2). */
function Compare({
  label,
  value,
  strong,
  flag,
}: {
  label: string;
  value: number;
  strong?: boolean;
  flag?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-[var(--si-line)] py-2 last:border-b-0">
      <dt className={`text-sm ${strong ? "font-medium text-[var(--si-ink)]" : "text-[var(--si-muted)]"}`}>
        {label}
      </dt>
      <dd
        className={`shrink-0 text-sm tabular-nums ${
          flag ? "text-si-danger-ink" : strong ? "font-medium text-[var(--si-ink)]" : "text-[var(--si-ink)]"
        }`}
      >
        {money(value)} $
      </dd>
    </div>
  );
}

/**
 * Tableau réglementaire.
 *
 * Filets horizontaux seulement (C2, A14), même taille d'entête et de données avec la
 * graisse pour seule hiérarchie (T2), nombres à droite (L2), première colonne porteuse
 * et métadonnées comprimées (L3).
 */
function Table({
  head,
  align,
  rows,
}: {
  head: string[];
  align: ("left" | "right")[];
  rows: React.ReactNode[][];
}) {
  return (
    <div className="min-w-0 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--si-line)]">
            {head.map((h, i) => (
              <th
                key={h}
                scope="col"
                className={`px-4 py-2.5 font-medium text-[var(--si-muted)] ${
                  align[i] === "right" ? "text-right" : "text-left"
                } ${i === 0 ? "w-1/2" : "whitespace-nowrap"}`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={i}
              className="border-b border-[var(--si-line)] transition-colors last:border-b-0 hover:bg-si-forest/[0.02]"
            >
              {r.map((cell, j) => (
                <td
                  key={j}
                  className={`px-4 py-3 text-[var(--si-ink)] ${
                    align[j] === "right" ? "text-right tabular-nums" : "text-left"
                  } ${j === 0 ? "max-w-0" : "whitespace-nowrap tabular-nums"}`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Saisie du motif d'un écart.
 *
 * N'apparaît QUE si un écart existe et n'est pas déjà motivé. Afficher en permanence
 * un champ « expliquez l'écart » sur un rapport sans écart apprendrait à l'ignorer.
 */
function DiscrepancyForms({
  reportId,
  ecartBanque,
  ecartCartes,
  existing,
  pending,
  onSubmit,
}: {
  reportId: string;
  ecartBanque: number;
  ecartCartes: number;
  existing: { kind: string }[];
  pending: boolean;
  onSubmit: (fd: FormData) => void;
}) {
  const need: { kind: "BANK" | "LEDGER"; amount: number; label: string }[] = [];
  if (Math.abs(ecartBanque) > EPSILON && !existing.some((d) => d.kind === "BANK")) {
    need.push({ kind: "BANK", amount: ecartBanque, label: "Motif de l'écart avec la banque" });
  }
  if (Math.abs(ecartCartes) > EPSILON && !existing.some((d) => d.kind === "LEDGER")) {
    need.push({
      kind: "LEDGER",
      amount: ecartCartes,
      label: "Motif de l'écart avec les cartes-clients",
    });
  }
  if (need.length === 0) return null;

  return (
    <div className="mt-4 space-y-3">
      {need.map((n) => (
        <form key={n.kind} action={onSubmit} className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="reportId" value={reportId} />
          <input type="hidden" name="kind" value={n.kind} />
          <input type="hidden" name="amount" value={n.amount} />
          <label className="min-w-0 flex-1">
            <span className="text-xs text-[var(--si-muted)]">{n.label}</span>
            <input
              name="explanation"
              placeholder="Ce qui explique la différence"
              className="mt-1 w-full rounded-lg border border-[var(--si-line)] bg-white px-3 py-2 text-sm text-[var(--si-ink)] focus:border-[var(--si-forest)] focus:outline-none"
            />
          </label>
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg border border-[var(--si-line)] px-3 py-2 text-sm text-[var(--si-ink)] transition-colors hover:bg-si-forest/[0.04] disabled:opacity-50"
          >
            Consigner
          </button>
        </form>
      ))}
    </div>
  );
}
