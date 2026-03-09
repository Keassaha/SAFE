/**
 * Seed minimal pour le module facturation : 1 cabinet, 1 user, 1 client, 1 dossier,
 * quelques fiches de temps et débours éligibles à facturer.
 * Run: npx tsx scripts/seed-billing.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  let cabinet = await prisma.cabinet.findFirst();
  if (!cabinet) {
    cabinet = await prisma.cabinet.create({
      data: {
        nom: "Cabinet Demo",
        adresse: "123 rue Example, Montréal QC",
      },
    });
    console.log("Cabinet créé:", cabinet.id);
  }

  let user = await prisma.user.findFirst({ where: { cabinetId: cabinet.id } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        cabinetId: cabinet.id,
        email: "avocat@demo.local",
        passwordHash: "$2a$10$dummy",
        nom: "Me Demo",
        role: "avocat",
        defaultHourlyRate: 250,
        isBillable: true,
      },
    });
    console.log("User créé:", user.id);
  }

  let client = await prisma.client.findFirst({
    where: { cabinetId: cabinet.id, raisonSociale: "Client Facturation Demo" },
  });
  if (!client) {
    client = await prisma.client.create({
      data: {
        cabinetId: cabinet.id,
        typeClient: "personne_morale",
        status: "actif",
        raisonSociale: "Client Facturation Demo",
        email: "client@demo.local",
        paymentTermsDays: 30,
        defaultInterestRateAnnual: 14,
        isActive: true,
      },
    });
    console.log("Client créé:", client.id);
  }

  let dossier = await prisma.dossier.findFirst({
    where: { cabinetId: cabinet.id, clientId: client.id },
  });
  if (!dossier) {
    dossier = await prisma.dossier.create({
      data: {
        cabinetId: cabinet.id,
        clientId: client.id,
        intitule: "Dossier Demo Facturation",
        statut: "actif",
        numeroDossier: "2026-001",
        avocatResponsableId: user.id,
        tauxHoraire: 250,
        dateOuverture: new Date(),
      },
    });
    console.log("Dossier créé:", dossier.id);
  }

  const existingTime = await prisma.timeEntry.count({
    where: { cabinetId: cabinet.id, clientId: client.id, invoiceId: null },
  });
  if (existingTime === 0) {
    await prisma.timeEntry.createMany({
      data: [
        {
          cabinetId: cabinet.id,
          clientId: client.id,
          dossierId: dossier.id,
          userId: user.id,
          date: new Date(),
          dureeMinutes: 120,
          description: "Consultation initiale",
          facturable: true,
          statut: "valide",
          tauxHoraire: 250,
          montant: 500,
          billingStatus: "READY_TO_BILL",
        },
        {
          cabinetId: cabinet.id,
          clientId: client.id,
          dossierId: dossier.id,
          userId: user.id,
          date: new Date(Date.now() - 86400000),
          dureeMinutes: 60,
          description: "Recherche juridique",
          facturable: true,
          statut: "valide",
          tauxHoraire: 250,
          montant: 250,
          billingStatus: "READY_TO_BILL",
        },
      ],
    });
    console.log("Fiches de temps créées.");
  }

  const existingExpense = await prisma.expense.count({
    where: { cabinetId: cabinet.id, clientId: client.id, invoiceId: null },
  });
  if (existingExpense === 0) {
    await prisma.expense.create({
      data: {
        cabinetId: cabinet.id,
        clientId: client.id,
        matterId: dossier.id,
        expenseDate: new Date(),
        description: "Frais de déplacement",
        vendorName: "Transport",
        amount: 75.5,
        taxable: false,
        recoverable: true,
        billingStatus: "READY_TO_BILL",
      },
    });
    console.log("Débours créé.");
  }

  console.log("Seed facturation terminé.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
