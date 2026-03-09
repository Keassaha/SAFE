"use client";

import { useTranslations } from "next-intl";
import { createIdentityVerification } from "@/app/(app)/clients/actions";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function IdentityVerificationForm({ clientId }: { clientId: string }) {
  const t = useTranslations("clients");
  const tc = useTranslations("common");

  return (
    <form action={createIdentityVerification} className="space-y-4 max-w-xl">
      <input type="hidden" name="clientId" value={clientId} />
      <Input
        label={t("verificationDateLabel")}
        name="date"
        type="date"
        defaultValue={new Date().toISOString().slice(0, 10)}
      />
      <div>
        <label className="block text-sm font-medium text-neutral-text-secondary mb-1">
          {t("verificationMethod")}
        </label>
        <select
          name="methode"
          className="w-full h-10 px-3 rounded-safe border border-neutral-border bg-white/90 focus:ring-2 focus:ring-primary-500/30"
        >
          <option value="Pièce d'identité">{t("methodId")}</option>
          <option value="Vidéo">{t("methodVideo")}</option>
          <option value="En personne">{t("methodInPerson")}</option>
          <option value="Autre">{t("methodOther")}</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-neutral-text-secondary mb-1">
          {t("verificationStatus")}
        </label>
        <select
          name="statut"
          className="w-full h-10 px-3 rounded-safe border border-neutral-border bg-white/90 focus:ring-2 focus:ring-primary-500/30"
        >
          <option value="verifie">{t("statusVerified")}</option>
          <option value="en_attente">{t("statusPending")}</option>
          <option value="refuse">{t("statusRefused")}</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-neutral-text-secondary mb-1">
          {t("verificationNotes")}
        </label>
        <textarea
          name="notes"
          rows={2}
          className="w-full px-3 py-2 rounded-safe border border-neutral-border bg-white/90 focus:ring-2 focus:ring-primary-500/30"
        />
      </div>
      <Button type="submit">{t("saveVerification")}</Button>
    </form>
  );
}
