# Propositions de copy, page par page — site SAFE cabinet (version justifiée)

> Copy prêt à coller, dérivé de `COPYWRITING_SITE_CABINET.md`.
> Angle : la tranquillité d'un fidéicommis toujours à jour. Positionnement : copilote de l'adjointe.
> Voix : vouvoiement, phrases courtes, ton posé, zéro jargon, client héros, preuve avant promesse, aucun chiffre inventé, pas de tiret long en milieu de phrase.
> Mis à jour le 2026-07-22.

## Lecture de ce document
Chaque bloc porteur d'une affirmation a une note **Appui** qui dit sur quoi elle repose. Ces notes sont **internes, à retirer avant publication.**

Cinq types d'appui :
- **Vécu fondateur** : tiré de votre expérience réelle. Le plus solide, à condition de rester vrai.
- **Fait produit** : ne publier que si la fonction est réellement livrée et visible à l'écran. Sinon, couper.
- **Recherche** : appuyé par la recherche sourcée (voir doc de référence).
- **Fait vérifiable** : prix réel, règle réglementaire. À confirmer une fois, puis fiable.
- **Cadrage** : opinion ou promesse d'expérience, honnête, pas une affirmation factuelle. Autorisé tant que ça ne prétend pas être un fait chiffré.

`[à confirmer]` = donnée à valider. `[…]` = à remplir.

---

## A. Page d'accueil

### Hero
**Titre** : Dormez tranquille la veille de votre inspection.
**Sous-titre** : SAFE garde votre fidéicommis à jour, jour après jour.
**Action** : Réserver 20 minutes · *(lien discret : Voir comment ça marche)*
> **Appui** — Titre : *Cadrage* (promesse d'expérience, pas un fait chiffré). Sous-titre : *Fait produit*, à ne garder que si le suivi continu est réellement en place.

### Provenance (au lieu des logos)
Conçu au poste de travail d'un vrai cabinet.
> **Appui** — *Vécu fondateur*. Vrai : vous teniez les livres d'une avocate. À garder tel quel, c'est votre meilleur actif.

### Le problème (posé)
Tenir un compte en fidéicommis demande une rigueur constante, celle qu'un tableur ne tient pas à votre place. Beaucoup de cabinets s'en remettent à Excel et à des fichiers séparés, alors le suivi repose entièrement sur vous, ce qui prend du temps et laisse une part de doute. SAFE tient cette rigueur en continu, pour que vous gardiez l'esprit léger.
> **Appui** — « rigueur constante » : *Fait réglementaire* (rapprochement à trois voies exigé). « qu'un tableur ne tient pas à votre place » : *Cadrage* défendable (un tableur est passif, il n'impose ni rapprochement ni alerte). « Beaucoup s'en remettent à Excel » : *Recherche*, hedgé à « beaucoup » car le qualitatif est unanime mais aucun chiffre exact n'existe (environ 70 % sans logiciel dédié, source 2025 Legal Industry Report). « SAFE tient cette rigueur en continu » : *Fait produit*.

### Comment ça marche
1. Vous entrez les mouvements une fois.
2. SAFE tient le rapprochement à jour et vous prévient s'il y a un écart.
3. Le dossier d'inspection est prêt quand vous en avez besoin.
> **Appui** — *Fait produit* VÉRIFIÉ dans le code le 2026-07-22, les trois sont LIVRÉS avec UI. (1) Formulaires DepotForm/RetraitForm + page /comptes. (2) Rapprochement trois voies dans reconciliation-service.ts, détection d'écart et de solde négatif dans trust-monitoring.ts, alertes rouges TrustAlertsPanel.tsx, certification refusée si écart non nul ou solde négatif. (3) Rapport LSO/Barreau mensuel/trimestriel/annuel dans lso-report-service.ts + LSOReportGenerator.tsx + export PDF du relevé, page /comptes/rapports. Publiable tel quel.

