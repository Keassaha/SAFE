"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatCurrency } from "@/lib/utils/format";
import { Tag } from "lucide-react";

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
  clientId: string;
}

interface AjouterTacheModalProps {
  isOpen: boolean;
  onClose: () => void;
  dossiers: DossierOption[];
  preselectedDossierId?: string;
}

export function AjouterTacheModal({ isOpen, onClose, dossiers, preselectedDossierId }: AjouterTacheModalProps) {
  const queryClient = useQueryClient();
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
      setServiceId(""); setDescription(""); setMontant(""); setAjustement(""); setRabais(""); setRabaisRaison("");
    },
  });

  return (
    <Modal open={isOpen} onClose={onClose} title="Add Task to Matter">
      <div className="space-y-4">
        {/* Dossier selection */}
        <div>
          <label className="block text-sm font-medium text-neutral-text-secondary mb-1">
            Matter <span className="text-status-error">*</span>
          </label>
          <select
            value={dossierId}
            onChange={e => setDossierId(e.target.value)}
            disabled={!!preselectedDossierId}
            className="w-full h-10 px-3 rounded-safe border border-neutral-border bg-white/90 text-sm"
          >
            <option value="">Select matter...</option>
            {dossiers.map(d => (
              <option key={d.id} value={d.id}>
                {d.numeroDossier ? `${d.numeroDossier} — ` : ""}{d.intitule}
              </option>
            ))}
          </select>
        </div>

        {/* Service selection (catalogue) */}
        <div>
          <label className="block text-sm font-medium text-neutral-text-secondary mb-1">
            Service (from fee schedule)
          </label>
          <select
            value={serviceId}
            onChange={e => handleServiceChange(e.target.value)}
            className="w-full h-10 px-3 rounded-safe border border-neutral-border bg-white/90 text-sm"
          >
            <option value="">Manual entry (no template)</option>
            {services.map(s => (
              <option key={s.id} value={s.id}>
                [{s.code}] {s.nom} — {formatCurrency(s.montant)}
              </option>
            ))}
          </select>
        </div>

        {/* Description + base price */}
        <Input
          label="Description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Service description"
        />
        <Input
          label="Base Price ($)"
          type="number" step="0.01"
          value={montant}
          onChange={e => setMontant(e.target.value)}
        />

        {/* Adjustment + discount */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Price Adjustment ($)"
            type="number" step="0.01"
            value={ajustement}
            onChange={e => setAjustement(e.target.value)}
            placeholder="+/- 0.00"
          />
          <Input
            label="Discount ($)"
            type="number" step="0.01" min="0"
            value={rabais}
            onChange={e => setRabais(e.target.value)}
            placeholder="0.00"
          />
        </div>

        {rabaisNum > 0 && (
          <Input
            label="Discount Reason (shown on invoice)"
            value={rabaisRaison}
            onChange={e => setRabaisRaison(e.target.value)}
            placeholder="e.g. Returning client, referral, multi-matter"
          />
        )}

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={taxable} onChange={e => setTaxable(e.target.checked)} className="rounded" />
          Taxable (HST 13%)
        </label>

        {/* Final amount preview */}
        <div className="p-3 rounded-safe bg-neutral-50 border flex items-center justify-between">
          <span className="text-sm text-neutral-500">Amount to bill:</span>
          <div className="text-right">
            <span className="text-lg font-bold tabular-nums">{formatCurrency(montantFinal)}</span>
            {rabaisNum > 0 && (
              <span className="flex items-center gap-1 text-xs text-green-600 justify-end">
                <Tag className="w-3 h-3" /> Discount: -{formatCurrency(rabaisNum)}
              </span>
            )}
            {taxable && (
              <span className="text-xs text-neutral-400 block">+ HST {formatCurrency(montantFinal * 0.13)}</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="primary"
            onClick={() => createMutation.mutate()}
            disabled={!dossierId || !description || montantFinal <= 0 || createMutation.isPending}
          >
            {createMutation.isPending ? "Adding..." : "Add Task"}
          </Button>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
        </div>

        {createMutation.isError && (
          <p className="text-sm text-status-error">
            {createMutation.error instanceof Error ? createMutation.error.message : "Error"}
          </p>
        )}
      </div>
    </Modal>
  );
}
