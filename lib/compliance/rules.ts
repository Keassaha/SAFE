/**
 * Registre des obligations de conformité, consommé par le code.
 *
 * Source de vérité : docs/compliance/REGISTRE_OBLIGATIONS.md (v0.2, validée contre
 * docs/accounting/RECHERCHE_COMPTA_SAFE_QC_ON.md + lecture du code). Décision : ADR-011.
 *
 * Doctrine (ADR-011) :
 * - Chaque règle porte sa juridiction, sa source et son niveau de confiance.
 * - RIEN n'est affiché à l'utilisateur si la confiance est INCERTAIN ou si la source
 *   est absente. Une règle INCERTAIN existe ici pour le suivi (elle route vers une
 *   question dans QUESTIONS_BARREAU.md), mais `getDisplayableRules` ne la renvoie jamais.
 * - Province-aware : une règle ontarienne n'est jamais servie à un cabinet québécois,
 *   et inversement. Les règles fédérales et transversales (ALL) s'appliquent partout.
 * - Bilingue : chaque énoncé porte fr/en. La langue d'affichage suit la province
 *   (QC → fr, ON → en), comme lib/trust/regulator.ts.
 *
 * Module PUR : aucun accès Prisma, aucune dépendance UI. La province est passée en
 * argument (dérivée de CabinetConfig.province, cf. lib/cabinet-config.ts).
 *
 * Ce module est INERTE tant qu'il n'est pas consommé. Le branchement dans les surfaces
 * est gaté par COMPLIANCE_RULES_ENABLED (défaut éteint), avec parité testée.
 */

/** Juridiction d'une obligation. "ALL" = s'applique quelle que soit la province. */
export type Jurisdiction = "QC" | "ON" | "FED" | "ALL";

/** Province effective d'un cabinet (aligné sur lib/trust/regulator.ts : QC, sinon ON). */
export type CabinetProvince = "QC" | "ON";

/** Langue d'affichage. */
export type Locale = "fr" | "en";

/** Énoncé bilingue. */
export type LocalizedText = { fr: string; en: string };

/**
 * Niveau de confiance dans la source.
 * - CONFIRME : source primaire fact-checkée.
 * - PARTIEL : article cité, non vérifié sur texte primaire.
 * - INCERTAIN : non sourcé, ne pilote AUCUN affichage (suivi seulement).
 */
export type Confidence = "CONFIRME" | "PARTIEL" | "INCERTAIN";

/** Domaines du registre (docs/compliance/REGISTRE_OBLIGATIONS.md). */
export type ComplianceDomain =
  | "fideicommis"
  | "cash"
  | "retention"
  | "conflicts"
  | "fintrac"
  | "privacy"
  | "billing"
  | "federal";

export interface ComplianceRule {
  /** Identifiant stable, aligné sur le registre (ex. "TR-QC-06"). */
  id: string;
  domain: ComplianceDomain;
  jurisdiction: Jurisdiction;
  /** Énoncé court de l'obligation (bilingue). */
  statement: LocalizedText;
  /** Source (texte + référence). Non vide. */
  source: string;
  confidence: Confidence;
  /** Question ouverte associée (id dans QUESTIONS_BARREAU.md) pour les INCERTAIN. */
  openQuestion?: string;
  /** Date d'entrée en vigueur (ISO), si datée. */
  effectiveDate?: string;
  /** Échéance de déclaration/dépôt (ISO), si datée. */
  deadline?: string;
  /** Note de nuance (périmètre à confirmer, anomalie code, etc.). */
  note?: string;
}

/**
 * Flag de branchement (Phase 1). Défaut ÉTEINT : tant qu'il l'est, aucune surface de
 * production ne consomme ce module. Le module reste importable et testable.
 */
export const COMPLIANCE_RULES_ENABLED =
  process.env.COMPLIANCE_RULES_ENABLED === "1" ||
  process.env.COMPLIANCE_RULES_ENABLED === "true";

