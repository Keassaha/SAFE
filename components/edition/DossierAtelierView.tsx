"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileText, Plus, ArrowLeft, FolderOpen,
  FileEdit, CheckCircle, Archive, ChevronDown, Upload
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { clientDisplayName } from "@/lib/clients/normalize-name";
import { UploadZone } from "./UploadZone";
import { MoveDocumentDialog } from "./MoveDocumentDialog";

const DOC_TYPE_KEYS: Record<string, string> = {
  note: "docTypeNote",
  lettre: "docTypeLettre",
  contrat: "docTypeContrat",
  procedure: "docTypeProcedure",
  requete: "docTypeRequete",
  mandat: "docTypeMandat",
  autre: "docTypeAutre",
};

const DOC_TYPE_VALUES = ["note", "lettre", "contrat", "procedure", "requete", "mandat", "autre"];

const DOC_TYPE_COLORS: Record<string, string> = {
  note: "bg-yellow-100 text-yellow-700",
  lettre: "bg-blue-100 text-blue-700",
  contrat: "bg-green-100 text-green-700",
  procedure: "bg-purple-100 text-purple-700",
  requete: "bg-red-100 text-red-700",
  mandat: "bg-amber-100 text-amber-800",
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
  client: { id: string; raisonSociale?: string | null; prenom?: string | null; nom?: string | null };
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
  const t = useTranslations("editorUi");
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
      const res = await fetch("/api/edition/documents", {
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
        router.push(`/edition/${dossier.id}/${doc.id}`);
      }
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec fil d'Ariane */}
      <div className="flex items-center gap-2 text-sm text-[var(--safe-text-secondary)]">
        <Link href="/edition" className="hover:text-[var(--safe-primary)] flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          {t("workshop")}
        </Link>
        <span>/</span>
        <span className="text-[var(--safe-text-secondary)]">{clientDisplayName(dossier.client)}</span>
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
              {clientDisplayName(dossier.client)}
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
          {t("drafting")}
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
          {t("uploadedFiles")}
        </button>
      </div>

      {/* Contenu selon onglet */}
      {tab === "redaction" && (
        <>
          {/* Filtres par type */}
          <div className="flex items-center gap-2 flex-wrap">
            {["tous", ...DOC_TYPE_VALUES].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  filter === f
                    ? "bg-[var(--safe-primary)] text-white"
                    : "bg-[var(--safe-neutral-bg)] text-[var(--safe-text-secondary)] hover:bg-[var(--safe-neutral-border)]"
                }`}
              >
                {f === "tous" ? t("allCount", { count: dossier.richDocuments.length }) : t(DOC_TYPE_KEYS[f])}
              </button>
            ))}
          </div>

          {docs.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-[var(--safe-neutral-border)] rounded-xl">
              <FileText className="w-10 h-10 text-[var(--safe-neutral-border)] mx-auto mb-3" />
              <p className="text-[var(--safe-text-secondary)] text-sm">
                {t("noDocumentInMatter")}
              </p>
              <p className="text-xs text-[var(--safe-text-secondary)] mt-1">
                {t("createFirstDocumentHint")}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {docs.map((doc) => (
                <DocumentRow
                  key={doc.id}
                  doc={doc}
                  dossierId={dossier.id}
                  allDossiers={allDossiers}
                />
              ))}
            </div>
          )}
        </>
      )}

      {tab === "fichiers" && (
        <div className="space-y-4">
          <p className="text-sm text-[var(--safe-text-secondary)]">
            {t("uploadFilesHint")}
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

function DocumentRow({
  doc,
  dossierId,
  allDossiers = [],
}: {
  doc: RichDoc;
  dossierId: string;
  allDossiers?: DossierSimple[];
}) {
  const t = useTranslations("editorUi");
  const [showMove, setShowMove] = useState(false);
  const [markingFinal, setMarkingFinal] = useState(false);
  const router = useRouter();
  // P5 — « Marquer comme final » : déclenche le signal navette « document prêt »
  // côté serveur (transition brouillon → final dans la route PUT).
  const markFinal = async () => {
    setMarkingFinal(true);
    try {
      await fetch(`/api/edition/documents/${doc.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut: "final" }),
      });
      router.refresh();
    } finally {
      setMarkingFinal(false);
    }
  };
  const typeColor = DOC_TYPE_COLORS[doc.type] ?? DOC_TYPE_COLORS.autre;
  const typeLabel = t(DOC_TYPE_KEYS[doc.type] ?? "docTypeAutre");

  return (
    <>
      <div className="group flex items-center gap-4 p-4 rounded-lg border border-[var(--safe-neutral-border)] bg-white hover:border-[var(--safe-primary)] hover:shadow-sm transition-all">
        {/* Icone type document */}
        <Link href={`/edition/${dossierId}/${doc.id}`} className="w-10 h-10 rounded-lg bg-[var(--safe-neutral-bg)] flex items-center justify-center shrink-0 group-hover:bg-[var(--safe-primary)]/10 transition-colors">
          <FileEdit className="w-5 h-5 text-[var(--safe-text-secondary)] group-hover:text-[var(--safe-primary)]" />
        </Link>

        {/* Infos principales */}
        <Link href={`/edition/${dossierId}/${doc.id}`} className="flex-1 min-w-0">
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
            {t("modifiedRelative", {
              relative: formatDistanceToNow(new Date(doc.lastEditedAt ?? doc.updatedAt), {
                locale: fr,
                addSuffix: true,
              }),
            })}
            {doc.lastEditedBy && t("byAuthor", { author: doc.lastEditedBy.nom })}
            {" · "}
            {t("versionCount", { count: doc._count.versions })}
          </p>
        </Link>

        {/* Badge type */}
        <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${typeColor}`}>
          {typeLabel}
        </span>

        {/* Bouton Déplacer */}
        {allDossiers.length > 1 && (
          <button
            onClick={(e) => { e.preventDefault(); setShowMove(true); }}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded hover:bg-[var(--safe-neutral-bg)] text-[var(--safe-text-secondary)] hover:text-[var(--safe-primary)] shrink-0"
            title={t("moveToAnotherMatter")}
          >
            <FolderOpen className="w-4 h-4" />
          </button>
        )}

        {/* P5 — Marquer comme final (prévient l'avocate via la navette) */}
        {doc.statut === "brouillon" && (
          <button
            onClick={(e) => { e.preventDefault(); markFinal(); }}
            disabled={markingFinal}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded hover:bg-[var(--safe-neutral-bg)] text-[var(--safe-text-secondary)] hover:text-green-600 shrink-0 disabled:opacity-50"
            title={t("markFinal")}
          >
            <CheckCircle className="w-4 h-4" />
          </button>
        )}
      </div>

      {showMove && (
        <MoveDocumentDialog
          documentId={doc.id}
          documentTitre={doc.titre}
          currentDossierId={dossierId}
          dossiers={allDossiers}
          onClose={() => setShowMove(false)}
          onSuccess={(targetId) => {
            setShowMove(false);
            router.push(`/edition/${targetId}`);
            router.refresh();
          }}
        />
      )}
    </>
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
  const t = useTranslations("editorUi");
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <Button onClick={() => setOpen(!open)} className="flex items-center gap-2">
        <Plus className="w-4 h-4" />
        {t("newDocument")}
        <ChevronDown className="w-3.5 h-3.5" />
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-[var(--safe-neutral-border)] p-4 z-50 space-y-3">
          <p className="text-sm font-semibold text-[var(--safe-text-title)]">
            {t("newDocument")}
          </p>

          <div className="space-y-1">
            <label className="text-xs text-[var(--safe-text-secondary)]">{t("title")}</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onConfirm()}
              placeholder={t("newDocumentPlaceholder")}
              className="w-full text-sm border border-[var(--safe-neutral-border)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--safe-primary)] focus:border-transparent"
              autoFocus
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-[var(--safe-text-secondary)]">{t("type")}</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full text-sm border border-[var(--safe-neutral-border)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--safe-primary)]"
            >
              {DOC_TYPE_VALUES.map((v) => (
                <option key={v} value={v}>{t(DOC_TYPE_KEYS[v])}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              onClick={() => { onConfirm(); setOpen(false); }}
              disabled={!title.trim() || isLoading}
              className="flex-1"
            >
              {isLoading ? t("creating") : t("create")}
            </Button>
            <button
              onClick={() => setOpen(false)}
              className="px-3 py-2 text-sm text-[var(--safe-text-secondary)] hover:bg-[var(--safe-neutral-bg)] rounded-lg"
            >
              {t("cancel")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
