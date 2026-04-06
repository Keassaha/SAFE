"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { routes } from "@/lib/routes";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Plus, Pencil, Link2, ArrowLeft } from "lucide-react";
import { PaiementFormModal } from "@/components/facturation/PaiementFormModal";
import { PaiementAllocationModal } from "@/components/facturation/PaiementAllocationModal";

interface FacturationPaiementsViewProps {
  cabinetId: string;
  /** Masque le lien "Retour à la vue d'ensemble" quand la vue est intégrée dans /comptabilite */
  embeddedInComptabilite?: boolean;
}

type PaymentRow = {
  id: string;
  clientId: string | null;
  datePaiement: string;
  client: { id: string; raisonSociale: string } | null;
  invoice: { id: string; numero: string } | null;
  montant: number;
  allocatedAmount: number;
  unallocatedAmount: number;
  allocationStatus: string;
};

export function FacturationPaiementsView({ cabinetId, embeddedInComptabilite }: FacturationPaiementsViewProps) {
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [allocationModalOpen, setAllocationModalOpen] = useState(false);
  const [allocationPayment, setAllocationPayment] = useState<{
    id: string;
    montant: number;
    allocatedAmount: number;
    unallocatedAmount: number;
    clientId: string | null;
  } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["facturation", "paiements"],
    queryFn: async () => {
      const res = await fetch("/api/facturation/paiements");
      if (!res.ok) throw new Error("Erreur chargement");
      return res.json();
    },
  });

  const { data: contextData } = useQuery({
    queryKey: ["facturation", "paiements", "context"],
    queryFn: async () => {
      const res = await fetch("/api/facturation/paiements/context");
      if (!res.ok) throw new Error("Erreur chargement contexte");
      return res.json();
    },
    enabled: formModalOpen || allocationModalOpen,
  });

  const payments = (data?.payments ?? []) as PaymentRow[];
  const clients = contextData?.clients ?? [];
  const invoices = contextData?.invoices ?? [];

  const openCreate = () => {
    setFormMode("create");
    setEditingPaymentId(null);
    setFormModalOpen(true);
  };

  const openEdit = (id: string) => {
    setFormMode("edit");
    setEditingPaymentId(id);
    setFormModalOpen(true);
  };

  const openAllocation = (p: PaymentRow) => {
    setAllocationPayment({
      id: p.id,
      montant: p.montant,
      allocatedAmount: p.allocatedAmount,
      unallocatedAmount: p.unallocatedAmount,
      clientId: p.client?.id ?? p.clientId ?? null,
    });
    setAllocationModalOpen(true);
  };

  const canAllocate = (p: PaymentRow) =>
    p.unallocatedAmount > 0 &&
    (p.allocationStatus === "UNALLOCATED" || p.allocationStatus === "PARTIALLY_ALLOCATED");

  return (
    <div className="space-y-6">
      <header className="rounded-safe bg-gradient-to-r from-[#051F20] via-[#0B2B26] to-[#163832] text-white p-6 shadow-lg">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            {!embeddedInComptabilite && (
              <Link
                href={routes.facturation}
                className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm mb-3"
              >
                <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden />
                Retour à la vue d&apos;ensemble
              </Link>
            )}
            <h1 className="text-2xl font-semibold tracking-tight">Paiements</h1>
            <p className="mt-1 text-white/80 text-sm">
              Liste des paiements reçus et leur allocation aux factures.
            </p>
          </div>
          <Button
            type="button"
            variant="soft"
            onClick={openCreate}
            className="shrink-0"
          >
            <Plus className="w-4 h-4 mr-2" aria-hidden />
            Nouveau paiement
          </Button>
        </div>
      </header>

      <Card>
        <CardHeader title="Paiements récents" />
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
            </div>
          ) : payments.length === 0 ? (
            <p className="text-neutral-500 py-8 text-center">Aucun paiement.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50">
                    <th className="text-left py-3 px-3 font-medium">Date</th>
                    <th className="text-left py-3 px-3 font-medium">Client</th>
                    <th className="text-left py-3 px-3 font-medium">Facture</th>
                    <th className="text-right py-3 px-3 font-medium">Montant</th>
                    <th className="text-right py-3 px-3 font-medium">Alloué</th>
                    <th className="text-right py-3 px-3 font-medium">Non alloué</th>
                    <th className="text-left py-3 px-3 font-medium">Statut</th>
                    <th className="text-right py-3 px-3 font-medium w-32">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="border-b border-neutral-100 hover:bg-neutral-50/80">
                      <td className="py-2 px-3">{formatDate(p.datePaiement)}</td>
                      <td className="py-2 px-3">{p.client?.raisonSociale ?? "—"}</td>
                      <td className="py-2 px-3">{p.invoice?.numero ?? "—"}</td>
                      <td className="py-2 px-3 text-right">{formatCurrency(p.montant)}</td>
                      <td className="py-2 px-3 text-right">{formatCurrency(p.allocatedAmount)}</td>
                      <td className="py-2 px-3 text-right">{formatCurrency(p.unallocatedAmount)}</td>
                      <td className="py-2 px-3">{p.allocationStatus}</td>
                      <td className="py-2 px-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            type="button"
                            variant="tertiary"
                            className="!px-2 !py-1.5 min-w-0"
                            onClick={() => openEdit(p.id)}
                            aria-label="Modifier le paiement"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          {canAllocate(p) && (
                            <Button
                              type="button"
                              variant="tertiary"
                              className="!px-2 !py-1.5 min-w-0"
                              onClick={() => openAllocation(p)}
                            aria-label="Allouer le paiement à une facture"
                          >
                            <Link2 className="w-4 h-4" />
                          </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <PaiementFormModal
        open={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setEditingPaymentId(null);
        }}
        mode={formMode}
        paymentId={editingPaymentId}
        clients={clients}
        invoices={invoices}
        onSuccess={() => setFormModalOpen(false)}
      />

      <PaiementAllocationModal
        open={allocationModalOpen}
        onClose={() => {
          setAllocationModalOpen(false);
          setAllocationPayment(null);
        }}
        paymentId={allocationPayment?.id ?? ""}
        paymentSummary={
          allocationPayment
            ? {
                montant: allocationPayment.montant,
                allocatedAmount: allocationPayment.allocatedAmount,
                unallocatedAmount: allocationPayment.unallocatedAmount,
                clientId: allocationPayment.clientId,
              }
            : undefined
        }
        invoices={invoices}
        onSuccess={() => setAllocationModalOpen(false)}
      />
    </div>
  );
}
