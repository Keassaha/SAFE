/**
 * SAFE — Enregistrement d'une entrée de client.
 *
 * Écrit d'un seul coup ce que l'écran d'entrée a recueilli : la fiche, son
 * dossier, les déclarations du cabinet (mandat, conflits), la vérification
 * d'identité, les échéances, les parties, et le solde détenu en fidéicommis.
 *
 * Les calculs (« ce qui reste ouvert », l'écart de fidéicommis) vivent dans
 * `lib/clients/entree-client.ts`, module pur et testé sans base.
 *
 * ── Trois décisions qui expliquent la forme de ce fichier ───────────────────
 *
 * **Une seule transaction.** Un client à moitié entré, avec sa fiche mais sans
 * son solde de fidéicommis, serait pire que pas de client du tout : le
 * registre balancerait faux et personne ne saurait pourquoi. Tout passe, ou
 * rien ne passe.
 *
 * **Rien n'est obligatoire.** Aucun champ ne fait échouer l'enregistrement,
 * hormis ceux sans lesquels une ligne n'existe pas (un nom, un intitulé de
 * dossier). Ce qui manque se lit ensuite sur la fiche. Un cabinet qui entre
 * trente clients un soir abandonne au troisième refus.
 *
 * **Le solde d'ouverture n'est pas un dépôt.** Il ne passe pas par
 * `createTrustDeposit`, et ce n'est pas un raccourci : voir le long
 * commentaire devant `ecrireSoldeOuverture`.
 */

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/services/audit";
import { elementsOuverts, type EtatIdentite, type FicheEntree } from "@/lib/clients/entree-client";

/* ════════════════════════════════════════════════════════════════
   ENTRÉES
   ════════════════════════════════════════════════════════════════ */

export interface IdentiteClientEntree {
  typeClient: "personne_physique" | "personne_morale";
  prenom?: string | null;
  nom?: string | null;
  raisonSociale?: string | null;
  occupation?: string | null;
  natureActivites?: string | null;
  email?: string | null;
  telephone?: string | null;
  langue?: string | null;
}

export interface DossierEntree {
  intitule: string;
  /** Dossier en cours, ou affaire terminée. Décide du statut ET de ce qu'on réclame. */
  enCours: boolean;
  tauxHoraire?: number | null;
  objetDuMandat?: string | null;
}

export interface VerificationIdentiteEntree {
  etat: EtatIdentite;
  faiteLe?: Date | null;
  /** Pièce vue : « permis de conduire », « passeport ». Champ libre, comme le règlement. */
  pieceVue?: string | null;
  /**
   * Où la copie est conservée. L'art. 22 B-1 r.5 exige que la pièce soit
   * consignée au dossier, PAS qu'elle vive dans SAFE. Un cabinet qui garde ses
   * copies au classeur est conforme, à condition de dire où chercher.
   */
  ouConservee?: string | null;
  /** Motif d'exemption invoqué (B-1 r.5 art. 21), quand l'état est EXEMPTEE. */
  motifExemption?: string | null;
}

export interface EcheanceEntree {
  date: Date;
  libelle: string;
}

export interface PartieEntree {
  nomAffiche: string;
  role: "partie_adverse" | "tiers";
}

export interface FondsDetenusEntree {
  montant: number;
  /** Date du relevé sur lequel le cabinet lit ce solde. */
  arreteAu: Date;
  /** « Provision sur honoraires », « fonds de clôture »... Champ libre. */
  recuATitreDe?: string | null;
}

export interface EnregistrerEntreeClientParams {
  cabinetId: string;
  /** Auteur des déclarations. C'est son nom qui sera opposé à l'inspection. */
  utilisateurId: string;
  /** Reprise d'une fiche mise de côté. `null` pour une création. */
  clientId?: string | null;

  identite: IdentiteClientEntree;
  dossier: DossierEntree;

  mandatEnvoyeAt?: Date | null;
  mandatSigneAt?: Date | null;
  mandatVerseAuDossierAt?: Date | null;
  conflitsVerifieAt?: Date | null;
  conflitsNotes?: string | null;
  consentementAt?: Date | null;

  verificationIdentite: VerificationIdentiteEntree;
  fondsDetenus?: FondsDetenusEntree | null;
  echeances?: EcheanceEntree[];
  /** Le cabinet confirme qu'aucune échéance ne court. Distinct de « je n'ai rien saisi ». */
  aucuneDateConfirmee?: boolean;
  parties?: PartieEntree[];

  /**
   * `true` = « Enregistrer et passer au suivant ». `false` = « Mettre de côté ».
   * Une entrée mise de côté reste dans la file et se rouvre là où elle s'est
   * arrêtée. C'est le cabinet qui déclare avoir fini, jamais un compteur de
   * champs remplis : il connaît ses dossiers mieux que nous.
   */
  terminee: boolean;
}

