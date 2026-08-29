"use client";

/**
 * SAFE — Le résumé IA en ACTION d'en-tête.
 *
 * Décision CEO du 2026-08-27, troisième des trois questions de la refonte.
 *
 * ── Ce que ça change ─────────────────────────────────────────────────────────
 * Le résumé occupait un bloc entier de la fiche, avec son titre, sa phrase
 * d'explication et son bouton, pour une fonction qu'on déclenche rarement et
 * qu'on ne lit pas en passant. Il devient un bouton dans la rangée d'actions,
 * à côté de « Modifier le dossier », et son résultat s'ouvre dans une fenêtre.
 *
 * ── La règle qui ne change pas ───────────────────────────────────────────────
 * Le bloc était ENTIÈREMENT masqué sans `ANTHROPIC_API_KEY`, clé absente de
 * Vercel à ce jour. Le bouton suit la même règle, et le garde-fou reste où il
 * était : dans la page, qui seule lit l'environnement côté serveur. Un bouton
 * qui échoue devant un cabinet est pire que pas de bouton.
 *
 * ── Pourquoi une fenêtre et non un dépliage ──────────────────────────────────
 * Le résumé fait sept sections, dont des listes. Déplié sous l'en-tête il
 * repousserait toute la fiche vers le bas à chaque génération, c'est-à-dire
 * qu'il redeviendrait le bloc qu'on vient de retirer.
 *
 * ── La v2 monte le MÊME composant interne ────────────────────────────────────
 * `app/(app-v2)/.../OverviewTab.tsx` monte `DossierResumeIA` directement, dans
 * son propre conteneur. C'est pourquoi le titre y est optionnel et non
 * supprimé : ici la fenêtre le porte déjà, là-bas rien ne le porterait.
 */

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { DossierResumeIA } from "./DossierResumeIA";

interface Props {
  dossierId: string;
  initialResume: string | null;
  canSave: boolean;
}

export function DossierResumeIAAction({ dossierId, initialResume, canSave }: Props) {
  const [ouvert, setOuvert] = useState(false);

  return (
    <>
      <Button variant="secondary" onClick={() => setOuvert(true)}>
        <Sparkles className="h-4 w-4" />
        Résumé IA
      </Button>

      <Modal open={ouvert} onClose={() => setOuvert(false)} title="Résumé IA du dossier">
        <DossierResumeIA
          dossierId={dossierId}
          initialResume={initialResume}
          canSave={canSave}
          avecTitre={false}
        />
      </Modal>
    </>
  );
}
