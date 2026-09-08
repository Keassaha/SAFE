"use client";

/**
 * « Nouvel envoi » depuis l'onglet Correspondance d'un dossier (lot 0.5).
 *
 * Doctrine : docs/product/SPEC_SAFE_CORRESPONDANCE_ASSISTEE.md §22.
 *
 * ── Ce que ce composant construit : rien ─────────────────────────────────────
 * Les deux envois existent depuis longtemps et fonctionnent. Ce qui manquait,
 * c'est un chemin : pour transmettre une lettre, il fallait passer par le
 * portail d'édition, ouvrir le document, et trouver le bouton dans l'éditeur ;
 * pour une facture, ouvrir la facture. Depuis le dossier, rien n'y menait.
 *
 * Ce composant choisit une pièce et ouvre la fenêtre d'envoi qui lui
 * correspond. Il n'envoie rien lui-même, et il ne connaît aucune des deux
 * routes d'envoi.
 *
 * ── Un seul bouton plein ─────────────────────────────────────────────────────
 * L'onglet Correspondance gagne ici son unique action principale (loi L2). Le
 * choix de la pièce est une étape, pas une seconde intention.
 */

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Mail, X } from "lucide-react";
import { ListeEnvoyables } from "@/components/correspondance/ListeEnvoyables";
import { SendToClientDialog } from "@/components/edition/SendToClientDialog";
import { EnvoiFactureDialog } from "@/components/facturation/EnvoiFactureDialog";
import type { DocumentEnvoyable, FactureEnvoyable } from "@/lib/services/correspondance/envoyables";

interface Envoyables {
  documents: DocumentEnvoyable[];
  factures: FactureEnvoyable[];
  clientAUnCourriel: boolean;
  dossierFerme: boolean;
}

type Choix = { kind: "document"; id: string } | { kind: "facture"; id: string } | null;

export function NouvelEnvoiDossier({ dossierId, onSent }: { dossierId: string; onSent?: () => void }) {
  const t = useTranslations("matterDetailUi");

  const [ouvert, setOuvert] = useState(false);
  const [data, setData] = useState<Envoyables | null>(null);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [choix, setChoix] = useState<Choix>(null);

  useEffect(() => {
    if (!ouvert) return;
    let annule = false;
    (async () => {
      setChargement(true);
      setErreur(null);
      try {
        const res = await fetch(`/api/dossiers/${dossierId}/envoyables`, { cache: "no-store" });
        if (!res.ok) throw new Error(t("corrSendLoadError"));
        const d = (await res.json()) as Envoyables;
        if (!annule) setData(d);
      } catch (e) {
        if (!annule) setErreur(e instanceof Error ? e.message : t("corrSendLoadError"));
      } finally {
        if (!annule) setChargement(false);
      }
    })();
    return () => {
      annule = true;
    };
  }, [ouvert, dossierId, t]);

  const apresEnvoi = () => {
    setChoix(null);
    setOuvert(false);
    onSent?.();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOuvert(true)}
        className="inline-flex min-h-tap items-center gap-1.5 rounded-md bg-si-ink-strong px-4 text-sm font-medium text-si-surface transition-colors hover:bg-si-ink-strong-soft"
      >
        <Mail className="h-4 w-4" aria-hidden />
        {t("corrNewSend")}
      </button>

      {ouvert && choix == null ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="safe-scrim absolute inset-0" aria-hidden onClick={() => setOuvert(false)} />
          <div
            className="safe-glass-focus relative z-10 flex max-h-[88vh] w-full max-w-md flex-col overflow-hidden rounded-lg border"
            role="dialog"
            aria-modal="true"
            aria-labelledby="nouvel-envoi-titre"
          >
            <div className="flex items-center justify-between border-b border-si-line px-5 py-3">
              <h3 id="nouvel-envoi-titre" className="text-base font-medium text-si-ink">
                {t("corrNewSendTitle")}
              </h3>
              <button
                type="button"
                onClick={() => setOuvert(false)}
                className="inline-flex h-tap w-tap items-center justify-center rounded-md text-si-muted transition-colors hover:bg-si-canvas hover:text-si-ink"
                aria-label={t("corrClose")}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto px-5 py-4">
              <ListeEnvoyables
                documents={data?.documents ?? []}
                factures={data?.factures ?? []}
                clientAUnCourriel={data?.clientAUnCourriel ?? true}
                dossierFerme={data?.dossierFerme ?? false}
                chargement={chargement}
                erreur={erreur}
                onChoisirDocument={(id) => setChoix({ kind: "document", id })}
                onChoisirFacture={(id) => setChoix({ kind: "facture", id })}
              />
            </div>
          </div>
        </div>
      ) : null}

      {choix?.kind === "document" ? (
        <SendToClientDialog documentId={choix.id} onClose={() => setChoix(null)} onSent={apresEnvoi} />
      ) : null}
      {choix?.kind === "facture" ? (
        <EnvoiFactureDialog invoiceId={choix.id} onClose={() => setChoix(null)} onSent={apresEnvoi} />
      ) : null}
    </>
  );
}
