"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileText, Plus, ArrowLeft, FolderOpen,
  FileEdit, CheckCircle, Archive, ChevronDown, Upload
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { UploadZone } from "./UploadZone";

const DOC_TYPE_LABELS: Record<string, string> = {
  note: "Note interne",
  lettre: "Lettre",
  contrat: "Contrat",
  procedure: "Procédure",
  requete: "Requête",
  autre: "Autre",
};

const DOC_TYPE_COLORS: Record<string, string> = {
  note: "bg-yellow-100 text-yellow-700",
  lettre: "bg-blue-100 text-blue-700",
  contrat: "bg-green-100 text-green-700",
  procedure: "bg-purple-100 text-purple-700",
  requete: "bg-red-100 text-red-700",
  autre: "bg-gray-100 text-gray-700",
};

interface RichDoc {
  id: string;
  titre: string;
  type: string;
  statut: string;
  updatedAt: string;
  lastEditedAt?: string | null;
  createdBy: { nom: string };
  lastEditedBy?: { nom: string } | null;
  _count: { versions: number };
}

interface DossierDetail {
  id: string;
  intitule: string;
  numeroDossier?: string | null;
  type?: string | null;
  client: { id: string; raisonSociale?: string | null };
  richDocuments: RichDoc[];
}

interface DossierSimple {
  id: string;
  intitule: string;
  clientNom: string;
  numeroDossier?: string | null;
}

interface Props {
  dossier: DossierDetail;
  currentUserId: string;
  allDossiers?: DossierSimple[];
}

export function DossierAtelierView({ dossier, allDossiers = [] }: Props) {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState("");
  const [newDocType, setNewDocType] = useState<string>("note");
  const [filter, setFilter] = useState<string>("tous");
  const [tab, setTab] = useState<"redaction" | "fichiers">("redaction");

  const docs = dossier.richDocuments.filter((d) =>
    filter === "tous" ? true : d.type === filter
  );

  async function handleCreateDoc() {
    if (!newDocTitle.trim()) return;
    setIsCreating(true);
    try {
      const res = await fetch("/api/atelier/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dossierId: dossier.id,
          clientId: dossier.client.id,
          titre: newDocTitle.trim(),
          type: newDocType,
        }),
      });
      if (res.ok) {
        const doc = await res.json();
        router.push(`/atelier/${dossier.id}/${doc.id}`);
      }
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec fil d'Ariane */}
      <div className="flex items-center gap-2 text-sm text-[var(--safe-text-secondary)]">
        <Link href="/atelier" className="hover:text-[var(--safe-primary)] flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          Atelier
        </Link>
        <span>/</span>
        <span className="text-[var(--safe-text-secondary)]">{dossier.client.raisonSociale}</span>
        <span>/</span>
        <span className="font-medium text-[var(--safe-text-title)]">{dossier.intitule}</span>
      </div>

      {/* En-tête dossier */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[var(--safe-primary)]/10 flex items-center justify-center">
            <FolderOpen className="w-6 h-6 text-[var(--safe-primary)]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--safe-text-title)]">
              {dossier.intitule}
            </h1>
            <p className="text-sm text-[var(--safe-text-secondary)]">
              {dossier.client.raisonSociale}
              {dossier.numeroDossier && (
                <span className="ml-2 font-mono">#{dossier.numeroDossier}</span>
              )}
            </p>
          </div>
        </div>

        {/* Actions selon onglet actif */}
        <div className="flex items-center gap-2">
          {tab === "redaction" && (
            <NewDocPopover
              onConfirm={handleCreateDoc}
              isLoading={isCreating}
              title={newDocTitle}
              setTitle={setNewDocTitle}
              type={newDocType}
              setType={setNewDocType}
            />
          )}
        </div>
      </div>

      {/* Onglets */}
      <div className="flex items-center gap-1 border-b border-[var(--safe-neutral-border)]">
        <button
          onClick={() => setTab("redaction")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
            tab === "redaction"
              ? "border-[var(--safe-primary)] text-[var(--safe-primary)]"
              : "border-transparent text-[var(--safe-text-secondary)] hover:text-[var(--safe-text-title)]"
          }`}
        >
          <FileText className="w-4 h-4" />
          Rédaction
          <span className="ml-1 text-xs bg-[var(--safe-neutral-bg)] px-1.5 py-0.5 rounded-full">
            {dossier.richDocuments.length}
          </span>
        </button>
        <button
          onClick={() => setTab("fichiers")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
            tab === "fichiers"
              ? "border-[var(--safe-primary)] text-[var(--safe-primary)]"
              : "border-transparent text-[var(--safe-text-secondary)] hover:text-[var(--safe-text-title)]"
          }`}
        >
          <Upload className="w-4 h-4" />
          Fichiers uploadés
        </button>
      </div>

      {/* Contenu selon onglet */}
      {tab === "redaction" && (
        <>
          {/* Filtres par type */}
          <div className="flex items-center gap-2 flex-wrap">
            {["tous", "note", "lettre", "contrat", "procedure", "requete", "autre"].map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  filter === t
                    ? "bg-[var(--safe-primary)] text-white"
                    : "bg-[var(--safe-neutral-bg)] text-[var(--safe-text-secondary)] hover:bg-[var(--safe-neutral-border)]"
                }`}
              >
                {t === "tous" ? `Tous (${dossier.richDocuments.length})` : DOC_TYPE_LABELS[t]}
              </button>
            ))}
          </div>

          {docs.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-[var(--safe-neutral-border)] rounded-xl">
              <FileText className="w-10 h-10 text-[var(--safe-neutral-border)] mx-auto mb-3" />
              <p className="text-[var(--safe-text-secondary)] text-sm">
                Aucun document dans ce dossier.
              </p>
              <p className="text-xs text-[var(--safe-text-secondary)] mt-1">
                Créez votre premier document avec le bouton ci-dessus.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {docs.map((doc) => (
                <DocumentRow key={doc.id} doc={doc} dossierId={dossier.id} />
              ))}
            </div>
          )}
        </>
      )}

      {tab === "fichiers" && (
        <div className="space-y-4">
          <p className="text-sm text-[var(--safe-text-secondary)]">
            Uploadez des fichiers (PDF, Word, images). L&apos;IA suggère automatiquement le bon dossier — vous validez avant de classer.
          </p>
          <UploadZone
            dossiers={allDossiers}
            currentDossierId={dossier.id}
            currentClientId={dossier.client.id}
            onSuccess={() => {/* refresh futur */}}
          />
        </div>
      )}
    </div>
  );
}

function DocumentRow({ doc, dossierId }: { doc: RichDoc; dossierId: string }) {
  const typeColor = DOC_TYPE_COLORS[doc.type] ?? DOC_TYPE_COLORS.autre;
  const typeLabel = DOC_TYPE_LABELS[doc.type] ?? "Autre";

  return (
    <Link
      href={`/atelier/${dossierId}/${doc.id}`}
      className="group flex items-center gap-4 p-4 rounded-lg border border-[var(--safe-neutral-border)] bg-white hover:border-[var(--safe-primary)] hover:shadow-sm transition-all"
    >
      {/* Icone type document */}
      <div className="w-10 h-10 rounded-lg bg-[var(--safe-neutral-bg)] flex items-center justify-center shrink-0 group-hover:bg-[var(--safe-primary)]/10 transition-colors">
        <FileEdit className="w-5 h-5 text-[var(--safe-text-secondary)] group-hover:text-[var(--safe-primary)]" />
      </div>

      {/* Infos principales */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="font-medium text-[var(--safe-text-title)] truncate text-sm">
            {doc.titre}
          </p>
          {doc.statut === "final" && (
            <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
          )}
          {doc.statut === "archive" && (
            <Archive className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          )}
        </div>
        <p className="text-xs text-[var(--safe-text-secondary)]">
          Modifié{" "}
          {formatDistanceToNow(new Date(doc.lastEditedAt ?? doc.updatedAt), {
            locale: fr,
            addSuffix: true,
          })}
          {doc.lastEditedBy && ` par ${doc.lastEditedBy.nom}`}
          {" · "}
          {doc._count.versions} version{doc._count.versions !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Badge type */}
      <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${typeColor}`}>
        {typeLabel}
      </span>
    </Link>
  );
}

