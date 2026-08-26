"use client";
import { useMoney } from "./primitives";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  closeAccountAction,
  confirmAgreementAction,
  openAccountAction,
  recordDutyAction,
  type ActionResult,
} from "@/app/(app)/inspection/comptes/actions";
import {
  BlockHeader,
  Disclosure,
  EmptyLine,
  ErrorBanner,
  Field,
  Panel,
  Pill,
  PrimaryButton,
  SecondaryButton,
  day,
  inputClass,
  inputNumberClass,
} from "./primitives";

/**
 * Déclaration des comptes en fidéicommis — la marche zéro.
 *
 * ── Pourquoi cet écran est le premier du couloir ─────────────────────────────
 *
 * Les onze autres écrans d'inspection commencent tous par « Aucun compte en
 * fidéicommis n'est enregistré ». Le service d'ouverture existait depuis CH-01 et
 * n'était appelé que depuis un script de démonstration : aucun cabinet ne pouvait
 * franchir cette première marche.
 *
 * ── Ce que l'écran refuse de faire ───────────────────────────────────────────
 *
 * TOUT BLOQUER. Le module distingue les manquements qui empêchent l'ouverture
 * (libellé sans mention « en fidéicommis », compte particulier sans client) de ceux
 * qui se règlent en quelques jours auprès de la banque (entente B-1 r.10, adresse de
 * succursale). Les seconds s'affichent en avertissement. Bloquer dessus empêcherait
 * de saisir un compte qui existe déjà, et un cabinet qui ne peut rien saisir ne
 * saisit rien du tout.
 *
 * CORRIGER UN CHAMP À LA FOIS. Le refus porte la liste complète des manquements. Le
 * module les renvoie tous ensemble exactement pour ça.
 *
 * TRANSMETTRE. Le formulaire de l'art. 51 est prescrit par le Barreau, SAFE ne l'a
 * pas obtenu, et l'envoi est l'acte de l'avocate. L'écran consigne la date.
 */

interface Violation {
  field: string;
  code: string;
  messageFr: string;
  reference: string;
  blocking: boolean;
}

interface Duty {
  code: string;
  labelFr: string;
  reference: string;
  done: boolean;
}

export interface AccountRow {
  id: string;
  type: string;
  accountLabel: string;
  institutionName: string;
  institutionBranch: string | null;
  branchProvince: string | null;
  accountNumberLast4: string;
  currency: string;
  barreauAgreementConfirmed: boolean;
  regulatorNotifiedAt: string | null;
  clientCopySentAt: string | null;
  openedAt: string;
  closedAt: string | null;
  closureReason: string | null;
  clientName: string | null;
  balance: number;
  duties: Duty[];
}

interface Props {
  canEdit: boolean;
  province: string;
  accounts: AccountRow[];
  clients: { id: string; name: string }[];
  interestNoteFr: string;
}

