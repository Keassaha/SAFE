"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { CabinetProvince } from "@/lib/compliance/rules";
import {
  recordNoticeAction,
  releasePropertyAction,
  type ActionResult,
} from "@/app/(app)/comptes/autres-biens/actions";
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
  money,
} from "./primitives";

/**
 * Autres biens en fidéicommis — art. 43 à 46 B-1 r.5 / s. 18(9) By-Law 9.
 *
 * ── Décisions de design ──────────────────────────────────────────────────────
 *
 * ON N'INSCRIT PAS UN BIEN DEPUIS CET ÉCRAN. L'article 43 impose l'inscription « dès
 * réception ou remise » : le geste se fait au dossier, au moment où le bien arrive.
 * Offrir ici un formulaire de prise de possession inviterait à régulariser après
 * coup, c'est-à-dire en retard.
 *
 * LES AVIS AU CLIENT SONT DEUX OBLIGATIONS, PAS UNE. L'article 44 vise le bien reçu
 * d'un tiers, l'article 45 le lieu de garde et tout changement ultérieur. Les fondre
 * en une case « client informé » ferait croire qu'un seul avis couvre les deux.
 *
 * RIEN N'EST DÛ EN ONTARIO SUR CE POINT. La s. 18(9) impose le registre, pas la
 * notification. L'écran ne réclame donc aucun avis à un cabinet ontarien.
 */

interface Property {
  id: string;
  description: string;
  identificationNumber: string | null;
  estimatedValue: number | null;
  clientName: string;
  receivedFromName: string | null;
  receivedAt: string;
  storageLocation: string | null;
  purpose: string | null;
  fromThirdParty: boolean;
  clientNotifiedAt: string | null;
  storageNotifiedAt: string | null;
  releasedAt: string | null;
  releasedToName: string | null;
}

interface Notice {
  propertyId: string;
  description: string;
  clientName: string;
  kind: "THIRD_PARTY" | "STORAGE";
  reference: string;
  dutyFr: string;
}

interface Props {
  province: CabinetProvince;
  canEdit: boolean;
  held: Property[];
  released: Property[];
  notices: Notice[];
  retentionFr: string;
}

