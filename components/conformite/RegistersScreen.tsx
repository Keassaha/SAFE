"use client";
import { useMoney } from "./primitives";

import { useRouter } from "next/navigation";
import type { CabinetProvince } from "@/lib/compliance/rules";
import {
  BlockHeader,
  EmptyLine,
  Field,
  Panel,
  Pill,
  SecondaryButton,
  Table,
  inputClass,
} from "./primitives";

/**
 * Registres réglementaires — art. 30 B-1 r.5 / par. 21(2) By-Law 9.
 *
 * ── Décisions de design ──────────────────────────────────────────────────────
 *
 * UNE INTENTION (M2) : produire une copie. L'écran affiche le registre à l'écran pour
 * qu'on vérifie avant d'imprimer, mais le geste attendu est l'impression.
 *
 * LES REGISTRES QUI NE S'APPLIQUENT PAS À LA PROVINCE NE SONT PAS AFFICHÉS. Montrer à
 * un cabinet ontarien un registre que seul le Québec impose lui ferait croire à une
 * obligation qu'il n'a pas.
 *
 * L'EMPREINTE EST VISIBLE. Elle permet de vérifier qu'une copie remise n'a pas été
 * modifiée. Elle n'est exigée par aucun article, et l'écran le dit.
 */

interface RegisterRow {
  id: string;
  titleFr: string;
  reference: string;
  noteFr?: string | null;
}

interface Rendered {
  id: string;
  titleFr: string;
  reference: string;
  noteFr: string | null;
  periodLabel: string;
  accountLabel: string | null;
  generatedAt: string;
  columns: { key: string; labelFr: string; align: string; money?: boolean; reference: string | null }[];
  rows: Record<string, string>[];
  totals: Record<string, number>;
  rowCount: number;
  fingerprint: string;
}

interface Props {
  province: CabinetProvince;
  registers: RegisterRow[];
  selectedId: string;
  periode: string | null;
  rendered: Rendered | null;
  error: string | null;
}