export interface EnregistrerEntreeClientResult {
  clientId: string;
  dossierId: string;
  /** Identifiant de l'écriture d'ouverture, si un solde a été déclaré. */
  soldeOuvertureId: string | null;
  /** Ce qui reste ouvert sur la fiche après enregistrement. Jamais bloquant. */
  elementsOuverts: ReturnType<typeof elementsOuverts>;
}

export class EntreeClientError extends Error {
  constructor(
    public readonly code: "NOM_MANQUANT" | "INTITULE_MANQUANT" | "MONTANT_INVALIDE" | "CLIENT_INTROUVABLE",
    message: string,
  ) {
    super(message);
    this.name = "EntreeClientError";
  }
}

/* ════════════════════════════════════════════════════════════════
   VALIDATION MINIMALE
   ════════════════════════════════════════════════════════════════ */

function nomAffichable(identite: IdentiteClientEntree): string | null {
  const societe = identite.raisonSociale?.trim();
  if (societe) return societe;
  const personne = [identite.prenom, identite.nom].map((v) => v?.trim()).filter(Boolean).join(" ");
  return personne.length > 0 ? personne : null;
}

/**
 * Le strict nécessaire pour qu'une ligne existe, et rien de plus.
 *
 * Un client sans nom ne peut pas être cherché, donc pas être recherché en
 * conflit : c'est la seule exigence qui protège quelque chose de réel. Un
 * solde négatif est refusé parce qu'un fidéicommis débiteur n'est pas une
 * donnée à consigner, c'est une anomalie à corriger ailleurs.
 */
function valider(params: EnregistrerEntreeClientParams): void {
  if (!nomAffichable(params.identite)) {
    throw new EntreeClientError("NOM_MANQUANT", "Un client doit porter un nom ou une raison sociale.");
  }
  if (!params.dossier.intitule?.trim()) {
    throw new EntreeClientError("INTITULE_MANQUANT", "Le dossier doit porter un intitulé.");
  }
  const fonds = params.fondsDetenus;
  if (fonds && !(fonds.montant > 0)) {
    throw new EntreeClientError(
      "MONTANT_INVALIDE",
      "Un solde détenu doit être strictement positif. Pour ne rien détenir, ne déclarez pas de fonds.",
    );
  }
}

/* ════════════════════════════════════════════════════════════════
   SOLDE D'OUVERTURE EN FIDÉICOMMIS
   ════════════════════════════════════════════════════════════════ */

/**
 * Écrit le solde détenu à l'arrivée comme une écriture d'OUVERTURE.
 *
 * ── Pourquoi ce chemin, et pas `createTrustDeposit` ─────────────────────────
 *
 * Le service de dépôt porte trois garde-fous, et les trois sont FAUX ici :
 *
 *   1. il vérifie le seuil des espèces. Or aucune espèce n'entre : l'argent
 *      est au compte depuis des mois, on ne fait que le déclarer ;
 *   2. il REFUSE le dépôt si l'identité du client n'est pas vérifiée. Appliqué
 *      à la reprise, ce refus produirait l'inverse de son but : le cabinet,
 *      empêché de déclarer l'argent qu'il détient réellement, entrerait ses
 *      clients sans leur solde, et le registre du fidéicommis serait faux
 *      pour de bon. Consigner la réalité est toujours juste ; c'est l'absence
 *      de vérification qui doit se voir, pas la somme qui doit disparaître.
 *      Elle se voit : `elementsOuverts` la classe en tête des manquements ;
 *   3. il écrit au journal comptable une recette `DEPOT_FIDEICOMMIS`. Ce
 *      serait une fausseté datée : rien n'est entré au compte ce jour-là. Le
 *      rapprochement bancaire du mois chercherait ensuite à la banque une
 *      opération qui n'a jamais eu lieu.
 *
 * L'écriture compte en revanche pleinement dans le solde du client, sinon sa
 * carte ne balancerait pas. D'où `estSoldeOuverture` : elle pèse dans les
 * soldes, elle ne ment pas sur son origine.
 */
