/**
 * SAFE — Carrière Solo
 * Corpus checklist bi-juridiction (QC + ON).
 * Voix opérateur : phrases courtes, scandées, vocab opérationnel
 * (lockup, revenue leakage, utilization, fidéicommis).
 * Aucun tiret cadratin reliant. Émojis fonctionnels uniquement.
 */

import type { ChecklistItem } from "./types";

export const CHECKLIST: ChecklistItem[] = [
  // ─────────────────────────────────────────────────────────────────────
  // SECTION 1 — Conformité Barreau / LSO
  // ─────────────────────────────────────────────────────────────────────

  {
    id: "barreau-inscription",
    section: "barreau",
    priority: "critique",
    jurisdiction: "both",
    action: "T'inscrire au Tableau de l'Ordre et garder ton statut « en règle ».",
    delai: "Avant le premier acte posé comme avocat. Aucune rétroactivité.",
    cout: {
      qc: "~855 $/an au-delà de 3 ans · ~273 $ en 1re année",
      on: "2 039 $/an (cotisation 2025)",
    },
    autorite: {
      label: "Barreau du Québec / Law Society of Ontario",
      url: "https://www.barreau.qc.ca/fr/membres-ordre/tableau-ordre/inscription/",
    },
    piege: {
      texte: "Tout acte posé sans être inscrit = exercice illégal. Art. 128 Loi sur le Barreau.",
    },
  },

  {
    id: "barreau-lar-on",
    section: "barreau",
    priority: "critique",
    jurisdiction: "on",
    action: "Déposer ton Lawyer Annual Report (LAR) sur LSO Connects.",
    delai: "31 mars de chaque année.",
    cout: { commun: "Gratuit." },
    autorite: {
      label: "LSO — Lawyer Annual Report",
      url: "https://lso.ca/about-your-licence/annual-report",
    },
    piege: {
      texte: "Non-dépôt = suspension du permis. Exigences renforcées depuis mars 2026.",
    },
  },

  {
    id: "barreau-assurance",
    section: "barreau",
    priority: "critique",
    jurisdiction: "both",
    highlightForFear: ["argent", "conformite"],
    action:
      "Souscrire à l'assurance responsabilité professionnelle obligatoire.",
    delai: "Automatique à l'inscription. Renouvellement 1er avril.",
    cout: {
      qc: "750 $/an (FARPBQ, sans franchise, 10 M$/sinistre)",
      on: "3 250 $/an + PST · rabais nouveaux : 50 % an 1, 40 % an 2, 30 % an 3, 20 % an 4",
    },
    autorite: {
      label: "FARPBQ (QC) · LawPRO (ON)",
      url: "https://www.lawpro.ca/your-policy/new-lawyers/",
    },
    piege: {
      texte: "Renouvellement LawPRO en retard : surcharge 350 $ après 6 nov., 600 $ après 3 déc.",
    },
  },

  {
    id: "barreau-levees-on",
    section: "barreau",
    priority: "critique",
    jurisdiction: "on",
    practiceAreas: ["immobilier", "civil"],
    action: "Déclarer les Transaction Levies LawPRO chaque trimestre.",
    delai: "30 jours après fin de mars / juin / septembre / décembre.",
    cout: {
      on: "65 $ par transaction immobilière · 65 $ par partie/instance en litige civil",
    },
    autorite: {
      label: "LawPRO — Transaction Levy",
      url: "https://www.lawpro.ca/faqs/transaction-levy-filings-real-estate/",
    },
    piege: {
      texte:
        "Déclaration zéro obligatoire même sans transaction. Oubli = audit déclenché.",
    },
    sansAvec: {
      sansSafe:
        "Tu te rappelles toi-même chaque 30 du mois. Tu comptes les transactions à la main.",
      avecSafe:
        "Comptage auto au dépôt fidéicommis. Déclaration trimestrielle pré-remplie.",
      chiffre: {
        valeur: "0 retard, 0 oubli",
        source: "Auto-recensement transactionnel",
      },
    },
  },

  {
    id: "barreau-cpd",
    section: "barreau",
    priority: "important",
    jurisdiction: "both",
    action: "Compléter ta formation continue obligatoire.",
    delai: "31 décembre chaque année (ON) · 31 mars 2027 fin de cycle (QC)",
    cout: { commun: "Variable. Plusieurs heures sont gratuites." },
    autorite: {
      label: "Barreau du Québec · LSO",
      url: "https://lso.ca/lawyers/practice-supports-and-resources/professional-development-and-cpd",
    },
    piege: {
      texte:
        "QC : 30 h sur 2 ans dont 3 h éthique/déonto · ON : 12 h/an dont 3 h Professionnalisme (incl. 1 h EDI).",
    },
  },

  {
    id: "barreau-rcnepa",
    section: "barreau",
    priority: "critique",
    jurisdiction: "qc",
    highlightForFear: ["conformite", "admin"],
    action:
      "Te conformer au RCNEPA : comptabilité d'administration + fidéicommis + délais de conservation.",
    delai: "Dès l'ouverture du cabinet. Formation webpro dans les 6 mois après ouverture du compte fidéicommis.",
    cout: { qc: "Formation webpro gratuite." },
    autorite: {
      label: "Barreau du Québec — Comptabilité et normes",
      url: "https://www.barreau.qc.ca/fr/membres-ordre/obligations-membres/comptabilite-fideicommis-facturation/",
    },
    piege: {
      texte: "Non-conformité = inspection comptable, puis enquête spéciale.",
    },
    sansAvec: {
      sansSafe:
        "Tu apprends le RCNEPA tout seul. Tu paramètres QuickBooks en bricolant. Tu pries pour l'inspection.",
      avecSafe:
        "RCNEPA pré-câblé. Journaux conformes générés en temps réel. Inspection prête en 1 clic.",
      chiffre: {
        valeur: "0 ligne de paramétrage",
        source: "Conformité native cabinet d'avocats QC",
      },
    },
  },

  {
    id: "barreau-by-laws-on",
    section: "barreau",
    priority: "critique",
    jurisdiction: "on",
    highlightForFear: ["conformite", "admin"],
    action:
      "Te conformer aux By-Law 7.1, 8 et 9 du LSO : books and records + trust accounting.",
    delai: "Dès l'ouverture du cabinet.",
    cout: { commun: "0 $ direct. Logiciel conforme à prévoir." },
    autorite: {
      label: "LSO — By-Laws and Rules",
      url: "https://lso.ca/about-lso/legislation-rules/by-laws",
    },
    piege: {
      texte:
        "By-Law 9 trust comparison mensuelle obligatoire avant le 25 du mois suivant.",
    },
    sansAvec: {
      sansSafe:
        "Tu lis les By-Laws le soir. Tu construis tes journaux dans Excel. Tu espères passer l'audit.",
      avecSafe:
        "Trust Receipts Journal, Disbursements Journal et Clients' Trust Ledger générés automatiquement.",
      chiffre: {
        valeur: "10 ans de rétention auto",
        source: "By-Law 9 records management",
      },
    },
  },

  {
    id: "barreau-loi25",
    section: "barreau",
    priority: "critique",
    jurisdiction: "qc",
    highlightForFear: ["conformite"],
    action:
      "Te mettre en conformité Loi 25 : responsable RP + politique + registre d'incidents.",
    delai: "Dès le premier renseignement personnel collecté.",
    cout: { qc: "0 $ direct. Sanctions jusqu'à 10 M$ ou 2 % CA mondial." },
    autorite: {
      label: "Commission d'accès à l'information du Québec",
      url: "https://www.cai.gouv.qc.ca",
    },
    piege: {
      texte:
        "Hébergement courriel hors Canada sans transparence + absence de politique = sanction CAI.",
    },
    sansAvec: {
      sansSafe:
        "Tu rédiges seul ta politique. Tu trouves un hébergeur canadien. Tu tiens un registre vide dans Word.",
      avecSafe:
        "Politique livrée. Hébergement Québec. Registre incidents intégré. Responsable RP désigné dans le profil.",
      chiffre: {
        valeur: "Loi 25 livrée le jour 1",
        source: "Conformité native SAFE",
      },
    },
  },

  {
    id: "barreau-pipeda-on",
    section: "barreau",
    priority: "important",
    jurisdiction: "on",
    highlightForFear: ["conformite"],
    action:
      "Te mettre en conformité PIPEDA : responsable vie privée + notification d'atteinte.",
    delai: "Dès le premier client.",
    cout: { commun: "0 $ direct." },
    autorite: {
      label: "Commissariat à la vie privée du Canada",
      url: "https://www.priv.gc.ca",
    },
    piege: {
      texte:
        "Atteinte avec risque réel de préjudice grave non notifiée = enquête CPVP + amende.",
    },
  },

  {
    id: "barreau-publicite",
    section: "barreau",
    priority: "important",
    jurisdiction: "both",
    highlightForFear: ["clients"],
    action:
      "Respecter les règles de publicité : pas de « spécialiste », pas de témoignages clients (QC), pas de garantie de résultat.",
    delai: "Dès la mise en ligne de ton site ou de ton profil LinkedIn.",
    cout: { commun: "0 $." },
    autorite: {
      label: "Code de déontologie · LSO Rule 4.2",
      url: "https://www.juriclik.com/ressources/guide-publicite-avocat/",
    },
    piege: {
      texte:
        "« Spécialiste » sans certificat officiel = sanction. ON : pas de Certified Specialist Program ? Utilise « focuses on » / « concentrates on ».",
    },
  },

  {
    id: "barreau-inspection",
    section: "barreau",
    priority: "recommande",
    jurisdiction: "both",
    appliesToStatus: ["admis_recent"],
    action:
      "QC : demander la visite gratuite de démarrage du Barreau. ON : suivre Foundations for a Law Practice.",
    delai: "Après 1 an de pratique (QC) · dès l'ouverture (ON).",
    cout: { qc: "Gratuit", on: "Variable LSO Store" },
    autorite: {
      label: "Barreau du Québec — Inspection · LSO Practice Management",
      url: "https://www.barreau.qc.ca/fr/membres-ordre/inspection-professionnelle/",
    },
    sansAvec: {
      sansSafe:
        "Tu passes la soirée à compiler 3 dossiers, relevés bancaires, journaux fidéicommis.",
      avecSafe:
        "Rapport d'inspection prêt en un clic. Le syndic regarde, signe, repart.",
    },
  },

  {
    id: "barreau-conflits",
    section: "barreau",
    priority: "critique",
    jurisdiction: "both",
    highlightForFear: ["conformite"],
    action:
      "Tenir un registre de détection des conflits d'intérêts (clients, sociétés, parties adverses).",
    delai: "Dès l'ouverture du premier dossier.",
    cout: { commun: "0 $ direct. Risque de radiation si manqué." },
    piege: {
      texte:
        "En solo, aucun système ne te le rappelle. Une représentation conflictuelle = plainte syndic quasi certaine.",
    },
    sansAvec: {
      sansSafe:
        "Tu tiens un fichier Excel. Tu fais une recherche manuelle à chaque ouverture de dossier.",
      avecSafe:
        "Détection croisée nom / société / partie adverse à l'ouverture du dossier. Alerte si match.",
    },
  },

  // ─────────────────────────────────────────────────────────────────────
  // SECTION 2 — Comptabilité en fidéicommis
  // ─────────────────────────────────────────────────────────────────────

  {
    id: "fiducie-ouverture",
    section: "fiducie",
    priority: "critique",
    jurisdiction: "both",
    practiceAreas: ["famille", "immobilier", "corporatif", "civil", "immigration"],
    action:
      "Ouvrir un compte en fidéicommis dans une institution acceptée.",
    delai: "Avant de recevoir la première avance ou somme pour un tiers.",
    cout: { commun: "Frais bancaires variables." },
    autorite: {
      label: "Liste institutions acceptées — Barreau / LSO",
      url: "https://www.barreau.qc.ca/fr/membres-ordre/obligations-membres/comptabilite-fideicommis-facturation/",
    },
  },

  {
    id: "fiducie-avis",
    section: "fiducie",
    priority: "critique",
    jurisdiction: "both",
    action: "Aviser ton ordre de l'ouverture (ou fermeture) du compte.",
    delai:
      "Dès ouverture (QC, via formulaire) · Dans le mois (ON, via LSO Connects).",
    cout: { commun: "Gratuit." },
    piege: {
      texte: "Oubli = première anomalie détectée à l'audit suivant.",
    },
  },

  {
    id: "fiducie-journaux",
    section: "fiducie",
    priority: "critique",
    jurisdiction: "both",
    highlightForFear: ["conformite", "admin"],
    action:
      "Tenir les journaux obligatoires : recettes-déboursés + cartes-clients (QC) / Trust Receipts + Disbursements + Clients' Trust Ledger (ON).",
    delai: "À chaque transaction. Date réelle, pas date du relevé bancaire.",
    cout: { commun: "0 $ direct. Logiciel conforme requis." },
    piege: {
      texte:
        "Excel = risque structurel. Les modèles RCNEPA / By-Law 9 ne sont pas dans QuickBooks.",
    },
    sansAvec: {
      sansSafe:
        "Tu saisis tes journaux à la main, le soir, ou en fin de mois. Tu rattrapes.",
      avecSafe:
        "Journaux générés en temps réel à chaque mouvement. Pas de fin de mois à rattraper.",
      chiffre: {
        valeur: "3,1 h/mois récupérées",
        source: "Bill4Time — temps moyen perdu en saisie",
      },
    },
  },

  {
    id: "fiducie-reconciliation",
    section: "fiducie",
    priority: "critique",
    jurisdiction: "both",
    highlightForFear: ["conformite", "admin"],
    action: "Faire la réconciliation mensuelle fidéicommis vs relevé bancaire.",
    delai:
      "Chaque mois · ON : avant le 25 du mois suivant (By-Law 9 Trust Comparison).",
    cout: { commun: "0 $ direct." },
    piege: {
      texte:
        "Découvert ou dépôt en attente = facteur de risque audit ciblé (LSO utilise 10 ans d'historique).",
    },
    sansAvec: {
      sansSafe:
        "Tu compares ligne par ligne avec le relevé. Tu cherches les écarts. Tu refais le calcul.",
      avecSafe:
        "Rapprochement automatique. Écarts surlignés. Trust Comparison prête en PDF.",
    },
  },

  {
    id: "fiducie-t3-qc",
    section: "fiducie",
    priority: "important",
    jurisdiction: "qc",
    action:
      "Produire une déclaration T3 si tu détiens un compte fidéicommis particulier (F3) au-delà du seuil.",
    delai:
      "Depuis l'année d'imposition 2023 · sauf compte < 3 mois ou JVM < 50 000 $.",
    cout: { qc: "Pénalité min. 25 $/jour jusqu'à 2 500 $ + 5 % JVM si défaut." },
    autorite: {
      label: "ARC — Déclaration T3 fiducie",
      url: "https://www.canada.ca/fr/agence-revenu.html",
    },
    sansAvec: {
      sansSafe:
        "Tu te souviens à la main du seuil 50k / 3 mois. Tu rates la T3. Pénalité.",
      avecSafe:
        "Alerte automatique dès qu'un compte F3 franchit le seuil. T3 ne sera jamais oubliée.",
      chiffre: {
        valeur: "Jusqu'à 2 500 $ + 5 % JVM",
        source: "ARC, pénalité T3 défaut de production",
      },
    },
  },

  {
    id: "fiducie-cash-on",
    section: "fiducie",
    priority: "critique",
    jurisdiction: "on",
    action: "Respecter la limite de 7 500 $ en espèces par transaction.",
    delai: "Continu. Règle 3.6 des Rules of Professional Conduct.",
    cout: { on: "Sanction disciplinaire si dépassé." },
    autorite: {
      label: "LSO Rule 3.6 — Cash Transactions",
      url: "https://lso.ca/about-lso/legislation-rules/rules-of-professional-conduct",
    },
  },

  {
    id: "fiducie-form9a-on",
    section: "fiducie",
    priority: "important",
    jurisdiction: "on",
    action:
      "Obtenir une autorisation écrite (Form 9A ou équivalent) pour tout transfert électronique fidéicommis.",
    delai: "Avant chaque transfert entrant/sortant.",
    cout: { commun: "0 $." },
    piege: {
      texte:
        "Fraude BEC (Business Email Compromise) : vérifie les instructions de paiement par canal indépendant.",
    },
  },

  {
    id: "fiducie-retrait",
    section: "fiducie",
    priority: "critique",
    jurisdiction: "both",
    highlightForFear: ["conformite", "argent"],
    action:
      "Retirer les honoraires du fidéicommis SANS DÉLAI dès que la note d'honoraires est envoyée au client.",
    delai: "Dès envoi de la facture, même si contestée après coup.",
    cout: { commun: "0 $." },
    autorite: {
      label: "RCNEPA art. 56 et 58 (QC) · By-Law 9 (ON)",
      url: "https://www.barreau.qc.ca/fr/membres-ordre/deontologie-avocats/balises-conseils-conduite-deontologique/sommes-argent-comptes-fideicommis/",
    },
    piege: {
      texte: "Cause la plus fréquente de plaintes au syndic en fidéicommis.",
    },
    sansAvec: {
      sansSafe:
        "Tu retires à la fin du mois. Parfois la semaine suivante. Tu accumules du risque.",
      avecSafe:
        "Transfert auto fidéicommis → administration à l'émission de la facture. Zéro délai.",
    },
  },

  {
    id: "fiducie-conservation",
    section: "fiducie",
    priority: "important",
    jurisdiction: "both",
    action:
      "Conserver tes registres fidéicommis : 7 ans après fermeture du dossier (QC) · 10 ans + année en cours (ON).",
    delai: "Continu. À planifier au logiciel.",
    cout: { commun: "0 $." },
    piege: {
      texte:
        "Détruire un document client sans autorisation = faute déontologique grave.",
    },
    sansAvec: {
      sansSafe: "Tu tiens un Excel de tes échéances de conservation. Tu oublies.",
      avecSafe:
        "Horloge de conservation par dossier. Alerte de fin de période. Archivage chiffré.",
    },
  },

  // ─────────────────────────────────────────────────────────────────────
  // SECTION 3 — Structure juridique et fiscale
  // ─────────────────────────────────────────────────────────────────────

  {
    id: "structure-choix",
    section: "structure",
    priority: "important",
    jurisdiction: "both",
    action:
      "Choisir ta structure : travailleur autonome vs SPA (QC) / Professional Corporation (ON).",
    delai: "J-90 à J-60.",
    cout: { commun: "0 $ (TA) · 950–1 090 $ clé en main (SPA) · 300–500 $ + LSO (PC)" },
    piege: {
      texte:
        "Incorporation rentable typiquement au-delà de 100–150 k$ de revenus bruts. Sous ce seuil, TA simple.",
    },
  },

  {
    id: "structure-cpa",
    section: "structure",
    priority: "recommande",
    jurisdiction: "both",
    action:
      "Consulter un comptable CPA sur la fiscalité optimale (structure + salaire/dividendes).",
    delai: "J-90 à J-75.",
    cout: { commun: "200–500 $ consultation initiale." },
  },

  {
    id: "structure-immatriculation",
    section: "structure",
    priority: "critique",
    jurisdiction: "both",
    action:
      "T'immatriculer comme entreprise (REQ au QC · Ontario Business Registry).",
    delai: "Avant la première facture émise sous un nom commercial.",
    cout: {
      qc: "41 $ (personne physique) · maj annuelle 41 $",
      on: "~60 $ Business Name Registration",
    },
    autorite: {
      label: "REQ · Ontario Business Registry",
      url: "https://www.registreentreprises.gouv.qc.ca",
    },
  },

  {
    id: "structure-engagement",
    section: "structure",
    priority: "critique",
    jurisdiction: "both",
    appliesToStatus: ["admis_recent", "admis_5ans", "transition"],
    action:
      "Si SPA/PC : transmettre l'Engagement de société au Barreau (QC) ou obtenir le Certificat d'autorisation LSO (ON).",
    delai: "AVANT le premier acte au sein de la société.",
    cout: { commun: "Frais Barreau / LSO à vérifier." },
    autorite: {
      label: "Barreau du Québec — Exercice en société · LSO Professional Corp.",
      url: "https://lso.ca/lawyers/professional-corporations",
    },
    piege: {
      texte:
        "Une PC en Ontario doit être incorporée provincialement (pas fédéralement). Articles 5 et 8 obligatoires.",
    },
  },

  {
    id: "structure-bn",
    section: "structure",
    priority: "critique",
    jurisdiction: "both",
    action:
      "Obtenir ton Business Number ARC (BN) et tes comptes RT/RP/RC selon besoin.",
    delai: "Avant la première fourniture taxable.",
    cout: { commun: "Gratuit, en ligne via BRO." },
    autorite: {
      label: "ARC — Business Registration Online",
      url: "https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/registering-your-business/register.html",
    },
    piege: {
      texte: "Depuis novembre 2025, l'ARC n'accepte plus les inscriptions par téléphone.",
    },
  },

  {
    id: "structure-tps-tvq",
    section: "structure",
    priority: "critique",
    jurisdiction: "both",
    action:
      "T'inscrire à la TPS/TVQ (QC) ou à la HST (ON, 13 %).",
    delai:
      "Avant la 1re fourniture (TVQ) · dans les 30 jours si seuil 30 000 $ atteint.",
    cout: { commun: "Gratuit. Recommandé dès le départ pour récupérer les CTI/RTI." },
    autorite: {
      label: "Revenu Québec · ARC",
      url: "https://www.revenuquebec.ca/fr/entreprises/taxes/tpstvh-et-tvq/inscription-aux-fichiers-de-la-tps-et-de-la-tvq/",
    },
  },

  // ─────────────────────────────────────────────────────────────────────
  // SECTION 4 — Comptabilité et facturation
  // ─────────────────────────────────────────────────────────────────────

  {
    id: "compta-compte-pro",
    section: "compta",
    priority: "critique",
    jurisdiction: "both",
    action:
      "Ouvrir un compte bancaire professionnel distinct du compte personnel.",
    delai: "J-75 à J-60.",
    cout: { commun: "Frais bancaires variables." },
    piege: {
      texte:
        "Mélanger personnel et pro = nightmare comptable + risque déontologique.",
    },
  },

  {
    id: "compta-convention",
    section: "compta",
    priority: "important",
    jurisdiction: "both",
    action:
      "Rédiger une convention de mandat et d'honoraires écrite (template Barreau disponible). ON : obligatoire par Rule 3.6.",
    delai: "Dès le premier mandat.",
    cout: { commun: "Gratuit (templates Barreau / LSO)." },
    sansAvec: {
      sansSafe:
        "Tu adaptes un modèle Word à chaque dossier. Tu oublies une clause sur deux.",
      avecSafe:
        "Templates par domaine (familial, immo, corpo, criminel). Préremplissage client.",
    },
  },

  {
    id: "compta-tps-debours",
    section: "compta",
    priority: "important",
    jurisdiction: "both",
    highlightForFear: ["conformite", "admin"],
    action:
      "Distinguer débours à titre de mandataire (sans taxes) vs non-mandataire (avec taxes).",
    delai: "À chaque facturation.",
    cout: { commun: "Erreur de classification = redressement Revenu Québec / ARC." },
    autorite: {
      label: "ARC — Publication P-209R",
      url: "https://www.canada.ca/fr/agence-revenu/services/formulaires-publications/publications/p-209r/debours-effectues-avocats.html",
    },
    sansAvec: {
      sansSafe:
        "Tu te rappelles à la main, par dépense, si tu agissais en mandataire. Tu te trompes 1 fois sur 5.",
      avecSafe:
        "Règle mandataire/non-mandataire pré-câblée. Taxes appliquées correctement à chaque ligne.",
    },
  },

  {
    id: "compta-logiciel",
    section: "compta",
    priority: "critique",
    jurisdiction: "both",
    highlightForFear: ["admin", "conformite", "mental"],
    action:
      "Choisir un logiciel comptable conforme à ta juridiction. Pas un outil générique.",
    delai: "J-45.",
    cout: { commun: "QuickBooks 25–80 $/mois (non spécialisé) · PCLaw / Clio 69 $+/mois · SAFE." },
    piege: {
      texte:
        "QBO / Sage / Excel : aucun n'est pré-paramétré RCNEPA ni By-Law 9. Bricolage = risque structurel.",
    },
    sansAvec: {
      sansSafe:
        "Tu paies 80 $/mois pour QuickBooks. Tu rebricoles un fidéicommis dans Excel à côté. Tu paies un comptable pour rattraper.",
      avecSafe:
        "Un OS pensé depuis la chaise du teneur de livres d'un cabinet d'avocats. Fidéicommis natif. RCNEPA / By-Law 9 pré-câblés.",
      chiffre: {
        valeur: "20 000 – 40 000 $/an",
        source: "Revenue leakage moyen, Adam Smith Esq. + Clio Legal Trends 2024",
      },
    },
  },

  {
    id: "compta-acomptes",
    section: "compta",
    priority: "important",
    jurisdiction: "both",
    action: "Planifier les acomptes provisionnels (personnel et corporatif).",
    delai: "15 mars, 15 juin, 15 septembre, 15 décembre.",
    cout: { commun: "Variable selon revenu net estimé." },
  },

  {
    id: "compta-rapports",
    section: "compta",
    priority: "important",
    jurisdiction: "both",
    highlightForFear: ["admin", "mental"],
    action:
      "Produire chaque mois : journal recettes-déboursés admin + réconciliation fidéicommis + état de facturation.",
    delai: "Mensuel.",
    cout: { commun: "0 $ direct. Temps : 3–8 h/mois si manuel." },
    sansAvec: {
      sansSafe:
        "Tu y passes un samedi par mois. Tu rattrapes ce que tu n'as pas saisi à temps.",
      avecSafe:
        "Rapports générés à la volée. Tu valides en 10 minutes au lieu d'un samedi.",
      chiffre: {
        valeur: "48 % du temps en admin",
        source: "LeanLaw + Clio Legal Trends 2024",
      },
    },
  },

  // ─────────────────────────────────────────────────────────────────────
  // SECTION 5 — Infrastructure et outils
  // ─────────────────────────────────────────────────────────────────────

  {
    id: "infra-adresse",
    section: "infra",
    priority: "important",
    jurisdiction: "both",
    action:
      "Choisir une adresse professionnelle : domicile, virtuelle, coworking ou bureau propre.",
    delai: "J-60.",
    cout: { commun: "0–800 $/mois selon l'option." },
    piege: {
      texte:
        "Adresse domicile rendue publique au REQ / Business Registry sauf adresse pro distincte déclarée.",
    },
  },

  {
    id: "infra-courriel",
    section: "infra",
    priority: "critique",
    jurisdiction: "both",
    highlightForFear: ["conformite"],
    action:
      "Configurer un courriel professionnel sécurisé. Données au Canada.",
    delai: "J-30.",
    cout: { commun: "12–25 $/mois (Microsoft 365, Google Workspace avec résidence des données)." },
    piege: {
      texte:
        "Gmail/Hotmail/Yahoo : risque déontologique direct, secret professionnel non garanti.",
    },
  },

  {
    id: "infra-conservation",
    section: "infra",
    priority: "important",
    jurisdiction: "both",
    action:
      "Mettre en place les durées de conservation : 7 ans dossiers fermés · 10 ans fidéicommis (ON) · 15 ans recommandés en immobilier (LawPRO).",
    delai: "Dès l'ouverture du cabinet.",
    cout: { commun: "5–30 $/mois cloud canadien." },
    sansAvec: {
      sansSafe: "Tu te fais un Excel de retraits, tu oublies, tu détruis trop tôt.",
      avecSafe:
        "Horloge par dossier. Alerte avant destruction. Archivage chiffré jusqu'à expiration.",
    },
  },

  {
    id: "infra-cyber",
    section: "infra",
    priority: "critique",
    jurisdiction: "both",
    highlightForFear: ["conformite"],
    action:
      "Activer chiffrement des appareils, MFA, antivirus, pare-feu, sauvegardes hors site.",
    delai: "J-30.",
    cout: { commun: "Inclus dans Microsoft 365 Business +/-." },
    piege: {
      texte:
        "Fraude BEC (immobilier surtout) : compromission de courriel → fonds détournés. Vérifier les instructions par canal indépendant.",
    },
  },

  {
    id: "infra-signature",
    section: "infra",
    priority: "recommande",
    jurisdiction: "both",
    action:
      "Mettre en place la signature électronique (DocuSign, Adobe Sign, Notarius pour QC).",
    delai: "J-30.",
    cout: { commun: "10–25 $/mois." },
    piege: {
      texte:
        "Exclusions : testaments, procurations, certains actes immobiliers (Teraview en ON).",
    },
  },

  {
    id: "infra-teraview-on",
    section: "infra",
    priority: "critique",
    jurisdiction: "on",
    practiceAreas: ["immobilier"],
    action: "T'abonner à Teraview (enregistrement électronique titres fonciers).",
    delai: "Avant le 1er dossier immobilier.",
    cout: { on: "Abonnement Teranet + frais transactionnels." },
    autorite: {
      label: "Teranet — Teraview",
      url: "https://www.teranet.ca",
    },
  },

  // ─────────────────────────────────────────────────────────────────────
  // SECTION 6 — Clients et développement
  // ─────────────────────────────────────────────────────────────────────

  {
    id: "acq-site",
    section: "acquisition",
    priority: "important",
    jurisdiction: "both",
    highlightForFear: ["clients"],
    action:
      "Construire ton site web : conforme règles de publicité, hébergement Canada.",
    delai: "J-30 à J0.",
    cout: { commun: "0–5 000 $ selon solution choisie." },
    piege: {
      texte:
        "Tester chaque page contre la règle « pas de spécialiste / pas de témoignages QC / pas de garantie ».",
    },
  },

  {
    id: "acq-aide-juridique",
    section: "acquisition",
    priority: "recommande",
    jurisdiction: "both",
    highlightForFear: ["clients", "argent"],
    action:
      "T'inscrire à l'aide juridique : CSJ (QC) · Legal Aid Ontario (LAO) + panels par domaine.",
    delai: "J+30 (après ouverture).",
    cout: {
      qc: "Gratuit. Tarif CSJ disponible en ligne.",
      on: "Gratuit · Tier 1 : 126,35 $/h (avril 2025) · jusqu'à 186,44 $/h Complex Case",
    },
    autorite: {
      label: "CSJ Québec · Legal Aid Ontario",
      url: "https://www.legalaid.on.ca",
    },
    piege: {
      texte:
        "ON : exigences d'expérience (20 dossiers criminels / 10 dossiers familiaux). Autorisation conditionnelle 24 mois possible.",
    },
  },

  {
    id: "acq-reseau",
    section: "acquisition",
    priority: "recommande",
    jurisdiction: "both",
    highlightForFear: ["clients", "mental"],
    action:
      "Adhérer à un réseau pro : Jeune Barreau de Montréal (QC) · Ontario Bar Association (ON).",
    delai: "J+30.",
    cout: { qc: "Cotisation modique (JBM)", on: "~199 $ OBA" },
  },

  {
    id: "acq-tarification",
    section: "acquisition",
    priority: "important",
    jurisdiction: "both",
    highlightForFear: ["argent"],
    action:
      "Fixer ta tarification (horaire ou forfaitaire) en t'appuyant sur les benchmarks 2024-2026.",
    delai: "J-30.",
    cout: {
      qc: "Avocat 0–3 ans : 100–200 $/h · familial région : 150–250 $/h",
      on: "Solo débutant : 150–300 $/h · familial : 300–475 $/h · immo résid. : forfait 1 200–1 500 $",
    },
    sansAvec: {
      sansSafe:
        "Tu copies le tarif d'un confrère. Tu n'oses pas hausser. Tu sous-factures 2 ans.",
      avecSafe:
        "Benchmark par domaine + alerte utilization rate. Tu pilotes ton tarif au lieu de le subir.",
      chiffre: {
        valeur: "Utilization 26 %",
        source: "Clio Legal Trends 2024 — moyenne solo",
      },
    },
  },

  // ─────────────────────────────────────────────────────────────────────
  // SECTION 7 — Spécifiques par domaine
  // ─────────────────────────────────────────────────────────────────────

  // Famille
  {
    id: "dom-famille-tuf-qc",
    section: "domaine",
    priority: "critique",
    jurisdiction: "qc",
    practiceAreas: ["famille"],
    action:
      "Maîtriser le Tribunal unifié de la famille (TUF) intégré à la Cour du Québec depuis le 30 juin 2025.",
    delai: "Dès le premier dossier familial.",
    cout: { qc: "0 $." },
    autorite: {
      label: "Québec.ca — TUF",
      url: "https://www.quebec.ca/justice-et-etat-civil/systeme-judiciaire/tribunaux-du-quebec/cour-du-quebec/tribunal-unifie-famille",
    },
    piege: {
      texte:
        "Divorce et séparation de corps restent en Cour supérieure. Gestion duale des tribunaux pour les familles mixtes.",
    },
  },
  {
    id: "dom-famille-fro-on",
    section: "domaine",
    priority: "important",
    jurisdiction: "on",
    practiceAreas: ["famille"],
    action:
      "Conseiller le client sur le Family Responsibility Office (FRO) et envisager le panel Office of the Children's Lawyer.",
    delai: "À l'ordonnance alimentaire / dossier de garde.",
    cout: { on: "0 $." },
    piege: {
      texte:
        "Tout ordre alimentaire ontarien est automatiquement enregistré au FRO.",
    },
  },
  {
    id: "dom-famille-rules-on",
    section: "domaine",
    priority: "important",
    jurisdiction: "on",
    practiceAreas: ["famille"],
    action:
      "Mettre à jour tes templates avec les nouvelles Family Law Rules (janvier 2025) — Règle 24 sur les dépens.",
    delai: "Dès maintenant.",
    cout: { on: "0 $." },
  },

  // Immobilier
  {
    id: "dom-immo-titleplus-on",
    section: "domaine",
    priority: "important",
    jurisdiction: "on",
    practiceAreas: ["immobilier"],
    action:
      "Souscrire la Real Estate Practice Coverage Option LawPRO et te familiariser avec TitlePLUS.",
    delai: "Avant le 1er dossier immobilier.",
    cout: { on: "+100 $/an + PST sur la prime LawPRO." },
    autorite: {
      label: "LawPRO — Real Estate Practice Coverage",
      url: "https://www.lawpro.ca/faqs/about-the-real-estate-practice-coverage-option/",
    },
  },
  {
    id: "dom-immo-fintrac",
    section: "domaine",
    priority: "critique",
    jurisdiction: "both",
    practiceAreas: ["immobilier"],
    action:
      "Te conformer aux nouvelles obligations FINTRAC : depuis le 1er octobre 2025, assureurs-titre = entités déclarantes.",
    delai: "Continu.",
    cout: { commun: "0 $ direct, mais conséquences en cas de signalement raté." },
    autorite: {
      label: "FLSC — New FINTRAC guidance",
      url: "https://flsc.ca/news/new-guidance-for-legal-professionals-title-insurers-to-begin-reporting-to-fintrac-on-october-1-2025/",
    },
    piege: {
      texte:
        "Consentement éclairé du client avant tout partage avec assureur-titre. Privilège pro à évaluer.",
    },
  },
  {
    id: "dom-immo-double-rep",
    section: "domaine",
    priority: "critique",
    jurisdiction: "both",
    practiceAreas: ["immobilier"],
    action:
      "Ne JAMAIS représenter acheteur et vendeur simultanément (sauf exception très encadrée).",
    delai: "Continu.",
    cout: { commun: "Sanction disciplinaire quasi certaine si problème." },
  },

  // Corporatif
  {
    id: "dom-corpo-beneficiaires",
    section: "domaine",
    priority: "important",
    jurisdiction: "both",
    practiceAreas: ["corporatif"],
    action:
      "Mettre à jour le registre des bénéficiaires ultimes (REQ au QC depuis 2024 · LSAO en ON).",
    delai: "Annuel.",
    cout: { commun: "0 $." },
    piege: {
      texte:
        "Divergences > 30 jours non signalées par les entités déclarantes FINTRAC = obligation depuis octobre 2025.",
    },
  },
  {
    id: "dom-corpo-shareholders",
    section: "domaine",
    priority: "recommande",
    jurisdiction: "both",
    practiceAreas: ["corporatif"],
    action:
      "Conseiller systématiquement la rédaction d'une convention entre actionnaires.",
    delai: "À chaque dossier d'incorporation pluri-actionnaires.",
    cout: { commun: "Honoraires." },
    piege: {
      texte:
        "Ne pas la conseiller peut engager ta responsabilité professionnelle.",
    },
  },

  // Criminel
  {
    id: "dom-crim-jordan",
    section: "domaine",
    priority: "critique",
    jurisdiction: "both",
    practiceAreas: ["criminel"],
    highlightForFear: ["conformite"],
    action:
      "Surveiller en continu les plafonds Jordan : 18 mois (Cour provinciale) · 30 mois (Cour supérieure).",
    delai: "À chaque dossier criminel.",
    cout: { commun: "Arrêt des procédures si dépassé sans justification." },
    autorite: {
      label: "R. c. Jordan, 2016 CSC 27",
      url: "https://decisions.scc-csc.ca",
    },
    sansAvec: {
      sansSafe:
        "Tu tiens un agenda Outlook. Tu vérifies à la main les délais critiques. Tu rates un calcul.",
      avecSafe:
        "Compteur Jordan par dossier. Alerte 90 / 60 / 30 jours avant plafond.",
    },
  },
  {
    id: "dom-crim-contingence",
    section: "domaine",
    priority: "critique",
    jurisdiction: "both",
    practiceAreas: ["criminel"],
    action: "Ne jamais facturer en honoraires conditionnels en droit criminel.",
    delai: "Continu.",
    cout: { commun: "Sanction disciplinaire automatique." },
  },

  // Litige civil
  {
    id: "dom-civil-prescription",
    section: "domaine",
    priority: "critique",
    jurisdiction: "both",
    practiceAreas: ["civil"],
    highlightForFear: ["conformite"],
    action:
      "Tenir un moteur d'échéances : prescription 3 ans (QC, art. 2925 C.c.Q.) · 2 ans (ON, Limitations Act).",
    delai: "À chaque ouverture de dossier.",
    cout: { commun: "Cause #1 de plaintes en responsabilité professionnelle en litige." },
    sansAvec: {
      sansSafe:
        "Tu mets des rappels Outlook. Un dossier passe entre les mailles. Réclamation.",
      avecSafe:
        "Calcul auto de prescription dès l'ouverture. Alerte 90 / 30 / 7 jours avant échéance.",
    },
  },
  {
    id: "dom-civil-protocole-qc",
    section: "domaine",
    priority: "important",
    jurisdiction: "qc",
    practiceAreas: ["civil"],
    action:
      "Déposer le protocole de l'instance dans les 45 jours suivant la notification de la demande.",
    delai: "45 jours.",
    cout: { qc: "0 $." },
    autorite: {
      label: "Code de procédure civile",
      url: "https://www.legisquebec.gouv.qc.ca",
    },
  },

  // Immigration
  {
    id: "dom-immig-irc",
    section: "domaine",
    priority: "important",
    jurisdiction: "both",
    practiceAreas: ["immigration"],
    action:
      "Cartographier l'interaction IRCC (fédéral) + MIFI (QC seulement) pour chaque dossier.",
    delai: "À chaque mandat.",
    cout: { commun: "0 $." },
  },
  {
    id: "dom-immig-delais",
    section: "domaine",
    priority: "critique",
    jurisdiction: "both",
    practiceAreas: ["immigration"],
    highlightForFear: ["conformite"],
    action:
      "Suivre les délais CISR très courts (15–30 jours selon le type d'appel).",
    delai: "Continu.",
    cout: { commun: "Forclusion = perte du recours." },
    sansAvec: {
      sansSafe: "Tu copies les délais à la main. Tu en oublies un en haute saison.",
      avecSafe:
        "Moteur d'échéances par type de procédure. Alerte critique 7 jours avant.",
    },
  },
  {
    id: "dom-immig-garantie",
    section: "domaine",
    priority: "critique",
    jurisdiction: "both",
    practiceAreas: ["immigration"],
    action: "Ne jamais garantir un résultat (acceptation, visa, statut).",
    delai: "Continu.",
    cout: { commun: "Sanction disciplinaire + responsabilité civile." },
  },

  // ─────────────────────────────────────────────────────────────────────
  // SECTION 8 — Échéancier de lancement (anchors stratégiques)
  // ─────────────────────────────────────────────────────────────────────

  {
    id: "time-cpa",
    section: "timeline",
    priority: "recommande",
    jurisdiction: "both",
    appliesToHorizon: ["imminent", "moyen"],
    action: "Consulter un CPA pour caler ta structure fiscale optimale.",
    delai: "J-90 à J-75.",
    cout: { commun: "200–500 $." },
  },
  {
    id: "time-bilan",
    section: "timeline",
    priority: "recommande",
    jurisdiction: "both",
    action:
      "Faire ton premier bilan : rentabilité, mix de dossiers, utilization rate, lockup, ajustements tarifaires.",
    delai: "J+365.",
    cout: { commun: "0 $." },
    sansAvec: {
      sansSafe:
        "Tu te dis « j'ai survécu une année ». Tu n'as pas mesuré ton utilization, ni ton lockup, ni ta marge.",
      avecSafe:
        "Tableau de bord : utilization, lockup, revenue leakage, marge par dossier. Pilotage du cabinet, pas survie.",
      chiffre: {
        valeur: "Lockup 93 jours médian",
        source: "Clio Legal Trends Report 2025",
      },
    },
  },
];
