/**
 * Seed templates email EN pour un cabinet Ontario.
 * Stockés dans CabinetInterface.modules.email.templates
 * Run: npx tsx lib/seeds/email-templates.ts derisier
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const EMAIL_TEMPLATES = {
  invoice: {
    subject: "Invoice #{invoiceNumber} — {cabinetNom}",
    body: `Dear {clientNom},

Please find attached Invoice #{invoiceNumber} for professional services rendered in connection with your matter: {dossierTitre}.

Amount due: {montantDu} CAD (HST included)
Due date: {dateEcheance}

Payment methods accepted: cheque, bank transfer, e-transfer, or credit card.
Please make cheques payable to: {cabinetNom} — In Trust (if applicable).

If you have any questions, please do not hesitate to contact our office.

Sincerely,
{avocatNom}
{cabinetNom}
{cabinetTelephone} | {cabinetEmail}`,
  },
  relance_1: {
    subject: "Payment Reminder — Invoice #{invoiceNumber} ({joursRetard} days overdue)",
    body: `Dear {clientNom},

This is a friendly reminder that Invoice #{invoiceNumber} in the amount of {montantDu} CAD was due on {dateEcheance} and remains outstanding.

Please arrange payment at your earliest convenience. If payment has already been sent, please disregard this notice.

If you have any questions or wish to discuss a payment arrangement, please contact us directly.

Thank you for your prompt attention.

Sincerely,
{avocatNom}
{cabinetNom}`,
  },
  relance_2: {
    subject: "Second Notice — Invoice #{invoiceNumber} ({joursRetard} days overdue)",
    body: `Dear {clientNom},

We have not yet received payment for Invoice #{invoiceNumber} in the amount of {montantDu} CAD, which was due on {dateEcheance}.

Please be advised that continued non-payment may result in the suspension of services and referral to a collections process.

We strongly encourage you to contact our office immediately to resolve this matter.

Sincerely,
{avocatNom}
{cabinetNom}
{cabinetTelephone}`,
  },
  payment_confirmation: {
    subject: "Payment Received — {cabinetNom}",
    body: `Dear {clientNom},

Thank you. We have received your payment of {montantRecu} CAD on {datePaiement} for Invoice #{invoiceNumber}.

A receipt is attached for your records.

Sincerely,
{cabinetNom}`,
  },
  engagement_letter: {
    subject: "Engagement Letter — {dossierTitre} | {cabinetNom}",
    body: `Dear {clientNom},

Please find attached your Engagement Letter for the above-referenced matter. This letter outlines the scope of services, fees, and terms of our professional relationship.

Please review, sign, and return a copy at your earliest convenience. You may sign electronically or return a scanned copy by email.

If you have any questions, please contact us before signing.

Sincerely,
{avocatNom}
{cabinetNom}`,
  },
  dossier_ouverture: {
    subject: "Your File is Open — {dossierTitre} | {cabinetNom}",
    body: `Dear {clientNom},

We are pleased to confirm that your file has been opened at {cabinetNom}.

Matter: {dossierTitre}
File number: {dossierNumero}
Responsible lawyer: {avocatNom}

We will be in touch with next steps shortly. Please do not hesitate to contact us if you have any questions.

Sincerely,
{avocatNom}
{cabinetNom}`,
  },
  dossier_fermeture: {
    subject: "File Closure — {dossierTitre} | {cabinetNom}",
    body: `Dear {clientNom},

We are writing to confirm that your file for {dossierTitre} has been closed.

Please find attached your closing letter. Your documents will be retained in accordance with our records retention policy (10 years for real estate matters, 7 years for immigration matters) as required under applicable law.

It has been a pleasure assisting you. Please do not hesitate to contact us should you require our services in the future.

Sincerely,
{avocatNom}
{cabinetNom}`,
  },
};

async function main() {
  const slug = process.argv[2];
  if (!slug) {
    console.error("Usage: npx tsx lib/seeds/email-templates.ts <cabinet-slug>");
    process.exit(1);
  }

  const cabinet = await prisma.cabinet.findFirst({ where: { nom: { contains: slug, mode: "insensitive" } } });
  if (!cabinet) {
    console.error(`Cabinet not found for slug: ${slug}`);
    process.exit(1);
  }

  const iface = await prisma.cabinetInterface.findUnique({ where: { cabinetId: cabinet.id } });
  if (!iface) {
    console.error(`CabinetInterface not found for cabinet: ${cabinet.nom}`);
    process.exit(1);
  }

  const modules = iface.modules ? JSON.parse(iface.modules as string) : {};
  modules.email = {
    ...modules.email,
    locale: "en",
    templates: EMAIL_TEMPLATES,
  };

  await prisma.cabinetInterface.update({
    where: { cabinetId: cabinet.id },
    data: { modules: JSON.stringify(modules) },
  });

  console.log(`✓ Templates email EN appliqués pour: ${cabinet.nom}`);
  for (const key of Object.keys(EMAIL_TEMPLATES)) {
    console.log(`  ${key}`);
  }
}

main().finally(() => prisma.$disconnect());
