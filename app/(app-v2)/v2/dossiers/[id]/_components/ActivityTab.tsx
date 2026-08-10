import { getDossierTimeline } from "@/lib/dossiers/dossier-timeline";
import s from "../../../v2.module.css";
import { StatusPill } from "../../../_components/primitives";

function timeLabel(d: Date): string {
  return `${d.toLocaleDateString("fr-CA", { day: "numeric", month: "long" })} à ${d.toLocaleTimeString("fr-CA", { hour: "numeric", minute: "2-digit" }).replace(":", " h ")}`;
}

/** Badge court par famille d'action du journal d'audit. */
function actionBadge(action: string): string {
  if (action.includes("document") || action.includes("mandat")) return "Document";
  if (action.includes("client")) return "Client";
  if (action.includes("temps") || action.includes("time")) return "Temps";
  if (action.includes("facture") || action.includes("invoice")) return "Facture";
  if (action.includes("fiducie") || action.includes("trust")) return "Fiducie";
  return "Dossier";
}

/** Onglet Activité — journal d'audit réel du dossier, chronologie unique. */
export async function ActivityTab({
  cabinetId,
  dossierId,
}: {
  cabinetId: string;
  dossierId: string;
}) {
  const items = await getDossierTimeline(cabinetId, dossierId);

  return (
    <section className={s.fullSection}>
      <div className={s.sectionHeader}>
        <div>
          <div className={s.sectionEyebrow}>Historique commun</div>
          <h2>Activité du dossier</h2>
          <p>
            Le temps, les factures, les paiements et les documents suivent la
            même chronologie.
          </p>
        </div>
      </div>
      {items.length === 0 ? (
        <div className={s.emptyState}>
          <h2>Aucune activité consignée</h2>
          <p>Les actions posées sur ce dossier apparaîtront ici.</p>
        </div>
      ) : (
        <ol className={s.timeline}>
          {items.map((item) => (
            <li key={item.id}>
              <span className={s.timelineDot} />
              <div>
                <strong>{item.label}</strong>
                <small>
                  {item.userName ? `${item.userName} · ` : ""}
                  {timeLabel(item.createdAt)}
                </small>
              </div>
              <StatusPill>{actionBadge(item.action)}</StatusPill>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
