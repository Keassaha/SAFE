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
import { Loader2, Plus, Pencil, Link2, ArrowLeft, AlertCircle, FileText, Coins, UploadCloud } from "lucide-react";
import { fadeInUp, useSafeMotion } from "@/lib/motion";
import { Modal } from "@/components/ui/Modal";
import { PaiementFormModal } from "@/components/facturation/PaiementFormModal";
import { ImportPreuveModal } from "@/components/facturation/ImportPreuveModal";
import { PaiementAllocationModal } from "@/components/facturation/PaiementAllocationModal";
import type { ClientCreditBalance } from "@/lib/services/billing/overpayment-service";

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
  const [importModalOpen, setImportModalOpen] = useState(false);
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
  const [refundClient, setRefundClient] = useState<ClientCreditBalance | null>(null);
  const [refundNote, setRefundNote] = useState("");
  const [refundSubmitting, setRefundSubmitting] = useState(false);
  const [refundError, setRefundError] = useState<string | null>(null);

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
    enabled: formModalOpen || allocationModalOpen || importModalOpen,
  });

  const { data: surData, refetch: refetchSurpaiements } = useQuery({
    queryKey: ["facturation", "surpaiements"],
    queryFn: async () => {
      const res = await fetch("/api/facturation/surpaiements");
      if (!res.ok) throw new Error("Erreur chargement surpaiements");
      return res.json();
    },
  });
  const creditClients = (surData?.clients ?? []) as ClientCreditBalance[];

  const payments = (data?.payments ?? []) as PaymentRow[];
  // Paiements orphelins : argent reçu mais non encore alloué à une facture.
  const unallocatedPayments = payments.filter(
    (p) => p.unallocatedAmount > 0 && p.allocationStatus !== "REVERSED",
  );
  const unallocatedTotal = unallocatedPayments.reduce((s, p) => s + p.unallocatedAmount, 0);
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

  async function handleRequestRefund() {
    if (!refundClient) return;
    setRefundSubmitting(true);
    setRefundError(null);
    const res = await fetch("/api/facturation/surpaiements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: refundClient.clientId, note: refundNote || undefined }),
    });
    setRefundSubmitting(false);
    if (res.ok) {
      setRefundClient(null);
      setRefundNote("");
      await refetchSurpaiements();
    } else {
      setRefundError(t("refundError"));
    }
  }

  return (
    <div className="space-y-6">
      {!embeddedInComptabilite && (
        <Link
          href={routes.facturation}
          className="inline-flex items-center gap-2 text-si-muted hover:text-si-ink text-sm"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden />
          {t("backToOverview")}
        </Link>
      )}
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() => setImportModalOpen(true)}
          className="shrink-0"
        >
          <UploadCloud className="w-4 h-4 mr-2" aria-hidden />
          {t("importProof")}
        </Button>
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

      {unallocatedPayments.length > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-si-amber/30 bg-si-amber/[0.08] p-4">
          <AlertCircle className="h-5 w-5 shrink-0 text-si-amber-ink mt-0.5" aria-hidden />
          <div>
            <p className="text-sm font-medium text-si-amber-ink">{t("unallocatedAlertTitle")}</p>
            <p className="mt-0.5 text-xs text-si-muted">
              {t("unallocatedAlertSub", {
                count: unallocatedPayments.length,
                amount: formatCurrency(unallocatedTotal),
              })}
            </p>
          </div>
        </div>
      )}

      {creditClients.length > 0 && (
        <Card>
          <CardHeader title={t("overpaymentSectionTitle")} />
          <CardContent>
            <p className="mb-3 text-sm text-si-muted">{t("overpaymentSectionSub")}</p>
            <ul className="divide-y divide-si-line">
              {creditClients.map((c) => (
                <li key={c.clientId} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-si-amber/[0.13] text-si-amber-ink">
                      <Coins className="h-4 w-4" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-si-ink">{c.label}</p>
                      <p className="text-xs text-si-muted">
                        {t("creditBalanceLabel")} :{" "}
                        <span className="font-mono tabular-nums text-si-amber-ink">
                          {formatCurrency(c.creditBalance)}
                        </span>
                      </p>
                    </div>
                  </div>
                  {c.refundRequested ? (
                    <span className="shrink-0 rounded-full bg-si-amber/[0.13] px-2.5 py-1 text-xs font-medium text-si-amber-ink">
                      {t("refundRequestedBadge")}
                    </span>
                  ) : (
                    <Button
                      type="button"
                      variant="tertiary"
                      className="shrink-0"
                      onClick={() => {
                        setRefundError(null);
                        setRefundNote("");
                        setRefundClient(c);
                      }}
                    >
                      {t("requestRefund")}
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader title={t("recentPayments")} />
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-si-muted/50" />
            </div>
          ) : payments.length === 0 ? (
            <p className="text-si-muted py-8 text-center">{t("noPayments")}</p>
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
                  <tr className="border-b border-si-line bg-si-canvas">
                    <th className="text-left py-3 px-3 text-[11px] font-medium uppercase tracking-[0.06em] text-si-muted">{t("date")}</th>
                    <th className="text-left py-3 px-3 text-[11px] font-medium uppercase tracking-[0.06em] text-si-muted">{t("client")}</th>
                    <th className="text-left py-3 px-3 text-[11px] font-medium uppercase tracking-[0.06em] text-si-muted">{t("invoice")}</th>
                    <th className="text-right py-3 px-3 text-[11px] font-medium uppercase tracking-[0.06em] text-si-muted">{t("amount")}</th>
                    <th className="text-right py-3 px-3 text-[11px] font-medium uppercase tracking-[0.06em] text-si-muted">{t("allocated")}</th>
                    <th className="text-right py-3 px-3 text-[11px] font-medium uppercase tracking-[0.06em] text-si-muted">{t("unallocated")}</th>
                    <th className="text-left py-3 px-3 text-[11px] font-medium uppercase tracking-[0.06em] text-si-muted">{t("status")}</th>
                    <th className="text-right py-3 px-3 text-[11px] font-medium uppercase tracking-[0.06em] text-si-muted w-32">{t("actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="border-b border-si-line hover:bg-si-canvas/60 transition-colors">
                      <td className="py-2.5 px-3 text-[13px] text-si-ink">{formatDate(p.datePaiement)}</td>
	                      <td className="py-2.5 px-3 text-[13px] text-si-ink">{clientLabel(p.client)}</td>
                      <td className="py-2.5 px-3 text-[13px] font-mono text-si-ink">{p.invoice?.numero ?? "—"}</td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[13px] text-si-ink">{formatCurrency(p.montant)}</td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[13px] text-si-verified">{formatCurrency(p.allocatedAmount)}</td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[13px] text-si-ink">{formatCurrency(p.unallocatedAmount)}</td>
                      <td className="py-2.5 px-3">
                        <StatusBadge
                          label={t(ALLOCATION_STATUS_LABEL_KEYS[p.allocationStatus as AllocationStatusKey])}
                          variant={ALLOCATION_STATUS_VARIANTS[p.allocationStatus as AllocationStatusKey]}
                        />
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex justify-end gap-1">
                          <a
                            href={`/api/documents/payment-receipt/${p.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center rounded-lg p-1.5 text-si-muted transition-colors hover:bg-si-canvas hover:text-si-forest"
                            aria-label={t("viewReceipt")}
                            title={t("viewReceipt")}
                          >
                            <FileText className="w-4 h-4" aria-hidden />
                          </a>
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

      <ImportPreuveModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        clients={clients}
        invoices={invoices}
        onSuccess={() => setImportModalOpen(false)}
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

      <Modal
        open={Boolean(refundClient)}
        onClose={() => setRefundClient(null)}
        title={t("refundModalTitle")}
      >
        <div className="space-y-4">
          <p className="text-sm text-si-muted">{t("refundModalIntro")}</p>
          {refundClient && (
            <p className="text-sm text-si-ink">
              {refundClient.label} :{" "}
              <span className="font-mono tabular-nums text-si-amber-ink">
                {formatCurrency(refundClient.creditBalance)}
              </span>
            </p>
          )}
          <div>
            <label className="mb-1 block text-sm text-si-ink">{t("refundNoteLabel")}</label>
            <textarea
              value={refundNote}
              onChange={(e) => setRefundNote(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-si-line bg-si-surface px-3 py-2 text-sm focus:border-si-verified focus:ring-2 focus:ring-si-verified/25"
            />
          </div>
          <p className="text-xs text-si-muted">{t("refundManualNotice")}</p>
          {refundError && <p className="text-sm text-[var(--safe-status-error)]">{refundError}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="tertiary" onClick={() => setRefundClient(null)}>
              {t("refundCancel")}
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={refundSubmitting}
              onClick={handleRequestRefund}
            >
              {refundSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
              {t("refundConfirm")}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
