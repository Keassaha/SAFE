import type { AuditReport } from "@/types/audit-report";
import { BENCHMARKS } from "./benchmarks";

type Answers = Record<string, unknown>;

function str(v: unknown) {
  return String(v ?? "");
}
function num(v: unknown): number {
  return Number(v ?? 0);
}

/**
 * Lit un sous-champ pouvant être stocké soit en clé plate
 * (`groupe_champ`, `"groupe.champ"`), soit dans un objet imbriqué
 * (`a[groupe] = { champ }`). Retourne toujours une chaîne.
 */
function nestedStr(a: Answers, group: string, field: string): string {
  const flat = a[`${group}_${field}`] ?? a[`${group}.${field}`];
  if (flat !== undefined && flat !== null && flat !== "") return str(flat);
  const obj = a[group];
  if (obj && typeof obj === "object" && !Array.isArray(obj)) {
    return str((obj as Record<string, unknown>)[field]);
  }
  return "";
}

function midHours(v: unknown): { min: number; max: number } {
  switch (str(v)) {
    case "lt2":  return { min: 0, max: 2 };
    case "2_5":  return { min: 2, max: 5 };
    case "6_10": return { min: 6, max: 10 };
    case "gt10": return { min: 10, max: 15 };
    default:     return { min: 2, max: 5 };
  }
}

function midRate(v: unknown): { min: number; max: number } {
  switch (str(v)) {
    case "lt150":  return { min: 100, max: 150 };
    case "150_250":return { min: 150, max: 250 };
    case "251_400":return { min: 251, max: 400 };
    case "gt400":  return { min: 400, max: 600 };
    default:       return { min: 150, max: 250 };
  }
}

function delaiJours(v: unknown): number {
  switch (str(v)) {
    case "lt15":   return 10;
    case "15_30":  return 22;
    case "31_60":  return 45;
    case "gt60":   return 75;
    case "inconnu":return 50;
    default:       return 50;
  }
}

function activeCasesLabel(v: unknown): string {
  switch (str(v)) {
    case "lt10":   return "Moins de 10 dossiers";
    case "10_30":  return "10 à 30 dossiers";
    case "31_75":  return "31 à 75 dossiers";
    case "76_150": return "76 à 150 dossiers";
    case "gt150":  return "Plus de 150 dossiers";
    default:       return "Moins de 10 dossiers";
  }
}

function ancienneteLabel(v: unknown): string {
  switch (str(v)) {
    case "lt2":  return "Moins de 2 ans";
    case "2_5":  return "2 à 5 ans";
    case "6_15": return "6 à 15 ans";
    case "gt15": return "Plus de 15 ans";
    default:     return "Moins de 2 ans";
  }
}

function formeLabel(v: unknown): string {
  switch (str(v)) {
    case "individuelle": return "Entreprise individuelle";
    case "inc":          return "Société par actions (Inc.)";
    case "senc":         return "S.E.N.C. / S.E.N.C.R.L.";
    default:             return str(v) || "Autre";
  }
}

function logicielLabel(v: unknown): string {
  switch (str(v)) {
    case "pclaw":         return "PCLaw";
    case "jurisevolution":return "JurisEvolution";
    case "clio":          return "Clio";
    case "jurisconcept":  return "Juris Concept";
    case "aucun":         return "Excel / papier";
    default:              return str(v) || "Autre";
  }
}

function factuLabel(v: unknown, taux: unknown): string {
  const mode = str(v);
  const rateLabel =
    str(taux) === "lt150" ? "moins de 150 $/h"
    : str(taux) === "150_250" ? "150 à 250 $/h"
    : str(taux) === "251_400" ? "251 à 400 $/h"
    : str(taux) === "gt400" ? "plus de 400 $/h"
    : "";
  if (mode === "horaire" && rateLabel) return `À l'heure, ${rateLabel}`;
  if (mode === "forfait") return "Au forfait";
  if (mode === "mixte" && rateLabel) return `Mixte, ${rateLabel}`;
  if (mode === "commission") return "À la commission";
  return "Non précisé";
}

function fideicommisLabel(v: unknown): string {
  switch (str(v)) {
    case "actif":   return "Géré activement";
    case "peu":     return "Géré, peu de mouvements";
    case "non":     return "Aucun compte en fidéicommis";
    case "bientot": return "Prévu prochainement";
    default:        return "Non précisé";
  }
}

function heuresAdminLabel(v: unknown): string {
  switch (str(v)) {
    case "lt2":  return "Moins de 2 h / sem.";
    case "2_5":  return "2 à 5 h / sem.";
    case "6_10": return "6 à 10 h / sem.";
    case "gt10": return "Plus de 10 h / sem.";
    default:     return str(v) || "Non précisé";
  }
}

