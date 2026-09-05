"use client";

/**
 * Onglet Correspondance du cartable — le chargement (lot 0).
 *
 * Doctrine : docs/product/SPEC_SAFE_CORRESPONDANCE_ASSISTEE.md §22, lot 0.
 *
 * ── Ce que ça remplace ───────────────────────────────────────────────────────
 * Vingt-et-une lignes affichant deux phrases de remplissage, au-dessus de trois
 * journaux d'envoi bien tenus que personne ne voyait : `InvoiceSendLog`,
 * `NotificationLog` et `DossierCorrespondence`. Du moteur sans bouton, au sens
 * du §4.2 de la règle de build.
 *
 * ── Ce que ça ne fait PAS encore ─────────────────────────────────────────────
 * Aucun envoi depuis cet écran, aucune réception, aucun fil. La chronologie est
 * en lecture seule et le dit.
 *
 * La vue vit dans `components/correspondance/ChronologieCorrespondance.tsx`.
 * Ce fichier ne fait que la nourrir.
 */

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ChronologieCorrespondance } from "@/components/correspondance/ChronologieCorrespondance";
import type { EntreeCorrespondance } from "@/lib/services/correspondance/chronologie";

export function DossierDetailCorrespondance({ dossierId }: { dossierId: string }) {
  const t = useTranslations("matterDetailUi");
  const [entrees, setEntrees] = useState<EntreeCorrespondance[]>([]);
  const [tronquee, setTronquee] = useState(false);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    let annule = false;
    async function charger() {
      setChargement(true);
      setErreur(null);
      try {
        const res = await fetch(`/api/dossiers/${dossierId}/correspondance`, { cache: "no-store" });
        if (!res.ok) throw new Error(t("corrLoadError"));
        const data = (await res.json()) as { entrees: EntreeCorrespondance[]; tronquee: boolean };
        if (annule) return;
        setEntrees(data.entrees ?? []);
        setTronquee(Boolean(data.tronquee));
      } catch (e) {
        if (!annule) setErreur(e instanceof Error ? e.message : t("corrLoadError"));
      } finally {
        if (!annule) setChargement(false);
      }
    }
    charger();
    return () => {
      annule = true;
    };
  }, [dossierId, t]);

  return (
    <ChronologieCorrespondance
      entrees={entrees}
      tronquee={tronquee}
      chargement={chargement}
      erreur={erreur}
    />
  );
}
