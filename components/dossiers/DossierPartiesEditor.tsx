"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { UserPlus, Users, ShieldAlert, X, Search, Plus } from "lucide-react";
import type { PartieDraft, PartieExterneRole, CoClientTypeClient } from "@/lib/dossiers/parties";

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

type CoClient =
  | { kind: "existing"; clientId: string }
  | { kind: "new"; typeClient: CoClientTypeClient; nom: string };

interface ExterneRow {
  nomAffiche: string;
  role: PartieExterneRole;
}

/**
 * Éditeur « personnes du dossier » : co-clients (fiches Client existantes OU
 * nouvelles personnes créées sur place) + parties externes (nom + rôle, jamais
 * une fiche Client). Sérialise tout dans un champ caché `partiesJson` lu par les
 * server actions. Le client principal reste géré à part.
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

  const [coClients, setCoClients] = useState<CoClient[]>(() =>
    initialParties
      .filter((p): p is Extract<PartieDraft, { nature: "co_client" }> => p.nature === "co_client")
      .map((p) => ({ kind: "existing" as const, clientId: p.clientId })),
  );
  const [query, setQuery] = useState("");
  const [externes, setExternes] = useState<ExterneRow[]>(() =>
    initialParties
      .filter(
        (p): p is Extract<PartieDraft, { nature: "partie_externe" }> =>
          p.nature === "partie_externe",
      )
      .map((p) => ({ nomAffiche: p.nomAffiche, role: p.role })),
  );

  const clientById = useMemo(() => {
    const m = new Map<string, PartiesEditorClient>();
    for (const c of clients) m.set(c.id, c);
    return m;
  }, [clients]);

  const addedExistingIds = new Set(
    coClients.filter((c): c is Extract<CoClient, { kind: "existing" }> => c.kind === "existing").map((c) => c.clientId),
  );

  const q = query.trim().toLowerCase();
  const results = q
    ? clients
        .filter(
          (c) =>
            c.id !== principalClientId &&
            !addedExistingIds.has(c.id) &&
            formatClientLabel(c).toLowerCase().includes(q),
        )
        .slice(0, 6)
    : [];

  const addExisting = (clientId: string) => {
    setCoClients((prev) => [...prev, { kind: "existing", clientId }]);
    setQuery("");
  };
  const addNew = (typeClient: CoClientTypeClient) => {
    const nom = query.trim();
    if (!nom) return;
    setCoClients((prev) => [...prev, { kind: "new", typeClient, nom }]);
    setQuery("");
  };
  const removeCoClient = (idx: number) => setCoClients((prev) => prev.filter((_, i) => i !== idx));

  const coClientLabel = (c: CoClient): string =>
    c.kind === "existing" ? formatClientLabel(clientById.get(c.clientId)) || "—" : c.nom;

  const partiesJson = JSON.stringify([
    ...coClients.map((c) =>
      c.kind === "existing"
        ? { nature: "co_client", clientId: c.clientId }
        : { nature: "co_client_new", typeClient: c.typeClient, nom: c.nom },
    ),
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

        {/* Cartes des co-clients ajoutés */}
        {coClients.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {coClients.map((c, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-2 rounded-full border border-si-line bg-si-canvas/70 pl-3 pr-1.5 py-1"
              >
                <span className="text-sm text-si-ink">{coClientLabel(c)}</span>
                <span className="text-[10px] font-medium uppercase tracking-wide text-si-muted">
                  {c.kind === "new" ? t("coClientNewBadge") : t("coClientBadge")}
                </span>
                <button
                  type="button"
                  aria-label={t("removePerson")}
                  onClick={() => removeCoClient(idx)}
                  className="shrink-0 h-6 w-6 grid place-items-center rounded-full text-si-muted hover:text-si-ink hover:bg-si-surface transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Recherche + création sur place */}
        <div className="relative">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-si-muted" />
            <input
              type="text"
              value={query}
              placeholder={t("coClientSearchPlaceholder")}
              onChange={(e) => setQuery(e.target.value)}
              className={`${inputClass} pl-9`}
            />
          </div>

          {q && (
            <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-[10px] border border-si-line bg-si-surface shadow-lg">
              {results.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => addExisting(c.id)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-si-ink hover:bg-si-canvas transition"
                >
                  <Users className="w-3.5 h-3.5 text-si-muted shrink-0" />
                  {formatClientLabel(c)}
                </button>
              ))}
              {results.length === 0 && (
                <p className="px-3 py-2 text-xs text-si-muted">{t("coClientNoMatch")}</p>
              )}
              <div className="border-t border-si-line">
                <button
                  type="button"
                  onClick={() => addNew("personne_physique")}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-si-forest hover:bg-si-canvas transition"
                >
                  <Plus className="w-3.5 h-3.5 shrink-0" />
                  {t("createAsIndividual", { name: query.trim() })}
                </button>
                <button
                  type="button"
                  onClick={() => addNew("personne_morale")}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-si-forest hover:bg-si-canvas transition"
                >
                  <Plus className="w-3.5 h-3.5 shrink-0" />
                  {t("createAsCompany", { name: query.trim() })}
                </button>
              </div>
            </div>
          )}
        </div>
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
