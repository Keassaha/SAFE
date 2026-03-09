"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { createClient, updateClientForm, deleteClient } from "@/app/(app)/clients/actions";
import { routes } from "@/lib/routes";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { Client } from "@prisma/client";

export function ClientForm({
  client,
  error,
  canEditSensitive,
}: {
  client?: Client;
  error?: string | null;
  canEditSensitive?: boolean;
}) {
  const t = useTranslations("clients");
  const tc = useTranslations("common");
  const isEdit = !!client;

  return (
    <form
      action={isEdit && client ? updateClientForm : createClient}
      className="space-y-4 max-w-xl"
    >
      {isEdit && client && (
        <input type="hidden" name="id" value={client.id} />
      )}
      <div>
        <label className="block text-sm font-medium text-neutral-text-secondary mb-1">
          {t("clientTypeLabel")}
        </label>
        <select
          name="typeClient"
          defaultValue={client?.typeClient ?? "personne_morale"}
          className="w-full h-10 px-3 rounded-safe border border-neutral-border bg-white/90 text-neutral-text-primary focus:ring-2 focus:ring-primary-500/30"
        >
          <option value="personne_morale">{t("legalEntity")}</option>
          <option value="personne_physique">{t("naturalPerson")}</option>
        </select>
      </div>
      <Input
        label={t("businessName")}
        name="raisonSociale"
        defaultValue={client?.raisonSociale}
        required
      />
      {(client?.typeClient === "personne_physique" || !isEdit) && (
        <>
          <Input
            label={t("firstName")}
            name="prenom"
            defaultValue={client?.prenom ?? ""}
          />
          <Input
            label={t("lastName")}
            name="nom"
            defaultValue={client?.nom ?? ""}
          />
        </>
      )}
      <Input
        label={t("contact")}
        name="contact"
        defaultValue={client?.contact ?? ""}
      />
      <Input
        label={tc("email")}
        name="email"
        type="email"
        defaultValue={client?.email ?? ""}
      />
      <Input
        label={tc("phone")}
        name="telephone"
        defaultValue={client?.telephone ?? ""}
      />
      <Input
        label={tc("address")}
        name="adresse"
        defaultValue={client?.adresse ?? ""}
      />
      {isEdit && (
        <>
          <Input
            label={t("consentDate")}
            name="consentementCollecteAt"
            type="datetime-local"
            defaultValue={
              client?.consentementCollecteAt
                ? new Date(client.consentementCollecteAt).toISOString().slice(0, 16)
                : ""
            }
          />
          <div>
            <label className="block text-sm font-medium text-neutral-text-secondary mb-1">
              {t("consentPurposes")}
            </label>
            <textarea
              name="finalitesConsentement"
              defaultValue={client?.finalitesConsentement ?? ""}
              rows={2}
              className="w-full px-3 py-2 rounded-safe border border-neutral-border bg-white/90 text-neutral-text-primary focus:ring-2 focus:ring-primary-500/30"
              placeholder={t("consentPlaceholder")}
            />
          </div>
          <Input
            label={t("retentionUntil")}
            name="retentionJusqua"
            type="date"
            defaultValue={
              client?.retentionJusqua
                ? new Date(client.retentionJusqua).toISOString().slice(0, 10)
                : ""
            }
          />
          {canEditSensitive && (
            <div>
              <label className="block text-sm font-medium text-neutral-text-secondary mb-1">
                {t("confidentialNotes")}
              </label>
              <textarea
                name="notesConfidentielles"
                defaultValue={client?.notesConfidentielles ?? ""}
                rows={3}
                className="w-full px-3 py-2 rounded-safe border border-neutral-border bg-white/90 text-neutral-text-primary focus:ring-2 focus:ring-primary-500/30"
              />
            </div>
          )}
        </>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit">
          {isEdit ? tc("save") : t("createClient")}
        </Button>
        {isEdit && client && (
          <DeleteClientButton clientId={client.id} />
        )}
        <Link href={routes.clients}>
          <Button type="button" variant="secondary">
            {tc("cancel")}
          </Button>
        </Link>
      </div>
    </form>
  );
}

function DeleteClientButton({ clientId }: { clientId: string }) {
  const tc = useTranslations("common");

  return (
    <Button
      type="button"
      variant="danger"
      onClick={() => deleteClient(clientId)}
    >
      {tc("delete")}
    </Button>
  );
}
