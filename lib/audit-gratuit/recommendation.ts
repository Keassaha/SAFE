/**
 * SAFE — Génération du devis comparatif et de l'offre recommandée
 * à partir des réponses de l'audit.
 */

export type AuditAnswers = Record<string, unknown>;

export interface QuoteLine {
  label: string;
  detail: string;
  monthly: number;   // $CAD / mois
  annual: number;    // $CAD / an
}

export interface MarketQuote {
  totalMonthly: number;
  totalAnnual: number;
  lines: QuoteLine[];
  note: string;
}

export interface SafeOffer {
  name: string;              // "SAFE Solo" | "SAFE Duo" | "SAFE Équipe"
  tagline: string;
  seats: string;             // "1 utilisateur"
  monthly: number;           // Prix SAFE / mois
  annual: number;            // Prix SAFE / an
  setupFee: number;          // Frais de mise en route
  included: string[];
  savings: {
    monthly: number;
    annual: number;
    percent: number;         // vs devis marché
  };
}

export interface RoiEstimate {
  hoursPerWeek: number;
  hourlyValue: number;       // $/h du praticien (médiane de la fourchette)
  weeklyValue: number;
  annualValue: number;       // 46 semaines ouvrées
  paybackWeeks: number;      // nb semaines pour rentabiliser SAFE
}

export type RiskSeverity = "critique" | "eleve" | "modere" | "faible";

export interface RiskItem {
  id: string;
  title: string;
  severity: RiskSeverity;
  category: "Fidéicommis" | "Comptabilité" | "Facturation" | "Organisation" | "Conformité" | "Trésorerie";
  reference: string;       // ex. "Barreau QC · B-1, r.5, art. 9"
  finding: string;         // ce que vos réponses montrent
  impact: string;          // conséquence concrète
  action: string;          // ce que SAFE corrige
}

export interface SitePlan {
  id: "solo" | "cabinet" | "cabinetplus";
  name: string;
  priceLabel: string;      // "79 $" ou "Sur mesure"
  monthly: number | null;  // null = sur mesure
  seats: string;
  tagline: string;
  features: string[];
  cta: string;
  highlight?: boolean;     // plan mis en avant par défaut sur le site
  recommended?: boolean;   // plan recommandé pour CE client
}

export interface Recommendation {
  marketQuote: MarketQuote;
  safeOffer: SafeOffer;
  plans: SitePlan[];
  recommendedPlanId: SitePlan["id"];
  risks: RiskItem[];
  riskScore: {
    total: number;                // score composite 0-100 (100 = très risqué)
    critique: number;
    eleve: number;
    modere: number;
    faible: number;
    verdict: "sain" | "a_surveiller" | "a_corriger" | "a_securiser";
  };
  roi: RoiEstimate;
  urgencyLevel: "urgent" | "important" | "moyen" | "info";
  narrative: {
    executiveSummary: string;
    diagnostic: string[];    // 3-5 constats
    opportunites: string[];  // 3-5 opportunités
    prochainesEtapes: string[];
  };
}

/* ── Helpers : mapping des réponses vers des chiffres ──────────────── */

function midHourlyRate(v: unknown): number {
  switch (String(v)) {
    case "lt150":   return 125;
    case "150_250": return 200;
    case "251_400": return 325;
    case "gt400":   return 475;
    default:        return 275; // médiane Barreau QC ~275 $/h
  }
}

function midAdminHours(v: unknown): number {
  switch (String(v)) {
    case "lt2":  return 1.5;
    case "2_5":  return 3.5;
    case "6_10": return 8;
    case "gt10": return 12;
    default:     return 4;
  }
}

function midAssistantRate(v: unknown): number {
  switch (String(v)) {
    case "lt20":    return 18;
    case "20_28":   return 24;
    case "29_38":   return 33;
    case "39_50":   return 44;
    case "gt50":    return 55;
    default:        return 28;
  }
}

function midBookkeepCost(v: unknown): number {
  switch (String(v)) {
    case "lt300":     return 225;
    case "300_600":   return 450;
    case "601_1200":  return 900;
    case "1201_2500": return 1850;
    case "gt2500":    return 3000;
    default:          return 0;
  }
}

