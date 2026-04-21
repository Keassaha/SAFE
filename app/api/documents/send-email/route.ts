import { NextResponse } from "next/server";
import React from "react";
import { getServerSession } from "next-auth";
import { renderToBuffer } from "@react-pdf/renderer";
import type { DocumentProps } from "@react-pdf/renderer";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canViewDossiers } from "@/lib/auth/permissions";
import { sendEmail, documentEmailHtml } from "@/lib/email";
import { createAuditLog } from "@/lib/services/audit";
import type { UserRole } from "@prisma/client";

// PDF components
import { Imm5476PDF, type Imm5476Data } from "@/components/pdf/Imm5476PDF";
import { AntecedentsDeclarationPDF, type AntecedentsDeclarationData } from "@/components/pdf/AntecedentsDeclarationPDF";
import { ImmigrationMandatePDF, type ImmigrationMandateData } from "@/components/pdf/ImmigrationMandatePDF";
import { EngagementLetterPDF } from "@/components/pdf/EngagementLetterPDF";
import { ClosureLetterPDF } from "@/components/pdf/ClosureLetterPDF";

/**
 * POST /api/documents/send-email
 *
 * Génère un PDF et l'envoie par courriel au client du dossier.
 * Supporte tous les types de documents SAFE.
 *
 * Body: {
 *   dossierId: string,
 *   documentType: "imm-5476" | "antecedents-declaration" | "immigration-mandate"
 *                  | "engagement-letter" | "closure-letter",
 *   lang?: "fr" | "en"
 * }
 */

type DocumentType =
  | "imm-5476"
  | "antecedents-declaration"
  | "immigration-mandate"
  | "engagement-letter"
  | "closure-letter";

