# SAFE : vision de refonte du design system

> **Statut** : proposition décisionnelle, avant implémentation  
> **Version** : 1.0  
> **Date** : 10 août 2026  
> **Portée** : intérieur de l’application, console SAFE, surfaces tactiles et documents sortants  
> **Décision attendue** : valider, corriger ou refuser la direction avant toute migration du produit

---

## 1. Résumé exécutif

SAFE ne manque pas de design. Il souffre de plusieurs systèmes partiellement superposés : deux palettes principales, deux trousses de composants, plusieurs vocabulaires de couleur, des styles historiques dans `globals.css` et des écrans qui interprètent encore librement les mêmes rôles.

La refonte proposée ne cherche pas à ajouter une nouvelle esthétique. Elle cherche à retirer les contradictions jusqu’à ce que SAFE donne une impression unique : celle d’un instrument juridique et comptable calme, précis et immédiatement lisible.

La direction porte le nom de travail **Le registre calme**.

Elle retient de Perplexity et de Codex quatre qualités d’usage :

1. un châssis visuel discret qui laisse le contenu dominer;
2. une hiérarchie typographique nette, principalement sans serif;
3. un espace négatif qui sépare les décisions sans diluer l’information;
4. des interactions sobres, rapides et prévisibles.

Elle ne reprend ni leur marque, ni leur composition exacte. SAFE conserve sa couleur forêt, sa précision comptable, son vocabulaire juridique, son logo « L’Assemblage » et ses contraintes réglementaires.

### Décision directrice

L’intérieur de SAFE devient une interface claire, mate et presque monochrome. Le vert forêt apparaît seulement pour l’action principale, la sélection active et certains repères de marque. Les statuts utilisent des teintes sémantiques discrètes, toujours doublées par un mot et une forme.

La respiration vient principalement de trois décisions :

- moins de surfaces encadrées;
- une largeur de lecture et des alignements constants;
- un contraste plus fort entre l’espace à l’intérieur d’un groupe et l’espace entre les groupes.

---

## 2. Ce que la refonte doit améliorer

Chaque décision doit produire un résultat observable.

| Besoin | Résultat attendu |
|---|---|
| Trouver une information | L’identité, le statut et le prochain geste se repèrent dans la première vue. |
| Lire un registre | Les colonnes porteuses dominent, les chiffres se comparent verticalement et les actions secondaires ne créent pas de bruit. |
| Reprendre un dossier interrompu | Le contexte, la dernière activité et la prochaine action restent accessibles sans parcourir toute la fiche. |
| Prendre une décision financière | La source, l’écart, la cause et la conséquence sont visibles dans le même champ de regard. |
| Saisir rapidement | Les libellés restent visibles, la validation arrive au bon moment et l’ordre au clavier suit l’ordre visuel. |
| Imprimer ou transmettre | Le document est composé comme une page autonome, sans dépendance à la couleur ou à une interaction. |

### Mesures cibles

- premier rendu utile sous 1 seconde;
- retour visuel à un geste sous 100 ms;
- INP au 75e centile sous 200 ms;
- une seule action principale visible par écran;
- zéro valeur de design brute dans un écran migré;
- zéro information portée par la couleur seule;
- WCAG AA pour tout texte et tout contrôle;
- navigation complète au clavier;
- reflow à 320 px, avec défilement horizontal limité au tableau lorsque nécessaire.

---

## 3. Diagnostic de l’existant

### 3.1 Ce qui est solide et doit être conservé

- Le logo « L’Assemblage » possède une géométrie et des règles d’emploi précises.
- Les sept lois du standard premium sont pertinentes et restent opposables.
- `lib/ds/tokens.ts` constitue déjà un point d’ancrage crédible.
- `components/ui` est adopté dans le produit et couvre les primitives essentielles.
- Les primitives `Button`, `Input`, `Figure`, `StatusBadge`, `Modal`, `Skeleton` et les états d’erreur ont déjà de bonnes bases d’accessibilité.
- Les cinq archétypes décrits dans le document produit ramènent les 124 routes à un ensemble concevable.
- Le formatage des chiffres et les contraintes de fidéicommis sont documentés avec une rigueur inhabituelle.

