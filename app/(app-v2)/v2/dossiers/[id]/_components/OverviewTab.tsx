import Link from "next/link";
import { FileText } from "lucide-react";
import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { canAssignSelfAsAssistant } from "@/lib/auth/permissions";
import { loadDossierPreparationSnapshot } from "@/lib/dossiers/preparation-loader";
import { getDossierPreparationStatus } from "@/lib/dossiers/preparation-status";
import { getDossierResume } from "@/lib/dossiers/dossier-resume";
import { getDossierNavette } from "@/lib/navette/navette-service";
import { DossierResumeCard } from "@/components/dossiers/DossierResumeCard";
import { DossierResumeIA } from "@/components/dossiers/DossierResumeIA";
import { DossierPreparationCard } from "@/components/dossiers/DossierPreparationCard";
import { NavetteThread } from "@/components/navette/NavetteThread";
import s from "../../../v2.module.css";
import { dateFR } from "../../../_components/primitives";

const MODE_LABELS: Record<string, string> = {
  horaire: "Horaire",
  forfait: "Forfait",
  retainer: "Provision",
  contingent: "À pourcentage",
};

export function modeLabel(
  modeFacturation: string | null,
  tauxHoraire: number | null,
): string {
  const base = modeFacturation
    ? (MODE_LABELS[modeFacturation] ?? modeFacturation)
    : "Non défini";
  if (modeFacturation === "horaire" && tauxHoraire) {
    return `${base} · ${tauxHoraire.toLocaleString("fr-CA")} $/h`;
  }
  return base;
}

/**
 * Onglet Aperçu — colonne principale : reprise (« Où j'en étais ? »), navette,
 * état de préparation, résumé IA (composants legacy réels, embarqués tels
 * quels). Rail droit : Repères, Échéances, Documents récents.
 */
export async function OverviewTab({
  cabinetId,
  dossierId,
  userId,
  role,
  clientId,
  clientName,
  avocatNom,
  dateOuverture,
  modeFacturation,
  tauxHoraire,
  resumeDossier,
}: {
  cabinetId: string;
  dossierId: string;
  userId: string;
  role: string;
  clientId: string;
  clientName: string;
  avocatNom: string | null;
  dateOuverture: Date;
  modeFacturation: string | null;
  tauxHoraire: number | null;
  resumeDossier: string | null;
}) {
  const now = new Date();
  const [snapshot, resume, navetteRows, nextEvents, recentDocs] =
    await Promise.all([
      loadDossierPreparationSnapshot(cabinetId, dossierId, {
        callerUserId: userId,
      }),
      getDossierResume(cabinetId, dossierId, "fr"),
      getDossierNavette(cabinetId, dossierId, role),
      // Pas de cabinetId sur DossierEvenement — le dossier est déjà vérifié
      // comme appartenant au cabinet par la page appelante.
      prisma.dossierEvenement.findMany({
        where: { dossierId, date: { gte: now } },
        orderBy: { date: "asc" },
        take: 3,
        select: { id: true, titre: true, date: true },
      }),
      prisma.richDocument.findMany({
        where: { dossierId, cabinetId, isArchived: false },
        orderBy: { updatedAt: "desc" },
        take: 3,
        select: { id: true, titre: true, statut: true, updatedAt: true },
      }),
    ]);

  const preparationStatus = snapshot
    ? getDossierPreparationStatus(snapshot)
    : null;
  const navetteSerialized = navetteRows.map((r) => ({
    id: r.id,
    type: r.type,
    body: r.body,
    authorName: r.authorName,
    authorRole: r.authorRole,
    recipientId: r.recipientId,
    dueDate: r.dueDate ? r.dueDate.toISOString() : null,
    confidentiel: r.confidentiel,
    resolvedAt: r.resolvedAt ? r.resolvedAt.toISOString() : null,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <div className={s.overviewGrid}>
      <div className={s.mainColumn}>
        {resume ? (
          <div className={s.legacyEmbed}>
            <DossierResumeCard
              resume={resume}
              locale="fr"
              nextActionHref={resume.nextAction ? "#preparation" : undefined}
            />
          </div>
        ) : null}

        {preparationStatus ? (
          <div className={s.legacyEmbed} id="preparation">
            <DossierPreparationCard
              status={preparationStatus}
              dossierId={dossierId}
              clientId={clientId}
              canSelfAssign={canAssignSelfAsAssistant(role as UserRole)}
            />
          </div>
        ) : null}

        <div className={s.legacyEmbed}>
          <NavetteThread
            dossierId={dossierId}
            rows={navetteSerialized}
            currentUserId={userId}
            currentUserRole={role}
            locale="fr"
          />
        </div>

        {process.env.ANTHROPIC_API_KEY ? (
          <div className={s.legacyEmbed}>
            <DossierResumeIA
              dossierId={dossierId}
              initialResume={resumeDossier}
              canSave={["admin_cabinet", "avocat", "assistante"].includes(role)}
            />
          </div>
        ) : null}
      </div>

      <aside className={s.detailRail}>
        <section className={s.railSection}>
          <div className={s.sectionHeader}>
            <h2>Repères</h2>
          </div>
          <dl className={s.detailList}>
            <div>
              <dt>Client</dt>
              <dd>{clientName}</dd>
            </div>
            <div>
              <dt>Responsable</dt>
              <dd>{avocatNom ?? "Non assigné"}</dd>
            </div>
            <div>
              <dt>Ouverture</dt>
              <dd>{dateFR(dateOuverture)}</dd>
            </div>
            <div>
              <dt>Mode</dt>
              <dd>{modeLabel(modeFacturation, tauxHoraire)}</dd>
            </div>
          </dl>
        </section>

        <section className={s.railSection}>
          <div className={s.sectionHeader}>
            <h2>Échéances</h2>
          </div>
          {nextEvents.length === 0 ? (
            <p className={s.railEmpty}>Aucune échéance à venir.</p>
          ) : (
            nextEvents.map((ev) => (
              <div key={ev.id} className={s.deadline}>
                <span>{ev.date.getDate()}</span>
                <div>
                  <strong>{ev.titre}</strong>
                  <small>
                    {ev.date.toLocaleDateString("fr-CA", {
                      month: "long",
                      year: "numeric",
                    })}
                  </small>
                </div>
              </div>
            ))
          )}
        </section>

        <section className={s.railSection}>
          <div className={s.sectionHeader}>
            <h2>Documents récents</h2>
            <Link
              href={`/v2/dossiers/${dossierId}?tab=documents`}
              scroll={false}
              className={s.textButton}
            >
              Ouvrir
            </Link>
          </div>
          {recentDocs.length === 0 ? (
            <p className={s.railEmpty}>Aucun document rédigé.</p>
          ) : (
            recentDocs.map((doc) => (
              <Link
                key={doc.id}
                href={`/edition/${dossierId}/${doc.id}`}
                className={s.documentRow}
              >
                <span>
                  <FileText size={17} />
                </span>
                <span>
                  <strong>{doc.titre}</strong>
                  <small>
                    {doc.statut === "final" ? "Final" : "Brouillon"} ·{" "}
                    {doc.updatedAt.toLocaleDateString("fr-CA", {
                      day: "numeric",
                      month: "long",
                    })}
                  </small>
                </span>
              </Link>
            ))
          )}
        </section>
      </aside>
    </div>
  );
}