function activeCases(v: unknown): number {
  switch (String(v)) {
    case "lt10":   return 6;
    case "10_30":  return 20;
    case "31_75":  return 50;
    case "76_150": return 110;
    case "gt150":  return 180;
    default:       return 25;
  }
}

/* ── Devis marché (comparables) ────────────────────────────────────── */

export function buildMarketQuote(a: AuditAnswers): MarketQuote {
  const seats = String(a.nb_utilisateurs || "1");
  const nbUsers = seats === "3plus" ? 3 : seats === "2" ? 2 : 1;
  const hasTrust = String(a.fideicommis_usage) === "actif" || String(a.fideicommis_usage) === "peu";

  // Tarifs publics constatés au Canada (moyennes 2025-2026)
  // Clio Manage Pro : 120 $ USD/user/mois ≈ 165 $ CAD
  const pmsUnit = 165;
  const compta  = 95;   // QuickBooks Online Plus + intégration
  const trust   = 75;   // LawPay / Trustbooks / module fidéi dédié
  const setupExt = 2400; // implantation / formation externe étalée 12 mois → /12

  const lines: QuoteLine[] = [
    {
      label: "Logiciel de gestion de cabinet (type Clio / PCLaw)",
      detail: `${nbUsers} utilisateur${nbUsers > 1 ? "s" : ""} × ${pmsUnit} $ CAD`,
      monthly: pmsUnit * nbUsers,
      annual:  pmsUnit * nbUsers * 12,
    },
    {
      label: "Comptabilité (QuickBooks / Sage) + intégration",
      detail: "Plan Plus + synchronisation",
      monthly: compta,
      annual:  compta * 12,
    },
  ];

  if (hasTrust) {
    lines.push({
      label: "Module de conformité fidéicommis",
      detail: "LawPay / Trustbooks ou équivalent",
      monthly: trust,
      annual:  trust * 12,
    });
  }

  lines.push({
    label: "Implantation, paramétrage & formation (an 1)",
    detail: "Étalé sur 12 mois",
    monthly: Math.round(setupExt / 12),
    annual:  setupExt,
  });

  const totalMonthly = lines.reduce((s, l) => s + l.monthly, 0);
  const totalAnnual  = lines.reduce((s, l) => s + l.annual, 0);

  return {
    lines,
    totalMonthly,
    totalAnnual,
    note:
      "Estimation basée sur les tarifs publics des principaux éditeurs (Clio, PCLaw, LawPay, QuickBooks) " +
      "pour un cabinet comparable au vôtre, en dollars canadiens, taxes non incluses.",
  };
}

/* ── Offre SAFE recommandée ────────────────────────────────────────── */

export function buildSafeOffer(a: AuditAnswers): SafeOffer {
  const seats = String(a.nb_utilisateurs || "1");

  if (seats === "1") {
    return {
      name: "SAFE Solo",
      tagline: "Pour l'avocat·e indépendant·e qui veut professionnaliser son cabinet sans embaucher.",
      seats: "1 utilisateur",
      monthly: 129,
      annual: 129 * 12,
      setupFee: 0,
      included: [
        "Facturation intelligente (horaire, forfait, mixte)",
        "Fidéicommis conforme Barreau du Québec (B-1, r.5) et LSO",
        "Conciliation bancaire automatisée mensuelle",
        "Suivi des comptes à recevoir en temps réel",
        "Portail client sécurisé (dépôt de documents, paiements)",
        "Accès mobile complet (iOS / Android)",
        "Mise en place offerte + formation 1-on-1 (2 h)",
      ],
      savings: { monthly: 0, annual: 0, percent: 0 },
    };
  }

  if (seats === "2") {
    return {
      name: "SAFE Duo",
      tagline: "Pour le praticien accompagné d'un(e) adjoint(e) ou d'un(e) parajuriste.",
      seats: "2 utilisateurs",
      monthly: 229,
      annual: 229 * 12,
      setupFee: 0,
      included: [
        "Tout ce qui est inclus dans SAFE Solo",
        "Gestion des rôles et permissions (praticien / adjoint)",
        "Répartition des tâches et validation du praticien",
        "Journal d'audit complet (traçabilité Barreau)",
        "Reporting mensuel automatique pour teneur de livres",
        "Support prioritaire par courriel (réponse sous 4 h)",
        "Onboarding personnalisé (3 h en 2 sessions)",
      ],
      savings: { monthly: 0, annual: 0, percent: 0 },
    };
  }

  // 3+
  return {
    name: "SAFE Équipe",
    tagline: "Pour le cabinet établi avec une équipe et une structure à consolider.",
    seats: "3 utilisateurs et plus",
    monthly: 389,
    annual: 389 * 12,
    setupFee: 0,
    included: [
      "Tout ce qui est inclus dans SAFE Duo",
      "Utilisateurs supplémentaires à 45 $ / mois / siège",
      "Tableaux de bord par praticien, par domaine, par équipe",
      "Intégration QuickBooks / Sage / Acomba bidirectionnelle",
      "Rapports de performance automatiques pour la direction",
      "Gestionnaire de compte SAFE dédié",
      "Onboarding dirigé (5 h, migration de données incluse)",
    ],
    savings: { monthly: 0, annual: 0, percent: 0 },
  };
}