### 3.2 Les fractures à résoudre

#### Deux directions chromatiques

L’ivoire chaud, le sable et l’albâtre verdâtre coexistent. Le problème n’est pas qu’une palette soit mauvaise. Le problème est que la même fonction peut changer de température et de contraste selon l’écran.

#### Deux trousses de composants

`components/ui` est le système vivant. `components/ds-safe` contient des idées plus récentes, mais redéfinit des primitives et introduit un second chemin. Une refonte qui conserve les deux créerait une troisième couche de décisions.

#### Une feuille globale devenue archive

`app/globals.css` contient à la fois les fondations de l’application, les styles du site public, plusieurs générations de composants, des effets animés, des dégradés, des thèmes sombres isolés et des classes historiques. La cascade agit comme une mémoire, pas comme un contrat.

#### Une sémantique de jetons incohérente

Une couleur peut être appelée `forest`, `emerald`, `primary`, `accent`, `safe-green`, `brand` ou `si-forest`. Le code peut donc être syntaxiquement valide tout en restant visuellement imprévisible.

#### Des composants fondamentaux encore divergents

- plusieurs styles d’en-tête coexistent;
- les onglets n’emploient pas tous le même vocabulaire de jetons;
- certains contrôles utilisent des durées littérales;
- certains écrans emploient encore des couleurs brutes;
- la fiche dossier contient des rayons, ombres, emojis et actions qui contredisent le standard;
- le parcours d’import emploie une grammaire visuelle plus ancienne que les primitives actuelles.

#### Une respiration parfois obtenue par des cartes

Les écrans ajoutent souvent une carte pour créer une séparation. Cette méthode augmente le nombre de formes visibles. SAFE doit respirer d’abord par l’espace, le filet et la typographie. Une surface encadrée ne se justifie que si elle possède une fonction ou un comportement propre.

### 3.3 Conclusion du diagnostic

La refonte doit être une consolidation. Il faut conserver les règles fortes, réduire les vocabulaires, retirer les effets historiques et migrer les écrans vers une seule chaîne de décision.

---

## 4. Direction visuelle : Le registre calme

### 4.1 Impression recherchée

Une utilisatrice doit percevoir, avant même de lire :

- que les chiffres sont fiables;
- que l’interface ne cherche pas à la distraire;
- que les actions importantes sont contrôlées;
- que le produit est conçu pour une utilisation quotidienne prolongée;
- que l’information peut être remise à une autre personne ou à un inspecteur.

### 4.2 Principes de composition

#### Le châssis s’efface

La navigation, la barre supérieure et les panneaux utilisent des neutres proches. La séparation vient d’un filet et d’un changement subtil de surface, pas d’un contraste spectaculaire.

#### Le contenu possède la page

La page n’est pas une collection de cartes. Les sections principales vivent directement sur la surface de travail. Les cartes sont réservées aux objets autonomes, aux états focalisés et aux éléments qui doivent être déplacés ou comparés.

#### L’espace encode la relation

L’écart entre un titre et sa description est faible. L’écart entre deux sections est au moins trois fois plus grand. La respiration devient une syntaxe.

#### La première vue répond à quatre questions

1. Où suis-je?
2. Quelle information décide de mon attention?
3. Quel geste principal puis-je faire?
4. Où trouver les détails?

#### La densité est réglable, pas improvisée

Deux densités sont offertes par les mêmes composants :

- **Confortable**, par défaut, pour la lecture et la découverte;
- **Compacte**, pour les registres utilisés toute la journée.

Le choix est conservé par personne et ne change ni l’ordre ni la présence des informations.

---

## 5. Les sept décisions ouvertes

### Décision 1 : une seule surface de couleur

**Décision proposée** : unifier le site produit et l’application autour de l’albâtre verdâtre. Retirer l’ivoire chaud et la barre latérale sable de l’intérieur.

**Pourquoi** :

- l’albâtre est plus neutre pour les longues séances;
- il rapproche les surfaces publiques et privées sans les rendre identiques;
- il donne davantage de présence au vert forêt sans multiplier les accents;
- il réduit le nombre de jetons et les risques de contraste.

