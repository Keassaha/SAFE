import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/services/audit";
import { derivePaymentStatus } from "@/lib/billing/payment-status";
import { writeJournalForIssuedInvoice, writeJournalForPayment } from "@/lib/services/journal/billing-journal";
import { writeJournalForDeboursPaiement } from "@/lib/services/journal/debours-dossier-journal";
import { getPeriodeFromDate, isPeriodLocked } from "@/lib/services/journal/period-lock";
import type { FactureRepriseSaisie, StatutPaiementReprise } from "@/lib/services/reprise-historique/construire-lot";
import { cleCroisement } from "@/lib/clients/croisement-conflits";
import { normaliseIntitule } from "@/lib/services/reprise-historique/matcher";

/**
 * Écrit une facture d'un exercice précédent, confirmée à l'écran : client et
 * dossier si nouveaux, la facture et ses lignes, une entrée de temps (ligne
 * horaire) ou une tâche de registre (ligne forfaitaire) marquées facturées pour
 * ne jamais revenir en facturation, un débours par ligne de frais, un paiement
 * si la facture est payée ou partielle, et les écritures au journal général.
 *
 * Doctrine (mémoire project_entree_client_reprise) :
 * - Le fidéicommis reste HORS de ce lot : aucune `TrustTransaction` ici.
 * - **La comptabilité est mise à jour** (décision CEO 2026-09-16, qui renverse
 *   celle du matin même). Une facture passée et son encaissement sont des
 *   mouvements RÉELS, survenus à une date réelle : les livres de l'exercice
 *   repris doivent les montrer. C'est ce qui les distingue du solde d'ouverture
 *   de fidéicommis, qui est un solde que personne n'a déplacé.
 *   Les écritures portent donc leur vraie date passée, ce que
 *   `writeJournalForIssuedInvoice` / `writeJournalForPayment` font déjà.
 * - On n'utilise toujours PAS `createPayment` : son avantage était justement
 *   d'écrire au journal, ce qu'on fait maintenant nous-mêmes, et il porte en
 *   plus des garde-fous du jour (identité vérifiée, soldes) qui n'ont pas de
 *   sens sur un encaissement d'il y a six mois.
 * - Une période comptable verrouillée reste souveraine : la facture datée d'un
 *   mois clos est refusée, avec son mois nommé, et les autres du lot passent.
 * - Le statut de paiement est celui choisi par l'utilisateur, jamais deviné.
 */

/**
 * La pièce déposée, déjà écrite sur le stockage. Son empreinte est enregistrée
 * DANS la même transaction que la facture : c'est elle qui interdit le second
 * versement du même papier, donc elle ne peut pas être « au mieux ».
 */
export interface PieceSourceReprise {
  hash: string;
  documentType: string;
  nom: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
  dateDocument: Date | null;
}

export interface VerserFactureParams {
  cabinetId: string;
  userId: string;
  facture: FactureRepriseSaisie;
  /** Requis si `statutPaiement` est "payee" ou "partielle". */
  montantPaye: number | null;
  /**
   * Absente quand le cabinet tape une facture dont il n'a aucun scan (décision
   * CEO 2026-09-21). La facture est alors marquée « sans pièce » : l'anti-doublon
   * par empreinte ne peut pas jouer, c'est la règle numéro + client qui tient.
   */
  piece?: PieceSourceReprise;
}

export interface VerserFactureResultat {
  factureId: string; // id côté écran (FactureRepriseSaisie.id), pour relier le résultat à la carte
  invoiceId: string;
  clientId: string;
  dossierId: string;
  clientCree: boolean;
  dossierCree: boolean;
  documentId: string | null;
}

export class VerserFactureError extends Error {
  constructor(
    public readonly factureId: string,
    message: string,
  ) {
    super(message);
  }
}

function toDate(iso: string | null, repli: Date): Date {
  if (!iso) return repli;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? repli : d;
}

/** Deux décimales, pour que les totaux du papier se retrouvent au sou près. */
function arrondir(montant: number): number {
  return Math.round(montant * 100) / 100;
}

/** Numéro de repli quand la facture source n'en porte aucun de lisible. */
function numeroRepli(): string {
  return `REPRISE-${randomUUID()}`;
}

/** Refuse cette facture-là si le mois visé est clos. Les autres du lot passent. */
async function refuserSiPeriodeVerrouillee(
  cabinetId: string,
  factureId: string,
  date: Date,
  quoi: string,
): Promise<void> {
  const periode = getPeriodeFromDate(date);
  if (await isPeriodLocked(cabinetId, periode)) {
    throw new VerserFactureError(
      factureId,
      `${quoi} de ${periode}, un mois déjà clos en comptabilité. Rouvrez la période ou corrigez la date avant de verser cette facture.`,
    );
  }
}