/* ── ROI ───────────────────────────────────────────────────────────── */

export function buildRoi(a: AuditAnswers, offer: SafeOffer): RoiEstimate {
  const hoursPerWeek = midAdminHours(a.heures_admin) * 0.6; // SAFE vise 60 % de réduction
  const hourlyValue  = midHourlyRate(a.taux_horaire);
  const weeklyValue  = hoursPerWeek * hourlyValue;
  const annualValue  = weeklyValue * 46; // 46 semaines ouvrées
  const paybackWeeks = offer.monthly > 0 ? offer.monthly / weeklyValue : 0;

  return {
    hoursPerWeek: Number(hoursPerWeek.toFixed(1)),
    hourlyValue,
    weeklyValue: Math.round(weeklyValue),
    annualValue: Math.round(annualValue),
    paybackWeeks: Number(paybackWeeks.toFixed(1)),
  };
}

/* ── Savings calculé à partir du quote ─────────────────────────────── */

export function attachSavings(offer: SafeOffer, quote: MarketQuote): SafeOffer {
  const monthlyDelta = Math.max(0, quote.totalMonthly - offer.monthly);
  const annualDelta  = Math.max(0, quote.totalAnnual  - offer.annual);
  const percent = quote.totalMonthly > 0 ? Math.round((monthlyDelta / quote.totalMonthly) * 100) : 0;
  return {
    ...offer,
    savings: { monthly: monthlyDelta, annual: annualDelta, percent },
  };
}

/* ── Narrative (texte du rapport) ──────────────────────────────────── */

function urgencyLevelOf(a: AuditAnswers): Recommendation["urgencyLevel"] {
  const v = String(a.urgence || "");
  if (["urgent", "important", "moyen"].includes(v)) return v as "urgent" | "important" | "moyen";
  return "info";
}

/* ── Analyse de risques (inspirée du Barreau QC + LSO) ─────────────── */

function provinceOf(a: AuditAnswers): string {
  return String((a.localisation as { province?: string })?.province || "QC");
}

function refBarreau(province: string, topic: "fid_registre" | "fid_conciliation" | "fid_restitution" | "factures" | "tenue" | "diligence"): string {
  const isON = province === "ON";
  switch (topic) {
    case "fid_registre":
      return isON
        ? "LSO · By-Law 9, s. 18 (mixed trust account records)"
        : "Barreau QC · Règlement B-1, r.5, art. 9 (registre fidéicommis)";
    case "fid_conciliation":
      return isON
        ? "LSO · By-Law 9, s. 20 (monthly trust reconciliation)"
        : "Barreau QC · Règlement B-1, r.5, art. 15 (rapprochement mensuel)";
    case "fid_restitution":
      return isON
        ? "LSO · Rules of Professional Conduct, r. 3.5-2 (safekeeping of property)"
        : "Code de déontologie des avocats (B-1, r.3.1), art. 104 (restitution diligente)";
    case "factures":
      return isON
        ? "LSO · Rules of Professional Conduct, r. 3.6 (reasonable fees)"
        : "Code de déontologie des avocats (B-1, r.3.1), art. 102 (reddition de compte)";
    case "tenue":
      return isON
        ? "LSO · By-Law 9, s. 18 (books and records)"
        : "Barreau QC · Règlement B-1, r.5, art. 8 (livres et registres distincts)";
    case "diligence":
      return isON
        ? "LSO · Rules of Professional Conduct, r. 3.2-1 (quality of service)"
        : "Code de déontologie des avocats (B-1, r.3.1), art. 28 (diligence)";
  }
}

