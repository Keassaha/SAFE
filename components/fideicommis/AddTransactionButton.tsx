"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { AddTransactionModal } from "./AddTransactionModal";
import { Plus } from "lucide-react";

interface ClientOption {
  id: string;
  raisonSociale: string;
}

interface DossierOption {
  id: string;
  clientId: string;
  intitule: string;
  numeroDossier: string | null;
}

export interface AddTransactionButtonProps {
  canEdit: boolean;
  cabinetId: string | null;
  clients: ClientOption[];
  dossiers: DossierOption[];
}

export function AddTransactionButton({
  canEdit,
  cabinetId,
  clients,
  dossiers,
}: AddTransactionButtonProps) {
  const tf = useTranslations("fideicommis");
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  if (!canEdit) return null;

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["fideicommis"] });
  };

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        <Plus className="w-4 h-4 mr-2 inline-block" aria-hidden />
        {tf("addTransaction")}
      </Button>
      <AddTransactionModal
        open={open}
        onClose={() => setOpen(false)}
        cabinetId={cabinetId}
        clients={clients}
        dossiers={dossiers}
        onSuccess={handleSuccess}
      />
    </>
  );
}
