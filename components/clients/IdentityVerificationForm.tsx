"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { createIdentityVerification } from "@/app/(app)/clients/actions";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { IdentitySubjectKind, VerificationMethod } from "@/lib/compliance/identity";
import { toCalendarDayUTC, toIsoDay } from "@/lib/utils/calendar-date";

/**
 * Formulaire de vérification d'identité, adossé au règlement applicable.
 *
 * Avant CH-06.6, ce formulaire proposait « Pièce d'identité / Vidéo / En personne /
 * Autre » — quatre libellés libres dont aucun n'est une méthode réglementaire, et
 * dont « Vidéo » n'est pas admise en Ontario (By-Law 7.1 s. 23(7)1 énumère
 * limitativement trois méthodes). Il ne demandait aucune pièce, alors que l'art. 22
 * B-1 r.5 et la s. 23(13) By-Law 7.1 l'exigent tous deux.
 *
 * Les méthodes proposées viennent maintenant de `lib/compliance/identity.ts`, filtrées
 * côté serveur par province et par type de client. La pièce justificative est
 * obligatoire pour marquer « vérifié » : le service refuse sinon.
 */
export function IdentityVerificationForm({
  clientId,
  province,
  methods,
  proofRequiredByCabinet = true,
}: {
  clientId: string;
  province: "QC" | "ON";
  subjectKind?: IdentitySubjectKind;
  /** Méthodes admises, calculées côté serveur pour la province et le type de client. */
  methods: VerificationMethod[];
  /** Le cabinet exige-t-il une pièce pour marquer « vérifié » ? (réglage cabinet) */
  proofRequiredByCabinet?: boolean;
}) {
  const t = useTranslations("clients");
  const [statut, setStatut] = useState<"verifie" | "en_attente" | "refuse">("verifie");
  const [hasFile, setHasFile] = useState(false);
  const [methodCode, setMethodCode] = useState(methods[0]?.code ?? "");
  // CH-06.7 — deux façons de prouver : déposer la pièce, ou attester qu'elle est
  // conservée ailleurs. L'art. 22 B-1 r.5 et la s. 23(15) By-Law 7.1 admettent tout
  // support, pourvu qu'une copie puisse être produite en tout temps.
  const [proofMode, setProofMode] = useState<"DOCUMENT_JOINT" | "ATTESTATION_MANUELLE">(
    "DOCUMENT_JOINT",
  );
  const [proofLocation, setProofLocation] = useState("");
  const [attested, setAttested] = useState(false);

  const manual = proofMode === "ATTESTATION_MANUELLE";
  const proofRequired = statut === "verifie" && proofRequiredByCabinet && !manual;
  const today = toIsoDay(toCalendarDayUTC(new Date()));
  const selected = methods.find((m) => m.code === methodCode) ?? methods[0];

  return (
    <form action={createIdentityVerification} className="space-y-4 max-w-xl">
      <input type="hidden" name="clientId" value={clientId} />

      <div className="rounded-safe border border-neutral-border bg-neutral-50/60 px-3 py-2 text-xs text-neutral-muted">
        {province === "QC"
          ? "Régime appliqué : Barreau du Québec, Règlement B-1, r. 5 (art. 20 à 27)."
          : "Applicable regime: Law Society of Ontario, By-Law 7.1, Part III (s. 20-24)."}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label={t("verificationDateLabel")} name="date" type="date" defaultValue={today} required />
        {/* By-Law 7.1 s. 23(12.1) : la date d'OBTENTION des renseignements est
            exigée, distincte de la date de vérification. */}
        <Input
          label={
            province === "ON"
              ? "Date d'obtention des renseignements"
              : "Date d'obtention (facultatif)"
          }
          name="recordedAt"
          type="date"
          defaultValue={today}
          required={province === "ON"}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-text-secondary mb-1">
          {t("verificationMethod")} <span className="text-status-error">*</span>
        </label>
        <select
          name="methodCode"
          value={methodCode}
          onChange={(e) => setMethodCode(e.target.value)}
          required
          className="w-full h-10 px-3 rounded-safe border border-neutral-border bg-white/90 focus:ring-2 focus:ring-primary-500/30"
        >
          {methods.map((m) => (
            <option key={m.code} value={m.code}>
              {m.labelFr}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-neutral-muted">
          {selected?.reference}
          {province === "ON" ? " — liste limitative, aucune autre méthode n'est admise." : ""}
        </p>
        {/* Libellé lisible conservé pour l'historique et les vues existantes. */}
        <input type="hidden" name="methode" value={selected?.labelFr ?? "Pièce d'identité"} />
      </div>

      {province === "ON" && (
        <div>
          <Input
            label="Source des fonds"
            name="sourceOfFunds"
            placeholder="Origine des fonds reçus, payés ou virés"
          />
          <p className="mt-1 text-xs text-neutral-muted">
            By-Law 7.1, s. 23(2) : exigée dès qu'il y a réception, paiement ou virement de fonds.
            Aucune obligation équivalente au Québec.
          </p>
        </div>
      )}

      {/* ── Mode de preuve ──────────────────────────────────────────────────
          Le règlement exige que la copie soit conservée AU DOSSIER, sur support
          papier ou électronique, pourvu qu'elle puisse être produite en tout temps
          (art. 22 B-1 r.5 · s. 23(15) By-Law 7.1). Il n'exige pas qu'elle soit dans
          SAFE. Un cabinet qui garde ses pièces au papier est donc conforme — à
          condition de pouvoir dire où elles sont. */}
      <fieldset className="rounded-safe border border-neutral-border p-3 space-y-3">
        <legend className="px-1 text-sm font-medium text-neutral-text-secondary">
          Preuve de la vérification
        </legend>

        <label className="flex items-start gap-2 text-sm">
          <input
            type="radio"
            name="proofMode"
            value="DOCUMENT_JOINT"
            checked={!manual}
            onChange={() => setProofMode("DOCUMENT_JOINT")}
            className="mt-1"
          />
          <span>
            <span className="font-medium">Joindre la pièce</span>
            <span className="block text-xs text-neutral-muted">
              La copie est déposée dans SAFE et conservée avec le dossier.
            </span>
          </span>
        </label>

        {!manual && (
          <div className="pl-6">
            <input
              type="file"
              name="preuve"
              accept="application/pdf,image/jpeg,image/png,image/webp,image/heic"
              required={proofRequired}
              onChange={(e) => setHasFile(Boolean(e.target.files?.length))}
              className="w-full rounded-safe border border-neutral-border bg-white/90 px-3 py-2 text-sm"
            />
          </div>
        )}

        <label className="flex items-start gap-2 text-sm">
          <input
            type="radio"
            name="proofMode"
            value="ATTESTATION_MANUELLE"
            checked={manual}
            onChange={() => setProofMode("ATTESTATION_MANUELLE")}
            className="mt-1"
          />
          <span>
            <span className="font-medium">Confirmer manuellement</span>
            <span className="block text-xs text-neutral-muted">
              La pièce est conservée ailleurs (dossier papier, coffre, système documentaire).
              Vous attestez l'avoir vue et indiquez où elle se trouve.
            </span>
          </span>
        </label>

        {manual && (
          <div className="pl-6 space-y-2">
            <Input
              label="Où la pièce est-elle conservée ?"
              name="proofLocation"
              value={proofLocation}
              onChange={(e) => setProofLocation(e.target.value)}
              placeholder="Ex. : dossier papier 2026-014, classeur B · coffre du bureau"
              required
            />
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={attested}
                onChange={(e) => setAttested(e.target.checked)}
                required
                className="mt-1"
              />
              <span className="text-neutral-text-secondary">
                {province === "QC"
                  ? "J'atteste avoir vérifié l'identité au moyen indiqué ci-dessus, et que la pièce utilisée est conservée à cet endroit et peut être produite en tout temps (B-1 r.5, art. 22)."
                  : "I certify that I verified the client's identity by the method indicated above, and that the document used is retained at that location and can be produced on request (By-Law 7.1, s. 23(13), (15))."}
              </span>
            </label>
            <p className="text-xs text-neutral-muted">
              L'attestation est nominative et datée. Elle apparaît telle quelle dans l'historique
              et dans la trousse d'inspection.
            </p>
          </div>
        )}

        {!proofRequiredByCabinet && (
          <p className="text-xs text-amber-700">
            Votre cabinet a levé l'exigence de pièce justificative. La vérification peut être
            enregistrée sans preuve, mais l'obligation de conserver la pièce au dossier demeure
            entière ({province === "QC" ? "B-1 r.5, art. 22" : "By-Law 7.1, s. 23(13)"}).
          </p>
        )}
      </fieldset>

      <div>
        <label className="block text-sm font-medium text-neutral-text-secondary mb-1">
          {t("verificationStatus")}
        </label>
        <select
          name="statut"
          value={statut}
          onChange={(e) => setStatut(e.target.value as typeof statut)}
          className="w-full h-10 px-3 rounded-safe border border-neutral-border bg-white/90 focus:ring-2 focus:ring-primary-500/30"
        >
          <option value="verifie">{t("statusVerified")}</option>
          <option value="en_attente">{t("statusPending")}</option>
          <option value="refuse">{t("statusRefused")}</option>
        </select>
        {proofRequired && !hasFile && (
          <p className="mt-1 text-xs text-amber-700">
            Sans pièce jointe, la vérification ne peut pas être marquée « vérifiée ». Joignez la
            pièce, confirmez manuellement en indiquant où elle est conservée, ou enregistrez la
            démarche « en attente ».
          </p>
        )}
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
