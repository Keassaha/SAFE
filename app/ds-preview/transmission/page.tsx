"use client";

import { DeclarerTransmissionModal } from "@/components/facturation/DeclarerTransmissionModal";

/**
 * Contrôle visuel de la fenêtre de déclaration de transmission, hors
 * authentification. Elle est ouverte d'emblée : une bascule au montage
 * s'ouvrirait après la capture.
 *
 * Le composant est le vrai. Enregistrer échoue ici faute de session, ce qui est
 * sans importance : cette route sert à regarder, pas à déclarer.
 */
export default function ApercuTransmission() {
  const rien = () => undefined;
  return (
    <div className="min-h-screen bg-si-canvas">
      <DeclarerTransmissionModal
        open
        onClose={rien}
        invoiceId="inv-apercu"
        invoiceNumero="2026-0039"
      />
    </div>
  );
}