function resolveMontantPaye(
  statut: StatutPaiementReprise,
  montantTotal: number,
  montantPayeSaisi: number | null,
): number {
  if (statut === "payee") return montantTotal;
  if (statut === "partielle") {
    if (montantPayeSaisi === null || montantPayeSaisi <= 0) {
      throw new Error("Le montant payé est requis pour une facture partielle.");
    }
    return Math.min(montantPayeSaisi, montantTotal);
  }
  return 0;
}

export async function verserFactureReprise(
  params: VerserFactureParams,
): Promise<VerserFactureResultat> {
  const { cabinetId, userId, facture, montantPaye, piece } = params;
  const { extraction, match, statutPaiement } = facture;

  if (!statutPaiement) {
    throw new VerserFactureError(facture.id, "Statut de paiement non choisi.");
  }
  if (extraction.montantTotal === null) {
    throw new VerserFactureError(
      facture.id,
      "Montant total illisible sur la facture : à corriger avant de verser.",
    );
  }
  const montantTotal = extraction.montantTotal;
  const dateEmission = toDate(extraction.dateEmission, new Date());
  const lignesAvecMontant = extraction.lignes.filter((l) => l.montant !== null);

  // ── Périodes verrouillées ─────────────────────────────────────────────────
  // Le journal refuse toute écriture datée dans un mois clos. On le dit ici,
  // en nommant le mois et la pièce, plutôt que de laisser remonter l'erreur
  // brute du service à la fin d'une transaction annulée.
  await refuserSiPeriodeVerrouillee(cabinetId, facture.id, dateEmission, "La facture est datée");
  if (statutPaiement !== "impayee" && facture.datePaiement) {
    await refuserSiPeriodeVerrouillee(
      cabinetId,
      facture.id,
      toDate(facture.datePaiement, dateEmission),
      "Le paiement est daté",
    );
  }

  const resultat = await prisma.$transaction(async (tx) => {
    // ── Le même papier, deux fois ─────────────────────────────────────────
    // Le contrôle fait à l'analyse ne vaut que pour l'instant où il a été fait :
    // entre l'analyse et le clic il peut s'écouler une heure, un second onglet,
    // un second dépôt. C'est ici, dans la transaction qui écrit, que la question
    // doit être reposée. Sans quoi la facture, ses heures, ses débours, son
    // paiement et ses trois écritures au journal repassent une seconde fois.
    const dejaVerse = piece
      ? await tx.document.findFirst({
          where: { cabinetId, documentType: piece.documentType, hash: piece.hash },
          select: { createdAt: true },
        })
      : null;
    if (dejaVerse) {
      throw new VerserFactureError(
        facture.id,
        `Ce fichier a déjà été repris le ${dejaVerse.createdAt.toISOString().slice(0, 10)}. Rien n'a été écrit une seconde fois.`,
      );
    }

    // ── Client ────────────────────────────────────────────────────────────
    // « nouveau » a été décidé à l'analyse, contre la base telle qu'elle était
    // à ce moment-là. Entre-temps, le client a pu naître : une autre facture du
    // lot, un autre onglet, une saisie à la main. On repose la question ici,
    // sur la même clé de croisement que le rapprochement, plutôt que d'ouvrir
    // une seconde fiche au même nom.
    let clientId = match.client.clientId;
    let clientCree = false;
    if (!clientId) {
      // Le service ne se repose pas sur les contrôles de l'écran : une API
      // s'appelle aussi sans écran. Une fiche anonyme est irrattrapable une
      // fois écrite, alors qu'un refus se corrige.
      const nomVoulu = (match.client.clientNom ?? "").trim();
      if (!nomVoulu) {
        throw new VerserFactureError(
          facture.id,
          "Le nom du client est vide : verser ouvrirait une fiche sans nom.",
        );
      }
      const cleVoulue = cleCroisement(nomVoulu);
      const existants = await tx.client.findMany({
        where: { cabinetId },
        select: { id: true, raisonSociale: true, prenom: true, nom: true },
      });
      const deja = existants.find(
        (c) =>
          cleCroisement(c.raisonSociale || [c.prenom, c.nom].filter(Boolean).join(" ") || "") ===
          cleVoulue,
      );
      if (deja) {
        clientId = deja.id;
      } else {
        const client = await tx.client.create({
          data: {
            cabinetId,
            typeClient: "personne_morale",
            raisonSociale: nomVoulu,
          },
          select: { id: true },
        });
        clientId = client.id;
        clientCree = true;
      }
    }

    // ── Dossier ───────────────────────────────────────────────────────────
    // Même raisonnement : un dossier de même intitulé chez ce client, né depuis
    // l'analyse, se reprend au lieu de se dédoubler.
    let dossierId = match.dossier.dossierId;
    let dossierCree = false;
    if (!dossierId) {
      const intituleDuDossier = (match.dossier.dossierIntitule ?? "").trim();
      if (!intituleDuDossier) {
        throw new VerserFactureError(
          facture.id,
          "L'intitulé du dossier est vide : indiquez de quel mandat relève cette facture.",
        );
      }
      const intituleVoulu = normaliseIntitule(intituleDuDossier);
      const dossiers = await tx.dossier.findMany({
        where: { cabinetId, clientId },
        select: { id: true, intitule: true },
      });
      const dejaLa = dossiers.find((d) => normaliseIntitule(d.intitule) === intituleVoulu);
      if (dejaLa) {
        dossierId = dejaLa.id;
      } else {
        const dossier = await tx.dossier.create({
          data: {
            cabinetId,
            clientId,
            intitule: intituleDuDossier,
            statut: "actif",
          },
          select: { id: true },
        });
        dossierId = dossier.id;
        dossierCree = true;
      }
    }

    // ── Facture ───────────────────────────────────────────────────────────
    // Un même numéro peut légitimement exister chez deux clients différents :
    // chaque ancien logiciel numérotait à sa façon, et « 001 » se retrouve
    // partout. Chez le MÊME client, en revanche, c'est la même facture : on
    // refuse, au lieu de lui inventer un numéro de repli qui la ferait passer
    // pour une seconde facture et doublerait les écritures.
    const numeroLu = extraction.numeroFacture?.trim() || null;
    if (numeroLu) {
      const memeNumeroMemeClient = await tx.invoice.findFirst({
        where: { cabinetId, clientId, numero: numeroLu },
        select: { id: true, estReprise: true },
      });
      if (memeNumeroMemeClient) {
        throw new VerserFactureError(
          facture.id,
          `La facture n° ${numeroLu} existe déjà pour ce client${
            memeNumeroMemeClient.estReprise ? " (reprise d'un exercice précédent)" : ""
          }. Rien n'a été écrit pour cette pièce.`,
        );
      }
    }
    const numeroPrisAilleurs = numeroLu
      ? await tx.invoice.findFirst({ where: { cabinetId, numero: numeroLu }, select: { id: true } })
      : null;
    const numero = numeroLu && !numeroPrisAilleurs ? numeroLu : numeroRepli();

    const invoice = await tx.invoice.create({
      data: {
        cabinetId,
        clientId,
        dossierId,
        numero,
        dateEmission,
        dateEcheance: dateEmission,
        statut: "envoyee",
        invoiceStatus: "ISSUED",
        estReprise: true,
        deliveryChannel: "LEGACY_PRESUME",
      },
      select: { id: true },
    });

    // ── Lignes : honoraires (temps ou forfait) et débours ────────────────
    let sortOrder = 0;
    for (const ligne of lignesAvecMontant) {
      const serviceDate = ligne.date ? toDate(ligne.date, dateEmission) : null;
      const estDebours = ligne.nature === "debours";
      const quantite = ligne.heures ?? 1;
      const tauxUnitaire = ligne.heures
        ? (ligne.tauxHoraire ?? (ligne.montant as number) / ligne.heures)
        : (ligne.montant as number);

      const invoiceLine = await tx.invoiceLine.create({
        data: {
          invoiceId: invoice.id,
          description: ligne.description,
          quantite: estDebours ? 1 : quantite,
          tauxUnitaire: estDebours ? (ligne.montant as number) : tauxUnitaire,
          montant: ligne.montant as number,
          lineType: estDebours ? "expense" : "fee",
          sourceType: estDebours ? "debours_dossier" : "manual",
          serviceDate,
          // Un débours repris est consigné hors taxes : la facture d'origine
          // portait déjà ses taxes, et la plupart des débours judiciaires n'en
          // supportent pas. Le cabinet corrige au besoin dans l'espace de
          // correction.
          taxable: !estDebours,
          sortOrder: sortOrder++,
        },
        select: { id: true },
      });

      if (estDebours) {
        // Le catalogue de types de débours n'a pas d'unicité sur le libellé :
        // `findFirst`, jamais `findUnique`. Aucun type trouvé n'est pas une
        // erreur, le débours vit très bien sans.
        const type = await tx.deboursType.findFirst({
          where: { cabinetId, nom: ligne.description, actif: true },
          select: { id: true },
        });
        const debours = await tx.deboursDossier.create({
          data: {
            cabinetId,
            dossierId,
            clientId,
            deboursTypeId: type?.id ?? null,
            description: ligne.description,
            quantite: 1,
            montant: ligne.montant as number,
            taxable: false,
            date: serviceDate ?? dateEmission,
            payeParCabinet: true,
            refacturable: true,
            // Porté par la facture reprise. Si elle est payée, le recalcul qui
            // suit la bascule tout seul en RECOUVRE.
            statutDebours: "FACTURE",
            factureId: invoice.id,
            invoiceLineId: invoiceLine.id,
          },
        });

        // La sortie d'argent du cabinet, à sa vraie date.
        await writeJournalForDeboursPaiement(debours, { client: tx, utilisateurId: userId });
      } else if (ligne.heures) {
        await tx.timeEntry.create({
          data: {
            cabinetId,
            dossierId,
            clientId,
            userId,
            date: serviceDate ?? dateEmission,
            dureeMinutes: Math.round(ligne.heures * 60),
            description: ligne.description,
            facturable: true,
            statut: "facture",
            tauxHoraire: tauxUnitaire,
            montant: ligne.montant as number,
            billingStatus: "BILLED",
            invoiceId: invoice.id,
            invoiceLineId: invoiceLine.id,
          },
        });
      } else {
        await tx.registreTache.create({
          data: {
            cabinetId,
            dossierId,
            clientId,
            description: ligne.description,
            montantBase: ligne.montant as number,
            montantFinal: ligne.montant as number,
            date: serviceDate ?? dateEmission,
            statut: "facture",
            invoiceLineId: invoiceLine.id,
          },
        });
      }
    }

    // ── Les totaux : le PAPIER fait foi ───────────────────────────────────
    // `recalculateInvoiceTotals` recalculerait les taxes avec la configuration
    // d'aujourd'hui et sortirait un total qui contredit la facture imprimée
    // (mesuré : 596,64 $ pour une facture de 528,00 $). Une reprise consigne
    // ce qui a été facturé, elle ne le recalcule pas. Les taxes viennent donc
    // de la facture quand elles y sont lisibles, et le reste se déduit du
    // total, sans jamais inventer de répartition.
    const sommeLignes = arrondir(
      lignesAvecMontant.reduce((s, l) => s + (l.montant as number), 0),
    );
    const taxesLues =
      extraction.tps !== null || extraction.tvq !== null
        ? arrondir((extraction.tps ?? 0) + (extraction.tvq ?? 0))
        : null;
    const taxTotal = taxesLues ?? Math.max(0, arrondir(montantTotal - sommeLignes));
    const subtotalBeforeTax = arrondir(montantTotal - taxTotal);
    const subtotalFees = arrondir(
      lignesAvecMontant
        .filter((l) => l.nature !== "debours")
        .reduce((s, l) => s + (l.montant as number), 0),
    );
    const subtotalExpenses = arrondir(sommeLignes - subtotalFees);

    const factureCalculee = await tx.invoice.update({
      where: { id: invoice.id },
      data: {
        subtotalFees,
        subtotalExpenses,
        subtotalBeforeTax,
        subtotalTaxable: subtotalBeforeTax,
        taxGst: extraction.tps ?? 0,
        taxQst: extraction.tvq ?? 0,
        taxTotal,
        tps: extraction.tps ?? 0,
        tvq: extraction.tvq ?? 0,
        montantTotal,
        totalInvoiceAmount: montantTotal,
        balanceDue: montantTotal,
        paymentStatus: "UNPAID",
      },
      select: {
        id: true,
        cabinetId: true,
        clientId: true,
        dossierId: true,
        numero: true,
        dateEmission: true,
        sentAt: true,
        totalInvoiceAmount: true,
        montantTotal: true,
        client: { select: { raisonSociale: true, prenom: true, nom: true } },
      },
    });

    // ── La facture au journal, à sa vraie date ────────────────────────────
    await writeJournalForIssuedInvoice(factureCalculee, { client: tx, utilisateurId: userId });

    // ── Paiement (écrit directement, pas via createPayment : ses garde-fous
    // sont ceux du jour et n'ont pas de sens sur un encaissement passé) ──
    if (statutPaiement !== "impayee") {
      const montantAAllouer = resolveMontantPaye(
        statutPaiement,
        montantTotal,
        montantPaye,
      );
      const datePaiementIso = facture.datePaiement;
      if (!datePaiementIso) {
        throw new Error("La date de paiement est requise pour une facture payée ou partielle.");
      }
      const datePaiement = toDate(datePaiementIso, dateEmission);

      const payment = await tx.payment.create({
        data: {
          cabinetId,
          clientId,
          invoiceId: invoice.id,
          datePaiement,
          montant: montantAAllouer,
          method: "autre",
          paymentMethod: "other",
          sourceAccountType: "operating",
          allocationStatus: montantAAllouer >= montantTotal ? "ALLOCATED" : "PARTIALLY_ALLOCATED",
          estReprise: true,
          receivedById: userId,
        },
        select: {
          id: true,
          cabinetId: true,
          clientId: true,
          invoiceId: true,
          datePaiement: true,
          montant: true,
          paymentMethod: true,
          referenceNumber: true,
          reference: true,
          receivedById: true,
        },
      });

      await tx.paymentAllocation.create({
        data: {
          paymentId: payment.id,
          invoiceId: invoice.id,
          allocatedAmount: montantAAllouer,
          allocatedAt: datePaiement,
        },
      });

      // Statut dérivé du total du papier, pas d'un total recalculé.
      const balanceDue = arrondir(montantTotal - montantAAllouer);
      const paymentStatus = derivePaymentStatus(balanceDue, montantAAllouer);
      await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          montantPaye: montantAAllouer,
          totalPaidAmount: montantAAllouer,
          balanceDue,
          paymentStatus,
          statut: paymentStatus === "PAID" ? "payee" : "partiellement_payee",
          invoiceStatus: paymentStatus === "PAID" ? "PAID" : "PARTIALLY_PAID",
        },
      });

      // Facture soldée : les débours qu'elle porte sont recouvrés. Même bascule
      // que `recalculateInvoiceTotals`, refaite ici puisqu'on ne l'appelle pas.
      if (paymentStatus === "PAID") {
        await tx.deboursDossier.updateMany({
          where: { factureId: invoice.id, statutDebours: "FACTURE" },
          data: { statutDebours: "RECOUVRE" },
        });
      }

      // ── L'encaissement au journal, à sa vraie date ──────────────────────
      await writeJournalForPayment(
        {
          ...payment,
          invoice: { numero: factureCalculee.numero, dossierId: factureCalculee.dossierId },
          client: factureCalculee.client,
        },
        { client: tx, utilisateurId: userId },
      );
    }

    // ── La pièce et son empreinte, dans la même transaction ─────────────
    // Si cette ligne ne passe pas, la facture ne passe pas non plus : une
    // facture reprise sans empreinte est une facture qu'on peut redéposer
    // indéfiniment.
    const document = piece
      ? await tx.document.create({
          data: {
            cabinetId,
            uploadedById: userId,
            clientId,
            dossierId,
            nom: piece.nom,
            mimeType: piece.mimeType,
            sizeBytes: piece.sizeBytes,
            storageKey: piece.storageKey,
            hash: piece.hash,
            documentType: piece.documentType,
            aiAssisted: true,
            dateDocument: piece.dateDocument ?? undefined,
          },
          select: { id: true },
        })
      : null;

    return {
      invoiceId: invoice.id,
      clientId,
      dossierId,
      clientCree,
      dossierCree,
      documentId: document?.id ?? null,
    };
  });

  if (resultat.documentId) {
    await createAuditLog({
      cabinetId,
      userId,
      entityType: "Document",
      entityId: resultat.documentId,
      action: "create",
      metadata: { nom: piece?.nom, clientId: resultat.clientId, dossierId: resultat.dossierId, reprise: true },
    });
  }

  // Ce que la lecture a produit et ce qu'un humain a repris par-dessus ne
  // doivent pas se confondre. Une inspection qui relit cette facture doit
  // pouvoir dire lequel des deux a fourni chaque chiffre, et si une pièce
  // existe seulement.
  await createAuditLog({
    cabinetId,
    userId,
    entityType: "Invoice",
    entityId: resultat.invoiceId,
    action: "create",
    metadata: {
      reprise: true,
      fichierNom: facture.fichierNom,
      sansPiece: !piece,
      champsCorriges: facture.champsCorriges ?? [],
    },
  });

  return { factureId: facture.id, ...resultat };
}
