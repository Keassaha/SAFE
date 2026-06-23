"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/Card";
import { AlertTriangle, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils/format";

interface MissingDeboursAlertProps {
  dossierId: string;
  dossierType: string | null;
  sousType?: string | null;
}

interface ExpectedDebours {
  id: string;
  nom: string;
  categorie: string;
  coutDefaut: number | null;
  isGovernment: boolean;
  isRequired: boolean;
  alreadyAdded: boolean;
}

export function MissingDeboursAlert({ dossierId, dossierType, sousType }: MissingDeboursAlertProps) {
  const typeKey = sousType ? `${dossierType}_${sousType}` : dossierType;

  const { data, isLoading } = useQuery({
    queryKey: ["missing-debours", dossierId, typeKey],
    queryFn: async () => {
      const res = await fetch(
        `/api/facturation/debours-check?dossierId=${dossierId}&dossierType=${typeKey}`
      );
      if (!res.ok) return { missing: [], total: 0 };
      return res.json() as Promise<{ missing: ExpectedDebours[]; total: number }>;
    },
    enabled: !!dossierType,
  });

  if (isLoading || !data || data.missing.length === 0) return null;

  const requiredMissing = data.missing.filter((d) => d.isRequired);
  const suggestedMissing = data.missing.filter((d) => !d.isRequired);
  const totalEstimate = data.missing.reduce((sum, d) => sum + (d.coutDefaut ?? 0), 0);

  return (
    <Card className={`border ${requiredMissing.length > 0 ? "border-[#B84A3E]/30 bg-[#B84A3E]/10" : "border-si-amber/30 bg-si-amber/[0.13]"}`}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className={`w-4 h-4 ${requiredMissing.length > 0 ? "text-[#B84A3E]" : "text-si-amber-ink"}`} />
          <h4 className="text-sm font-semibold">
            {data.missing.length} typical disbursement{data.missing.length > 1 ? "s" : ""} not yet recorded
          </h4>
          {totalEstimate > 0 && (
            <span className="text-xs text-si-muted ml-auto">
              Est. {formatCurrency(totalEstimate)}
            </span>
          )}
        </div>

        <div className="space-y-2">
          {requiredMissing.length > 0 && (
            <div>
              <p className="text-xs font-medium text-[#B84A3E] mb-1">Required:</p>
              {requiredMissing.map((d) => (
                <div key={d.id} className="flex items-center justify-between py-1 text-sm">
                  <span className="text-[#B84A3E]">
                    {d.nom}
                    {d.isGovernment && (
                      <span className="ml-1 text-xs text-[#B84A3E]">(Gov. fee — no HST)</span>
                    )}
                  </span>
                  {d.coutDefaut && (
                    <span className="text-xs text-si-muted tabular-nums">
                      ~{formatCurrency(d.coutDefaut)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {suggestedMissing.length > 0 && (
            <div>
              <p className="text-xs font-medium text-si-amber-ink mb-1">Suggested:</p>
              {suggestedMissing.map((d) => (
                <div key={d.id} className="flex items-center justify-between py-1 text-sm">
                  <span className="text-si-amber-ink">
                    {d.nom}
                    {d.isGovernment && (
                      <span className="ml-1 text-xs text-si-amber-ink">(Gov. fee — no HST)</span>
                    )}
                  </span>
                  {d.coutDefaut && (
                    <span className="text-xs text-si-muted tabular-nums">
                      ~{formatCurrency(d.coutDefaut)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 pt-2 border-t border-si-line">
          <Button variant="secondary" type="button" onClick={() => {
            // Navigate to disbursements page for this dossier
            window.location.href = `/facturation/frais?dossierId=${dossierId}`;
          }}>
            <Plus className="w-3 h-3" />
            Add missing disbursements
          </Button>
          <label className="flex items-center gap-2 text-xs text-si-muted cursor-pointer">
            <input type="checkbox" className="rounded" />
            I confirm no additional disbursements apply
          </label>
        </div>
      </CardContent>
    </Card>
  );
}
