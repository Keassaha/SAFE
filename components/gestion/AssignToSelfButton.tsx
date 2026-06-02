"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { assignDossierToSelf } from "@/app/(app)/gestion/assistante/actions";

interface AssignToSelfButtonProps {
  dossierId: string;
  /** Affichage compact pour les cartes denses. */
  compact?: boolean;
}

export function AssignToSelfButton({ dossierId, compact = false }: AssignToSelfButtonProps) {
  const t = useTranslations("gestionCompUi");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      const res = await assignDossierToSelf(dossierId);
      if (!res.ok) {
        if (res.error === "already_taken") toast.error(t("assignErrorAlreadyTaken"));
        else if (res.error === "forbidden") toast.error(t("assignErrorForbidden"));
        else toast.error(t("assignErrorGeneric"));
        return;
      }
      if (res.alreadyAssigned) {
        toast.info(t("assignInfoAlreadyMine"));
      } else {
        toast.success(t("assignSuccess"));
      }
      router.refresh();
    });
  };

  const sizing = compact
    ? "text-xs px-2 py-1"
    : "text-sm px-3 py-1.5";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={`inline-flex items-center gap-1.5 rounded-safe-sm border border-emerald-300 bg-emerald-50 text-emerald-800 font-medium hover:bg-emerald-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${sizing}`}
    >
      <UserPlus className="w-3.5 h-3.5" aria-hidden />
      {isPending ? t("assigning") : t("assignToMe")}
    </button>
  );
}
