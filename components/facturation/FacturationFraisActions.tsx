"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { DeboursAddModal } from "./DeboursAddModal";

interface FacturationFraisActionsProps {
  clients: { id: string; raisonSociale: string }[];
  dossiers: { id: string; intitule: string; numeroDossier: string | null; clientId: string }[];
}

export function FacturationFraisActions({ clients, dossiers }: FacturationFraisActionsProps) {
  const td = useTranslations("debours");
  const [modalOpen, setModalOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setModalOpen(true)}>+ {td("newDisbursement")}</Button>
      <DeboursAddModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        clients={clients}
        dossiers={dossiers}
      />
    </>
  );
}
