import Link from "next/link";
import { FileText, Plus } from "lucide-react";
import type { DossierType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getDossierSections, generateCartable } from "@/lib/dossiers/cartable-service";
import { DossierBriefcase } from "@/components/dossiers/briefcase";
import s from "../../../v2.module.css";
import { StatusPill, type PillTone } from "../../../_components/primitives";

const DOC_STATUS: Record<string, { label: string; tone: PillTone }> = {
  final: { label: "Final", tone: "success" },
  brouillon: { label: "Brouillon", tone: "warning" },
};

/**
 * Onglet Documents — documents rédigés (RichDocument) + cartables réels
 * (DossierBriefcase, composant legacy embarqué tel quel).
 */
export async function DocumentsTab({
  cabinetId,
  dossierId,
  statutDossier,
  dossierType,
  sousType,
}: {
  cabinetId: string;
  dossierId: string;
  statutDossier: string;
  dossierType: DossierType | null;
  sousType: string | null;
}) {
  let [richDocs, sections] = await Promise.all([
    prisma.richDocument.findMany({
      where: { dossierId, cabinetId, isArchived: false },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        titre: true,
        type: true,
        statut: true,
        updatedAt: true,
        lastEditedBy: { select: { nom: true } },
      },
    }),
    getDossierSections(dossierId, cabinetId),
  ]);

  // Génération auto du cartable si absent — même comportement que la page legacy.
  if (sections.length === 0 && dossierType) {
    await generateCartable(dossierId, cabinetId, dossierType, sousType);
    sections = await getDossierSections(dossierId, cabinetId);
  }

  return (
    <>
      <section className={s.fullSection}>
        <div className={s.sectionHeader}>
          <div>
            <div className={s.sectionEyebrow}>Documents</div>
            <h2>Documents rédigés</h2>
            <p>Créés depuis l’éditeur, liés à ce dossier.</p>
          </div>
          <div className={s.sectionActions}>
            <Link href={`/edition/${dossierId}`} className={s.primaryButton}>
              <Plus size={16} /> Nouveau / Atelier
            </Link>
          </div>
        </div>
        {richDocs.length === 0 ? (
          <div className={s.emptyState}>
            <h2>Aucun document rédigé</h2>
            <p>
              <Link href={`/edition/${dossierId}`} className={s.rowLink}>
                Créer le premier document
              </Link>{" "}
              depuis l’éditeur.
            </p>
          </div>
        ) : (
          <div className={s.documentList}>
            {richDocs.map((doc) => {
              const meta = DOC_STATUS[doc.statut] ?? {
                label: "Archivé",
                tone: "neutral" as PillTone,
              };
              return (
                <Link
                  key={doc.id}
                  href={`/edition/${dossierId}/${doc.id}`}
                  className={s.documentItem}
                >
                  <span className={s.fileIcon}>
                    <FileText size={19} />
                  </span>
                  <span>
                    <strong>{doc.titre}</strong>
                    <small>
                      {doc.type} · modifié le{" "}
                      {doc.updatedAt.toLocaleDateString("fr-CA", {
                        day: "numeric",
                        month: "long",
                      })}
                      {doc.lastEditedBy?.nom ? ` · ${doc.lastEditedBy.nom}` : ""}
                    </small>
                  </span>
                  <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <div className={s.legacyEmbed}>
        <DossierBriefcase
          dossierId={dossierId}
          statutDossier={statutDossier}
          sections={sections}
        />
      </div>
    </>
  );
}
