"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui/Modal";
import { DepotForm } from "./DepotForm";
import { RetraitForm } from "./RetraitForm";

interface ClientOption {
  id: string;
  raisonSociale: string;
}

interface DossierOption {
  id: string;
  clientId: string;
  intitule: string;
  numeroDossier: string | null;
}

export interface AddTransactionModalProps {
  open: boolean;
  onClose: () => void;
  cabinetId: string | null;
  clients: ClientOption[];
  dossiers: DossierOption[];
  onSuccess?: () => void;
  disabled?: boolean;
}

type Tab = "depot" | "retrait";

export function AddTransactionModal({
  open,
  onClose,
  cabinetId,
  clients,
  dossiers,
  onSuccess,
  disabled,
}: AddTransactionModalProps) {
  const tf = useTranslations("fideicommis");
  const [tab, setTab] = useState<Tab>("depot");

  const handleSuccess = () => {
    onSuccess?.();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={tf("addTransaction")}>
      <div className="space-y-4">
        <div className="flex rounded-lg border border-[var(--safe-neutral-border)] p-1 bg-neutral-50/80">
          <button
            type="button"
            onClick={() => setTab("depot")}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              tab === "depot"
                ? "bg-white text-[var(--safe-text-title)] shadow-sm"
                : "text-[var(--safe-text-secondary)] hover:text-[var(--safe-text-title)]"
            }`}
          >
            {tf("depositTab")}
          </button>
          <button
            type="button"
            onClick={() => setTab("retrait")}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              tab === "retrait"
                ? "bg-white text-[var(--safe-text-title)] shadow-sm"
                : "text-[var(--safe-text-secondary)] hover:text-[var(--safe-text-title)]"
            }`}
          >
            {tf("withdrawalTab")}
          </button>
        </div>

        {tab === "depot" && (
          <DepotForm
            clients={clients}
            dossiers={dossiers}
            onSuccess={handleSuccess}
            disabled={disabled}
            embedded
          />
        )}
        {tab === "retrait" && (
          <RetraitForm
            cabinetId={cabinetId}
            clients={clients}
            dossiers={dossiers}
            onSuccess={handleSuccess}
            disabled={disabled}
            embedded
          />
        )}
      </div>
    </Modal>
  );
}