function delaiPaiementLabel(v: unknown): string {
  switch (str(v)) {
    case "lt15":    return "Moins de 15 jours";
    case "15_30":   return "15 à 30 jours";
    case "31_60":   return "31 à 60 jours";
    case "gt60":    return "Plus de 60 jours";
    case "inconnu": return "Inconnu";
    default:        return str(v) || "Non précisé";
  }
}

function tauxHoraireLabel(v: unknown): string {
  switch (str(v)) {
    case "lt150":   return "Moins de 150 $/h";
    case "150_250": return "150 à 250 $/h";
    case "251_400": return "251 à 400 $/h";
    case "gt400":   return "Plus de 400 $/h";
    default:        return str(v) || "Non précisé";
  }
}

function modeFacturationLabel(v: unknown): string {
  switch (str(v)) {
    case "horaire":    return "À l'heure";
    case "forfait":    return "Au forfait";
    case "mixte":      return "Mixte";
    case "commission": return "À la commission";
    default:           return str(v) || "Non précisé";
  }
}

// Valeurs réelles du formulaire : tp | pt | partage | non | jamais
function adjointLabel(v: unknown): string {
  switch (str(v)) {
    case "tp":      return "Oui, temps plein";
    case "pt":      return "Oui, temps partiel";
    case "partage": return "Oui, partagé(e)";
    case "non":     return "Non, pas encore";
    case "jamais":  return "Non, pas prévu";
    default:        return str(v) || "Non";
  }
}

// Valeurs réelles du formulaire : int_tp | int_pt | externe | moi | defi
function comptableLabel(v: unknown): string {
  switch (str(v)) {
    case "int_tp":  return "Interne, temps plein";
    case "int_pt":  return "Interne, temps partiel";
    case "externe": return "Externe (firme / CPA)";
    case "moi":     return "Je le fais moi-même";
    case "defi":    return "Je le fais moi-même (difficulté)";
    default:        return str(v) || "Non précisé";
  }
}

function gestionFacturationLabel(v: unknown): string {
  switch (str(v)) {
    case "moi":         return "Le praticien lui-même";
    case "adjoint":     return "Adjoint(e)";
    case "parajuriste": return "Technicien(ne) / parajuriste";
    case "externe":     return "CPA / teneur de livres externe";
    case "personne":    return "Personne de façon systématique";
    default:            return str(v) || "Non précisé";
  }
}

function evolutionLabel(v: unknown): string {
  switch (str(v)) {
    case "forte":   return "En forte croissance";
    case "moderee": return "En croissance modérée";
    case "stable":  return "Stable";
    case "ralenti": return "En ralentissement";
    case "demarre": return "Démarrage";
    default:        return str(v) || "Non précisé";
  }
}

function urgenceLabel(v: unknown): string {
  switch (str(v)) {
    case "urgent":    return "Urgent (dans le mois)";
    case "important": return "Important (3 mois)";
    case "moyen":     return "Moyen (6 mois)";
    case "info":      return "Je me renseigne";
    default:          return str(v) || "Non précisé";
  }
}

function visibiliteCreancesLabel(v: unknown): string {
  switch (str(v)) {
    case "facile":   return "Oui, facilement";
    case "logiciel": return "Oui, via logiciel";
    case "manuel":   return "Non, calcul manuel requis";
    case "non":      return "Non, pas du tout";
    default:         return str(v) || "Non précisé";
  }
}

/** Extrait un tableau depuis une réponse checkbox (array JSON ou array direct) */
function arr(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String);
  if (typeof v === "string") {
    try { const p = JSON.parse(v); if (Array.isArray(p)) return p.map(String); } catch { /* noop */ }
    return v ? [v] : [];
  }
  return [];
}

export function buildCabinet(a: Answers): AuditReport["cabinet"] {
  // Certaines réponses sont stockées sous forme d'objet imbriqué
  // (ex. localisation = { ville, province }, identite = { nom_complet, titre }).
  // nestedStr() lit l'objet imbriqué avec repli sur d'éventuelles clés plates.
  const nomComplet = nestedStr(a, "identite", "nom_complet");
  const titre = nestedStr(a, "identite", "titre");
  const ville = nestedStr(a, "localisation", "ville");
  const province = nestedStr(a, "localisation", "province") || "QC";
  const domainesBrut = str(a.domaines_pratique || a.domaines || "");
  const domaines = domainesBrut
    .split(/[,;/\n]+/)
    .map((d) => d.trim())
    .filter(Boolean)
    .slice(0, 5);

  return {
    raisonSociale: str(a.raison_sociale) || "Cabinet",
    contact: `${titre ? `Me ${nomComplet}, ${titre.toLowerCase()}` : nomComplet}`,
    localisation: `${ville}, ${province}`,
    formeJuridique: formeLabel(a.forme_juridique),
    domaines: domaines.length > 0 ? domaines : ["Non précisé"],
    anciennete: ancienneteLabel(a.annees_pratique),
    dossiersActifs: activeCasesLabel(a.dossiers_actifs),
    facturation: factuLabel(a.mode_facturation, a.taux_horaire),
    fideicommis: fideicommisLabel(a.fideicommis_usage),
    utilisateurs: str(a.nb_utilisateurs) === "3plus" ? 3 : str(a.nb_utilisateurs) === "2" ? 2 : 1,
    outilActuel: logicielLabel(a.logiciel_actuel),
    satisfactionOutil: Math.max(1, Math.min(10, num(a.satisfaction) || 5)),
  };
}

