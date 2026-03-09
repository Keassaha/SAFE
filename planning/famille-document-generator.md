# Générateur de documents — Droit familial québécois

## Contexte et opportunité

Le droit familial au Québec exige **au moins 124 types de documents distincts** (demandes introductives, formulaires obligatoires, calculs de pensions, partage de patrimoine, formulaires TUF). Aucun outil natif IA n’existe pour cette juridiction. L’écosystème actuel (JurisÉvolution, JuriFamille, CAIJ) reste fragmenté et la production repose largement sur l’assemblage manuel. Le Barreau du Québec a publié en **octobre 2024** un guide sur l’IA générative qui encourage une utilisation responsable sous réserve de révision humaine, consentement client et hébergement des données au Canada.

## Architecture cible : hybride template + IA

Trois couches :

1. **Moteur de templates**  
   Les 124 types de documents sont définis par des squelettes (sections obligatoires, mentions légales, logique conditionnelle selon régime matrimonial, garde, district). Les citations et formulaires officiels sont pré-remplis ; les variables québécoises (régime, type de garde, nombre d’enfants, district) pilotent les blocs affichés.

2. **Couche IA (Claude API)**  
   - Rédaction des parties narratives (motifs, résumés de faits, justifications de dérogation aux lignes directrices).  
   - Adaptation au contexte du dossier et du client.  
   - Génération bilingue (français juridique québécois / anglais droit civil québécois), en s’appuyant sur les terminologies officielles (CCQ bilingue).  
   - Température **0** (ou proche de 0).  
   - Prompts structurés en XML (contexte, client_data, template_sections).  
   - Champs de formulaires standardisés (ex. Annexe I) fournis en JSON structuré pour remplir les lignes prévues par le formulaire.

3. **Couche de validation**  
   - Vérification des citations et renvois aux articles.  
   - Contrôle de cohérence avec le CCQ / CPC.  
   - Pour les pensions : vérification des montants par rapport à la Table de fixation (et, à terme, intégration JuriFamille).  
   - **Révision humaine obligatoire** avant envoi au client ou dépôt au tribunal.  
   - Traçabilité : quel outil IA a été utilisé, quelles sorties ont été modifiées.

## Conformité et sécurité (non négociable)

- **Révision humaine obligatoire** avant toute utilisation du document (client / tribunal).  
- **Vérification des citations** : chaque référence juridique doit être vérifiable ; marqueur `[VERIFY]` en cas de doute.  
- **Filtre de juridiction** : pas de mélange common law / droit civil (risque bijuridique Canada).  
- **Disclaimer** sur tout document généré avec IA :  
  *« Ce document a été préparé avec l’assistance d’outils d’intelligence artificielle et doit être révisé par un professionnel du droit avant toute utilisation. »*  
- **Données** : pas de rétention côté API (config zero-data-retention), hébergement au Canada (idéalement Québec).  
- **Loi 25** : respect des obligations sur les renseignements personnels.  
- **Audit** : enregistrement des outils IA utilisés et des modifications apportées aux sorties (audit trail).  
- Alignement avec le **guide du Barreau (oct. 2024)** : compétence, confidentialité, vérification, transparence, traçabilité.

## Formulaires et références clés

- **RCSMF** : Formulaires I à VIII (demande divorce, certificat naissance, état revenus/dépenses/bilan, psychosocial IV–VI, jugement divorce VII, certificat divorce VIII).  
- **Annexe I** : Formulaire de fixation des pensions alimentaires pour enfants (7 pages, 9 parties ; logiciel autorisé : JuriFamille ou AliForm ; le calculateur en ligne ne peut pas remplacer le formulaire officiel).  
- **Formulaire III** : État des revenus, dépenses et bilan (pension entre ex-conjoints).  
- **TUF (depuis 30 juin 2025)** : SJ-1326 à SJ-1333 (union parentale, dissolution union civile, etc.).  
- **District de Montréal** : formats Excel obligatoires pour patrimoine familial et société d’acquêts.

## Priorités de développement (MVP)

1. **Formulaire I** — Demande en divorce (contestée).  
2. **Annexe I** — Fixation pensions alimentaires enfants (structure + pré-remplissage ; calculs via JuriFamille ou intégration future).  
3. **Formulaire III** — Revenus / dépenses / bilan (pension conjoint).  
4. **Demandes en mesures provisoires** (CPC art. 409–414).  
5. **Plans parentaux** (pas de formulaire standard ; fortement encouragés Divorce Act s. 7.1–7.5, CCQ art. 605).  
6. **Ententes de consentement** / consentement à jugement.  
7. **Mises en demeure** (pré-contentieux, pas de formulaire officiel).  
8. **Formulaires TUF** (SJ-1326 à SJ-1333).

## Structure technique (SAFE)

- **Taxonomie** : `lib/documents/famille/taxonomy.ts` — 16 catégories, 124 types (code, nom FR/EN, base légale, formulaire standard oui/non).  
- **Types et constantes** : contexte juridiction, données client/dossier, options de génération, disclaimer.  
- **Prompts** : modèles système + XML pour Claude (juridiction, type de document, loi applicable, client_data, template_sections).  
- **Génération** : module `lib/documents/famille/generate.ts` (orchestration template + appels API, température 0).  
- **Schéma Prisma** : champs optionnels sur `Document` pour `templateCode`, `aiAssisted`, `reviewedAt`, `reviewedById`.  
- **API** : route ou Server Action « générer un document » à partir d’un type de la taxonomie et du contexte dossier/client.

## Références

- Barreau du Québec, *L’intelligence artificielle générative – Guide pratique pour une utilisation responsable*, octobre 2024.  
- Stanford/Wiley (2025) : précision des outils juridiques IA (RAG ne supprime pas les hallucinations).  
- CCQ, CPC, Divorce Act, RCSMF, Règlement sur la fixation des pensions alimentaires pour enfants (RLRQ c. C-25.01, r. 12).  
- Tribunal unifié de la famille (TUF) — entrée en vigueur 30 juin 2025.
