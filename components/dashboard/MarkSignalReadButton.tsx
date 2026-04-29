"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { markReadyForReviewRead } from "@/app/(app)/gestion/assistante/actions";

interface MarkSignalReadButtonProps {
  signalId: string;
}

/**
 * Bouton client qui marque un signal "prêt pour revue" comme lu.
 * Appelle la server action `markReadyForReviewRead`.
 */
export function MarkSignalReadButton({ signalId }: MarkSignalReadButtonProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      const res = await markReadyForReviewRead(signalId);
      if (!res.ok) {
        if (res.error === "forbidden") toast.error("Ce signal ne vous est pas destiné.");
        else toast.error("Action impossible.");
        return;
      }
      if (res.alreadyRead) {
        toast.info("Déjà marqué comme vu.");
      } else {
        toast.success("Marqué comme vu.");
      }
      router.refresh();
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-safe-sm border border-[var(--safe-status-success)]/40 text-[var(--safe-status-success)] hover:bg-[var(--safe-status-success-bg)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      aria-label="Marquer comme vu"
    >
      <Check className="w-3 h-3" aria-hidden />
      {isPending ? "…" : "Vu"}
    </button>
  );
}