export function TrustPropertyScreen({
  province,
  canEdit,
  held,
  released,
  notices,
  retentionFr,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [remettant, setRemettant] = useState<string | null>(null);

  function run(action: (fd: FormData) => Promise<ActionResult>, fd: FormData) {
    setError(null);
    startTransition(async () => {
      const r = await action(fd);
      if (!r.ok) setError(r.error);
      else {
        setRemettant(null);
        router.refresh();
      }
    });
  }

  return (
    <div className="min-w-0 space-y-6">
      <ErrorBanner>{error}</ErrorBanner>

      {/* ── Les avis dus au client ─────────────────────────────── */}
      {notices.length > 0 && (
        <Panel tone="alert" className="p-4">
          <h2 className="text-base font-medium text-[#8F3529]">
            {notices.length} avis à donner au client
          </h2>
          <ul className="mt-3">
            {notices.map((n) => (
              <li
                key={`${n.propertyId}-${n.kind}`}
                className="border-t border-[#B84A3E]/15 py-3 first:border-t-0 first:pt-0"
              >
                <div className="text-sm text-[var(--si-ink)]">
                  {n.description}
                  <span className="text-[var(--si-muted)]"> · {n.clientName}</span>
                </div>
                <p className="mt-0.5 text-xs leading-relaxed text-[var(--si-muted)]">
                  {n.reference} · {n.dutyFr}
                </p>

                {canEdit && (
                  <form
                    className="mt-2 flex flex-wrap items-end gap-2"
                    action={(fd) => run(recordNoticeAction, fd)}
                  >
                    <input type="hidden" name="propertyId" value={n.propertyId} />
                    <input type="hidden" name="kind" value={n.kind} />
                    <Field label="Date de l'avis">
                      <input type="date" name="noticeDate" required className={inputClass} />
                    </Field>
                    <PrimaryButton type="submit" disabled={pending}>
                      {pending ? "Enregistrement" : "Client informé"}
                    </PrimaryButton>
                  </form>
                )}
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {/* ── Les biens détenus ──────────────────────────────────── */}
      <Panel>
        <BlockHeader
          title="Biens détenus"
          reference={province === "QC" ? "B-1 r.5, art. 43" : "By-Law 9, s. 18(9)"}
          count={held.length}
          countLabel="bien"
        />
        {held.length === 0 ? (
          <EmptyLine>
            Aucun bien détenu. Le registre vise ce qui n'est pas de l'argent : titres,
            testaments originaux, clés, actes, chèques certifiés non déposés.
          </EmptyLine>
        ) : (
          <>
            <Table
              head={
                province === "ON"
                  ? ["Bien et client", "Reçu de", "Reçu le", "Valeur", ""]
                  : ["Bien et client", "Lieu de garde", "Reçu le", "Affectation", ""]
              }
              align={["left", "left", "left", province === "ON" ? "right" : "left", "left"]}
              rows={held.map((p) => [
                <span key="d" className="block truncate">
                  {p.description}
                  {p.identificationNumber && (
                    <span className="text-[var(--si-muted)]"> nº {p.identificationNumber}</span>
                  )}
                  <span className="text-[var(--si-muted)]"> · {p.clientName}</span>
                  {p.fromThirdParty && (
                    <span className="ml-2 align-middle">
                      <Pill tone="info">reçu d'un tiers</Pill>
                    </span>
                  )}
                </span>,
                province === "ON" ? (p.receivedFromName ?? "—") : (p.storageLocation ?? "—"),
                day(p.receivedAt),
                province === "ON"
                  ? p.estimatedValue !== null
                    ? money(p.estimatedValue)
                    : "—"
                  : (p.purpose ?? "—"),
                canEdit ? (
                  <SecondaryButton
                    key="a"
                    type="button"
                    onClick={() => setRemettant(remettant === p.id ? null : p.id)}
                  >
                    {remettant === p.id ? "Annuler" : "Remettre"}
                  </SecondaryButton>
                ) : (
                  ""
                ),
              ])}
            />

            {remettant && canEdit && (
              <form
                className="flex flex-wrap items-end gap-3 border-t border-[var(--si-line)] p-4"
                action={(fd) => run(releasePropertyAction, fd)}
              >
                <input type="hidden" name="propertyId" value={remettant} />
                <Field label="Remis à" className="min-w-[16rem] flex-1">
                  <input
                    name="releasedToName"
                    required
                    className={inputClass}
                    placeholder="Nom de la personne qui reçoit le bien"
                  />
                </Field>
                <Field label="Date de la remise">
                  <input type="date" name="releasedAt" required className={inputClass} />
                </Field>
                <PrimaryButton type="submit" disabled={pending}>
                  {pending ? "Enregistrement" : "Consigner la remise"}
                </PrimaryButton>
                <p className="w-full text-xs leading-relaxed text-[var(--si-muted)]">
                  Le registre est permanent : une remise ne se reprend pas, elle se corrige
                  par une inscription nouvelle.
                </p>
              </form>
            )}
          </>
        )}
      </Panel>

      {/* ── Les biens remis ────────────────────────────────────── */}
      <Disclosure label="Biens déjà remis" meta={`${released.length}`}>
        {released.length === 0 ? (
          <EmptyLine>Aucun bien n'a encore été remis.</EmptyLine>
        ) : (
          <Table
            head={["Bien et client", "Reçu le", "Remis le", "Remis à"]}
            align={["left", "left", "left", "left"]}
            rows={released.map((p) => [
              <span key="d" className="block truncate">
                {p.description}
                <span className="text-[var(--si-muted)]"> · {p.clientName}</span>
              </span>,
              day(p.receivedAt),
              day(p.releasedAt),
              p.releasedToName ?? "—",
            ])}
          />
        )}
      </Disclosure>

      <p className="max-w-3xl text-xs leading-relaxed text-[var(--si-muted)]">{retentionFr}</p>
    </div>
  );
}
