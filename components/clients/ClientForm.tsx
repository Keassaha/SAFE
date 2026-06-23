"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { createClient, updateClientForm, archiveClient } from "@/app/(app)/clients/actions";
import { routes } from "@/lib/routes";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { Client } from "@prisma/client";

export function ClientForm({
  client,
  error,
  canEditSensitive,
  cancelHref,
}: {
  client?: Client;
  error?: string | null;
  canEditSensitive?: boolean;
  cancelHref?: string;
}) {
  const t = useTranslations("clients");
  const tc = useTranslations("common");
  const isEdit = !!client;
  const [typeClient, setTypeClient] = useState<"personne_morale" | "personne_physique">(
    (client?.typeClient as "personne_morale" | "personne_physique" | undefined) ?? "personne_morale"
  );
  const isMorale = typeClient === "personne_morale";

  return (
    <form
      action={isEdit && client ? updateClientForm : createClient}
      className="space-y-4 max-w-xl"
    >
      {isEdit && client && (
        <input type="hidden" name="id" value={client.id} />
      )}
      <div>
        <label className="block text-sm font-medium text-si-muted mb-1">
          {t("clientTypeLabel")}
        </label>
        <select
          name="typeClient"
          value={typeClient}
          onChange={(e) => setTypeClient(e.target.value as "personne_morale" | "personne_physique")}
          className="w-full h-10 px-3 rounded-xl border border-si-line bg-si-surface/90 text-si-ink focus:ring-2 focus:ring-si-verified/25"
        >
          <option value="personne_morale">{t("legalEntity")}</option>
          <option value="personne_physique">{t("naturalPerson")}</option>
        </select>
      </div>
      {isMorale ? (
        <Input
          label={t("businessName")}
          name="raisonSociale"
          defaultValue={client?.raisonSociale ?? ""}
          required
        />
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <Input
            label={t("firstName")}
            name="prenom"
            defaultValue={client?.prenom ?? ""}
            required
          />
          <Input
            label={t("lastName")}
            name="nom"
            defaultValue={client?.nom ?? ""}
            required
          />
        </div>
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
            <label className="block text-sm font-medium text-si-muted mb-1">
              {t("consentPurposes")}
            </label>
            <textarea
              name="finalitesConsentement"
              defaultValue={client?.finalitesConsentement ?? ""}
              rows={2}
              className="w-full px-3 py-2 rounded-xl border border-si-line bg-si-surface/90 text-si-ink focus:ring-2 focus:ring-si-verified/25"
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
              <label className="block text-sm font-medium text-si-muted mb-1">
                {t("confidentialNotes")}
              </label>
              <textarea
                name="notesConfidentielles"
                defaultValue={client?.notesConfidentielles ?? ""}
                rows={3}
                className="w-full px-3 py-2 rounded-xl border border-si-line bg-si-surface/90 text-si-ink focus:ring-2 focus:ring-si-verified/25"
              />
            </div>
          )}
        </>
      )}
      {error && <p className="text-sm text-[#B84A3E]">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit">
          {isEdit ? tc("save") : t("createClient")}
        </Button>
        {isEdit && client && (
          <DeleteClientButton clientId={client.id} />
        )}
        <Link href={cancelHref ?? routes.clients}>
          <Button type="button" variant="secondary">
            {tc("cancel")}
          </Button>
        </Link>
      </div>
    </form>
  );
}

function DeleteClientButton({ clientId }: { clientId: string }) {
  const tc = useTranslations("clients");

  return (
    <Button
      type="button"
      variant="danger"
      onClick={() => {
        if (window.confirm(tc("archiveClientConfirm"))) {
          archiveClient(clientId);
        }
      }}
    >
      {tc("archive")}
    </Button>
  );
}
