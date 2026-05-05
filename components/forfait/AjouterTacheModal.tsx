"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatCurrency } from "@/lib/utils/format";
import { Tag, FolderOpen } from "lucide-react";

interface ForfaitService {
  id: string;
  code: string;
  nom: string;
  montant: number;
  categorie: string | null;
  taxable: boolean;
}

interface DossierOption {
  id: string;
  intitule: string;
  numeroDossier: string | null;
  type?: string | null;
  statut?: string | null;
  clientId: string;
  client: {
    id: string;
    typeClient: string;
    raisonSociale: string | null;
    prenom: string | null;
    nom: string | null;
  } | null;
}

type DossierChoiceState =
  | { kind: "none" }
  | { kind: "single"; dossier: DossierOption }
  | { kind: "multiple"; dossiers: DossierOption[] };

function getDossierChoiceState(dossiers: DossierOption[], clientId: string): DossierChoiceState {
  if (!clientId) return { kind: "none" };
  const matching = dossiers.filter((d) => d.clientId === clientId);
  if (matching.length === 0) return { kind: "none" };
  if (matching.length === 1) return { kind: "single", dossier: matching[0] };
  return { kind: "multiple", dossiers: matching };
}

interface AjouterTacheModalProps {
  isOpen: boolean;
  onClose: () => void;
  dossiers: DossierOption[];
  preselectedDossierId?: string;
}

