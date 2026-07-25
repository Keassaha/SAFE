# Direction unifiée de la landing SAFE inspirée par Linear

Date: 2026-07-23  
Statut: document maître de conception, brouillon de travail  
Portée: landing publique de SAFE, ordinateur et mobile  

## 0. Rôle de ce document

Ce document fusionne et arbitre les deux références suivantes:

1. `docs/product/PLAN_REFONTE_LANDING_2026.md`
2. `docs/research/ANALYSE_LINEAR_SITE_DESIGN_2026-07-23.md`

Les deux fichiers sources restent intacts. Le présent document devient la référence courte et
actionnable pour concevoir la prochaine ébauche de la landing SAFE.

Il ne demande pas de copier Linear. Il distingue trois couches:

- l'identité, la voix et l'offre restent celles de SAFE;
- la discipline de composition peut s'inspirer de Linear;
- les contenus, preuves et scènes produit doivent venir du vrai produit SAFE.

## 1. Décision directrice

La landing doit exprimer un **calme opérationnel**.

SAFE doit paraître:

- précis;
- crédible;
- humain;
- juridiquement sérieux;
- techniquement maîtrisé;
- facile à comprendre avant d'être spectaculaire.

La leçon principale de Linear n'est pas sa couleur noire, sa police ou ses boutons. C'est la
cohérence entre une promesse courte, un système visuel discipliné et une démonstration crédible du
produit.

La formule de travail est donc:

> Identité SAFE + discipline narrative de Linear + preuves réelles du produit.

## 2. Contraintes non négociables de SAFE

### 2.1 Marque

La refonte ne remplace pas la marque actuelle.

- Logo: Le Chevron.
- Mot-symbole: SAFE.
- Voix: vouvoiement systématique.
- Français québécois.
- Ton calme, direct et noble.
- Aucun tiret long en milieu de phrase.
- Aucun jargon de type « plateforme », « workflow » ou « solution ».
- Aucun faux témoignage, faux logo ou chiffre invérifiable.

### 2.2 Couleurs de la landing

La landing conserve le système clair verdâtre de SAFE:

| Rôle | Valeur SAFE |
|---|---|
| Canevas | `#EFF2ED` |
| Surface | `#FBFCFA` |
| Encre principale | `#1F2A24` |
| Texte secondaire | `#5A665F` |
| Texte très atténué | `#7C877F` |
| Vert d'action | `#12A150` |
| Vert vérifié | `#2E7D5B` |
| Vert forêt de marque | `#1F3A2E` |
| Ambre d'attention | `#B07A1C` |

Règle centrale:

> Une seule couleur doit vivre, le vert. Elle est réservée aux actions, aux validations et aux
> informations positives.

La landing ne devient donc pas noire et n'adopte pas le violet de Linear.

### 2.3 Typographie

La refonte conserve les trois familles SAFE:

| Usage | Police |
|---|---|
| Titres, grands chiffres, numéros de section | Instrument Serif |
| Corps, navigation, interface | Geist Sans |
| Montants, dates, références | Geist Mono |

Règles:

- Instrument Serif ne descend pas sous `20px`;
- l'italique sert seulement à un accent éditorial;
- les montants utilisent des chiffres tabulaires;
- les petits libellés utilisent Geist Sans;
- les références de facture et données produit peuvent utiliser Geist Mono.

La typographie de Linear n'est pas reprise. Son principe de contraste d'échelle est adapté aux
polices SAFE.

## 3. Ce que SAFE emprunte à Linear

### 3.1 Hiérarchie avant décoration

Chaque section doit avoir un objectif unique et une lecture évidente:

1. idée;
2. preuve;
3. action éventuelle.

Les contrastes viennent d'abord de:

- l'échelle typographique;
- l'espace;
- l'alignement;
- les changements de surface;
- les filets.

Les halos, grains et animations ne peuvent jamais compenser une hiérarchie faible.

### 3.2 Le produit comme preuve

SAFE ne doit pas seulement déclarer qu'il remet un cabinet en ordre. La landing doit le montrer.

Les scènes produit doivent employer:

- des libellés québécois crédibles;
- des montants cohérents;
- des statuts réels;
- des dates plausibles;
- des références de dossiers et de factures;
- des états de fidéicommis conformes au fonctionnement réel.

La démonstration peut combiner:

- captures réelles;
- compositions DOM inspirées de l'interface;
- recadrages lisibles;
- détails agrandis.

Elle ne doit pas inventer une fausse interface plus avancée que le produit.

### 3.3 Une grille narrative répétable

Les grandes démonstrations utilisent un contrat constant:

