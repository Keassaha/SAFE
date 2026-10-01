import type { JournalCorrectionMotive } from "@prisma/client";
import { prisma } from "@/lib/db";
import { derivePaymentStatus } from "@/lib/billing/payment-status";
import { createJournalEntry } from "@/lib/services/journal/journal-service";
import { writeJournalForIssuedInvoice, writeJournalForPayment } from "@/lib/services/journal/billing-journal";
import { writeJournalForDeboursPaiement } from "@/lib/services/journal/debours-dossier-journal";
import { getPeriodeFromDate, isPeriodLocked } from "@/lib/services/journal/period-lock";
import { createAuditLog } from "@/lib/services/audit";
import { JOURNAL_MOTIVE_LABELS } from "@/types/journal";
import { toCalendarDayUTC } from "@/lib/utils/calendar-date";
import {
  colonnesPaiement,
  modeDepuisColonnes,
  type ModePaiementSaisie,
} from "@/lib/services/reprise-un-client/saisie";
import {
  assertFactureCorrigible,
  calculerEffetNet,
  changementsMateriels,
  validerMotifCorrection,
  versionLaPlusHaute,
  type EtatFacture,
  type StatutPaiementCorrige,
} from "@/lib/services/reprise-historique/correction-guards";

/**
 * Correction d'une facture reprise d'un exercice précédent.
 *
 * C'est l'espace où SAFE accepte de corriger une écriture qu'il refuse de
 * toucher partout ailleurs (demande CEO du 2026-09-16). L'exception tient
 * parce qu'elle ne troue pas le registre :
 *
 * - elle ne s'applique qu'aux pièces marquées `estReprise`, c'est-à-dire à ce
 *   que le cabinet a déclaré de son propre passé, jamais à ce que SAFE a
 *   produit en fonctionnement ;
 * - elle ne réécrit RIEN au journal. Elle neutralise l'effet net des écritures
 *   déjà passées par une contrepassation motivée, puis rejoue la version
 *   corrigée sous un `sourceId` versionné `#vN+1`. Même mécanique que
 *   `applyCabinetExpenseCorrection`, doctrine §1.2 ;
 * - le motif est obligatoire à chaque passage et vit sur l'écriture de
 *   correction, jamais sur l'originale.
 *
 * Une facture reprise impayée qui se révèle payée reçoit ICI son encaissement :
 * paiement, allocation et écriture au journal, à la date réelle de réception.
 */

export interface CorrigerRepriseParams {
  cabinetId: string;
  userId: string;
  invoiceId: string;
  motifCode: JournalCorrectionMotive;
  motifTexte?: string | null;
  corrections: {
    montantTotal?: number;
    dateEmission?: string;
    statutPaiement?: StatutPaiementCorrige;
    montantPaye?: number;
    datePaiement?: string | null;
    /** Comment l'argent est arrivé. Sans valeur, le mode déjà inscrit est gardé. */
    modePaiement?: ModePaiementSaisie;
    /** Reclassement d'une ligne lue de travers : honoraire ↔ débours. */
    lignes?: { invoiceLineId: string; nature: "honoraire" | "debours" }[];
  };
}

export interface CorrigerRepriseResultat {
  corrige: boolean;
  raisons: string[];
  /** Écritures de correction émises (facture, encaissement). */
  correctionIds: string[];
  message?: string;
}

export class CorrigerRepriseError extends Error {}

function jourCalendaire(iso: string): Date {
  return toCalendarDayUTC(new Date(`${iso}T00:00:00.000Z`));
}

