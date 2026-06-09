export const BENCHMARKS = {
  delaiCollectionCanada: {
    valeur: 32,
    unite: "jours",
    source: "Clio Legal Trends 2025, collection lockup médian",
  },
  tauxRealization: {
    valeur: 0.88,
    source: "Clio Legal Trends 2025",
  },
  tauxCollection: {
    valeur: 0.93,
    source: "Clio Legal Trends 2025",
  },
  accelerationPaiementEnLigne: {
    valeur: 0.50,
    source: "Clio, paiement en ligne environ 2 fois plus rapide",
  },
  semainesFacturables: {
    valeur: 46,
    source: "52 semaines moins vacances et fériés",
  },
  tauxRecuperationDefaut: {
    valeur: 0.60,
    source: "Hypothèse SAFE, part des heures admin récupérables",
  },
  fourchetteTauxJuniorQc: {
    min: 150,
    max: 250,
    source: "DoliLaw, justice-quebec.ca, avocat junior QC 2026",
  },
  prixGestionCabinet: {
    valeur: 165,
    source: "Grille type Clio ou PCLaw, tarif public 2026",
  },
  prixComptabilite: {
    valeur: 95,
    source: "QuickBooks Online Plus avec synchronisation",
  },
  prixTraitementPaiement: {
    valeur: 26,
    source: "LawPay, prix public réel converti en CAD",
  },
  prixImplantation: {
    valeur: 200,
    source: "Implantation et formation, première année, étalé sur 12 mois",
  },
} as const;
