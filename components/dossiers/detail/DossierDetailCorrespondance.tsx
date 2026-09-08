"use client";

/**
 * Onglet Correspondance du cartable — le chargement.
 *
 * Doctrine : docs/product/SPEC_SAFE_CORRESPONDANCE_ASSISTEE.md §22.
 *
 * ── Ce que ça remplace ───────────────────────────────────────────────────────
 * Vingt-et-une lignes affichant deux phrases de remplissage, au-dessus de trois
 * journaux d'envoi bien tenus que personne ne voyait : `InvoiceSendLog`,
 * `NotificationLog` et `DossierCorrespondence`. Du moteur sans bouton, au sens
 * du §4.2 de la règle de build.
 *
 * ── Lot 0.5 ──────────────────────────────────────────────────────────────────
 * L'onglet gagne son action principale : transmettre un document ou une facture
 * du dossier, sans passer par le portail d'édition ni par l'écran de la
 * facture. Après un envoi, la chronologie se recharge, donc on voit la ligne
 * apparaître. C'est la boucle la plus courte que le lot puisse fermer.
 *
 * ── Ce qui n'existe toujours pas ─────────────────────────────────────────────
 * Aucune réception, aucun fil, aucune réponse. La réponse du client arrive dans
 * la boîte de l'avocate, pas dans le dossier. L'écran le dit sous son titre.
 */

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ChronologieCorrespondance } from "@/components/correspondance/ChronologieCorrespondance";
import { NouvelEnvoiDossier } from "@/components/correspondance/NouvelEnvoiDossier";
import type { EntreeCorrespondance } from "@/lib/services/correspondance/chronologie";

export function DossierDetailCorrespondance({ dossierId }: { dossierId: string }) {
  const t = useTranslations("matterDetailUi");
  const [entrees, setEntrees] = useState<EntreeCorrespondance[]>([]);
  const [tronquee, setTronquee] = useState(false);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  const charger = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      const res = await fetch(`/api/dossiers/${dossierId}/correspondance`, { cache: "no-store" });
      if (!res.ok) throw new Error(t("corrLoadError"));
      const data = (await res.json()) as { entrees: EntreeCorrespondance[]; tronquee: boolean };
      setEntrees(data.entrees ?? []);
      setTronquee(Boolean(data.tronquee));
    } catch (e) {
      setErreur(e instanceof Error ? e.message : t("corrLoadError"));
    } finally {
      setChargement(false);
    }
  }, [dossierId, t]);

  useEffect(() => {
    void charger();
  }, [charger]);

  return (
    <ChronologieCorrespondance
      entrees={entrees}
      tronquee={tronquee}
      chargement={chargement}
      erreur={erreur}
      action={<NouvelEnvoiDossier dossierId={dossierId} onSent={charger} />}
    />
  );
}