const DOCUMENT_LABELS: Record<DocumentType, { fr: string; en: string }> = {
  "imm-5476": {
    fr: "IMM 5476 — Recours aux services d'un représentant (nov. 2025)",
    en: "IMM 5476 — Use of a Representative (Nov. 2025)",
  },
  "antecedents-declaration": {
    fr: "Déclaration d'antécédents criminels et d'immigration",
    en: "Criminal and Immigration Background Declaration",
  },
  "immigration-mandate": {
    fr: "Mandat de représentation en droit de l'immigration",
    en: "Immigration Law Representation Mandate",
  },
  "engagement-letter": {
    fr: "Lettre de mandat",
    en: "Engagement Letter",
  },
  "closure-letter": {
    fr: "Lettre de fermeture de dossier",
    en: "File Closure Letter",
  },
};

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

  const cabinetId = (session.user as { cabinetId?: string }).cabinetId;
  const userId = (session.user as { id?: string }).id;
  const role = (session.user as { role?: string }).role as UserRole;

  if (!cabinetId) return new NextResponse("Cabinet not found", { status: 403 });
  if (!canViewDossiers(role)) return new NextResponse("Insufficient permissions", { status: 403 });

  const body = await request.json();
  const { dossierId, documentType, lang } = body as {
    dossierId: string;
    documentType: DocumentType;
    lang?: "fr" | "en";
  };

  if (!dossierId || !documentType) {
    return new NextResponse("dossierId and documentType are required", { status: 400 });
  }

  const dossier = await prisma.dossier.findFirst({
    where: { id: dossierId, cabinetId },
    include: {
      client: true,
      cabinet: true,
      avocatResponsable: { select: { nom: true, email: true } },
      immigrationBackground: true,
    },
  });
  if (!dossier) return new NextResponse("Dossier not found", { status: 404 });

  const clientEmail = dossier.client.email;
  if (!clientEmail) {
    return new NextResponse("Client has no email address", { status: 422 });
  }

  // --- Langue ---
  let language: "fr" | "en" = "fr";
  if (lang === "en" || lang === "fr") {
    language = lang;
  } else if (dossier.client.langue?.toLowerCase() === "en") {
    language = "en";
  }

  // --- Nom du client ---
  const clientName =
    dossier.client.typeClient === "personne_physique"
      ? [dossier.client.prenom, dossier.client.nom].filter(Boolean).join(" ")
      : (dossier.client.raisonSociale ?? "Client");

  // --- Génération du PDF ---
  let pdfBuffer: Buffer;
  let fileName: string;
  const dateStr = new Date().toISOString().split("T")[0];
  const refStr = dossier.numeroDossier ?? dossier.id;

  switch (documentType) {
    case "imm-5476": {
      const clientFirstName =
        dossier.client.typeClient === "personne_physique"
          ? dossier.client.prenom ?? ""
          : (dossier.client.raisonSociale ?? "");
      const clientLastName =
        dossier.client.typeClient === "personne_physique" ? dossier.client.nom ?? "" : "";

      const sousTypeLabels: Record<string, Record<"fr" | "en", string>> = {
        ee: { fr: "Résidence permanente — Entrée express", en: "Permanent Residence — Express Entry" },
        parrainage: { fr: "Résidence permanente — Parrainage", en: "Permanent Residence — Sponsorship" },
        travail: { fr: "Permis de travail", en: "Work Permit" },
        appel: { fr: "Appel en immigration", en: "Immigration Appeal" },
        consultation: { fr: "Consultation immigration", en: "Immigration Consultation" },
      };

      const data: Imm5476Data = {
        cabinet: {
          nom: dossier.cabinet.nom,
          adresse: dossier.cabinet.adresse,
          telephone: dossier.cabinet.telephone,
          email: dossier.cabinet.email,
          barreauNumero: dossier.cabinet.barreauNumero,
        },
        avocat: {
          nom: dossier.avocatResponsable?.nom ?? dossier.cabinet.nom,
          barreauNumero: dossier.cabinet.barreauNumero,
          email: dossier.avocatResponsable?.email ?? dossier.cabinet.email,
          telephone: dossier.cabinet.telephone,
        },
        client: {
          nomFamille: clientLastName || clientFirstName,
          prenoms: clientLastName ? clientFirstName : null,
          dateNaissance: dossier.client.dateNaissance?.toISOString().split("T")[0] ?? null,
          email: dossier.client.email,
          uci: dossier.irccNumDossier,
        },
        dossier: {
          numero: dossier.numeroDossier,
          intitule: dossier.intitule,
          typeDemande: dossier.sousType
            ? (sousTypeLabels[dossier.sousType]?.[language] ?? dossier.sousType)
            : dossier.type,
          irccNumDossier: dossier.irccNumDossier,
        },
        language,
      };
      const doc = React.createElement(Imm5476PDF, { data });
      pdfBuffer = Buffer.from(await renderToBuffer(doc as React.ReactElement<DocumentProps>));
      fileName = `IMM5476-${refStr}-${dateStr}.pdf`;
      break;
    }

    case "antecedents-declaration": {
      const bg = dossier.immigrationBackground;
      const sousTypeLabels: Record<string, Record<"fr" | "en", string>> = {
        ee: { fr: "Résidence permanente — Entrée express", en: "Permanent Residence — Express Entry" },
        parrainage: { fr: "Résidence permanente — Parrainage", en: "Permanent Residence — Sponsorship" },
        travail: { fr: "Permis de travail", en: "Work Permit" },
        appel: { fr: "Appel en immigration", en: "Immigration Appeal" },
      };
      const clientAddress =
        [dossier.client.adresse, dossier.client.city, dossier.client.province, dossier.client.postalCode]
          .filter(Boolean)
          .join(", ") || null;

      const data: AntecedentsDeclarationData = {
        cabinet: {
          nom: dossier.cabinet.nom,
          adresse: dossier.cabinet.adresse,
          telephone: dossier.cabinet.telephone,
          email: dossier.cabinet.email,
          barreauNumero: dossier.cabinet.barreauNumero,
        },
        avocat: {
          nom: dossier.avocatResponsable?.nom ?? dossier.cabinet.nom,
          barreauNumero: dossier.cabinet.barreauNumero,
        },
        client: {
          nomComplet: clientName,
          dateNaissance: dossier.client.dateNaissance?.toISOString().split("T")[0] ?? null,
          email: dossier.client.email,
          adresse: clientAddress,
          idType: dossier.client.idType ? String(dossier.client.idType) : null,
          idNumber: dossier.client.idNumber,
          idExpiration: dossier.client.idExpiration?.toISOString().split("T")[0] ?? null,
        },
        dossier: {
          numero: dossier.numeroDossier,
          intitule: dossier.intitule,
          typeDemande: dossier.sousType
            ? (sousTypeLabels[dossier.sousType]?.[language] ?? dossier.sousType)
            : dossier.type,
        },
        antecedents: {
          criminalRecord: bg?.criminalRecord ?? false,
          criminalDetails: bg?.criminalDetails ?? null,
          priorRefusal: bg?.priorRefusal ?? false,
          priorRefusalDetails: bg?.priorRefusalDetails ?? null,
          overstay: bg?.overstay ?? false,
          overstayDetails: bg?.overstayDetails ?? null,
          deportation: bg?.deportation ?? false,
          deportationDetails: bg?.deportationDetails ?? null,
          misrepresentation: bg?.misrepresentation ?? false,
          misrepresentationDetails: bg?.misrepresentationDetails ?? null,
        },
        language,
      };
      const doc = React.createElement(AntecedentsDeclarationPDF, { data });
      pdfBuffer = Buffer.from(await renderToBuffer(doc as React.ReactElement<DocumentProps>));
      fileName = `Antecedents-${refStr}-${dateStr}.pdf`;
      break;
    }

    case "immigration-mandate": {
      const irccFeesEstimated: Record<string, number> = {
        ee: 1525,
        parrainage: 1075,
        travail: 255,
        appel: 1100,
      };
      const sousTypeLabels: Record<string, Record<"fr" | "en", string>> = {
        ee: { fr: "résidence permanente via Entrée express", en: "Permanent Residence via Express Entry" },
        parrainage: { fr: "résidence permanente par parrainage", en: "Permanent Residence — Sponsorship" },
        travail: { fr: "permis de travail", en: "Work Permit" },
        appel: { fr: "appel en immigration", en: "Immigration Appeal" },
        consultation: { fr: "consultation en immigration", en: "Immigration Consultation" },
      };
      let currency = "CAD";
      if (dossier.cabinet.config) {
        try {
          const cfg = JSON.parse(dossier.cabinet.config);
          currency = cfg?.devise ?? currency;
        } catch { /* keep default */ }
      }
      const clientAddress =
        [dossier.client.adresse, dossier.client.city, dossier.client.province, dossier.client.postalCode]
          .filter(Boolean)
          .join(", ") || null;

      const data: ImmigrationMandateData = {
        cabinet: {
          nom: dossier.cabinet.nom,
          adresse: dossier.cabinet.adresse,
          telephone: dossier.cabinet.telephone,
          email: dossier.cabinet.email,
          barreauNumero: dossier.cabinet.barreauNumero,
        },
        avocat: {
          nom: dossier.avocatResponsable?.nom ?? dossier.cabinet.nom,
          barreauNumero: dossier.cabinet.barreauNumero,
          email: dossier.avocatResponsable?.email ?? dossier.cabinet.email,
        },
        client: {
          nomComplet: clientName,
          civilite: null,
          adresse: clientAddress,
          email: dossier.client.email,
        },
        dossier: {
          numero: dossier.numeroDossier,
          intitule: dossier.intitule,
          typeDemande: dossier.sousType
            ? (sousTypeLabels[dossier.sousType]?.[language] ?? dossier.sousType)
            : dossier.type,
          irccNumDossier: dossier.irccNumDossier,
          itaDate: dossier.itaDate?.toISOString().split("T")[0] ?? null,
          submissionDeadline: dossier.submissionDeadline?.toISOString().split("T")[0] ?? null,
          irccStatut: dossier.irccStatut,
        },
        honoraires: {
          tauxHoraire: dossier.tauxHoraire,
          provisionFideicommis: dossier.soldeFiducieDossier,
          fraisIRCC: dossier.sousType ? (irccFeesEstimated[dossier.sousType] ?? null) : null,
          currency,
        },
        dateMandat: new Date().toLocaleDateString(language === "fr" ? "fr-CA" : "en-CA", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
        language,
      };
      const doc = React.createElement(ImmigrationMandatePDF, { data });
      pdfBuffer = Buffer.from(await renderToBuffer(doc as React.ReactElement<DocumentProps>));
      fileName = `MandatImmigration-${refStr}-${dateStr}.pdf`;
      break;
    }

    case "engagement-letter": {
      const data = {
        cabinet: {
          nom: dossier.cabinet.nom,
          adresse: dossier.cabinet.adresse,
          telephone: dossier.cabinet.telephone,
          email: dossier.cabinet.email,
          barreauNumero: dossier.cabinet.barreauNumero,
        },
        avocat: {
          nom: dossier.avocatResponsable?.nom ?? dossier.cabinet.nom,
          barreauNumero: dossier.cabinet.barreauNumero,
          email: dossier.avocatResponsable?.email ?? dossier.cabinet.email,
        },
        client: {
          nomComplet: clientName,
          adresse:
            [dossier.client.adresse, dossier.client.city, dossier.client.province, dossier.client.postalCode]
              .filter(Boolean)
              .join(", ") || null,
          email: dossier.client.email,
        },
        dossier: {
          numero: dossier.numeroDossier,
          intitule: dossier.intitule,
          typeDossier: dossier.type,
        },
        honoraires: {
          tauxHoraire: dossier.tauxHoraire,
          provisionFideicommis: dossier.soldeFiducieDossier,
          currency: "CAD",
        },
        dateLetter: new Date().toLocaleDateString(language === "fr" ? "fr-CA" : "en-CA", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
        language,
      };
      const doc = React.createElement(EngagementLetterPDF, { data } as never);
      pdfBuffer = Buffer.from(await renderToBuffer(doc as React.ReactElement<DocumentProps>));
      fileName = `LettreMandat-${refStr}-${dateStr}.pdf`;
      break;
    }

    case "closure-letter": {
      const data = {
        cabinet: {
          nom: dossier.cabinet.nom,
          adresse: dossier.cabinet.adresse,
          telephone: dossier.cabinet.telephone,
          email: dossier.cabinet.email,
          barreauNumero: dossier.cabinet.barreauNumero,
        },
        avocat: {
          nom: dossier.avocatResponsable?.nom ?? dossier.cabinet.nom,
          email: dossier.avocatResponsable?.email ?? dossier.cabinet.email,
        },
        client: {
          nomComplet: clientName,
          adresse:
            [dossier.client.adresse, dossier.client.city, dossier.client.province, dossier.client.postalCode]
              .filter(Boolean)
              .join(", ") || null,
          email: dossier.client.email,
        },
        dossier: {
          numero: dossier.numeroDossier,
          intitule: dossier.intitule,
        },
        dateLettre: new Date().toLocaleDateString(language === "fr" ? "fr-CA" : "en-CA", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
        language,
      };
      const doc = React.createElement(ClosureLetterPDF, { data } as never);
      pdfBuffer = Buffer.from(await renderToBuffer(doc as React.ReactElement<DocumentProps>));
      fileName = `LettreFormation-${refStr}-${dateStr}.pdf`;
      break;
    }

    default:
      return new NextResponse("Unknown document type", { status: 400 });
  }

  // --- Envoi email ---
  const label = DOCUMENT_LABELS[documentType][language];
  const subject = language === "fr"
    ? `${dossier.cabinet.nom} — ${label}`
    : `${dossier.cabinet.nom} — ${label}`;

  await sendEmail({
    to: clientEmail,
    subject,
    html: documentEmailHtml(clientName, label, dossier.cabinet.nom, dossierId, language),
    attachments: [{ filename: fileName, content: pdfBuffer }],
  });

  // --- Audit ---
  await createAuditLog({
    cabinetId,
    userId,
    entityType: "Document",
    entityId: dossierId,
    action: "create",
    newValues: { documentType, fileName, sentTo: clientEmail, language },
    performedBy: userId,
    performedAt: new Date(),
  });

  return NextResponse.json({ success: true, sentTo: clientEmail, fileName });
}
