# VISION — Interface assistante, navette avocate↔assistante & design TDAH-adhérent

> Statut : **réflexion produit, à valider** (pas encore de spec d'implémentation)
> Date : 2026-05-31
> Liens : `docs/product/ACTIVE_ASSISTANT_LAYER.md`, `docs/product/READY_FOR_REVIEW_SIGNAL.md`,
> positionnement « copilote du copilote » (mémoire projet).

---

## 0. Thèse

SAFE est **la copilote de l'assistante**, qui est elle-même la copilote de l'avocate.
Deux leviers convergents font vivre cette thèse :

1. **La navette** — la collaboration *bidirectionnelle* assistante↔avocate.
2. **Le design TDAH-adhérent** — réduire la charge cognitive, externaliser la mémoire,
   imposer *une action à la fois*.

Ces leviers se renforcent : une bonne navette + un design TDAH = l'assistante **n'oublie
rien** et **n'est jamais submergée**. C'est exactement le ressenti que SAFE doit produire.

---

## 1. État actuel (ce qui existe déjà)

**Forces (déjà en place) :**
- Couche assistante active : file d'attente à 6 buckets, états de préparation *dérivés*
  (jamais saisis à la main), **une seule `nextAction` par dossier**.
- Signal « prêt pour revue » (assistante → avocate), append-only, marquable « vu ».
- `DossierNote` (notes internes, drapeau confidentiel), `DossierTache` (tâches admin
  assignables), `DossierEvenement` (échéances), `RegistreTache` (prép. facturable).
- Permissions fines : l'assistante prépare, ne valide ni facture ni temps.

**Manques (pour une vraie collaboration) :**
- ❌ Aucun **retour avocate → assistante** (« à revoir, il manque X »). Le signal est à sens unique.
- ❌ Pas de **fil de conversation** par dossier (notes sans réponses ni @mention).
- ❌ Pas de **validation par section** (mandat / identité / documents) : l'état est binaire.
- ❌ Notifications quasi inexistantes côté équipe (in-app limité, pas de digest courriel,
  rien sur assignation de tâche / @mention).

---

## 2. La navette (collaboration bidirectionnelle)

Le cœur de la relation avocate↔assistante est un **aller-retour**. SAFE ne modélise
aujourd'hui que l'**aller** (`pret_pour_revue`). On modélise le **retour** et le **fil**.

Primitives proposées, par ordre de valeur/effort :

1. **Renvoi à l'assistante** *(avocate → assistante)* — **miroir** du signal existant.
   L'avocate clique « À revoir », choisit une raison + un texte court + (option) une échéance.
   → crée un manquant `revision_demandee` qui repasse le dossier côté assistante avec
   `nextAction = la demande`. Append-only, traçable. **Petit effort, fort impact.**

2. **Validation par section** *(mandat, identité, documents, débours)* — l'avocate valide
   section par section (« Mandat approuvé ✓ »). Transforme l'état binaire en **progression
   visible** et clarifie « ce qui reste à valider ».

3. **Fil de dossier** *(conversation)* — étendre `DossierNote` en fil : auteur, @mention,
   réponse, `type` (question / info / blocage). Une seule timeline « qui a dit quoi, quand ».
   Les notes confidentielles restent cloisonnées (conformité Barreau).

4. **Notifications** — cloche in-app + **digest courriel** (pas de spam). Déclencheurs :
   prêt pour revue, renvoi à l'assistante, @mention, tâche assignée, échéance J-2.

**Garde-fou doctrine** : « l'assistante prépare, l'avocate décide » reste la frontière.
La navette **fluidifie** l'aller-retour ; elle ne donne aucun pouvoir de décision à l'assistante.

---

## 3. Design TDAH-adhérent

**Pourquoi** : les adjointes juridiques jonglent interruptions, échéances strictes et
multi-dossiers. Un design qui **externalise la mémoire** et **réduit les décisions** aide
tout le monde — et change la vie d'une personne TDAH. SAFE a déjà l'ADN (`nextAction`
unique) ; on le rend **explicite et systématique**.

**10 principes → application concrète SAFE :**

| # | Principe TDAH | Application SAFE |
|---|---|---|
| 1 | **Une action à la fois** | « Focus du jour » : LA prochaine action *tous dossiers confondus*, mode « une carte à la fois » (≠ 6 buckets d'un coup). |
| 2 | **Externaliser la mémoire** | Capture rapide globale (⌘K) : créer tâche/note depuis n'importe où, vider la tête immédiatement. |
| 3 | **Réduire les décisions** | Défauts intelligents (bundles/templates déjà là), pré-remplissage, « actions recommandées » plutôt que menus. |
| 4 | **Rendre le temps visible** *(time-blindness)* | Compte à rebours sur échéances (« dans 2 jours »), pas seulement des dates ; « aujourd'hui / cette semaine » ; couleurs d'urgence. |
| 5 | **Découper (chunking)** | Checklists à petits pas, progression visible (3/7), jamais un mur de champs. |
| 6 | **Flux indulgents** | Autosave partout, annuler (undo), brouillons, pas de cul-de-sac ; ne jamais punir une erreur (confirmations douces, zéro perte de saisie). |
| 7 | **Renforcement positif** | Feedback de complétion (« Dossier prêt ✓ »), compteur de tâches faites aujourd'hui, micro-célébrations sobres. |
| 8 | **Minimiser le context-switching** | Tout faire depuis la carte dossier (actions inline) ; éviter d'ouvrir 5 pages. |
| 9 | **Calme visuel + focus clair** | UI basse stimulation par défaut (règle max 2 couleurs), mais zone de focus évidente ; « mode focus » qui masque le reste. |
| 10 | **Réduire la paralysie page blanche** | Templates, exemples, « commencer à partir de… » (bundles), pré-remplissage. |

**Transversal** : réglages d'accessibilité **par utilisateur** (densité, taille de texte,
réduire les animations, mode focus). Respecter WCAG + `prefers-reduced-motion`.

---

## 4. Convergence — l'écran « Focus du jour » de l'assistante

Le produit phare qui unit les deux axes : un accueil assistante repensé autour de :

- **Aujourd'hui** : LA prochaine action (1 carte mise en avant), file repliée en dessous.
- **Renvois de l'avocate** (retour de navette) en haut, traités **un par un**.
- **Capture rapide** (vider la tête).
- **Progression du jour** (renforcement positif).

Low-stimulation, une-action-à-la-fois, mémoire externalisée, navette intégrée.

---

## 5. Découpage proposé (incréments livrables)

| Lot | Contenu | Effort | Autonome ? |
|---|---|---|---|
| **1 — Navette retour** | « Renvoi à l'assistante » (avocate → assistante), miroir du signal existant + manquant `revision_demandee` | Petit | ✅ |
| **2 — Focus du jour** | Accueil assistante « une action à la fois » + capture rapide (front, réutilise `nextAction`) | Moyen | ✅ |
| **3 — Temps visible & indulgence** | Comptes à rebours d'échéances, états de progression, autosave/undo audités | Moyen | ✅ |
| **4 — Fil & notifications** | Conversation dossier (@mention, réponses) + notifications digest | Grand | dépend de modèle |
| **5 — Réglages accessibilité/TDAH** | Préférences densité / mode focus / reduced-motion par utilisateur | Petit-moyen | ✅ |

**Recommandation** : démarrer par **Lot 1 (navette retour)** *ou* **Lot 2 (focus du jour)** —
les deux sont autonomes, à fort ressenti, et réutilisent l'existant sans gros risque.

---

## 6. Risques & garde-fous

- **Conformité Barreau** : confidentialité des notes, séparation stricte des rôles
  (l'assistante ne décide pas), traçabilité append-only.
- **Ne pas transformer les notifications en surcharge** (l'inverse du but TDAH) : digest,
  contrôle utilisateur, silence par défaut.
- **dev = prod (même DB Supabase)** : tout nouveau modèle = migration Prisma prudente,
  additive, testée.
- **Mesure** : définir un signal de succès simple (ex. délai moyen `pret_pour_revue` →
  validation ; nombre d'oublis détectés avant échéance).

---

## 7. Ancrage recherche — personas réels

> Sources : `Downloads/Profil et attentes des adjoints juridiques au Québec…`,
> `Downloads/Relation avocat–assistant et adoption de SAFE…`. À recopier dans
> `docs/research/` pour pérennité.

**L'avocate propriétaire (la décideuse qui ne se connectera presque pas)**
- **Déléguatrice totale**, épuisée (burnout documenté Barreau QC). Taux d'utilisation
  facturable ~38 %, *lockup* médian 93 jours. Elle a **délégué le problème admin** → SAFE
  est « l'outil de l'adjointe », pas son tableau de bord.
- **Aversion à l'algorithme**, biais de statu quo, aversion au risque, calcul immédiat du
  non-facturable. Elle **n'évalue pas un logiciel** ; elle **fait confiance à son adjointe**
  et valide quand elle voit un **risque** qu'elle veut éviter (inspection, erreur client, cash).
- Déclencheurs : risque réglementaire concret · recommandation d'un pair · **chiffre propre**
  (pas de stat générique).
- **Implication navette** : la revue avocate doit être un **briefing de 15 secondes** en
  langage risque/argent (« Dossier prêt · identité ✓ · mandat signé · 0 manquant »), pas une
  todo. Le renvoi (avocate → adjointe) doit être **quasi sans friction** (1 tap + raison
  courte/vocale). Les notifications avocate = **digest glanceable, mobile**, jamais de spam.

**L'adjointe juridique (l'utilisatrice principale, le champion d'adoption)**
- Fierté du rôle de **bras droit** ; identité forte. **Reconnaissance rare** : son travail est
  invisible quand il fonctionne, visible seulement quand il y a une erreur.
- Formée **procédure/documentaire**, *pas* comptabilité/fidéicommis → **zone de vulnérabilité** ;
  elle **porte seule le risque** d'une inspection ratée.
- **Peur n°1** : commettre une erreur qui **expose l'avocate** à une sanction Barreau.
  Peur n°2 : être remplacée par l'outil.
- Veut **plus de contrôle, pas moins** ; des rapports impeccables **sans effort supplémentaire** ;
  **« ne pas travailler le soir du 30 »**. Barrière d'adoption décisive = **courbe
  d'apprentissage** (prise en main < 30 min, gains visibles dès la semaine 1).
- Modèle champion : elle **expérimente → mesure un gain → le présente à l'avocate** en langage
  risque/argent. SAFE doit lui **fournir cet argumentaire clé en main**.

---

## 8. Les deux cœurs émotionnels (ce que SAFE doit faire RESSENTIR)

La recherche recadre les deux axes : ce ne sont pas des features, ce sont des **émotions à produire**.

| Persona | Émotion actuelle | Émotion cible SAFE | Mécanique |
|---|---|---|---|
| **Adjointe** | Angoisse de fond (« est-ce que j'ai oublié quelque chose ? ») + sous-reconnaissance | **« Rien n'est oublié »** + sentiment d'être vue | Filet anti-omission (manquants) en promesse centrale ; reconnaissance structurelle |
| **Avocate** | Charge mentale, méfiance, manque de temps | **« Tout est sous contrôle, mon cabinet est protégé »** d'un coup d'œil | Briefing de revue 15 s, digest risque/argent |
| **Le duo** | Friction admin, dépendance à la mémoire | **Confiance fluide** | La navette rend le travail de l'adjointe **lisible et crédible** |

Le **pont, c'est la confiance**. L'avocate valide par confiance ; la navette existe pour rendre
le travail de l'adjointe **immédiatement légitime** aux yeux d'une avocate pressée et averse au risque.

---

## 9. Navette, recadrée — un « pont de confiance » (pas un routeur de tâches)

- **Revue = briefing de dossier**, pas une todo : statut, manquants à zéro, identité ✓, mandat ✓,
  facturable prêt. L'avocate comprend en 15 s et acquitte en 1 clic.
- **L'acquittement de l'avocate (« vu ✓ ») = un moment de reconnaissance** rendu visible côté adjointe.
- **Renvoi avocate → adjointe = friction minimale** (1 tap, raison courte ; idéalement dictée).
- **Digest avocate** : glanceable, mobile, langage risque/argent (« 2 dossiers prêts à valider ·
  1 échéance audience dans 3 j · 0 alerte conformité »).

## 10. TDAH, recadré — l'angoisse comme métrique (pas la « productivité »)

Le but premier du design TDAH ici n'est **pas** « gagner du temps » (message qui ne résonne pas) —
c'est **réduire l'angoisse** d'omission et d'échéance, et **rendre le travail visible**.

- **« Rien n'est oublié »** : le système de manquants devient la **promesse d'accueil** de l'adjointe
  (filet de sécurité), pas une liste de reproches. Chaque manquant capté = angoisse dissoute.
- **« Rendre le 30 visible »** : désamorcer la panique d'échéance (compte à rebours, préparation
  anticipée mois-end / audience / biométrie **des jours à l'avance**).
- **Reconnaissance = renforcement positif structurel** (pas un gadget) : bilan sobre
  (« cette semaine : 4 dossiers prêts · 0 oubli · 1 dossier inspection-ready »).
- Reste valable : une-action-à-la-fois, capture rapide, flux indulgents (autosave/undo), mode focus
  low-stimulation, défauts intelligents (anti page blanche).

## 11. Nouvelles idées produit issues de la recherche

1. **Briefing de revue** — la revue avocate condensée en un encart 15 s (sert l'aversion au risque + le manque de temps).
2. **Rapport champion (1 clic)** — « ce qui est prêt / ce qui est protégé / temps gagné », en langage risque/argent, que l'adjointe peut montrer à l'avocate. Sert **l'adoption** ET la navette.
3. **Défuseur d'échéances** — le « soir du 30 » anticipé : SAFE prépare proactivement les échéances récurrentes (rapprochement, dépôts, audiences).
4. **Surface de reconnaissance** — bilan hebdomadaire sobre de l'adjointe (rend visible l'invisible).

## 12. Re-priorisation à la lumière de la recherche

Le **Lot 1 (navette retour)** reste pertinent, mais le **plus fort levier émotionnel** — et le
**moins coûteux** (réutilise `nextAction`/manquants existants, quasi aucun nouveau modèle) — est de
**recadrer l'accueil de l'adjointe autour de la promesse « rien n'est oublié »** + un **briefing de
revue** côté avocate. Cela sert **les deux personas** et **la confiance** d'un coup.

→ « **Lot 0** » conceptuel suggéré : *Accueil « rien n'est oublié » + briefing de revue* (fort
ressenti, faible risque technique), avant d'introduire de nouveaux modèles (renvoi, fil, notifs).

> **MàJ 2026-06-01** : intégration de la recherche `RECHERCHE_module_taches_fil_execution_TDAH.md`
> (Module Tâches + Fil d'Exécution). Voir sections 14-15 — elle donne la forme concrète du Lot 0 et
> identifie **le différenciateur unique : le bloc « Où j'en étais ? »**.

---

## 13. Approfondissement — le moteur anti-oubli (« rien n'est oublié »)

### 13.1 Pourquoi c'est LE différenciateur
L'adjointe **porte seule** le risque d'omission (la recherche est explicite : invisible quand
ça marche, blâmée quand ça casse ; elle craint avant tout l'erreur qui expose l'avocate).
Word, Outlook et Excel **stockent** de l'information ; ils ne **surveillent** rien. Le seul
service qu'aucun outil généraliste ne rend, c'est : *« voici ce qui va te tomber dessus si tu
n'agis pas ».* C'est exactement la couche de manquants déjà amorcée dans SAFE — il faut
l'**élargir, l'anticiper, et la cadrer comme un filet, pas comme un reproche**.

### 13.2 Taxonomie réelle des oublis (cabinet solo)
Six familles. Instanciées sur **Derisier (immigration ON / IRCC)** + le marché **QC (fidéicommis)**.

| Famille | Exemples concrets | Signal de détection | SAFE aujourd'hui | Fenêtre / cadence |
|---|---|---|---|---|
| **1. Échéances procédurales/légales** | délai de dépôt, audience, prescription, biométrie | `DossierEvenement` + dates | ✅ partiel (échéances 14 j) | anticipation J-14 → J-1, compte à rebours |
| **2. Immigration / IRCC** | **expiration de portail (frais 375 $ du mandat !)**, fenêtre de soumission, correspondance IRCC à relire, accusé de réception | dates de portail, statut de soumission | ❌ pas modélisé | proactif, dès réception d'une échéance IRCC |
| **3. Fidéicommis / compta (QC)** | **rapprochement mensuel**, dépôt inscrit à la **date réelle**, carte-client à jour, **« le soir du 30 »** | calendrier mensuel récurrent | ❌ (module compta séparé) | récurrence mensuelle, prép. J-3 |
| **4. Conformité dossier** | vérif identité, **conflit**, mandat signé, mode de facturation, débours non saisis, sections cartable | `preparation-status` (manquants) | ✅ en place | continu (état dérivé) |
| **5. Suivi client** | relance signature, document manquant, **client sans réponse depuis N jours**, paiement attendu | dernière interaction + état | ⚠️ partiel (`en_attente_client`) | relance auto J-3 / J-7 |
| **6. Cash / facturation** | **factures impayées (lockup médian 93 j !)**, temps non facturé, travail rendu non capturé | statut facture + temps | ⚠️ partiel | hebdo + alerte seuil |

**Lecture** : SAFE couvre déjà solidement la famille 4 (conformité dossier) et partiellement 1, 5, 6.
Les **angles morts à fort impact** sont la **famille 2 (IRCC — directement le métier de Derisier)**
et la **famille 3 (le « soir du 30 » fidéicommis — le pain n°1 du marché QC)**.

### 13.3 Réactif → proactif : le « défuseur d'échéances »
La couche actuelle est surtout **réactive** (elle constate un manquant). Le saut de valeur =
**anticiper les récurrences** :
- récurrences **datées** (rapprochement mensuel, renouvellements, biométrie) → préparées
  automatiquement *des jours à l'avance*, pas découvertes le jour J ;
- **portails IRCC** : dès qu'une échéance de portail est connue, compte à rebours + relance
  documents client calibrée pour ne **jamais** payer les 375 $ de réinitialisation.
Le « soir du 30 » devient un **non-événement** : tout est prêt le 27.

### 13.4 Cadrage anti-angoisse (le ton compte autant que la détection)
- L'accueil n'est **pas** une liste de reproches : c'est un **filet**. État de repos visible =
  **« 0 oubli aujourd'hui »** (et on le *célèbre* sobrement — renforcement positif).
- Chaque manquant est formulé en **action unique** (verbe + cible), jamais en mur de problèmes.
- Sévérité **lisible** (bloquant / critique / à surveiller) → l'adjointe sait *quoi d'abord*
  sans décider (réduction de charge cognitive = principe TDAH).
- Le manquant capté **avant** l'échéance = angoisse dissoute. C'est *ça* le produit.

### 13.5 Lien avec les notifications (anti-surcharge)
Un oubli ne déclenche pas forcément une alerte. Règle proposée :
- **Immédiat** (rare) : seulement le **bloquant à échéance proche** (audience J-1, portail qui
  expire demain). Sinon, **silence**.
- **Digest** (défaut) : tout le reste regroupé (1 résumé/jour adjointe, 1 digest avocate).
- **Jamais** : notifier un manquant non daté ou non actionnable.
> Sur-notifier trahirait le but TDAH (ça *crée* de l'angoisse). Le silence est la valeur par défaut.

### 13.6 Conformité (garde-fous)
- Famille 3 (fidéicommis) touche la **compta réglementée** : la détection *signale* (« rapprochement
  du mois non fait »), elle ne *fait* pas le jugement comptable — l'humain reste responsable.
- Séparation des rôles préservée : l'adjointe est **alertée et prépare** ; l'avocate **valide**.
- Tout signal anti-oubli est **traçable** (qui a vu quoi, quand) — utile en cas d'inspection.

### 13.7 Ce que ça implique côté produit (incréments)
1. **Étendre la taxonomie de manquants** aux familles 2 (IRCC) et 5/6 (relances, cash) — réutilise
   le moteur `preparation-status` existant.
2. **Récurrences anticipées** (défuseur) — nouveau, mais petit : un calendrier de récurrences par
   type de dossier/cabinet.
3. **Accueil « rien n'est oublié »** — recadrage UI de la file existante autour de la promesse +
   état de repos « 0 oubli ».
4. **Calibrage notifications** (immédiat/digest/silence) — couche transverse, à faire *avant* d'ouvrir
   les vannes de notifications.
```

---

## 14. Module « Tâches + Fil d'Exécution » — réconciliation avec l'existant SAFE

La recherche propose un schéma greenfield (`tasks`, `activity_log`, `matters`…). **SAFE en a déjà ~50-60 %.**
Le prendre au pied de la lettre **dupliquerait** des modèles existants. On **mappe** plutôt.

| Concept de la spec | Déjà dans SAFE | Écart à combler |
|---|---|---|
| `tasks` (statut, assignee, priorité, échéance) | ✅ `DossierTache` | sous-tâches (1 niv.), `is_next_action` matérialisé, `template_id`, heures est./réelles |
| `activity_log` (append-only) | ✅ `AuditLog` + `DossierReadyForReviewSignal` (append-only) | **fil par dossier lisible humainement**, types d'événements riches, `actor_type='ia'`, hash chain (V3) |
| `task_templates` (listes par type) | ⚠️ partiel (bundles / forfaits) | génération auto de liste de tâches à l'ouverture |
| `task_dependencies` | ❌ | net-new (V2, simple `bloque_par`) |
| **`context_snapshots` (« Où j'en étais ? »)** | ❌ — mais `preparation-status.nextAction` + manquants + `AuditLog` = **matière première** | **net-new — LE différenciateur** |
| Vue 1 — dashboard dossier | dossier detail + `AssistantQueueView` | **bloc reprise + fil unifié** |
| Vue 2 — « Mes tâches » | `AssistantQueueView` (buckets) | vue perso Aujourd'hui/Semaine/Retard |
| Vue 3 — supervision | `AssistantQueueView` (scope « all ») | **rollup chiffré par assistant** + dernière action |
| Vue 4 — journal global | `AuditLog` (existe, non exposé) | UI filtrable + export conformité |
| `is_next_action` | `preparation-status.nextAction` (dérivé) | concept déjà là, à exposer |

**Conclusion** : le différenciateur (« Où j'en étais ? ») et le fil par dossier sont **constructibles sur les
données existantes** (audit log + nextAction + manquants), en logique dérivée — **sans migration lourde** au départ.

## 15. Chemin rapide (« évoluer vite ») — 3 tranches qui réutilisent l'existant

| Tranche | Quoi | Réutilise | Migration ? | Pourquoi en premier |
|---|---|---|---|---|
| **T1 — « Où j'en étais ? »** | Bloc de reprise de contexte par dossier (déterministe) : dernière action, prochaine action, # en retard / bloqués | `AuditLog` + `nextAction` + manquants | **Aucune** (dérivé) | **Le différenciateur que personne n'a** + cœur TDAH (mémoire externalisée). Faible risque, fort ressenti. |
| **T2 — Fil d'exécution par dossier** | Timeline lisible humainement des actions du dossier (ordre antéchrono, entrées système vs humaines distinctes) | `AuditLog` (+ enrichir les event types) | légère (libellés/types) | Rend l'invisible visible (reconnaissance) + base de la supervision. |
| **T3 — Vue supervision chiffrée** | Rollup par assistante : complétées / en cours / en retard + dernière action | `DossierTache` + `AuditLog` | aucune (agrégation) | Côté propriétaire : « qu'a fait l'équipe » d'un coup d'œil (la navette, vue avocate). |

Puis seulement ensuite (V2) : templates de tâches auto, dépendances, résumé LLM du bloc reprise, export
conformité, hash chain. **Ne pas migrer avant T1** : on prouve la valeur sur du dérivé d'abord.

**Recommandation de démarrage : T1 — le bloc « Où j'en étais ? »**, déterministe, zéro migration,
sur un dossier réel. C'est le plus fort signal de différenciation pour le plus faible risque.
