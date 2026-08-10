"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { CabinetProvince } from "@/lib/compliance/rules";
import {
  markDeclarationSentAction,
  type ActionResult,
} from "@/app/(app)/inspection/especes/actions";
import {
  BlockHeader,
  EmptyLine,
  ErrorBanner,
  Panel,
  Pill,
  PrimaryButton,
  Table,
  day,
  inputClass,
  money,
} from "./primitives";

/**
 * Espèces — art. 69 à 73 B-1 r.5 / s. 4 à 6 et 19 By-Law 9.
 *
 * ── Décisions de design ──────────────────────────────────────────────────────
 *
 * L'ÉCRAN OUVRE SUR LES DÉCLARATIONS EN RETARD, pas sur la liste des reçus. Le reçu
 * est déjà émis au moment de l'encaissement ; ce qui se perd, c'est la déclaration à
 * transmettre dans les trente jours.
 *
 * SAFE N'ENVOIE RIEN. Il suit l'échéance et enregistre que le cabinet a transmis.
 * Envoyer à la place de l'avocate une déclaration signée au directeur de l'inspection
 * serait poser un acte professionnel à sa place.
 *
 * L'AGRÉGATION EST RAPPELÉE. En Ontario le seuil se calcule par dossier, pas par
 * transaction : trois encaissements de 3 000 $ le franchissent. C'est la différence
 * de fond avec le Québec, et elle est écrite.
 */

interface Receipt {
  id: string;
  receiptNumber: number;
  date: string;
  payerName: string;
  cadAmount: number;
  currency: string;
  clientName: string | null;
  dossierRef: string | null;
  purpose: string | null;
  exemptionInvoked: string | null;
  declarationDueAt: string | null;
  declarationSentAt: string | null;
}

interface Pending {
  id: string;
  receiptNumber: number;
  date: string;
  cadAmount: number;
  payerName: string;
  dueAt: string;
  daysRemaining: number;
  overdue: boolean;
}

interface Props {
  province: CabinetProvince;
  canEdit: boolean;
  threshold: number;
  receipts: Receipt[];
  pending: Pending[];
}

