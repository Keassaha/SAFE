"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { DossierCreationWizard } from "./DossierCreationWizard";

interface DossierCreateModalProps {
  clients: { id: string; raisonSociale: string }[];
  avocats: { id: string; nom: string }[];
  assistants?: { id: string; nom: string }[];
  canCreate: boolean;
  /** Id client présélectionné (ex. depuis la fiche client) */
  initialClientId?: string;
  /** Label du bouton */
  buttonLabel?: string;
  variant?: "primary" | "secondary" | "tertiary";
}

export function DossierCreateModal({
  clients,
  avocats,
  assistants = [],
  canCreate,
  initialClientId,
  buttonLabel,
  variant = "primary",
}: DossierCreateModalProps) {
  const t = useTranslations("matters");
  const [open, setOpen] = useState(false);

  if (!canCreate) return null;

  return (
    <>
      <Button variant={variant} onClick={() => setOpen(true)}>
        + {buttonLabel ?? t("newMatter")}
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t("newMatter")}
        maxWidth="max-w-2xl"
      >
        <div className="max-h-[80vh] overflow-y-auto -m-6 p-6">
          <p className="text-sm text-[var(--safe-text-secondary)] mb-4">
            Créez un dossier en quelques étapes : identification, client, équipe, tribunal, facturation, récapitulatif.
          </p>
          <DossierCreationWizard
            clients={clients}
            avocats={avocats}
            assistants={assistants}
            initialClientId={initialClientId}
          />
        </div>
      </Modal>
    </>
  );
}
