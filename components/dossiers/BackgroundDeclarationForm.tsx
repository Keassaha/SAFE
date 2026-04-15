"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { AlertTriangle, FileText, CheckCircle } from "lucide-react";

interface BackgroundData {
  priorRefusal: boolean;
  priorRefusalDetails: string | null;
  overstay: boolean;
  overstayDetails: string | null;
  criminalRecord: boolean;
  criminalDetails: string | null;
  deportation: boolean;
  deportationDetails: string | null;
  misrepresentation: boolean;
  misrepresentationDetails: string | null;
  clientSignedAt: string | null;
  completedAt: string | null;
}

interface BackgroundDeclarationFormProps {
  dossierId: string;
}

const FIELDS: { key: keyof BackgroundData; label: string; detailKey: keyof BackgroundData; danger?: boolean }[] = [
  { key: "priorRefusal", label: "Prior visa/immigration refusal", detailKey: "priorRefusalDetails" },
  { key: "overstay", label: "Overstay in any country", detailKey: "overstayDetails" },
  { key: "criminalRecord", label: "Criminal record or charges", detailKey: "criminalDetails" },
  { key: "deportation", label: "Previous deportation or removal order", detailKey: "deportationDetails" },
  { key: "misrepresentation", label: "Prior misrepresentation finding (Art. 40 LIPR)", detailKey: "misrepresentationDetails", danger: true },
];

export function BackgroundDeclarationForm({ dossierId }: BackgroundDeclarationFormProps) {
  const queryClient = useQueryClient();

  const { data: existing } = useQuery({
    queryKey: ["immigration-background", dossierId],
    queryFn: async () => {
      const res = await fetch(`/api/dossiers/immigration?dossierId=${dossierId}`);
      if (!res.ok) return null;
      const summary = await res.json();
      return summary.background as BackgroundData | null;
    },
  });

  const [form, setForm] = useState<Record<string, boolean | string>>({});

  const getValue = (key: string): boolean => {
    if (key in form) return form[key] as boolean;
    if (existing) return (existing as unknown as Record<string, unknown>)[key] as boolean;
    return false;
  };

  const getDetail = (key: string): string => {
    if (key in form) return form[key] as string;
    if (existing) return ((existing as unknown as Record<string, unknown>)[key] as string) ?? "";
    return "";
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const background: Record<string, unknown> = {};
      for (const f of FIELDS) {
        background[f.key] = getValue(f.key);
        background[f.detailKey] = getDetail(f.detailKey) || null;
      }
      background.clientSignedAt = new Date().toISOString();

      const res = await fetch("/api/dossiers/immigration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save_background", dossierId, background }),
      });
      if (!res.ok) throw new Error("Error saving declaration");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["immigration-background", dossierId] });
      queryClient.invalidateQueries({ queryKey: ["immigration", dossierId] });
    },
  });

  const isCompleted = !!existing?.completedAt;
  const hasAnyRisk = FIELDS.some((f) => getValue(f.key));

  return (
    <Card className={`border ${existing?.misrepresentation ? "border-red-300 bg-red-50/30" : hasAnyRisk ? "border-amber-200 bg-amber-50/30" : ""}`}>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <h4 className="text-sm font-semibold">Background Declaration (D7)</h4>
          </div>
          {isCompleted && (
            <StatusBadge
              label={hasAnyRisk ? "Risks Declared" : "Clean"}
              variant={existing?.misrepresentation ? "error" : hasAnyRisk ? "warning" : "success"}
            />
          )}
        </div>

        <p className="text-xs text-neutral-500">
          Non-disclosure of any of these items constitutes misrepresentation under Art. 40 LIPR
          and may result in a 5-year ban from all Canadian immigration programs.
        </p>

        <div className="space-y-3">
          {FIELDS.map((f) => {
            const checked = getValue(f.key);
            return (
              <div key={f.key} className={`p-3 rounded-safe border ${checked && f.danger ? "border-red-300 bg-red-50" : checked ? "border-amber-200 bg-amber-50" : "border-neutral-200"}`}>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.checked })}
                    className="mt-0.5 rounded"
                  />
                  <div className="flex-1">
                    <span className={`text-sm font-medium ${f.danger && checked ? "text-red-800" : ""}`}>
                      {f.label}
                    </span>
                    {f.danger && checked && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-red-700">
                        <AlertTriangle className="w-3 h-3" />
                        5-year ban risk — document thoroughly
                      </div>
                    )}
                  </div>
                </label>
                {checked && (
                  <textarea
                    className="w-full mt-2 px-3 py-2 rounded-safe border border-neutral-border bg-white text-sm"
                    placeholder="Provide details (dates, countries, circumstances)..."
                    rows={2}
                    value={getDetail(f.detailKey)}
                    onChange={(e) => setForm({ ...form, [f.detailKey]: e.target.value })}
                  />
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-3 pt-3 border-t">
          <Button
            variant="primary"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? "Saving..." : isCompleted ? "Update Declaration" : "Save Declaration"}
          </Button>
          {isCompleted && existing?.clientSignedAt && (
            <span className="text-xs text-green-600 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Signed {new Date(existing.clientSignedAt).toLocaleDateString("en-CA")}
            </span>
          )}
        </div>

        {saveMutation.isError && (
          <p className="text-sm text-status-error">
            {saveMutation.error instanceof Error ? saveMutation.error.message : "Error"}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
