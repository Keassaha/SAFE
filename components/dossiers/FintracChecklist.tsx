"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Shield, AlertTriangle, CheckCircle } from "lucide-react";

interface FintracChecklistProps {
  fintracVerified?: boolean;
  fintracDocuments?: { doc1?: string; doc2?: string } | null;
  closingDate?: string | null;
  isEdit?: boolean;
}

const ID_TYPES = [
  "Driver's Licence",
  "Passport",
  "Provincial Health Card (photo)",
  "Permanent Resident Card",
  "Canadian Citizenship Card (photo)",
  "NEXUS Card",
  "Birth Certificate",
  "Other Government-issued Photo ID",
];

export function FintracChecklist({
  fintracVerified = false,
  fintracDocuments,
  closingDate,
  isEdit = false,
}: FintracChecklistProps) {
  const [doc1, setDoc1] = useState(fintracDocuments?.doc1 ?? "");
  const [doc2, setDoc2] = useState(fintracDocuments?.doc2 ?? "");
  const [verified, setVerified] = useState(fintracVerified);

  // Calculate days until closing
  const daysUntilClosing = closingDate
    ? Math.ceil((new Date(closingDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const isUrgent = daysUntilClosing !== null && daysUntilClosing <= 3 && !verified;
  const bothDocsSelected = doc1 !== "" && doc2 !== "" && doc1 !== doc2;

  return (
    <Card className={`border ${isUrgent ? "border-[#B84A3E]/40 bg-[#B84A3E]/10" : verified ? "border-si-verified/30 bg-si-verified/10" : "border-si-amber/30 bg-si-amber/[0.13]"}`}>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className={`w-4 h-4 ${isUrgent ? "text-[#B84A3E]" : verified ? "text-si-verified" : "text-si-amber-ink"}`} />
            <h4 className="text-sm font-semibold">
              FINTRAC Identity Verification
            </h4>
          </div>
          <StatusBadge
            label={verified ? "Verified" : isUrgent ? "URGENT" : "Pending"}
            variant={verified ? "success" : isUrgent ? "error" : "warning"}
          />
        </div>

        {isUrgent && (
          <div className="flex items-center gap-2 text-[#B84A3E] text-sm bg-[#B84A3E]/10 p-2 rounded-xl">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <p>
              {daysUntilClosing! <= 0
                ? "Closing date has passed — FINTRAC verification is overdue!"
                : `Only ${daysUntilClosing} days until closing. FINTRAC requires 2 pieces of ID verified in person.`
              }
            </p>
          </div>
        )}

        <p className="text-xs text-si-muted">
          FINTRAC requires verification of identity using two (2) valid, original, government-issued
          identification documents. Penalty for non-compliance: up to $500,000.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-si-muted mb-1">
              ID Document 1 <span className="text-[#B84A3E]">*</span>
            </label>
            <select
              name="fintracDoc1"
              value={doc1}
              onChange={(e) => setDoc1(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-si-line bg-si-surface/90 text-sm focus:ring-2 focus:ring-si-verified/25 outline-none"
            >
              <option value="">Select ID type...</option>
              {ID_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-si-muted mb-1">
              ID Document 2 <span className="text-[#B84A3E]">*</span>
            </label>
            <select
              name="fintracDoc2"
              value={doc2}
              onChange={(e) => setDoc2(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-si-line bg-si-surface/90 text-sm focus:ring-2 focus:ring-si-verified/25 outline-none"
            >
              <option value="">Select ID type...</option>
              {ID_TYPES.filter((t) => t !== doc1).map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        {doc1 && doc2 && doc1 === doc2 && (
          <p className="text-sm text-[#B84A3E]">
            Two different ID types are required.
          </p>
        )}

        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            name="fintracVerified"
            checked={verified}
            onChange={(e) => setVerified(e.target.checked)}
            className="rounded"
            disabled={!bothDocsSelected}
            value="on"
          />
          <span className={bothDocsSelected ? "" : "opacity-50"}>
            I confirm that both ID documents have been verified in person per FINTRAC requirements
          </span>
        </label>

        {verified && (
          <div className="flex items-center gap-2 text-si-verified text-sm">
            <CheckCircle className="w-4 h-4" />
            Identity verification complete
          </div>
        )}

        {/* Hidden fields for form submission */}
        <input type="hidden" name="fintracDocuments" value={JSON.stringify({ doc1, doc2 })} />
      </CardContent>
    </Card>
  );
}
