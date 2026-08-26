"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import { LifeBuoy, X, ArrowLeft, Send, Plus, Paperclip, FileText } from "lucide-react";
import {
  listMyConversations,
  getConversation,
  listMyTickets,
  type WidgetConversation,
  type WidgetTicket,
  type WidgetPiece,
} from "@/app/(app)/support-widget-actions";
import { subscribeSupport, supportChannels } from "@/lib/support/realtime-browser";

const STATUT_LABELS: Record<string, string> = {
  NOUVEAU: "Nouveau",
  EN_COURS: "En cours",
  EN_ATTENTE_CLIENT: "Réponse reçue",
  RESOLU: "Résolu",
  FERME: "Fermé",
  REOUVERT: "Rouvert",
};

const inputCls =
  "w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";

const ACCEPT = ".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.webp";
const POLL_MS = 20000; // filet de sécurité ; le temps réel fait le gros du travail

type View = "list" | "thread" | "new" | "suivi";

function isImage(mime: string) {
  return mime.startsWith("image/");
}
function formatSize(b: number) {
  return b < 1024 * 1024 ? `${Math.round(b / 1024)} Ko` : `${(b / 1024 / 1024).toFixed(1)} Mo`;
}

function Attachments({ pieces }: { pieces: WidgetPiece[] }) {
  if (!pieces.length) return null;
  return (
    <div className="mt-1.5 flex flex-col gap-1.5">
      {pieces.map((p) =>
        isImage(p.mimeType) ? (
          <a key={p.id} href={`/api/support/attachments/${p.id}`} target="_blank" rel="noreferrer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/support/attachments/${p.id}`}
              alt={p.nom}
              className="max-h-40 rounded-md border border-black/10 object-cover"
            />
          </a>
        ) : (
          <a
            key={p.id}
            href={`/api/support/attachments/${p.id}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-md border border-black/10 bg-white/60 px-2 py-1.5 text-xs hover:bg-white"
          >
            <FileText className="h-4 w-4 shrink-0 text-zinc-500" />
            <span className="truncate">{p.nom}</span>
            <span className="ml-auto shrink-0 text-[10px] text-zinc-400">{formatSize(p.sizeBytes)}</span>
          </a>
        ),
      )}
    </div>
  );
}

function FilePills({ files, onRemove }: { files: File[]; onRemove: (i: number) => void }) {
  if (!files.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {files.map((f, i) => (
        <span key={i} className="flex items-center gap-1 rounded bg-zinc-100 px-2 py-1 text-[11px] text-zinc-700">
          <FileText className="h-3 w-3" />
          <span className="max-w-[120px] truncate">{f.name}</span>
          <button type="button" onClick={() => onRemove(i)} className="text-zinc-400 hover:text-zinc-700">
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
    </div>
  );
}

export function SupportWidget({ cabinetId }: { cabinetId: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("list");
  const [convos, setConvos] = useState<WidgetConversation[]>([]);
  const [active, setActive] = useState<WidgetConversation | null>(null);
  const [tickets, setTickets] = useState<WidgetTicket[]>([]);
  const [draft, setDraft] = useState("");
  const [threadFiles, setThreadFiles] = useState<File[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeIdRef = useRef<string | null>(null);
  activeIdRef.current = active?.id ?? null;

  const hidden = pathname.startsWith("/console");
  const totalUnread = convos.reduce((n, c) => n + c.unread, 0);

  // Charge le compteur de non-lus au montage (pour le badge du bouton « Aide »).
  useEffect(() => {
    if (hidden) return;
    listMyConversations().then(setConvos).catch(() => {});
  }, [hidden]);

  // Temps réel : à chaque signal SAFE, on recharge le fil ouvert (s'il correspond)
  // ou la liste (met à jour le badge). Le contenu vient d'actions authentifiées.
  useEffect(() => {
    if (hidden) return;
    return subscribeSupport(supportChannels.cabinet(cabinetId), (sig) => {
      if (sig.side !== "safe") return; // le client ne se notifie pas lui-même
      if (activeIdRef.current && activeIdRef.current === sig.conversationId) {
        getConversation(sig.conversationId).then((c) => c && setActive(c)).catch(() => {});
      } else {
        listMyConversations().then(setConvos).catch(() => {});
      }
    });
  }, [hidden, cabinetId]);

  useEffect(() => {
    if (!open || hidden) return;
    const tick = async () => {
      if (view === "thread" && active) {
        const c = await getConversation(active.id);
        if (c) setActive(c);
      } else if (view === "list") {
        setConvos(await listMyConversations());
      } else if (view === "suivi") {
        setTickets(await listMyTickets());
      }
    };
    const id = setInterval(tick, POLL_MS);
    return () => clearInterval(id);
  }, [open, hidden, view, active]);

  useEffect(() => {
    if (view === "thread") scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [active?.messages.length, view]);

  if (hidden) return null;

  function openPanel() {
    setOpen(true);
    setView("list");
    startTransition(async () => setConvos(await listMyConversations()));
  }

  function openThread(id: string) {
    setView("thread");
    startTransition(async () => setActive(await getConversation(id)));
  }

  function openSuivi() {
    setView("suivi");
    startTransition(async () => setTickets(await listMyTickets()));
  }

  async function postMessage(fd: FormData): Promise<{ ok: boolean; conversationId?: string; error?: string }> {
    const res = await fetch("/api/support/messages", { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data.error || "Erreur d'envoi" };
    return { ok: true, conversationId: data.conversationId };
  }

  function handleNew(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    newFiles.forEach((f) => fd.append("files", f));
    setError(null);
    startTransition(async () => {
      const res = await postMessage(fd);
      if (res.ok && res.conversationId) {
        form.reset();
        setNewFiles([]);
        openThread(res.conversationId);
      } else {
        setError(res.error || "Erreur");
      }
    });
  }

  function handleSend(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!active || (!draft.trim() && threadFiles.length === 0)) return;
    const fd = new FormData();
    fd.set("conversationId", active.id);
    fd.set("contenu", draft);
    threadFiles.forEach((f) => fd.append("files", f));
    setDraft("");
    setThreadFiles([]);
    setError(null);
    startTransition(async () => {
      const res = await postMessage(fd);
      if (res.ok) {
        const c = await getConversation(active.id);
        if (c) setActive(c);
      } else {
        setError(res.error || "Erreur");
      }
    });
  }

  if (!open) {
    return (
      <button
        onClick={openPanel}
        /* Contrôle discret : l'aide ne doit pas rivaliser avec l'action principale
           de l'écran, qui est le seul élément vert plein autorisé (doctrine §5.1). */
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full border border-si-line bg-si-surface px-4 py-2.5 text-[13px] font-medium text-si-ink shadow-sm transition-colors hover:bg-si-canvas"
        aria-label="Aide"
      >
        <LifeBuoy className="h-4 w-4 text-si-ink-strong" />
        Aide
        {totalUnread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full safe-action-degrade px-1 text-[11px] font-medium text-white">
            {totalUnread}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 z-40 flex h-[70vh] max-h-[600px] w-[380px] max-w-[calc(100vw-2rem)] flex-col rounded-xl border border-zinc-200 bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-900">
          {view === "thread" ? (
            <button onClick={() => { setView("list"); setActive(null); }} className="text-zinc-500 hover:text-zinc-800">
              <ArrowLeft className="h-4 w-4" />
            </button>
          ) : (
            <LifeBuoy className="h-4 w-4 text-emerald-600" />
          )}
          <span className="truncate">{view === "thread" && active ? active.sujet : "Support SAFE"}</span>
        </div>
        <button onClick={() => setOpen(false)} className="text-zinc-400 hover:text-zinc-700">
          <X className="h-4 w-4" />
        </button>
      </div>

      {(view === "list" || view === "suivi") && (
        <div className="flex border-b border-zinc-200">
          <button
            onClick={() => { setView("list"); startTransition(async () => setConvos(await listMyConversations())); }}
            className={`flex-1 px-3 py-2 text-xs font-medium ${view === "list" ? "border-b-2 border-emerald-600 text-emerald-700" : "text-zinc-500"}`}
          >
            Discussions
          </button>
          <button
            onClick={openSuivi}
            className={`flex-1 px-3 py-2 text-xs font-medium ${view === "suivi" ? "border-b-2 border-emerald-600 text-emerald-700" : "text-zinc-500"}`}
          >
            Suivi ({tickets.length})
          </button>
        </div>
      )}

      {error && (
        <div className="mx-4 mt-3 rounded border border-red-300 bg-red-50 px-3 py-1.5 text-xs text-red-800">⚠️ {error}</div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
        {view === "list" && (
          <div className="space-y-2">
            <button
              onClick={() => { setView("new"); setError(null); }}
              className="flex w-full items-center gap-2 rounded-md border border-dashed border-emerald-300 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
            >
              <Plus className="h-4 w-4" /> Nouvelle discussion
            </button>
            {convos.length === 0 ? (
              <p className="py-6 text-center text-sm text-zinc-400">Aucune discussion pour l'instant.</p>
            ) : (
              convos.map((c) => (
                <button
                  key={c.id}
                  onClick={() => openThread(c.id)}
                  className="block w-full rounded-md border border-zinc-200 p-3 text-left hover:border-emerald-300 hover:bg-emerald-50/40"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium text-zinc-900">{c.sujet}</span>
                    {c.unread > 0 && (
                      <span className="shrink-0 rounded-full bg-emerald-600 px-1.5 py-0.5 text-[10px] font-medium text-white">
                        {c.unread}
                      </span>
                    )}
                  </div>
                  {c.dernierMessage && <p className="mt-1 truncate text-xs text-zinc-500">{c.dernierMessage}</p>}
                </button>
              ))
            )}
          </div>
        )}

        {view === "new" && (
          <form onSubmit={handleNew} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600">Sujet</label>
              <input name="sujet" required className={inputCls} placeholder="En quelques mots…" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600">Votre message</label>
              <textarea name="contenu" rows={4} className={inputCls} placeholder="Décrivez votre demande…" />
            </div>
            <FilePills files={newFiles} onRemove={(i) => setNewFiles((f) => f.filter((_, x) => x !== i))} />
            <div className="flex items-center gap-2">
              <label className="flex cursor-pointer items-center gap-1 rounded-md border border-zinc-300 px-2 py-1.5 text-xs text-zinc-600 hover:bg-zinc-50">
                <Paperclip className="h-3.5 w-3.5" /> Joindre
                <input
                  type="file"
                  multiple
                  accept={ACCEPT}
                  className="hidden"
                  onChange={(e) => { setNewFiles((prev) => [...prev, ...Array.from(e.target.files ?? [])]); e.target.value = ""; }}
                />
              </label>
              <button type="button" onClick={() => setView("list")} className="ml-auto rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50">
                Annuler
              </button>
              <button type="submit" disabled={isPending} className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
                {isPending ? "Envoi…" : "Démarrer"}
              </button>
            </div>
          </form>
        )}

        {view === "thread" && active && (
          <div className="space-y-2">
            {active.messages.map((m) => (
              <div key={m.id} className={`flex ${m.isFromSafeInc ? "justify-start" : "justify-end"}`}>
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                    m.isFromSafeInc ? "bg-zinc-100 text-zinc-800" : "bg-emerald-600 text-white"
                  }`}
                >
                  {m.contenu && <span>{m.contenu}</span>}
                  <Attachments pieces={m.pieces} />
                </div>
              </div>
            ))}
          </div>
        )}

        {view === "suivi" && (
          <div className="space-y-3">
            {tickets.length === 0 ? (
              <p className="py-6 text-center text-sm text-zinc-400">Aucune demande suivie pour l'instant.</p>
            ) : (
              tickets.map((t) => (
                <div key={t.id} className="rounded-md border border-zinc-200 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium text-zinc-900">{t.titre}</span>
                    <span className="shrink-0 rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-600">
                      {STATUT_LABELS[t.statut] ?? t.statut}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {view === "thread" && active && (
        <form onSubmit={handleSend} className="border-t border-zinc-200 p-3">
          <FilePills files={threadFiles} onRemove={(i) => setThreadFiles((f) => f.filter((_, x) => x !== i))} />
          <div className="mt-1.5 flex items-center gap-2">
            <label className="shrink-0 cursor-pointer rounded-md p-2 text-zinc-500 hover:bg-zinc-100" title="Joindre un fichier">
              <Paperclip className="h-4 w-4" />
              <input
                type="file"
                multiple
                accept={ACCEPT}
                className="hidden"
                onChange={(e) => { setThreadFiles((prev) => [...prev, ...Array.from(e.target.files ?? [])]); e.target.value = ""; }}
              />
            </label>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className={inputCls}
              placeholder="Votre message…"
            />
            <button
              type="submit"
              disabled={isPending || (!draft.trim() && threadFiles.length === 0)}
              className="shrink-0 rounded-md bg-emerald-600 p-2 text-white hover:bg-emerald-700 disabled:opacity-40"
              aria-label="Envoyer"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