async function ecrireSoldeOuverture(
  db: Prisma.TransactionClient,
  params: {
    cabinetId: string;
    clientId: string;
    dossierId: string;
    utilisateurId: string;
    fonds: FondsDetenusEntree;
  },
): Promise<string> {
  const { cabinetId, clientId, dossierId, utilisateurId, fonds } = params;

  // Le compte-client de fidéicommis (carte-client de l'art. 39) est créé s'il
  // n'existe pas. Un `upsert` plutôt qu'un `create` : reprendre une fiche mise
  // de côté ne doit pas produire un second compte pour le même dossier.
  const trustAccount = await db.trustAccount.upsert({
    where: { cabinetId_clientId_matterId: { cabinetId, clientId, matterId: dossierId } },
    update: {},
    create: { cabinetId, clientId, matterId: dossierId, currentBalance: 0 },
  });

  const ecriture = await db.trustTransaction.create({
    data: {
      cabinetId,
      trustAccountId: trustAccount.id,
      clientId,
      dossierId,
      date: fonds.arreteAu,
      amount: fonds.montant,
      type: "deposit",
      balanceAfter: fonds.montant,
      estSoldeOuverture: true,
      purposeText: fonds.recuATitreDe ?? null,
      description: "Solde d'ouverture déclaré à l'entrée du client dans SAFE",
      note: `Déclaré par le cabinet, arrêté au ${fonds.arreteAu.toISOString().slice(0, 10)}. Aucun mouvement de fonds à cette date.`,
      createdById: utilisateurId,
    },
  });

  await db.trustAccount.update({
    where: { id: trustAccount.id },
    data: { currentBalance: fonds.montant },
  });
  await db.dossier.update({
    where: { id: dossierId },
    data: { soldeFiducieDossier: fonds.montant },
  });

  return ecriture.id;
}

/* ════════════════════════════════════════════════════════════════
   ENREGISTREMENT
   ════════════════════════════════════════════════════════════════ */

