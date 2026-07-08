"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { UserPlus, Users, ShieldAlert, X } from "lucide-react";
import type { PartieDraft, PartieExterneRole } from "@/lib/dossiers/parties";

export interface PartiesEditorClient {
  id: string;
  typeClient: string;
  raisonSociale: string | null;
  prenom: string | null;
  nom: string | null;
}

function formatClientLabel(client?: PartiesEditorClient): string {
  if (!client) return "";
  if (client.typeClient === "personne_physique") {
    return (
      [client.prenom, client.nom].filter(Boolean).join(" ").trim() ||
      client.raisonSociale ||
      ""
    );
  }
  return client.raisonSociale || [client.prenom, client.nom].filter(Boolean).join(" ").trim();
}

interface ExterneRow {
  nomAffiche: string;
  role: PartieExterneRole;
}

/**
 * Éditeur « personnes du dossier » : co-clients (fiches Client) + parties externes
 * (nom + rôle, jamais une fiche Client). Sérialise tout dans un champ caché
 * `partiesJson` lu par les server actions. Le client principal reste géré à part.
 * Doctrine : docs/product/SPEC_MULTI_CLIENTS_PARTIES_DOSSIER.md
 */
export function DossierPartiesEditor({
  clients,
  principalClientId,
  initialParties = [],
}: {
  clients: PartiesEditorClient[];
  principalClientId: string;
  initialParties?: PartieDraft[];
}) {
  const t = useTranslations("matters");

  const [coClientIds, setCoClientIds] = useState<string[]>(() =>
    initialParties
      .filter((p): p is Extract<PartieDraft, { nature: "co_client" }> => p.nature === "co_client")
      .map((p) => p.clientId),
  );
  const [externes, setExternes] = useState<ExterneRow[]>(() =>
    initialParties
      .filter(
        (p): p is Extract<PartieDraft, { nature: "partie_externe" }> =>
          p.nature === "partie_externe",
      )
      .map((p) => ({ nomAffiche: p.nomAffiche, role: p.role })),
  );

  // Options de co-client : on exclut le principal et ceux déjà ajoutés.
  const availableForRow = (currentValue: string) =>
    clients.filter(
      (c) =>
        c.id !== principalClientId &&
        (c.id === currentValue || !coClientIds.includes(c.id)),
    );

  const partiesJson = JSON.stringify([
    ...coClientIds
      .filter((id) => id && id !== principalClientId)
      .map((clientId) => ({ nature: "co_client", clientId })),
    ...externes
      .filter((e) => e.nomAffiche.trim())
      .map((e) => ({ nature: "partie_externe", nomAffiche: e.nomAffiche.trim(), role: e.role })),
  ]);

  const inputClass =
    "w-full h-10 px-3 rounded-[10px] border border-si-line bg-si-surface font-sans text-si-ink outline-none focus:border-si-verified focus:ring-2 focus:ring-si-verified/25 transition";

  return (
    <div className="space-y-6">
      <input type="hidden" name="partiesJson" value={partiesJson} readOnly />

      {/* Co-clients */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-si-forest" />
          <span className="text-sm font-medium text-si-ink">{t("coClients")}</span>
        </div>
        <p className="text-xs text-si-muted">{t("coClientsHint")}</p>

        <div className="space-y-2">
          {coClientIds.map((value, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <select
                value={value}
                onChange={(e) => {
                  const next = [...coClientIds];
                  next[idx] = e.target.value;
                  setCoClientIds(next);
                }}
                className={inputClass}
              >
                <option value="">{t("selectClient")}</option>
                {availableForRow(value).map((c) => (
                  <option key={c.id} value={c.id}>
                    {formatClientLabel(c)}
                  </option>
                ))}
              </select>
              <button
                type="button"
                aria-label={t("removePerson")}
                onClick={() => setCoClientIds(coClientIds.filter((_, i) => i !== idx))}
                className="shrink-0 h-10 w-10 grid place-items-center rounded-[10px] border border-si-line text-si-muted hover:text-si-ink hover:bg-si-canvas transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setCoClientIds([...coClientIds, ""])}
          className="inline-flex items-center gap-2 text-sm font-medium text-si-forest hover:underline"
        >
          <UserPlus className="w-4 h-4" />
          {t("addCoClient")}
        </button>
      </div>

      {/* Autres parties (adverse / tiers) */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-si-muted" />
          <span className="text-sm font-medium text-si-ink">{t("otherParties")}</span>
        </div>
        <p className="text-xs text-si-muted">{t("otherPartiesHint")}</p>

        <div className="rounded-[10px] border border-si-line bg-si-amber/[0.13] px-3 py-2 flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-si-amber-ink shrink-0 mt-0.5" />
          <p className="text-xs text-si-amber-ink">{t("adversePartyWarning")}</p>
        </div>

        <div className="space-y-2">
          {externes.map((row, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                type="text"
                value={row.nomAffiche}
                placeholder={t("partyNamePlaceholder")}
                onChange={(e) => {
                  const next = [...externes];
                  next[idx] = { ...next[idx], nomAffiche: e.target.value };
                  setExternes(next);
                }}
                className={inputClass}
              />
              <select
                value={row.role}
                onChange={(e) => {
                  const next = [...externes];
                  next[idx] = { ...next[idx], role: e.target.value as PartieExterneRole };
                  setExternes(next);
                }}
                className={`${inputClass} max-w-[180px]`}
              >
                <option value="partie_adverse">{t("roleAdverse")}</option>
                <option value="tiers">{t("roleThird")}</option>
              </select>
              <button
                type="button"
                aria-label={t("removePerson")}
                onClick={() => setExternes(externes.filter((_, i) => i !== idx))}
                className="shrink-0 h-10 w-10 grid place-items-center rounded-[10px] border border-si-line text-si-muted hover:text-si-ink hover:bg-si-canvas transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setExternes([...externes, { nomAffiche: "", role: "partie_adverse" }])}
          className="inline-flex items-center gap-2 text-sm font-medium text-si-forest hover:underline"
        >
          <UserPlus className="w-4 h-4" />
          {t("addParty")}
        </button>
      </div>
    </div>
  );
}
