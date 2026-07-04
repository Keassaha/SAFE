"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { createClientQuick } from "@/app/(app)/clients/actions";

/**
 * Création rapide de client : juste un nom, pour capturer un client en quelques
 * secondes (adjointe au téléphone) sans dérouler le wizard 6 étapes. La fiche
 * complète se remplit plus tard. S'appuie sur `createClientQuick` (détection de
 * doublon + audit inclus).
 */
export function ClientQuickCreateModal({
  canCreate,
  variant = "secondary",
}: {
  canCreate: boolean;
  variant?: "primary" | "secondary" | "tertiary";
}) {
  const t = useTranslations("clients");
  const tc = useTranslations("common");
  const tErr = useTranslations("errors");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [typeClient, setTypeClient] = useState<"personne_physique" | "personne_morale">("personne_morale");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!canCreate) return null;

  function reset() {
    setName("");
    setTypeClient("personne_morale");
    setError(null);
  }

  function handleClose() {
    if (!pending) {
      reset();
      setOpen(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = name.trim();
    if (!trimmed) {
      setError(tErr("client.nameRequired"));
      return;
    }
    setPending(true);
    try {
      const result = await createClientQuick({ raisonSociale: trimmed, typeClient });
      if ("error" in result) {
        setError(tErr(result.error, result.errorParams));
        return;
      }
      toast.success(t("clientCreated"));
      reset();
      setOpen(false);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <Button variant={variant} onClick={() => setOpen(true)}>
        {t("quickCreate")}
      </Button>
      <Modal open={open} onClose={handleClose} title={t("quickCreate")}>
        <p className="text-sm text-si-muted mb-4">{t("quickCreateHint")}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-si-muted mb-1">{tc("type")}</label>
            <select
              value={typeClient}
              onChange={(e) => setTypeClient(e.target.value as "personne_physique" | "personne_morale")}
              className="w-full h-10 px-3 rounded-lg border border-si-line bg-si-surface"
            >
              <option value="personne_morale">{t("company")}</option>
              <option value="personne_physique">{t("individual")}</option>
            </select>
          </div>
          <Input
            label={typeClient === "personne_morale" ? t("businessName") : t("fullName")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
          {error && <p className="text-sm text-[#B84A3E]">{error}</p>}
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={pending}>
              {pending ? `${tc("create")}…` : tc("create")}
            </Button>
            <Button type="button" variant="secondary" onClick={handleClose} disabled={pending}>
              {tc("cancel")}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
