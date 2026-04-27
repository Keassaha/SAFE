"use client";

import { useState } from "react";
import { BriefcaseSidebar, type SectionDef } from "./BriefcaseSidebar";
import { DocumentViewer } from "./DocumentViewer";

export interface DossierBriefcaseProps {
  dossierId: string;
  statutDossier: string;
  sections: SectionDef[];
}

export function DossierBriefcase({ dossierId, statutDossier: _statutDossier, sections }: DossierBriefcaseProps) {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  return (
    <div className="flex h-screen flex-col gap-0 lg:flex-row lg:gap-0">
      <BriefcaseSidebar
        dossierId={dossierId}
        sections={sections}
        selectedItemId={selectedItemId}
        onSelectItem={setSelectedItemId}
      />
      <DocumentViewer
        dossierId={dossierId}
        itemId={selectedItemId}
        onEdit={() => {}}
      />
    </div>
  );
}
