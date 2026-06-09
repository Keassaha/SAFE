import { BENCHMARKS } from "./benchmarks";
import type { AuditReport } from "@/types/audit-report";

export interface CoutInputs {
  heuresAdminDeclarees: { min: number; max: number };
  fourchetteTaux: { min: number; max: number };
  delaiReglementDeclare: number;
  tauxRecuperation?: number;
  semainesFacturables?: number;
  casClientDelaiSafe?: number | null;
  valeurAffichee?: "nette" | "brute";
}

export function computeCout(inputs: CoutInputs): AuditReport["cout"] {
  const tauxRecuperation =
    inputs.tauxRecuperation ?? BENCHMARKS.tauxRecuperationDefaut.valeur;
  const semainesFacturables =
    inputs.semainesFacturables ?? BENCHMARKS.semainesFacturables.valeur;
  const casClientDelaiSafe = inputs.casClientDelaiSafe ?? null;
  const valeurAffichee = inputs.valeurAffichee ?? "nette";

  const tauxHoraire = Math.round(
    (inputs.fourchetteTaux.min + inputs.fourchetteTaux.max) / 2
  );
  const midpointAdmin =
    (inputs.heuresAdminDeclarees.min + inputs.heuresAdminDeclarees.max) / 2;
  const heuresRecuperablesSemaine =
    Math.round(midpointAdmin * tauxRecuperation * 10) / 10;
  const valeurSemaine = Math.round(heuresRecuperablesSemaine * tauxHoraire);
  const valeurRecuperableBrute = Math.round(
    heuresRecuperablesSemaine * tauxHoraire * semainesFacturables
  );
  const valeurRecuperableNette = Math.round(
    valeurRecuperableBrute *
      BENCHMARKS.tauxRealization.valeur *
      BENCHMARKS.tauxCollection.valeur
  );
  const annuel =
    valeurAffichee === "nette" ? valeurRecuperableNette : valeurRecuperableBrute;
  const mensuel = Math.round(annuel / 12);

  const delaiMoyenCanada = BENCHMARKS.delaiCollectionCanada.valeur;
  const delaiCibleSafe =
    casClientDelaiSafe ??
    Math.round(
      delaiMoyenCanada * (1 - BENCHMARKS.accelerationPaiementEnLigne.valeur)
    );
  const delaiCibleSafeSource = casClientDelaiSafe
    ? "Cas client SAFE documenté"
    : BENCHMARKS.accelerationPaiementEnLigne.source;

  return {
    heuresAdminDeclarees: inputs.heuresAdminDeclarees,
    fourchetteTaux: inputs.fourchetteTaux,
    delaiReglementDeclare: inputs.delaiReglementDeclare,
    tauxRecuperation,
    semainesFacturables,
    casClientDelaiSafe,
    valeurAffichee,
    tauxHoraire,
    heuresRecuperablesSemaine,
    valeurSemaine,
    valeurRecuperableBrute,
    valeurRecuperableNette,
    annuel,
    mensuel,
    delaiMoyenCanada,
    delaiMoyenCanadaSource: BENCHMARKS.delaiCollectionCanada.source,
    delaiCibleSafe,
    delaiCibleSafeSource,
  };
}

export function computeScore(
  risques: AuditReport["risques"]
): AuditReport["score"] {
  const counts = { critique: 0, eleve: 0, modere: 0, faible: 0 };
  for (const r of risques) {
    if (r.niveau === "Critique") counts.critique++;
    else if (r.niveau === "Élevé") counts.eleve++;
    else if (r.niveau === "Modéré") counts.modere++;
    else if (r.niveau === "Faible") counts.faible++;
  }
  const raw =
    counts.critique * 20 +
    counts.eleve * 8 +
    counts.modere * 4 +
    counts.faible * 1;
  const valeur = Math.min(raw, 100);

  let libelle: string;
  if (valeur <= 15) libelle = "Profil sain";
  else if (valeur <= 35) libelle = "Profil attentif";
  else if (valeur <= 60) libelle = "À corriger";
  else libelle = "À sécuriser";

  return { valeur, libelle, repartition: counts };
}

export function computeMarcheTotaux(marche: AuditReport["marche"]) {
  const totalMensuel = marche.reduce((s, l) => s + l.mensuel, 0);
  return { totalMensuel, totalAnnuel: totalMensuel * 12 };
}

export function computeOffreTotaux(
  marche: AuditReport["marche"],
  plans: AuditReport["offre"]["plans"]
) {
  const { totalMensuel } = computeMarcheTotaux(marche);
  const plan = plans.find((p) => p.recommande);
  const prixRecommande = plan?.prix ?? 0;
  const economieMensuelle = totalMensuel - prixRecommande;
  const economieAnnuelle = economieMensuelle * 12;
  const reductionPct = Math.round((economieMensuelle / totalMensuel) * 100);
  return {
    totalMensuel,
    totalAnnuel: totalMensuel * 12,
    prixRecommande,
    economieMensuelle,
    economieAnnuelle,
    reductionPct,
  };
}