function isoDuJour(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function arrondir(montant: number): number {
  return Math.round(montant * 100) / 100;
}

async function refuserSiVerrouille(cabinetId: string, date: Date, quoi: string): Promise<void> {
  const periode = getPeriodeFromDate(date);
  if (await isPeriodLocked(cabinetId, periode)) {
    throw new CorrigerRepriseError(
      `${quoi} tombe en ${periode}, un mois déjà clos en comptabilité. Rouvrez la période avant de corriger.`,
    );
  }
}

export async function corrigerFactureReprise(
  params: CorrigerRepriseParams,
): Promise<CorrigerRepriseResultat> {
  const { cabinetId, userId, invoiceId, motifCode, corrections } = params;

  const motif = validerMotifCorrection({ code: motifCode, texte: params.motifTexte });
  if (!motif.ok) throw new CorrigerRepriseError(motif.message ?? "Motif invalide.");
  const motifTexte = motif.texte ?? null;

  const facture = await prisma.invoice.findFirst({
    where: { id: invoiceId, cabinetId },
    select: {
      id: true,
      cabinetId: true,
      clientId: true,
      dossierId: true,
      numero: true,
      dateEmission: true,
      montantTotal: true,
      totalInvoiceAmount: true,
      subtotalBeforeTax: true,
      taxTotal: true,
      estReprise: true,
      cancelledAt: true,
      client: { select: { raisonSociale: true, prenom: true, nom: true } },
      payments: {
        where: { estReprise: true },
        select: { id: true, montant: true, datePaiement: true, paymentMethod: true },
        orderBy: { createdAt: "asc" },
      },
      invoiceLines: {
        select: {
          id: true,
          description: true,
          montant: true,
          lineType: true,
          serviceDate: true,
          // `timeEntryRef` est l'entrée de temps qui POINTE vers cette ligne
          // (relation InvoiceLineRef), pas `timeEntry` qui est la source.
          timeEntryRef: { select: { id: true } },
          registreTache: { select: { id: true } },
          deboursDossier: { select: { id: true } },
        },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  const verdict = assertFactureCorrigible(facture);
  if (!verdict.ok || !facture) throw new CorrigerRepriseError(verdict.message ?? "Correction refusée.");

  const paiement = facture.payments[0] ?? null;
  const avant: EtatFacture = {
    montantTotal: arrondir(facture.totalInvoiceAmount || facture.montantTotal),
    dateEmission: isoDuJour(facture.dateEmission),
    statutPaiement: !paiement
      ? "impayee"
      : arrondir(paiement.montant) >= arrondir(facture.totalInvoiceAmount || facture.montantTotal)
        ? "payee"
        : "partielle",
    montantPaye: paiement ? arrondir(paiement.montant) : 0,
    datePaiement: paiement ? isoDuJour(paiement.datePaiement) : null,
  };

  const statutVoulu = corrections.statutPaiement ?? avant.statutPaiement;
  const montantTotalVoulu = arrondir(corrections.montantTotal ?? avant.montantTotal);
  const apres: EtatFacture = {
    montantTotal: montantTotalVoulu,
    dateEmission: corrections.dateEmission ?? avant.dateEmission,
    statutPaiement: statutVoulu,
    montantPaye:
      statutVoulu === "impayee"
        ? 0
        : statutVoulu === "payee"
          ? montantTotalVoulu
          : arrondir(corrections.montantPaye ?? avant.montantPaye),
    datePaiement:
      statutVoulu === "impayee"
        ? null
        : (corrections.datePaiement ?? avant.datePaiement ?? avant.dateEmission),
  };

  if (apres.statutPaiement === "partielle" && apres.montantPaye <= 0) {
    throw new CorrigerRepriseError("Une facture partielle demande le montant réellement reçu.");
  }

  // ── Reclassements de lignes demandés ──────────────────────────────────────
  // Une ligne lue comme honoraire alors que c'était un débours (ou l'inverse)
  // ne change pas le total de la facture : elle change où la somme est rangée,
  // donc l'entrée de temps ou le débours qui lui est accroché.
  const reclassements = (corrections.lignes ?? [])
    .map((demande) => {
      const ligne = facture.invoiceLines.find((l) => l.id === demande.invoiceLineId);
      if (!ligne) return null;
      const natureActuelle = ligne.lineType === "expense" ? "debours" : "honoraire";
      if (natureActuelle === demande.nature) return null;
      return { ligne, vers: demande.nature };
    })
    .filter((r): r is { ligne: (typeof facture.invoiceLines)[number]; vers: "honoraire" | "debours" } => r !== null);

  const changements = changementsMateriels(avant, apres);
  for (const r of reclassements) {
    changements.raisons.push(
      `ligne « ${r.ligne.description} » ${r.vers === "debours" ? "honoraire → débours" : "débours → honoraire"}`,
    );
  }
  // Le mode ne compte que s'il reste un encaissement à décrire.
  const modeAvant = paiement ? modeDepuisColonnes(paiement.paymentMethod) : null;
  const modeApres: ModePaiementSaisie | null =
    apres.statutPaiement === "impayee" ? null : (corrections.modePaiement ?? modeAvant ?? "autre");
  const modeChange = paiement !== null && modeApres !== null && modeApres !== modeAvant;
  if (modeChange) changements.raisons.push(`mode de paiement ${modeAvant} → ${modeApres}`);

  if (!changements.material && reclassements.length === 0 && !modeChange) {
    return { corrige: false, raisons: [], correctionIds: [], message: "Rien n'a changé." };
  }

  // Les trois dates qui vont porter une écriture doivent vivre dans des mois
  // ouverts : celle de la correction (aujourd'hui) et celles des re-jeux.
  await refuserSiVerrouille(cabinetId, toCalendarDayUTC(new Date()), "La correction");
  await refuserSiVerrouille(cabinetId, jourCalendaire(apres.dateEmission), "La facture corrigée");
  if (apres.datePaiement) {
    await refuserSiVerrouille(cabinetId, jourCalendaire(apres.datePaiement), "L'encaissement corrigé");
  }

  const libelleMotif = JOURNAL_MOTIVE_LABELS[motifCode] ?? motifCode;
  const descriptionCorrection = (quoi: string) =>
    `Correction ${quoi} — facture ${facture.numero} reprise du ${avant.dateEmission} · ` +
    `${changements.raisons.join(" ; ")} · Motif : ${libelleMotif}${motifTexte ? ` (${motifTexte})` : ""}`.slice(
      0,
      500,
    );

  const correctionIds = await prisma.$transaction(async (tx) => {
    const ids: string[] = [];

    /** Neutralise l'effet net déjà inscrit pour une pièce, puis rend la version du re-jeu. */
    const neutraliser = async (
      sourceModule: "FACTURATION" | "PAIEMENTS" | "DEBOURS",
      sourceId: string,
      quoi: string,
    ): Promise<number> => {
      const anterieures = await tx.journalGeneralEntry.findMany({
        where: {
          cabinetId,
          sourceModule,
          OR: [{ sourceId }, { sourceId: { startsWith: `${sourceId}#v` } }],
        },
        select: { montantEntree: true, montantSortie: true, sourceId: true },
      });
      if (anterieures.length === 0) return 1;

      const net = calculerEffetNet(anterieures);
      if (net !== 0) {
        const correction = await createJournalEntry(
          {
            cabinetId,
            // Une correction s'inscrit le jour où elle est faite, jamais à la
            // date d'origine : celle-ci est rappelée dans la description.
            dateTransaction: toCalendarDayUTC(new Date()),
            typeTransaction: "CORRECTION",
            reference: `correction-reprise:${facture.numero}`,
            clientId: facture.clientId,
            dossierId: facture.dossierId,
            description: descriptionCorrection(quoi),
            categorie: "Correction d'exercice précédent",
            documentIdentifier: facture.numero,
            montantEntree: net > 0 ? net : 0,
            montantSortie: net < 0 ? Math.abs(net) : 0,
            sourceModule: "CORRECTION_SYSTEME",
            sourceId: null,
            utilisateurId: userId,
            motifCode,
            motifTexte,
          },
          tx,
        );
        ids.push(correction.id);
      }
      return versionLaPlusHaute(anterieures) + 1;
    };

    // ── Reclassement des lignes ──────────────────────────────────────────
    // Fait AVANT le re-jeu de la facture pour que les sous-totaux honoraires
    // et débours réinscrits disent déjà la vérité.
    for (const { ligne, vers } of reclassements) {
      const dateLigne = ligne.serviceDate ?? facture.dateEmission;

      if (vers === "debours") {
        if (ligne.timeEntryRef) await tx.timeEntry.delete({ where: { id: ligne.timeEntryRef.id } });
        if (ligne.registreTache) await tx.registreTache.delete({ where: { id: ligne.registreTache.id } });

        await tx.invoiceLine.update({
          where: { id: ligne.id },
          data: {
            lineType: "expense",
            sourceType: "debours_dossier",
            taxable: false,
            quantite: 1,
            tauxUnitaire: ligne.montant,
          },
        });

        const type = await tx.deboursType.findFirst({
          where: { cabinetId, nom: ligne.description, actif: true },
          select: { id: true },
        });
        const debours = await tx.deboursDossier.create({
          data: {
            cabinetId,
            dossierId: facture.dossierId!,
            clientId: facture.clientId,
            deboursTypeId: type?.id ?? null,
            description: ligne.description,
            quantite: 1,
            montant: ligne.montant,
            taxable: false,
            date: dateLigne,
            payeParCabinet: true,
            refacturable: true,
            statutDebours: "FACTURE",
            factureId: facture.id,
            invoiceLineId: ligne.id,
          },
        });
        await writeJournalForDeboursPaiement(debours, { client: tx, utilisateurId: userId });
      } else {
        // Débours → honoraire : la sortie d'argent inscrite au journal n'a
        // jamais eu lieu, on la neutralise avant de retirer le débours.
        if (ligne.deboursDossier) {
          await neutraliser("DEBOURS", ligne.deboursDossier.id, "du débours");
          await tx.deboursDossier.delete({ where: { id: ligne.deboursDossier.id } });
        }

        await tx.invoiceLine.update({
          where: { id: ligne.id },
          data: { lineType: "fee", sourceType: "manual", taxable: true },
        });

        // Sans heures connues, la ligne redevient une tâche forfaitaire, déjà
        // facturée : elle ne doit jamais ressortir en facturation.
        await tx.registreTache.create({
          data: {
            cabinetId,
            dossierId: facture.dossierId!,
            clientId: facture.clientId,
            description: ligne.description,
            montantBase: ligne.montant,
            montantFinal: ligne.montant,
            date: dateLigne,
            statut: "facture",
            invoiceLineId: ligne.id,
          },
        });
      }
    }

    const versionFacture = await neutraliser("FACTURATION", facture.id, "de la facture");

    // ── La facture corrigée ──────────────────────────────────────────────
    const dateEmission = jourCalendaire(apres.dateEmission);
    const balanceDue = arrondir(apres.montantTotal - apres.montantPaye);
    const paymentStatus = derivePaymentStatus(balanceDue, apres.montantPaye);
    // Les taxes lues à la reprise suivent le total : si le total change sans
    // que le cabinet redonne les taxes, la part hors taxes absorbe l'écart
    // plutôt que d'inventer une taxe que la facture ne portait pas.
    const taxTotal = Math.min(facture.taxTotal, apres.montantTotal);

    // Les sous-totaux suivent le reclassement : une ligne passée en débours
    // quitte les honoraires, sinon la facture dirait deux choses différentes.
    const lignesApres = await tx.invoiceLine.findMany({
      where: { invoiceId: facture.id },
      select: { montant: true, lineType: true },
    });
    const subtotalExpenses = arrondir(
      lignesApres.filter((l) => l.lineType === "expense").reduce((s, l) => s + l.montant, 0),
    );
    const subtotalFees = arrondir(
      lignesApres.filter((l) => l.lineType !== "expense").reduce((s, l) => s + l.montant, 0),
    );

    await tx.invoice.update({
      where: { id: facture.id },
      data: {
        dateEmission,
        dateEcheance: dateEmission,
        montantTotal: apres.montantTotal,
        totalInvoiceAmount: apres.montantTotal,
        subtotalFees,
        subtotalExpenses,
        subtotalBeforeTax: arrondir(apres.montantTotal - taxTotal),
        subtotalTaxable: arrondir(apres.montantTotal - taxTotal),
        taxTotal,
        montantPaye: apres.montantPaye,
        totalPaidAmount: apres.montantPaye,
        balanceDue,
        paymentStatus,
        statut:
          paymentStatus === "PAID" ? "payee" : paymentStatus === "PARTIAL" ? "partiellement_payee" : "envoyee",
        invoiceStatus:
          paymentStatus === "PAID" ? "PAID" : paymentStatus === "PARTIAL" ? "PARTIALLY_PAID" : "ISSUED",
      },
    });

    await writeJournalForIssuedInvoice(
      {
        id: facture.id,
        cabinetId,
        clientId: facture.clientId,
        dossierId: facture.dossierId,
        numero: facture.numero,
        dateEmission,
        sentAt: null,
        totalInvoiceAmount: apres.montantTotal,
        montantTotal: apres.montantTotal,
        client: facture.client,
      },
      { client: tx, utilisateurId: userId, sourceIdOverride: `${facture.id}#v${versionFacture}` },
    );

    // ── L'encaissement corrigé ───────────────────────────────────────────
    if (paiement) {
      const versionPaiement = await neutraliser("PAIEMENTS", paiement.id, "de l'encaissement");

      if (apres.statutPaiement === "impayee") {
        // Plus d'encaissement : l'allocation et le paiement repris s'effacent
        // du solde, mais la contrepassation ci-dessus en garde la trace.
        await tx.paymentAllocation.deleteMany({ where: { paymentId: paiement.id } });
        await tx.payment.delete({ where: { id: paiement.id } });
      } else {
        const datePaiement = jourCalendaire(apres.datePaiement as string);
        const colonnes = colonnesPaiement(modeApres);
        await tx.payment.update({
          where: { id: paiement.id },
          data: {
            montant: apres.montantPaye,
            datePaiement,
            method: colonnes.method,
            paymentMethod: colonnes.paymentMethod,
            sourceAccountType: colonnes.sourceAccountType,
            allocationStatus: paymentStatus === "PAID" ? "ALLOCATED" : "PARTIALLY_ALLOCATED",
          },
        });
        await tx.paymentAllocation.updateMany({
          where: { paymentId: paiement.id },
          data: { allocatedAmount: apres.montantPaye, allocatedAt: datePaiement },
        });

        await writeJournalForPayment(
          {
            id: paiement.id,
            cabinetId,
            clientId: facture.clientId,
            invoiceId: facture.id,
            datePaiement,
            montant: apres.montantPaye,
            paymentMethod: colonnes.paymentMethod,
            referenceNumber: null,
            reference: null,
            receivedById: userId,
            invoice: { numero: facture.numero, dossierId: facture.dossierId },
            client: facture.client,
          },
          { client: tx, utilisateurId: userId, sourceIdOverride: `${paiement.id}#v${versionPaiement}` },
        );
      }
    } else if (apres.statutPaiement !== "impayee") {
      // Reprise inscrite impayée, payée en réalité : l'encaissement n'a jamais
      // été écrit. Il naît ici, à sa vraie date, comme au versement.
      const datePaiement = jourCalendaire(apres.datePaiement as string);
      const colonnes = colonnesPaiement(modeApres);
      const nouveau = await tx.payment.create({
        data: {
          cabinetId,
          clientId: facture.clientId,
          invoiceId: facture.id,
          datePaiement,
          montant: apres.montantPaye,
          method: colonnes.method,
          paymentMethod: colonnes.paymentMethod,
          sourceAccountType: colonnes.sourceAccountType,
          allocationStatus: paymentStatus === "PAID" ? "ALLOCATED" : "PARTIALLY_ALLOCATED",
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
          paymentId: nouveau.id,
          invoiceId: facture.id,
          allocatedAmount: apres.montantPaye,
          allocatedAt: datePaiement,
        },
      });
      await writeJournalForPayment(
        {
          ...nouveau,
          invoice: { numero: facture.numero, dossierId: facture.dossierId },
          client: facture.client,
        },
        { client: tx, utilisateurId: userId },
      );
    }

    // Les débours de la facture suivent son sort.
    await tx.deboursDossier.updateMany({
      where: { factureId: facture.id, statutDebours: { in: ["FACTURE", "RECOUVRE"] } },
      data: { statutDebours: paymentStatus === "PAID" ? "RECOUVRE" : "FACTURE" },
    });

    return ids;
  });

  await createAuditLog({
    cabinetId,
    userId,
    entityType: "Invoice",
    entityId: facture.id,
    // Contrepassation motivée puis re-jeu : la même famille que `reverse`,
    // jamais une suppression. Rien n'est effacé du journal.
    action: "reverse",
    newValues: { ...apres, modePaiement: modeApres, raisons: changements.raisons, motifCode, motifTexte },
    performedBy: userId,
    performedAt: new Date(),
  });

  return { corrige: true, raisons: changements.raisons, correctionIds };
}
