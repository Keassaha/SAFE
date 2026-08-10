import type { ReactNode } from "react";
import s from "../v2.module.css";

export type PillTone = "neutral" | "success" | "warning" | "danger";

export function StatusPill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: PillTone;
}) {
  return <span className={`${s.status} ${s[`status_${tone}`]}`}>{children}</span>;
}

/** Libellés FR des statuts de dossier (mêmes valeurs que l'enum Prisma). */
export const STATUT_LABELS: Record<string, string> = {
  ouvert: "Ouvert",
  actif: "Actif",
  en_attente: "En attente",
  cloture: "Clôturé",
  archive: "Archivé",
};

export function statutTone(statut: string): PillTone {
  if (statut === "actif" || statut === "ouvert") return "success";
  if (statut === "en_attente") return "warning";
  return "neutral";
}

export const moneyFR = new Intl.NumberFormat("fr-CA", {
  style: "currency",
  currency: "CAD",
  minimumFractionDigits: 2,
});

export function hoursLabel(minutes: number): string {
  return `${(minutes / 60).toLocaleString("fr-CA", { maximumFractionDigits: 2 })} h`;
}

export function dateFR(d: Date): string {
  return d.toLocaleDateString("fr-CA", { day: "numeric", month: "long", year: "numeric" });
}

export function dateShortFR(d: Date): string {
  return d.toLocaleDateString("fr-CA", { day: "numeric", month: "short", year: "numeric" });
}

/** Nom d'affichage du client — même logique que la page dossier legacy. */
export function clientDisplayName(client: {
  raisonSociale: string | null;
  prenom: string | null;
  nom: string | null;
  typeClient: string;
}): string {
  if (client.typeClient === "personne_physique" && (client.prenom || client.nom)) {
    return [client.nom, client.prenom].filter(Boolean).join(", ");
  }
  return client.raisonSociale ?? "";
}
