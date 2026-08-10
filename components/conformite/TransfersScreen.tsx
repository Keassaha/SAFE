"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  countersignAction,
  createRequisitionAction,
  recordConfirmationAction,
  recordExecutionAction,
  type ActionResult,
} from "@/app/(app)/inspection/virements/actions";
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
  money,
} from "./primitives";

/**
 * Virements électroniques depuis un compte en fiducie — By-Law 9, s. 12.
 *
 * ── Le point le plus important de cet écran ──────────────────────────────────
 *
 * IL N'EXISTE QU'EN ONTARIO. La s. 12 impose un appareil complet : réquisition signée
 * avant toute saisie, double contrôle à deux mots de passe, confirmation de
 * l'institution portant six éléments, contresignature le jour bancaire suivant.
 * B-1 r.5 n'a aucun équivalent. Montrer ce formulaire à un cabinet québécois
 * inventerait une obligation, faute aussi grave que d'en omettre une.
 *
 * L'ORDRE EST VÉRIFIÉ, PAS SEULEMENT L'EXISTENCE. Une réquisition signée après la
 * saisie régularise ; elle ne vérifie rien. C'est pourquoi la réquisition se crée en
 * premier, et pourquoi les étapes suivantes n'apparaissent qu'ensuite.
 */

interface Step {
  key: string;
  labelFr: string;
  reference: string;
}

interface Requisition {
  id: string;
  formType: string;
  clientName: string;
  dossierRef: string | null;
  amount: number;
  recipientName: string;
  recipientInstitution: string;
  purpose: string;
  signedAt: string;
  dataEnteredAt: string | null;
  authorizedAt: string | null;
  sameSigner: boolean;
  confirmationSentAt: string | null;
  missingConfirmationFields: Step[];
  countersignDueAt: string | null;
  countersignedAt: string | null;
  overdue: boolean;
}

interface Props {
  canEdit: boolean;
  accounts: { id: string; label: string; last4: string | null }[];
  requisitions: Requisition[];
  users: { id: string; name: string }[];
  clients: { id: string; name: string }[];
  countersignSteps: Step[];
  confirmationFields: Step[];
  withdrawalMethods: { labelFr: string; reference: string }[];
  regimeNoteFr: string;
  regimeReference: string;
}

