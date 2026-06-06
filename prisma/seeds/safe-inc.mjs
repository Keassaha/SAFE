/**
 * Provisionne Cabinet SAFE en tant que client de son propre produit (dog food).
 *
 * Stratégie : ADR-006 — SAFE devient un Cabinet client de SAFE.
 * Le CEO utilise le produit SAFE pour sa propre compta, ses factures, ses dépenses.
 *
 * Usage local dev :
 *   SAFE_ADMIN_EMAIL=jeremie@safecabinet.ca \
 *   SAFE_ADMIN_PASSWORD=<password_choisi> \
 *   SAFE_ADMIN_NOM="Jérémie" \
 *   node prisma/seeds/safe-inc.mjs
 *
 * Idempotent : peut être rejoué sans risque. Met à jour si Cabinet existe déjà.
 *
 * Modules activés (CabinetInterface) :
 *  - Tableau de bord, Clients, Facturation, Comptabilité, Documents, Gestion
 * Modules désactivés (non pertinents pour SaaS) :
 *  - Fidéicommis, Conformité Barreau, Conflict check, Dossiers juridiques
 *
 * Caveat connus :
 *  - Le modèle Client est conçu pour clients d'un cabinet d'avocats. On l'utilise ici
 *    pour les cabinets clients de SAFE Inc. (méta-niveau).
 *  - TVQ/TPS Québec est appliqué par défaut, à valider selon statut SAFE Inc.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// --- Configuration SAFE Inc. ---
const SAFE_INC = {
  cabinet: {
    nom: "SAFE",
    email: "jeremie@safecabinet.ca",
    plan: "fondateur",
    // adresse, telephone, logoUrl à compléter via UI Gestion plus tard
    config: JSON.stringify({
      devise: "CAD",
      tauxInteret: 0,
      tauxTVQ: 9.975,
      tauxTPS: 5.0,
      langueDefaut: "fr",
      formatFacture: "standard",
    }),
  },
  admin: {
    email: process.env.SAFE_ADMIN_EMAIL || "jeremie@safecabinet.ca",
    password: process.env.SAFE_ADMIN_PASSWORD,
    nom: process.env.SAFE_ADMIN_NOM || "Jérémie",
    role: "admin_cabinet",
    defaultHourlyRate: 0,
    isBillable: false,
  },
  interface: {
    ongletsActifs: [
      "tableau-de-bord",
      "clients",
      "facturation",
      "comptabilite",
      "documents",
      "gestion",
      "rapports",
    ],
    ongletsMasques: [
      "fideicommis",
      "conformite",
      "dossiers",
      "navette",
      "temps",
    ],
    modules: {
      grille_tarifaire: false,
      rabais_client: true,
      facturation_recurrente: true,
      paiements_stripe: true,
      depenses: true,
      exports_comptables: true,
    },
    widgets: [
      "factures_impayees",
      "depenses_recentes",
      "revenus_mois",
      "abonnements_actifs",
    ],
    disciplines: [],
    modeFacturation: JSON.stringify({
      principal: "forfait",
      grille: false,
      rabais: true,
      recurrent: true,
    }),
    conformite: JSON.stringify({
      verif_conflits: false,
      loi25: true,
      retention: { duree: 6 },
    }),
  },
};

// --- Validation env ---
if (!SAFE_INC.admin.password) {
  console.error("\n❌ ERREUR : variable SAFE_ADMIN_PASSWORD manquante");
  console.error("   Exemple :");
  console.error("   SAFE_ADMIN_PASSWORD=<password> node prisma/seeds/safe-inc.mjs\n");
  process.exit(1);
}

if (SAFE_INC.admin.password.length < 12) {
  console.error("\n❌ ERREUR : password doit faire au moins 12 caractères\n");
  process.exit(1);
}

// --- Provisionning idempotent ---
async function main() {
  console.log("\n🏢 Provisioning Cabinet SAFE (dog food strategy)");
  console.log("─".repeat(60));

  // 1. Upsert Cabinet
  console.log("\n[1/4] Upsert Cabinet 'SAFE'...");
  let cabinet = await prisma.cabinet.findFirst({
    where: { nom: SAFE_INC.cabinet.nom },
  });

  if (cabinet) {
    console.log(`     Cabinet existe déjà (id: ${cabinet.id})`);
    cabinet = await prisma.cabinet.update({
      where: { id: cabinet.id },
      data: {
        email: SAFE_INC.cabinet.email,
        plan: SAFE_INC.cabinet.plan,
        config: SAFE_INC.cabinet.config,
      },
    });
    console.log("     Cabinet mis à jour");
  } else {
    cabinet = await prisma.cabinet.create({
      data: SAFE_INC.cabinet,
    });
    console.log(`     ✅ Cabinet créé (id: ${cabinet.id})`);
  }

  // 2. Upsert User CEO
  console.log("\n[2/4] Upsert User CEO...");
  const passwordHash = await bcrypt.hash(SAFE_INC.admin.password, 12);
  const existingUser = await prisma.user.findFirst({
    where: { email: SAFE_INC.admin.email },
  });

  let user;
  if (existingUser) {
    console.log(`     User existe déjà (id: ${existingUser.id})`);
    user = await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        cabinetId: cabinet.id,
        passwordHash,
        nom: SAFE_INC.admin.nom,
        role: SAFE_INC.admin.role,
        defaultHourlyRate: SAFE_INC.admin.defaultHourlyRate,
        isBillable: SAFE_INC.admin.isBillable,
      },
    });
    console.log("     User mis à jour (rattaché à Cabinet SAFE)");
  } else {
    user = await prisma.user.create({
      data: {
        cabinetId: cabinet.id,
        email: SAFE_INC.admin.email,
        passwordHash,
        nom: SAFE_INC.admin.nom,
        role: SAFE_INC.admin.role,
        defaultHourlyRate: SAFE_INC.admin.defaultHourlyRate,
        isBillable: SAFE_INC.admin.isBillable,
      },
    });
    console.log(`     ✅ User CEO créé (id: ${user.id})`);
  }

  // 3. Upsert CabinetInterface
  console.log("\n[3/4] Configuration CabinetInterface...");
  const interfaceData = {
    ongletsActifs: JSON.stringify(SAFE_INC.interface.ongletsActifs),
    ongletsMasques: JSON.stringify(SAFE_INC.interface.ongletsMasques),
    modules: JSON.stringify(SAFE_INC.interface.modules),
    widgets: JSON.stringify(SAFE_INC.interface.widgets),
    disciplines: JSON.stringify(SAFE_INC.interface.disciplines),
    modeFacturation: SAFE_INC.interface.modeFacturation,
    conformite: SAFE_INC.interface.conformite,
  };

  const existingInterface = await prisma.cabinetInterface.findUnique({
    where: { cabinetId: cabinet.id },
  });

  if (existingInterface) {
    await prisma.cabinetInterface.update({
      where: { cabinetId: cabinet.id },
      data: interfaceData,
    });
    console.log("     CabinetInterface mis à jour");
  } else {
    await prisma.cabinetInterface.create({
      data: {
        cabinetId: cabinet.id,
        ...interfaceData,
      },
    });
    console.log("     ✅ CabinetInterface créé");
  }

  // 4. Récap
  console.log("\n[4/4] Récapitulatif");
  console.log("─".repeat(60));
  console.log(`Cabinet ID    : ${cabinet.id}`);
  console.log(`Cabinet nom   : ${cabinet.nom}`);
  console.log(`Email contact : ${cabinet.email}`);
  console.log(`Plan          : ${cabinet.plan}`);
  console.log(`User CEO ID   : ${user.id}`);
  console.log(`User email    : ${user.email}`);
  console.log(`User rôle     : ${user.role}`);
  console.log("─".repeat(60));

  console.log("\n✅ SAFE provisionné comme Cabinet client de SAFE (dog food).");
  console.log("\nProchaines étapes manuelles :");
  console.log("  1. Login sur /connexion avec :", user.email);
  console.log("  2. Compléter adresse + téléphone via /gestion/parametres-cabinet");
  console.log("  3. Uploader le logo SAFE");
  console.log("  4. Créer le premier Client (= votre cliente actuelle)");
  console.log("  5. Émettre la première facture via SAFE\n");
}

main()
  .catch((err) => {
    console.error("\n❌ Erreur provisioning :", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