### Ce que ça change
- **Fidéicommis** : rapprochement à jour, tout écart vous est signalé.
- **Facturation** : les débours et le temps remontent sur la facture.
- **Temps** : noté pendant le travail, pas de mémoire à faire.
- **Dossiers** : une affaire, un seul endroit.
> **Appui** — *Fait produit* VÉRIFIÉ (2026-07-22). Fidéicommis : rapprochement trois voies + signalement d'écart et de solde négatif, confirmé dans le code. Facturation/Temps/Dossiers : à reconfirmer au même contrôle avant publication. Formulation « les débours et le temps remontent » (descriptif, sûr) plutôt que « rien d'oublié » (absolu).

### Preuve
> [Témoignage de la cliente, ses mots, nom et rôle si consentement. Sinon : « Une avocate de [ville], premier cabinet à l'utiliser. »]

Pas de mur de logos. Une cliente réelle, un usage réel.
> **Appui** — *Vécu fondateur* + *Fait vérifiable*. À remplir avec une vraie citation. Ne rien inventer ni reformuler ses propos sans accord.

### Rappel d'action
**Titre** : Vingt minutes pour voir si ça vous convient.
**Action** : Réserver 20 minutes
Sans engagement. Vous repartez avec des réponses.
> **Appui** — *Cadrage* + *Fait vérifiable* (« sans engagement » doit être vrai de votre processus de démo).

---

## B. Page Fonctionnalités

### Intro
**Titre** : Un peu moins d'administration, chaque jour.
Voici ce que SAFE prend en charge, par sujet.
> **Appui** — *Cadrage*, volontairement modeste (« un peu »), ce qui le rend indiscutable.

### Le fidéicommis
**Votre fidéicommis, toujours à jour.**
Vous saisissez chaque dépôt et chaque retrait une fois. SAFE rapproche le solde bancaire, le registre et le détail par dossier, et vous signale tout écart ou tout solde qui passerait sous zéro.

Et SAFE ne vous laisse pas certifier un rapprochement qui ne balance pas. Le moment venu, votre rapport pour le Barreau se prépare pour le mois, le trimestre ou l'année, avec les mois manquants mis en évidence.
> **Appui** — *Fait produit* VÉRIFIÉ dans le code (2026-07-22). Rapprochement trois voies (bancaire, registre, par dossier) dans reconciliation-service.ts. Signalement d'écart et de solde négatif dans trust-monitoring.ts + TrustAlertsPanel.tsx. Garde-fou « certification refusée si écart non nul ou solde négatif » dans reconciliation-service.ts:152. Rapport LSO/Barreau mensuel/trimestriel/annuel avec mois manquants ou non certifiés dans lso-report-service.ts. Tout est publiable tel quel.

### La facturation
**Facturez ce qui a vraiment été fait.**
Les débours et le temps remontent sur la facture. Moins d'oublis.
> **Appui** — *Fait produit*. « Moins d'oublis » remplace « plus rien qui vous échappe » (promesse d'absolu non tenable). Vrai si la remontée automatique existe.

### Le temps
**Le temps se note pendant le travail.**
Relié au dossier en cours. Vos heures sont là quand vient la facture.
> **Appui** — *Fait produit*. Vrai si la saisie du temps est reliée au dossier.

### Les dossiers
**Une affaire, un seul endroit.**
Documents, parties, échéances au même dossier.
> **Appui** — *Fait produit*. Vrai si le dossier regroupe bien ces éléments.

### Ce que ça ne fait pas
SAFE ne remplace pas votre comptable de fin d'année. Il tient vos livres au quotidien et lui prépare des exports propres. [Ajuster au périmètre réel.]
> **Appui** — *Fait produit* + *Cadrage* honnête. Cette limite volontaire renforce la crédibilité (transparence, cf. recherche). Vérifier que l'export existe.

---

## C. Page Tarification

### Titre
**Un prix simple, tout compris.**
Configuration incluse. Pas de frais d'installation.
> **Appui** — *Fait vérifiable*. Vrai : la configuration est incluse, pas de setup séparé.

### Les forfaits
**Solo — 99 $ par mois**
Pour l'avocate seule. Fidéicommis, facturation, temps, dossiers. Tout compris.

**Cabinet — 149 $ par mois**
Pour le petit cabinet à deux mains ou plus. Tout Solo, pour l'équipe.
> **Appui** — *Fait vérifiable* (prix réels). La liste des modules doit correspondre à ce qui est réellement inclus.