/**
 * Le registre. Encodage fidèle de REGISTRE_OBLIGATIONS.md v0.2.
 * Toute modification d'une règle réglementaire DOIT d'abord passer par le registre doc.
 */
export const COMPLIANCE_RULES: ComplianceRule[] = [
  // ── 1. Fidéicommis ────────────────────────────────────────────
  { id: "TR-QC-01", domain: "fideicommis", jurisdiction: "QC", confidence: "CONFIRME",
    statement: {
      fr: "Comptabilité en fidéicommis régie par RLRQ c. B-1, r. 5.",
      en: "Trust accounting governed by RLRQ c. B-1, r. 5." },
    source: "RECHERCHE_COMPTA §0,2 ; CanLII rlrq-c-b-1-r-5" },
  { id: "TR-QC-02", domain: "fideicommis", jurisdiction: "QC", confidence: "CONFIRME",
    statement: {
      fr: "Séparation stricte des fonds client et des fonds du cabinet (non-commingling).",
      en: "Strict separation of client funds from firm funds (no commingling)." },
    source: "RECHERCHE_COMPTA §2" },
  { id: "TR-QC-03", domain: "fideicommis", jurisdiction: "QC", confidence: "CONFIRME",
    statement: {
      fr: "Compte général F2 obligatoire ; ouverture déclarée au Barreau + formation dans les 6 mois.",
      en: "Mandatory F2 general trust account; opening declared to the Barreau plus training within 6 months." },
    source: "RECHERCHE_COMPTA §2 (l.64,70)",
    note: "Titre exact du formulaire F2 à confirmer (RECHERCHE l.232)." },
  { id: "TR-QC-04", domain: "fideicommis", jurisdiction: "QC", confidence: "CONFIRME",
    statement: {
      fr: "Registres : journal caisse (art. 38), cartes-clients (art. 39, 66), rapports mensuels (art. 40-41), autres biens (art. 43).",
      en: "Required records: cash journal (s. 38), client ledgers (s. 39, 66), monthly reports (s. 40-41), other property (s. 43)." },
    source: "RECHERCHE_COMPTA §2 (l.65)",
    note: "Art. 43 (biens non monétaires) non couvert par SAFE." },
  { id: "TR-QC-05", domain: "fideicommis", jurisdiction: "QC", confidence: "CONFIRME",
    statement: {
      fr: "Rapprochement à trois voies : journal ↔ carte-client ↔ relevé bancaire.",
      en: "Three-way reconciliation: journal ↔ client ledger ↔ bank statement." },
    source: "RECHERCHE_COMPTA §2 (l.66)" },
  { id: "TR-QC-06", domain: "fideicommis", jurisdiction: "QC", confidence: "CONFIRME",
    statement: {
      fr: "Rapprochement mensuel. Aucun délai chiffré en jours au Québec (livres « à jour »).",
      en: "Monthly reconciliation. No fixed number of days in Quebec (books kept up to date)." },
    source: "RECHERCHE_COMPTA §0,2 (l.15,67) ; FAQ Barreau QC",
    note: "Le délai « 25 jours » est propre à l'Ontario ; ne jamais l'afficher en QC." },
  { id: "TR-QC-07", domain: "fideicommis", jurisdiction: "QC", confidence: "CONFIRME",
    statement: {
      fr: "Aucun solde de carte-client ne peut être négatif ; la certification du rapprochement est bloquée sinon.",
      en: "No client ledger balance may be negative; reconciliation certification is blocked otherwise." },
    source: "RECHERCHE_COMPTA §8 ; reconciliation-service.ts:135-152 (garde-fou R-1)" },
  { id: "TR-QC-08", domain: "fideicommis", jurisdiction: "QC", confidence: "CONFIRME",
    statement: {
      fr: "Intérêts du fidéicommis versés au Fonds d'études juridiques du Barreau (B-1, r. 10).",
      en: "Trust interest remitted to the Barreau's Fonds d'études juridiques (B-1, r. 10)." },
    source: "RECHERCHE_COMPTA §0 (l.17,72) ; CanLII rlrq-c-b-1-r-10" },
  { id: "TR-QC-09", domain: "fideicommis", jurisdiction: "QC", confidence: "CONFIRME",
    statement: {
      fr: "Dépôt des sommes reçues « sans délai indu » (pas de délai chiffré au Québec).",
      en: "Funds received deposited without undue delay (no fixed number of days in Quebec)." },
    source: "RECHERCHE_COMPTA §2 (l.69)" },
  { id: "TR-ON-01", domain: "fideicommis", jurisdiction: "ON", confidence: "CONFIRME",
    statement: {
      fr: "Comptabilité en fidéicommis régie par By-Law 9 (LSO).",
      en: "Trust accounting governed by By-Law 9 (LSO)." },
    source: "RECHERCHE_COMPTA §2 ; LSO By-Law 9" },
  { id: "TR-ON-02", domain: "fideicommis", jurisdiction: "ON", confidence: "CONFIRME",
    statement: {
      fr: "Rapprochement mensuel au plus tard 25 jours après la fin du mois (art. 22(2)).",
      en: "Monthly reconciliation no later than 25 days after month-end (s. 22(2))." },
    source: "RECHERCHE_COMPTA §2 (l.67) ; LSO By-Law 9" },
  { id: "TR-ON-03", domain: "fideicommis", jurisdiction: "ON", confidence: "CONFIRME",
    statement: {
      fr: "Le délai de 25 jours est propre à l'Ontario ; il ne s'applique pas au Québec.",
      en: "The 25-day deadline is specific to Ontario; it does not apply in Quebec." },
    source: "journal 2026-06-09 ; regulator.ts:8-12" },
  { id: "TR-ON-04", domain: "fideicommis", jurisdiction: "ON", confidence: "CONFIRME",
    statement: {
      fr: "Intérêts des comptes groupés versés à la Law Foundation of Ontario (s. 57 Law Society Act).",
      en: "Pooled account interest remitted to the Law Foundation of Ontario (s. 57 Law Society Act)." },
    source: "RECHERCHE_COMPTA §2 (l.72)" },
  { id: "TR-ON-05", domain: "fideicommis", jurisdiction: "ON", confidence: "CONFIRME",
    statement: {
      fr: "Sommes reçues déposées au plus tard le jour ouvrable bancaire suivant (art. 1(3)).",
      en: "Funds received deposited no later than the next banking day (s. 1(3))." },
    source: "RECHERCHE_COMPTA §0 (l.22) ; LSO By-Law 9" },
  { id: "TR-ON-06", domain: "fideicommis", jurisdiction: "ON", confidence: "CONFIRME",
    statement: {
      fr: "Plan de contingence écrit obligatoire (praticien seul : désigner un administrateur), révisé annuellement.",
      en: "Mandatory written contingency plan (sole practitioner: designate an administrator), reviewed annually." },
    source: "LSO Mandatory Succession Planning ; OBA (recherche web 2026-07)",
    effectiveDate: "2025-01-01", deadline: "2026-03-31",
    note: "Déclaration via rapport annuel. Numéro « By-Law 8 » de la source interne à confirmer. Non capté par SAFE." },
  { id: "TR-QC-11", domain: "fideicommis", jurisdiction: "QC", confidence: "INCERTAIN",
    statement: {
      fr: "Rapport Annuel sur la Pratique (RAP) : contenu exact et délai de dépôt.",
      en: "Annual Practice Report (RAP): exact content and filing deadline." },
    source: "Non confirmé — voir QUESTIONS_BARREAU.md", openQuestion: "Q-BARREAU-02" },
  { id: "TR-QC-12", domain: "fideicommis", jurisdiction: "QC", confidence: "INCERTAIN",
    statement: {
      fr: "Vérification annuelle des comptes fiduciaires par un CPA indépendant : obligatoire ou non ?",
      en: "Annual trust account audit by an independent CPA: mandatory or not?" },
    source: "Non confirmé (absent du fact-check) — voir QUESTIONS_BARREAU.md", openQuestion: "Q-BARREAU-03" },

  // ── 2. Plafond d'espèces ──────────────────────────────────────
  { id: "CASH-01", domain: "cash", jurisdiction: "ALL", confidence: "CONFIRME",
    statement: {
      fr: "Règle « No Cash » : interdit d'accepter 7 500 $ ou plus en espèces pour un mandat.",
      en: "\"No Cash\" rule: accepting $7,500 or more in cash for a matter is prohibited." },
    source: "RECHERCHE_COMPTA §2 (l.71) ; trust-transaction-service.ts:16,72",
    note: "Périmètre exact (exceptions, agrégation) à confirmer — voir Q-FED-02." },
  { id: "CASH-QC-02", domain: "cash", jurisdiction: "QC", confidence: "CONFIRME",
    statement: {
      fr: "Déclaration au Barreau des sommes reçues en espèces dans les 30 jours (art. 71).",
      en: "Declaration to the Barreau of cash amounts received within 30 days (s. 71)." },
    source: "RECHERCHE_COMPTA §2 (l.71)",
    note: "Non implémenté dans SAFE." },

  // ── 3. Conservation / rétention ───────────────────────────────
  { id: "RET-QC-01", domain: "retention", jurisdiction: "QC", confidence: "CONFIRME",
    statement: {
      fr: "Dossiers clients conservés 7 ans après la fermeture.",
      en: "Client files retained 7 years after closing." },
    source: "RECHERCHE_COMPTA §2 (l.68)" },
  { id: "RET-QC-02", domain: "retention", jurisdiction: "QC", confidence: "CONFIRME",
    statement: {
      fr: "Rapports mensuels et copies de chèques fidéicommis conservés 7 ans après la fin de l'exercice.",
      en: "Monthly reports and trust cheque copies retained 7 years after fiscal year-end." },
    source: "RECHERCHE_COMPTA §2 (l.68)" },
  { id: "RET-QC-03", domain: "retention", jurisdiction: "QC", confidence: "PARTIEL",
    statement: {
      fr: "Durées de conservation plus longues selon le domaine (immobilier, prescription, etc.).",
      en: "Longer retention periods depending on the practice area (real estate, limitation periods, etc.)." },
    source: "KB archivage-retention (non fact-checké)" },
  { id: "RET-ON-01", domain: "retention", jurisdiction: "ON", confidence: "CONFIRME",
    statement: {
      fr: "Registres généraux conservés 6 ans (art. 23(1)).",
      en: "General records retained 6 years (s. 23(1))." },
    source: "RECHERCHE_COMPTA §2 (l.68) ; LSO By-Law 9" },
  { id: "RET-ON-02", domain: "retention", jurisdiction: "ON", confidence: "CONFIRME",
    statement: {
      fr: "Registres fidéicommis et comparaisons mensuelles conservés 10 ans (art. 23(2)(3)).",
      en: "Trust records and monthly comparisons retained 10 years (s. 23(2)(3))." },
    source: "RECHERCHE_COMPTA §2 (l.68)" },
  { id: "RET-FED-01", domain: "retention", jurisdiction: "FED", confidence: "PARTIEL",
    statement: {
      fr: "Documents FINTRAC conservés 7 ans.",
      en: "FINTRAC documents retained 7 years." },
    source: "KB archivage-retention (non fact-checké)" },

  // ── 4. Conflits d'intérêts ────────────────────────────────────
  { id: "CONF-QC-01", domain: "conflicts", jurisdiction: "QC", confidence: "INCERTAIN",
    statement: {
      fr: "Vérification des conflits d'intérêts à l'ouverture (article du Code de déontologie).",
      en: "Conflict-of-interest check at file opening (Code of ethics provision)." },
    source: "Code de déontologie QC absent du corpus — voir QUESTIONS_BARREAU.md", openQuestion: "Q-BARREAU-04" },
  { id: "CONF-ON-01", domain: "conflicts", jurisdiction: "ON", confidence: "INCERTAIN",
    statement: {
      fr: "Vérification des conflits d'intérêts (Rules of Professional Conduct, r. 3.4).",
      en: "Conflict-of-interest check (Rules of Professional Conduct, r. 3.4)." },
    source: "Texte non reproduit — voir QUESTIONS_BARREAU.md", openQuestion: "Q-LSO-02" },

  // ── 5. Identification client (FINTRAC) ────────────────────────
  { id: "FIN-01", domain: "fintrac", jurisdiction: "FED", confidence: "PARTIEL",
    statement: {
      fr: "Vérification d'identité et déclaration pour les espèces de 10 000 $ et plus.",
      en: "Identity verification and reporting for cash of $10,000 or more." },
    source: "KB [VERIFIE - fintrac-canafe] (contexte immobilier ON)" },
  { id: "FIN-02", domain: "fintrac", jurisdiction: "FED", confidence: "INCERTAIN",
    statement: {
      fr: "Régime FINTRAC propre aux avocats (distinct des courtiers ; CSC 2015).",
      en: "FINTRAC regime specific to lawyers (distinct from brokers; SCC 2015)." },
    source: "Absent du corpus — voir QUESTIONS_BARREAU.md", openQuestion: "Q-FED-01" },

  // ── 6. Vie privée ─────────────────────────────────────────────
  { id: "PRIV-QC-01", domain: "privacy", jurisdiction: "QC", confidence: "PARTIEL",
    statement: {
      fr: "Loi 25 : responsable désigné, registre d'incidents, droit d'accès, consentement, destruction sécurisée.",
      en: "Law 25: designated officer, incident register, right of access, consent, secure destruction." },
    source: "KB archivage-retention (impact produit, pas d'articles)" },
  { id: "PRIV-QC-02", domain: "privacy", jurisdiction: "QC", confidence: "INCERTAIN",
    statement: {
      fr: "Articles précis de la Loi 25, seuil et délai de notification d'incident à la CAI.",
      en: "Specific Law 25 provisions, threshold and timeline for incident notification to the CAI." },
    source: "Fichier loi-25 absent — voir QUESTIONS_BARREAU.md", openQuestion: "Q-BARREAU-05" },
  { id: "PRIV-ON-01", domain: "privacy", jurisdiction: "ON", confidence: "INCERTAIN",
    statement: {
      fr: "Obligations concrètes PIPEDA pour un cabinet.",
      en: "Concrete PIPEDA obligations for a firm." },
    source: "Mention d'activation seulement" },

  // ── 7. Facturation et taxes ───────────────────────────────────
  { id: "FACT-01", domain: "billing", jurisdiction: "ALL", confidence: "CONFIRME",
    statement: {
      fr: "Numérotation des factures séquentielle, sans trou.",
      en: "Sequential invoice numbering, with no gaps." },
    source: "Doctrine SAFE ; déployé 2026-06-05" },
  { id: "TAX-QC-01", domain: "billing", jurisdiction: "QC", confidence: "CONFIRME",
    statement: {
      fr: "TPS 5 % + TVQ 9,975 % (TVQ hors TPS). Inscription obligatoire dès 30 000 $ de fournitures taxables.",
      en: "GST 5% + QST 9.975% (QST on the GST-excluded amount). Registration required once taxable supplies reach $30,000." },
    source: "RECHERCHE_COMPTA §2.1 ; Revenu Québec" },
  { id: "TAX-ON-01", domain: "billing", jurisdiction: "ON", confidence: "CONFIRME",
    statement: {
      fr: "TVH 13 %.",
      en: "HST 13%." },
    source: "RECHERCHE_COMPTA §2.1" },
  { id: "TAX-FED-01", domain: "billing", jurisdiction: "FED", confidence: "CONFIRME",
    statement: {
      fr: "Production des déclarations TPS/TVH par voie électronique obligatoire depuis 2024.",
      en: "Electronic filing of GST/HST returns mandatory since 2024." },
    source: "RECHERCHE_COMPTA §0 (l.23) ; ARC" },
  { id: "FACT-QC-01", domain: "billing", jurisdiction: "QC", confidence: "INCERTAIN",
    statement: {
      fr: "Numéro d'inscription TPS/TVQ obligatoire sur la facture, et à partir de quel montant.",
      en: "GST/QST registration number required on invoices, and above what amount." },
    source: "Non sourcé dans le corpus — voir QUESTIONS_BARREAU.md", openQuestion: "Q-RQ-01" },

  // ── 8. Fédéral / autres ───────────────────────────────────────
  { id: "T3-FED-01", domain: "federal", jurisdiction: "FED", confidence: "CONFIRME",
    statement: {
      fr: "Déclaration T3 des comptes particuliers ; exemption sous le seuil de 250 000 $ d'actifs en argent (compte général F2 exempté).",
      en: "T3 return for specific trust accounts; exemption below the $250,000 cash-asset threshold (F2 general account exempt)." },
    source: "RECHERCHE_COMPTA §0,8 ; ARC T3 Trust Guide",
    note: "Application 2026 à confirmer avec le CPA du cabinet (RECHERCHE l.233)." },
];