export function buildRiskAssessment(a: AuditAnswers): { risks: RiskItem[]; score: Recommendation["riskScore"] } {
  const province = provinceOf(a);
  const risks: RiskItem[] = [];

  // Fidéicommis — risque principal
  const fidUsage = String(a.fideicommis_usage || "");
  const fidGestion = String(a.gestion_fideicommis || "");
  const hasTrust = fidUsage === "actif" || fidUsage === "peu";

  if (hasTrust && fidGestion === "aucun") {
    risks.push({
      id: "fid_no_system",
      title: "Fidéicommis non structuré",
      severity: "critique",
      category: "Fidéicommis",
      reference: refBarreau(province, "fid_registre"),
      finding: "Vous détenez des sommes en fidéicommis sans système comptable dédié.",
      impact: "C'est la première cause d'inspection professionnelle et de sanction disciplinaire. En cas de contrôle surprise du syndic, les registres doivent être produits immédiatement.",
      action: "SAFE tient automatiquement le registre nominal, émet les reçus, verrouille chaque écriture et produit le rapport annuel exigé.",
    });
  } else if (hasTrust && fidGestion === "manuel") {
    risks.push({
      id: "fid_manual",
      title: "Fidéicommis tenu manuellement",
      severity: "eleve",
      category: "Fidéicommis",
      reference: refBarreau(province, "fid_conciliation"),
      finding: "La tenue du fidéicommis repose sur un tableur ou un registre papier.",
      impact: "Le rapprochement mensuel obligatoire est rarement à jour. Un écart même mineur entre le livre et le relevé bancaire constitue un manquement.",
      action: "SAFE effectue le rapprochement mensuel automatique avec piste d'audit complète et signature numérique du praticien.",
    });
  }

  // Aucun teneur de livres + fidéicommis = très risqué
  if (hasTrust && String(a.teneur_livres) === "non") {
    risks.push({
      id: "no_bookkeeper_trust",
      title: "Aucune tenue de livres professionnelle",
      severity: "eleve",
      category: "Comptabilité",
      reference: refBarreau(province, "tenue"),
      finding: "Vous n'avez pas de teneur de livres ni de comptable qui révise vos comptes.",
      impact: "L'obligation de tenir des livres distincts et conformes incombe au praticien. Sans professionnel, les erreurs s'accumulent et les rapports annuels au Barreau deviennent difficiles à produire.",
      action: "SAFE génère les rapports conformes prêts à être remis à votre comptable ou à la Chambre, sans intervention manuelle.",
    });
  }

  // Visibilité créances
  const creances = String(a.visibilite_creances || "");
  if (creances === "non" || creances === "manuel") {
    risks.push({
      id: "no_ar_visibility",
      title: "Aucune visibilité sur les comptes à recevoir",
      severity: "modere",
      category: "Trésorerie",
      reference: refBarreau(province, "factures"),
      finding: "Vous ne pouvez pas dire en moins de 60 secondes combien vous est dû.",
      impact: "Un cabinet qui ne suit pas ses comptes perd en moyenne 12 % du facturé en radiations et en délais. La reddition de compte au client devient floue.",
      action: "SAFE affiche en temps réel chaque créance, relance automatiquement à J+15 / J+30 / J+45 et garde trace des communications.",
    });
  }

  // Délais de paiement
  const delai = String(a.delai_paiement || "");
  if (delai === "gt60") {
    risks.push({
      id: "payment_long",
      title: "Délais de paiement > 60 jours",
      severity: "modere",
      category: "Trésorerie",
      reference: "Pratique du marché · Clio Legal Trends Report 2025",
      finding: "Vos clients règlent en moyenne au-delà de 60 jours après facturation.",
      impact: "La moyenne du marché canadien est de 28 jours. Chaque tranche de 30 jours additionnels grève votre trésorerie et augmente le risque d'impayé.",
      action: "Paiement en ligne intégré, relances multicanal et échéancier automatique ramènent le délai moyen observé à 18 jours.",
    });
  } else if (delai === "31_60") {
    risks.push({
      id: "payment_medium",
      title: "Délais de paiement supérieurs à la moyenne",
      severity: "faible",
      category: "Trésorerie",
      reference: "Pratique du marché · Clio Legal Trends Report 2025",
      finding: "Vos clients règlent entre 31 et 60 jours.",
      impact: "Chaque semaine gagnée améliore votre besoin en fonds de roulement sans lever de financement.",
      action: "Automatisation des relances et paiement en un clic raccourcissent le cycle de 30 % en moyenne.",
    });
  }

  // Logiciel actuel
  const soft = String(a.logiciel_actuel || "");
  if (soft === "aucun" || soft.startsWith("other:")) {
    risks.push({
      id: "no_pms",
      title: "Absence de système de gestion professionnel",
      severity: soft === "aucun" ? "eleve" : "modere",
      category: "Organisation",
      reference: refBarreau(province, "tenue"),
      finding: soft === "aucun"
        ? "Aucun logiciel dédié. Gestion sur Excel, courriels et papier."
        : "Usage d'outils non spécialisés (Excel, Google Drive, etc.).",
      impact: "Les obligations de confidentialité, de traçabilité et de conservation (7 ans minimum) sont difficiles à démontrer en cas d'inspection.",
      action: "SAFE centralise dossiers, facturation, fidéicommis et communications avec journal d'audit inviolable et hébergement canadien.",
    });
  }

  // Heures admin excessives
  const hAdmin = String(a.heures_admin || "");
  if (hAdmin === "gt10") {
    risks.push({
      id: "admin_overload",
      title: "Plus de 10 h administratives / semaine",
      severity: "modere",
      category: "Organisation",
      reference: refBarreau(province, "diligence"),
      finding: "Vous consacrez plus de 10 h par semaine à des tâches non facturables.",
      impact: "Cette surcharge réduit directement votre disponibilité pour les dossiers clients et augmente le risque d'oublis, de retards et de manquements au devoir de diligence.",
      action: "Automatisation de la facturation, des relances, du fidéicommis et des rapports : 60 % de cette charge disparaît.",
    });
  }

  // Facturation
  const factu = String(a.facturation_mode || "");
  if (factu === "papier" || factu === "excel") {
    risks.push({
      id: "billing_manual",
      title: "Facturation manuelle",
      severity: "faible",
      category: "Facturation",
      reference: refBarreau(province, "factures"),
      finding: "La facturation est produite à la main ou sur Excel.",
      impact: "Risque d'erreurs, de double facturation, de numérotation discontinue et de pertes de temps mesurables.",
      action: "SAFE facture en 30 secondes avec numérotation automatique, TPS/TVQ, portail client et paiement en ligne.",
    });
  }

  // Satisfaction système
  const satisf = Number(a.satisfaction_systeme || 0);
  if (satisf > 0 && satisf <= 4) {
    risks.push({
      id: "low_satisfaction",
      title: "Insatisfaction envers le système actuel",
      severity: "faible",
      category: "Organisation",
      reference: "Signal interne",
      finding: `Note de satisfaction : ${satisf} / 10.`,
      impact: "Un système mal aimé est un système sous-utilisé. Les données deviennent partielles et les décisions moins bonnes.",
      action: "Un outil conçu pour les avocats du Québec / Canada, avec onboarding dédié, plutôt qu'une stack générique mal configurée.",
    });
  }

  // Si rien — pas de risque critique
  if (risks.length === 0) {
    risks.push({
      id: "baseline",
      title: "Aucun risque majeur identifié",
      severity: "faible",
      category: "Organisation",
      reference: "—",
      finding: "Vos réponses ne révèlent pas d'exposition disciplinaire significative.",
      impact: "Vous pouvez vous concentrer sur les gains d'efficacité et de croissance plutôt que sur la mise en conformité.",
      action: "SAFE vous permet de consolider votre avance et d'accélérer votre croissance sans embauche.",
    });
  }

  // Score composite (plafonné à 100)
  const critique = risks.filter((r) => r.severity === "critique").length;
  const eleve    = risks.filter((r) => r.severity === "eleve").length;
  const modere   = risks.filter((r) => r.severity === "modere").length;
  const faible   = risks.filter((r) => r.severity === "faible").length;
  const total = Math.min(100, critique * 35 + eleve * 20 + modere * 10 + faible * 3);

  let verdict: Recommendation["riskScore"]["verdict"] = "sain";
  if (total >= 70) verdict = "a_securiser";
  else if (total >= 40) verdict = "a_corriger";
  else if (total >= 15) verdict = "a_surveiller";

  return { risks, score: { total, critique, eleve, modere, faible, verdict } };
}

