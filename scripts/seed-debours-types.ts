/**
 * Seed du catalogue des types de débours (tblDebours / DeboursType).
 * Insère les catégories et noms par défaut pour chaque cabinet existant.
 * Run: npx tsx scripts/seed-debours-types.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEBOURS_CATALOG: { categorie: string; nom: string; taxable?: boolean }[] = [
  // Frais administratifs
  { categorie: "Frais administratifs", nom: "Frais d'impression", taxable: false },
  { categorie: "Frais administratifs", nom: "Frais de photocopie", taxable: false },
  { categorie: "Frais administratifs", nom: "Frais de numérisation", taxable: false },
  { categorie: "Frais administratifs", nom: "Frais de télécopie", taxable: false },
  { categorie: "Frais administratifs", nom: "Frais de poste", taxable: false },
  { categorie: "Frais administratifs", nom: "Frais de courrier recommandé", taxable: false },
  { categorie: "Frais administratifs", nom: "Frais de messagerie", taxable: false },
  { categorie: "Frais administratifs", nom: "Frais de préparation de dossier", taxable: false },
  { categorie: "Frais administratifs", nom: "Frais administratifs", taxable: false },
  // Frais judiciaires
  { categorie: "Frais judiciaires", nom: "Frais de dépôt au tribunal", taxable: false },
  { categorie: "Frais judiciaires", nom: "Frais d'ouverture de dossier tribunal", taxable: false },
  { categorie: "Frais judiciaires", nom: "Frais d'inscription au rôle", taxable: false },
  { categorie: "Frais judiciaires", nom: "Frais d'audience", taxable: false },
  { categorie: "Frais judiciaires", nom: "Frais de copie de jugement", taxable: false },
  { categorie: "Frais judiciaires", nom: "Frais du greffe", taxable: false },
  // Frais d'huissier
  { categorie: "Frais d'huissier", nom: "Frais de signification", taxable: false },
  { categorie: "Frais d'huissier", nom: "Frais de déplacement huissier", taxable: false },
  { categorie: "Frais d'huissier", nom: "Frais de rapport de signification", taxable: false },
  { categorie: "Frais d'huissier", nom: "Frais de saisie", taxable: false },
  { categorie: "Frais d'huissier", nom: "Frais d'exécution de jugement", taxable: false },
  { categorie: "Frais d'huissier", nom: "Frais de constat d'huissier", taxable: false },
  // Registre foncier
  { categorie: "Registre foncier", nom: "Recherche registre foncier", taxable: false },
  { categorie: "Registre foncier", nom: "Publication registre foncier", taxable: false },
  { categorie: "Registre foncier", nom: "Inscription hypothèque", taxable: false },
  { categorie: "Registre foncier", nom: "Radiation hypothèque", taxable: false },
  { categorie: "Registre foncier", nom: "Consultation registre foncier", taxable: false },
  { categorie: "Registre foncier", nom: "Copie d'acte", taxable: false },
  // Registre des entreprises
  { categorie: "Registre des entreprises", nom: "Recherche REQ", taxable: false },
  { categorie: "Registre des entreprises", nom: "Dépôt REQ", taxable: false },
  { categorie: "Registre des entreprises", nom: "Mise à jour REQ", taxable: false },
  { categorie: "Registre des entreprises", nom: "Certificat entreprise", taxable: false },
  { categorie: "Registre des entreprises", nom: "Immatriculation entreprise", taxable: false },
  // Recherche juridique
  { categorie: "Recherche juridique", nom: "Recherche SOQUIJ", taxable: false },
  { categorie: "Recherche juridique", nom: "Recherche jurisprudence", taxable: false },
  { categorie: "Recherche juridique", nom: "Recherche doctrine juridique", taxable: false },
  { categorie: "Recherche juridique", nom: "Copie jugement", taxable: false },
  { categorie: "Recherche juridique", nom: "Accès base de données juridique", taxable: false },
  // Experts
  { categorie: "Experts", nom: "Frais d'expert", taxable: false },
  { categorie: "Experts", nom: "Frais d'évaluation", taxable: false },
  { categorie: "Experts", nom: "Rapport d'expertise", taxable: false },
  { categorie: "Experts", nom: "Expert médical", taxable: false },
  { categorie: "Experts", nom: "Expert comptable", taxable: false },
  { categorie: "Experts", nom: "Expert immobilier", taxable: false },
  // Traduction
  { categorie: "Traduction", nom: "Traduction", taxable: false },
  { categorie: "Traduction", nom: "Traduction certifiée", taxable: false },
  { categorie: "Traduction", nom: "Interprète", taxable: false },
  // Déplacement
  { categorie: "Déplacement", nom: "Frais de déplacement", taxable: false },
  { categorie: "Déplacement", nom: "Kilométrage", taxable: false },
  { categorie: "Déplacement", nom: "Stationnement", taxable: false },
  { categorie: "Déplacement", nom: "Transport", taxable: false },
  { categorie: "Déplacement", nom: "Hébergement", taxable: false },
];

async function main() {
  const cabinets = await prisma.cabinet.findMany({ select: { id: true } });
  if (cabinets.length === 0) {
    console.log("Aucun cabinet trouvé. Créez d'abord un cabinet (ex: seed-billing.ts).");
    return;
  }

  for (const cabinet of cabinets) {
    const existing = await prisma.deboursType.count({ where: { cabinetId: cabinet.id } });
    if (existing > 0) {
      console.log(`Cabinet ${cabinet.id}: ${existing} types déjà présents, skip.`);
      continue;
    }

    await prisma.deboursType.createMany({
      data: DEBOURS_CATALOG.map((row) => ({
        cabinetId: cabinet.id,
        nom: row.nom,
        categorie: row.categorie,
        description: row.nom,
        taxable: row.taxable ?? false,
        actif: true,
      })),
    });
    console.log(`Cabinet ${cabinet.id}: ${DEBOURS_CATALOG.length} types de débours créés.`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