/**
 * Normalise la province d'un cabinet. Aligné sur lib/trust/regulator.ts :
 * "QC" → QC ; toute autre valeur ou absence → ON (comportement historique).
 */
export function resolveProvince(province?: string | null): CabinetProvince {
  return (province ?? "").toUpperCase() === "QC" ? "QC" : "ON";
}

/** Langue d'affichage selon la province (QC → fr, ON → en), comme regulator.ts. */
export function localeForProvince(province?: string | null): Locale {
  return resolveProvince(province) === "QC" ? "fr" : "en";
}

/** Rend l'énoncé d'une règle dans la langue demandée. */
export function localizedStatement(rule: ComplianceRule, locale: Locale): string {
  return rule.statement[locale];
}

/** Une règle s'applique-t-elle à un cabinet de la province donnée ? */
export function ruleAppliesToProvince(rule: ComplianceRule, province: CabinetProvince): boolean {
  return (
    rule.jurisdiction === province ||
    rule.jurisdiction === "FED" ||
    rule.jurisdiction === "ALL"
  );
}

/**
 * Une règle est-elle AFFICHABLE à l'utilisateur ?
 * Doctrine ADR-011 : jamais d'INCERTAIN, jamais sans source.
 */
export function isDisplayable(rule: ComplianceRule): boolean {
  return rule.confidence !== "INCERTAIN" && rule.source.trim().length > 0;
}