Le site public peut conserver des compositions éditoriales propres. Il partage toutefois les mêmes neutres, le même vert et les mêmes règles de texte.

### Décision 2 : une seule trousse de composants

**Décision proposée** : `components/ui` devient la trousse canonique. `components/ds-safe` devient un pont temporaire, puis disparaît.

Les idées pertinentes de `ds-safe` sont absorbées dans les primitives ou dans des composants de motif. Les pages n’importent jamais directement une seconde trousse.

### Décision 3 : aucun mode sombre dans cette refonte

**Décision proposée** : ne pas concevoir ni annoncer le mode sombre avant que 90 % du périmètre vivant soit migré et que le clair atteigne au moins 90 au score premium.

Le mode sombre exigerait une recomposition complète des statuts, filets, documents et surfaces comptables. L’ajouter maintenant doublerait la dette au lieu de la réduire.

### Décision 4 : réduire le verre à un seul cas

**Décision proposée** : retirer le verre de la structure courante et des en-têtes de page. Autoriser une seule surface flottante translucide pour un menu, une palette ou un tiroir lorsque le contenu derrière doit rester perceptible.

Les modales de décision financière restent opaques. Les barres collantes utilisent une surface pleine avec filet. Aucun fond atmosphérique n’est nécessaire dans l’application.

### Décision 5 : rendre le système opposable automatiquement

**Décision proposée** : introduire des contrôles automatiques dès la fondation.

- règle ESLint contre les couleurs, ombres, rayons et durées brutes;
- liste d’exceptions explicite pour les logos externes et les documents;
- tests de contrat pour chaque primitive;
- page de spécimens canonique;
- tests visuels sur les cinq archétypes;
- compteur d’écarts par route migrée;
- budget de performance en intégration continue.

### Décision 6 : servir le tactile dès maintenant

**Décision proposée** : conserver une densité de bureau et une densité tactile dans les mêmes composants.

- cible minimale de 44 px sur tactile;
- contrôles persistants pour toute action essentielle;
- reflow de la page à 320 px;
- colonnes d’identité et de décision conservées dans les tableaux;
- vues empilées pour les fiches et assistants;
- aucune dépendance au survol.

### Décision 7 : un sous-système déclaré pour les documents

**Décision proposée** : les documents sortants partagent les familles, l’encre, le vert de marque et les composants de chiffres, mais possèdent leur propre grille, leurs propres espacements et leurs propres règles d’impression.

Une facture n’est pas une capture de l’interface. Elle est un document autonome, limité à deux couleurs et vérifié en noir et blanc.

---

## 6. Fondations proposées

### 6.1 Palette sémantique

| Jeton | Valeur proposée | Usage |
|---|---:|---|
| `canvas` | `#EFF2ED` | Fond général de l’application |
| `surface` | `#FBFCFA` | Surface de travail |
| `surface-raised` | `#FFFFFF` | Menu, dialogue et élément réellement élevé |
| `surface-subtle` | `#F3F5F1` | Sélection légère, groupe secondaire |
| `ink` | `#1F2A24` | Texte principal |
| `body` | `#3A453E` | Corps de texte |
| `muted` | `#5A665F` | Métadonnées et libellés secondaires |
| `faint` | `#7C877F` | Désactivé, jamais pour un texte essentiel |
| `line` | `rgba(31,42,36,0.10)` | Filet normal |
| `line-subtle` | `rgba(31,42,36,0.06)` | Séparateur de rangée |
| `action` | `#1F3A2E` | Action principale et sélection forte |
| `action-hover` | `#162B20` | Survol et pression de l’action principale |
| `verified` | `#2E7D5B` | État validé ou rapproché |
| `attention` | `#8A6A1E` | Échéance et élément à vérifier |
| `danger` | `#9B2C2C` | Erreur bloquante et montant négatif |

#### Règles de couleur

- Une seule action pleine par écran.
- Le vert d’action ne remplace jamais le vert de validation.
- Le rouge ne signale jamais une simple échéance.
- Un statut est toujours accompagné d’un libellé.
- Les surfaces de contenu restent neutres.
- Une ligne sélectionnée reçoit une teinte légère et un repère de forme ou de filet.

