"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { ClientCreationWizard } from "./ClientCreationWizard";

interface LawyerOption {
  id: string;
  nom: string;
}

interface ClientCreateModalProps {
  lawyers: LawyerOption[];
  canCreate: boolean;
  /** Label du bouton (ex. "+ Nouveau client") */
  buttonLabel?: string;
  /** Variant du bouton (primary par défaut) */
  variant?: "primary" | "secondary" | "tertiary";
}

export function ClientCreateModal({
  lawyers,
  canCreate,
  buttonLabel,
  variant = "primary",
}: ClientCreateModalProps) {
  const t = useTranslations("clients");
  const [open, setOpen] = useState(false);

  if (!canCreate) return null;

  return (
    <>
      <Button variant={variant} onClick={() => setOpen(true)}>
        + {buttonLabel ?? t("newClient")}
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t("newClient")}
        maxWidth="max-w-2xl"
      >
        <div className="max-h-[80vh] overflow-y-auto -m-6 p-6">
          <p className="text-sm text-[var(--safe-text-secondary)] mb-4">
            Créez un client en 6 étapes : identification, coordonnées, représentation, facturation, conformité, récapitulatif.
          </p>
          <ClientCreationWizard lawyers={lawyers} />
        </div>
      </Modal>
    </>
  );
}
