# 2026-07-02 — Audit de conformité sourcé (carte des écarts)

## Méthode
3 lecteurs parallèles : (1) inventaire de la conformité dans le code, (2) obligations
Barreau QC sourcées, (3) obligations LSO Ontario sourcées. Confrontation obligation réelle
vs implémentation vs visibilité. Aucune obligation inventée ; zones non sourcées marquées.

## Constat central
Le moteur de conformité est largement construit, avec garde-fous durs (blocage dépôt
espèces, certification refusée si compte client négatif, verrouillage de période, journal
append-only, non-mélange fiducie/cabinet). Le problème n'est PAS la capacité manquante,
c'est 3 axes : socle de sourcing fragile, moteur invisible au cabinet, obligations
détectées mais pas imposées.

## Fonctionnel et solide (ne pas retoucher)
- Fidéicommis 3-voies, certification, garde-fous (`lib/services/fideicommis/*`), visible
  `/comptes/rapprochement`.
- Solde négatif bloque la certification (`reconciliation-service.ts:139-152`).
- Verrouillage de période après certification (`period-lock.ts`).
- Numérotation factures sans trou (déployé 2026-06-05).
- Journal append-only + AuditLog systématique (`lib/services/audit.ts`).

## Problème structurel n°1 : socle de sourcing troué et contradictoire
- Fichiers de référence annoncés dans l'INDEX de la KB mais ABSENTS du disque :
  `reglementation/quebec/code-deontologie.md`, `conformite/loi-25-vie-privee.md`,
  `modules-safe/fideicommis/regles-lso-ontario.md`. Liens morts.
- `~/Desktop/SAFE Inc./09 - Droit/` ne contient AUCUN texte réglementaire (guides de
  dossier seulement).
- Seule source fact-checkée sur textes primaires : `docs/accounting/RECHERCHE_COMPTA_SAFE_QC_ON.md`.
- Contradictions à trancher au profit du fact-check :
  1. Rétention générale QC : 7 ans (fact-check + Code des professions art. 91) vs 10 ans
     (`principes-fondamentaux.md`).
  2. Plafond espèces : KB « interdit en fidéicommis » vs fact-check « plafond 7500 $/mandat
     + déclaration Barreau sous 30 j (art. 71) ». Le code (`trust-transaction-service.ts:16,72`)
     implémente un BLOCAGE DUR du dépôt ≥ 7500 $ ESPECES : possiblement la MAUVAISE règle,
     et l'obligation de déclaration 30 j est absente.
  3. Délai de dépôt « jour ouvrable suivant » attribué au QC par la KB alors qu'il est ONTARIEN.
  4. Intérêts fiducie : « fonds de bien-être » (KB) vs Fonds d'études juridiques (B-1 r.10).
  5. Cadence de rapprochement QC : paliers par solde (KB, non sourcés) vs mensuel (fact-check).
- **Délai de rapprochement QC inconnu dans le code** : `lib/trust/regulator.ts:8-12` note que
  le J+25 est ontarien (By-Law 9) et « pas confirmé pour le QC », donc jamais affiché en QC.
  Le calendrier QC est flou. À confirmer avec le Barreau.

## Problème structurel n°2 : le meilleur est invisible
- Moteur readiness « jamais conforme sans preuve », 10 domaines avec evidence obligatoire
  (`lib/admin/readiness/engine.ts`, `domains/*`), RÉSERVÉ à la console interne.
- Le cabinet ne voit qu'un `/conformite` allégé à 6 vérifs (`app/api/conformite/route.ts`).
- Piste d'audit append-only jamais affichée au cabinet (pas de page `/conformite/audit`).
- Détail fiducie (30 % du score) non affiché derrière le score.

## Obligations détectées mais pas imposées (application)
- Conflits (RCNEPA) : `conflict-check-service.ts` fonctionnel mais opt-in et non bloquant.
- Fermeture de dossier : `closure-blockers.ts` existe (bloc dur si fiducie négative) mais
  aucune page ne l'affiche ni n'empêche la fermeture ; pas de vrai verrouillage.
- Rétention : policies seedées, mais AUCUN job de destruction à `retentionJusqua`.
- FINTRAC : simple flag booléen, pas de vérif du contenu, seuil 10 000 $ non codé,
  déclaration jamais générée.
- Mandats : check d'existence, pas de contenu (clause LFO, signature).
- Loi 25 : ConsentLog codé, pas de révocation auto ; NAS employé stocké en clair
  (`schema.prisma` Employee.sinNumero).

## Plan pour augmenter la conformité (ordre)
1. **Socle** : source unique = RECHERCHE_COMPTA, trancher contradictions, combler/retirer
   les liens morts, confirmer le délai QC avec le Barreau. Rien sur du sable.
2. **Visibilité** : exposer readiness 10 domaines + piste d'audit + détail fiducie au cabinet.
3. **Application** : blocages fermeture à l'écran, conflits bloquants, FINTRAC contenu,
   job de destruction rétention.
4. **Règles douteuses** : plafond espèces (scope + déclaration 30 j), chiffrer le NAS.
5. **Livrable** : dossier d'inspection exportable (le verrou).

## Zones NON SOURCÉES à confirmer avant toute promesse produit
Rapport annuel QC (RAP : contenu + délai), audit annuel CPA obligatoire QC (affirmé par 2
fiches KB, absent du fact-check), texte conflits QC (Code de déontologie absent), obligations
Loi 25 concrètes (articles, délais notification CAI), régime FINTRAC spécifique aux avocats
(CSC 2015, non traité), mention TPS/TVQ obligatoire sur facture.