### 6.2 Typographie

#### Décision proposée

L’application utilise **Geist Sans** pour tous les titres, libellés et textes. **Geist Mono** est obligatoire pour les montants, soldes, heures, dates comptables et références.

**Instrument Serif** quitte l’interface de travail. Elle reste disponible pour la marque, le site public, les pages de garde et certains documents éditoriaux.

Cette séparation rend l’application plus calme, plus proche d’un outil contemporain et plus stable dans les écrans denses. L’identité de SAFE demeure dans le logo, la couleur, les chiffres, la voix et la composition.

| Rôle | Taille | Interligne | Graisse |
|---|---:|---:|---:|
| Titre d’écran | 28 px | 34 px | 560 |
| Titre de fiche | 22 px | 28 px | 560 |
| Titre de section | 16 px | 22 px | 560 |
| Corps | 14 px | 21 px | 420 |
| Texte fort de ligne | 14 px | 20 px | 520 |
| Métadonnée | 12 px | 17 px | 440 |
| En-tête de colonne | 12 px | 16 px | 520 |
| Chiffre de registre | 13 px | 18 px | 450 |
| Grand chiffre | 22 px | 26 px | 520 |

Maximum de quatre rôles typographiques visibles simultanément dans une zone de travail.

### 6.3 Espacement

Échelle unique sur une base de 4 px :

`0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80`

| Relation | Valeur de référence |
|---|---:|
| Icône et libellé | 8 px |
| Libellé et contrôle | 6 à 8 px |
| Titre et description | 8 px |
| Éléments d’un même groupe | 12 à 16 px |
| Groupes d’une section | 24 px |
| Sections d’une page | 40 à 48 px |
| Bord de page, bureau | 32 px |
| Bord de page, tablette | 24 px |
| Bord de page, mobile | 16 px |

### 6.4 Grille et largeurs

- barre latérale : 232 px ouverte, 64 px réduite;
- barre supérieure : 52 px;
- largeur maximale de travail : 1 440 px;
- largeur de lecture : 720 px ou 65 caractères;
- gouttière principale : 24 px;
- grille de page : 12 colonnes sur bureau, 8 sur tablette, 4 sur mobile;
- colonne porteuse d’un registre : 50 à 65 % de la largeur utile.

### 6.5 Densité

| Élément | Confortable | Compacte | Tactile |
|---|---:|---:|---:|
| Rangée simple | 48 px | 40 px | 52 px |
| Rangée à deux niveaux | 56 px | 48 px | 60 px |
| En-tête de tableau | 40 px | 36 px | 44 px |
| Contrôle | 40 px | 36 px | 44 px minimum |
| Barre d’outils | 48 px | 44 px | 52 px |

### 6.6 Formes et profondeur

| Rôle | Rayon | Profondeur |
|---|---:|---|
| Tableau et section dans le flux | 0 à 4 px | Filet, aucune ombre |
| Bouton et champ | 6 px | Filet ou aplat |
| Panneau autonome | 8 px | Filet, aucune ombre |
| Menu et dialogue | 12 px | Ombre unique et discrète |
| Statut et filtre | Plein | Aucune ombre |

La forme pleine décrit un état. Elle ne déclenche pas une action.

### 6.7 Mouvement

| Jeton | Durée | Usage |
|---|---:|---|
| `instant` | 100 ms | Survol, pression et sélection |
| `base` | 160 ms | Ouverture locale et changement d’état |
| `slow` | 220 ms | Dialogue et changement de panneau |

Courbe unique : `cubic-bezier(0.16, 1, 0.3, 1)`.

Aucun déplacement au survol, aucune animation continue, aucune entrée décorative. Le mouvement sert uniquement à guider, confirmer ou clarifier.

---

## 7. Navigation proposée

### 7.1 Châssis

La barre latérale devient claire et mate. Elle utilise la même famille de neutres que le canevas, avec un filet vertical. Le produit évite ainsi l’effet de portail d’entreprise créé par une grande barre sombre permanente.

Ordre :

1. logo SAFE;
2. Aujourd’hui;
3. Tableau de bord;
4. Cabinet;
5. Finances;
6. Outils;
7. Paramètres;
8. contexte de cabinet, rôle et compte.