- titre ou numéro à gauche;
- explication courte à droite;
- scène produit sur toute la largeur;
- résultat concret sous la scène.

La répétition crée un sentiment de système. La variété vient du contenu de chaque scène.

### 3.4 Des scènes denses dans de grands espaces

La landing doit alterner:

- de grands espaces calmes;
- des scènes produit précises et denses.

La densité est concentrée dans le logiciel. Le discours autour reste court.

### 3.5 Filets plutôt qu'ombres

Les sections et scènes sont séparées principalement par:

- des bordures de `0.5px` à `1px`;
- des variations minimes de surface;
- des retraits;
- des rayons cohérents.

Les ombres restent rares. Une scène produit majeure peut recevoir une ombre douce teintée forêt:

`0 40px 80px -44px rgba(11,31,25,.5)`.

### 3.6 Responsive par re-priorisation

La version mobile n'est pas une miniature.

Elle doit:

- montrer la preuve produit avant les longues explications;
- ramener les informations essentielles près du titre;
- recadrer les scènes au lieu de les réduire jusqu'à l'illisibilité;
- transformer les grilles en séquences;
- garder un CTA principal clair.

## 4. Ce que SAFE ne reprend pas de Linear

- Le fond noir presque absolu.
- L'accent violet.
- Inter comme police de marque.
- Berkeley Mono comme signature.
- La terminologie d'issues, cycles et agents.
- La densité d'un outil destiné aux développeurs.
- Les scènes, illustrations et actifs visuels de Linear.
- Les preuves quantitatives de Linear.
- Une page de plus de 10 000 px sans nécessité éditoriale.
- Le hero sans CTA principal.

SAFE a un cycle d'achat plus long et une exigence de confiance plus forte. L'audit gratuit doit
donc rester visible comme prochaine étape.

## 5. Proposition de catégorie

Le hero doit nommer le résultat et la catégorie sans chiffre invérifiable.

Promesse actuelle à préserver comme base:

> Votre cabinet, toujours en ordre.

Rôle du sous-titre:

- automatiser l'administration;
- tenir le fidéicommis sans erreur;
- reprendre le contrôle des finances du cabinet.

Positionnement à développer dans le récit:

> SAFE est le copilote du copilote.

Ce positionnement ne doit pas nécessairement devenir le titre du hero. Il peut devenir le manifeste
qui explique pourquoi SAFE aide l'adjointe sans la remplacer.

## 6. Parcours principal de la landing

La landing est organisée en neuf séquences.

### 01. Hero

Objectif: installer la promesse et montrer immédiatement une preuve.

Composition recommandée:

- navigation sobre;
- grand titre Instrument Serif;
- sous-promesse courte en Geist Sans;
- CTA principal « Faire mon audit gratuit »;
- lien secondaire discret vers la vidéo ou la démo;
- grande scène réelle de SAFE sous le texte.

Le hero doit être ample, mais ne doit pas devenir vide. La première scène produit doit être visible
dans le premier écran ou commencer clairement avant son bas.

### 02. Repères de confiance

Objectif: réduire immédiatement le risque perçu.

Repères autorisés:

- Conçu au Québec;
- Conforme B-1, r.5;
- Données au Canada;
- Construit en public.

Présentation:

- une ligne sobre;
- aucune carte;
- aucun logo client fictif;
- aucun compteur.

### 03. Le coût du désordre

Objectif: nommer les pertes sans dramatisation.

Situations:

- heures non facturées;
- factures envoyées en retard;
- trésorerie immobilisée;
- rapprochements et registres difficiles à vérifier;
- échéances qui dépendent de la mémoire.

La section doit partir du vécu du cabinet, jamais d'une liste de fonctionnalités.

### 04. Le point de vue SAFE

Objectif: transformer les fonctions en philosophie de travail.

Trois principes numérotés:

1. Préparer avant que l'urgence arrive.
2. Vérifier avant que l'erreur circule.
3. Faire entrer l'argent sans perdre le contrôle.

Le « copilote du copilote » peut être développé ici:

- l'adjointe garde le jugement;
- SAFE prépare, classe et signale;
- l'avocat valide ce qui compte.

### 05. Démonstration en trois actes

Objectif: prouver que SAFE forme un système cohérent.

#### Acte 01: Tenir

Montrer:

- dossiers;
- temps;
- documents;
- échéances;
- travail préparé.

Résultat:

> Le cabinet sait ce qui doit être fait et ce qui est prêt.

#### Acte 02: Vérifier

Montrer:

- fidéicommis;
- rapprochements;
- registres;
- alertes;
- validation humaine.

Résultat:

> Les écarts sont visibles avant de devenir des problèmes.

#### Acte 03: Encaisser

Montrer:

- temps à facturer;
- facture;
- paiement;
- relance;
- solde.

Résultat:

> Le travail accompli devient plus facilement du revenu encaissé.

Chaque acte utilise une scène différente. La landing ne répète pas la même capture dans trois cadres.

### 06. La preuve de continuité

Objectif: montrer que SAFE est vivant sans inventer une traction commerciale.

Options honnêtes:

- extrait de changelog;
- dates de livraisons récentes;
- améliorations publiées;
- note de la fondatrice ou du fondateur;
- témoignage réel uniquement avec accord.

Le changelog peut être plus crédible qu'un faux mur de logos pendant le préchauffage.

### 07. Offre et prix

Objectif: rendre le prix compréhensible sans casser le parcours de confiance.

Prix publics:

- Solo: `99 $/mois`;
- Cabinet: `149 $/mois`;
- configuration incluse.

Le CTA principal demeure l'audit gratuit.

L'offre fondatrice reste distincte et honnête:

- cinq places;
- douze mois gratuits;
- tarif gelé à vie selon les conditions déjà définies.

### 08. Objections et sécurité

Objectif: répondre aux questions avant la prise de contact.

Thèmes minimum:

- sécurité des données financières;
- hébergement au Canada;
- intégration bancaire;
- fonctionnement du fidéicommis;
- migration;
- accompagnement;
- place de l'adjointe;
- conformité.

### 09. CTA final

Objectif: proposer un geste simple après la démonstration.

Action principale:

> Faire mon audit gratuit

Le bloc final doit rappeler:

- aucun engagement;
- diagnostic concret;
- prochaines étapes claires;
- signal de confiance vérifiable.

## 7. Système visuel cible

### 7.1 Grille

- Conteneur desktop recommandé: `1280px` à `1344px`.
- Retrait extérieur: `16px` à `24px`.
- Grille narrative principale: deux colonnes équilibrées.
- Largeur de lecture du texte descriptif: environ `36ch` à `42ch`.
- Grande scène produit: largeur complète, avec débordement contrôlé si utile.

### 7.2 Espacement

Rythme indicatif à valider dans le brouillon:

| Élément | Desktop | Mobile |
|---|---:|---:|
| Espacement vertical d'une grande section | `112px` à `144px` | `64px` à `88px` |
| Espace entre introduction et preuve | `72px` à `96px` | `36px` à `48px` |
| Retrait latéral | `24px` à `32px` | `16px` à `20px` |
| Espacement interne d'un panneau produit | `8px` à `12px` | `6px` à `8px` |

### 7.3 Typographie indicative

| Élément | Desktop | Mobile | Police |
|---|---:|---:|---|
| H1 | `64px` à `72px` | `40px` à `46px` | Instrument Serif |
| H2 de démonstration | `44px` à `52px` | `30px` à `36px` | Instrument Serif |
| Manifeste | `36px` à `44px` | `28px` à `34px` | Instrument Serif |
| Description majeure | `21px` à `24px` | `17px` à `19px` | Geist Sans |
| Corps | `15px` à `17px` | `15px` à `16px` | Geist Sans |
| Libellé | `12px` à `13px` | `12px` à `13px` | Geist Sans |
| Donnée produit | selon contexte | selon contexte | Geist Mono |

Ces valeurs adaptent la hiérarchie de Linear sans remplacer l'identité typographique de SAFE.

### 7.4 Formes

- Boutons: `6px` à `8px`.
- Petits contrôles: `6px` à `8px`.
- Panneaux produit internes: `8px` à `12px`.
- Grand cadre de démonstration: `16px` à `20px`.
- Pilules réservées aux statuts et petits filtres.

Éviter d'appliquer le même grand rayon à tous les éléments.

### 7.5 Mouvement

- Durées usuelles: `120ms` à `260ms`.
- Courbe recommandée: `cubic-bezier(0.16, 1, 0.3, 1)`.
- Animation réservée aux confirmations, transitions de scènes et révélations utiles.
- Respect de `prefers-reduced-motion`.
- Aucun mouvement décoratif continu sans fonction.

## 8. Règles pour les scènes produit

### 8.1 Fidélité

Une scène doit être issue:

- du produit réel;
- d'un prototype fidèle à une vue existante;
- d'une composition explicitement identifiée comme illustration.

Elle ne peut pas annoncer une capacité qui n'existe pas.

### 8.2 Lisibilité