export function buildDrivers(a: Answers): AuditReport["drivers"] {
  const drivers: AuditReport["drivers"] = [];
  const heures = str(a.heures_admin);
  const satisfaction = num(a.satisfaction);
  const delai = str(a.delai_paiement);
  const fidei = str(a.fideicommis_usage);
  const nb = str(a.nb_utilisateurs);
  const dossiers = str(a.dossiers_actifs);
  const logiciel = str(a.logiciel_actuel);
  const frustrations = arr(a.frustrations);
  const evolution = str(a.evolution);
  const visibilite = str(a.visibilite_creances);
  const gestionFact = str(a.gestion_facturation);

  // 1. Charge administrative élevée
  if (["6_10", "gt10"].includes(heures) || frustrations.includes("admin")) {
    const label = heures === "gt10" ? "Plus de 10 h" : heures === "6_10" ? "6 à 10 h" : "Déclaré";
    drivers.push({
      label: "Une charge administrative qui empiète sur le temps facturable",
      valeur: frustrations.includes("admin") && !["6_10","gt10"].includes(heures)
        ? "Frustration déclarée"
        : `${label} / sem.`,
      note: "charge admin",
    });
  }

  // 2. Facturation lente ou sans responsable
  if (gestionFact === "personne" || frustrations.includes("facturation")) {
    drivers.push({
      label: gestionFact === "personne"
        ? "Aucun responsable dédié à la facturation"
        : "Un processus de facturation lent ou compliqué",
      valeur: gestionFact === "personne" ? "Non structurée" : "Frustration déclarée",
      note: "facturation",
    });
  }

  // 3. Visibilité sur les créances
  if (["non", "manuel"].includes(visibilite) || frustrations.includes("impayes")) {
    drivers.push({
      label: "Pas de visibilité en temps réel sur les factures impayées",
      valeur: visibilite === "non" ? "Aucune visibilité" : "Calcul manuel",
      note: "créances",
    });
  }

  // 4. Outil sous-optimal
  if (satisfaction > 0 && satisfaction <= 5) {
    drivers.push({
      label: "Un outil mal adapté à votre réalité de cabinet",
      valeur: `${satisfaction} / 10`,
      note: "satisfaction outil",
    });
  } else if (satisfaction >= 6 && satisfaction <= 7 && logiciel !== "aucun") {
    drivers.push({
      label: "Un logiciel passable qui laisse des tâches manuelles",
      valeur: `${satisfaction} / 10`,
      note: "satisfaction outil",
    });
  }

  // 5. Délai de règlement problématique
  if (["gt60", "inconnu"].includes(delai)) {
    const jours = delai === "gt60" ? "> 60 j" : "délai inconnu";
    drivers.push({
      label: "Un délai de règlement qui dépasse la norme canadienne",
      valeur: jours,
      note: "délai de paiement",
    });
  } else if (delai === "31_60") {
    drivers.push({
      label: "Un délai de règlement au-dessus de la médiane canadienne",
      valeur: "31 à 60 j",
      note: "délai de paiement",
    });
  }

  // 6. Fidéicommis sans outil dédié
  if (["actif", "peu"].includes(fidei) && (frustrations.includes("fideicommis") || nb === "1")) {
    drivers.push({
      label: "Une gestion du fidéicommis sans outil de second regard",
      valeur: fideicommisLabel(fidei),
      note: "fidéicommis",
    });
  }

  // 7. Croissance forte sans infrastructure adaptée
  if (evolution === "forte" && drivers.length < 4) {
    drivers.push({
      label: "Une croissance forte qui dépasse l'organisation actuelle",
      valeur: "Forte croissance",
      note: "évolution",
    });
  }

  // 8. Fallbacks contextuels si encore peu de signaux
  if (drivers.length < 2) {
    if (["31_75", "76_150", "gt150"].includes(dossiers)) {
      drivers.push({
        label: "Un volume de dossiers qui appelle un suivi structuré",
        valeur: activeCasesLabel(dossiers),
        note: "volume dossiers",
      });
    } else {
      drivers.push({
        label: "Une opportunité de récupérer du temps sur chaque dossier",
        valeur: heures === "lt2" ? "< 2 h / sem." : "2 à 5 h / sem.",
        note: "temps récupérable",
      });
    }
  }

  return drivers.slice(0, 4);
}