### Offre fondatrice
**Cinq cabinets fondateurs. Douze mois offerts.**
Cinq places pour les premiers qui bâtissent l'outil avec nous. Douze mois sans frais, puis 50 $ par mois à vie. Ou un rachat unique de 5 000 $.
En échange, votre franchise. Vous nous dites ce qui pourrait être mieux, on l'améliore.
> **Appui** — *Fait vérifiable* (offre réelle : 5 places, 12 mois, 50 $/mois à vie ou 5 000 $). « cinq places » doit rester vrai, ne pas laisser en ligne si c'est déjà comblé.

### Le risque est de notre côté
Forfait mensuel. Vous partez quand vous voulez, avec vos données.
> **Appui** — *Fait vérifiable*. « avec vos données » suppose un export réel. À confirmer.

### En bref
- **Est-ce que ça vaut le coût ?** Pensez au temps passé chaque semaine sur les rapprochements. C'est surtout ça que vous récupérez.
- **Engagé ?** Non, c'est mensuel.
- **Mes données ?** À vous. Vous les exportez quand vous voulez.
> **Appui** — 1re ligne : *Cadrage* (invite au calcul, ne promet aucun nombre). 2e et 3e : *Fait vérifiable*.

---

## D. Page À propos

### Titre
**J'ai tenu les livres d'une avocate avant d'écrire une ligne de code.**
> **Appui** — *Vécu fondateur*. Vrai, unique, incopiable. C'est le cœur de votre crédibilité.

### L'histoire (courte, en « je »)
Avant SAFE, je tenais la comptabilité d'un cabinet. C'est là que j'ai compris le sujet de l'intérieur. [Détail : ce que vous avez remarqué sur le fidéicommis.]

