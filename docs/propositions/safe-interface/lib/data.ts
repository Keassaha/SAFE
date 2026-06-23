// Donnees de demonstration.
// Remplacez ces fonctions par vos requetes Prisma quand vous branchez Supabase.
// La forme des objets est volontairement proche d'un schema reel.

export type ComplianceState = "ok" | "warn";

export type ComplianceItem = {
  label: string;
  value: string;
  state: ComplianceState;
};

export type PriorityTask = {
  eyebrow: string;
  title: string;
  metrics: { label: string; value: string; tone?: "default" | "amber" }[];
  primaryAction: string;
  secondaryAction: string;
};

export type UpNextItem = {
  tone: "amber" | "verified" | "muted";
  text: string;
  meta: string;
};

export type Kpi = { label: string; value: string };

export type Obligation = {
  state: ComplianceState;
  title: string;
  detail: string;
  status: string;
};

export type DashboardData = {
  user: { name: string; firm: string; initial: string };
  today: string;
  syncedAt: string;
  compliance: ComplianceItem[];
  priority: PriorityTask;
  upNext: UpNextItem[];
  trust: { badge: string; label: string; amount: string; caption: string };
  monthKpis: Kpi[];
  obligations: Obligation[];
};

export function getDashboardData(): DashboardData {
  return {
    user: { name: "Me Bélanger", firm: "Cabinet Bélanger, Gatineau", initial: "B" },
    today: "lundi 22 juin 2026",
    syncedAt: "Synchronisé 08:14",
    compliance: [
      { label: "Compte en fidéicommis", value: "équilibré", state: "ok" },
      { label: "Règlement B-1 r.5", value: "conforme", state: "ok" },
      { label: "1 rapprochement", value: "à valider", state: "warn" },
    ],
    priority: {
      eyebrow: "Votre priorité aujourd'hui",
      title:
        "Valider le rapprochement du compte en fidéicommis avant la fermeture de juin.",
      metrics: [
        { label: "Écart à expliquer", value: "42,00 $", tone: "amber" },
        { label: "Transactions", value: "17" },
        { label: "Échéance B-1 r.5", value: "30 juin" },
      ],
      primaryAction: "Ouvrir le rapprochement",
      secondaryAction: "Confier à l'Employé Virtuel",
    },
    upNext: [
      {
        tone: "amber",
        text: "Facture FAC-2026-041 en retard de 12 jours, Constructions Rivard",
        meta: "2 450 $",
      },
      {
        tone: "verified",
        text: "Approuver 6,5 h facturables saisies automatiquement hier",
        meta: "à revoir",
      },
      {
        tone: "muted",
        text: "Préparer l'état de compte du dossier Lavoie c. Ville de Gatineau",
        meta: "demain",
      },
    ],
    trust: {
      badge: "Vérifié au cent près",
      label: "Solde en fidéicommis",
      amount: "128 540,00 $",
      caption: "9 dossiers clients, tout balance",
    },
    monthKpis: [
      { label: "Heures facturables", value: "82,5 h" },
      { label: "Facturé", value: "19 800 $" },
      { label: "Comptes clients", value: "7 240 $" },
      { label: "Délai moyen de paiement", value: "23 j" },
    ],
    obligations: [
      {
        state: "ok",
        title: "Séparation des fonds clients",
        detail: "Aucun fonds personnel dans le compte en fidéicommis",
        status: "vérifié",
      },
      {
        state: "ok",
        title: "Tenue du registre détaillé",
        detail: "Chaque mouvement rattaché à un dossier client",
        status: "vérifié",
      },
      {
        state: "warn",
        title: "Rapprochement mensuel de juin",
        detail: "Écart de 42,00 $ à expliquer avant fermeture",
        status: "à valider",
      },
      {
        state: "ok",
        title: "Conservation des pièces justificatives",
        detail: "Archivage chiffré, accès restreint",
        status: "vérifié",
      },
    ],
  };
}

// Domaines de droit proposes a l'ouverture d'un dossier.
export const PRACTICE_AREAS = [
  "Droit de la famille",
  "Droit immobilier",
  "Droit criminel",
  "Litige civil",
  "Droit du travail",
  "Immigration",
] as const;

export const LAWYERS = ["Me Sophie Bélanger", "Me Olivier Tremblay"] as const;

export const nextClientId = "CLI-2026-038";
export const nextDossierId = "DOS-2026-112";
