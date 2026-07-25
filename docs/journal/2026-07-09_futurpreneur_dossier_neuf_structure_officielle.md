# 2026-07-09 — Dossier Futurpreneur reconstruit sur la structure officielle (v5)

## Contexte
Suite du rafraîchissement du matin (v4). Décision CEO : bâtir un dossier Futurpreneur neuf, plus fort et plus pertinent, en mobilisant toutes les infos réelles du projet. Recherche exhaustive lancée en fan-out (4 agents parallèles) : repo produit, dossier d'entreprise (~/Desktop/SAFE Inc.), pipeline de delivery + client pilote, exigences officielles Futurpreneur/BDC 2026.

## Découvertes clés de la recherche
**Exigences officielles Futurpreneur (vérifiées sur futurpreneur.ca, 2026-07-09)**
- Programme « Core Startup ». Prêt Futurpreneur jusqu'à 25 000$ (**préférentiel CIBC + 3%**, ~7,45%, plafond 9%). Portion BDC jusqu'à 50 000$ (**taux de base BDC + 1,65%**, ~7,7%, PAS préférentiel+3%). Total 75 000$. Intérêts seulement l'an 1, amortissement 5 ans, **sans garantie**. Frais : Futurpreneur 1% + BDC 50$. Mentorat 2 ans indissociable, jumelé après approbation.
- Admissibilité fine : âge dossier soumis avant 40 ans; citoyen ou RP (demande RP en cours ne qualifie pas); propriété > 50%; **stade = pré-lancement avec prototype démontrable, pas R&D pure** (le SaaS logiciel est admissible). Taxes à jour.
- **Structure officielle = Focused Business Plan, 5 parties / 20 sous-sections** : Profil entreprise / Étude de marché / Marketing-Vente / Opérations / Financier. Pas de résumé exécutif ni d'annexes.
- Financier dans le **gabarit de trésorerie officiel** (Excel), 24 mois mois par mois, « réaliste, pas optimiste, modéliser un pire scénario ». Ossature : Achats passés → Coûts de démarrage → Flux An 1 → Flux An 2 → État des résultats.
- Erreur de rejet #1 : prévisions financières faibles ou absentes.
- Cumul : Futurpreneur est un prêt, se cumule librement, ne réduit ni les subventions ni RS&DE.

**Faits réels mobilisés (preuves pour un funder)**
- Produit fonctionnel : 679 tests verts, build prod, conformité Barreau en dur (fidéicommis 3 voies + blocage solde négatif, plafond espèces 7 500$, numérotation sans trou, journal append-only).
- Base de connaissances proprietaire : 46 fichiers, ~12 000 lignes, 2 provinces, 22 scénarios comptables.
- Client pilote Derisier (ON) : Phases 1-2 complétées (audit + spec, 27 besoins), Phase 3 en activation. **ROI mesuré : 114 h → 29,5 h/mois d'administratif, soit 84,5 h et ~4 225$/mois économisés.**
- 2e cabinet démo (Cayard, QC) : 36/36 tests conformité. Dog-food SAFE Inc. sur SAFE.
- Fondateur : ~6 ans compta/opérations, DEC + certificat compta + BAA en cours + QuickBooks Pro Advisor.
- **7 programmes de financement non dilutif déjà en demande** (RS&DE, IRAP/PARI, MEIE, ESSOR, Scale AI, PROMPT, RAII/DEC).

## Buildé
Nouveau script `generate_bp_v5.py` (remplace v4) qui régénère les 3 PDF du dossier, calés sur la structure officielle Futurpreneur :
- **01_Guide_Checklist** : admissibilité vérifiée point par point, financement (taux corrigés), documents exigés officiels, structure de plan attendue, étapes de soumission réelles (plan préliminaire → analyste → mentor après approbation), financements complémentaires cumulables, priorités de l'analyste.
- **02_Plan_Affaires** (8 pages) : 5 parties officielles. Section « Progrès à ce jour » (1.4) chargée de preuves vérifiables. SWOT concurrentiel. Objectifs S.M.A.R.T. alignés sur le scénario Base.
- **03_Previsions_Tresorerie** (5 pages) : format gabarit Futurpreneur (Achats passés → Coûts démarrage → Flux An 1 → Flux An 2 → État des résultats). **Intérêts et remboursement du capital séparés** (état des résultats juste). Taux corrigés.

## Chiffres figés (scénario Base, taux corrigés)
- Financement 75 000$. Intérêts an 1 ~480$/mois; an 2 intérêts ~400$/mois + capital ~1 562$/mois.
- 18 clients payants / 2 160$ MRR fin an 1; 55 clients / 6 750$ MRR (~81k ARR) fin an 2.
- Résultat net : an 1 ~-9 470$; **an 2 rentable en P&L ~+25 920$** (le remboursement du capital 18 744$ est une sortie de financement, pas une charge).
- Trésorerie toujours positive, creux ~51 500$ au mois 16.

## Reste à faire (dossier)
- Confirmer taxes à jour (admissibilité).
- Fournir : pièce d'identité, carte RP, captures/vidéo de démo.
- Faire signer la lettre d'intention Me Derisier (05).
- **Documenter l'apport personnel du fondateur** (temps + argent investis depuis août 2025) : demandé par un funder, actuellement non chiffré (placeholder dans 03, section 1).
- Idéalement : soumettre le plan préliminaire pour bénéficier de l'aide de finalisation.

## À réconcilier (hors 06-Futurpreneur)
Le dossier `~/Desktop/SAFE Inc./04 - Financier` contient encore d'anciennes projections ambitieuses (120 clients / 300k ARR) qui contredisent le scénario Base. À uniformiser si ces documents servent ailleurs (subventions).

## Idées à propager (content-bank / posts)
- « J'ai fait économiser 84 heures par mois à un cabinet » (preuve terrain chiffrée, angle build-in-public le plus fort).
- « Pourquoi mon plan de financement modélise un pire scénario » (crédibilité vs projections gonflées).

## Mise à jour même journée (corrections CEO + livrables MD)
- Deux documents markdown livrés dans le dossier Futurpreneur : `00_DOSSIER_FUTURPRENEUR_SYNTHESE.md` (tableau de bord) et `DOSSIER_COMPLET_FUTURPRENEUR.md` (contenu intégral copiable dans le Business Plan Writer + gabarit trésorerie).
- Corrections CEO intégrées (script v5 + les 2 MD régénérés) : **adresse** = 460 Chemin Fraser, Gatineau (Aylmer), J9H 2H1 (code postal à confirmer sur Postes Canada pour le civique exact ; ancien = 832 Maloney, le CV 04 reste à corriger) ; **taxes à jour / aucun litige** confirmé ; autorisation de crédit sera signée ; **posture sans embauche** (rester lean, embauche ou sous-traitance seulement si la croissance l'exige, la ligne BDC devient une réserve).
- Décision produit : nommer le flagship **SAFE cabinet** (avocats) et présenter **SAFE autonome** (travailleurs autonomes) comme extension roadmap. Voir [[project_safe_autonome_gamme]].
