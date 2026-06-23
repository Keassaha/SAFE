"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatCurrency } from "@/lib/utils/format";
import { FileCheck, Plus, AlertTriangle, Clock } from "lucide-react";

const DOC_TYPES = [
  { value: "medical", label: "Medical Exam", expiryInfo: "Valid 12 months" },
  { value: "police_cert", label: "Police Certificate", expiryInfo: "Must cover recent period" },
  { value: "biometrics", label: "Biometrics", expiryInfo: "Valid 10 years" },
  { value: "language_test", label: "Language Test (IELTS/TEF)", expiryInfo: "Valid 2 years" },
  { value: "education_credential", label: "ECA (Education Credential Assessment)", expiryInfo: "Valid 5 years" },
];

interface ImmigrationDoc {
  id: string;
  type: string;
  label: string | null;
  issuedAt: string;
  expiresAt: string | null;
  expiryStatus: "valid" | "expiring_soon" | "expired" | "unknown";
  daysUntilExpiry: number | null;
}

interface DocumentExpiryTrackerProps {
  dossierId: string;
}

export function DocumentExpiryTracker({ dossierId }: DocumentExpiryTrackerProps) {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [newDocType, setNewDocType] = useState("");
  const [newDocDate, setNewDocDate] = useState("");

  const { data } = useQuery({
    queryKey: ["immigration", dossierId],
    queryFn: async () => {
      const res = await fetch(`/api/dossiers/immigration?dossierId=${dossierId}`);
      if (!res.ok) return { documents: [] };
      const summary = await res.json();
      return { documents: (summary.documents ?? []) as ImmigrationDoc[] };
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/dossiers/immigration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "upsert_document",
          dossierId,
          docType: newDocType,
          issuedAt: newDocDate,
          label: DOC_TYPES.find((d) => d.value === newDocType)?.label,
        }),
      });
      if (!res.ok) throw new Error("Error adding document");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["immigration", dossierId] });
      setShowAdd(false);
      setNewDocType("");
      setNewDocDate("");
    },
  });

  const docs = data?.documents ?? [];

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-si-ink" />
            <h4 className="text-sm font-semibold">Document Expiry Tracker (D8)</h4>
          </div>
          <Button variant="secondary" onClick={() => setShowAdd(!showAdd)}>
            <Plus className="w-3 h-3" />
            Add
          </Button>
        </div>

        {/* Add form */}
        {showAdd && (
          <div className="flex flex-wrap items-end gap-3 p-3 bg-si-canvas rounded-xl border">
            <div>
              <label className="block text-xs font-medium text-si-muted mb-1">Document Type</label>
              <select
                value={newDocType}
                onChange={(e) => setNewDocType(e.target.value)}
                className="h-9 px-2 rounded-xl border border-si-line bg-si-surface text-sm"
              >
                <option value="">Select...</option>
                {DOC_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-si-muted mb-1">Issued Date</label>
              <input
                type="date"
                value={newDocDate}
                onChange={(e) => setNewDocDate(e.target.value)}
                className="h-9 px-2 rounded-xl border border-si-line bg-si-surface text-sm"
              />
            </div>
            <Button
              variant="primary"
              onClick={() => addMutation.mutate()}
              disabled={!newDocType || !newDocDate || addMutation.isPending}
            >
              {addMutation.isPending ? "Adding..." : "Add"}
            </Button>
          </div>
        )}

        {/* Document list */}
        {docs.length === 0 ? (
          <p className="text-sm text-si-muted/50 py-4 text-center">
            No documents tracked yet. Add medical exam, police certificates, etc.
          </p>
        ) : (
          <div className="space-y-2">
            {docs.map((doc) => (
              <div
                key={doc.id}
                className={`flex items-center justify-between p-2.5 rounded-xl border ${
                  doc.expiryStatus === "expired" ? "border-[#B84A3E]/30 bg-[#B84A3E]/10" :
                  doc.expiryStatus === "expiring_soon" ? "border-si-amber/30 bg-si-amber/[0.13]" :
                  "border-si-line"
                }`}
              >
                <div className="flex items-center gap-2">
                  {doc.expiryStatus === "expired" ? (
                    <AlertTriangle className="w-4 h-4 text-[#B84A3E] shrink-0" />
                  ) : doc.expiryStatus === "expiring_soon" ? (
                    <Clock className="w-4 h-4 text-si-amber-ink shrink-0" />
                  ) : (
                    <FileCheck className="w-4 h-4 text-si-verified shrink-0" />
                  )}
                  <div>
                    <p className="text-sm font-medium">
                      {doc.label || DOC_TYPES.find((t) => t.value === doc.type)?.label || doc.type}
                    </p>
                    <p className="text-xs text-si-muted">
                      Issued: {new Date(doc.issuedAt).toLocaleDateString("en-CA")}
                      {doc.expiresAt && ` — Expires: ${new Date(doc.expiresAt).toLocaleDateString("en-CA")}`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <StatusBadge
                    label={
                      doc.expiryStatus === "expired" ? "Expired" :
                      doc.expiryStatus === "expiring_soon" ? `${doc.daysUntilExpiry}d left` :
                      doc.expiryStatus === "valid" ? "Valid" : "—"
                    }
                    variant={
                      doc.expiryStatus === "expired" ? "error" :
                      doc.expiryStatus === "expiring_soon" ? "warning" : "success"
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