/* ── Les 3 formules du site ────────────────────────────────────────── */

function buildSitePlans(a: AuditAnswers, recommendedId: SitePlan["id"]): SitePlan[] {
  const plans: SitePlan[] = [
    {
      id: "solo",
      name: "Solo",
      priceLabel: "99 $",
      monthly: 99,
      seats: "1 utilisateur",
      tagline: "Vous pratiquez seul et voulez dormir tranquille avant l'inspection.",
      features: [
        "1 utilisateur inclus",
        "Facturation illimitée",
        "Fidéicommis B-1, r.5",
        "Support courriel (priorité normale)",
        "Portail client sécurisé",
        "Export comptable JDE",
      ],
      cta: "Faire mon audit gratuit",
    },
    {
      id: "cabinet",
      name: "Cabinet",
      priceLabel: "149 $",
      monthly: 149,
      seats: "3 utilisateurs",
      tagline: "Pour les cabinets en croissance avec adjoint(e) ou parajuriste.",
      features: [
        "3 utilisateurs inclus",
        "Droits d'accès granulaires",
        "Fidéicommis B-1, r.5",
        "Support prioritaire 24 h",
        "Rapports de rentabilité par avocat",
        "Intégration bancaire",
        "Marque blanche",
      ],
      cta: "Faire mon audit gratuit",
      highlight: true,
    },
    {
      id: "cabinetplus",
      name: "Cabinet+",
      priceLabel: "Sur mesure",
      monthly: null,
      seats: "Illimité",
      tagline: "Plus de 10 avocats. Intégrations avancées et migration assistée.",
      features: [
        "Utilisateurs illimités",
        "Migration des données historiques",
        "Formation sur site",
        "Gestionnaire de compte dédié",
        "SLA garanti",
        "API personnalisée",
        "Audits réguliers",
      ],
      cta: "Réserver un appel",
    },
  ];
  return plans.map((p) => ({ ...p, recommended: p.id === recommendedId }));
}

