"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { analyserProspection, accepterProposition } from "@/app/(app)/console/assistant/actions";
import type { AnalyseProspection, PropositionAction } from "@/lib/ai/proposer-actions-crm";

/**
 * Assistant de prospection sur la fiche d'un cabinet.
 *
 * Déclenché à la main, jamais en fond. Chaque proposition se lit avec son motif
 * et ne devient une tâche que si vous l'acceptez. Les incertitudes du modèle
 * sont affichées telles quelles : ce qu'il ne sait pas vaut souvent plus que ce
 * qu'il propose.
 */
export function AssistantProspection({ leadId }: { leadId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [analyse, setAnalyse] = useState<AnalyseProspection | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [acceptees, setAcceptees] = useState<Set<number>>(new Set());
  const [ecartees, setEcartees] = useState<Set<number>>(new Set());

  function analyser() {
    setErreur(null);
    setAcceptees(new Set());
    setEcartees(new Set());
    startTransition(async () => {
      const res = await analyserProspection(leadId);
      if (res.ok) setAnalyse(res.analyse);
      else setErreur(res.error);
    });
  }

  function accepter(index: number, proposition: PropositionAction) {
    setErreur(null);
    startTransition(async () => {
      const res = await accepterProposition(leadId, proposition);
      if (res.ok) {
        setAcceptees((s) => new Set(s).add(index));
        router.refresh();
      } else {
        setErreur(res.error);
      }
    });
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" onClick={analyser} disabled={isPending}>
          {isPending && !analyse ? "Lecture en cours..." : analyse ? "Relire le dossier" : "Que faire avec ce cabinet ?"}
        </Button>
        {analyse && (
          <span className="text-xs text-si-muted">Propositions à valider, rien n&apos;est écrit sans vous.</span>
        )}
      </div>

      {erreur && <p className="mt-2 text-sm text-[#B84A3E]">{erreur}</p>}

      {analyse && (
        <div className="mt-3 rounded-lg border border-si-line bg-si-canvas px-4 py-4">
          {analyse.lecture && (
            <p className="text-sm leading-6 text-si-ink">{analyse.lecture}</p>
          )}

          {analyse.propositions.length === 0 ? (
            <p className="mt-3 text-sm text-si-muted">
              Aucune action proposée pour l&apos;instant.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {analyse.propositions.map((p, i) => {
                const acceptee = acceptees.has(i);
                const ecartee = ecartees.has(i);
                if (ecartee) return null;
                return (
                  <li
                    key={`${p.titre}-${i}`}
                    className="rounded-md border border-si-line bg-si-surface px-3 py-3"
                  >
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <span className="text-sm font-medium text-si-ink">{p.titre}</span>
                      <span className="text-[10px] uppercase tracking-wide text-si-muted">
                        {p.type.replace(/_/g, " ")} · dans {p.dansJours} j
                        {p.priorite === "HAUTE" ? " · priorité haute" : ""}
                      </span>
                    </div>
                    {p.motif && <p className="mt-1 text-xs leading-5 text-si-muted">{p.motif}</p>}

                    <div className="mt-2.5 flex items-center gap-2">
                      {acceptee ? (
                        <span className="text-xs font-medium text-si-verified">
                          Ajoutée à vos tâches
                        </span>
                      ) : (
                        <>
                          <Button
                            variant="soft"
                            size="sm"
                            disabled={isPending}
                            onClick={() => accepter(i, p)}
                          >
                            Ajouter à mes tâches
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={isPending}
                            onClick={() => setEcartees((s) => new Set(s).add(i))}
                          >
                            Écarter
                          </Button>
                        </>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {analyse.incertitudes.length > 0 && (
            <div className="mt-4 border-t border-si-line pt-3">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-si-muted">
                Ce que l&apos;assistant ne sait pas
              </p>
              <ul className="mt-2 space-y-1">
                {analyse.incertitudes.map((inc, i) => (
                  <li key={i} className="text-xs leading-5 text-si-muted">
                    {inc}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
