import type { AuditReport } from "@/types/audit-report";
import { computeCout, computeScore } from "./compute";
import {
  buildCabinet,
  buildDrivers,
  buildRisques,
  buildBarreau,
  buildOpportunites,
  buildMarche,
  buildOffre,
  buildEtapes,
  buildAnnexe,
} from "./rules";

const ANSWERS = {
  // Section 1 — Cabinet
  raison_sociale: "Cabinet Marchand",
  "localisation.ville": "Gatineau",
  "localisation.province": "QC",
  forme_juridique: "individuelle",

  // Section 2 — Identité & équipe
  "identite.nom_complet": "Julien Marchand",
  "identite.titre": "Avocat",
  annees_pratique: "lt2",
  nb_utilisateurs: "1",

  // Section 3 — Organisation
  gestion_facturation: "moi",
  gestion_fideicommis: "moi",
  adjoint_statut: "non",
  comptable_statut: "moi",
  utilisateur_principal: "moi",
  autres_roles: [],

  // Section 4 — Pratique
  domaines_pratique: "Immigration, Famille, Civil",
  dossiers_actifs: "lt10",
  nouveaux_mois: "lt5",
  mode_facturation: "horaire",
  taux_horaire: "150_250",
  type_clientele: "particuliers",
  aide_juridique: "non",
  fideicommis_usage: "actif",
  evolution: "moderee",

  // Section 5 — Outils
  logiciel_actuel: "jurisconcept",
  satisfaction: 4,
  frustrations: ["facturation", "impayes", "fideicommis"],

  // Section 6 — Temps / ROI
  heures_admin: "6_10",
  visibilite_creances: "non",
  delai_paiement: "gt60",
  urgence: "important",
  automatisation_reve: "La conciliation du fidéicommis chaque mois et le suivi des factures impayées.",
};

function buildExampleReport(): AuditReport {
  const risques = buildRisques(ANSWERS);
  const score = computeScore(risques);
  const marche = buildMarche(ANSWERS);
  const offre = buildOffre(ANSWERS);

  const cout = computeCout({
    heuresAdminDeclarees: { min: 6, max: 10 },
    fourchetteTaux: { min: 150, max: 250 },
    delaiReglementDeclare: 75,
    tauxRecuperation: 0.6,
    semainesFacturables: 46,
    casClientDelaiSafe: null,
    valeurAffichee: "nette",
  });

  return {
    meta: {
      ref: "A 2026 0608 MAR",
      date: "8 juin 2026",
      confidentiel: true,
    },
    cabinet: buildCabinet(ANSWERS),
    butAudit:
      "Cet audit a pour objectif d'identifier les points de friction dans la gestion de votre cabinet, de quantifier le temps et le revenu récupérables, et de vous proposer un plan d'action concret.",
    score,
    cout,
    drivers: buildDrivers(ANSWERS),
    risques,
    barreau: buildBarreau(ANSWERS),
    barreauDisclaimer:
      "Ce résumé a valeur informative uniquement. Il ne constitue pas un avis juridique. Les obligations en vigueur varient selon la province et l'année de pratique. Consultez votre ordre professionnel pour confirmation.",
    opportunites: buildOpportunites(ANSWERS),
    marche,
    offre,
    etapes: buildEtapes(ANSWERS),
    citationFondateur:
      "Nous avons conçu SAFE parce que les avocats méritent un outil aussi rigoureux qu'eux. Chaque fonctionnalité répond à une exigence réelle du Barreau ou à une heure perdue dans un cabinet que nous avons rencontrée.",
    annexe: buildAnnexe(ANSWERS),
  };
}

export const exampleReport: AuditReport = buildExampleReport();
export { ANSWERS as exampleAnswers };
