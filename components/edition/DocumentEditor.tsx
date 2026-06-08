"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import { toast } from "sonner";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import TextAlign from "@tiptap/extension-text-align";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import {
  ArrowLeft, Clock, CheckCircle, Pause, Play,
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  List, ListOrdered,
  Save, FileDown, History, FolderOpen, Loader2,
  Link2, Quote, Code, Minus, Undo, Redo,
  ChevronDown,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Table as TableIcon, SendHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { TerminerDialog } from "./TerminerDialog";
import { MoveDocumentDialog } from "./MoveDocumentDialog";
import { VersionsPanel } from "./VersionsPanel";
import { SendToClientDialog } from "./SendToClientDialog";

interface DocData {
  id: string;
  titre: string;
  type: string;
  statut: string;
  content: string;
  dossier: {
    id: string;
    intitule: string;
    numeroDossier?: string | null;
    tauxHoraire?: number | null;
  };
  client: { id: string; raisonSociale?: string | null };
}

interface WorkSessionData {
  id: string;
  startedAt: string;
  statut: string;
}

interface DossierSimple {
  id: string;
  intitule: string;
  clientNom: string;
  numeroDossier?: string | null;
}

interface Props {
  doc: DocData;
  activeSession: WorkSessionData | null;
  currentUserId: string;
  allDossiers?: DossierSimple[];
}

