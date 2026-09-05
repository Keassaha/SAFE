/**
 * SAFE — Chronologie de correspondance d'un dossier (lot 0).
 *
 * Doctrine : docs/product/SPEC_SAFE_CORRESPONDANCE_ASSISTEE.md, §22 lot 0.
 *
 * ── Pourquoi ce fichier existe ───────────────────────────────────────────────
 * SAFE écrit trois journaux d'envoi et n'en montre aucun. L'onglet
 * « Correspondance » du cartable affichait deux phrases de remplissage
 * au-dessus de `InvoiceSendLog`, `NotificationLog` et `DossierCorrespondence`,
 * tous les trois remplis. C'est le cas que la règle de build §4.2 nomme comme
 * prioritaire : du moteur sans bouton.
 *
 * ── Ce qu'on ne fait PAS ─────────────────────────────────────────────────────
 * Aucune reprise de données, aucune nouvelle table, aucune écriture. On lit
 * trois sources et on les fusionne à l'affichage. C'est plus lent qu'une table
 * unique, c'est réversible, et surtout ça n'écrit pas dans un journal qui sert
 * de preuve de communication au sens du Barreau.
 *
 * ── Découpage ────────────────────────────────────────────────────────────────
 * `fusionnerChronologie` est PURE : elle prend trois listes déjà lues et rend
 * la chronologie triée. C'est là que vivent les décisions (direction, état,
 * nombre de pièces), donc c'est là que portent les tests. La lecture en base
 * est isolée dans `chargerChronologie`, qui ne décide de rien.
 */

/** D'où vient la ligne. Le mot est montré à l'écran, il n'est pas technique. */
export type SourceCorrespondance = "facture" | "document" | "notification" | "saisie";

/** Sens de la communication. `saisi` = ligne du cartable tapée à la main : on
 *  ne connaît pas le sens de façon fiable, et l'inventer serait pire que rien. */
export type SensCorrespondance = "sortant" | "saisi";

export type EtatCorrespondance = "envoye" | "echec" | "saisi";

export interface EntreeCorrespondance {
  /** Préfixé par la source : deux journaux peuvent porter le même cuid. */
  id: string;
  source: SourceCorrespondance;
  sens: SensCorrespondance;
  etat: EtatCorrespondance;
  /** ISO 8601. Toujours renseignée : voir `dateDeSecours`. */
  date: string;
  objet: string;
  /** Destinataire pour un sortant, contrepartie pour une ligne saisie. */
  interlocuteur: string;
  /** Qui du cabinet a envoyé. `null` pour un envoi planifié ou une saisie. */
  auteur: string | null;
  /** Complément court : numéro de facture, type de communication. */
  detail: string | null;
  /** `null` quand la source ne le sait pas. Zéro et « inconnu » ne sont pas
   *  la même chose, et l'écran doit pouvoir les distinguer. */
  nbPieces: number | null;
  /** Motif d'échec, tel que le journal l'a enregistré. */
  erreur: string | null;
  /** Le dossier d'où part la communication. `null` dans la vue d'un dossier,
   *  où le rappeler à chaque ligne serait du bruit. Rempli dans la vue cabinet,
   *  où c'est l'information qui situe la ligne. */
  dossier: DossierDeLEntree | null;
}

export interface DossierDeLEntree {
  id: string;
  intitule: string;
  numero: string | null;
}

/** Forme brute renvoyée par Prisma pour le dossier lié. */
export interface DossierLie {
  id: string;
  intitule: string;
  numeroDossier: string | null;
}

function normaliserDossier(d: DossierLie | null | undefined): DossierDeLEntree | null {
  if (!d) return null;
  return { id: d.id, intitule: d.intitule, numero: d.numeroDossier };
}

/* ── Formes d'entrée ─────────────────────────────────────────────────────────
 * Volontairement structurelles et non importées de `@prisma/client` : ce
 * module doit rester testable sans client Prisma généré. */

export interface LigneJournalFacture {
  id: string;
  subject: string;
  recipientEmail: string;
  status: string;
  errorMessage: string | null;
  attachmentName: string | null;
  sentAt: Date | null;
  createdAt: Date;
  invoice: { numero: string | null } | null;
  sentBy: { nom: string | null } | null;
  dossier?: DossierLie | null;
}

export interface LigneJournalNotification {
  id: string;
  type: string;
  subject: string;
  sentTo: string;
  status: string;
  sentAt: Date;
  /** JSON en `String` dans le schéma. Illisible en base, donc analysé ici. */
  metadata: string | null;
  dossier?: DossierLie | null;
}

export interface LigneCorrespondanceSaisie {
  id: string;
  typeCommunication: string;
  titre: string | null;
  expediteur: string | null;
  destinataire: string | null;
  dateCommunication: Date | null;
  createdAt: Date;
  dossier?: DossierLie | null;
}

