"use client";
import { useMoney } from "./primitives";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toCalendarDayUTC, toIsoDay } from "@/lib/utils/calendar-date";
import {
  declareDeliveryAction,
  type ActionResult,
} from "@/app/(app)/inspection/transmission-factures/actions";
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
} from "./primitives";

/**
 * Transmission des factures — art. 56(2) B-1 r.5 · s. 9(1)3 By-Law 9.
 *
 * ── Pourquoi cet écran existe ────────────────────────────────────────────────
 *
 * Le règlement permet de se payer sur les sommes « pour lesquelles la facturation a
 * été envoyée ». Émettre ne suffit pas. SAFE bloque donc le retrait tant que la
 * transmission n'est pas consignée.
 *
 * Un cabinet qui poste ses factures transmet réellement, et SAFE n'en détient aucune
 * preuve. Sans porte de sortie, le garde-fou deviendrait un mur, et le retrait serait
 * saisi autrement — ce qui est pire que de l'avoir laissé passer en le signalant.
 *
 * L'écran tient donc deux listes, et ne les confond jamais : ce qui BLOQUE un retrait,
 * et ce qui l'appuie sur une DÉCLARATION plutôt que sur une preuve.
 */

interface Undelivered {
  id: string;
  numero: string;
  dateEmission: string;
  montantTotal: number;
  clientName: string;
  dossierRef: string | null;
}

interface Unproven {
  id: string;
  numero: string | null;
  deliveredAt: string | null;
  channelLabel: string;
  presumed: boolean;
}

interface Channel {
  channel: string;
  labelFr: string;
  noteFr: string;
}

interface Props {
  canEdit: boolean;
  reference: string;
  citation: string;
  undelivered: Undelivered[];
  unproven: Unproven[];
  channels: Channel[];
  decouplingDate: string;
  /**
   * Préfixe du lien vers une facture. Une FONCTION ne traverse pas la frontière
   * serveur / client : passer `routes.facturationFactureApercu` directement casserait
   * la sérialisation des props.
   */
  invoiceHrefBase: string;
}

