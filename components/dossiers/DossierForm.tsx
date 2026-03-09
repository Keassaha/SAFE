"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  createDossier,
  updateDossierForm,
  archiveDossier,
} from "@/app/(app)/dossiers/actions";
import { routes } from "@/lib/routes";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { Dossier, Client, User } from "@prisma/client";

export function DossierForm({
  dossier,
  clients,
  avocats,
  assistants,
  initialClientId,
  error,
  canEditSensitive,
}: {
  dossier?: Dossier & { client?: Client };
  clients: Client[];
  avocats?: Pick<User, "id" | "nom">[];
  assistants?: Pick<User, "id" | "nom">[];
  initialClientId?: string;
  error?: string | null;
  canEditSensitive?: boolean;
}) {
  const t = useTranslations("matters");
  const tc = useTranslations("common");

  const isEdit = !!dossier;
  const createAction = async (formData: FormData) => {
    await createDossier(formData);
  };

  return (
    <form
      action={isEdit && dossier ? updateDossierForm : createAction}
      className="space-y-4 max-w-xl"
    >
      {isEdit && dossier && <input type="hidden" name="id" value={dossier.id} />}
      <div>
        <label className="block text-sm font-medium text-neutral-text-secondary mb-1">
          {tc("client")}
        </label>
        <select
          name="clientId"
          required
          defaultValue={dossier?.clientId ?? initialClientId ?? ""}
          className="w-full h-10 px-3 rounded-safe border border-neutral-border bg-white/90 focus:ring-2 focus:ring-primary-500/30"
        >
          <option value="">{t("selectClient")}</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.raisonSociale}
            </option>
          ))}
        </select>
      </div>
      {avocats && avocats.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-neutral-text-secondary mb-1">
            {t("responsibleLawyer")}
          </label>
          <select
            name="avocatResponsableId"
            defaultValue={dossier?.avocatResponsableId ?? ""}
            className="w-full h-10 px-3 rounded-safe border border-neutral-border bg-white/90 focus:ring-2 focus:ring-primary-500/30"
          >
            <option value="">{t("noMatterNone")}</option>
            {avocats.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nom}
              </option>
            ))}
          </select>
        </div>
      )}
      {assistants && assistants.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-neutral-text-secondary mb-1">
            {t("legalAssistant")}
          </label>
          <select
            name="assistantJuridiqueId"
            defaultValue={(dossier as { assistantJuridiqueId?: string | null })?.assistantJuridiqueId ?? ""}
            className="w-full h-10 px-3 rounded-safe border border-neutral-border bg-white/90 focus:ring-2 focus:ring-primary-500/30"
          >
            <option value="">{t("noMatterNone")}</option>
            {assistants.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nom}
              </option>
            ))}
          </select>
        </div>
      )}
      <Input label={t("matterNumber")} name="numeroDossier" placeholder="Ex. 2025-777" defaultValue={(dossier as { numeroDossier?: string | null })?.numeroDossier ?? ""} />
      <Input
        label={t("referenceOptional")}
        name="reference"
        defaultValue={dossier?.reference ?? ""}
      />
      <Input
        label={t("matterTitle")}
        name="intitule"
        defaultValue={dossier?.intitule}
        required
      />
      <div>
        <label className="block text-sm font-medium text-neutral-text-secondary mb-1">
          {tc("type")}
        </label>
        <select
          name="type"
          defaultValue={dossier?.type ?? ""}
          className="w-full h-10 px-3 rounded-safe border border-neutral-border bg-white/90 focus:ring-2 focus:ring-primary-500/30"
        >
          <option value="">{t("noMatterNone")}</option>
          <option value="droit_famille">{t("typeFamily")}</option>
          <option value="litige_civil">{t("typeCivilLitigation")}</option>
          <option value="criminel">{t("typeCriminal")}</option>
          <option value="immigration">{t("typeImmigration")}</option>
          <option value="corporate">{t("typeCorporate")}</option>
          <option value="autre">{t("typeOther")}</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-neutral-text-secondary mb-1">
          {tc("status")}
        </label>
        <select
          name="statut"
          defaultValue={dossier?.statut ?? "actif"}
          className="w-full h-10 px-3 rounded-safe border border-neutral-border bg-white/90 focus:ring-2 focus:ring-primary-500/30"
        >
          <option value="ouvert">{t("statusOpen")}</option>
          <option value="actif">{t("statusActive")}</option>
          <option value="en_attente">{t("statusPending")}</option>
          <option value="cloture">{t("statusClosed")}</option>
          <option value="archive">{t("statusArchived")}</option>
        </select>
      </div>
      {isEdit && dossier?.statut === "cloture" && (
        <Input
          label={t("closingDate")}
          name="dateCloture"
          type="date"
          defaultValue={
            dossier.dateCloture
              ? new Date(dossier.dateCloture).toISOString().slice(0, 10)
              : ""
          }
        />
      )}
      {isEdit && (
        <>
          <Input
            label={t("court")}
            name="tribunalNom"
            defaultValue={(dossier as { tribunalNom?: string | null })?.tribunalNom ?? ""}
          />
          <Input
            label={t("judicialDistrict")}
            name="districtJudiciaire"
            defaultValue={(dossier as { districtJudiciaire?: string | null })?.districtJudiciaire ?? ""}
          />
          <Input
            label={t("courtFileNumber")}
            name="numeroDossierTribunal"
            defaultValue={(dossier as { numeroDossierTribunal?: string | null })?.numeroDossierTribunal ?? ""}
          />
          <Input
            label={t("judgeName")}
            name="nomJuge"
            defaultValue={(dossier as { nomJuge?: string | null })?.nomJuge ?? ""}
          />
          <div>
            <label className="block text-sm font-medium text-neutral-text-secondary mb-1">{t("matterSummary")}</label>
            <textarea
              name="resumeDossier"
              rows={2}
              defaultValue={(dossier as { resumeDossier?: string | null })?.resumeDossier ?? ""}
              className="w-full px-3 py-2 rounded-safe border border-neutral-border bg-white/90 focus:ring-2 focus:ring-primary-500/30"
            />
          </div>
          {canEditSensitive && (
            <div>
              <label className="block text-sm font-medium text-neutral-text-secondary mb-1">{t("legalStrategyNotes")}</label>
              <textarea
                name="notesStrategieJuridique"
                rows={2}
                defaultValue={(dossier as { notesStrategieJuridique?: string | null })?.notesStrategieJuridique ?? ""}
                className="w-full px-3 py-2 rounded-safe border border-neutral-border bg-white/90 focus:ring-2 focus:ring-primary-500/30"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-neutral-text-secondary mb-1">{t("billingMode")}</label>
            <select
              name="modeFacturation"
              defaultValue={(dossier as { modeFacturation?: string | null })?.modeFacturation ?? ""}
              className="w-full h-10 px-3 rounded-safe border border-neutral-border bg-white/90 focus:ring-2 focus:ring-primary-500/30"
            >
              <option value="">{t("noMatterNone")}</option>
              <option value="horaire">{t("billingHourly")}</option>
              <option value="forfait">{t("billingFlat")}</option>
              <option value="retainer">{t("billingRetainer")}</option>
              <option value="contingent">{t("billingContingent")}</option>
            </select>
          </div>
          <Input
            label={t("hourlyRate")}
            name="tauxHoraire"
            type="number"
            step="0.01"
            defaultValue={(dossier as { tauxHoraire?: number | null })?.tauxHoraire ?? ""}
          />
          <Input
            label={t("retentionUntil")}
            name="retentionJusqua"
            type="date"
            defaultValue={
              dossier.retentionJusqua
                ? new Date(dossier.retentionJusqua).toISOString().slice(0, 10)
                : ""
            }
          />
          {canEditSensitive && (
            <div>
              <label className="block text-sm font-medium text-neutral-text-secondary mb-1">
                {t("confidentialDescription")}
              </label>
              <textarea
                name="descriptionConfidentielle"
                defaultValue={dossier.descriptionConfidentielle ?? ""}
                rows={3}
                className="w-full px-3 py-2 rounded-safe border border-neutral-border bg-white/90 focus:ring-2 focus:ring-primary-500/30"
              />
            </div>
          )}
        </>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit">
          {isEdit ? tc("save") : t("createMatter")}
        </Button>
        {isEdit && dossier && dossier.statut !== "archive" && (
          <form action={archiveDossier.bind(null, dossier.id)} className="inline">
            <Button type="submit" variant="secondary">
              {t("archiveMatter")}
            </Button>
          </form>
        )}
        <Link href={routes.dossiers}>
          <Button type="button" variant="secondary">
            {tc("cancel")}
          </Button>
        </Link>
      </div>
    </form>
  );
}
