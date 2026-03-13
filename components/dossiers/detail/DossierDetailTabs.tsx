"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import {
  DossierDetailMandat,
  DossierDetailFormulaires,
  DossierDetailPiecesMadame,
  DossierDetailPiecesMonsieur,
  DossierDetailProcedures,
  DossierDetailJugements,
  DossierDetailCorrespondance,
  DossierDetailFideicommis,
  DossierDetailNotesHonoraires,
  DossierDetailFermeture,
} from "./index";
import {
  FileSignature,
  FileText,
  FolderOpen,
  FolderClosed,
  Scale,
  Gavel,
  Mail,
  Wallet,
  StickyNote,
  Archive,
} from "lucide-react";

const TAB_IDS = [
  "mandat",
  "formulaires",
  "pieces-madame",
  "pieces-monsieur",
  "procedures",
  "jugements",
  "correspondance",
  "fideicommis",
  "notes-honoraires",
  "fermeture",
] as const;

const TABS_CONFIG: Array<{
  id: (typeof TAB_IDS)[number];
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: "mandat", label: "Mandat", icon: FileSignature },
  { id: "formulaires", label: "Formulaires", icon: FileText },
  { id: "pieces-madame", label: "Pièces Madame", icon: FolderOpen },
  { id: "pieces-monsieur", label: "Pièces Monsieur", icon: FolderClosed },
  { id: "procedures", label: "Procédures", icon: Scale },
  { id: "jugements", label: "Jugements", icon: Gavel },
  { id: "correspondance", label: "Correspondance", icon: Mail },
  { id: "fideicommis", label: "Fidéicommis", icon: Wallet },
  { id: "notes-honoraires", label: "Notes & Honoraires", icon: StickyNote },
  { id: "fermeture", label: "Fermeture", icon: Archive },
];

export interface DossierDetailTabsProps {
  dossierId: string;
  statutDossier: string;
}

export function DossierDetailTabs({ dossierId, statutDossier }: DossierDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<string>(TAB_IDS[0]);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        {/* Liste verticale des onglets à gauche — alignement fixe icône + texte */}
        <TabsList className="flex h-auto flex-shrink-0 flex-row flex-wrap gap-1 rounded-xl border border-white/10 bg-white/5 p-1.5 shadow-inner lg:flex-col lg:w-56 lg:flex-nowrap lg:gap-0 lg:p-2">
          {TABS_CONFIG.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="!justify-start flex w-full min-w-0 items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-white/90 transition-colors lg:px-4 lg:py-3 data-[state=active]:bg-[var(--safe-green-700)] data-[state=active]:text-white data-[state=active]:shadow data-[state=inactive]:hover:bg-white/10 data-[state=inactive]:hover:text-white"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center lg:h-9 lg:w-9">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="truncate">{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Contenu à droite */}
        <div className="min-w-0 flex-1">
      <TabsContent value="mandat" className="mt-0">
        <DossierDetailMandat dossierId={dossierId} />
      </TabsContent>
      <TabsContent value="formulaires" className="mt-0">
        <DossierDetailFormulaires dossierId={dossierId} />
      </TabsContent>
      <TabsContent value="pieces-madame" className="mt-0">
        <DossierDetailPiecesMadame dossierId={dossierId} />
      </TabsContent>
      <TabsContent value="pieces-monsieur" className="mt-0">
        <DossierDetailPiecesMonsieur dossierId={dossierId} />
      </TabsContent>
      <TabsContent value="procedures" className="mt-0">
        <DossierDetailProcedures dossierId={dossierId} />
      </TabsContent>
      <TabsContent value="jugements" className="mt-0">
        <DossierDetailJugements dossierId={dossierId} />
      </TabsContent>
      <TabsContent value="correspondance" className="mt-0">
        <DossierDetailCorrespondance dossierId={dossierId} />
      </TabsContent>
      <TabsContent value="fideicommis" className="mt-0">
        <DossierDetailFideicommis dossierId={dossierId} />
      </TabsContent>
      <TabsContent value="notes-honoraires" className="mt-0">
        <DossierDetailNotesHonoraires dossierId={dossierId} />
      </TabsContent>
      <TabsContent value="fermeture" className="mt-0">
        <DossierDetailFermeture dossierId={dossierId} statutDossier={statutDossier} />
      </TabsContent>
        </div>
      </div>
    </Tabs>
  );
}
