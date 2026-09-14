"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { PaiementsTable } from "@/components/facturation/PaiementsTable";
import { AvertissementsComptables } from "@/components/facturation/AvertissementsComptables";
import {
  RegistreBarreOutils,
  RegistreFeuille,
  registreChampClass,
  registreSelectClass,
} from "@/components/ui/registre";
import { RANGEES } from "./donnees";

/**
 * Contrôle visuel du registre des paiements, hors authentification.
 *
 * Rend le composant RÉEL (`PaiementsTable`) sur des cas limites : nom très
 * long, paiement sans facture ni client, allocation partielle, encaissement
 * annulé, montant à sept chiffres. Ne touche pas la base, n'est pas branchée à
 * la navigation.
 */
/** L'avertissement tel que `createPayment` le renvoie sur une facture jamais transmise. */
const AVERTISSEMENT = [
  {
    code: "PAYMENT_ON_UNDELIVERED_INVOICE",
    message: "repli, jamais affiché quand le code est connu de l'écran",
    invoiceId: "inv-apercu",
    invoiceNumero: "2026-0039",
  },
];

export default function ApercuPaiements() {
  const rien = () => undefined;
  return (
    <div className="min-h-screen bg-si-canvas">
      <div className="mx-auto max-w-[1240px] space-y-6 px-6 py-10">
        <PageHeader
          variant="dashboard"
          title="Paiements"
          description="Données fictives. Contrôle visuel du composant réel sur ses cas limites."
        />
        <AvertissementsComptables warnings={AVERTISSEMENT} onDeclarerTransmission={rien} onFermer={rien} />
        <RegistreFeuille ariaLabel="Paiements">
          <RegistreBarreOutils
            recherche={<input className={`${registreChampClass} w-full px-3`} placeholder="Rechercher un client ou une facture" readOnly />}
            filtres={
              <div className="flex items-center gap-2">
                <select className={registreSelectClass} disabled>
                  <option>Tous les paiements</option>
                </select>
                <span className="inline-flex h-9 shrink-0 items-center whitespace-nowrap rounded-md border border-si-amber/40 bg-status-warning-bg px-2.5 text-[13px] font-medium text-si-amber-ink">
                  4 à allouer · 1 288 550,50 $
                </span>
                <span className="text-[13px] text-si-muted">9 paiements</span>
              </div>
            }
          />
          <PaiementsTable rangees={RANGEES} canWrite onModifier={rien} onAllouer={rien} onAnnuler={rien} />
        </RegistreFeuille>
      </div>
    </div>
  );
}
