"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils/format";
import { useQuery } from "@tanstack/react-query";
import { Wallet, TrendingUp, TrendingDown, FolderOpen, AlertTriangle } from "lucide-react";

interface SoldeCardsProps {
  cabinetId: string | null;
  seuilBas?: number;
}

export function SoldeCards({ cabinetId, seuilBas = 500 }: SoldeCardsProps) {
  const tf = useTranslations("fideicommis");
  const { data, isLoading } = useQuery({
    queryKey: ["fideicommis", "summary"],
    queryFn: async () => {
      const res = await fetch("/api/fideicommis/summary");
      if (!res.ok) throw new Error("Erreur chargement");
      return res.json() as Promise<{
        soldeTotal: number;
        depotsMois: number;
        retraitsMois: number;
        nbDossiersAvecProvision: number;
      }>;
    },
    enabled: Boolean(cabinetId),
  });

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="h-10 bg-neutral-100 animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const alertesSeuilBas = data.soldeTotal < seuilBas && data.soldeTotal > 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <div className="p-2 rounded-safe-sm bg-primary-100 text-primary-700">
            <Wallet className="w-5 h-5" aria-hidden />
          </div>
          <div>
            <p className="text-sm text-neutral-muted font-medium">{tf("totalTrustBalance")}</p>
            <p className="text-xl font-semibold text-right tabular-nums">
              {formatCurrency(data.soldeTotal)}
            </p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <div className="p-2 rounded-safe-sm bg-green-100 text-green-700">
            <TrendingUp className="w-5 h-5" aria-hidden />
          </div>
          <div>
            <p className="text-sm text-neutral-muted font-medium">{tf("monthlyDeposits")}</p>
            <p className="text-xl font-semibold text-right tabular-nums text-green-700">
              {formatCurrency(data.depotsMois)}
            </p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <div className="p-2 rounded-safe-sm bg-amber-100 text-amber-700">
            <TrendingDown className="w-5 h-5" aria-hidden />
          </div>
          <div>
            <p className="text-sm text-neutral-muted font-medium">{tf("monthlyWithdrawals")}</p>
            <p className="text-xl font-semibold text-right tabular-nums text-amber-700">
              {formatCurrency(data.retraitsMois)}
            </p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <div className="p-2 rounded-safe-sm bg-neutral-100 text-neutral-600">
            <FolderOpen className="w-5 h-5" aria-hidden />
          </div>
          <div>
            <p className="text-sm text-neutral-muted font-medium">{tf("mattersWithProvision")}</p>
            <p className="text-xl font-semibold text-right tabular-nums">
              {data.nbDossiersAvecProvision}
            </p>
          </div>
        </CardContent>
      </Card>
      {alertesSeuilBas && (
        <Card className="lg:col-span-4 border-amber-200 bg-amber-50/50">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" aria-hidden />
            <p className="text-sm text-amber-800">
              {tf("lowBalanceAlert", { amount: formatCurrency(seuilBas) })}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
