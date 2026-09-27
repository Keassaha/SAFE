import { cache } from "react";
import { prisma } from "@/lib/db";

/**
 * La file des demandes venues du site public.
 *
 * Trois choses arrivent du site et appellent toutes la même réponse de SAFE
 * Inc. : une demande écrite, une demande de rendez-vous, un audit gratuit
 * rempli. Les deux premières vivent dans `DemandeSite`, la troisième dans
 * `AuditSubmission` — deux tables, parce que l'audit porte un rapport, un PDF
 * et une recommandation que rien d'autre ne porte.
 *
 * Ce module les ramène à un vocabulaire commun pour un seul écran. Il ne
 * fusionne pas les tables : il fusionne la lecture. Chaque entrée garde son
 * lien vers sa propre fiche.
 *
 * Les audits étaient déjà en base depuis des mois sans qu'aucun écran ne les
 * liste ; c'est la moitié « rendre visible » de ce chantier.
 */

export type EtatDemande = "A_REPONDRE" | "REPONDUE" | "PLANIFIEE" | "CLOSE";
export type NatureDemande = "CONTACT" | "RENDEZ_VOUS" | "AUDIT";
export type FiltreDemandes = "a-traiter" | "toutes" | "rendez-vous" | "audits" | "closes";

export type EntreeDemande = {
  /** Identifiant préfixé par sa table : les deux espaces d'id ne se mélangent pas. */
  cle: string;
  id: string;
  origine: "demande" | "audit";
  nature: NatureDemande;
  etat: EtatDemande;
  nom: string;
  cabinet: string | null;
  resume: string | null;
  /** Le seul renseignement utile avant de répondre : moments, téléphone, valeur. */
  detail: string | null;
  /** Ce qui n'a pas suivi : courriel non parti, lead non créé. Null si tout va bien. */
  anomalie: string | null;
  href: string;
  recuLe: Date;
};

const ETAT_DEMANDE: Record<string, EtatDemande> = {
  NOUVELLE: "A_REPONDRE",
  REPONDUE: "REPONDUE",
  PLANIFIEE: "PLANIFIEE",
  CLOSE: "CLOSE",
};

/** L'audit porte ses propres statuts, hérités du pipeline de delivery. */
const ETAT_AUDIT: Record<string, EtatDemande> = {
  nouveau: "A_REPONDRE",
  en_analyse: "A_REPONDRE",
  termine: "REPONDUE",
};

export const LIBELLE_ETAT: Record<EtatDemande, string> = {
  A_REPONDRE: "À répondre",
  REPONDUE: "Répondue",
  PLANIFIEE: "Planifiée",
  CLOSE: "Close",
};

export const LIBELLE_NATURE: Record<NatureDemande, string> = {
  CONTACT: "Contact",
  RENDEZ_VOUS: "Rendez-vous",
  AUDIT: "Audit",
};

/** Montant récupérable estimé, tel que la route d'audit le range dans `scoreGlobal`. */
function valeurAudit(scoreGlobal: number | null): string | null {
  if (!scoreGlobal || scoreGlobal <= 0) return null;
  return `${scoreGlobal.toLocaleString("fr-CA")} $ / an`;
}

function anomalieDemande(d: {
  accuseReceptionEnvoye: boolean;
  aviseInterneEnvoye: boolean;
  leadId: string | null;
}): string | null {
  const manques: string[] = [];
  if (!d.accuseReceptionEnvoye) manques.push("Accusé non parti");
  if (!d.aviseInterneEnvoye) manques.push("Avis interne non parti");
  if (!d.leadId) manques.push("Pas au pipeline");
  return manques.length ? manques.join(" · ") : null;
}

function detailDemande(d: {
  type: string;
  momentSouhaite: string | null;
  telephone: string | null;
}): string | null {
  if (d.type === "RENDEZ_VOUS" && d.momentSouhaite) return d.momentSouhaite;
  return d.telephone;
}

/**
 * Nombre de demandes qui attendent une réponse, toutes origines confondues.
 * Sert la pastille du menu ; mis en cache par requête, le menu et l'écran la
 * demandent tous les deux dans le même rendu.
 */
export const compterDemandesEnAttente = cache(async (): Promise<number> => {
  const [demandes, audits] = await Promise.all([
    prisma.demandeSite.count({ where: { statut: "NOUVELLE" } }),
    prisma.auditSubmission.count({ where: { status: { in: ["nouveau", "en_analyse"] } } }),
  ]);
  return demandes + audits;
});

/** Les compteurs de chaque onglet, calculés en une passe. */
export type CompteursDemandes = Record<FiltreDemandes, number>;