export function buildRisques(a: Answers): AuditReport["risques"] {
  const risques: AuditReport["risques"] = [];
  const heures = str(a.heures_admin);
  const satisfaction = num(a.satisfaction);
  const delai = str(a.delai_paiement);
  const fidei = str(a.fideicommis_usage);
  const aide = str(a.aide_juridique);
  const gestionFidei = str(a.gestion_fideicommis);
  const gestionFact = str(a.gestion_facturation);
  const visibilite = str(a.visibilite_creances);
  const frustrations = arr(a.frustrations);
  const evolution = str(a.evolution);

  if (["gt60"].includes(delai)) {
    risques.push({
      niveau: "Modéré",
      titre: "Délai de règlement supérieur à la norme canadienne",
      reference: "Clio Legal Trends 2025",
      source: "Clio Legal Trends 2025, collection lockup médian canadien",
      ceQueMontrent: `Vous déclarez un délai de règlement supérieur à 60 jours. La médiane canadienne est de ${BENCHMARKS.delaiCollectionCanada.valeur} jours.`,
      impact: "Chaque semaine de délai supplémentaire est du capital immobilisé. Sur 12 mois, l'écart représente plusieurs milliers de dollars hors de votre trésorerie.",
      ceQueSafeCorrige: "Paiement en ligne intégré, rappels automatiques et suivi en temps réel des factures impayées.",
    });
  }

  if (["31_60", "inconnu"].includes(delai)) {
    risques.push({
      niveau: "Faible",
      titre: "Délai de règlement à surveiller",
      reference: "Clio Legal Trends 2025",
      source: "Clio Legal Trends 2025",
      ceQueMontrent: `Votre délai déclaré est de 31 à 60 jours, légèrement supérieur à la médiane canadienne de ${BENCHMARKS.delaiCollectionCanada.valeur} jours.`,
      impact: "Risque limité pour l'instant, mais sans outil de suivi, le délai tend à s'allonger à mesure que la pratique croît.",
      ceQueSafeCorrige: "Tableau de bord créances en temps réel et envoi automatique de rappels.",
    });
  }

  if (satisfaction > 0 && satisfaction <= 5) {
    risques.push({
      niveau: "Modéré",
      titre: "Outil actuel mal adapté : risque de friction et d'erreurs",
      reference: "Hypothèse SAFE",
      source: "Analyse des réponses de l'audit",
      ceQueMontrent: `Vous avez noté votre outil actuel à ${satisfaction}/10. Un outil sous-optimal génère des doubles saisies et réduit la traçabilité.`,
      impact: "Erreurs de facturation, perte de temps, risques de conformité si les registres ne sont pas à jour.",
      ceQueSafeCorrige: "Interface unifiée conçue pour les cabinets québécois, conformité intégrée, migration assistée.",
    });
  }

  if (["6_10", "gt10"].includes(heures)) {
    risques.push({
      niveau: "Faible",
      titre: "Concentration du risque : une seule personne gère tout",
      reference: "Hypothèse SAFE",
      source: "Analyse des réponses de l'audit",
      ceQueMontrent: `Vous déclarez ${heures === "gt10" ? "plus de 10" : "6 à 10"} heures par semaine en tâches administratives non facturables.`,
      impact: "En l'absence de processus automatisés, la croissance amplifie la charge plutôt que de la distribuer.",
      ceQueSafeCorrige: "Automatisation de la facturation, de la conciliation et du suivi, libérant votre temps pour la pratique.",
    });
  }

  if (["actif"].includes(fidei) && gestionFidei === "moi") {
    risques.push({
      niveau: "Faible",
      titre: "Fidéicommis géré sans outil spécialisé de second regard",
      reference: "Règlement B-1, r.5",
      source: "Barreau du Québec, B-1, r.5, art. 89 et suivants",
      ceQueMontrent: "Vous gérez activement le fidéicommis seul. Sans outil dédié, la conciliation mensuelle requiert des manipulations manuelles.",
      impact: "Risque d'écart non détecté, et obligation de conciliation mensuelle plus difficile à documenter.",
      ceQueSafeCorrige: "Module fidéicommis intégré avec conciliation automatique et journal d'audit conforme B-1, r.5.",
    });
  }

  if (["reg", "occ"].includes(aide)) {
    risques.push({
      niveau: "Faible",
      titre: "Mandats d'aide juridique : conformité tarifaire et registres",
      reference: "LAJA et directives Barreau",
      source: "Loi sur l'aide juridique et Barreau du Québec",
      ceQueMontrent: "Vous acceptez des mandats d'aide juridique. Ces mandats requièrent une tenue de registres conforme aux tarifs réglementés.",
      impact: "Non-conformité possible si les tarifs et les registres ne sont pas séparés et documentés.",
      ceQueSafeCorrige: "SAFE segmente automatiquement les mandats d'aide juridique et en conserve les traces.",
    });
  }

  // Aucun responsable dédié à la facturation
  if (gestionFact === "personne") {
    risques.push({
      niveau: "Élevé",
      titre: "Aucun processus de facturation structuré",
      reference: "Hypothèse SAFE",
      source: "Analyse des réponses de l'audit",
      ceQueMontrent: "Vous avez indiqué que personne ne gère la facturation de façon systématique dans votre cabinet.",
      impact: "Factures non émises, oublis de suivi et retards d'encaissement directs. Risque de perte de revenus non négligeable.",
      ceQueSafeCorrige: "Tableau de facturation automatisé avec rappels, modèles et suivi des impayés intégrés.",
    });
  }

  // Visibilité nulle sur les créances
  if (visibilite === "non" || frustrations.includes("impayes")) {
    risques.push({
      niveau: visibilite === "non" ? "Modéré" : "Faible",
      titre: "Pas de visibilité en temps réel sur les factures impayées",
      reference: "Hypothèse SAFE",
      source: "Analyse des réponses de l'audit",
      ceQueMontrent: visibilite === "non"
        ? "Vous ne pouvez pas déterminer en moins de 60 secondes le total de vos créances en cours."
        : "Vous avez identifié les factures impayées comme source de frustration dans votre organisation.",
      impact: "Sans visibilité sur les créances, les relances sont tardives et le cycle de trésorerie s'allonge.",
      ceQueSafeCorrige: "Tableau de bord créances en temps réel : solde dû par client, ancienneté des impayés, rappels automatiques.",
    });
  }

  // Croissance forte sans processus adaptés
  if (evolution === "forte" && ["6_10","gt10"].includes(heures)) {
    risques.push({
      niveau: "Modéré",
      titre: "Croissance rapide sans infrastructure administrative adaptée",
      reference: "Hypothèse SAFE",
      source: "Analyse des réponses de l'audit",
      ceQueMontrent: "Votre cabinet est en forte croissance et vous déclarez déjà une charge administrative élevée.",
      impact: "La croissance amplifie les frictions existantes : plus de dossiers, plus de factures, plus de risques d'oubli.",
      ceQueSafeCorrige: "Automatisation et scalabilité intégrée : la charge administrative ne croît pas proportionnellement au volume.",
    });
  }

  return risques;
}