export function InvoiceDeliveryScreen({
  canEdit,
  reference,
  citation,
  undelivered,
  unproven,
  channels,
  decouplingDate,
  invoiceHrefBase,
}: Props) {
  const router = useRouter();
  const money = useMoney();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [ouverte, setOuverte] = useState<string | null>(null);

  function run(fd: FormData) {
    setError(null);
    startTransition(async () => {
      const r: ActionResult = await declareDeliveryAction(fd);
      if (!r.ok) setError(r.error);
      else {
        setOuverte(null);
        router.refresh();
      }
    });
  }

  const presumees = unproven.filter((u) => u.presumed).length;
  const aujourdhui = toIsoDay(toCalendarDayUTC(new Date()));

  return (
    <div className="min-w-0 space-y-6">
      <ErrorBanner>{error}</ErrorBanner>

      {/* ── Ce qui bloque un retrait ────────────────────────────── */}
      <Panel tone={undelivered.length > 0 ? "alert" : "neutral"}>
        <BlockHeader
          title="Factures émises dont la transmission n'est pas consignée"
          reference={reference}
          count={undelivered.length}
          countLabel="facture"
        />
        {undelivered.length === 0 ? (
          <EmptyLine>
            Toutes les factures émises portent une transmission. Aucun retrait n&apos;est bloqué
            pour ce motif.
          </EmptyLine>
        ) : (
          <ul>
            {undelivered.map((f) => (
              <li key={f.id} className="border-b border-[var(--si-line)] last:border-b-0">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-3">
                  <div className="min-w-0">
                    <Link
                      href={`${invoiceHrefBase}/${f.id}`}
                      className="text-sm text-[var(--si-ink)] underline decoration-transparent transition-colors hover:decoration-current"
                    >
                      {f.numero}
                    </Link>
                    <span className="text-sm text-[var(--si-muted)]"> · {f.clientName}</span>
                    {f.dossierRef && (
                      <span className="text-sm text-[var(--si-muted)]"> · {f.dossierRef}</span>
                    )}
                    <p className="mt-0.5 text-xs text-[var(--si-muted)]">
                      Émise le {day(f.dateEmission)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-baseline gap-4">
                    <span className="text-sm tabular-nums text-[var(--si-ink)]">
                      {money(f.montantTotal)}
                    </span>
                    {canEdit && ouverte !== f.id && (
                      <SecondaryButton type="button" onClick={() => setOuverte(f.id)}>
                        Déclarer
                      </SecondaryButton>
                    )}
                  </div>
                </div>

                {canEdit && ouverte === f.id && (
                  <form
                    className="space-y-3 border-t border-[var(--si-line)] px-4 py-3"
                    action={run}
                  >
                    <input type="hidden" name="invoiceId" value={f.id} />
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <Field label="Transmise le">
                        <input
                          type="date"
                          name="deliveredAt"
                          required
                          defaultValue={aujourdhui}
                          className={inputClass}
                        />
                      </Field>
                      <Field label="Comment">
                        <select name="deliveryChannel" defaultValue="POSTE" className={inputClass}>
                          {channels.map((c) => (
                            <option key={c.channel} value={c.channel}>
                              {c.labelFr}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Note">
                        <input name="note" className={inputClass} />
                      </Field>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <PrimaryButton type="submit" disabled={pending}>
                        {pending ? "Enregistrement" : "Consigner la transmission"}
                      </PrimaryButton>
                      <SecondaryButton type="button" onClick={() => setOuverte(null)}>
                        Annuler
                      </SecondaryButton>
                    </div>
                    <p className="max-w-2xl text-xs leading-relaxed text-[var(--si-muted)]">
                      Cette déclaration n&apos;est pas une preuve. Elle est datée et vous est
                      attribuée ; conservez ce qui prouve l&apos;envoi.
                    </p>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
        <p className="border-t border-[var(--si-line)] px-4 py-3 text-xs leading-relaxed text-[var(--si-muted)]">
          Le règlement autorise à se payer sur les sommes {citation}. Tant qu&apos;une facture
          figure ici, aucun retrait de fidéicommis ne peut s&apos;appuyer sur elle.
        </p>
      </Panel>

      {/* ── Ce qui repose sur une déclaration ───────────────────── */}
      <Panel>
        <BlockHeader
          title="Transmissions déclarées, non prouvées par SAFE"
          reference={reference}
          count={unproven.length}
          countLabel="facture"
        />
        {unproven.length === 0 ? (
          <EmptyLine>
            Toutes les transmissions consignées ont été faites depuis SAFE, qui en conserve le
            journal d&apos;envoi.
          </EmptyLine>
        ) : (
          <Table
            head={["Facture", "Transmise le", "Canal", "Nature"]}
            align={["left", "left", "left", "left"]}
            rows={unproven.map((u) => [
              u.numero ?? "—",
              day(u.deliveredAt),
              u.channelLabel,
              u.presumed ? (
                <Pill key="n" tone="action">
                  présumée
                </Pill>
              ) : (
                <Pill key="n" tone="info">
                  déclarée
                </Pill>
              ),
            ])}
          />
        )}
        <div className="space-y-1 border-t border-[var(--si-line)] px-4 py-3 text-xs leading-relaxed text-[var(--si-muted)]">
          <p>
            Une transmission déclarée n&apos;est pas une faute : c&apos;est une zone où la preuve
            est chez vous, pas dans SAFE. La nommer vaut mieux que de la laisser se fondre dans
            la masse. Le retrait qui s&apos;y appuie porte le signalement jusqu&apos;au rapport.
          </p>
          {presumees > 0 && (
            <p>
              {presumees} d&apos;entre elles {presumees === 1 ? "est présumée" : "sont présumées"}{" "}
              : {presumees === 1 ? "elle a été émise" : "elles ont été émises"} avant le{" "}
              {decouplingDate}, quand SAFE ne distinguait pas encore l&apos;émission de la
              transmission. La date reprise est celle de l&apos;émission et ne prouve pas
              l&apos;envoi. Ces factures ne sont pas bloquées rétroactivement : le défaut était
              logiciel, pas le vôtre.
            </p>
          )}
        </div>
      </Panel>

      {/* ── Ce que valent les canaux ────────────────────────────── */}
      <Panel>
        <BlockHeader title="Ce que vaut chaque canal" reference={reference} />
        <ul className="px-4 py-2">
          {channels.map((c) => (
            <li
              key={c.channel}
              className="border-b border-[var(--si-line)] py-2.5 text-sm last:border-b-0"
            >
              <span className="text-[var(--si-ink)]">{c.labelFr}</span>
              <p className="mt-0.5 text-xs leading-relaxed text-[var(--si-muted)]">{c.noteFr}</p>
            </li>
          ))}
        </ul>
        <p className="border-t border-[var(--si-line)] px-4 py-3 text-xs leading-relaxed text-[var(--si-muted)]">
          Un seul canal fait preuve dans SAFE : le courriel envoyé depuis SAFE, dont le journal
          d&apos;envoi est conservé. Il ne se déclare pas à la main, sinon la preuve se
          fabriquerait.
        </p>
      </Panel>
    </div>
  );
}