export async function compterParFiltre(): Promise<CompteursDemandes> {
  const [enAttente, demandesTotal, auditsTotal, rdv, closes] = await Promise.all([
    compterDemandesEnAttente(),
    prisma.demandeSite.count(),
    prisma.auditSubmission.count(),
    prisma.demandeSite.count({ where: { type: "RENDEZ_VOUS" } }),
    prisma.demandeSite.count({ where: { statut: "CLOSE" } }),
  ]);
  return {
    "a-traiter": enAttente,
    toutes: demandesTotal + auditsTotal,
    "rendez-vous": rdv,
    audits: auditsTotal,
    closes,
  };
}

/**
 * La liste, déjà filtrée et triée du plus récent au plus ancien.
 *
 * La recherche et le filtre s'appliquent aux deux tables avant la fusion, pour
 * ne pas rapatrier tout l'historique en mémoire à chaque affichage. La limite
 * est volontairement large : la fusion de deux sources triées se fait ici, donc
 * chaque source doit en fournir assez pour que la page soit juste.
 */
export async function listerDemandes(
  filtre: FiltreDemandes = "a-traiter",
  recherche = "",
  limite = 200,
): Promise<EntreeDemande[]> {
  const q = recherche.trim();
  const veutAudits = filtre !== "rendez-vous";
  const veutDemandes = filtre !== "audits";

  const demandes = veutDemandes
    ? await prisma.demandeSite.findMany({
        where: {
          ...(filtre === "a-traiter" ? { statut: "NOUVELLE" as const } : {}),
          ...(filtre === "closes" ? { statut: "CLOSE" as const } : {}),
          ...(filtre === "rendez-vous" ? { type: "RENDEZ_VOUS" as const } : {}),
          ...(q
            ? {
                OR: [
                  { nom: { contains: q, mode: "insensitive" as const } },
                  { cabinet: { contains: q, mode: "insensitive" as const } },
                  { email: { contains: q, mode: "insensitive" as const } },
                ],
              }
            : {}),
        },
        orderBy: { createdAt: "desc" },
        take: limite,
      })
    : [];

  const audits =
    veutAudits && filtre !== "closes"
      ? await prisma.auditSubmission.findMany({
          where: {
            ...(filtre === "a-traiter"
              ? { status: { in: ["nouveau", "en_analyse"] } }
              : {}),
            ...(q
              ? {
                  OR: [
                    { prospectNom: { contains: q, mode: "insensitive" as const } },
                    { prospectCabinet: { contains: q, mode: "insensitive" as const } },
                    { prospectEmail: { contains: q, mode: "insensitive" as const } },
                  ],
                }
              : {}),
          },
          orderBy: { createdAt: "desc" },
          take: limite,
          select: {
            id: true,
            status: true,
            prospectNom: true,
            prospectCabinet: true,
            prospectTelephone: true,
            scoreGlobal: true,
            createdAt: true,
            lead: { select: { id: true } },
          },
        })
      : [];

  const entrees: EntreeDemande[] = [
    ...demandes.map((d) => ({
      cle: `demande:${d.id}`,
      id: d.id,
      origine: "demande" as const,
      nature: d.type as NatureDemande,
      etat: ETAT_DEMANDE[d.statut] ?? "A_REPONDRE",
      nom: d.nom,
      cabinet: d.cabinet,
      resume: d.raison,
      detail: detailDemande(d),
      anomalie: anomalieDemande(d),
      href: `/console/demandes/${d.id}`,
      recuLe: d.createdAt,
    })),
    ...audits.map((a) => ({
      cle: `audit:${a.id}`,
      id: a.id,
      origine: "audit" as const,
      nature: "AUDIT" as const,
      etat: ETAT_AUDIT[a.status] ?? "A_REPONDRE",
      nom: a.prospectNom,
      cabinet: a.prospectCabinet,
      resume: "Audit gratuit rempli au complet",
      detail: valeurAudit(a.scoreGlobal),
      anomalie: a.lead ? null : "Pas au pipeline",
      href: `/audit/${a.id}`,
      recuLe: a.createdAt,
    })),
  ];

  return entrees.sort((a, b) => b.recuLe.getTime() - a.recuLe.getTime());
}

/**
 * Temps écoulé, court. Une liste d'arrivées se lit en relatif : « il y a 3 h »
 * situe mieux qu'une date complète, qu'on garde pour la fiche.
 */
export function depuis(date: Date, maintenant = new Date()): string {
  const minutes = Math.max(0, Math.round((maintenant.getTime() - date.getTime()) / 60000));
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const heures = Math.round(minutes / 60);
  if (heures < 24) return `il y a ${heures} h`;
  const jours = Math.round(heures / 24);
  if (jours === 1) return "hier";
  if (jours < 30) return `il y a ${jours} j`;
  const mois = Math.round(jours / 30);
  return mois < 12 ? `il y a ${mois} mois` : `il y a ${Math.round(mois / 12)} an(s)`;
}
