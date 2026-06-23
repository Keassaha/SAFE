"use client";

import { useState } from "react";
import type { TimeEntry, Expense } from "@prisma/client";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils/format";
import { useTranslations } from "next-intl";

type ClientSelect = { id: string; raisonSociale: string | null } | null;
type DossierSelect = { id: string; intitule: string } | null;

interface HonorairesViewProps {
  cabinetId: string;
  timeEntries: (TimeEntry & {
    client: ClientSelect;
    dossier: DossierSelect;
  })[];
  expenses: (Expense & {
    client: ClientSelect;
  })[];
}

interface ClientAccumulation {
  clientId: string;
  clientName: string;
  totalAmount: number;
  hourCount: number;
  expenseCount: number;
  threshold?: number;
}

const DEFAULT_THRESHOLD = 100; // $100 par défaut

export function HonorairesView({
  cabinetId,
  timeEntries,
  expenses,
}: HonorairesViewProps) {
  const router = useRouter();
  const t = useTranslations("facturation");
  const tb = useTranslations("billingUi");
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [clientThresholds, setClientThresholds] = useState<Record<string, number>>({});

  // Group by client
  const clientMap = new Map<string, ClientAccumulation>();

  timeEntries.forEach((entry) => {
    if (!entry.clientId) return;
    const clientId = entry.clientId;
    const existing = clientMap.get(clientId) || {
      clientId,
      clientName: entry.client?.raisonSociale || "Sans client",
      totalAmount: 0,
      hourCount: 0,
      expenseCount: 0,
    };
    existing.totalAmount += entry.feeAmount || entry.montant || 0;
    existing.hourCount++;
    clientMap.set(clientId, existing);
  });

  expenses.forEach((expense) => {
    if (!expense.clientId) return;
    const clientId = expense.clientId;
    const existing = clientMap.get(clientId) || {
      clientId,
      clientName: expense.client?.raisonSociale || "Sans client",
      totalAmount: 0,
      hourCount: 0,
      expenseCount: 0,
    };
    existing.totalAmount += expense.amount || 0;
    existing.expenseCount++;
    clientMap.set(clientId, existing);
  });

  const clients = Array.from(clientMap.values());

  const handleBill = async (clientId: string) => {
    setIsLoading(clientId);
    try {
      const response = await fetch(`/api/facturation/factures/creer-depuis-temps`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId }),
      });
      if (response.ok) {
        router.push("/facturation/suivi");
        router.refresh();
      }
    } catch (error) {
      console.error("Erreur création facture:", error);
    } finally {
      setIsLoading(null);
    }
  };

  const getThreshold = (clientId: string) => clientThresholds[clientId] || DEFAULT_THRESHOLD;
  const isAboveThreshold = (amount: number, clientId: string) => amount >= getThreshold(clientId);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title={t("honorairesLabel")}
          action={<span className="text-sm text-si-muted">{tb("clientsWithFeesToBill", { count: clients.length })}</span>}
        />
        <CardContent>
          {clients.length === 0 ? (
            <p className="text-sm text-si-muted py-8 text-center">
              {t("noBillableFees")}
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {clients.map((client) => {
                const threshold = getThreshold(client.clientId);
                const aboveThreshold = isAboveThreshold(client.totalAmount, client.clientId);

                return (
                  <div
                    key={client.clientId}
                    className={`rounded-lg border p-4 space-y-3 ${
                      aboveThreshold
                        ? "bg-orange-50 border-orange-200"
                        : "bg-si-surface border-si-line"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-si-ink truncate">
                          {client.clientName}
                        </h4>
                        <p className="text-xs text-si-muted">
                          {tb("timesheetsAndDisbursements", { hours: client.hourCount, disbursements: client.expenseCount })}
                        </p>
                      </div>
                      {aboveThreshold && (
                        <span className="text-xs px-2 py-1 rounded bg-orange-100 text-orange-700 font-medium whitespace-nowrap">
                          {tb("thresholdExceeded")}
                        </span>
                      )}
                    </div>

                    <div className="space-y-2 py-2 border-t border-b border-current border-opacity-10">
                      <div className="flex justify-between items-baseline text-sm">
                        <span className="text-si-muted">{tb("accumulatedAmount")}</span>
                        <span className="font-semibold text-si-ink">
                          {formatCurrency(client.totalAmount)}
                        </span>
                      </div>
                      <div className="flex justify-between items-baseline text-xs text-si-muted">
                        <span>{tb("threshold")}</span>
                        <span>{formatCurrency(threshold)}</span>
                      </div>
                    </div>

                    <Button
                      onClick={() => handleBill(client.clientId)}
                      disabled={isLoading === client.clientId || !aboveThreshold}
                      className="w-full"
                    >
                      {isLoading === client.clientId ? tb("creatingShort") : tb("bill")}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="text-xs text-si-muted">
        <p>
          {tb("defaultThreshold")} <strong>{formatCurrency(DEFAULT_THRESHOLD)}</strong>
        </p>
        <p className="mt-1">
          {tb("billButtonsHint")}
        </p>
      </div>
    </div>
  );
}
