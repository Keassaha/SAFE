"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  grantInspectionAccessAction,
  revokeInspectionAccessAction,
  setFiscalYearEndAction,
  type ActionResult,
} from "@/app/(app)/inspection/conservation/actions";
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
  Table,
  day,
  inputClass,
} from "./primitives";

/**
 * Conservation et accès de l'inspecteur.
 *
 * Art. 29 à 33 B-1 r.5 · s. 21 à 23 By-Law 9.
 *
 * ── Trois vérités que cet écran tient ────────────────────────────────────────
 *
 * SANS FIN D'EXERCICE, RIEN NE SE CALCULE. Les durées de l'art. 32 et de la s. 23
 * courent depuis la fin de l'exercice financier. Supposer le 31 décembre déplacerait
 * toutes les échéances, et toujours dans le sens de la destruction prématurée.
 *
 * SAFE NE DÉTRUIT RIEN. L'écran dit ce qui est arrivé à échéance. La destruction reste
 * un geste humain : conserver trop longtemps coûte du stockage, détruire trop tôt est
 * irréversible et constitue le manquement lui-même.
 *
 * LE JETON D'ACCÈS N'EST PAS AFFICHÉ. Il n'ouvre rien aujourd'hui : SAFE n'a pas de
 * portail de consultation pour l'inspecteur. Ce que cet écran tient est le REGISTRE
 * des accès accordés, et il le dit.
 */

interface Rule {
  kind: string;
  labelFr: string;
  years: number;
  anchor: string;
  reference: string;
  noteFr?: string;
}

/**
 * Un dossier fermé dont des registres sont arrivés à échéance.
 *
 * Groupé PAR DOSSIER, pas par pièce : une liste ligne par pièce compterait le nombre
 * de dossiers fermés multiplié par le nombre de catégories, et un cabinet de dix ans
 * la verrait tronquée sans savoir qu'elle l'est.
 */
interface Candidate {
  dossierId: string;
  dossierRef: string | null;
  labelsFr: string[];
  /** La plus ancienne des dates d'échéance du groupe. */
  purgeableFrom: string | null;
}

interface Session {
  id: string;
  inspectorName: string;
  inspectorOrganization: string;
  purpose: string;
  grantedAt: string;
  expiresAt: string;
  state: string;
  messageFr: string;
  readCount: number;
}

interface Props {
  canEdit: boolean;
  fiscalYearEndLabel: string | null;
  blockedFr: string | null;
  rules: Rule[];
  formDuties: { reference: string; dutyFr: string }[];
  presentationDuties: { reference: string; dutyFr: string }[];
  candidates: Candidate[];
  notYetCount: number;
  earliestUpcoming: string | null;
  sessions: Session[];
  defaultAccessDays: number;
  maxAccessDays: number;
  kitHref: string;
}