export function buildBarreau(a: Answers): AuditReport["barreau"] {
  const items: AuditReport["barreau"] = [];
  const fidei = str(a.fideicommis_usage);
  const province = nestedStr(a, "localisation", "province") || "QC";

  if (["actif", "peu"].includes(fidei)) {
    items.push({
      reference: "B-1, r.5, art. 89",
      sujet: "Conciliation mensuelle du compte en fidéicommis",
      statut: "Couvert par SAFE",
      description: "Le règlement exige une conciliation mensuelle entre le registre interne et le relevé bancaire. SAFE automatise cette étape et en conserve la traçabilité.",
    });
    items.push({
      reference: "B-1, r.5, art. 94",
      sujet: "Registre des opérations en fidéicommis",
      statut: "Couvert par SAFE",
      description: "Chaque dépôt et retrait doit être consigné avec la date, le client et la nature de l'opération. SAFE maintient ce journal de façon structurée.",
    });
  }

  if (province === "QC") {
    items.push({
      reference: "B-1, r.5, art. 35",
      sujet: "Remise en temps utile des sommes détenues",
      statut: "À surveiller",
      description: "Les sommes détenues pour le compte d'un client doivent être remises sans délai injustifié. SAFE alerte en cas de séjour prolongé non justifié.",
    });
  }

  items.push({
    reference: "Loi sur le Barreau, art. 196",
    sujet: "Facturation conforme et traçabilité des honoraires",
    statut: "Couvert par SAFE",
    description: "Les honoraires doivent être documentés de façon à permettre la vérification. SAFE génère des factures numérotées sans trou et conserve l'historique.",
  });

  return items;
}

