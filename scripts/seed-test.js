const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const userId = '5c9eb90f-78db-4804-847f-420f94bb47e0';

async function main() {
  try {
    // Créer un client avec dossiers
    const client = await prisma.client.create({
      data: {
        raisonSociale: 'Acme Corporation',
        userId: userId,
        dossiers: {
          create: [
            {
              intitule: 'Droit Famille - Séparation',
              numeroDossier: 'FAM-2024-001',
              type: 'famille',
              richDocuments: {
                create: [
                  { titre: 'Accord de séparation', type: 'accord', statut: 'brouillon' },
                  { titre: 'Pension alimentaire', type: 'contrat', statut: 'en cours' }
                ]
              }
            },
            {
              intitule: 'Immobilier - Vente',
              numeroDossier: 'IMM-2024-042',
              type: 'immobilier',
              richDocuments: {
                create: [
                  { titre: 'Acte de vente', type: 'acte', statut: 'signé' },
                  { titre: 'Hypothèque', type: 'contrat', statut: 'en cours' }
                ]
              }
            },
            {
              intitule: 'Litige Commercial',
              numeroDossier: 'LIT-2024-089',
              type: 'litige',
              richDocuments: {
                create: [
                  { titre: 'Requête en annulation', type: 'requête', statut: 'déposée' },
                  { titre: 'Mémoire en défense', type: 'mémo', statut: 'en cours' }
                ]
              }
            },
            {
              intitule: 'Rédaction de Contrats',
              numeroDossier: 'CON-2024-056',
              type: 'contrat',
              richDocuments: {
                create: [
                  { titre: 'Contrat de prestation', type: 'contrat', statut: 'brouillon' },
                  { titre: 'Contrat d\'emploi', type: 'contrat', statut: 'en cours' }
                ]
              }
            },
            {
              intitule: 'Immigration - Résidence',
              numeroDossier: 'IMG-2024-023',
              type: 'immigration',
              richDocuments: {
                create: [
                  { titre: 'Dossier de résidence', type: 'dossier', statut: 'en cours' },
                  { titre: 'Demande de travail', type: 'demande', statut: 'en cours' }
                ]
              }
            }
          ]
        }
      }
    });

    console.log('✅ Données de test créées avec succès !');
    console.log('Client:', client.raisonSociale);
    console.log('5 dossiers créés');
  } catch (error) {
    console.error('Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
