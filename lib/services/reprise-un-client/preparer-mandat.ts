/**
 * Étapes 1 et 2 de « Reprendre un client » : obtenir un client et un mandat
 * sur lesquels verser les factures.
 *
 * Appelé au moment où Aaliyah enregistre sa PREMIÈRE facture (décision CEO du
 * 2026-09-30, Q2) : rien n'est créé tant qu'elle n'a rien validé. Les factures
 * suivantes reçoivent les identifiants déjà obtenus et ne repassent pas ici.
 *
 * Trois cas, et un seul qui crée une fiche :
 *
 *   - client existant + mandat existant : on vérifie qu'ils appartiennent au
 *     cabinet et l'un à l'autre, et on ne touche à rien ;
 *   - client existant + nouveau mandat : on crée le dossier SEUL. On ne passe
 *     surtout pas par `enregistrerEntreeClient` avec un `clientId` : ce chemin
 *     réécrit toute la fiche, champs vides compris, et effacerait les
 *     coordonnées d'un client que le cabinet connaît déjà ;
 *   - nouveau client + nouveau mandat : c'est exactement l'Entrée d'un client,
 *     on réutilise son service tel quel.
 */

import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/services/audit";
import {
  EntreeClientError,
  ecrireSoldeOuverture,
  enregistrerEntreeClient,
  type EcheanceEntree,
  type FondsDetenusEntree,
  type IdentiteClientEntree,
  type PartieEntree,
  type VerificationIdentiteEntree,
} from "@/lib/services/entree-client/enregistrer-entree-client";

export interface NouveauMandat {
  intitule: string;
  objetDuMandat?: string | null;
  tauxHoraire?: number | null;
  enCours: boolean;
  dateOuverture?: Date | null;
  avocatResponsableId?: string | null;
}

/** Les sections « si applicable » de l'étape 2. Toutes facultatives. */
export interface SectionsMandat {
  verificationIdentite?: VerificationIdentiteEntree | null;
  fondsDetenus?: FondsDetenusEntree | null;
  echeances?: EcheanceEntree[];
  parties?: PartieEntree[];
}

export interface PreparerMandatParams {
  cabinetId: string;
  utilisateurId: string;
  client: { id: string } | { nouveau: IdentiteClientEntree };
  mandat: { id: string } | { nouveau: NouveauMandat };
  /** La personne a déclaré avoir vérifié les conflits. Daté et signé à son nom. */
  conflitsVerifies?: boolean;
  sections?: SectionsMandat;
}

export interface PreparerMandatResultat {
  clientId: string;
  dossierId: string;
  clientCree: boolean;
  dossierCree: boolean;
}

export class PreparerMandatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PreparerMandatError";
  }
}

async function verifierAvocat(cabinetId: string, avocatId: string | null | undefined): Promise<string | null> {
  if (!avocatId) return null;
  const avocat = await prisma.user.findFirst({ where: { id: avocatId, cabinetId }, select: { id: true } });
  if (!avocat) throw new PreparerMandatError("L'avocat responsable choisi n'appartient pas à ce cabinet.");
  return avocat.id;
}

export async function preparerClientEtMandat(params: PreparerMandatParams): Promise<PreparerMandatResultat> {
  const { cabinetId, utilisateurId } = params;
  const sections = params.sections ?? {};

  /* ── Client existant ─────────────────────────────────────────────────── */
  if ("id" in params.client) {
    const client = await prisma.client.findFirst({
      where: { id: params.client.id, cabinetId },
      select: { id: true },
    });
    if (!client) throw new PreparerMandatError("Ce client n'appartient pas à ce cabinet.");

    // … et mandat existant : rien à écrire.
    if ("id" in params.mandat) {
      const dossier = await prisma.dossier.findFirst({
        where: { id: params.mandat.id, cabinetId },
        select: { id: true, clientId: true },
      });
      if (!dossier) throw new PreparerMandatError("Ce mandat n'appartient pas à ce cabinet.");
      if (dossier.clientId !== client.id) {
        throw new PreparerMandatError("Ce mandat appartient à un autre client.");
      }
      return { clientId: client.id, dossierId: dossier.id, clientCree: false, dossierCree: false };
    }

    // … et nouveau mandat : le dossier seul, la fiche du client intacte.
    const nouveau = params.mandat.nouveau;
    if (!nouveau.intitule?.trim()) throw new PreparerMandatError("Le mandat doit porter un intitulé.");
    if (sections.fondsDetenus && !(sections.fondsDetenus.montant > 0)) {
      throw new PreparerMandatError("Un solde détenu doit être strictement positif.");
    }
    const avocatId = await verifierAvocat(cabinetId, nouveau.avocatResponsableId);
    const maintenant = new Date();

    const dossierId = await prisma.$transaction(async (db) => {
      const dossier = await db.dossier.create({
        data: {
          cabinetId,
          clientId: client.id,
          intitule: nouveau.intitule.trim(),
          statut: nouveau.enCours ? "actif" : "cloture",
          tauxHoraire: nouveau.tauxHoraire ?? null,
          dateOuverture: nouveau.dateOuverture ?? maintenant,
          dateCloture: nouveau.enCours ? null : maintenant,
          descriptionConfidentielle: nouveau.objetDuMandat?.trim() || null,
          avocatResponsableId: avocatId,
        },
        select: { id: true },
      });
      for (const echeance of sections.echeances ?? []) {
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
      for (const partie of sections.parties ?? []) {
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
      if (sections.fondsDetenus) {
        await ecrireSoldeOuverture(db, {
          cabinetId,
          clientId: client.id,
          dossierId: dossier.id,
          utilisateurId,
          fonds: sections.fondsDetenus,
        });
      }
      return dossier.id;
    });

    await createAuditLog({
      cabinetId,
      userId: utilisateurId,
      entityType: "Dossier",
      entityId: dossierId,
      action: "create",
      metadata: { source: "reprise_un_client", clientId: client.id },
    });
    return { clientId: client.id, dossierId, clientCree: false, dossierCree: true };
  }

  /* ── Nouveau client ──────────────────────────────────────────────────── */
  if ("id" in params.mandat) {
    throw new PreparerMandatError("Un nouveau client ne peut pas avoir de mandat existant.");
  }
  const nouveau = params.mandat.nouveau;
  const avocatId = await verifierAvocat(cabinetId, nouveau.avocatResponsableId);
  const maintenant = new Date();

  try {
    const r = await enregistrerEntreeClient({
      cabinetId,
      utilisateurId,
      clientId: null,
      identite: params.client.nouveau,
      dossier: {
        intitule: nouveau.intitule,
        enCours: nouveau.enCours,
        tauxHoraire: nouveau.tauxHoraire ?? null,
        objetDuMandat: nouveau.objetDuMandat ?? null,
        dateOuverture: nouveau.dateOuverture ?? null,
        avocatResponsableId: avocatId,
      },
      conflitsVerifieAt: params.conflitsVerifies ? maintenant : null,
      verificationIdentite: sections.verificationIdentite ?? { etat: "A_FAIRE" },
      fondsDetenus: sections.fondsDetenus ?? null,
      echeances: sections.echeances ?? [],
      parties: sections.parties ?? [],
      terminee: true,
    });
    return { clientId: r.clientId, dossierId: r.dossierId, clientCree: true, dossierCree: true };
  } catch (err) {
    if (err instanceof EntreeClientError) throw new PreparerMandatError(err.message);
    throw err;
  }
}