Les groupes peuvent se replier, mais leur libellé reste stable. Une entrée absente à cause du rôle ne laisse aucun espace vide.

### 7.2 Barre supérieure

La barre supérieure contient seulement :

- le fil d’Ariane lorsque nécessaire;
- la recherche globale ou la palette de commandes;
- la langue;
- l’accès au compte.

Les actions propres à la page restent dans l’en-tête de contenu. Elles ne migrent pas dans la barre globale.

### 7.3 En-tête de page

L’en-tête n’est plus une grande carte verte. Il vit directement sur la surface de travail.

Ordre constant :

1. contexte ou fil d’Ariane;
2. titre;
3. description courte ou métadonnées;
4. action principale à droite;
5. actions secondaires dans un menu ou en texte.

---

## 8. Architecture des composants

### 8.1 Chaîne canonique

```text
lib/ds/tokens.ts
    -> variables CSS générées
    -> configuration Tailwind
    -> components/ui
    -> components/patterns
    -> composants métier
    -> routes
```

### 8.2 Fondations

- couleurs;
- typographie;
- espacements;
- rayons;
- profondeur;
- mouvement;
- densité;
- grille;
- formatage des chiffres, dates et montants.

### 8.3 Primitives dans `components/ui`

- Button;
- IconButton;
- LinkButton;
- Input, Textarea, Select, AmountInput;
- Checkbox, Radio, Switch;
- StatusBadge;
- Alert;
- Tooltip;
- Menu;
- Dialog et Drawer;
- Tabs;
- Table;
- Skeleton;
- EmptyState;
- QueryErrorState;
- Figure et Amount;
- PageHeader;
- SectionHeader.

### 8.4 Motifs dans `components/patterns`

- RegistryToolbar;
- SummaryBar;
- DataRegistry;
- ObjectHeader;
- MetadataList;
- ActivityTimeline;
- DecisionWorkspace;
- Stepper;
- FormSection;
- DocumentFrame;
- StickyActionBar.

### 8.5 Composants métier

Les composants métier composent les motifs. Ils ne définissent aucune valeur visuelle structurante.

Exemples :

- ClientRegistry;
- MatterIdentity;
- TrustBalance;
- ReconciliationDecision;
- InvoiceDocument;
- ImportMapping.

---

## 9. Les cinq archétypes

Les vues ci-dessous ne sont pas des maquettes finales. Elles décrivent la composition, l’ordre de lecture et les composants attendus.

### 9.1 Le registre

**Exemple** : clients, factures, transactions, temps.

```text
Clients                                           [Nouveau client]
318 clients actifs                         [Exporter] [Plus d’actions]

Tous 318   Actifs 301   Archivés 17
---------------------------------------------------------------
[Rechercher un client]       [Statut] [Responsable] [Trier]
---------------------------------------------------------------
CLIENT                         DOSSIERS      SOLDE      STATUT  ···
Cabinet Tremblay et Associés          4   12 450,00 $   Actif   ···
  Me Sophie Roy · activité il y a 2 h
Groupe immobilier Northfield          1        0,00 $   Actif   ···
  Me Jean Côté · activité hier
---------------------------------------------------------------
1 à 50 sur 318                                      [1] 2 3 Suivant
```

#### Décisions

- supprimer les grandes cartes de statistiques par défaut;
- réunir les mesures utiles dans une barre de synthèse horizontale;
- donner la majorité de la largeur à l’identité;
- aligner montants et en-têtes à droite;
- garder le menu de ligne persistant;
- n’afficher un en-tête de colonne que s’il sert à comprendre, trier ou filtrer;
- conserver les vues vide, chargement et erreur dans le même cadre.

### 9.2 La fiche

**Exemple** : dossier, client, employé.

```text
Dossiers / 2026-0142

2026-0142  Tremblay c. Ville de Montréal              [Modifier]
Sophie Tremblay · Litige civil · Ouvert           [Démarrer le temps]

Vue d’ensemble  Documents  Personnes  Finances  Activité
==============================================================
Où vous en étiez
Dernière action : projet de mise en demeure révisé hier
Prochaine étape : obtenir l’approbation de Me Roy

État de préparation                         Échéances à venir
3 éléments à vérifier                       14 août · Dépôt de la demande
1 document manquant                         21 août · Audience de gestion

Documents
--------------------------------------------------------------
Mise en demeure                             Final      il y a 1 j
Projet de demande                           Brouillon  il y a 3 h
```