export function buildOpportunites(a: Answers): AuditReport["opportunites"] {
  const opps: AuditReport["opportunites"] = [];
  const heures = str(a.heures_admin);
  const fidei = str(a.fideicommis_usage);
  const delai = str(a.delai_paiement);
  const satisfaction = num(a.satisfaction);

  if (["6_10", "gt10"].includes(heures)) {
    opps.push({
      titre: "Récupérez vos heures non facturables",
      description: "Automatiser la facturation, le suivi et la conciliation libère plusieurs heures par semaine que vous pouvez consacrer à vos dossiers.",
    });
  }

  if (["gt60", "31_60", "inconnu"].includes(delai)) {
    opps.push({
      titre: "Accélérez vos encaissements",
      description: "Le paiement en ligne et les rappels automatiques réduisent votre délai de règlement de moitié selon les données Clio.",
    });
  }

  if (["actif", "peu"].includes(fidei)) {
    opps.push({
      titre: "Sécurisez votre fidéicommis sans effort",
      description: "Un module dédié assure la conciliation mensuelle conforme au B-1, r.5 sans manipulation manuelle ni risque d'écart.",
    });
  }

  if (satisfaction > 0 && satisfaction <= 6) {
    opps.push({
      titre: "Simplifiez votre quotidien avec un seul outil",
      description: "Remplacer un logiciel sous-optimal par une solution conçue pour votre réalité réduit les doubles saisies et les risques d'erreur.",
    });
  }

  // Fallbacks contextuels — chaque option ne s'ajoute qu'une fois et selon le profil
  const nb = str(a.nb_utilisateurs);
  const dossiers = str(a.dossiers_actifs);
  const logiciel = str(a.logiciel_actuel);

  if (opps.length < 4 && ["2", "3plus"].includes(nb)) {
    opps.push({
      titre: "Coordonnez votre équipe sans friction",
      description: "Gestion des rôles, journal d'audit partagé et visibilité commune sur les dossiers et les comptes à recevoir.",
    });
  }

  if (opps.length < 4 && ["31_75", "76_150", "gt150"].includes(dossiers)) {
    opps.push({
      titre: "Pilotez votre performance par dossier",
      description: "Tableau de bord avec rentabilité par dossier, taux de réalisation et alertes sur les dossiers à risque.",
    });
  }

  if (opps.length < 4 && logiciel !== "aucun") {
    opps.push({
      titre: "Migrez sans perdre vos données",
      description: `Votre historique depuis ${logicielLabel(logiciel)} est importé intégralement. Vos clients et dossiers sont disponibles dès le premier jour.`,
    });
  }

  if (opps.length < 4) {
    opps.push({
      titre: "Centralisez facturation, comptes et fidéicommis",
      description: "Un seul outil pour la facturation, le suivi des créances, la comptabilité et le fidéicommis, conforme Barreau.",
    });
  }

  return opps.slice(0, 4);
}

export function buildMarche(a: Answers): AuditReport["marche"] {
  const fidei = str(a.fideicommis_usage);
  const nb = str(a.nb_utilisateurs);
  const nbUsers = nb === "3plus" ? 3 : nb === "2" ? 2 : 1;
  const hasTrust = ["actif", "peu"].includes(fidei);

  const logiciel = str(a.logiciel_actuel);
  const logicielNom = ["clio","pclaw","jurisevolution","jurisconcept"].includes(logiciel)
    ? logicielLabel(logiciel)
    : "Clio ou PCLaw";
  const gestionDetail = `${logicielNom}, ${nbUsers} utilisateur${nbUsers > 1 ? "s" : ""}`;

  const lignes: AuditReport["marche"] = [
    {
      composant: "Gestion de cabinet",
      detail: gestionDetail,
      mensuel: BENCHMARKS.prixGestionCabinet.valeur * nbUsers,
      source: BENCHMARKS.prixGestionCabinet.source,
    },
    {
      composant: "Comptabilité",
      detail: "QuickBooks Online Plus avec synchronisation",
      mensuel: BENCHMARKS.prixComptabilite.valeur,
      source: BENCHMARKS.prixComptabilite.source,
    },
  ];

  if (hasTrust) {
    lignes.push({
      composant: "Traitement de paiement et fidéicommis",
      detail: "LawPay ou équivalent",
      mensuel: BENCHMARKS.prixTraitementPaiement.valeur,
      source: BENCHMARKS.prixTraitementPaiement.source,
    });
  }

  lignes.push({
    composant: "Implantation et formation (an 1)",
    detail: "Étalé sur 12 mois",
    mensuel: BENCHMARKS.prixImplantation.valeur,
    source: BENCHMARKS.prixImplantation.source,
  });

  return lignes;
}