function recommendedPlanFor(a: AuditAnswers): SitePlan["id"] {
  const seats = String(a.nb_utilisateurs || "1");
  if (seats === "1") return "solo";
  if (seats === "3plus") return "cabinet";
  // pour "2" on recommande Cabinet (3 sièges inclus, marge de croissance)
  return "cabinet";
}

export function buildRecommendation(a: AuditAnswers): Recommendation {
  const marketQuote = buildMarketQuote(a);
  let safeOffer = buildSafeOffer(a);
  safeOffer = attachSavings(safeOffer, marketQuote);
  const roi = buildRoi(a, safeOffer);
  const recommendedPlanId = recommendedPlanFor(a);
  const plans = buildSitePlans(a, recommendedPlanId);
  const { risks, score: riskScore } = buildRiskAssessment(a);

  // Narrative
  const identite = (a.identite as { nom_complet?: string })?.nom_complet || "Confrère / consoeur";
  const raison   = String(a.raison_sociale || "votre cabinet");
  const ville    = (a.localisation as { ville?: string })?.ville || "";
  const province = (a.localisation as { province?: string })?.province || "QC";

  const diagnostic: string[] = [];
  const opportunites: string[] = [];

  // Diagnostic — signaux faibles
  if (String(a.visibilite_creances) === "manuel" || String(a.visibilite_creances) === "non") {
    diagnostic.push("Vous n'avez pas de vision claire de vos comptes à recevoir en temps réel — un angle mort classique qui coûte en moyenne 12 % du chiffre facturé.");
  }
  if (String(a.delai_paiement) === "gt60" || String(a.delai_paiement) === "31_60") {
    diagnostic.push("Vos délais de paiement dépassent la moyenne du marché (28 jours). Chaque tranche de 30 jours additionnels grève votre trésorerie.");
  }
  if (String(a.heures_admin) === "gt10" || String(a.heures_admin) === "6_10") {
    const val = roi.annualValue.toLocaleString("fr-CA");
    diagnostic.push(`Vous consacrez plus de ${midAdminHours(a.heures_admin)} h par semaine à des tâches non facturables — l'équivalent de ${val} $ de valeur honoraire par année.`);
  }
  if (String(a.gestion_fideicommis) === "aucun") {
    diagnostic.push("Votre gestion du fidéicommis n'est pas structurée. C'est le principal risque disciplinaire en pratique privée.");
  }
  if (String(a.logiciel_actuel) === "aucun") {
    diagnostic.push("Vous n'avez pas encore de logiciel dédié. Vous êtes dans la fenêtre idéale pour partir sur les bonnes fondations, sans migration complexe.");
  }
  if (diagnostic.length === 0) {
    diagnostic.push("Votre structure actuelle fonctionne, mais plusieurs leviers d'efficacité restent inexploités.");
  }

  // Opportunités
  opportunites.push(
    `Récupérer ${roi.hoursPerWeek} h par semaine grâce à l'automatisation de la facturation, du fidéicommis et du suivi des créances — soit environ ${roi.annualValue.toLocaleString("fr-CA")} $ de valeur honoraire par année.`
  );
  opportunites.push(
    `Économiser environ ${safeOffer.savings.monthly.toLocaleString("fr-CA")} $ par mois sur vos outils actuels (${safeOffer.savings.percent} %), tout en centralisant la conformité Barreau.`
  );
  if (province === "QC") {
    opportunites.push("Être aligné avec le Règlement B-1, r.5 sur la comptabilité en fidéicommis sans effort manuel — rapports générés automatiquement pour le syndic.");
  } else if (province === "ON") {
    opportunites.push("Être aligné avec les règles By-Law 9 de la Law Society of Ontario sur les mixed trust accounts — rapports LawPRO-ready automatiques.");
  }
  if (String(a.evolution) === "forte" || String(a.evolution) === "moderee") {
    opportunites.push("Structurer votre croissance sans embauche immédiate : SAFE absorbe la charge admin des dossiers supplémentaires.");
  }

  const executiveSummary =
    `Ce rapport synthétise les réponses fournies par ${identite} pour ${raison}${ville ? ` (${ville})` : ""}. ` +
    `L'analyse identifie ${diagnostic.length} constat${diagnostic.length > 1 ? "s" : ""} significatif${diagnostic.length > 1 ? "s" : ""} et chiffre l'opportunité à ` +
    `${roi.annualValue.toLocaleString("fr-CA")} $ par année en valeur honoraire récupérée, ` +
    `avec une réduction de ${safeOffer.savings.percent} % sur vos dépenses logicielles actuelles.`;

  const prochainesEtapes = [
    "Planifier un appel de 30 minutes avec l'équipe SAFE pour revoir ce rapport en détail.",
    "Confirmer votre offre et la date de bascule (mise en place en 5 à 10 jours ouvrables).",
    "Transmettre les données de départ (clients actifs, dossiers en cours, soldes fidéicommis).",
  ];

  return {
    marketQuote,
    safeOffer,
    plans,
    recommendedPlanId,
    risks,
    riskScore,
    roi,
    urgencyLevel: urgencyLevelOf(a),
    narrative: { executiveSummary, diagnostic, opportunites, prochainesEtapes },
  };
}