#### Décisions

- l’identité complète reste visible dans l’en-tête collant;
- une navigation locale stable remplace une succession de cartes;
- la reprise de contexte apparaît avant les détails;
- les parties et rôles sont écrits en clair;
- le fil d’activité devient une timeline;
- une seule action pleine, les autres restent secondaires;
- les sections profondes peuvent être atteintes par ancre sans perdre le contexte.

### 9.3 Le poste de décision

**Exemple** : rapprochement bancaire, certification, verrouillage de période.

```text
Rapprochement du fidéicommis                           Avril 2026
Règlement B-1, r.5                            État : Écart à résoudre

RELEVÉ BANCAIRE               REGISTRE SAFE
Solde      128 450,00 $       Solde      128 325,00 $
Chèques     -4 100,00 $       Par dossier 128 325,00 $
Dépôts       2 250,00 $
--------------------------------------------------------------
Solde rapproché 126 600,00 $  Solde registre 128 325,00 $

ÉCART : -1 725,00 $
Deux opérations n’ont pas encore été appariées.

Opérations à résoudre
12 avr.  Virement reçu  Client Lafleur       1 500,00 $ [Apparier]
18 avr.  Frais bancaires                         225,00 $ [Expliquer]

[Enregistrer le travail]                         Certifier indisponible
Cause : l’écart doit être de 0,00 $.
```

#### Décisions

- montrer les deux sources dans la même vue;
- afficher la cause de l’écart, pas seulement son montant;
- ne rendre le bouton de certification principal que lorsque l’écart est nul;
- expliquer tout état désactivé à proximité;
- conserver l’historique sous la zone de décision;
- ne jamais appliquer d’interface optimiste à une écriture comptable irréversible.

### 9.4 Le document imprimable

**Exemple** : facture, rapport mensuel, trousse d’inspection.

```text
SAFE                                      FACTURE FA-2026-0041
Cabinet Tremblay                          Émise le 10 août 2026
                                          Échéance le 9 septembre 2026

FACTURÉ À
Sophie Tremblay
123, rue Exemple, Montréal (Québec)

DATE        DESCRIPTION              HEURES     TAUX       MONTANT
02 août     Recherche juridique        2,30   250,00 $      575,00 $
04 août     Projet de procédure        1,75   250,00 $      437,50 $
------------------------------------------------------------------
                                               Sous-total        1 012,50 $
                                               TPS                 50,63 $
                                               TVQ                100,99 $
                                               TOTAL            1 164,12 $
```

#### Décisions

- partager les composants de montant et de statut avec l’application;
- limiter la facture à l’encre et au vert forêt;
- vérifier chaque sortie en noir et blanc;
- répéter les en-têtes de tableau sur les pages suivantes;
- empêcher la coupure d’un total, d’une signature ou d’une ligne essentielle;
- exclure toute commande interactive de la surface imprimée;
- tester les noms longs, les descriptions longues et les montants à sept chiffres.

### 9.5 L’assistant séquentiel

**Exemple** : import, onboarding, création d’une facture.

```text
Importer des données

1 Fichier  2 Analyse  3 Correspondance  4 Vérification  5 Résultat
==========

Correspondance des colonnes                              Étape 3 sur 5
Associez les colonnes du fichier aux champs SAFE.

Champ SAFE                 Colonne du fichier             État
Nom du client              Nom complet                    Trouvé
Courriel                    Email                          Trouvé
Téléphone                   Téléphone mobile               À vérifier

[Retour]                                              [Vérifier les données]
```

#### Décisions

- un seul écran et une seule décision par étape;
- afficher le numéro de l’étape et ce qu’il reste;
- garder les libellés visibles;
- valider après la fin de la saisie;
- montrer les lignes bloquées avant l’import;
- rendre la fin mémorable par un résumé précis, sans félicitation décorative;
- permettre le retour en arrière sans perdre les données déjà validées.

