const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const supabaseUserId = '5c9eb90f-78db-4804-847f-420f94bb47e0';

async function main() {
  try {
    console.log('Creating cabinet...');
    // Créer un cabinet d'abord
    const cabinet = await prisma.cabinet.create({
      data: {
        nom: 'Cabinet Test Design',
        adresse: '123 Rue de la Paix, Montréal, QC',
        email: 'test@safe-legal.com',
        telephone: '+1 (514) 555-1234',
        plan: 'essentiel'
      }
    });

    console.log('✅ Cabinet créé:', cabinet.nom);

    console.log('Creating client...');
    // Créer un client pour ce cabinet
    const client = await prisma.client.create({
      data: {
        cabinetId: cabinet.id,
        typeClient: 'personne_morale',
        status: 'actif',
        raisonSociale: 'Acme Corporation',
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

    console.log('✅ Client créé avec 5 dossiers!');
    console.log('Client:', client.raisonSociale);
    console.log('\n📋 Résumé:');
    console.log('Cabinet ID:', cabinet.id);
    console.log('Client ID:', client.id);
    console.log('Dossiers créés: 5');
    console.log('Documents créés: 10');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    if (error.code === 'P2002') {
      console.log('Ce cabinet existe peut-être déjà.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();
