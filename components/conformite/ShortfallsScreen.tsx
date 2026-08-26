"use client";
import { useMoney } from "./primitives";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  recordRemediationAction,
  refreshShortfallsAction,
  type ActionResult,
} from "@/app/(app)/inspection/soldes-debiteurs/actions";
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
 * Soldes débiteurs — art. 59, 60 B-1 r.5 / s. 9(3), 14 By-Law 9.
 *
 * ── Décisions de design ──────────────────────────────────────────────────────
 *
 * L'ÉCRAN NE COMPTE PAS LES JOURS COMME UNE TOLÉRANCE. Ni l'art. 60 (« sans délai »)
 * ni la s. 14 (« at all times ») ne chiffrent de délai. L'ancienneté est affichée
 * parce qu'un découvert de trois mois ne se lit pas comme un découvert d'une heure,
 * mais aucun libellé ne dit « il vous reste N jours ».
 *
 * LES INCIDENTS COMBLÉS RESTENT VISIBLES. Un découvert survenu le 3 et comblé le 4
 * n'apparaîtrait nulle part si l'on ne regardait que les soldes de fin de mois. Or
 * c'est ce qu'un inspecteur cherche : non pas l'état à une date, mais ce qui s'est
 * passé.
 */

interface Line {
  id: string;
  clientName: string;
  dossierRef: string | null;
  amount: number;
  detectedAt: string;
  resolvedAt: string | null;
  daysToResolve: number | null;
  source: string | null;
  daysOpen: number | null;
  severityFr: string;
  remedyFr: string;
  reference: string;
}

interface RemediationOption {
  source: string;
  labelFr: string;
  reference: string;
  noteFr: string;
}

interface Props {
  canEdit: boolean;
  openCount: number;
  totalOpen: number;
  open: Line[];
  history: Line[];
  options: RemediationOption[];
  statutoryDeadlineExists: boolean;
}

const SOURCE_LABEL: Record<string, string> = {
  CABINET_OPERATING: "Dépôt du cabinet",
  CLIENT_DEPOSIT: "Dépôt du client",
  LEDGER_CORRECTION: "Correction d'imputation",
};