- Ne pas réduire une capture complète jusqu'à rendre le texte illisible.
- Recadrer autour de l'action démontrée.
- Agrandir le détail important.
- Masquer progressivement les zones secondaires.
- Conserver les montants et statuts à une taille lisible.

### 8.3 Données

- Utiliser des données fictives cohérentes.
- Ne jamais exposer de données clientes.
- Garder des montants, dates et soldes compatibles entre les scènes.
- Respecter les règles du fidéicommis et de la facturation.

## 9. Adaptation mobile

Ordre recommandé d'une démonstration mobile:

1. numéro et titre;
2. résultat en une phrase;
3. scène produit recadrée;
4. explication;
5. action secondaire éventuelle.

Les informations prioritaires doivent rester visibles:

- statut;
- solde;
- échéance;
- responsable;
- prochaine action.

Les informations secondaires peuvent passer dans:

- une section repliable;
- une ligne sous le contenu;
- une vue dédiée.

## 10. Crédibilité et conformité

La landing doit rester conforme aux faits.

Interdictions:

- chiffre d'heures récupérées sans source;
- pourcentage d'automatisation inventé;
- nombre de cabinets gonflé;
- faux témoignage;
- fausse note;
- faux logo;
- fausse certification;
- promesse de conformité absolue sans qualification.

Informations sensibles:

- le fidéicommis ne transite jamais par un processeur de paiement;
- aucun numéro de Barreau ne figure sur une facture;
- une facture utilise au maximum deux couleurs;
- les données sont présentées comme hébergées au Canada seulement si l'affirmation demeure exacte;
- les références à la Loi 25, à PIPEDA et aux règlements professionnels doivent être validées.

## 11. Critères d'acceptation du premier brouillon

Le brouillon peut être présenté lorsque:

- les couleurs SAFE sont reconnaissables immédiatement;
- Instrument Serif, Geist Sans et Geist Mono sont conservées;
- le hero montre le produit;
- l'audit gratuit est l'action dominante;
- les repères de confiance sont honnêtes;
- les trois principes sont distincts;
- les trois actes racontent un parcours;
- chaque acte utilise une preuve différente;
- le vert n'est pas utilisé comme décoration généralisée;
- les ombres restent secondaires;
- le mobile est recomposé;
- aucune donnée cliente n'est visible;
- aucune promesse non vérifiée n'a été ajoutée;
- la page ne ressemble pas à un clone de Linear;
- la checklist anti-slop de `docs/design/DESIGN_HUMAIN.md` est satisfaite.

## 12. Risques à surveiller

1. Copier le noir ou le violet de Linear.
2. Confondre sobriété et manque de hiérarchie.
3. Créer une page trop longue sans progression.
4. Utiliser une seule capture partout.
5. Faire du produit le héros au lieu du client.
6. Réduire le texte produit jusqu'à l'illisibilité.
7. Mélanger la palette claire de la landing et la palette ivoire de l'application.
8. Ajouter des effets avant d'avoir stabilisé la structure.
9. Inventer une traction commerciale.
10. Présenter l'automatisation comme un remplacement de l'adjointe.

## 13. Décisions encore ouvertes

Avant l'intégration finale, confirmer:

1. le titre exact du hero;
2. la disponibilité d'un témoignage réel et de son consentement;
3. les trois scènes produit les plus crédibles;
4. le niveau de détail de l'offre fondatrice;
5. la présence d'un changelog public;
6. la place exacte de l'identité gravure sur parchemin;
7. le rôle de la vidéo dans le parcours.

Pour un premier brouillon visuel, ces décisions ne sont pas bloquantes. Des hypothèses prudentes
peuvent être utilisées et clairement signalées.

## 14. Prochaine étape

Créer une ébauche locale isolée de la landing, sans modifier la route de production.

Cette ébauche doit:

- préserver les couleurs et polices SAFE;
- traduire la structure narrative ci-dessus;
- montrer au moins le hero, les repères de confiance, les trois principes et les trois actes;
- utiliser uniquement des scènes produit sûres ou des espaces clairement marqués;
- inclure une version mobile;
- servir de support de discussion avant toute intégration.

## Sources fusionnées

1. `docs/product/PLAN_REFONTE_LANDING_2026.md`
2. `docs/research/ANALYSE_LINEAR_SITE_DESIGN_2026-07-23.md`
3. `docs/brand/SAFE_BRAND_CONTEXT.md`
4. `docs/design/DESIGN_HUMAIN.md`
5. Tokens actifs dans `app/globals.css`, `app/layout.tsx` et `tailwind.config.ts`.