export function buildOffre(a: Answers): AuditReport["offre"] {
  const nb = str(a.nb_utilisateurs);
  const dossiers = str(a.dossiers_actifs);
  const isSolo = nb === "1";
  const isSmall = ["lt10", "10_30"].includes(dossiers);

  const plans: AuditReport["offre"]["plans"] = [
    {
      nom: "Solo",
      prix: 99,
      periode: "mois · 1 utilisateur",
      recommande: isSolo,
      description: "Pour l'avocat indépendant qui veut professionnaliser son cabinet sans embaucher.",
      features: [
        "Facturation intelligente (horaire, forfait, mixte)",
        "Fidéicommis conforme Barreau du Québec (B-1, r.5)",
        "Conciliation bancaire automatisée",
        "Suivi des comptes à recevoir en temps réel",
        "Portail client sécurisé",
        "Accès mobile complet",
        "Mise en place offerte + formation 1 h",
      ],
    },
    {
      nom: "Cabinet",
      prix: 149,
      periode: "mois · jusqu'à 3 utilisateurs",
      recommande: !isSolo && isSmall,
      description: "Pour le cabinet avec une équipe à coordonner et une structure à consolider.",
      features: [
        "Tout ce qui est inclus dans Solo",
        "Gestion des rôles et permissions",
        "Journal d'audit complet (traçabilité Barreau)",
        "Reporting mensuel automatique",
        "Support prioritaire (réponse sous 4 h)",
        "Onboarding personnalisé (3 h en 2 sessions)",
      ],
    },
    {
      nom: "Cabinet+",
      prix: null,
      periode: "Sur mesure",
      recommande: !isSolo && !isSmall,
      description: "Pour le cabinet établi avec une équipe et des besoins d'intégration avancés.",
      features: [
        "Tout ce qui est inclus dans Cabinet",
        "Utilisateurs supplémentaires au besoin",
        "Intégration QuickBooks / Sage bidirectionnelle",
        "Rapports de performance avancés",
        "Gestionnaire de compte dédié",
        "Migration de données incluse",
      ],
    },
  ];

  const recPlan = plans.find((p) => p.recommande);

  const pourquoi = isSolo
    ? `Vous avez 1 utilisateur et ${activeCasesLabel(a.dossiers_actifs).toLowerCase()}. Le plan Solo couvre intégralement vos besoins à un coût minimal.`
    : isSmall
      ? `Votre équipe de ${nb} utilisateurs bénéficiera des fonctions de coordination et du journal d'audit du plan Cabinet.`
      : "Votre volume de dossiers et votre équipe justifient une configuration sur mesure avec intégration comptable avancée.";

  return {
    plans,
    pourquoi: recPlan ? pourquoi : "",
    garanties: [
      { titre: "Essai 30 jours sans engagement", detail: "Testez SAFE sans carte de crédit. Annulation en un clic." },
      { titre: "Migration assistée offerte", detail: "Notre équipe transfère vos données existantes sans frais supplémentaires." },
      { titre: "Conformité Barreau garantie", detail: "Chaque mise à jour intègre les exigences réglementaires du Barreau du Québec et de LSO." },
    ],
  };
}

export function buildEtapes(a: Answers): AuditReport["etapes"] {
  const heures = str(a.heures_admin);
  const delai = str(a.delai_paiement);
  const fidei = str(a.fideicommis_usage);
  const nb = str(a.nb_utilisateurs);
  const logiciel = str(a.logiciel_actuel);
  const dossiers = str(a.dossiers_actifs);
  const nbUsers = nb === "3plus" ? 3 : nb === "2" ? 2 : 1;
  const automatisation = str(a.automatisation_reve);
  const gestionFact = str(a.gestion_facturation);
  const visibilite = str(a.visibilite_creances);

  // Étape 1 : cibler les problèmes spécifiques du cabinet
  const pains: string[] = [];
  if (["6_10", "gt10"].includes(heures) || gestionFact === "personne") pains.push("la charge administrative");
  if (["gt60", "inconnu"].includes(delai) || visibilite === "non") pains.push("le délai de règlement");
  if (["actif", "peu"].includes(fidei)) pains.push("la gestion du fidéicommis");
  if (["31_75", "76_150", "gt150"].includes(dossiers)) pains.push("le suivi de vos dossiers");

  const etape1 = pains.length > 0
    ? `Nous vous montrons concrètement comment SAFE résout ${pains.slice(0, 2).join(" et ")} dans votre cabinet, en 30 minutes. Aucune préparation requise.`
    : "Un membre de notre équipe vous présente SAFE adapté à votre profil en 30 minutes. Aucune préparation requise.";

  // Étape 2 : migration depuis l'outil actuel ou démarrage neuf
  const hasPriorTool = !["aucun", ""].includes(logiciel);
  const equipeNote = nbUsers > 1 ? ` Votre équipe de ${nbUsers} utilisateurs est formée en une session.` : "";
  const etape2 = hasPriorTool
    ? `Votre compte est configuré selon votre profil. Nous importons vos données depuis ${logicielLabel(logiciel)} et vous êtes opérationnel en 48 heures.${equipeNote}`
    : `Votre compte est prêt en 48 heures, sans historique à migrer. L'interface est configurée pour votre type de pratique.${equipeNote}`;

  // Étape 3 : modules actifs dès le départ selon le profil
  const modules: string[] = [];
  if (["actif", "peu"].includes(fidei)) modules.push("conciliation fidéicommis");
  if (["gt60", "31_60", "inconnu"].includes(delai)) modules.push("suivi des créances");
  if (["6_10", "gt10"].includes(heures)) modules.push("facturation automatisée");
  if (modules.length === 0) modules.push("facturation", "suivi des créances");

  const etape3Base = `${modules.slice(0, 2).map(m => m.charAt(0).toUpperCase() + m.slice(1)).join(", ")} et tous vos modules sont actifs dès le premier jour.`;
  const etape3Suffix = automatisation
    ? ` Vous souhaitez automatiser : ${automatisation.charAt(0).toLowerCase()}${automatisation.slice(1).replace(/\.$/, "")}. C'est couvert.`
    : " Notre équipe reste disponible pour toute question.";
  const etape3 = etape3Base + etape3Suffix;

  return [
    { titre: "Réserver une démo personnalisée", description: etape1 },
    { titre: "Décider et migrer en 48 heures",   description: etape2 },
    { titre: "Opérer avec SAFE dès la première semaine", description: etape3 },
  ];
}