export function TransfersScreen({
  canEdit,
  accounts,
  requisitions,
  users,
  clients,
  countersignSteps,
  confirmationFields,
  withdrawalMethods,
  regimeNoteFr,
  regimeReference,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

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

  const enRetard = requisitions.filter((r) => r.overdue && !r.countersignedAt);
  const aContresigner = requisitions.filter(
    (r) => r.confirmationSentAt && !r.countersignedAt && !r.overdue,
  );

  return (
    <div className="min-w-0 space-y-6">
      <ErrorBanner>{error}</ErrorBanner>

      {/* ── Ce qui est en retard ────────────────────────────────── */}
      {enRetard.length > 0 && (
        <Panel tone="alert" className="p-4">
          <h2 className="text-base font-medium text-si-danger-ink">
            {enRetard.length === 1
              ? "Une contresignature est en retard"
              : `${enRetard.length} contresignatures sont en retard`}
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[var(--si-ink)]">
            La s. 12(5) donne jusqu&apos;à la clôture du jour bancaire suivant l&apos;envoi de la
            confirmation. Passé ce délai, le geste reste à faire : il ne s&apos;éteint pas.
          </p>
          <ul className="mt-3">
            {enRetard.map((r) => (
              <li key={r.id} className="border-t border-si-danger/15 py-2 text-sm first:border-t-0">
                <span className="text-[var(--si-ink)]">{r.clientName}</span>
                <span className="text-[var(--si-muted)]">
                  {" "}
                  · {money(r.amount)} · échéance {day(r.countersignDueAt)}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {/* ── Le régime ───────────────────────────────────────────── */}
      <Panel className="p-4">
        <h2 className="text-sm font-medium text-[var(--si-ink)]">
          Ce que la s. 12 impose, et pourquoi
        </h2>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-[var(--si-muted)]">
          {regimeNoteFr}
        </p>
        <p className="mt-2 text-xs text-[var(--si-muted)]">{regimeReference}</p>
        <ul className="mt-3 border-t border-[var(--si-line)] pt-2">
          {withdrawalMethods.map((m) => (
            <li key={m.labelFr} className="py-1 text-sm">
              <span className="text-[var(--si-ink)]">{m.labelFr}</span>
              <span className="text-[var(--si-muted)]"> · {m.reference}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 max-w-3xl text-xs leading-relaxed text-[var(--si-muted)]">
          Cette liste est limitative : un retrait d&apos;honoraires ne peut prendre aucune autre
          forme.
        </p>
      </Panel>

      {/* ── Les réquisitions ────────────────────────────────────── */}
      <Panel>
        <BlockHeader
          title="Réquisitions de virement"
          reference="By-Law 9, s. 12(2)4"
          count={requisitions.length}
          countLabel="réquisition"
          action={
            canEdit && !showForm && accounts.length > 0 ? (
              <SecondaryButton type="button" onClick={() => setShowForm(true)}>
                Nouvelle réquisition
              </SecondaryButton>
            ) : undefined
          }
        />

        {showForm && canEdit && (
          <form
            className="space-y-4 border-b border-[var(--si-line)] p-4"
            action={(fd) => run(createRequisitionAction, fd)}
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Compte en fiducie">
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
              <Field label="Formulaire" hint="9B et 9C : fonds de clôture immobilière (s. 13).">
                <select name="formType" defaultValue="9A" className={inputClass}>
                  <option value="9A">Form 9A — virement courant</option>
                  <option value="9B">Form 9B</option>
                  <option value="9C">Form 9C</option>
                </select>
              </Field>
              <Field label="Signée le" hint="Avant toute saisie dans le système de virement.">
                <input type="datetime-local" name="signedAt" required className={inputClass} />
              </Field>
              <Field label="Client">
                <input name="clientName" required className={inputClass} />
              </Field>
              <Field label="Dossier">
                <input name="dossierRef" className={inputClass} />
              </Field>
              <Field label="Montant">
                <input name="amount" inputMode="decimal" placeholder="0,00" className={inputNumberClass} />
              </Field>
              <Field label="Destinataire">
                <input name="recipientName" required className={inputClass} />
              </Field>
              <Field label="Institution destinataire">
                <input name="recipientInstitution" required className={inputClass} />
              </Field>
              <Field label="Succursale">
                <input name="recipientBranch" className={inputClass} />
              </Field>
              <Field label="Adresse de la succursale" className="sm:col-span-2">
                <input name="recipientBranchAddress" className={inputClass} />
              </Field>
              <Field label="Numéro du compte destinataire">
                <input name="recipientAccountNumber" required className={inputClass} />
              </Field>
              <Field label="Objet du virement" className="sm:col-span-2 lg:col-span-3">
                <input name="purpose" required className={inputClass} />
              </Field>
            </div>
            <div className="flex flex-wrap gap-2">
              <PrimaryButton type="submit" disabled={pending}>
                {pending ? "Enregistrement" : "Créer la réquisition"}
              </PrimaryButton>
              <SecondaryButton type="button" onClick={() => setShowForm(false)}>
                Annuler
              </SecondaryButton>
            </div>
          </form>
        )}

        {requisitions.length === 0 ? (
          <EmptyLine>
            Aucune réquisition de virement. Un virement électronique depuis un compte en fiducie
            en exige une, signée avant toute saisie.
          </EmptyLine>
        ) : (
          <ul>
            {requisitions.map((r) => (
              <li key={r.id} className="border-b border-[var(--si-line)] p-4 last:border-b-0">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <div className="min-w-0">
                    <span className="text-sm text-[var(--si-ink)]">{r.clientName}</span>
                    <span className="text-sm text-[var(--si-muted)]">
                      {" "}
                      · vers {r.recipientName}, {r.recipientInstitution}
                    </span>
                    <p className="mt-0.5 text-xs text-[var(--si-muted)]">
                      Form {r.formType} · signée le {day(r.signedAt)} · {r.purpose}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm tabular-nums text-[var(--si-ink)]">
                    {money(r.amount)}
                  </span>
                </div>

                {/* Les quatre états, dans l'ordre du texte. */}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Pill tone="done">signée</Pill>
                  {r.authorizedAt ? (
                    r.sameSigner ? (
                      <Pill tone="action">saisie et autorisation par la même personne</Pill>
                    ) : (
                      <Pill tone="done">double contrôle</Pill>
                    )
                  ) : (
                    <Pill tone="info">saisie à consigner</Pill>
                  )}
                  {r.confirmationSentAt ? (
                    r.missingConfirmationFields.length > 0 ? (
                      <Pill tone="action">
                        confirmation incomplète ({r.missingConfirmationFields.length})
                      </Pill>
                    ) : (
                      <Pill tone="done">confirmation complète</Pill>
                    )
                  ) : (
                    <Pill tone="info">confirmation attendue</Pill>
                  )}
                  {r.countersignedAt ? (
                    <Pill tone="done">contresignée le {day(r.countersignedAt)}</Pill>
                  ) : r.confirmationSentAt ? (
                    <Pill tone={r.overdue ? "action" : "info"}>
                      à contresigner avant le {day(r.countersignDueAt)}
                    </Pill>
                  ) : null}
                </div>

                {r.missingConfirmationFields.length > 0 && (
                  <p className="mt-2 max-w-2xl text-xs leading-relaxed text-[var(--si-muted)]">
                    Manque à la confirmation :{" "}
                    {r.missingConfirmationFields.map((f) => f.labelFr).join(" · ")}. C&apos;est
                    signalé, pas bloqué : la confirmation vient de la banque, vous ne la
                    fabriquez pas.
                  </p>
                )}

                {canEdit && !r.authorizedAt && (
                  <form
                    className="mt-3 grid gap-3 border-t border-[var(--si-line)] pt-3 sm:grid-cols-2 lg:grid-cols-4"
                    action={(fd) => run(recordExecutionAction, fd)}
                  >
                    <input type="hidden" name="requisitionId" value={r.id} />
                    <Field label="Saisie le">
                      <input type="datetime-local" name="dataEnteredAt" required className={inputClass} />
                    </Field>
                    <Field label="Autorisée par">
                      <select name="authorizedByUserId" className={inputClass}>
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Autorisée le">
                      <input type="datetime-local" name="authorizedAt" required className={inputClass} />
                    </Field>
                    <div className="flex items-end">
                      <PrimaryButton type="submit" disabled={pending}>
                        Consigner
                      </PrimaryButton>
                    </div>
                  </form>
                )}

                {canEdit && r.authorizedAt && !r.confirmationSentAt && (
                  <form
                    className="mt-3 grid gap-3 border-t border-[var(--si-line)] pt-3 sm:grid-cols-2 lg:grid-cols-3"
                    action={(fd) => run(recordConfirmationAction, fd)}
                  >
                    <input type="hidden" name="requisitionId" value={r.id} />
                    <Field label="Compte en fiducie d'où les fonds sont tirés">
                      <input name="sourceAccountNumber" className={inputClass} />
                    </Field>
                    <Field label="Institution destinataire">
                      <input
                        name="recipientInstitution"
                        defaultValue={r.recipientInstitution}
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Titulaire du compte destinataire">
                      <input name="recipientName" defaultValue={r.recipientName} className={inputClass} />
                    </Field>
                    <Field label="Numéro du compte destinataire">
                      <input name="recipientAccountNumber" className={inputClass} />
                    </Field>
                    <Field label="Reçue par l'institution le">
                      <input type="datetime-local" name="institutionReceivedAt" className={inputClass} />
                    </Field>
                    <Field
                      label="Confirmation envoyée le"
                      hint="C'est de cette date que court la contresignature."
                    >
                      <input
                        type="datetime-local"
                        name="confirmationSentAt"
                        required
                        className={inputClass}
                      />
                    </Field>
                    <div className="flex items-end">
                      <PrimaryButton type="submit" disabled={pending}>
                        Enregistrer la confirmation
                      </PrimaryButton>
                    </div>
                  </form>
                )}

                {canEdit && r.confirmationSentAt && !r.countersignedAt && (
                  <form
                    className="mt-3 border-t border-[var(--si-line)] pt-3"
                    action={(fd) => run(countersignAction, fd)}
                  >
                    <input type="hidden" name="requisitionId" value={r.id} />
                    <ul className="mb-3">
                      {countersignSteps.map((s) => (
                        <li key={s.key} className="py-0.5 text-xs text-[var(--si-muted)]">
                          {s.labelFr} · {s.reference}
                        </li>
                      ))}
                    </ul>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      <Field label="Client indiqué sur la copie imprimée">
                        <select name="annotatedClientId" className={inputClass}>
                          {clients.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <div className="flex items-end">
                        <PrimaryButton type="submit" disabled={pending}>
                          J&apos;ai fait les quatre gestes
                        </PrimaryButton>
                      </div>
                    </div>
                    <p className="mt-2 max-w-2xl text-xs leading-relaxed text-[var(--si-muted)]">
                      SAFE ne peut ni imprimer à votre place, ni comparer la copie à la
                      réquisition. Ce bouton consigne que vous l&apos;avez fait, avec sa date.
                    </p>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {aContresigner.length === 0 && enRetard.length === 0 && requisitions.length > 0 && (
        <Panel className="p-4">
          <p className="text-sm text-[var(--si-muted)]">
            Aucune contresignature n&apos;est en attente.
          </p>
        </Panel>
      )}

      <Disclosure label="Les six éléments que la confirmation doit porter" meta="s. 12(2)3">
        <ul className="px-4 py-3">
          {confirmationFields.map((f) => (
            <li
              key={f.key}
              className="border-b border-[var(--si-line)] py-2 text-sm last:border-b-0"
            >
              <span className="text-[var(--si-ink)]">{f.labelFr}</span>
              <span className="text-[var(--si-muted)]"> · {f.reference}</span>
            </li>
          ))}
        </ul>
      </Disclosure>
    </div>
  );
}
