"use client";

import { useTransition, useState } from "react";
import { changerEtatDemande, rejouerRattachementCrm } from "../actions";

/**
 * Où l'on dit ce qu'il est advenu de la demande.
 *
 * Trois états seulement, et le retour en arrière est permis : une demande
 * marquée répondue par erreur doit pouvoir redevenir en attente, sans quoi on
 * la perd de vue pour de bon. C'est le même principe que le reste du produit :
 * on annule, on ne supprime pas.
 */

const ETATS = [
  { cle: "NOUVELLE", label: "En attente" },
  { cle: "REPONDUE", label: "Répondue" },
  { cle: "PLANIFIEE", label: "Rendez-vous fixé" },
  { cle: "CLOSE", label: "Close" },
] as const;

export function BarreEtat({
  id,
  statut,
  rattachee,
}: {
  id: string;
  statut: string;
  rattachee: boolean;
}) {
  const [enCours, demarrer] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {ETATS.map((e) => {
          const actif = e.cle === statut;
          return (
            <button
              key={e.cle}
              type="button"
              disabled={enCours || actif}
              onClick={() =>
                demarrer(async () => {
                  const r = await changerEtatDemande(id, e.cle);
                  setErreur(r.ok ? null : r.error);
                })
              }
              className={`safe-zoom-menu h-tap rounded-md border px-3 text-[13px] transition-colors disabled:cursor-default ${
                actif
                  ? "border-si-ink-strong/25 bg-si-ink-strong text-si-surface"
                  : "border-si-line bg-si-surface text-si-ink hover:border-si-ink-strong/40"
              }`}
            >
              {e.label}
            </button>
          );
        })}

        {!rattachee ? (
          <button
            type="button"
            disabled={enCours}
            onClick={() =>
              demarrer(async () => {
                const r = await rejouerRattachementCrm(id);
                setErreur(r.ok ? null : r.error);
              })
            }
            className="safe-zoom-menu ml-auto h-tap rounded-md border border-si-line bg-si-surface px-3 text-[13px] text-si-ink hover:border-si-ink-strong/40"
          >
            Réessayer l&apos;entrée au pipeline
          </button>
        ) : null}
      </div>

      {erreur ? <p className="text-[13px] text-si-danger">{erreur}</p> : null}
    </div>
  );
}