Tout se tenait à la main, dans des fichiers qui ne se parlaient pas. Chaque fin de mois demandait de tout reprendre. [Détail : ce qui vous a donné l'idée.]

Alors j'ai bâti ce que j'aurais aimé avoir. Un outil qui ne remplace pas l'adjointe, qui l'épaule. Qui garde le fidéicommis à jour à sa place. [Détail : la première chose qu'il a simplifiée pour elle.]

Je n'ai pas découvert ce sujet dans un rapport. Je l'ai vécu. C'est pour ça que j'aime bien m'en occuper.
> **Appui** — *Vécu fondateur* de bout en bout. Chaque `[Détail]` doit être un fait réel de votre expérience. C'est ici que l'argumentation est la plus forte, parce qu'elle ne s'appuie sur aucune source à défendre : elle vous appartient.

*[Prénom Nom], fondateur de SAFE*
*[Photo : DSC03086 en portrait, DSC03157 ou DSC03167 au travail.]*

---

## E. Page Démo / Contact

### Titre
**Une conversation, pas une vente.**
Vingt minutes. On regarde votre situation, vous décidez ensuite.
> **Appui** — *Cadrage* + *Fait vérifiable*. Doit refléter votre vraie façon de mener la démo (sans pression, cf. règle de vente non confrontation).

### Ce qui va se passer
- Vingt minutes, pas plus.
- On part de vos comptes, pas d'une présentation générique.
- Aucune pression.
- Vous repartez avec des réponses utiles.
> **Appui** — *Fait vérifiable* (votre processus). À tenir réellement pour rester honnête.

### Formulaire
Nom · Courriel · Nom du cabinet
**Bouton** : Réserver mes 20 minutes
On ne partage jamais vos coordonnées.
> **Appui** — *Fait vérifiable*. « ne partage jamais » doit être vrai de votre pratique.

---

## F. Lead magnet / Audit gratuit

### Titre
**Huit points regardés en inspection. Où en êtes-vous ?**
Une vérification simple, à faire vous-même.
> **Appui** — *Fait réglementaire*. Les huit points doivent correspondre à de vrais éléments vérifiés en inspection. [Valider la liste avec vos sources Barreau.]

### Ce que vous recevez
- Les huit points regardés en inspection.
- Pour chacun, l'attendu et le point d'attention fréquent.
- De quoi noter où vous en êtes.
> **Appui** — *Fait réglementaire* + *Fait produit* (le contenu du diagnostic existe). Ne promettre que ce que le document livre vraiment.

### Pourquoi c'est gratuit
La meilleure façon de vous montrer qu'on connaît le sujet, c'est de vous rendre service tout de suite. La liste reste à vous, que vous alliez plus loin ou non.
> **Appui** — *Cadrage* honnête (réciprocité assumée). Rien à prouver.

### Action
**Bouton** : Recevoir le diagnostic
Votre courriel, rien d'autre. Pas d'appel surprise.
> **Appui** — *Fait vérifiable*. « pas d'appel surprise » vous engage, à tenir.

---

## G. FAQ / Objections

**Mes données sont-elles en sécurité ?**
Vos données sont privées et restent les vôtres. [Décrire précisément la mesure réelle, par exemple stockage privé et chiffré, une fois confirmée.] Si vous partez, vous les emportez.
> **Appui** — *Fait vérifiable*, **sensible**. Ne pas surpromettre sur la sécurité. Décrire seulement ce qui est réellement en place et confirmé. Une affirmation de sécurité fausse est le pire risque de crédibilité.

**Est-ce conforme au Barreau du Québec et de l'Ontario ?**
SAFE est pensé pour leurs règles de tenue de fidéicommis. Il tient le rapprochement à trois voies attendu, signale les écarts et prépare votre rapport au format demandé, du mois à l'année. [Préciser le renvoi exact une fois validé.] La conformité reste la vôtre, l'outil vous aide à la tenir.
> **Appui** — *Fait réglementaire* + *Fait produit* VÉRIFIÉ (2026-07-22). Rapprochement trois voies et rapport annuel format Barreau confirmés dans le code. Formulation prudente et juste : l'outil aide, il ne garantit pas la conformité à votre place. Ajouter le renvoi exact (B-1 r.5 côté Québec) une fois vérifié.

**Combien de temps pour basculer ?**
On vous accompagne avec vos vrais dossiers. [Délai réel à indiquer.] Vous n'êtes jamais seule devant l'écran.
> **Appui** — *Fait vérifiable*. Ne donner un délai que s'il est réel et tenu.

**Suis-je engagé ?**
Non. C'est mensuel.
> **Appui** — *Fait vérifiable*.

**Vous n'avez qu'une cliente. Pourquoi vous faire confiance ?**
C'est vrai, et on le dit volontiers. On préfère débuter avec un cabinet réel plutôt que des promesses. Vous jugez sur pièce.
> **Appui** — *Vécu fondateur* + *Cadrage*. Transformer la faiblesse en preuve d'honnêteté. Très défendable parce que vous admettez le fait au lieu de le cacher.

**Est-ce que ça remplace mon adjointe ?**
Non. L'adjointe est le copilote de l'avocate. SAFE est le copilote de l'adjointe.
> **Appui** — *Cadrage* (votre positionnement). Cohérent, pas une affirmation factuelle à prouver.

---

## Règle générale d'argumentation
1. **Un fait produit ne se publie que s'il est visible à l'écran.** Si une fonction n'est pas livrée, on coupe la phrase, on ne l'annonce pas.
2. **On préfère l'affirmation modeste et sûre à l'affirmation forte et fragile.** « Moins d'oublis » plutôt que « plus rien ne vous échappe ». « Beaucoup » plutôt qu'un pourcentage inventé.
3. **Le vécu fondateur est votre socle le plus solide**, parce qu'il ne dépend d'aucune source externe à défendre. On le met en avant partout où c'est possible.
4. **Les affirmations sensibles (sécurité, conformité) se décrivent, ne se promettent pas.** On dit ce qui est en place, pas ce qui serait bien.
5. **Aucun chiffre de performance tant qu'il n'est pas mesuré sur un cabinet réel.**

## À finir avant publication
- Remplir les `[détail]` de la page À propos.
- Trancher : peut-on nommer la cliente ?
- Confirmer les faits vérifiables : délai de bascule, renvoi réglementaire exact, mesure de sécurité réelle, liste des huit points d'inspection.
- Vérifier que chaque **Fait produit** correspond à une fonction réellement livrée, puis retirer toutes les notes **Appui**.
