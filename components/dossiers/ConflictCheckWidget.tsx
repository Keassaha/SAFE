"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Shield, AlertTriangle, CheckCircle, Search } from "lucide-react";

interface Conflict {
  dossierId: string;
  dossierIntitule: string;
  dossierNumeroDossier: string | null;
  clientName: string;
  clientId: string;
  relation: string;
}

interface ConflictCheckResult {
  checkId: string;
  conflictsFound: boolean;
  conflicts: Conflict[];
  totalMatters: number;
}

interface SavedCheck {
  id: string;
  checkedAt: string;
  clientName: string;
  conflictsFound: boolean;
  conflicts: string | null;
  resolution: string | null;
  resolvedAt: string | null;
  resolutionNotes: string | null;
  checkedBy: { nom: string };
}

interface ConflictCheckWidgetProps {
  dossierId: string;
  clientId: string;
  clientName: string;
}

const RELATION_LABELS: Record<string, string> = {
  client_in_other_matter: "Same name in another matter (different client)",
  same_client_other_matter: "Same client — active in another matter",
  name_in_matter_title: "Name appears in matter title (possible adverse party)",
};

export function ConflictCheckWidget({ dossierId, clientId, clientName }: ConflictCheckWidgetProps) {
  const queryClient = useQueryClient();
  const [result, setResult] = useState<ConflictCheckResult | null>(null);

  const { data: history } = useQuery({
    queryKey: ["conflict-checks", dossierId],
    queryFn: async () => {
      const res = await fetch(`/api/dossiers/conflict-check?dossierId=${dossierId}`);
      if (!res.ok) return { checks: [] };
      return res.json() as Promise<{ checks: SavedCheck[] }>;
    },
  });

  const runMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/dossiers/conflict-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dossierId, clientId, clientName }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error running conflict check");
      }
      return res.json() as Promise<ConflictCheckResult>;
    },
    onSuccess: (data) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ["conflict-checks", dossierId] });
    },
  });

  const resolveMutation = useMutation({
    mutationFn: async (params: { checkId: string; resolution: string; notes?: string }) => {
      const res = await fetch("/api/dossiers/conflict-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resolve", ...params }),
      });
      if (!res.ok) throw new Error("Error resolving conflict");
      return res.json();
    },
    onSuccess: () => {
      setResult(null);
      queryClient.invalidateQueries({ queryKey: ["conflict-checks", dossierId] });
    },
  });

  const latestCheck = history?.checks?.[0];
  const hasUnresolvedConflict = latestCheck?.conflictsFound && !latestCheck?.resolution;

  return (
    <Card className={`border ${hasUnresolvedConflict ? "border-red-300 bg-red-50/30" : "border-neutral-200"}`}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className={`w-4 h-4 ${hasUnresolvedConflict ? "text-red-600" : "text-green-600"}`} />
            <h4 className="text-sm font-semibold">Conflict of Interest Check</h4>
          </div>
          {latestCheck && (
            <StatusBadge
              label={
                latestCheck.resolution === "confirmed_no_conflict" ? "Clear" :
                latestCheck.resolution === "declined" ? "Declined" :
                latestCheck.conflictsFound ? "Conflict Found" : "No Conflict"
              }
              variant={
                latestCheck.resolution === "declined" ? "error" :
                latestCheck.conflictsFound && !latestCheck.resolution ? "error" :
                "success"
              }
            />
          )}
        </div>

        {/* Run check button */}
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={() => runMutation.mutate()}
            disabled={runMutation.isPending}
          >
            <Search className="w-3 h-3" />
            {runMutation.isPending ? "Checking..." : latestCheck ? "Re-check" : "Run Check"}
          </Button>
          <span className="text-xs text-neutral-500">
            Searching &quot;{clientName}&quot; across all active matters
          </span>
        </div>

        {/* Live result */}
        {result && (
          <div className="space-y-3 pt-3 border-t">
            {!result.conflictsFound ? (
              <div className="flex items-center gap-2 text-green-700 text-sm">
                <CheckCircle className="w-4 h-4" />
                <span>No conflicts found across {result.totalMatters} active matters.</span>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 text-red-700 text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="font-medium">
                    {result.conflicts.length} potential conflict{result.conflicts.length > 1 ? "s" : ""} found
                  </span>
                </div>
                <div className="space-y-2">
                  {result.conflicts.map((c, i) => (
                    <div key={i} className="p-2 rounded-safe bg-white border border-red-200 text-sm">
                      <p className="font-medium text-red-800">
                        {c.dossierNumeroDossier && `${c.dossierNumeroDossier} — `}
                        {c.dossierIntitule}
                      </p>
                      <p className="text-xs text-red-600">
                        {RELATION_LABELS[c.relation] ?? c.relation}
                        {c.clientName && ` — ${c.clientName}`}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Resolution buttons */}
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button
                    variant="primary"
                    onClick={() => resolveMutation.mutate({
                      checkId: result.checkId,
                      resolution: "confirmed_no_conflict",
                      notes: "Reviewed — no actual conflict exists",
                    })}
                    disabled={resolveMutation.isPending}
                  >
                    <CheckCircle className="w-3 h-3" />
                    Confirm No Conflict
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => resolveMutation.mutate({
                      checkId: result.checkId,
                      resolution: "declined",
                      notes: "Conflict confirmed — matter declined",
                    })}
                    disabled={resolveMutation.isPending}
                  >
                    Decline Matter
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {/* History */}
        {history?.checks && history.checks.length > 0 && !result && (
          <div className="text-xs text-neutral-500 pt-2 border-t">
            Last check: {new Date(latestCheck!.checkedAt).toLocaleDateString("en-CA")} by {latestCheck!.checkedBy.nom}
            {latestCheck!.resolution && ` — ${latestCheck!.resolution.replace(/_/g, " ")}`}
          </div>
        )}

        {runMutation.isError && (
          <p className="text-sm text-status-error">
            {runMutation.error instanceof Error ? runMutation.error.message : "Error"}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