function NewDocPopover({
  onConfirm,
  isLoading,
  title,
  setTitle,
  type,
  setType,
}: {
  onConfirm: () => void;
  isLoading: boolean;
  title: string;
  setTitle: (v: string) => void;
  type: string;
  setType: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <Button onClick={() => setOpen(!open)} className="flex items-center gap-2">
        <Plus className="w-4 h-4" />
        Nouveau document
        <ChevronDown className="w-3.5 h-3.5" />
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-[var(--safe-neutral-border)] p-4 z-50 space-y-3">
          <p className="text-sm font-semibold text-[var(--safe-text-title)]">
            Nouveau document
          </p>

          <div className="space-y-1">
            <label className="text-xs text-[var(--safe-text-secondary)]">Titre</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onConfirm()}
              placeholder="Ex: Lettre de mise en demeure"
              className="w-full text-sm border border-[var(--safe-neutral-border)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--safe-primary)] focus:border-transparent"
              autoFocus
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-[var(--safe-text-secondary)]">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full text-sm border border-[var(--safe-neutral-border)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--safe-primary)]"
            >
              {Object.entries(DOC_TYPE_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              onClick={() => { onConfirm(); setOpen(false); }}
              disabled={!title.trim() || isLoading}
              className="flex-1"
            >
              {isLoading ? "Création..." : "Créer"}
            </Button>
            <button
              onClick={() => setOpen(false)}
              className="px-3 py-2 text-sm text-[var(--safe-text-secondary)] hover:bg-[var(--safe-neutral-bg)] rounded-lg"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