// ─── Chrono Hook
// L'écoulement (elapsed) est stocké dans un REF, pas dans un state — donc
// le parent ne re-render PAS chaque seconde. Seul le ChronoBadge (qui a
// son propre ticker local) se redessine pour afficher le temps.
function useChrono(session: WorkSessionData | null) {
  const elapsedRef = useRef(0);
  const [statut, setStatut] = useState<"en_cours" | "pause" | "inactif">(
    session?.statut === "en_cours" ? "en_cours" : "inactif"
  );
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const inactivityRef = useRef<NodeJS.Timeout | null>(null);

  // Initialiser avec le temps déjà écoulé si session active
  useEffect(() => {
    if (session?.statut === "en_cours") {
      elapsedRef.current = Math.floor(
        (Date.now() - new Date(session.startedAt).getTime()) / 1000
      );
    }
  }, [session]);

  // Ticker — incrémente le ref, ne déclenche aucun re-render
  useEffect(() => {
    if (statut === "en_cours") {
      intervalRef.current = setInterval(() => {
        elapsedRef.current += 1;
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [statut]);

  // Reset inactivité
  const resetInactivity = useCallback(() => {
    if (inactivityRef.current) clearTimeout(inactivityRef.current);
    if (statut === "en_cours") {
      inactivityRef.current = setTimeout(() => {
        setStatut("pause");
      }, 15 * 60 * 1000); // 15 min d'inactivité → pause
    }
  }, [statut]);

  // Cleanup du timeout d'inactivité dès que le statut quitte "en_cours"
  useEffect(() => {
    if (statut !== "en_cours" && inactivityRef.current) {
      clearTimeout(inactivityRef.current);
      inactivityRef.current = null;
    }
    return () => {
      if (inactivityRef.current) {
        clearTimeout(inactivityRef.current);
        inactivityRef.current = null;
      }
    };
  }, [statut]);

  const getElapsed = useCallback(() => elapsedRef.current, []);
  const getMinutes = useCallback(() => Math.floor(elapsedRef.current / 60), []);

  return { statut, setStatut, getElapsed, getMinutes, resetInactivity };
}

export function DocumentEditor({ doc, activeSession, allDossiers = [] }: Props) {
  const t = useTranslations("editorUi");
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(activeSession?.id ?? null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [showTerminer, setShowTerminer] = useState(false);
  const [showMove, setShowMove] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [titre, setTitre] = useState(doc.titre);
  const autoSaveRef = useRef<NodeJS.Timeout | null>(null);

  const chrono = useChrono(activeSession);

  // Extensions et contenu initial — stables (créés une fois, jamais recréés)
  const extensions = useMemo(
    () => [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
        link: {
          openOnClick: false,
          HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
        },
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Table.configure({ resizable: true, HTMLAttributes: { class: "edition-table" } }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === "heading") return t("placeholderHeading");
          return t("placeholderBody");
        },
        showOnlyWhenEditable: true,
        showOnlyCurrent: true,
      }),
      CharacterCount,
    ],
    [t],
  );

  const initialContent = useMemo(() => {
    try {
      return JSON.parse(doc.content);
    } catch {
      return doc.content || "<p></p>";
    }
  }, [doc.id]);

  // ─── Éditeur Tiptap
  const editor = useEditor({
    immediatelyRender: false,
    extensions,
    content: initialContent,
    editorProps: {
      attributes: {
        class:
          "edition-prose focus:outline-none min-h-[640px] px-16 py-14 text-[#1c1c1f] caret-zinc-900",
      },
    },
    // ⚠️ NE PAS mettre onUpdate ici : capture stale closure + bind sur chaque
    // re-render → casse les keymaps ProseMirror (Entrée/Backspace).
    // L'écoute d'événements update se fait via useEffect plus bas.
  });

  // Subscribe stable au update de l'éditeur — bind UNE FOIS quand l'éditeur
  // est créé. Utilise les refs pour accéder aux valeurs courantes sans
  // recréer le handler.
  const chronoRef = useRef(chrono);
  useEffect(() => {
    chronoRef.current = chrono;
  }, [chrono]);

  useEffect(() => {
    if (!editor) return;
    const handler = () => {
      chronoRef.current.resetInactivity();
      scheduleAutoSave();
    };
    editor.on("update", handler);
    return () => {
      editor.off("update", handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  // ─── Démarrer session dès l'ouverture si pas de session active
  useEffect(() => {
    if (!sessionId) {
      startSession();
    }
    return () => {
      if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startSession() {
    try {
      const res = await fetch("/api/edition/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          richDocumentId: doc.id,
          dossierId: doc.dossier.id,
          clientId: doc.client.id,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const s = await res.json();
      setSessionId(s.id);
      chrono.setStatut("en_cours");
    } catch (e) {
      console.error("Erreur démarrage session:", e);
      toast.error(t("timerStartError"), {
        description: t("timerStartErrorDesc"),
      });
    }
  }

  // ─── Auto-save 4s après la dernière frappe
  function scheduleAutoSave() {
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    setIsDirty(true);
    autoSaveRef.current = setTimeout(() => save(), 4_000);
  }

  async function save() {
    if (!editor) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/edition/documents/${doc.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titre,
          content: JSON.stringify(editor.getJSON()),
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSavedAt(new Date());
      setIsDirty(false);
    } catch (err) {
      console.error("Save failed:", err);
      toast.error(t("saveError"), {
        description: t("saveErrorDesc"),
        action: { label: t("retry"), onClick: () => save() },
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function togglePause() {
    if (!sessionId) return;
    const previousStatut = chrono.statut;
    const newStatut = previousStatut === "en_cours" ? "pause" : "en_cours";
    chrono.setStatut(newStatut);
    try {
      const res = await fetch("/api/edition/sessions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          action: newStatut === "pause" ? "pause" : "reprendre",
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      console.error("Toggle pause failed, rolling back:", err);
      chrono.setStatut(previousStatut);
      toast.error(t("timerUpdateError"));
    }
  }

  // ─── Statut badge chrono
  const chronoBadge = {
    en_cours: "bg-green-100 text-green-700 border-green-200",
    pause: "bg-yellow-100 text-yellow-700 border-yellow-200",
    inactif: "bg-gray-100 text-gray-600 border-gray-200",
  }[chrono.statut];

  return (
    <div className="flex flex-col h-full">
      {/* ─── Barre supérieure */}
      <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-[var(--safe-neutral-border)] bg-white sticky top-0 z-20">
        {/* Fil d'Ariane */}
        <div className="flex items-center gap-2 text-sm text-[var(--safe-text-secondary)] min-w-0">
          <Link href="/edition" className="hover:text-[var(--safe-primary)] shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <Link
            href={`/edition/${doc.dossier.id}`}
            className="hover:text-[var(--safe-primary)] truncate hidden sm:block"
          >
            {doc.dossier.intitule}
          </Link>
          <span className="hidden sm:block">/</span>
          <input
            value={titre}
            onChange={(e) => setTitre(e.target.value)}
            onBlur={save}
            className="font-semibold text-[var(--safe-text-title)] bg-transparent border-none outline-none focus:bg-[var(--safe-neutral-bg)] rounded px-1 truncate max-w-[200px]"
          />
        </div>

        {/* Chrono + actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Chrono badge — isolé pour éviter de re-render toute la toolbar chaque seconde */}
          <ChronoBadge
            statut={chrono.statut}
            getElapsed={chrono.getElapsed}
            badgeClass={chronoBadge}
          />

          {/* Pause / Reprendre */}
          <button
            onClick={togglePause}
            className="p-2 rounded-md text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
            title={chrono.statut === "en_cours" ? t("pause") : t("resume")}
          >
            {chrono.statut === "en_cours" ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </button>

          {/* Save manuel */}
          <button
            onClick={save}
            disabled={isSaving}
            className="p-2 rounded-md text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
            title={t("save")}
          >
            <Save className={`w-4 h-4 ${isSaving ? "animate-spin" : ""}`} />
          </button>

          <span className="text-xs hidden sm:flex items-center gap-1.5 px-2 text-zinc-500">
            {isSaving ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                {t("saving")}
              </>
            ) : isDirty ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                {t("unsavedChanges")}
              </>
            ) : savedAt ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                {t("savedAt", { time: savedAt.toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" }) })}
              </>
            ) : null}
          </span>

          {/* ✅ Bouton TERMINÉ — action principale (toujours actif, validation à l'ouverture du dialog) */}
          <Button
            onClick={() => setShowTerminer(true)}
            className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 px-4"
            disabled={chrono.statut === "inactif"}
          >
            <CheckCircle className="w-4 h-4" />
            {t("done")}
          </Button>
        </div>
      </div>

      {/* ─── Barre de formatage minimaliste (style Apple Notes) */}
      {editor && (
        <div className="flex items-center gap-0.5 px-3 py-2 border-b border-zinc-200 bg-white">
          {/* Undo / Redo */}
          <FormatButton onClick={() => editor.chain().focus().undo().run()} active={false} title={t("undo")} disabled={!editor.can().undo()}>
            <Undo className="w-4 h-4" />
          </FormatButton>
          <FormatButton onClick={() => editor.chain().focus().redo().run()} active={false} title={t("redo")} disabled={!editor.can().redo()}>
            <Redo className="w-4 h-4" />
          </FormatButton>
          <Sep />

          {/* Heading dropdown */}
          <HeadingDropdown editor={editor} />
          <Sep />

          {/* Bold / Italic / Underline / Strike */}
          <FormatButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title={t("bold")}>
            <Bold className="w-4 h-4" />
          </FormatButton>
          <FormatButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title={t("italic")}>
            <Italic className="w-4 h-4" />
          </FormatButton>
          <FormatButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title={t("underline")}>
            <UnderlineIcon className="w-4 h-4" />
          </FormatButton>
          <FormatButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title={t("strikethrough")}>
            <Strikethrough className="w-4 h-4" />
          </FormatButton>
          <Sep />

          {/* Alignement */}
          <FormatButton onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })} title={t("alignLeft")}>
            <AlignLeft className="w-4 h-4" />
          </FormatButton>
          <FormatButton onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} title={t("alignCenter")}>
            <AlignCenter className="w-4 h-4" />
          </FormatButton>
          <FormatButton onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })} title={t("alignRight")}>
            <AlignRight className="w-4 h-4" />
          </FormatButton>
          <FormatButton onClick={() => editor.chain().focus().setTextAlign("justify").run()} active={editor.isActive({ textAlign: "justify" })} title={t("alignJustify")}>
            <AlignJustify className="w-4 h-4" />
          </FormatButton>
          <Sep />

          {/* Listes */}
          <FormatButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title={t("bulletList")}>
            <List className="w-4 h-4" />
          </FormatButton>
          <FormatButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title={t("orderedList")}>
            <ListOrdered className="w-4 h-4" />
          </FormatButton>
          <Sep />

          {/* Bloc */}
          <FormatButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title={t("blockquote")}>
            <Quote className="w-4 h-4" />
          </FormatButton>
          <FormatButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive("codeBlock")} title={t("codeBlock")}>
            <Code className="w-4 h-4" />
          </FormatButton>
          <FormatButton onClick={() => editor.chain().focus().setHorizontalRule().run()} active={false} title={t("horizontalRule")}>
            <Minus className="w-4 h-4" />
          </FormatButton>
          <Sep />

          {/* Lien + tableau */}
          <FormatButton
            onClick={() => {
              const previousUrl = editor.getAttributes("link").href ?? "";
              const url = window.prompt(t("linkUrlPrompt"), previousUrl);
              if (url === null) return;
              if (url === "") {
                editor.chain().focus().extendMarkRange("link").unsetLink().run();
                return;
              }
              editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
            }}
            active={editor.isActive("link")}
            title={t("link")}
          >
            <Link2 className="w-4 h-4" />
          </FormatButton>
          <FormatButton
            onClick={() =>
              editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
            }
            active={editor.isActive("table")}
            title={t("insertTable")}
          >
            <TableIcon className="w-4 h-4" />
          </FormatButton>

          <div className="flex-1" />

          {allDossiers.length > 1 && (
            <button
              onClick={() => setShowMove(true)}
              className="flex items-center gap-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 px-2.5 py-1.5 rounded-md transition-colors"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              {t("move")}
            </button>
          )}
          <button
            onClick={() => setShowVersions(true)}
            className="flex items-center gap-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 px-2.5 py-1.5 rounded-md transition-colors"
          >
            <History className="w-3.5 h-3.5" />
            {t("versions")}
          </button>
          <button
            onClick={async () => {
              setIsExportingPdf(true);
              try {
                await save();
                const res = await fetch(`/api/edition/documents/${doc.id}/pdf`);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${titre.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.pdf`;
                a.click();
                URL.revokeObjectURL(url);
                toast.success(t("pdfExported"));
              } catch (err) {
                console.error("PDF export failed:", err);
                toast.error(t("pdfExportError"));
              } finally {
                setIsExportingPdf(false);
              }
            }}
            disabled={isExportingPdf}
            className="flex items-center gap-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 px-2.5 py-1.5 rounded-md transition-colors disabled:opacity-50"
          >
            {isExportingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
            {t("exportPdf")}
          </button>
          <button
            onClick={async () => {
              await save();
              setShowSendDialog(true);
            }}
            className="flex items-center gap-1.5 text-xs font-semibold text-white px-2.5 py-1.5 rounded-md transition-colors disabled:opacity-50"
            style={{ backgroundColor: "#1F3A2E" }}
          >
            <SendHorizontal className="w-3.5 h-3.5" />
            {t("sendToClient")}
          </button>
        </div>
      )}

      {showSendDialog && (
        <SendToClientDialog
          documentId={doc.id}
          onClose={() => setShowSendDialog(false)}
          onSent={() => toast.success(t("sendToClientSuccess"))}
        />
      )}

      {/* ─── Zone éditeur */}
      <div
        className="flex-1 overflow-auto"
        style={{ background: "#e8e6e0" }}
        onClick={(e) => {
          // Click sur la zone grise hors de la page → focus l'éditeur
          if (e.target === e.currentTarget && editor) editor.commands.focus("end");
        }}
      >
        <div
          className="mx-auto bg-white my-10"
          style={{
            maxWidth: 820,
            boxShadow: "0 2px 24px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03)",
            borderRadius: 4,
          }}
          onClick={() => editor?.commands.focus()}
        >
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* ─── Footer : word count / reading time */}
      {editor && <EditorFooter editor={editor} />}
      <style jsx global>{`
        .edition-prose {
          font-family: "Geist", -apple-system, system-ui, sans-serif;
          font-size: 16px;
          line-height: 1.75;
          color: #1c1c1f;
          letter-spacing: -0.005em;
          caret-color: #4f46e5;
        }
        .edition-prose ::selection {
          background: rgba(79, 70, 229, 0.18);
        }
        .edition-prose p {
          margin: 0 0 1em;
        }
        .edition-prose h1 {
          font-size: 28px;
          font-weight: 600;
          letter-spacing: -0.02em;
          margin: 0.4em 0 0.5em;
          line-height: 1.2;
        }
        .edition-prose h2 {
          font-size: 22px;
          font-weight: 600;
          letter-spacing: -0.015em;
          margin: 1.2em 0 0.4em;
          line-height: 1.3;
        }
        .edition-prose h3 {
          font-size: 18px;
          font-weight: 600;
          letter-spacing: -0.01em;
          margin: 1em 0 0.3em;
          line-height: 1.35;
        }
        .edition-prose h4 {
          font-size: 16px;
          font-weight: 600;
          letter-spacing: -0.005em;
          margin: 0.9em 0 0.25em;
          line-height: 1.4;
        }
        .edition-prose ul,
        .edition-prose ol {
          margin: 0 0 1em;
          padding-left: 1.75em;
        }
        .edition-prose ul {
          list-style: disc;
        }
        .edition-prose ol {
          list-style: decimal;
        }
        .edition-prose ul ul {
          list-style: circle;
        }
        .edition-prose ul ul ul {
          list-style: square;
        }
        .edition-prose ol ol {
          list-style: lower-alpha;
        }
        .edition-prose ol ol ol {
          list-style: lower-roman;
        }
        .edition-prose ul li,
        .edition-prose ol li {
          margin: 0.25em 0;
          padding-left: 0.25em;
        }
        .edition-prose li > p {
          margin: 0;
        }
        .edition-prose strong {
          font-weight: 600;
        }
        .edition-prose blockquote {
          border-left: 3px solid #d4d4d8;
          margin: 1em 0;
          padding: 0.2em 0 0.2em 1em;
          color: #52525b;
          font-style: italic;
        }
        .edition-prose code {
          font-family: "Geist Mono", ui-monospace, monospace;
          font-size: 0.9em;
          background: #f4f4f5;
          padding: 0.1em 0.35em;
          border-radius: 3px;
        }
        .edition-prose a {
          color: #4f46e5;
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .edition-prose .is-empty::before {
          content: attr(data-placeholder);
          color: #a1a1aa;
          float: left;
          height: 0;
          pointer-events: none;
        }
        .edition-prose mark {
          padding: 0.1em 0.15em;
          border-radius: 2px;
        }
        .edition-prose hr {
          border: none;
          border-top: 1px solid #e4e4e7;
          margin: 1.5em 0;
        }
        .edition-prose pre {
          background: #18181b;
          color: #f4f4f5;
          font-family: "Geist Mono", ui-monospace, monospace;
          font-size: 13px;
          padding: 14px 16px;
          border-radius: 6px;
          overflow-x: auto;
          margin: 1em 0;
          line-height: 1.5;
        }
        .edition-prose pre code {
          background: transparent;
          padding: 0;
          color: inherit;
          font-size: inherit;
        }
        /* Tables */
        .edition-prose table {
          border-collapse: collapse;
          margin: 1em 0;
          width: 100%;
          table-layout: fixed;
          overflow: hidden;
        }
        .edition-prose th,
        .edition-prose td {
          border: 1px solid #d4d4d8;
          padding: 8px 10px;
          vertical-align: top;
          position: relative;
        }
        .edition-prose th {
          background: #f4f4f5;
          font-weight: 600;
          text-align: left;
        }
        .edition-prose .selectedCell:after {
          background: rgba(79, 70, 229, 0.1);
          content: "";
          left: 0; right: 0; top: 0; bottom: 0;
          pointer-events: none;
          position: absolute;
          z-index: 2;
        }
        .edition-prose .column-resize-handle {
          background-color: #4f46e5;
          bottom: -2px;
          position: absolute;
          right: -2px;
          pointer-events: none;
          top: 0;
          width: 3px;
        }
        /* Task list */
        .edition-prose ul[data-type="taskList"] {
          list-style: none;
          padding-left: 0;
        }
        .edition-prose ul[data-type="taskList"] li {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          margin: 0.3em 0;
        }
        .edition-prose ul[data-type="taskList"] li > label {
          flex-shrink: 0;
          margin-top: 0.35em;
          user-select: none;
        }
        .edition-prose ul[data-type="taskList"] li > div {
          flex: 1;
        }
        .edition-prose ul[data-type="taskList"] li > div > p {
          margin: 0;
        }
        .edition-prose ul[data-type="taskList"] input[type="checkbox"] {
          width: 14px;
          height: 14px;
          accent-color: #4f46e5;
          cursor: pointer;
        }
        .edition-prose ul[data-type="taskList"] li[data-checked="true"] > div {
          color: #a1a1aa;
          text-decoration: line-through;
        }
        /* Image */
        .edition-prose img {
          max-width: 100%;
          height: auto;
          border-radius: 4px;
          margin: 1em 0;
        }
        .edition-prose img.ProseMirror-selectednode {
          outline: 2px solid #4f46e5;
        }
      `}</style>

      {/* ─── Dialog "Terminé" */}
      {showTerminer && sessionId && (
        <TerminerDialog
          doc={doc}
          sessionId={sessionId}
          dureeMinutes={chrono.getMinutes()}
          onClose={() => setShowTerminer(false)}
          onSuccess={() => {
            setShowTerminer(false);
            chrono.setStatut("inactif");
            router.push(`/edition/${doc.dossier.id}`);
          }}
        />
      )}

      {showMove && (
        <MoveDocumentDialog
          documentId={doc.id}
          documentTitre={titre}
          currentDossierId={doc.dossier.id}
          dossiers={allDossiers}
          onClose={() => setShowMove(false)}
          onSuccess={(_, targetIntitule) => {
            setShowMove(false);
            // Rediriger vers le dossier cible après déplacement
            const target = allDossiers.find((d) => d.intitule === targetIntitule);
            if (target) router.push(`/edition/${target.id}`);
            else router.push("/edition");
          }}
        />
      )}

      {showVersions && (
        <VersionsPanel
          documentId={doc.id}
          onClose={() => setShowVersions(false)}
          onRestore={(restoredContent) => {
            // Injecter le contenu restauré dans l'éditeur Tiptap
            if (editor) {
              try {
                const json = JSON.parse(restoredContent);
                editor.commands.setContent(json);
              } catch {
                editor.commands.setContent(restoredContent);
              }
              setSavedAt(new Date()); // marquer comme "à jour"
            }
            setShowVersions(false);
          }}
        />
      )}
    </div>
  );
}

function EditorFooter({ editor }: { editor: Editor }) {
  const t = useTranslations("editorUi");
  // Re-render seulement sur update du contenu (pas selectionUpdate — pas
  // besoin de recompter mots/caractères quand seule la sélection bouge).
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const update = () => forceUpdate((t) => t + 1);
    editor.on("update", update);
    return () => {
      editor.off("update", update);
    };
  }, [editor]);

  const chars = editor.storage.characterCount?.characters() ?? 0;
  const words = editor.storage.characterCount?.words() ?? 0;
  const readingMinutes = Math.max(1, Math.round(words / 200));

  return (
    <div className="flex items-center gap-4 px-5 py-2 border-t border-zinc-200 bg-white text-xs text-zinc-500">
      <span className="tabular-nums">
        {t.rich("wordCount", {
          count: words,
          strong: (chunks) => <strong className="text-zinc-700 font-medium">{chunks}</strong>,
        })}
      </span>
      <span className="w-px h-3 bg-zinc-200" />
      <span className="tabular-nums">
        {t.rich("charCount", {
          count: chars,
          strong: (chunks) => <strong className="text-zinc-700 font-medium">{chunks}</strong>,
        })}
      </span>
      <span className="w-px h-3 bg-zinc-200" />
      <span className="tabular-nums">{t("readingTime", { minutes: readingMinutes })}</span>
      <div className="flex-1" />
      <span className="text-zinc-400">
        {t("shortcutTip")}
      </span>
    </div>
  );
}

function FormatButton({
  onClick,
  active,
  title,
  children,
  disabled,
}: {
  onClick: () => void;
  active: boolean;
  title: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`p-1.5 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
        active
          ? "bg-zinc-900 text-white hover:bg-zinc-900"
          : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
      }`}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <div className="w-px h-5 bg-zinc-200 mx-1" />;
}

// Affiche le temps écoulé. Possède son PROPRE ticker → seul ce composant
// se re-render à chaque seconde, jamais le parent.
function ChronoBadge({
  statut,
  getElapsed,
  badgeClass,
}: {
  statut: "en_cours" | "pause" | "inactif";
  getElapsed: () => number;
  badgeClass: string;
}) {
  const t = useTranslations("editorUi");
  const [, setTick] = useState(0);
  useEffect(() => {
    if (statut !== "en_cours") return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [statut]);

  const elapsed = getElapsed();
  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  const formatted =
    h > 0
      ? `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
      : `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;

  return (
    <div
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-mono font-medium ${badgeClass}`}
    >
      <Clock className="w-3.5 h-3.5" />
      {formatted}
      <span className="font-sans capitalize ml-0.5">
        {statut === "en_cours" ? t("statusInProgress") : statut === "pause" ? t("statusPaused") : ""}
      </span>
    </div>
  );
}

const HEADING_OPTIONS = [
  { labelKey: "headingNormal", level: 0 as const },
  { labelKey: "heading1", level: 1 as const },
  { labelKey: "heading2", level: 2 as const },
  { labelKey: "heading3", level: 3 as const },
  { labelKey: "heading4", level: 4 as const },
];

function HeadingDropdown({ editor }: { editor: Editor }) {
  const t = useTranslations("editorUi");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const currentOption =
    HEADING_OPTIONS.find((o) => o.level !== 0 && editor.isActive("heading", { level: o.level }));
  const current = currentOption ? t(currentOption.labelKey) : t("headingNormal");

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 px-2.5 py-1.5 rounded-md transition-colors min-w-[120px]"
      >
        <span className="flex-1 text-left truncate">{current}</span>
        <ChevronDown className="w-3.5 h-3.5 opacity-60" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg z-50 min-w-[160px] py-1">
          {HEADING_OPTIONS.map((opt) => (
            <button
              key={opt.level}
              type="button"
              onClick={() => {
                if (opt.level === 0) {
                  editor.chain().focus().setParagraph().run();
                } else {
                  editor.chain().focus().toggleHeading({ level: opt.level }).run();
                }
                setOpen(false);
              }}
              className="w-full text-left px-3 py-1.5 text-xs hover:bg-zinc-50 flex items-center gap-2"
              style={{
                fontSize: opt.level === 0 ? 13 : opt.level === 1 ? 18 : opt.level === 2 ? 16 : opt.level === 3 ? 14 : 13,
                fontWeight: opt.level === 0 ? 400 : 600,
              }}
            >
              {t(opt.labelKey)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

