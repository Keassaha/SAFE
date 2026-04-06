"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { createClientQuick } from "@/app/(app)/clients/actions";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface NewClientModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (client: { id: string; raisonSociale: string }) => void;
}

export function NewClientModal({ open, onClose, onSuccess }: NewClientModalProps) {
  const t = useTranslations("temps");
  const tc = useTranslations("common");
  const [raisonSociale, setRaisonSociale] = useState("");
  const [typeClient, setTypeClient] = useState<"personne_physique" | "personne_morale">("personne_morale");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = raisonSociale.trim();
    if (!trimmed) {
      setError(t("businessNameRequired"));
      return;
    }
    setPending(true);
    try {
      const result = await createClientQuick({ raisonSociale: trimmed, typeClient });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      toast.success(t("clientRegistered"));
      onSuccess(result);
      setRaisonSociale("");
      setTypeClient("personne_morale");
      onClose();
    } finally {
      setPending(false);
    }
  }

  function handleClose() {
    if (!pending) {
      setRaisonSociale("");
      setTypeClient("personne_morale");
      setError(null);
      onClose();
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title={t("registerNewClient")}>
      <p className="text-sm text-[var(--safe-text-secondary)] mb-4">
        {t("registerNewClientDesc")}
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label={t("businessNameOrName")}
          value={raisonSociale}
          onChange={(e) => setRaisonSociale(e.target.value)}
          placeholder={t("clientNamePlaceholder")}
          required
          autoFocus
        />
        <div>
          <label className="block text-sm font-medium text-[var(--safe-text-secondary)] mb-1">{t("clientType")}</label>
          <select
            value={typeClient}
            onChange={(e) => setTypeClient(e.target.value as "personne_physique" | "personne_morale")}
            className="w-full h-10 px-3 rounded-safe-sm border border-[var(--safe-neutral-border)] bg-white"
          >
            <option value="personne_morale">{t("legalEntity")}</option>
            <option value="personne_physique">{t("naturalPerson")}</option>
          </select>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2 pt-2">
          <Button type="submit" disabled={pending}>
            {pending ? t("registering") : t("registerInRegistry")}
          </Button>
          <Button type="button" variant="secondary" onClick={handleClose} disabled={pending}>
            {tc("cancel")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