export function RetentionScreen({
  canEdit,
  fiscalYearEndLabel,
  blockedFr,
  rules,
  formDuties,
  presentationDuties,
  candidates,
  notYetCount,
  earliestUpcoming,
  sessions,
  defaultAccessDays,
  maxAccessDays,
  kitHref,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showGrant, setShowGrant] = useState(false);
  const [showFiscal, setShowFiscal] = useState(false);

  function run(action: (fd: FormData) => Promise<ActionResult>, fd: FormData) {
    setError(null);
    startTransition(async () => {
      const r = await action(fd);
      if (!r.ok) setError(r.error);
      else {
        setShowGrant(false);
        setShowFiscal(false);
        router.refresh();
      }
    });
  }

  const actifs = sessions.filter((s) => s.state === "ACTIVE");

  return (
    <div className="min-w-0 space-y-6">
      <ErrorBanner>{error}</ErrorBanner>

      {/* ── La fin d'exercice ───────────────────────────────────── */}
      {blockedFr ? (
        <Panel tone="alert" className="p-4">
          <h2 className="text-base font-medium text-[#8F3529]">
            La fin de l&apos;exercice financier n&apos;est pas réglée
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[var(--si-ink)]">{blockedFr}</p>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--si-muted)]">
            SAFE ne suppose pas le 31 décembre. Une supposition fausse déplacerait toutes les
            échéances, et toujours dans le sens de la destruction prématurée.
          </p>
          {canEdit ? (
            <form
              className="mt-3 flex flex-wrap items-end gap-2"
              action={(fd) => run(setFiscalYearEndAction, fd)}
            >
              <Field label="Fin d'exercice" hint="Seuls le jour et le mois sont conservés.">
                <input type="date" name="fiscalYearEnd" required className={inputClass} />
              </Field>
              <PrimaryButton type="submit" disabled={pending}>
                {pending ? "Enregistrement" : "Régler"}
              </PrimaryButton>
            </form>
          ) : (
            <p className="mt-3 text-sm text-[var(--si-muted)]">
              Un administrateur du cabinet doit la régler.
            </p>
          )}
        </Panel>
      ) : (
        <Panel className="p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <h2 className="text-sm text-[var(--si-muted)]">Fin de l&apos;exercice financier</h2>
            <span className="text-sm text-[var(--si-ink)]">{fiscalYearEndLabel}</span>
          </div>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[var(--si-muted)]">
            C&apos;est depuis cette date que courent les durées des pièces justificatives, des
            rapports et des relevés. Les autres courent depuis la fermeture du dossier.
          </p>
          {canEdit && (
            <>
              {!showFiscal ? (
                <button
                  type="button"
                  onClick={() => setShowFiscal(true)}
                  className="mt-2 text-xs text-[var(--si-muted)] underline transition-colors hover:text-[var(--si-ink)]"
                >
                  Corriger cette date
                </button>
              ) : (
                <form
                  className="mt-3 flex flex-wrap items-end gap-2"
                  action={(fd) => run(setFiscalYearEndAction, fd)}
                >
                  <Field label="Fin d'exercice" hint="Seuls le jour et le mois sont conservés.">
                    <input type="date" name="fiscalYearEnd" required className={inputClass} />
                  </Field>
                  <PrimaryButton type="submit" disabled={pending}>
                    {pending ? "Enregistrement" : "Enregistrer"}
                  </PrimaryButton>
                  <SecondaryButton type="button" onClick={() => setShowFiscal(false)}>
                    Annuler
                  </SecondaryButton>
                </form>
              )}
              <p className="mt-2 max-w-2xl text-xs leading-relaxed text-[var(--si-muted)]">
                La changer déplace des échéances de destruction déjà calculées. La modification
                est consignée à la piste d&apos;audit.
              </p>
            </>
          )}
        </Panel>
      )}

      {/* ── Les durées ──────────────────────────────────────────── */}
      <Panel>
        <BlockHeader
          title="Combien de temps garder quoi"
          reference={rules[0]?.reference.startsWith("B-1") ? "B-1 r.5, art. 31, 32" : "By-Law 9, s. 23"}
          count={rules.length}
          countLabel="catégorie"
        />
        <Table
          head={["Registre ou pièce", "Durée", "Point de départ", "Source"]}
          align={["left", "right", "left", "left"]}
          rows={rules.map((r) => [
            <span key="l">
              {r.labelFr}
              {r.noteFr ? (
                <span className="mt-0.5 block text-xs text-[var(--si-muted)]">{r.noteFr}</span>
              ) : null}
            </span>,
            `${r.years} ans`,
            r.anchor === "FILE_CLOSURE" ? "Fermeture du dossier" : "Fin d'exercice",
            r.reference,
          ])}
        />
      </Panel>

      {/* ── Ce qui arrive à échéance ────────────────────────────── */}
      <Panel>
        <BlockHeader
          title="Ce qui est arrivé à échéance"
          reference="B-1 r.5, art. 31 · By-Law 9, s. 23"
          count={candidates.length}
          countLabel="ensemble"
        />
        {candidates.length === 0 ? (
          <EmptyLine>
            Aucun ensemble de pièces n&apos;a atteint sa durée de conservation. Rien n&apos;est à
            décider aujourd&apos;hui.
          </EmptyLine>
        ) : (
          <Table
            head={["Dossier fermé", "Registres arrivés à échéance", "Depuis"]}
            align={["left", "left", "left"]}
            rows={candidates.map((c) => [
              c.dossierRef ?? "—",
              <span key="k">
                {c.labelsFr.length} catégorie{c.labelsFr.length === 1 ? "" : "s"}
                <span className="mt-0.5 block text-xs text-[var(--si-muted)]">
                  {c.labelsFr.join(" · ")}
                </span>
              </span>,
              day(c.purgeableFrom),
            ])}
          />
        )}
        <div className="space-y-1 border-t border-[var(--si-line)] px-4 py-3 text-xs leading-relaxed text-[var(--si-muted)]">
          <p>
            SAFE ne détruit rien de lui-même, et ne le proposera pas non plus. Cette liste dit ce
            qui est permis, pas ce qui est souhaitable : un cabinet peut garder plus longtemps.
          </p>
          {notYetCount > 0 && (
            <p>
              {notYetCount} autre{notYetCount === 1 ? "" : "s"} ensemble
              {notYetCount === 1 ? "" : "s"} de pièces {notYetCount === 1 ? "reste" : "restent"}{" "}
              sous conservation obligatoire
              {earliestUpcoming ? `, le premier jusqu'au ${day(earliestUpcoming)}` : ""}.
            </p>
          )}
        </div>
      </Panel>

      {/* ── La forme et la reconstitution ───────────────────────── */}
      <Panel>
        <BlockHeader title="Sous quelle forme, et si tout est perdu" reference="art. 30, 33 · s. 21(2)" />
        <ul className="px-4 py-2">
          {formDuties.map((d) => (
            <li
              key={d.reference}
              className="border-b border-[var(--si-line)] py-2.5 text-sm last:border-b-0"
            >
              <span className="text-[var(--si-ink)]">{d.dutyFr}</span>
              <p className="mt-0.5 text-xs text-[var(--si-muted)]">{d.reference}</p>
            </li>
          ))}
        </ul>
        <p className="border-t border-[var(--si-line)] px-4 py-3 text-xs leading-relaxed text-[var(--si-muted)]">
          La reconstitution se fait aux frais de l&apos;avocat. C&apos;est la raison d&apos;être de
          la{" "}
          <Link href={kitHref} className="underline">
            trousse d&apos;inspection
          </Link>{" "}
          : un cabinet qui peut réexporter une période complète n&apos;a pas à reconstituer, il
          produit.
        </p>
      </Panel>

      {/* ── L'accès de l'inspecteur ─────────────────────────────── */}
      <Panel>
        <BlockHeader
          title="Accès accordés aux inspecteurs"
          reference={presentationDuties[0]?.reference ?? "B-1 r.5, art. 29"}
          count={sessions.length}
          countLabel="accès"
          action={
            canEdit && !showGrant ? (
              <SecondaryButton type="button" onClick={() => setShowGrant(true)}>
                Consigner un accès
              </SecondaryButton>
            ) : undefined
          }
        />

        <ul className="border-b border-[var(--si-line)] px-4 py-2">
          {presentationDuties.map((d) => (
            <li key={d.reference} className="py-1.5 text-sm">
              <span className="text-[var(--si-ink)]">{d.dutyFr}</span>
              <span className="text-[var(--si-muted)]"> · {d.reference}</span>
            </li>
          ))}
        </ul>

        {showGrant && canEdit && (
          <form
            className="space-y-4 border-b border-[var(--si-line)] p-4"
            action={(fd) => run(grantInspectionAccessAction, fd)}
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Nom de la personne qui inspecte">
                <input name="inspectorName" required className={inputClass} />
              </Field>
              <Field label="Organisme">
                <input name="inspectorOrganization" required className={inputClass} />
              </Field>
              <Field label="Motif de l'accès">
                <input name="purpose" required className={inputClass} />
              </Field>
              <Field
                label="Durée en jours"
                hint={`Par défaut ${defaultAccessDays}, maximum ${maxAccessDays}. Aucun article ne fixe cette durée.`}
              >
                <input
                  name="days"
                  inputMode="numeric"
                  placeholder={String(defaultAccessDays)}
                  className={inputClass}
                />
              </Field>
              <Field label="Période visée, du" hint="Facultatif.">
                <input type="date" name="scopeFrom" className={inputClass} />
              </Field>
              <Field label="au">
                <input type="date" name="scopeTo" className={inputClass} />
              </Field>
            </div>
            <div className="flex flex-wrap gap-2">
              <PrimaryButton type="submit" disabled={pending}>
                {pending ? "Enregistrement" : "Consigner l'accès"}
              </PrimaryButton>
              <SecondaryButton type="button" onClick={() => setShowGrant(false)}>
                Annuler
              </SecondaryButton>
            </div>
          </form>
        )}

        {sessions.length === 0 ? (
          <EmptyLine>Aucun accès n&apos;a été consigné.</EmptyLine>
        ) : (
          <ul>
            {sessions.map((s) => (
              <li key={s.id} className="border-b border-[var(--si-line)] px-4 py-3 last:border-b-0">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <div className="min-w-0">
                    <span className="text-sm text-[var(--si-ink)]">{s.inspectorName}</span>
                    <span className="text-sm text-[var(--si-muted)]">
                      {" "}
                      · {s.inspectorOrganization}
                    </span>
                    <p className="mt-0.5 text-xs leading-relaxed text-[var(--si-muted)]">
                      {s.purpose}
                    </p>
                  </div>
                  <Pill tone={s.state === "ACTIVE" ? "done" : "info"}>{s.messageFr}</Pill>
                </div>
                <p className="mt-1 text-xs text-[var(--si-muted)]">
                  Consigné le {day(s.grantedAt)}
                  {s.readCount > 0 ? ` · ${s.readCount} consultation${s.readCount === 1 ? "" : "s"}` : ""}
                </p>
                {canEdit && s.state === "ACTIVE" && (
                  <form
                    className="mt-2 flex flex-wrap items-end gap-2"
                    action={(fd) => run(revokeInspectionAccessAction, fd)}
                  >
                    <input type="hidden" name="sessionId" value={s.id} />
                    <Field label="Motif de la révocation">
                      <input name="reason" className={inputClass} />
                    </Field>
                    <SecondaryButton type="submit" disabled={pending}>
                      Fermer cet accès
                    </SecondaryButton>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}

        <div className="space-y-1 border-t border-[var(--si-line)] px-4 py-3 text-xs leading-relaxed text-[var(--si-muted)]">
          <p>
            Ce que cet écran tient est un REGISTRE : qui a obtenu un accès, pour quel motif,
            jusqu&apos;à quand, et quand il a été fermé. SAFE n&apos;a pas encore de portail de
            consultation pour l&apos;inspecteur ; la consultation se fait aujourd&apos;hui par la{" "}
            <Link href={kitHref} className="underline">
              trousse d&apos;inspection
            </Link>
            , que vous remettez vous-même.
          </p>
          <p>
            Un accès fermé n&apos;est jamais supprimé. Son historique doit rester lisible : un
            accès dont la trace disparaît ne prouve plus rien.
          </p>
        </div>
      </Panel>

      {actifs.length > 0 && (
        <Disclosure label="Ce qu'un inspecteur pourrait lire" meta="lecture seule">
          <p className="px-4 py-3 text-sm leading-relaxed text-[var(--si-muted)]">
            L&apos;accès d&apos;inspection est en lecture seule, et il est limité aux livres
            comptables et aux registres réglementaires. Il ne donne accès ni aux documents des
            dossiers, ni aux communications avec les clients : l&apos;article 29 vise les livres
            et registres, sous réserve de leur confidentialité.
          </p>
        </Disclosure>
      )}
    </div>
  );
}
