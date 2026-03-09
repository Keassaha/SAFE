"use client";

import { createRetentionPolicy } from "@/app/(app)/parametres/retention/actions";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useTranslations } from "next-intl";

export function RetentionPolicyForm({ cabinetId }: { cabinetId: string }) {
  const t = useTranslations("parametres");
  return (
    <form action={createRetentionPolicy} className="space-y-4 max-w-md">
      <Input
        label={t("documentTypeLabel")}
        name="documentType"
        placeholder="piece_identite"
        required
      />
      <Input
        label={t("retentionYears")}
        name="retentionYears"
        type="number"
        min={1}
        defaultValue={7}
        required
      />
      <div>
        <label className="block text-sm font-medium text-neutral-text-secondary mb-1">
          {t("legalBasis")}
        </label>
        <input
          type="text"
          name="legalBasis"
          className="w-full h-10 px-3 rounded-safe border border-neutral-border bg-white/90 focus:ring-2 focus:ring-primary-500/30"
          placeholder={t("legalBasisPlaceholder")}
        />
      </div>
      <Button type="submit">{t("savePolicy")}</Button>
    </form>
  );
}