---

## 10. États obligatoires

Chaque primitive et chaque motif doit documenter :

- repos;
- survol;
- focus clavier;
- pressé ou sélectionné;
- désactivé avec raison;
- chargement;
- succès;
- avertissement;
- erreur.

Chaque écran de données doit posséder :

- un état chargé;
- un état vide;
- un état de chargement immobile;
- un état d’erreur récupérable;
- un état de permission insuffisante;
- un cas de données longues;
- un cas de montant négatif, nul et à sept chiffres.

---

## 11. Stratégie responsive et tactile

### Bureau

- navigation latérale ouverte;
- registres en densité confortable ou compacte;
- panneaux côte à côte lorsque la comparaison est la tâche;
- actions secondaires dans un menu persistant.

### Tablette

- navigation latérale réductible;
- contrôles de 44 px minimum;
- filtres dans un tiroir;
- panneaux de décision côte à côte seulement si la largeur le permet;
- aucune action essentielle au survol.

### Mobile

- navigation en tiroir;
- actions principales collées au bas lorsque le parcours le justifie;
- fiche réordonnée selon contexte, décision, action, détails;
- tableau bidimensionnel dans un conteneur défilant avec identité conservée;
- vue alternative en liste lorsque la comparaison simultanée n’est pas essentielle.

---

## 12. Migration proposée

La migration avance par archétype et non par couleur ou par route isolée.

### Lot 0 : fondations et garde-fous

- figer les noms de jetons cibles;
- générer les variables CSS depuis `tokens.ts`;
- isoler les styles du site public;
- installer les règles automatiques;
- créer la page de spécimens;
- documenter les exceptions.

**Condition de terminé** : une primitive ne peut plus introduire une valeur brute sans échec automatisé.

### Lot 1 : trousse canonique

- consolider Button, Input, Select, Table, Tabs, StatusBadge, Dialog et PageHeader;
- absorber les éléments utiles de `ds-safe`;
- introduire les densités confortable, compacte et tactile;
- retirer les variantes de compatibilité non utilisées.

**Condition de terminé** : toutes les primitives existent dans le spécimen avec leurs états.

### Lot 2 : châssis et navigation

- construire la barre latérale claire;
- simplifier la barre supérieure;
- unifier le cadre de page;
- vérifier la composition selon les quatre rôles techniques.

**Condition de terminé** : une seule coquille sert l’application cliente et la console.

### Lot 3 : registre pilote

Migrer le registre clients avec données réelles, libellés longs, permissions et pagination.

**Condition de terminé** : le motif DataRegistry couvre aussi les états vide, chargement et erreur.

### Lot 4 : fiche pilote

Migrer la fiche dossier, qui concentre la profondeur, les identités et les sections imbriquées.

**Condition de terminé** : l’utilisatrice peut retrouver le contexte et atteindre une section sans se perdre.

### Lot 5 : poste de décision

Migrer le rapprochement du fidéicommis.

**Condition de terminé** : les deux sources, l’écart, la cause et la possibilité de certifier sont compréhensibles dans une seule vue.

### Lot 6 : assistant séquentiel

Migrer l’import de données.

**Condition de terminé** : le parcours survit au retour arrière, aux erreurs de fichier et aux colonnes non reconnues.

### Lot 7 : documents sortants

Migrer facture, rapport mensuel et trousse d’inspection vers le sous-système d’impression.

**Condition de terminé** : les documents passent les vérifications écran, PDF, papier et noir et blanc.

### Lot 8 : propagation

Migrer les routes restantes par famille. Chaque lot doit réduire le compteur d’écarts. Aucun nouveau composant local n’est accepté sans démonstration qu’un motif existant ne convient pas.

---

## 13. Éléments supprimés ou dépréciés

### À supprimer

- palette ivoire et sable dans l’intérieur de l’application;
- barre latérale sombre permanente;
- fonds atmosphériques et lueurs dans les écrans de travail;
- grandes cartes vertes employées comme en-têtes de page;
- mouvement d’entrée systématique des pages;
- déplacement, agrandissement ou ombre ajoutée au survol;
- `AnimatedNumber` pour les données comptables;
- emojis et symboles décoratifs dans les états;
- styles de tableau locaux;
- valeurs de design écrites directement dans les routes.

