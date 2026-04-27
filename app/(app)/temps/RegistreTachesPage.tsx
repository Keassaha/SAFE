"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { ForfaitServiceTable } from "@/components/forfait/ForfaitServiceTable";
import { RegistreTacheTable } from "@/components/forfait/RegistreTacheTable";
import { AjouterTacheModal } from "@/components/forfait/AjouterTacheModal";
import { Button } from "@/components/ui/Button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Plus, Receipt } from "lucide-react";
import { useRouter } from "next/navigation";

interface DossierOption {
  id: string;
  intitule: string;
  numeroDossier: string | null;
  clientId: string;
}

interface RegistreTachesPageProps {
  dossiers: DossierOption[];
}

export function RegistreTachesPage({ dossiers }: RegistreTachesPageProps) {
  const t = useTranslations("temps.taskRegister");
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("registre");
  const queryClient = useQueryClient();
  const router = useRouter();

  const facturerMutation = useMutation({
    mutationFn: async (dossierId: string) => {
      const res = await fetch("/api/registre-taches/facturer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dossierId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || t("errorGenerating"));
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["registre-taches"] });
      if (data.invoice?.id) {
        router.push(`/facturation/factures/${data.invoice.id}`);
      }
    },
  });

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="registre">{t("registerTab")}</TabsTrigger>
            <TabsTrigger value="grille">{t("feeScheduleTab")}</TabsTrigger>
          </TabsList>
          <Button variant="primary" onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4" /> {t("addTask")}
          </Button>
        </div>

        <TabsContent value="registre">
          <RegistreTacheTable
            onFacturer={(dossierId) => facturerMutation.mutate(dossierId)}
          />
        </TabsContent>

        <TabsContent value="grille">
          <ForfaitServiceTable />
        </TabsContent>
      </Tabs>

      {facturerMutation.isError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-safe text-sm text-red-700">
          {facturerMutation.error instanceof Error ? facturerMutation.error.message : t("errorGenerating")}
        </div>
      )}

      {facturerMutation.isPending && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-safe text-sm text-blue-700 flex items-center gap-2">
          <Receipt className="w-4 h-4" /> {t("generatingInvoice")}
        </div>
      )}

      <AjouterTacheModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        dossiers={dossiers}
      />
    </div>
  );
}