export function RegistersScreen({
  province,
  registers,
  selectedId,
  periode,
  rendered,
  error,
}: Props) {
  const router = useRouter();
  const money = useMoney();

  function go(id: string, p: string | null) {
    const q = new URLSearchParams({ registre: id });
    if (p) q.set("periode", p);
    router.push(`/inspection/registres?${q.toString()}`);
  }

  const exportUrl = (format: "html" | "csv") => {
    const q = new URLSearchParams({ id: selectedId, format });
    if (periode) q.set("periode", periode);
    return `/api/conformite/registre?${q.toString()}`;
  };

  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
      {/* ── Les registres applicables ──────────────────────────── */}
      <aside className="min-w-0">
        <Panel>
          <div className="border-b border-[var(--si-line)] px-3 py-2">
            <h2 className="text-xs font-medium uppercase tracking-wide text-[var(--si-muted)]">
              {province === "QC" ? "Registres du Barreau" : "Registres du LSO"}
            </h2>
          </div>
          <ul>
            {registers.map((r) => {
              const actif = r.id === selectedId;
              return (
                <li key={r.id} className="border-b border-[var(--si-line)] last:border-b-0">
                  <button
                    type="button"
                    onClick={() => go(r.id, periode)}
                    className={`flex w-full flex-col gap-0.5 px-3 py-2.5 text-left transition-colors ${
                      actif ? "bg-si-ink-strong/[0.05]" : "hover:bg-si-ink-strong/[0.03]"
                    }`}
                  >
                    <span className="text-sm text-[var(--si-ink)]">{r.titleFr}</span>
                    <span className="text-xs text-[var(--si-muted)]">{r.reference}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Panel>
      </aside>

      <div className="min-w-0 space-y-6">
        {/* ── La période ───────────────────────────────────────── */}
        <Panel className="p-4">
          <form
            className="flex flex-wrap items-end gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              const v = String(new FormData(e.currentTarget).get("periode") ?? "");
              go(selectedId, v || null);
            }}
          >
            <Field label="Mois" className="min-w-[10rem]">
              <input type="month" name="periode" defaultValue={periode ?? ""} className={inputClass} />
            </Field>
            <SecondaryButton type="submit">Afficher</SecondaryButton>
            {periode && (
              <SecondaryButton type="button" onClick={() => go(selectedId, null)}>
                Tout l&apos;historique
              </SecondaryButton>
            )}
            <p className="w-full text-xs text-[var(--si-muted)] sm:w-auto sm:flex-1">
              Sans mois précisé, le registre couvre tout l&apos;historique du cabinet.
            </p>
          </form>
        </Panel>

        {error && (
          <Panel tone="alert" className="p-4">
            <h2 className="text-base font-medium text-si-danger-ink">Ce registre n&apos;est pas produit</h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[var(--si-ink)]">{error}</p>
          </Panel>
        )}

        {rendered && (
          <>
            <Panel>
              <BlockHeader
                title={rendered.titleFr}
                reference={rendered.reference}
                count={rendered.rowCount}
                action={
                  <span className="flex gap-2">
                    <a
                      href={exportUrl("html")}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg bg-[var(--si-ink-strong)] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-si-ink-strong-soft"
                    >
                      Imprimer
                    </a>
                    <a
                      href={exportUrl("csv")}
                      className="rounded-lg border border-[var(--si-line)] px-3 py-1.5 text-xs text-[var(--si-ink)] transition-colors hover:bg-si-ink-strong/[0.04]"
                    >
                      CSV
                    </a>
                  </span>
                }
              />

              <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 border-b border-[var(--si-line)] px-4 py-2.5 text-xs text-[var(--si-muted)]">
                <span>Période : {rendered.periodLabel}</span>
                {rendered.accountLabel && <span>Compte : {rendered.accountLabel}</span>}
                <span className="font-mono">Empreinte {rendered.fingerprint.slice(0, 12)}</span>
              </div>

              {rendered.noteFr && (
                <p className="border-b border-[var(--si-line)] px-4 py-2.5 text-xs leading-relaxed text-[var(--si-muted)]">
                  {rendered.noteFr}
                </p>
              )}

              {rendered.rows.length === 0 ? (
                <EmptyLine>
                  Aucune inscription pour cette période. Un registre vide reste un registre :
                  il se produit et se présente tel quel.
                </EmptyLine>
              ) : (
                <Table
                  head={rendered.columns.map((c) => c.labelFr)}
                  align={rendered.columns.map((c) => (c.align === "right" ? "right" : "left"))}
                  rows={rendered.rows.map((row) =>
                    rendered.columns.map((c) => (
                      <span key={c.key} className={c.align === "right" ? "" : "block truncate"}>
                        {row[c.key] ?? ""}
                      </span>
                    )),
                  )}
                />
              )}

              {Object.keys(rendered.totals).length > 0 && (
                <div className="flex flex-wrap items-baseline gap-x-8 gap-y-1 border-t border-[var(--si-line)] px-4 py-3">
                  {rendered.columns
                    .filter((c) => c.money && rendered.totals[c.key] !== undefined)
                    .map((c) => (
                      <span key={c.key} className="text-sm">
                        <span className="text-[var(--si-muted)]">Total {c.labelFr.toLowerCase()} </span>
                        <span className="font-medium tabular-nums text-[var(--si-ink)]">
                          {money(rendered.totals[c.key]!)}
                        </span>
                      </span>
                    ))}
                </div>
              )}
            </Panel>

            {/* ── D'où vient chaque colonne ──────────────────────── */}
            <Panel>
              <BlockHeader title="D'où vient chaque colonne" />
              <ul className="px-4 py-3">
                {rendered.columns.map((c) => (
                  <li
                    key={c.key}
                    className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-[var(--si-line)] py-2 text-sm last:border-b-0"
                  >
                    <span className="text-[var(--si-ink)]">{c.labelFr}</span>
                    {c.reference ? (
                      <span className="text-xs text-[var(--si-muted)]">{c.reference}</span>
                    ) : (
                      <Pill tone="info">colonne de confort</Pill>
                    )}
                  </li>
                ))}
              </ul>
              <p className="border-t border-[var(--si-line)] px-4 py-3 text-xs leading-relaxed text-[var(--si-muted)]">
                Une colonne sans article n&apos;est pas exigée par le règlement : elle est là pour
                vous aider à lire. Les autres portent la disposition qui les impose.
              </p>
            </Panel>
          </>
        )}

        <p className="max-w-3xl text-xs leading-relaxed text-[var(--si-muted)]">
          L&apos;empreinte permet de vérifier qu&apos;une copie remise n&apos;a pas été modifiée depuis sa
          production. Elle n&apos;est exigée par aucun article : c&apos;est un moyen, choisi ici, de
          rendre le registre vérifiable.
        </p>
      </div>
    </div>
  );
}