### À déprécier

- imports depuis `components/ds-safe`;
- alias `primary`, `accent`, `emerald`, `green`, `safe-green` et autres vocabulaires historiques;
- variantes de bouton qui décrivent une époque ou une page plutôt qu’un rôle;
- `PageHero` dans l’application de travail;
- classes globales de type `glass-card`, `stat-card`, `safe-hover-lift`, `dash-*` et leurs équivalents;
- styles d’impression globaux concurrents.

### À conserver

- logo « L’Assemblage » et son implémentation canonique;
- vert forêt de la marque;
- Geist Sans et Geist Mono;
- Instrument Serif sur les surfaces éditoriales et documents appropriés;
- sept lois non négociables;
- logique de profondeur limitée aux vraies superpositions;
- principes de voix et vocabulaire juridique;
- formats canadiens français et anglais.

---

## 14. Critères de validation de la direction

La direction peut être validée si les réponses aux questions suivantes sont positives.

### Compréhension

- Le prochain geste est-il évident sans lire toute la page?
- L’identité principale est-elle écrite en clair?
- Les détails secondaires sont-ils accessibles sans dominer?

### Confiance

- Les chiffres se comparent-ils verticalement?
- Les montants, dates et références utilisent-ils le bon format?
- Une action irréversible montre-t-elle sa conséquence et son état?

### Respiration

- L’espace sépare-t-il réellement les groupes?
- Une carte peut-elle être retirée sans perdre une fonction?
- La première vue présente-t-elle moins de formes distinctes que l’écran actuel?

### Cohérence

- Chaque couleur correspond-elle à un rôle stable?
- Chaque composant provient-il de la chaîne canonique?
- Les mêmes actions ont-elles la même apparence dans les cinq archétypes?

### Accessibilité et vitesse

- Le clavier permet-il d’accomplir le parcours?
- Le contraste est-il conforme?
- Le tactile conserve-t-il toutes les actions essentielles?
- La proposition respecte-t-elle les budgets de rendu et d’interaction?

---

## 15. Checklist anti-slop appliquée à cette proposition

La direction exclut explicitement :

- dégradés violets ou bleus;
- orbes et halos décoratifs;
- verre sur les surfaces du flux;
- structure centrée ou symétrique par défaut;
- accumulation de cartes à icônes;
- texte générique;
- avatars à la place des noms;
- grille complète de tableau;
- largeur égale pour toutes les colonnes;
- actions cachées au seul survol;
- animations continues;
- badge ou bulle d’assistant IA;
- fausse rareté, faux témoignage ou faux indicateur de confiance.

---

## 16. Recommandation finale

La refonte devrait être approuvée comme une **consolidation vers Le registre calme**, avec quatre choix structurants :

1. une seule palette albâtre et forêt;
2. une interface de travail entièrement en Geist Sans et Geist Mono;
3. une seule trousse canonique dans `components/ui`;
4. une migration par archétype, en commençant par clients, dossier, rapprochement, import et facture.

La première implémentation ne devrait pas chercher à couvrir tout SAFE. Elle devrait prouver que la direction tient sur les trois endroits les plus exigeants : le registre clients, la fiche dossier et le rapprochement du fidéicommis.

Si ces trois écrans deviennent plus lisibles, plus calmes et plus rapides sans perdre leur densité métier, le système pourra ensuite se propager avec confiance.

---

## Sources internes consultées

- `CLAUDE.md`
- `CO-DIRECTION.md`
- `docs/brand/IDENTITE_SAFE.md`
- `docs/design/DESIGN_HUMAIN.md`
- `docs/design/SAFE_PREMIUM_DESIGN_STANDARD.md`
- `SAFE_DESCRIPTION_PRODUIT_2026-08-10.pdf`
- `lib/ds/tokens.ts`
- `tailwind.config.ts`
- `app/globals.css`
- `components/ui`
- `components/ds-safe`
- registre clients, fiche dossier, rapprochement, import et aperçu de facture dans le produit actuel