export function buildAnnexe(a: Answers): AuditReport["annexe"] {
  const sections: AuditReport["annexe"] = [
    {
      numero: "1",
      titre: "Le cabinet",
      reponses: [
        { code: "raison_sociale",   question: "Raison sociale",               reponse: str(a.raison_sociale) },
        { code: "localisation",     question: "Localisation",                 reponse: `${nestedStr(a, "localisation", "ville")}, ${nestedStr(a, "localisation", "province")}` },
        { code: "forme_juridique",  question: "Forme juridique",              reponse: formeLabel(a.forme_juridique) },
        { code: "annees_pratique",  question: "Ancienneté de pratique",       reponse: ancienneteLabel(a.annees_pratique) },
      ].filter((r) => r.reponse && r.reponse !== "Non précisé"),
    },
    {
      numero: "2",
      titre: "Équipe",
      reponses: [
        { code: "nb_utilisateurs",      question: "Utilisateurs SAFE",            reponse: str(a.nb_utilisateurs) === "3plus" ? "3 ou plus" : str(a.nb_utilisateurs) || "1" },
        { code: "adjoint_statut",       question: "Adjoint(e)",                   reponse: adjointLabel(a.adjoint_statut) },
        { code: "comptable_statut",     question: "Teneur de livres",             reponse: comptableLabel(a.comptable_statut) },
        { code: "gestion_facturation",  question: "Responsable facturation",      reponse: gestionFacturationLabel(a.gestion_facturation) },
        { code: "utilisateur_principal",question: "Utilisateur principal SAFE",   reponse: str(a.utilisateur_principal) === "moi" ? "Le praticien" : str(a.utilisateur_principal) === "adjoint" ? "L'adjoint(e)" : str(a.utilisateur_principal) === "comptable" ? "Teneur de livres" : str(a.utilisateur_principal) === "mix" ? "Plusieurs personnes" : str(a.utilisateur_principal) || "" },
      ].filter((r) => r.reponse && r.reponse !== "Non précisé"),
    },
    {
      numero: "3",
      titre: "Pratique",
      reponses: [
        { code: "domaines_pratique", question: "Domaines de pratique",        reponse: str(a.domaines_pratique || a.domaines) },
        { code: "dossiers_actifs",   question: "Dossiers actifs",             reponse: activeCasesLabel(a.dossiers_actifs) },
        { code: "evolution",         question: "Évolution (12 mois)",         reponse: evolutionLabel(a.evolution) },
        { code: "mode_facturation",  question: "Mode de facturation",         reponse: modeFacturationLabel(a.mode_facturation) },
        { code: "taux_horaire",      question: "Fourchette de taux horaire",  reponse: tauxHoraireLabel(a.taux_horaire) },
        { code: "fideicommis_usage", question: "Compte en fidéicommis",       reponse: fideicommisLabel(a.fideicommis_usage) },
        { code: "aide_juridique",    question: "Aide juridique",              reponse: str(a.aide_juridique) === "reg" ? "Oui, régulièrement" : str(a.aide_juridique) === "occ" ? "Oui, occasionnellement" : str(a.aide_juridique) === "non" ? "Non" : "" },
      ].filter((r) => r.reponse && r.reponse !== "Non précisé"),
    },
    {
      numero: "4",
      titre: "Outils et temps",
      reponses: [
        { code: "logiciel_actuel",     question: "Logiciel actuel",             reponse: logicielLabel(a.logiciel_actuel) },
        { code: "satisfaction",        question: "Satisfaction (sur 10)",       reponse: str(a.satisfaction) ? `${str(a.satisfaction)} / 10` : "" },
        { code: "visibilite_creances", question: "Visibilité sur créances",     reponse: visibiliteCreancesLabel(a.visibilite_creances) },
        { code: "heures_admin",        question: "Heures admin / semaine",      reponse: heuresAdminLabel(a.heures_admin) },
        { code: "delai_paiement",      question: "Délai de règlement",          reponse: delaiPaiementLabel(a.delai_paiement) },
        { code: "urgence",             question: "Niveau d'urgence",            reponse: urgenceLabel(a.urgence) },
        { code: "automatisation_reve", question: "Automatisation souhaitée",    reponse: str(a.automatisation_reve) },
      ].filter((r) => r.reponse && r.reponse !== "Non précisé"),
    },
  ];

  return sections.filter((s) => s.reponses.length > 0);
}
