import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { routes } from "@/lib/routes";
import { StartTimerButton } from "@/components/temps/StartTimerButton";
import s from "../../../v2.module.css";
import { StatusPill, STATUT_LABELS, statutTone } from "../../../_components/primitives";
import { TimeEntryDrawer } from "./TimeEntryDrawer";

/**
 * En-tête dossier v2 — breadcrumb, pills, titre, actions réelles :
 * timer (composant legacy), Voir le client et Modifier (pages legacy).
 */
export function MatterHeader({
  dossierId,
  numeroDossier,
  intitule,
  statut,
  typeLabel,
  clientId,
  clientName,
  avocatNom,
  mandatIncomplet,
  tauxHoraire,
  userId,
}: {
  dossierId: string;
  numeroDossier: string;
  intitule: string;
  statut: string;
  typeLabel: string | null;
  clientId: string;
  clientName: string;
  avocatNom: string | null;
  mandatIncomplet: boolean;
  tauxHoraire: number | null;
  userId: string;
}) {
  return (
    <section className={s.matterHeader} aria-labelledby="matter-title">
      <div className={s.breadcrumb}>
        <Link href="/v2/dossiers">
          <ChevronLeft size={15} />
          Dossiers
        </Link>
        <span>{clientName}</span>
      </div>
      <div className={s.titleRow}>
        <div>
          <div className={s.titleMeta}>
            <StatusPill tone={statutTone(statut)}>
              {STATUT_LABELS[statut] ?? statut}
            </StatusPill>
            {typeLabel ? <span>{typeLabel}</span> : null}
            {mandatIncomplet ? (
              <StatusPill tone="warning">Mandat incomplet</StatusPill>
            ) : null}
          </div>
          <h1 id="matter-title">{intitule}</h1>
          <p>
            {numeroDossier} · {clientName}
            {avocatNom ? ` · ${avocatNom}` : ""}
          </p>
        </div>
        <div className={s.headerActions}>
          <span className={s.legacyEmbed}>
            <StartTimerButton
              clientId={clientId}
              clientLabel={clientName}
              dossierId={dossierId}
              dossierLabel={numeroDossier}
              variant="soft"
            />
          </span>
          <Link href={routes.client(clientId)} className={s.secondaryButton}>
            Voir le client
          </Link>
          <Link
            href={`${routes.dossier(dossierId)}?edit=1`}
            className={s.secondaryButton}
          >
            Modifier le dossier
          </Link>
          <TimeEntryDrawer
            dossierId={dossierId}
            numeroDossier={numeroDossier}
            intitule={intitule}
            clientName={clientName}
            userId={userId}
            defaultTaux={tauxHoraire}
          />
        </div>
      </div>
    </section>
  );
}