export function TrustAccountsScreen({
  canEdit,
  province,
  accounts,
  clients,
  interestNoteFr,
}: Props) {
  const router = useRouter();
  const money = useMoney();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [warnings, setWarnings] = useState<Violation[]>([]);
  const [showForm, setShowForm] = useState(accounts.length === 0);
  const [type, setType] = useState<"GENERAL" | "PARTICULIER">("GENERAL");
  const [closing, setClosing] = useState<string | null>(null);

  const qc = province === "QC";

  function run(action: (fd: FormData) => Promise<ActionResult>, fd: FormData) {
    setError(null);
    setViolations([]);
    setWarnings([]);
    startTransition(async () => {
      const r = await action(fd);
      if (!r.ok) {
        setError(r.error);
        setViolations((r.violations ?? []) as Violation[]);
      } else {
        setWarnings((r.warnings ?? []) as Violation[]);
        setShowForm(false);
        setClosing(null);
        router.refresh();
      }
    });
  }

  const ouverts = accounts.filter((a) => !a.closedAt);
  const fermes = accounts.filter((a) => a.closedAt);

  return (
    <div className="min-w-0 space-y-6">
      <ErrorBanner>{error}</ErrorBanner>

      {/* ── Le détail du refus ──────────────────────────────────── */}
      {violations.length > 0 && (
        <Panel tone="alert" className="p-4">
          <h3 className="text-sm font-medium text-si-danger-ink">
            {violations.length === 1
              ? "Un point empêche la déclaration"
              : `${violations.length} points empêchent la déclaration`}
          </h3>
          <ul className="mt-2">
            {violations.map((v) => (
              <li key={v.code} className="border-t border-si-danger/15 py-2 text-sm first:border-t-0">
                <span className="text-[var(--si-ink)]">{v.messageFr}</span>
                <span className="text-[var(--si-muted)]"> · {v.reference}</span>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {/* ── Ce qui reste à confirmer après coup ─────────────────── */}
      {warnings.length > 0 && (
        <Panel className="p-4">
          <h3 className="text-sm font-medium text-[var(--si-ink)]">
            Compte déclaré. Il reste {warnings.length === 1 ? "un point" : `${warnings.length} points`} à
            confirmer
          </h3>
          <ul className="mt-2">
            {warnings.map((w) => (
              <li key={w.code} className="border-t border-[var(--si-line)] py-2 text-sm first:border-t-0">
                <span className="text-[var(--si-ink)]">{w.messageFr}</span>
                <span className="text-[var(--si-muted)]"> · {w.reference}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 max-w-2xl text-xs leading-relaxed text-[var(--si-muted)]">
            Ces points n&apos;empêchent pas la déclaration : ce sont des démarches de quelques
            jours auprès de votre institution. Ils se lèvent depuis la fiche du compte.
          </p>
        </Panel>
      )}

      {/* ── Déclaration ─────────────────────────────────────────── */}
      {canEdit && (
        <Panel>
          <BlockHeader
            title="Déclarer un compte en fidéicommis"
            reference={qc ? "B-1 r.5, art. 50, 62" : "By-Law 9, s. 7"}
            action={
              accounts.length > 0 && !showForm ? (
                <SecondaryButton type="button" onClick={() => setShowForm(true)}>
                  Déclarer un compte
                </SecondaryButton>
              ) : undefined
            }
          />

          {showForm && (
            <form className="space-y-4 p-4" action={(fd) => run(openAccountAction, fd)}>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field
                  label="Nature du compte"
                  hint={
                    qc
                      ? "Le compte particulier s'ouvre quand le client exige que les intérêts lui reviennent."
                      : "Le « compte particulier » est propre au Québec."
                  }
                >
                  <select
                    name="type"
                    value={type}
                    onChange={(e) => setType(e.target.value as "GENERAL" | "PARTICULIER")}
                    className={inputClass}
                  >
                    <option value="GENERAL">Compte général</option>
                    {qc && <option value="PARTICULIER">Compte particulier</option>}
                  </select>
                </Field>

                <Field
                  label="Libellé du compte, tel qu'à la banque"
                  className="sm:col-span-2"
                  hint="Doit porter la mention « en fidéicommis » ou « in trust »."
                >
                  <input
                    name="accountLabel"
                    required
                    placeholder="Cabinet Untel, avocats — en fidéicommis"
                    className={inputClass}
                  />
                </Field>

                {type === "PARTICULIER" && (
                  <Field
                    label="Client"
                    hint="Le compte particulier est ouvert pour un client déterminé."
                  >
                    <select name="clientId" className={inputClass}>
                      <option value="">Choisir</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                )}

                <Field label="Institution financière">
                  <input name="institutionName" required className={inputClass} />
                </Field>
                <Field label="Succursale">
                  <input name="institutionBranch" className={inputClass} />
                </Field>
                <Field label="Province de la succursale" hint={qc ? "Doit être QC." : undefined}>
                  <input
                    name="branchProvince"
                    defaultValue={qc ? "QC" : "ON"}
                    className={inputClass}
                  />
                </Field>
                <Field label="Adresse de la succursale" className="sm:col-span-2">
                  <input name="branchAddress" className={inputClass} />
                </Field>
                <Field label="Numéro de compte" hint="Exigé par les rapports mensuel et annuel.">
                  <input name="accountNumber" required className={inputClass} />
                </Field>
                <Field label="Ouvert le">
                  <input type="date" name="openedAt" className={inputClass} />
                </Field>
                <Field label="Dépôt initial" hint="Facultatif.">
                  <input
                    name="initialDeposit"
                    inputMode="decimal"
                    placeholder="0,00"
                    className={inputNumberClass}
                  />
                </Field>
              </div>

              {qc && type === "GENERAL" && (
                <label className="flex max-w-2xl items-start gap-2 text-sm text-[var(--si-ink)]">
                  <input
                    type="checkbox"
                    name="barreauAgreementConfirmed"
                    className="mt-0.5 accent-[var(--si-ink-strong)]"
                  />
                  <span>
                    L&apos;institution a conclu une entente avec le Barreau au sens de B-1, r. 10.
                    <span className="mt-0.5 block text-xs text-[var(--si-muted)]">
                      Si vous ne le savez pas encore, laissez décoché : le compte se déclare quand
                      même, et la case se coche plus tard.
                    </span>
                  </span>
                </label>
              )}

              <div className="flex flex-wrap gap-2">
                <PrimaryButton type="submit" disabled={pending}>
                  {pending ? "Déclaration en cours" : "Déclarer le compte"}
                </PrimaryButton>
                {accounts.length > 0 && (
                  <SecondaryButton type="button" onClick={() => setShowForm(false)}>
                    Annuler
                  </SecondaryButton>
                )}
              </div>

              <p className="max-w-3xl text-xs leading-relaxed text-[var(--si-muted)]">
                {interestNoteFr}
              </p>
            </form>
          )}
        </Panel>
      )}

      {/* ── Les comptes ouverts ─────────────────────────────────── */}
      <Panel>
        <BlockHeader
          title="Comptes ouverts"
          reference={qc ? "B-1 r.5, art. 50, 51, 62 à 68" : "By-Law 9, s. 7, 8"}
          count={ouverts.length}
          countLabel="compte"
        />
        {ouverts.length === 0 ? (
          <EmptyLine>
            Aucun compte déclaré. Tant qu&apos;il n&apos;y en a pas, aucun registre, aucun rapport
            et aucun mouvement de fidéicommis n&apos;est possible.
          </EmptyLine>
        ) : (
          <ul>
            {ouverts.map((a) => {
              const restantes = a.duties.filter((d) => !d.done);
              return (
                <li key={a.id} className="border-b border-[var(--si-line)] p-4 last:border-b-0">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <div className="min-w-0">
                      <span className="text-sm text-[var(--si-ink)]">{a.accountLabel}</span>
                      <p className="mt-0.5 text-xs text-[var(--si-muted)]">
                        {a.institutionName}
                        {a.institutionBranch ? `, ${a.institutionBranch}` : ""} · ••
                        {a.accountNumberLast4} · ouvert le {day(a.openedAt)}
                        {a.clientName ? ` · ${a.clientName}` : ""}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm tabular-nums text-[var(--si-ink)]">
                      {money(a.balance)}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Pill tone="info">
                      {a.type === "PARTICULIER" ? "Compte particulier" : "Compte général"}
                    </Pill>
                    {qc && a.type === "GENERAL" && (
                      <Pill tone={a.barreauAgreementConfirmed ? "done" : "action"}>
                        {a.barreauAgreementConfirmed
                          ? "entente B-1 r.10 confirmée"
                          : "entente B-1 r.10 à confirmer"}
                      </Pill>
                    )}
                    {restantes.map((d) => (
                      <Pill key={d.code} tone="action">
                        {d.code === "CLIENT_COPY_SENT"
                          ? "copie au client à remettre"
                          : "formulaire à transmettre"}
                      </Pill>
                    ))}
                    {a.duties.length > 0 && restantes.length === 0 && (
                      <Pill tone="done">démarches faites</Pill>
                    )}
                  </div>

                  {canEdit && (
                    <div className="mt-3 space-y-3 border-t border-[var(--si-line)] pt-3">
                      {qc && a.type === "GENERAL" && !a.barreauAgreementConfirmed && (
                        <form action={(fd) => run(confirmAgreementAction, fd)}>
                          <input type="hidden" name="accountId" value={a.id} />
                          <SecondaryButton type="submit" disabled={pending}>
                            L&apos;institution a bien conclu l&apos;entente B-1 r.10
                          </SecondaryButton>
                        </form>
                      )}

                      {restantes.map((d) => (
                        <form
                          key={d.code}
                          className="flex flex-wrap items-end gap-2"
                          action={(fd) => run(recordDutyAction, fd)}
                        >
                          <input type="hidden" name="accountId" value={a.id} />
                          <input type="hidden" name="duty" value={d.code} />
                          <Field label={d.labelFr}>
                            <input type="date" name="at" required className={inputClass} />
                          </Field>
                          <SecondaryButton type="submit" disabled={pending}>
                            Consigner
                          </SecondaryButton>
                          <span className="pb-2 text-xs text-[var(--si-muted)]">{d.reference}</span>
                        </form>
                      ))}

                      {closing === a.id ? (
                        <form
                          className="flex flex-wrap items-end gap-2"
                          action={(fd) => run(closeAccountAction, fd)}
                        >
                          <input type="hidden" name="accountId" value={a.id} />
                          <Field label="Motif de la fermeture" className="min-w-[16rem]">
                            <input name="reason" required className={inputClass} />
                          </Field>
                          <Field label="Fermé le">
                            <input type="date" name="closedAt" className={inputClass} />
                          </Field>
                          <SecondaryButton type="submit" disabled={pending}>
                            Fermer le compte
                          </SecondaryButton>
                          <SecondaryButton type="button" onClick={() => setClosing(null)}>
                            Annuler
                          </SecondaryButton>
                        </form>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setClosing(a.id)}
                          className="text-xs text-[var(--si-muted)] underline transition-colors hover:text-[var(--si-ink)]"
                        >
                          Fermer ce compte
                        </button>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        <p className="border-t border-[var(--si-line)] px-4 py-3 text-xs leading-relaxed text-[var(--si-muted)]">
          Un compte ne se ferme pas tant qu&apos;il détient des fonds : la fermeture masquerait de
          l&apos;argent client.{" "}
          {qc
            ? "Le solde d'un compte particulier se vire au compte général sans délai lorsqu'il n'est plus requis (art. 67)."
            : ""}
        </p>
      </Panel>

      {/* ── Les comptes fermés ──────────────────────────────────── */}
      {fermes.length > 0 && (
        <Disclosure
          label="Comptes fermés"
          meta={`${fermes.length} compte${fermes.length === 1 ? "" : "s"}`}
        >
          <ul className="px-4 py-2">
            {fermes.map((a) => (
              <li key={a.id} className="border-b border-[var(--si-line)] py-2.5 text-sm last:border-b-0">
                <span className="text-[var(--si-ink)]">{a.accountLabel}</span>
                <span className="text-[var(--si-muted)]">
                  {" "}
                  · ••{a.accountNumberLast4} · fermé le {day(a.closedAt)}
                </span>
                {a.closureReason && (
                  <p className="mt-0.5 text-xs text-[var(--si-muted)]">{a.closureReason}</p>
                )}
              </li>
            ))}
          </ul>
          <p className="border-t border-[var(--si-line)] px-4 py-3 text-xs leading-relaxed text-[var(--si-muted)]">
            Un compte fermé n&apos;est jamais supprimé
            {qc
              ? " : l'article 42(7) exige la liste des comptes fermés durant la période au rapport annuel."
              : "."}
          </p>
        </Disclosure>
      )}
    </div>
  );
}