export function ShortfallsScreen({
  canEdit,
  openCount,
  totalOpen,
  open,
  history,
  options,
  statutoryDeadlineExists,
}: Props) {
  const router = useRouter();
  const money = useMoney();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [comblant, setComblant] = useState<string | null>(null);

  function run(action: (fd: FormData) => Promise<ActionResult>, fd: FormData) {
    setError(null);
    startTransition(async () => {
      const r = await action(fd);
      if (!r.ok) setError(r.error);
      else {
        setComblant(null);
        router.refresh();
      }
    });
  }

  return (
    <div className="min-w-0 space-y-6">
      <ErrorBanner>{error}</ErrorBanner>

      {/* ── L'état ─────────────────────────────────────────────── */}
      {openCount === 0 ? (
        <Panel className="p-4">
          <h2 className="text-base font-medium text-[var(--si-ink)]">
            Aucune carte-client en découvert
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[var(--si-muted)]">
            Chaque carte-client est vérifiée séparément, jamais l&apos;ensemble : un compte à
            moins 200 $ compensé par un autre à plus 200 $ donnerait un total sain et
            masquerait exactement ce que le règlement vise.
          </p>
          {canEdit && (
            <div className="mt-3">
              <SecondaryButton
                type="button"
                disabled={pending}
                onClick={() => run(() => refreshShortfallsAction(), new FormData())}
              >
                {pending ? "Vérification" : "Vérifier maintenant"}
              </SecondaryButton>
            </div>
          )}
        </Panel>
      ) : (
        <Panel tone="alert" className="p-4">
          <h2 className="text-base font-medium text-si-danger-ink">
            {openCount} carte{openCount === 1 ? "" : "s"}-client{openCount === 1 ? "" : "s"} en
            découvert, {money(totalOpen)} à combler
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[var(--si-ink)]">
            Un solde débiteur n&apos;est pas un écart comptable : ce sont les fonds d&apos;un autre
            client qui servent ce dossier. {open[0]?.remedyFr}
          </p>
          {!statutoryDeadlineExists && (
            <p className="mt-2 max-w-2xl text-xs leading-relaxed text-[var(--si-muted)]">
              Le règlement ne fixe aucun nombre de jours. L&apos;ancienneté est affichée pour
              vous situer, pas comme un délai qui vous serait accordé.
            </p>
          )}
        </Panel>
      )}

      {/* ── Les découverts ouverts ─────────────────────────────── */}
      {openCount > 0 && (
        <Panel>
          <BlockHeader
            title="À combler"
            reference={open[0]?.reference}
            count={openCount}
            countLabel="découvert"
          />
          <Table
            head={["Client et dossier", "Constaté le", "Ouvert depuis", "Montant", ""]}
            align={["left", "left", "right", "right", "left"]}
            rows={open.map((l) => [
              <span key="c" className="block truncate">
                {l.clientName}
                {l.dossierRef && <span className="text-[var(--si-muted)]"> · {l.dossierRef}</span>}
              </span>,
              day(l.detectedAt),
              l.daysOpen === null ? "—" : `${l.daysOpen} j`,
              <span key="m" className="text-si-danger-ink">
                {money(l.amount)}
              </span>,
              canEdit ? (
                <SecondaryButton
                  key="a"
                  type="button"
                  onClick={() => setComblant(comblant === l.id ? null : l.id)}
                >
                  {comblant === l.id ? "Annuler" : "Combler"}
                </SecondaryButton>
              ) : (
                ""
              ),
            ])}
          />

          {comblant && canEdit && (
            <form
              className="space-y-3 border-t border-[var(--si-line)] p-4"
              action={(fd) => run(recordRemediationAction, fd)}
            >
              <input type="hidden" name="shortfallId" value={comblant} />
              <h4 className="text-sm font-medium text-[var(--si-ink)]">
                D&apos;où viennent les fonds qui comblent ce découvert ?
              </h4>

              <div className="space-y-2">
                {options.map((o) => (
                  <label key={o.source} className="flex gap-2 text-sm">
                    <input
                      type="radio"
                      name="source"
                      value={o.source}
                      required
                      className="mt-1 h-4 w-4 accent-[var(--si-ink-strong)]"
                    />
                    <span className="min-w-0">
                      <span className="text-[var(--si-ink)]">{o.labelFr}</span>
                      <span className="text-[var(--si-muted)]"> · {o.reference}</span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-[var(--si-muted)]">
                        {o.noteFr}
                      </span>
                    </span>
                  </label>
                ))}
              </div>

              <Field label="Précision (facultatif)">
                <input name="note" className={inputClass} placeholder="Ce qui explique le découvert" />
              </Field>

              <p className="max-w-2xl text-xs leading-relaxed text-[var(--si-muted)]">
                Ceci consigne le comblement. Le dépôt lui-même se saisit depuis l&apos;écran des
                comptes, avec ses propres contrôles : les réunir contournerait ces contrôles.
              </p>

              <PrimaryButton type="submit" disabled={pending}>
                {pending ? "Enregistrement" : "Consigner le comblement"}
              </PrimaryButton>
            </form>
          )}
        </Panel>
      )}

      {/* ── L'historique ───────────────────────────────────────── */}
      <Disclosure
        label="Découverts déjà comblés"
        meta={`${history.length} incident${history.length === 1 ? "" : "s"}`}
      >
        {history.length === 0 ? (
          <EmptyLine>Aucun découvert n&apos;a été constaté sur la période.</EmptyLine>
        ) : (
          <Table
            head={["Client et dossier", "Constaté le", "Comblé le", "Délai", "Source", "Montant"]}
            align={["left", "left", "left", "right", "left", "right"]}
            rows={history.map((l) => [
              <span key="c" className="block truncate">
                {l.clientName}
                {l.dossierRef && <span className="text-[var(--si-muted)]"> · {l.dossierRef}</span>}
              </span>,
              day(l.detectedAt),
              day(l.resolvedAt),
              l.daysToResolve === null ? "—" : `${l.daysToResolve} j`,
              l.source ? SOURCE_LABEL[l.source] ?? l.source : "—",
              money(l.amount),
            ])}
          />
        )}
        <p className="border-t border-[var(--si-line)] px-4 py-3 text-xs leading-relaxed text-[var(--si-muted)]">
          Un incident comblé reste inscrit. Un découvert survenu le 3 et comblé le 4
          n&apos;apparaîtrait nulle part si l&apos;on ne regardait que les soldes de fin de mois, et
          c&apos;est précisément ce qu&apos;un inspecteur cherche.
        </p>
      </Disclosure>

      {openCount > 0 && (
        <p className="max-w-3xl text-xs leading-relaxed text-[var(--si-muted)]">
          <Pill tone="info">note</Pill> Le dépôt de renflouement par le cabinet est
          légitime : l&apos;obligation de combler prime sur la limitation de ce qui peut entrer
          au compte général.
        </p>
      )}
    </div>
  );
}
