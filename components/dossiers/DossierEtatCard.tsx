"use client";

/**
 * SAFE — Bloc unique « État du dossier ».
 *
 * ── Ce qu'il remplace ────────────────────────────────────────────────────────
 * Deux blocs, « Où j'en étais ? » et « État de préparation », qui affichaient la
 * même phrase. Constat du CEO sur captures, 2026-08-27 : sur un dossier neuf,
 * « Prochaine action : Créer le mandat du dossier » apparaissait TROIS fois sur
 * le même écran, à deux blocs d'écart.
 *
 *   1. dans le récit de « Où j'en étais ? », qui se termine par cette phrase
 *   2. dans l'encadré vert du même bloc, avec le bouton « Faire maintenant »
 *   3. dans « État de préparation », avec un second lien
 *
 * Le lecteur ne savait pas lequel faisait autorité, et deux boutons menaient au
 * même endroit.
 *
 * ── L'ordre retenu ───────────────────────────────────────────────────────────
 * Celui de la phrase que la vitrine promet : ce qui a été fait, ce qui manque,
 * ce qui doit suivre.
 *
 *   1. l'état, en en-tête
 *   2. ce qui a été fait   → la dernière action
 *   3. ce qui manque       → la liste gravée
 *   4. ce qui doit suivre  → UNE prochaine action, un seul bouton
 *
 * ── Pourquoi « lastActivity » et non « summary » ─────────────────────────────
 * `resume.summary` est un récit qui CONTIENT déjà « Prochaine action : … »
 * (lib/dossiers/dossier-resume.ts:204). Le réutiliser ici réintroduirait la
 * répétition qu'on supprime. On lit donc `resume.lastActivity`, exposé
 * séparément par la même source.
 *
 * ── Pourquoi un nouveau composant ────────────────────────────────────────────
 * `DossierResumeCard` et `DossierPreparationCard` servent AUSSI dans
 * `app/(app-v2)`. Les fusionner sur place casserait la v2. Ils restent donc
 * intacts, et seule `app/(app)` monte ce bloc-ci.
 *
 * Voir docs/product/REFONTE_ORGANISATION_DOSSIER.md, problème P2.
 */

import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, Clock } from "lucide-react";
import type { DossierResume } from "@/lib/dossiers/dossier-resume";
import {
  PREPARATION_STATE_LABELS,
  SEVERITY_LABELS,
  type PreparationStatus,
} from "@/lib/dossiers/preparation-status";

interface Props {
  resume: DossierResume | null;
  status: PreparationStatus | null;
  nextActionHref?: string;
}

/** Encre par gravité. Trois crans, trois encres : sinon « Bloquant » pèse
 *  autant que « À compléter » et le tri ne sert plus à rien. */
const TON_GRAVITE: Record<string, string> = {
  blocking: "bg-si-danger-ink/10 text-si-danger-ink",
  critical: "bg-si-danger-ink/10 text-si-danger-ink",
  warning: "bg-si-amber-ink/10 text-si-amber-ink",
  info: "bg-si-canvas text-si-muted",
};

function dateCourte(d: Date): string {
  return new Intl.DateTimeFormat("fr-CA", { day: "numeric", month: "long" }).format(d);
}

export function DossierEtatCard({ resume, status, nextActionHref }: Props) {
  if (!resume && !status) return null;

  const etat = status ? PREPARATION_STATE_LABELS[status.state] : null;
  const pret = status?.state === "pret_pour_revue";
  const manquants = status?.missingItems ?? [];
  const derniere = resume?.lastActivity ?? null;
  /* Une seule source pour la prochaine action. Les deux blocs la calculaient
     chacun de leur côté ; `status` fait autorité parce que c'est lui qui porte
     la liste des manquants dont elle découle. */
  const prochaine = status?.nextAction ?? resume?.nextAction ?? null;
  const echeance = resume?.nearestDeadline ?? null;
  const urgente = echeance !== null && echeance.daysLeft <= 7;

  return (
    <div className="rounded-2xl border border-si-line bg-si-surface p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-medium text-si-ink">État du dossier</h2>
        <div className="flex flex-wrap items-center gap-2">
          {etat ? (
            <span
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-medium ${
                pret ? "bg-si-verified/10 text-si-verified" : "bg-si-amber-ink/10 text-si-amber-ink"
              }`}
            >
              {pret ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> : null}
              {etat}
            </span>
          ) : null}
          {status?.readyToBill ? (
            <span className="rounded-lg bg-si-verified/10 px-3 py-1 text-xs font-medium text-si-verified">
              Prêt à facturer
            </span>
          ) : null}
        </div>
      </div>

      {/* 1 — Ce qui a été fait. */}
      {derniere ? (
        <div className="border-l-[3px] border-si-verified pl-3.5">
          <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-si-muted">
            Dernière action
          </p>
          <p className="mt-0.5 text-[15px] leading-relaxed text-si-ink">
            {derniere.label}
            {derniere.actorName ? ` — ${derniere.actorName}` : ""}
            <span className="text-si-muted"> · {dateCourte(derniere.at)}</span>
          </p>
        </div>
      ) : (
        <p className="text-sm text-si-muted">Aucune action enregistrée pour l&apos;instant.</p>
      )}

      {/* L'échéance la plus proche, quand elle presse. Le temps qui reste est
          une information d'état, pas une alerte de plus. */}
      {urgente && echeance ? (
        <p className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-si-amber-ink/10 px-3 py-1.5 text-[13px] font-medium text-si-amber-ink">
          <Clock className="h-4 w-4" aria-hidden />
          {echeance.label} ·{" "}
          {echeance.daysLeft === 0
            ? "c'est aujourd'hui"
            : `dans ${echeance.daysLeft} jour${echeance.daysLeft > 1 ? "s" : ""}`}
        </p>
      ) : null}

      {/* 2 — Ce qui manque. */}
      {manquants.length > 0 ? (
        <div className="mt-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-si-muted">
            Manquants ({manquants.length})
          </p>
          <ul className="mt-2 space-y-1.5">
            {manquants.map((item, i) => (
              <li key={`${item.kind}-${i}`} className="flex items-center gap-2 text-sm">
                <span
                  className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                    TON_GRAVITE[item.severity] ?? TON_GRAVITE.info
                  }`}
                >
                  {SEVERITY_LABELS[item.severity]}
                </span>
                <span className="min-w-0 text-si-ink">{item.label}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-4 text-sm text-si-muted">Aucun manquant détecté.</p>
      )}

      {/* 3 — Ce qui doit suivre. UNE fois, un seul bouton. */}
      {prochaine ? (
        <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-si-verified/25 bg-si-verified/[0.06] px-4 py-3">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-si-verified">
              Prochaine action
            </p>
            <p className="mt-0.5 text-[15px] font-medium text-si-ink">{prochaine}</p>
          </div>
          {nextActionHref ? (
            <Link
              href={nextActionHref}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-si-ink-strong px-4 py-2.5 text-sm font-medium text-si-surface"
            >
              Faire maintenant
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          ) : null}
        </div>
      ) : pret ? (
        <p className="mt-4 inline-flex items-center gap-1.5 text-sm text-si-verified">
          <AlertTriangle className="h-4 w-4 rotate-180" aria-hidden />
          Tout est prêt, l&apos;avocat peut relire.
        </p>
      ) : null}
    </div>
  );
}