export async function enregistrerEntreeClient(
  params: EnregistrerEntreeClientParams,
): Promise<EnregistrerEntreeClientResult> {
  valider(params);

  const { cabinetId, utilisateurId } = params;
  const maintenant = new Date();
  const identiteVerifiee = params.verificationIdentite.etat === "VERIFIEE";

  const resultat = await prisma.$transaction(async (db) => {
    /* ── La fiche client ───────────────────────────────────────────────── */
    const champsClient = {
      typeClient: params.identite.typeClient,
      prenom: params.identite.prenom?.trim() || null,
      nom: params.identite.nom?.trim() || null,
      raisonSociale: params.identite.raisonSociale?.trim() || null,
      occupation: params.identite.occupation?.trim() || null,
      natureActivites: params.identite.natureActivites?.trim() || null,
      email: params.identite.email?.trim() || null,
      telephone: params.identite.telephone?.trim() || null,
      langue: params.identite.langue?.trim() || null,

      // Les déclarations, chacune avec son auteur. Une case cochée sans nom
      // n'engage personne et ne vaut rien à l'inspection.
      mandatEnvoyeAt: params.mandatEnvoyeAt ?? null,
      mandatEnvoyeDeclareParId: params.mandatEnvoyeAt ? utilisateurId : null,
      retainerSigned: Boolean(params.mandatSigneAt),
      retainerDate: params.mandatSigneAt ?? null,
      mandatSigneDeclareParId: params.mandatSigneAt ? utilisateurId : null,
      mandatVerseAuDossierAt: params.mandatVerseAuDossierAt ?? null,
      mandatVerseDeclareParId: params.mandatVerseAuDossierAt ? utilisateurId : null,

      conflictChecked: Boolean(params.conflitsVerifieAt),
      conflictCheckDate: params.conflitsVerifieAt ?? null,
      conflictDeclareParId: params.conflitsVerifieAt ? utilisateurId : null,
      conflictNotes: params.conflitsNotes?.trim() || null,

      consentementCollecteAt: params.consentementAt ?? null,

      identityVerified: identiteVerifiee,
      dateVerificationIdentite: params.verificationIdentite.faiteLe ?? null,
      methodeVerificationIdentite: params.verificationIdentite.pieceVue?.trim() || null,
      identityExemption:
        params.verificationIdentite.etat === "EXEMPTEE"
          ? params.verificationIdentite.motifExemption?.trim() || null
          : null,

      entreeCompleteeAt: params.terminee ? maintenant : null,
    };

    let clientId: string;
    if (params.clientId) {
      const existant = await db.client.findFirst({
        where: { id: params.clientId, cabinetId },
        select: { id: true },
      });
      if (!existant) {
        throw new EntreeClientError("CLIENT_INTROUVABLE", "Cette fiche n'appartient pas à ce cabinet.");
      }
      await db.client.update({ where: { id: params.clientId }, data: champsClient });
      clientId = params.clientId;
    } else {
      const cree = await db.client.create({
        data: {
          cabinetId,
          ...champsClient,
          // Marque la fiche comme issue du processus d'entrée. Sans elle, les
          // clients créés autrement se compteraient dans la file de reprise.
          entreeCommenceeAt: maintenant,
        },
        select: { id: true },
      });
      clientId = cree.id;
    }

    /* ── Le dossier ────────────────────────────────────────────────────── */
    // Un dossier par entrée. Un client qui en a plusieurs se reprend autant de
    // fois : c'est plus long, mais ça ne demande à personne de tenir deux
    // affaires en tête pendant qu'il saisit.
    const dossier = await db.dossier.create({
      data: {
        cabinetId,
        clientId,
        intitule: params.dossier.intitule.trim(),
        statut: params.dossier.enCours ? "actif" : "cloture",
        tauxHoraire: params.dossier.tauxHoraire ?? null,
        dateOuverture: params.mandatSigneAt ?? params.mandatEnvoyeAt ?? maintenant,
        dateCloture: params.dossier.enCours ? null : maintenant,
        descriptionConfidentielle: params.dossier.objetDuMandat?.trim() || null,
      },
      select: { id: true },
    });

    /* ── La vérification d'identité, comme pièce datée ─────────────────── */
    // La fiche porte l'état courant ; cette ligne porte la trace. Les deux sont
    // nécessaires : l'état sert aux écrans, la trace sert à l'inspection.
    if (params.verificationIdentite.etat !== "A_FAIRE") {
      await db.clientIdentityVerification.create({
        data: {
          clientId,
          date: params.verificationIdentite.faiteLe ?? maintenant,
          methode: params.verificationIdentite.pieceVue?.trim() || "Déclarée à l'entrée dans SAFE",
          statut: identiteVerifiee ? "verifie" : "en_attente",
          // La copie reste chez le cabinet : c'est une attestation, pas une
          // pièce que SAFE détient. Prétendre le contraire serait faux.
          proofMode: "ATTESTATION_MANUELLE",
          proofLocation: params.verificationIdentite.ouConservee?.trim() || null,
          attestedById: utilisateurId,
          attestedAt: maintenant,
          verifiedById: utilisateurId,
          notes:
            params.verificationIdentite.etat === "EXEMPTEE"
              ? `Exemption invoquée : ${params.verificationIdentite.motifExemption ?? "non précisée"}`
              : null,
        },
      });
    }

    /* ── Les échéances ─────────────────────────────────────────────────── */
    for (const echeance of params.echeances ?? []) {
      await db.dossierReminder.create({
        data: {
          cabinetId,
          dossierId: dossier.id,
          type: "echeance_reprise",
          message: echeance.libelle.trim(),
          dueDate: echeance.date,
        },
      });
    }

    /* ── Les autres parties ────────────────────────────────────────────── */
    // Une partie adverse ne devient JAMAIS une fiche Client : son nom seul est
    // consigné. C'est ce qui permet à la recherche de conflits de la trouver
    // sans que la Loi 25 ait à s'appliquer à quelqu'un qu'on ne représente pas.
    for (const partie of params.parties ?? []) {
      await db.dossierPartie.create({
        data: {
          cabinetId,
          dossierId: dossier.id,
          nature: "partie_externe",
          role: partie.role,
          nomAffiche: partie.nomAffiche.trim(),
        },
      });
    }

    /* ── Le solde détenu ───────────────────────────────────────────────── */
    const soldeOuvertureId = params.fondsDetenus
      ? await ecrireSoldeOuverture(db, {
          cabinetId,
          clientId,
          dossierId: dossier.id,
          utilisateurId,
          fonds: params.fondsDetenus,
        })
      : null;

    return { clientId, dossierId: dossier.id, soldeOuvertureId };
  });

  /* ── Piste d'audit, hors transaction ───────────────────────────────────
   * L'audit ne doit jamais faire échouer l'écriture métier qu'il observe.
   * Le poser dans la transaction ferait perdre une entrée complète pour un
   * incident de journalisation. */
  await createAuditLog({
    cabinetId,
    userId: utilisateurId,
    entityType: "Client",
    entityId: resultat.clientId,
    action: params.clientId ? "update" : "create",
    newValues: {
      source: "entree_client",
      dossierId: resultat.dossierId,
      terminee: params.terminee,
      soldeOuvertureDeclare: params.fondsDetenus?.montant ?? null,
    },
    performedBy: utilisateurId,
    performedAt: maintenant,
  });

  const fiche: FicheEntree = {
    dossierEnCours: params.dossier.enCours,
    mandat: {
      envoyeAt: params.mandatEnvoyeAt ?? null,
      signeAt: params.mandatSigneAt ?? null,
      verseAuDossierAt: params.mandatVerseAuDossierAt ?? null,
    },
    conflitsVerifieAt: params.conflitsVerifieAt ?? null,
    identite: params.verificationIdentite.etat,
    consentementAt: params.consentementAt ?? null,
    fondsDetenus: params.fondsDetenus
      ? { montant: params.fondsDetenus.montant, arreteAu: params.fondsDetenus.arreteAu }
      : null,
    nombreDatesQuiCourent: params.echeances?.length ?? 0,
    aucuneDateConfirmee: params.aucuneDateConfirmee ?? false,
  };

  return { ...resultat, elementsOuverts: elementsOuverts(fiche) };
}
