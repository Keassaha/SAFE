"use client";

import { useState } from "react";
import { BriefcaseSidebar, type SectionDef } from "./BriefcaseSidebar";
import { DocumentViewer } from "./DocumentViewer";

export interface DossierBriefcaseProps {
  dossierId: string;
  statutDossier: string;
  sections: SectionDef[];
  /**
   * Hauteur du cartable. « h-screen » par defaut, ce que la v2 attend depuis
   * toujours : elle le monte seul dans un onglet plein ecran.
   *
   * La fiche de app/(app) le monte DANS une carte a onglets depuis le
   * 2026-08-27 : un plein ecran y ferait deborder la carte de la page. Elle
   * passe donc sa propre hauteur.
   */
  hauteurClassName?: string;
}

export function DossierBriefcase({
  dossierId,
  statutDossier: _statutDossier,
  sections,
  hauteurClassName = "h-screen",
}: DossierBriefcaseProps) {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  return (
    <div className={`flex ${hauteurClassName} flex-col gap-0 lg:flex-row lg:gap-0`}>
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
