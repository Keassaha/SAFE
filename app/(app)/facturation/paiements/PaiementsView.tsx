"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { routes } from "@/lib/routes";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Plus, Pencil, Link2, ArrowLeft } from "lucide-react";
import { fadeInUp, useSafeMotion } from "@/lib/motion";
import { PaiementFormModal } from "@/components/facturation/PaiementFormModal";
import { PaiementAllocationModal } from "@/components/facturation/PaiementAllocationModal";

type AllocationStatusKey = "UNALLOCATED" | "PARTIALLY_ALLOCATED" | "ALLOCATED" | "REVERSED";

const ALLOCATION_STATUS_LABEL_KEYS: Record<AllocationStatusKey, string> = {
  UNALLOCATED: "allocUnallocated",
  PARTIALLY_ALLOCATED: "allocPartiallyAllocated",
  ALLOCATED: "allocAllocated",
  REVERSED: "allocReversed",
};

const ALLOCATION_STATUS_VARIANTS: Record<AllocationStatusKey, "success" | "warning" | "neutral" | "error"> = {
  ALLOCATED: "success",
  PARTIALLY_ALLOCATED: "warning",
  UNALLOCATED: "neutral",
  REVERSED: "error",
};

interface FacturationPaiementsViewProps {
  cabinetId: string;
  /** Masque le lien "Retour à la vue d'ensemble" quand la vue est intégrée dans /comptabilite */
  embeddedInComptabilite?: boolean;
}

type PaymentRow = {
  id: string;
  clientId: string | null;
  datePaiement: string;
	  client: { id: string; raisonSociale: string | null; prenom?: string | null; nom?: string | null } | null;
  invoice: { id: string; numero: string } | null;
  montant: number;
  allocatedAmount: number;
  unallocatedAmount: number;
  allocationStatus: string;
};

export function FacturationPaiementsView({ cabinetId, embeddedInComptabilite }: FacturationPaiementsViewProps) {
  const t = useTranslations("billingUi");
  const { reduceMotion } = useSafeMotion();
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

	  const clientLabel = (client: PaymentRow["client"]) => {
	    if (!client) return "—";
	    const company = client.raisonSociale?.trim();
	    if (company) return company;
	    const person = [client.prenom, client.nom].filter(Boolean).join(" ").trim();
	    return person || "Client sans nom";
	  };

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
      {!embeddedInComptabilite && (
        <Link
          href={routes.facturation}
          className="inline-flex items-center gap-2 text-[var(--safe-text-secondary)] hover:text-[var(--safe-text-title)] text-sm"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden />
          {t("backToOverview")}
        </Link>
      )}
      <div className="flex justify-end">
        <Button
          type="button"
          variant="primary"
          onClick={openCreate}
          className="shrink-0"
        >
          <Plus className="w-4 h-4 mr-2" aria-hidden />
          {t("newPayment")}
        </Button>
      </div>

      <Card>
        <CardHeader title={t("recentPayments")} />
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
            </div>
          ) : payments.length === 0 ? (
            <p className="text-neutral-500 py-8 text-center">{t("noPayments")}</p>
          ) : (
            <motion.div
              className="overflow-x-auto"
              variants={reduceMotion ? undefined : fadeInUp}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            >
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left py-3 px-3 text-[11px] font-medium uppercase tracking-[0.06em] text-slate-500">{t("date")}</th>
                    <th className="text-left py-3 px-3 text-[11px] font-medium uppercase tracking-[0.06em] text-slate-500">{t("client")}</th>
                    <th className="text-left py-3 px-3 text-[11px] font-medium uppercase tracking-[0.06em] text-slate-500">{t("invoice")}</th>
                    <th className="text-right py-3 px-3 text-[11px] font-medium uppercase tracking-[0.06em] text-slate-500">{t("amount")}</th>
                    <th className="text-right py-3 px-3 text-[11px] font-medium uppercase tracking-[0.06em] text-slate-500">{t("allocated")}</th>
                    <th className="text-right py-3 px-3 text-[11px] font-medium uppercase tracking-[0.06em] text-slate-500">{t("unallocated")}</th>
                    <th className="text-left py-3 px-3 text-[11px] font-medium uppercase tracking-[0.06em] text-slate-500">{t("status")}</th>
                    <th className="text-right py-3 px-3 text-[11px] font-medium uppercase tracking-[0.06em] text-slate-500 w-32">{t("actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="border-b border-neutral-100 hover:bg-neutral-50/60 transition-colors">
                      <td className="py-2.5 px-3 text-[13px] text-slate-700">{formatDate(p.datePaiement)}</td>
	                      <td className="py-2.5 px-3 text-[13px] text-slate-700">{clientLabel(p.client)}</td>
                      <td className="py-2.5 px-3 text-[13px] font-mono text-slate-700">{p.invoice?.numero ?? "—"}</td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[13px] text-slate-700">{formatCurrency(p.montant)}</td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[13px] text-forest-700">{formatCurrency(p.allocatedAmount)}</td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[13px] text-slate-700">{formatCurrency(p.unallocatedAmount)}</td>
                      <td className="py-2.5 px-3">
                        <StatusBadge
                          label={t(ALLOCATION_STATUS_LABEL_KEYS[p.allocationStatus as AllocationStatusKey])}
                          variant={ALLOCATION_STATUS_VARIANTS[p.allocationStatus as AllocationStatusKey]}
                        />
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            type="button"
                            variant="tertiary"
                            className="!px-2 !py-1.5 min-w-0"
                            onClick={() => openEdit(p.id)}
                            aria-label={t("editPayment")}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          {canAllocate(p) && (
                            <Button
                              type="button"
                              variant="tertiary"
                              className="!px-2 !py-1.5 min-w-0"
                              onClick={() => openAllocation(p)}
                            aria-label={t("allocatePaymentToInvoice")}
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
            </motion.div>
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
