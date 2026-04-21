"use client";

import { useState } from "react";
import { ImmigrationWorkflow } from "@/components/dossiers/ImmigrationWorkflow";
import { DocumentExpiryTracker } from "@/components/dossiers/DocumentExpiryTracker";
import { BackgroundDeclarationForm } from "@/components/dossiers/BackgroundDeclarationForm";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FileText, Send, CheckCircle, AlertCircle } from "lucide-react";

const IMMIGRATION_DOCS = [
  {
    id: "imm-5476",
    label: "IMM 5476 — Représentant",
    sublabel: "Formulaire IRCC nov. 2025 (obligatoire)",
    icon: "🛂",
    viewHref: (id: string) => `/api/documents/imm-5476/${id}`,
  },
  {
    id: "antecedents-declaration",
    label: "Déclaration d'antécédents",
    sublabel: "Obligation Barreau QC — B-1, r.3.1",
    icon: "📋",
    viewHref: (id: string) => `/api/documents/antecedents-declaration/${id}`,
  },
  {
    id: "immigration-mandate",
    label: "Mandat immigration",
    sublabel: "Clause non-garantie + frais IRCC",
    icon: "✍️",
    viewHref: (id: string) => `/api/documents/immigration-mandate/${id}`,
  },
] as const;

type DocId = (typeof IMMIGRATION_DOCS)[number]["id"];

interface SendState {
  status: "idle" | "loading" | "success" | "error";
  message?: string;
}

interface DossierDetailImmigrationProps {
  dossierId: string;
}

export function DossierDetailImmigration({ dossierId }: DossierDetailImmigrationProps) {
  const [sendState, setSendState] = useState<Record<DocId, SendState>>({
    "imm-5476": { status: "idle" },
    "antecedents-declaration": { status: "idle" },
    "immigration-mandate": { status: "idle" },
  });

  const handleSend = async (docId: DocId) => {
    setSendState((prev) => ({ ...prev, [docId]: { status: "loading" } }));
    try {
      const res = await fetch("/api/documents/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dossierId, documentType: docId }),
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || "Erreur lors de l'envoi");
      }
      const result = await res.json();
      setSendState((prev) => ({
        ...prev,
        [docId]: { status: "success", message: `Envoyé à ${result.sentTo}` },
      }));
      // Reset to idle after 4 s
      setTimeout(() => {
        setSendState((prev) => ({ ...prev, [docId]: { status: "idle" } }));
      }, 4000);
    } catch (err) {
      setSendState((prev) => ({
        ...prev,
        [docId]: {
          status: "error",
          message: err instanceof Error ? err.message : "Erreur inconnue",
        },
      }));
    }
  };

  return (
    <div className="space-y-6">
      {/* ── 1. IRCC Workflow + ITA countdown ── */}
      <ImmigrationWorkflow dossierId={dossierId} />

      {/* ── 2. Documents immigration avec envoi courriel ── */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-4 h-4 text-blue-600" />
            <h4 className="text-sm font-semibold text-[var(--safe-text-title)]">
              Documents IRCC
            </h4>
            <span className="ml-auto text-xs text-[var(--safe-text-secondary)]">
              Envoi par courriel au client
            </span>
          </div>

          <div className="space-y-2">
            {IMMIGRATION_DOCS.map((doc) => {
              const state = sendState[doc.id];
              return (
                <div
                  key={doc.id}
                  className="flex items-center gap-3 rounded-safe border border-white/10 bg-white/5 px-3 py-2.5"
                >
                  <span className="text-base">{doc.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{doc.label}</p>
                    <p className="text-xs text-white/50 truncate">{doc.sublabel}</p>
                    {state.status === "success" && (
                      <p className="text-xs text-green-400 flex items-center gap-1 mt-0.5">
                        <CheckCircle className="w-3 h-3" />
                        {state.message}
                      </p>
                    )}
                    {state.status === "error" && (
                      <p className="text-xs text-red-400 flex items-center gap-1 mt-0.5">
                        <AlertCircle className="w-3 h-3" />
                        {state.message}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={doc.viewHref(dossierId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center rounded-safe-sm border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/10 transition-colors"
                    >
                      Voir PDF
                    </a>
                    <Button
                      variant="secondary"
                      onClick={() => handleSend(doc.id)}
                      disabled={state.status === "loading"}
                      className="!px-3 !py-1.5 !text-xs !h-auto gap-1"
                    >
                      <Send className="w-3 h-3" />
                      {state.status === "loading" ? "Envoi…" : "Envoyer"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ── 3. Document expiry tracker (D8) ── */}
      <DocumentExpiryTracker dossierId={dossierId} />

      {/* ── 4. Background declaration (D7) ── */}
      <BackgroundDeclarationForm dossierId={dossierId} />
    </div>
  );
}
