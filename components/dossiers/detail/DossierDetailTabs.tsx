"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
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
  DossierDetailImmigration,
  DossierDetailSection,
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
  Globe,
  BookOpen,
  Calendar,
  Receipt,
  Search,
  ClipboardList,
  MessageSquareWarning,
  LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
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
  Globe,
  BookOpen,
  Calendar,
  Receipt,
  Search,
  ClipboardList,
  MessageSquareWarning,
};

// Section keys that have a dedicated component
const DEDICATED_COMPONENTS: Record<
  string,
  React.ComponentType<{ dossierId: string; statutDossier?: string }>
> = {
  mandat: DossierDetailMandat,
  formulaires: DossierDetailFormulaires,
  "pieces-madame": DossierDetailPiecesMadame,
  "pieces-monsieur": DossierDetailPiecesMonsieur,
  "pieces-demanderesse": DossierDetailPiecesMadame,
  "pieces-defendeur": DossierDetailPiecesMonsieur,
  pieces: DossierDetailPiecesMadame,
  procedures: DossierDetailProcedures,
  jugements: DossierDetailJugements,
  correspondance: DossierDetailCorrespondance,
  fideicommis: DossierDetailFideicommis,
  "notes-honoraires": DossierDetailNotesHonoraires,
  fermeture: DossierDetailFermeture as React.ComponentType<{ dossierId: string; statutDossier?: string }>,
  immigration: DossierDetailImmigration,
};

export interface SectionData {
  id: string;
  sectionKey: string;
  label: string;
  ordre: number;
  origine: string;
  sourceReglementaire: string | null;
  icone: string | null;
  description: string | null;
  privilegiee: boolean;
}

export interface DossierDetailTabsProps {
  dossierId: string;
  statutDossier: string;
  sections: SectionData[];
}

export function DossierDetailTabs({ dossierId, statutDossier, sections }: DossierDetailTabsProps) {
  const t = useTranslations("matterDetailUi");
  const [activeTab, setActiveTab] = useState<string>(sections[0]?.sectionKey ?? "mandat");

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        {/* Liste verticale des onglets — Liquid Glass clair */}
        <TabsList className="flex h-auto flex-shrink-0 flex-row flex-wrap gap-1 rounded-xl border border-si-line bg-si-surface/75 backdrop-blur-sm p-1.5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] lg:flex-col lg:w-56 lg:flex-nowrap lg:gap-0 lg:p-2">
          {sections.map((section) => {
            const iconName = section.icone ?? "FileText";
            const Icon = ICON_MAP[iconName] ?? FileText;
            return (
              <TabsTrigger
                key={section.sectionKey}
                value={section.sectionKey}
                className="!justify-start flex w-full min-w-0 items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-si-ink transition-colors lg:px-4 lg:py-3 data-[state=active]:bg-si-forest data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-emerald-600/20 data-[state=inactive]:hover:bg-si-canvas data-[state=inactive]:hover:text-si-ink"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center lg:h-9 lg:w-9">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="truncate">{section.label}</span>
                {section.origine === "user" && (
                  <span className="ml-auto shrink-0 h-1.5 w-1.5 rounded-full bg-emerald-400" title={t("customSection")} />
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Contenu à droite */}
        <div className="min-w-0 flex-1">
          {sections.map((section) => {
            const Dedicated = DEDICATED_COMPONENTS[section.sectionKey];
            return (
              <TabsContent key={section.sectionKey} value={section.sectionKey} className="mt-0">
                {Dedicated ? (
                  <Dedicated dossierId={dossierId} statutDossier={statutDossier} />
                ) : (
                  <DossierDetailSection
                    dossierId={dossierId}
                    sectionKey={section.sectionKey}
                    label={section.label}
                    description={section.description}
                    sourceReglementaire={section.sourceReglementaire}
                  />
                )}
              </TabsContent>
            );
          })}
        </div>
      </div>
    </Tabs>
  );
}