/**
 * Toutes les règles applicables à la province (y compris INCERTAIN), pour le suivi
 * interne / console. NE PAS afficher directement à l'utilisateur cabinet.
 */
export function getRulesForProvince(province?: string | null): ComplianceRule[] {
  const p = resolveProvince(province);
  return COMPLIANCE_RULES.filter((r) => ruleAppliesToProvince(r, p));
}

/**
 * Règles AFFICHABLES à l'utilisateur cabinet : applicables à la province ET non
 * INCERTAIN ET sourcées. C'est l'entrée à utiliser pour toute surface utilisateur.
 */
export function getDisplayableRules(province?: string | null): ComplianceRule[] {
  return getRulesForProvince(province).filter(isDisplayable);
}

/** Règles affichables d'un domaine donné pour la province. */
export function getDisplayableRulesByDomain(
  domain: ComplianceDomain,
  province?: string | null,
): ComplianceRule[] {
  return getDisplayableRules(province).filter((r) => r.domain === domain);
}

/** Questions ouvertes (INCERTAIN) applicables à la province, pour le suivi. */
export function getOpenQuestions(province?: string | null): ComplianceRule[] {
  return getRulesForProvince(province).filter((r) => r.confidence === "INCERTAIN");
}

/** Recherche une règle par identifiant. */
export function getRuleById(id: string): ComplianceRule | undefined {
  return COMPLIANCE_RULES.find((r) => r.id === id);
}