export function AjouterTacheModal({ isOpen, onClose, dossiers, preselectedDossierId }: AjouterTacheModalProps) {
  const t = useTranslations("temps.taskRegister.addModal");
  const queryClient = useQueryClient();
  const preselectedDossier = dossiers.find((d) => d.id === preselectedDossierId);
  const [clientId, setClientId] = useState(preselectedDossier?.clientId ?? "");
  const [dossierId, setDossierId] = useState(preselectedDossierId ?? "");
  const [serviceId, setServiceId] = useState("");
  const [description, setDescription] = useState("");
  const [montant, setMontant] = useState("");
  const [ajustement, setAjustement] = useState("");
  const [rabais, setRabais] = useState("");
  const [rabaisRaison, setRabaisRaison] = useState("");
  const [taxable, setTaxable] = useState(true);

  const { data: servicesData } = useQuery({
    queryKey: ["forfait-services"],
    queryFn: async () => {
      const res = await fetch("/api/forfait-services");
      if (!res.ok) return { services: [] };
      return res.json() as Promise<{ services: ForfaitService[] }>;
    },
    enabled: isOpen,
  });

  const services = servicesData?.services ?? [];

  const clients = useMemo(() => {
    const byId = new Map<string, { id: string; label: string }>();
    for (const dossier of dossiers) {
      if (!dossier.clientId) continue;
      const client = dossier.client;
      const label = formatClientLabel(client) || t("unnamedClient");
      byId.set(dossier.clientId, { id: dossier.clientId, label });
    }
    return Array.from(byId.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [dossiers, t]);

  const dossierChoice = useMemo(
    () => getDossierChoiceState(dossiers, clientId),
    [dossiers, clientId]
  );

  useEffect(() => {
    if (!isOpen) return;
    const initialDossier = dossiers.find((d) => d.id === preselectedDossierId);
    setClientId(initialDossier?.clientId ?? "");
    setDossierId(preselectedDossierId ?? "");
  }, [isOpen, preselectedDossierId, dossiers]);

  function handleClientChange(nextClientId: string) {
    setClientId(nextClientId);
    const matchingDossiers = dossiers.filter((d) => d.clientId === nextClientId);
    setDossierId(matchingDossiers.length === 1 ? matchingDossiers[0].id : "");
  }

  // Auto-fill when service selected
  const handleServiceChange = (id: string) => {
    setServiceId(id);
    const service = services.find(s => s.id === id);
    if (service) {
      setDescription(service.nom);
      setMontant(String(service.montant));
      setTaxable(service.taxable);
    }
  };

  const montantNum = parseFloat(montant) || 0;
  const ajustementNum = parseFloat(ajustement) || 0;
  const rabaisNum = parseFloat(rabais) || 0;
  const montantFinal = montantNum + ajustementNum - rabaisNum;

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/registre-taches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dossierId,
          clientId,
          forfaitServiceId: serviceId || undefined,
          description: description || undefined,
          montant: montantNum,
          ajustement: ajustementNum,
          rabais: rabaisNum,
          rabaisRaison: rabaisRaison || undefined,
          taxable,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["registre-taches"] });
      onClose();
      // Reset form
      setClientId(preselectedDossier?.clientId ?? "");
      setDossierId(preselectedDossierId ?? "");
      setServiceId(""); setDescription(""); setMontant(""); setAjustement(""); setRabais(""); setRabaisRaison("");
    },
  });

  return (
    <Modal open={isOpen} onClose={onClose} title={t("title")}>
      <div className="space-y-4">
        {/* Client selection */}
        <div>
          <label className="block text-sm font-medium text-neutral-text-secondary mb-1">
            {t("client")} <span className="text-status-error">*</span>
          </label>
          <select
            value={clientId}
            onChange={e => handleClientChange(e.target.value)}
            disabled={!!preselectedDossierId}
            className="w-full h-10 px-3 rounded-safe border border-neutral-border bg-white/90 text-sm"
          >
            <option value="">{t("selectClient")}</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>
                {client.label}
              </option>
            ))}
          </select>
        </div>

        {clientId && dossierChoice.kind === "multiple" && (
          <div>
            <label className="block text-sm font-medium text-neutral-text-secondary mb-1">
              {t("trackingFile")} <span className="text-status-error">*</span>
            </label>
            <select
              value={dossierId}
              onChange={e => setDossierId(e.target.value)}
              disabled={!!preselectedDossierId}
              className="w-full h-10 px-3 rounded-safe border border-neutral-border bg-white/90 text-sm"
            >
              <option value="">{t("selectTrackingFile")}</option>
              {dossierChoice.dossiers.map(d => (
                <option key={d.id} value={d.id}>
                  {formatDossierOptionLabel(d)}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-neutral-muted">
              {t("multipleTrackingFilesHelp")}
            </p>
          </div>
        )}

        {clientId && dossierChoice.kind === "single" && (
          <div className="flex items-start gap-2 px-3 py-2 rounded-safe bg-neutral-50 border border-neutral-border">
            <FolderOpen className="w-4 h-4 mt-0.5 text-neutral-text-secondary shrink-0" aria-hidden />
            <p className="text-sm text-neutral-text-secondary">
              {t("linkedTrackingFile", { dossier: formatDossierLabel(dossierChoice.dossier) })}
            </p>
          </div>
        )}

        {clientId && dossierChoice.kind === "none" && (
          <p className="text-sm text-status-error">
            {t("noTrackingFile")}
          </p>
        )}

        {/* Service selection (catalogue) */}
        <div>
          <label className="block text-sm font-medium text-neutral-text-secondary mb-1">
            {t("service")}
          </label>
          <select
            value={serviceId}
            onChange={e => handleServiceChange(e.target.value)}
            className="w-full h-10 px-3 rounded-safe border border-neutral-border bg-white/90 text-sm"
          >
            <option value="">{t("manualEntry")}</option>
            {services.map(s => (
              <option key={s.id} value={s.id}>
                [{s.code}] {s.nom} — {formatCurrency(s.montant)}
              </option>
            ))}
          </select>
        </div>

        {/* Description + base price */}
        <Input
          label={t("description")}
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder={t("descriptionPlaceholder")}
        />
        <Input
          label={t("basePrice")}
          type="number" step="0.01"
          value={montant}
          onChange={e => setMontant(e.target.value)}
        />

        {/* Adjustment + discount */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label={t("adjustment")}
            type="number" step="0.01"
            value={ajustement}
            onChange={e => setAjustement(e.target.value)}
            placeholder="+/- 0.00"
          />
          <Input
            label={t("discount")}
            type="number" step="0.01" min="0"
            value={rabais}
            onChange={e => setRabais(e.target.value)}
            placeholder="0.00"
          />
        </div>

        {rabaisNum > 0 && (
          <Input
            label={t("discountReason")}
            value={rabaisRaison}
            onChange={e => setRabaisRaison(e.target.value)}
            placeholder={t("discountReasonPlaceholder")}
          />
        )}

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={taxable} onChange={e => setTaxable(e.target.checked)} className="rounded" />
          {t("taxable")}
        </label>

        {/* Final amount preview */}
        <div className="p-3 rounded-safe bg-neutral-50 border flex items-center justify-between">
          <span className="text-sm text-neutral-500">{t("amountToBill")}</span>
          <div className="text-right">
            <span className="text-lg font-bold tabular-nums">{formatCurrency(montantFinal)}</span>
            {rabaisNum > 0 && (
              <span className="flex items-center gap-1 text-xs text-green-600 justify-end">
                <Tag className="w-3 h-3" /> {t("discountPreview", { amount: formatCurrency(rabaisNum) })}
              </span>
            )}
            {taxable && (
              <span className="text-xs text-neutral-400 block">{t("hst", { amount: formatCurrency(montantFinal * 0.13) })}</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="primary"
            onClick={() => createMutation.mutate()}
            disabled={!clientId || !dossierId || !description || montantFinal <= 0 || createMutation.isPending}
          >
            {createMutation.isPending ? t("adding") : t("submit")}
          </Button>
          <Button variant="secondary" onClick={onClose}>{t("cancel")}</Button>
        </div>

        {createMutation.isError && (
          <p className="text-sm text-status-error">
            {createMutation.error instanceof Error ? createMutation.error.message : t("error")}
          </p>
        )}
      </div>
    </Modal>
  );
}

function formatClientLabel(client: DossierOption["client"]) {
  if (!client) return "";
  if (client.typeClient === "personne_physique") {
    return [client.prenom, client.nom].filter(Boolean).join(" ").trim() || client.raisonSociale || "";
  }
  return client.raisonSociale || [client.prenom, client.nom].filter(Boolean).join(" ").trim();
}

function formatDossierLabel(dossier: DossierOption) {
  return `${dossier.numeroDossier ? `${dossier.numeroDossier} — ` : ""}${dossier.intitule}`;
}

function formatDossierOptionLabel(dossier: DossierOption) {
  const base = formatDossierLabel(dossier);
  const meta = [dossier.type, dossier.statut].filter((v): v is string => Boolean(v));
  return meta.length > 0 ? `${base} (${meta.join(", ")})` : base;
}