export interface SourcesChronologie {
  facturesEnvoyees: LigneJournalFacture[];
  notifications: LigneJournalNotification[];
  saisies: LigneCorrespondanceSaisie[];
}

/**
 * Nombre de pièces jointes noté dans `NotificationLog.metadata`.
 *
 * Le champ est du JSON stocké en `String` : non interrogeable, non indexé, et
 * pas garanti bien formé. Un JSON cassé ne doit pas faire disparaître la ligne
 * de la chronologie, donc on rend `null` et l'écran dira « pièces inconnues ».
 */
export function nbPiecesDepuisMetadata(metadata: string | null): number | null {
  if (!metadata) return null;
  try {
    const parsed = JSON.parse(metadata) as Record<string, unknown>;
    const brut = parsed?.attachmentCount;
    if (typeof brut === "number" && Number.isFinite(brut) && brut >= 0) {
      return Math.floor(brut);
    }
    if (Array.isArray(parsed?.richDocumentIds)) {
      return (parsed.richDocumentIds as unknown[]).length;
    }
    return null;
  } catch {
    return null;
  }
}

/** `sent` est la seule valeur qui vaut « parti ». Tout le reste est un échec,
 *  y compris une valeur inconnue : afficher un envoi douteux comme réussi
 *  serait exactement l'erreur que la chronologie doit empêcher. */
function etatDepuisStatut(status: string): EtatCorrespondance {
  return status === "sent" ? "envoye" : "echec";
}

/** Une ligne sans date reste dans la chronologie, à sa date de création. Une
 *  correspondance qu'on cache parce qu'on ignore sa date est une preuve perdue. */
function dateDeSecours(principale: Date | null, secours: Date): string {
  return (principale ?? secours).toISOString();
}

/** Le type technique de `NotificationLog` n'est pas montrable. */
function sourceDepuisTypeNotification(type: string): SourceCorrespondance {
  return type === "document_send" ? "document" : "notification";
}

function libelleTypeSaisie(type: string): string {
  return type.replace(/_/g, " ").trim();
}

/**
 * Fusionne les trois journaux en une seule chronologie, du plus récent au plus
 * ancien. Pure : aucune lecture, aucune horloge, aucun effet.
 *
 * Départage des dates égales par identifiant, pour que deux rendus successifs
 * donnent le même ordre. Une liste qui se réordonne toute seule entre deux
 * chargements donne l'impression que le dossier bouge.
 */
export function fusionnerChronologie(sources: SourcesChronologie): EntreeCorrespondance[] {
  const entrees: EntreeCorrespondance[] = [];

  for (const l of sources.facturesEnvoyees) {
    entrees.push({
      id: `facture:${l.id}`,
      source: "facture",
      sens: "sortant",
      etat: etatDepuisStatut(l.status),
      date: dateDeSecours(l.sentAt, l.createdAt),
      objet: l.subject,
      interlocuteur: l.recipientEmail,
      auteur: l.sentBy?.nom ?? null,
      detail: l.invoice?.numero ? `Facture ${l.invoice.numero}` : "Facture",
      // Le journal ne compte pas les pièces, il nomme la principale. Une pièce
      // nommée vaut au moins une pièce ; on ne prétend pas en savoir plus.
      nbPieces: l.attachmentName ? 1 : null,
      erreur: l.errorMessage,
      dossier: normaliserDossier(l.dossier),
    });
  }

  for (const l of sources.notifications) {
    entrees.push({
      id: `notification:${l.id}`,
      source: sourceDepuisTypeNotification(l.type),
      sens: "sortant",
      etat: etatDepuisStatut(l.status),
      date: l.sentAt.toISOString(),
      objet: l.subject,
      interlocuteur: l.sentTo,
      auteur: null,
      detail: null,
      nbPieces: nbPiecesDepuisMetadata(l.metadata),
      erreur: null,
      dossier: normaliserDossier(l.dossier),
    });
  }

  for (const l of sources.saisies) {
    entrees.push({
      id: `saisie:${l.id}`,
      source: "saisie",
      sens: "saisi",
      etat: "saisi",
      date: dateDeSecours(l.dateCommunication, l.createdAt),
      objet: l.titre?.trim() || libelleTypeSaisie(l.typeCommunication),
      interlocuteur: l.destinataire?.trim() || l.expediteur?.trim() || "",
      auteur: l.expediteur?.trim() || null,
      detail: libelleTypeSaisie(l.typeCommunication),
      nbPieces: null,
      erreur: null,
      dossier: normaliserDossier(l.dossier),
    });
  }

  return entrees.sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return a.id < b.id ? 1 : -1;
  });
}