export function CashScreen({ province, canEdit, threshold, receipts, pending }: Props) {
  const router = useRouter();
  const [pendingTx, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(fd: FormData) {
    setError(null);
    startTransition(async () => {
      const r: ActionResult = await markDeclarationSentAction(fd);
      if (!r.ok) setError(r.error);
      else router.refresh();
    });
  }

  const enRetard = pending.filter((p) => p.overdue);
  const aVenir = pending.filter((p) => !p.overdue);

  return (
    <div className="min-w-0 space-y-6">
      <ErrorBanner>{error}</ErrorBanner>

      {/* ── Les déclarations dues ──────────────────────────────── */}
      {pending.length === 0 ? (
        <Panel className="p-4">
          <h2 className="text-base font-medium text-[var(--si-ink)]">
            Aucune déclaration en attente
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[var(--si-muted)]">
            {province === "QC"
              ? "Une déclaration au directeur de l'inspection professionnelle devient due dès qu'un encaissement en espèces atteint le seuil."
              : "Le régime ontarien n'impose pas de déclaration équivalente à celle de l'article 71 québécois."}
          </p>
        </Panel>
      ) : (
        <Panel tone={enRetard.length > 0 ? "alert" : "neutral"} className="p-4">
          <h2
            className={`text-base font-medium ${
              enRetard.length > 0 ? "text-si-danger-ink" : "text-[var(--si-ink)]"
            }`}
          >
            {pending.length} déclaration{pending.length === 1 ? "" : "s"} à transmettre
            {enRetard.length > 0 && `, dont ${enRetard.length} en retard`}
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[var(--si-ink)]">
            La déclaration va au directeur de l&apos;inspection professionnelle, accompagnée d&apos;une
            copie du reçu et de la mention du fondement de l&apos;encaissement.
          </p>

          <ul className="mt-3">
            {[...enRetard, ...aVenir].map((p) => (
              <li
                key={p.id}
                className="border-t border-[var(--si-line)] py-3 first:border-t-0 first:pt-0"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <span className="text-sm text-[var(--si-ink)]">
                    Reçu nº {p.receiptNumber} · {p.payerName} ·{" "}
                    <span className="tabular-nums">{money(p.cadAmount)}</span>
                  </span>
                  {p.overdue ? (
                    <Pill tone="action">
                      en retard depuis le {day(p.dueAt)}
                    </Pill>
                  ) : (
                    <Pill tone="info">
                      à transmettre avant le {day(p.dueAt)} · {p.daysRemaining} j
                    </Pill>
                  )}
                </div>

                {canEdit && (
                  <form
                    className="mt-2 flex flex-wrap items-end gap-2"
                    action={run}
                  >
                    <input type="hidden" name="receiptId" value={p.id} />
                    <label className="block">
                      <span className="text-xs text-[var(--si-muted)]">
                        Date à laquelle vous l&apos;avez transmise
                      </span>
                      <input type="date" name="sentAt" required className={inputClass} />
                    </label>
                    <PrimaryButton type="submit" disabled={pendingTx}>
                      {pendingTx ? "Enregistrement" : "Marquer transmise"}
                    </PrimaryButton>
                  </form>
                )}
              </li>
            ))}
          </ul>

          <p className="mt-3 max-w-2xl text-xs leading-relaxed text-[var(--si-muted)]">
            SAFE n&apos;envoie pas la déclaration à votre place : c&apos;est un acte professionnel qui
            vous appartient. Il suit l&apos;échéance et consigne la date que vous inscrivez.
          </p>
        </Panel>
      )}

      {/* ── Le carnet de reçus ─────────────────────────────────── */}
      <Panel>
        <BlockHeader
          title="Reçus d'espèces"
          reference={province === "QC" ? "B-1 r.5, art. 70" : "By-Law 9, s. 19(1)"}
          count={receipts.length}
          countLabel="reçu"
        />
        {receipts.length === 0 ? (
          <EmptyLine>
            Aucun encaissement en espèces. Le reçu est exigé pour TOUTE somme reçue en
            espèces, sans seuil.
          </EmptyLine>
        ) : (
          <Table
            head={["Payeur, client et dossier", "Nº", "Date", "Montant", "État"]}
            align={["left", "right", "left", "right", "left"]}
            rows={receipts.map((r) => [
              <span key="p" className="block truncate">
                {r.payerName}
                {r.clientName && <span className="text-[var(--si-muted)]"> · {r.clientName}</span>}
                {r.dossierRef && <span className="text-[var(--si-muted)]"> · {r.dossierRef}</span>}
              </span>,
              String(r.receiptNumber),
              day(r.date),
              <span key="m">
                {money(r.cadAmount)}
                {r.currency !== "CAD" && (
                  <span className="text-[var(--si-muted)]"> ({r.currency})</span>
                )}
              </span>,
              r.exemptionInvoked ? (
                <Pill key="e" tone="info">
                  exception
                </Pill>
              ) : r.declarationSentAt ? (
                <Pill key="e" tone="done">
                  déclarée
                </Pill>
              ) : r.declarationDueAt ? (
                <Pill key="e" tone="action">
                  à déclarer
                </Pill>
              ) : (
                ""
              ),
            ])}
          />
        )}
      </Panel>

      {/* ── La règle du seuil ──────────────────────────────────── */}
      <Panel className="p-4">
        <h3 className="text-sm font-medium text-[var(--si-ink)]">Comment le seuil se calcule</h3>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[var(--si-muted)]">
          {province === "QC" ? (
            <>
              Au Québec, le seuil de {money(threshold)} vise ce qui est reçu{" "}
              <strong className="font-medium text-[var(--si-ink)]">en fidéicommis</strong> pour un
              même mandat, sous réserve des six exceptions de l&apos;article 69, dont l&apos;avance
              d&apos;honoraires ou de débours.
            </>
          ) : (
            <>
              En Ontario, le seuil de {money(threshold)} se calcule sur un montant{" "}
              <strong className="font-medium text-[var(--si-ink)]">agrégé par dossier client</strong>.
              Trois encaissements de 3 000 $ sur le même dossier le franchissent, et SAFE les
              additionne à chaque saisie.
            </>
          )}
        </p>
        <p className="mt-2 max-w-2xl text-xs leading-relaxed text-[var(--si-muted)]">
          Une exception invoquée n&apos;est pas un contournement : elle est prévue par le texte,
          elle doit être motivée, et elle reste inscrite au reçu.
        </p>
      </Panel>
    </div>
  );
}
