"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Search, Plus, X, FolderOpen, Loader2, Check } from "lucide-react";
import { getActiveMatters, createQuickTask, type CaptureMatter } from "@/app/(app)/capture/actions";

/**
 * Capture rapide (⌘K / Ctrl+K) — externalise la mémoire : créer une tâche sur
 * un dossier depuis n'importe où, en quelques secondes. Principe TDAH clé.
 */
export function QuickCapture() {
  const t = useTranslations("captureUi");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [matters, setMatters] = useState<CaptureMatter[] | null>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<CaptureMatter | null>(null);
  const [title, setTitle] = useState("");
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();
  const titleRef = useRef<HTMLInputElement>(null);

  // Raccourci clavier global ⌘K / Ctrl+K.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Charge les dossiers à la première ouverture + reset à la fermeture.
  useEffect(() => {
    if (open && matters === null) {
      startTransition(async () => setMatters(await getActiveMatters()));
    }
    if (!open) {
      setQuery("");
      setSelected(null);
      setTitle("");
      setDone(false);
    }
  }, [open, matters]);

  useEffect(() => {
    if (selected) titleRef.current?.focus();
  }, [selected]);

  if (!open) return null;

  const filtered = (matters ?? []).filter((m) => m.label.toLowerCase().includes(query.toLowerCase()));

  const submit = () => {
    if (!selected || !title.trim()) return;
    startTransition(async () => {
      const res = await createQuickTask({ dossierId: selected.id, titre: title.trim() });
      if (res.ok) {
        setDone(true);
        router.refresh();
        setTimeout(() => setOpen(false), 700);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/30 px-4 pt-[12vh]" onClick={() => setOpen(false)}>
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-neutral-100 px-4 py-3">
          <span className="text-[13px] font-bold uppercase tracking-wider text-neutral-400">{t("title")}</span>
          <button onClick={() => setOpen(false)} className="ml-auto text-neutral-400 hover:text-neutral-600" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        {done ? (
          <div className="flex items-center gap-2 px-4 py-6 text-sm font-semibold" style={{ color: "#1F3A2E" }}>
            <Check className="h-5 w-5" /> {t("added")}
          </div>
        ) : !selected ? (
          <div className="p-3">
            <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2">
              <Search className="h-4 w-4 text-neutral-400" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("searchMatter")}
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>
            <div className="mt-2 max-h-72 overflow-y-auto">
              {matters === null ? (
                <div className="flex items-center gap-2 px-2 py-4 text-sm text-neutral-400"><Loader2 className="h-4 w-4 animate-spin" /> …</div>
              ) : filtered.length === 0 ? (
                <p className="px-2 py-4 text-sm text-neutral-400">{t("noMatters")}</p>
              ) : (
                filtered.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelected(m)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm text-neutral-800 hover:bg-neutral-50"
                  >
                    <FolderOpen className="h-4 w-4 text-neutral-400" />
                    <span className="truncate">{m.label}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="p-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold" style={{ backgroundColor: "#EEF5F0", color: "#1F3A2E" }}>
                <FolderOpen className="h-3.5 w-3.5" /> {selected.label}
              </span>
              <button onClick={() => setSelected(null)} className="text-xs font-semibold text-neutral-400 hover:text-neutral-600">{t("change")}</button>
            </div>
            <input
              ref={titleRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
              placeholder={t("taskPlaceholder")}
              className="mt-3 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-[#1F3A2E]"
            />
            <button
              onClick={submit}
              disabled={pending || !title.trim()}
              className="mt-3 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
              style={{ backgroundColor: "#1F3A2E" }}
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} {t("addTask")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
