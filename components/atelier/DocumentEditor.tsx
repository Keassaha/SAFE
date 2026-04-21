"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  ArrowLeft, Clock, CheckCircle, Pause, Play,
  Bold, Italic, List, ListOrdered, Heading2, Heading3,
  Save, FileDown, History
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { TerminerDialog } from "./TerminerDialog";

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

interface Props {
  doc: DocData;
  activeSession: WorkSessionData | null;
  currentUserId: string;
}

// ─── Chrono Hook
function useChrono(session: WorkSessionData | null) {
  const [elapsed, setElapsed] = useState(0); // secondes
  const [statut, setStatut] = useState<"en_cours" | "pause" | "inactif">(
    session?.statut === "en_cours" ? "en_cours" : "inactif"
  );
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const inactivityRef = useRef<NodeJS.Timeout | null>(null);

  // Initialiser avec le temps déjà écoulé si session active
  useEffect(() => {
    if (session?.statut === "en_cours") {
      const diff = Math.floor(
        (Date.now() - new Date(session.startedAt).getTime()) / 1000
      );
      setElapsed(diff);
    }
  }, [session]);

  // Ticker
  useEffect(() => {
    if (statut === "en_cours") {
      intervalRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
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

  const minutes = Math.floor(elapsed / 60);

  const formatTime = () => {
    const h = Math.floor(elapsed / 3600);
    const m = Math.floor((elapsed % 3600) / 60);
    const s = elapsed % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return { statut, setStatut, elapsed, minutes, formatTime, resetInactivity };
}

export function DocumentEditor({ doc, activeSession }: Props) {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(activeSession?.id ?? null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [showTerminer, setShowTerminer] = useState(false);
  const [titre, setTitre] = useState(doc.titre);
  const autoSaveRef = useRef<NodeJS.Timeout | null>(null);

  const chrono = useChrono(activeSession);

  // ─── Éditeur Tiptap
  const editor = useEditor({
    extensions: [StarterKit],
    content: (() => {
      try {
        return JSON.parse(doc.content);
      } catch {
        return doc.content || "<p></p>";
      }
    })(),
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none focus:outline-none min-h-[500px] px-8 py-6 text-[var(--safe-text-title)]",
      },
    },
    onUpdate: () => {
      chrono.resetInactivity();
      scheduleAutoSave();
    },
  });

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
      const res = await fetch("/api/atelier/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          richDocumentId: doc.id,
          dossierId: doc.dossier.id,
          clientId: doc.client.id,
        }),
      });
      if (res.ok) {
        const s = await res.json();
        setSessionId(s.id);
        chrono.setStatut("en_cours");
      }
    } catch (e) {
      console.error("Erreur démarrage session:", e);
    }
  }

  // ─── Auto-save toutes les 30s
  function scheduleAutoSave() {
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(() => save(), 30_000);
  }

  async function save() {
    if (!editor) return;
    setIsSaving(true);
    try {
      await fetch(`/api/atelier/documents/${doc.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titre,
          content: JSON.stringify(editor.getJSON()),
        }),
      });
      setSavedAt(new Date());
    } finally {
      setIsSaving(false);
    }
  }

  async function togglePause() {
    if (!sessionId) return;
    const newStatut = chrono.statut === "en_cours" ? "pause" : "en_cours";
    chrono.setStatut(newStatut as any);
    await fetch("/api/atelier/sessions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, action: newStatut === "pause" ? "pause" : "reprendre" }),
    });
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
          <Link href="/atelier" className="hover:text-[var(--safe-primary)] shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <Link
            href={`/atelier/${doc.dossier.id}`}
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
          {/* Chrono badge */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-mono font-medium ${chronoBadge}`}>
            <Clock className="w-3.5 h-3.5" />
            {chrono.formatTime()}
            <span className="font-sans capitalize ml-0.5">{chrono.statut === "en_cours" ? "• En cours" : chrono.statut === "pause" ? "• Pausé" : ""}</span>
          </div>

          {/* Pause / Reprendre */}
          <button
            onClick={togglePause}
            className="p-1.5 rounded-lg hover:bg-[var(--safe-neutral-bg)] text-[var(--safe-text-secondary)] transition-colors"
            title={chrono.statut === "en_cours" ? "Pauser" : "Reprendre"}
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
            className="p-1.5 rounded-lg hover:bg-[var(--safe-neutral-bg)] text-[var(--safe-text-secondary)] transition-colors"
            title="Sauvegarder"
          >
            <Save className={`w-4 h-4 ${isSaving ? "animate-spin" : ""}`} />
          </button>

          {savedAt && (
            <span className="text-xs text-[var(--safe-text-secondary)] hidden sm:block">
              Sauvegardé {savedAt.toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}

          {/* ✅ Bouton TERMINÉ — action principale */}
          <Button
            onClick={() => setShowTerminer(true)}
            className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 px-4"
            disabled={chrono.minutes === 0}
          >
            <CheckCircle className="w-4 h-4" />
            Terminé
          </Button>
        </div>
      </div>

      {/* ─── Barre de formatage */}
      {editor && (
        <div className="flex items-center gap-1 px-4 py-2 border-b border-[var(--safe-neutral-border)] bg-white">
          <FormatButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive("bold")}
            title="Gras"
          >
            <Bold className="w-4 h-4" />
          </FormatButton>
          <FormatButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive("italic")}
            title="Italique"
          >
            <Italic className="w-4 h-4" />
          </FormatButton>
          <div className="w-px h-5 bg-[var(--safe-neutral-border)] mx-1" />
          <FormatButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive("heading", { level: 2 })}
            title="Titre 2"
          >
            <Heading2 className="w-4 h-4" />
          </FormatButton>
          <FormatButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            active={editor.isActive("heading", { level: 3 })}
            title="Titre 3"
          >
            <Heading3 className="w-4 h-4" />
          </FormatButton>
          <div className="w-px h-5 bg-[var(--safe-neutral-border)] mx-1" />
          <FormatButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive("bulletList")}
            title="Liste à puces"
          >
            <List className="w-4 h-4" />
          </FormatButton>
          <FormatButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive("orderedList")}
            title="Liste numérotée"
          >
            <ListOrdered className="w-4 h-4" />
          </FormatButton>
          <div className="flex-1" />
          <button className="flex items-center gap-1.5 text-xs text-[var(--safe-text-secondary)] hover:text-[var(--safe-primary)] px-2 py-1 rounded">
            <History className="w-3.5 h-3.5" />
            Versions
          </button>
          <button className="flex items-center gap-1.5 text-xs text-[var(--safe-text-secondary)] hover:text-[var(--safe-primary)] px-2 py-1 rounded">
            <FileDown className="w-3.5 h-3.5" />
            Export PDF
          </button>
        </div>
      )}

      {/* ─── Zone éditeur */}
      <div className="flex-1 overflow-auto bg-[#FAFAF8]">
        <div className="max-w-4xl mx-auto bg-white shadow-sm min-h-[calc(100vh-200px)] mt-6 mb-8 rounded-lg border border-[var(--safe-neutral-border)]">
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* ─── Dialog "Terminé" */}
      {showTerminer && sessionId && (
        <TerminerDialog
          doc={doc}
          sessionId={sessionId}
          dureeMinutes={chrono.minutes}
          onClose={() => setShowTerminer(false)}
          onSuccess={() => {
            setShowTerminer(false);
            chrono.setStatut("inactif");
            router.push(`/atelier/${doc.dossier.id}`);
          }}
        />
      )}
    </div>
  );
}

function FormatButton({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void;
  active: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded transition-colors ${
        active
          ? "bg-[var(--safe-primary)] text-white"
          : "hover:bg-[var(--safe-neutral-bg)] text-[var(--safe-text-secondary)]"
      }`}
    >
      {children}
    </button>
  );
}
