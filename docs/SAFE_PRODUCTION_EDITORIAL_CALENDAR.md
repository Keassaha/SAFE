# SAFE - Calendrier editorial de production avant push officiel

Date: 2026-06-21  
Objectif: stabiliser SAFE pour une vente pilote accompagnee, en corrigeant les incoherences produit et les risques de confiance avant push officiel.

> Revision 2026-06-21 (v2): ajout de l'interface assistant(e) et de la connexion entre interfaces.
> Le positionnement maitre de SAFE est "copilote du copilote": l'assistant(e) prepare, l'avocat decide,
> l'adoption se fait bottom-up. Un calendrier qui ne stabilise que l'interface avocat rate la moitie du produit.

## 1. Principe de production

Ce calendrier n'est pas une roadmap de nouvelles features. C'est un calendrier de stabilisation.

Regles:

- Corriger les incoherences avant d'ajouter de nouvelles surfaces.
- Max 2 chantiers actifs a la fois (un theme de semaine = un chantier avec sous-taches, pas N chantiers paralleles).
- Chaque chantier doit finir avec une verification claire.
- Les modules internes ou experimentaux doivent etre caches, limites ou documentes.
- La promesse vendable reste: cabinet juridique augmente, comptabilite operationnelle, facturation fiable, conformite fideicommis.
- **La navette est la colonne vertebrale.** Tout module qui produit du travail destine a quelqu'un (document pret, facture a emettre, acte urgent, dossier pret) doit emettre un signal navette. Connecter un module = emettre un message navette, pas batir une nouvelle infra de notification.

## 2. Definition du produit vendable

SAFE devient vendable en pilote quand le cabinet peut fonctionner sans assistance.

### 2a. Parcours avocat (decision et argent)

1. creer son cabinet ou arriver dans un cabinet preconfigure;
2. creer un client;
3. creer un dossier;
4. ajouter du temps, un forfait ou un debours;
5. preparer une facture;
6. verifier que preview, PDF, email et lien public concordent;
7. enregistrer un paiement et l'allouer;
8. voir les creances et les paiements;
9. comprendre ce que SAFE gere comptablement;
10. savoir quoi faire ensuite sur un tableau de bord guide.

### 2b. Parcours assistant(e) (preparation) et connexion

11. arriver sur `/aujourd'hui` et voir une prochaine action claire (deja mature);
12. preparer un dossier et le marquer "pret pour revue" (deja mature);
13. l'avocat voit le travail prepare et approuve ou renvoie, l'assistant voit le renvoi comme prochaine action (cycle deja mature et teste);
14. **tout travail termine dans un module remonte a la bonne personne**: un document passe en "final", une facture brouillon prete a emettre, un acte urgent, doivent apparaitre dans `/aujourd'hui`, dans le coup d'oeil avocat et dans le digest quotidien, sans avoir a ouvrir chaque module un par un.

Le point 14 est la difference entre "un empilement de modules" et "un cabinet qui travaille a deux mains".

## 3. Semaine 0 - Gel et preparation

But: figer le perimetre avant correction.

| Jour | Tache | Livrable | Verification |
| --- | --- | --- | --- |
| J0.1 | Lire et valider `SAFE_PRODUCT_READINESS_COMPARISON.md` | Liste P0/P1 acceptee | Decision utilisateur |
| J0.2 | Creer issue/backlog local P0/P1 | `docs/SAFE_PRODUCT_READINESS_BACKLOG.md` | Chaque item a definition de termine |
| J0.3 | Confirmer si lint est bloquant CI | Decision lint | Build local + pipeline cible connus |
| J0.4 | Confirmer strategie push | Push apres P0 ou apres P1 haut | Decision utilisateur |
| J0.5 | Confirmer la cible pilote: solo seul ou duo avocat + assistant(e) | Decision persona pilote | Determine la priorite de la Semaine 5 (connexion) |
| J0.6 | Identite visuelle RECUE (projet `safe-interface`, design v3 albatre) ; etape fondatrice = adopter le design system avant les chantiers visuels | Tokens + coque + composants adoptes | Voir `SAFE_IDENTITE_VISUELLE.md` ; confirmer rail vs barre du haut |

Decision attendue:

- Push officiel apres correction P0 uniquement, ou
- Push officiel apres P0 + P1 critiques.
- Si le pilote vise un duo avocat + assistant(e), la Semaine 5 (connexion) passe P1-haut.

Identite visuelle (mise a jour 2026-06-22) :

- RECU. Le CEO a fourni un design fini : projet `safe-interface` (Next 15, meme socle que SAFE), design v3 albatre froid. Reference dans `docs/propositions/safe-interface/` et documente dans `SAFE_IDENTITE_VISUELLE.md`. Il remplace toutes les explorations de la session.
- Etape fondatrice ajoutee : AVANT les chantiers visuels, adopter le design system (porter les tokens foret/albatre, la coque a rail, les composants de base), puis re-habiller les ecrans reels un par un. C'est une adoption, pas un copier-coller.
- Les chantiers A (courriels), B (facture) et C (comptabilite) appliquent ensuite ce langage.
- Decisions prises (voir section 14) : rail a gauche adopte (remplace la barre du haut) ; rubrique "Employes Virtuels" etiquetee "a venir".

## 4. Semaine 1 - Confiance facturation et securite publique

Theme editorial: "La facture SAFE est fiable."

Design : on s'inspire du code de `safe-interface` (Card + titre serif, montants en mono, accent foret #0B1F19 sur fond albatre). Voir la section 17 "Design system safe-interface".

| Priorite | Chantier | Description | Definition de termine |
| --- | --- | --- | --- |
| P0 | Adopter le design system safe-interface | S'inspirer de `docs/propositions/safe-interface/` : porter les tokens (foret/albatre/verifie/ambre), la coque a rail et les composants de base (Button, Card, Badge, Pill, Logo, champs) dans l'app reelle. Etape fondatrice : precede les re-habillages d'ecrans. | Tokens + composants du systeme disponibles dans SAFE. |
| P0 | Equivalence facture | Comparer preview, PDF, email attachment, lien public. | Test de contrat vert sur lignes, taxes, total, paye, solde, client, dossier. |
| P0 | Presenter unique | Unifier ou verifier le chemin de presentation facture (la route publique JSON recompute inline aujourd'hui). | Aucune route critique ne recalcule differemment les totaux affiches. |
| P0 | Rate-limit PDF audit public | Proteger `/api/audit-gratuit/[id]/pdf`. | Appel route limite; test ou verification manuelle. |
| P0/P1 | Console interne | Cacher console SAFE Inc. aux cabinets clients. | Acces base sur flag robuste (`User.isInternal`), pas `cabinet.nom === "SAFE"`. |
| P0/P1 | Secrets | Rotation des secrets locaux ayant circule. | Liste secrets tournes; `.env` toujours hors git (verifie: deja gitignore). |

Verification fin S1:

```bash
npx tsc --noEmit
npm run build
npx vitest run lib/services/billing lib/facturation lib/invoice-template
```

Commit suggere:

`fix(readiness): verrouille facture publique et surfaces internes`

## 5. Semaine 2 - Premier usage et ecrans vides

Theme editorial: "Un cabinet neuf sait quoi faire."

Design : reprendre le tableau de bord oriente priorite de `safe-interface` (components/dashboard/sections.tsx : PriorityCard, ComplianceStrip, KpiCard) ; les etats vides utilisent Card + Button du meme systeme. Voir section 17.

| Priorite | Chantier | Description | Definition de termine |
| --- | --- | --- | --- |
| P0 | Onboarding in-app | Cacher d'abord le faux formulaire (micro-action immediate, il donne l'illusion de sauvegarder), puis batir un onboarding qui persiste. Ne pas confondre avec `/api/onboarding` qui est le funnel audit public (emails). | Aucun formulaire ne donne l'illusion de sauvegarder sans le faire. |
| P0 | Etat vide dashboard | Ajouter CTA de demarrage. | Cabinet neuf voit prochaine action claire. |
| P0 | Etat vide clients | CTA creer client + explication courte. | Page vide utile. |
| P0 | Etat vide dossiers | CTA creer dossier, idealement depuis client. | Page vide utile. |
| P0 | Etat vide facturation | CTA ajouter temps/forfait/debours ou creer facture. | Page vide utile. |

Verification fin S2:

```bash
npx tsc --noEmit
npm run build
npm run i18n:keys
```

Test manuel:

- Se connecter avec cabinet neuf.
- Arriver sur dashboard.
- Suivre les CTA jusqu'a client -> dossier -> facturation.

Commit suggere:

`feat(onboarding): guide le premier usage cabinet`

## 6. Semaine 3 - Comptabilite vendable et paiements

Theme editorial: "L'argent est comprehensible."

Design : reprendre de `safe-interface` le TrustCard (fideicommis sur fond foret), Obligations (Barreau B-1 r.5, "Generer l'attestation") et ComplianceStrip. C'est deja le "parler avocat + fideicommis en avant" qu'on vise. Voir section 17.

| Priorite | Chantier | Description | Definition de termine |
| --- | --- | --- | --- |
| P0 | Texte/UX doctrinal compta | Clarifier "comptabilite operationnelle + export comptable" (P0 fusionne #7, a ne pas laisser glisser). | L'avocat comprend ce que SAFE fait/ne fait pas; journaux presentes comme mode expert. |
| P0/P1 | `/comptabilite` hub action | Repenser l'ecran autour de Encaisser, Depenses/Debours, Controle mensuel, Export, Mode expert. | Les journaux ne sont plus le premier signal utilisateur. |
| P1 | Paiements orphelins | Afficher paiements non alloues. | Aucun paiement non alloue important n'est invisible. |
| P1 | Surpaiements | Signaler solde negatif ou trop-payes. | UI propose credit/remboursement ou statut clair. |
| P1 | Recu paiement | Rendre le recu plus visible apres encaissement. | Action visible depuis paiement. |

Verification fin S3:

```bash
npx tsc --noEmit
npx vitest run lib/accounting lib/services/journal lib/services/billing lib/services/finance
npm run build
```

Test manuel:

- Facture ouverte.
- Paiement partiel.
- Paiement complet.
- Paiement non alloue.
- Surpaiement.

Commit suggere:

`feat(compta): clarifie encaissements et controle comptable`

## 7. Semaine 4 - Cycle dossier et documents

Theme editorial: "Le dossier a un debut, un milieu et une fin."

| Priorite | Chantier | Description | Definition de termine |
| --- | --- | --- | --- |
| P0 | Fermeture dossier minimale | Statut cloture + alerte si facture impayee / debours non recouvre. A faire dans la fenetre P0 pour ne jamais exposer un dossier qu'on ne peut pas fermer. | Un dossier peut etre marque ferme et alerte sur ce qui manque. |
| P1 haut | Fermeture dossier complete | Checklist, lettre de fermeture, retention 7/10 ans. | Un dossier peut etre ferme proprement avec document conserve. |
| P1 | Debours dossier | Acces et statut coherents depuis dossier/facturation. | Debours visibles a refacturer/recouvrer/radier. |
| P1 | Doctrine documentaire | Clarifier upload, RichDocument, DossierPiece, pieces facture, preuve paiement. | Une page ou section explique et guide le rangement. |

Verification fin S4:

```bash
npx tsc --noEmit
npm run build
npx vitest run lib/dossiers lib/services/billing lib/actions
```

Test manuel:

- Dossier avec facture impayee ne se ferme pas sans avertissement.
- Dossier avec debours non recouvre alerte.
- Dossier ferme genere trace/document.

Commit suggere:

`feat(dossiers): ajoute fermeture et controle documentaire`

## 8. Semaine 5 - Le cabinet travaille a deux (interface assistant et connexion)

Theme editorial: "Rien de ce qui est pret ne reste invisible."

But: faire en sorte que tout travail termine dans un module remonte a la bonne personne, via la navette qui est deja la colonne vertebrale.

### Etat actuel verifie (a ne pas refaire)

Ce qui est deja MATURE et teste, donc a ne PAS reconstruire:

- `/aujourd'hui` (accueil assistant): prochaine action, inbox navette, focus, echeances. Mature.
- `/gestion/assistante` (file): 5 buckets dont "pret pour revue". Mature.
- Cycle navette bidirectionnel: assistant marque "ready_for_review" -> avocat approuve ou renvoie -> assistant voit le renvoi comme prochaine action. Mature, teste (`lib/navette/*`, `lib/services/ready-for-review-service.ts`).
- Digest courriel quotidien: `lib/notifications/daily-digest.ts` + cron `app/api/cron/daily-digest`, un resume par personne (avocat/assistant), protege par `CRON_SECRET`, alimente par la navette. Existe deja. Ne PAS batir une nouvelle file de notification.

### Le vrai travail: connecter les iles a la navette

Les modules ci-dessous ne remontent a personne uniquement parce qu'ils n'emettent pas de message navette. Des qu'ils en emettent un, ils apparaissent automatiquement dans `/aujourd'hui`, dans le coup d'oeil avocat et dans le digest quotidien.

| Priorite | Chantier | Description | Definition de termine |
| --- | --- | --- | --- |
| P1 (P1-haut si pilote duo) | Edition -> navette | Quand un RichDocument passe brouillon -> final, emettre un message navette "document pret" avec deep link vers le document. | Un document termine apparait chez l'avocat sans ouvrir `/edition`. |
| P1 (P1-haut si pilote duo) | Facture prete -> navette | Quand un brouillon de facture est pret a emettre, signaler l'avocat via navette. | "Facture prete a emettre" apparait comme action, pas seulement dans le dashboard. |
| P1 | Acte urgent -> navette | Quand un acte (LexTrack) a une echeance < 3j ou est en retard, emettre un signal vers l'assistant(e). | Un acte urgent remonte dans `/aujourd'hui` au lieu de rester dans le Kanban. |
| P1 | Accueil avocat oriente action | Sur `/tableau-de-bord`, remonter "pret pour revue" et navette "en attente de vous" au-dessus de la ligne de flottaison, avant les KPI financiers. | L'avocat voit d'abord ce qui attend une decision, puis les chiffres. |
| P1/P2 | Digest: couverture des nouveaux signaux | Verifier que le digest quotidien embarque les nouveaux types de messages navette (il les prendra si emis correctement) et reste distinct par persona. | Le courriel du matin liste documents prets, factures pretes, actes urgents, par personne. |
| P2 | Notifications taches/echeances | Notifier l'assigne a la creation d'une tache; rappel 3j avant une echeance. | L'assigne est prevenu sans recharger la file. |

Verification fin S5:

```bash
npx tsc --noEmit
npx vitest run lib/navette lib/services
npm run build
```

Test manuel (le coeur de la semaine):

- En tant qu'assistant(e): preparer un dossier, marquer pret pour revue, finaliser un document, preparer une facture.
- En tant qu'avocat: ouvrir `/tableau-de-bord` et `/aujourd'hui` et verifier que les quatre evenements (dossier pret, document final, facture prete, acte urgent) sont visibles sans ouvrir chaque module.
- Declencher le digest et verifier qu'un seul courriel par personne resume les bons signaux.

Commit suggere:

`feat(navette): connecte edition, actes et facturation au fil avocat-assistant`

## 9. Semaine 6 - Navigation et coherence UX

Theme editorial: "SAFE raconte une seule histoire."

Design : adopter la coque a rail de `safe-interface` (components/shell/sidebar.tsx) et brancher le FormField unifie sur ses champs (components/ui/form.tsx). Decision a confirmer : rail a gauche (ce design) vs barre du haut actuelle. Voir section 17.

| Priorite | Chantier | Description | Definition de termine |
| --- | --- | --- | --- |
| P1 | Routes heures | Decider `/temps`, `/mes-heures`, `/fiches-de-temps`. | Une logique visible par persona (avocat vs employe). |
| P1 | Routes compta | Decider `/comptabilite`, `/journal/general`, `/journal/depenses`. | Journaux en mode expert ou routes cachees. |
| P1 | Facturation hub | Exposer sous-actions clairement (14 sous-pages aujourd'hui invisibles). | Honoraires, debours, paiements, creances decouvrables. |
| P1 | Modules experimentaux | Cacher ou etiqueter console, impersonation, paie complete. | Aucun module incomplet n'est vendu implicitement. |
| P1 | Menus par persona | Verifier que l'avocat et l'assistant(e) voient un menu coherent avec leur role; aucune page interne ne fuit. | Menu lisible pour avocat, assistante, admin. |
| P1/P2 | FormField | Introduire un composant de formulaire unifie pour nouveaux ecrans. | Au moins les nouveaux correctifs l'utilisent. |

Verification fin S6:

```bash
npx tsc --noEmit
npm run i18n:keys
npm run build
```

Test manuel:

- Parcourir menu avec roles avocat, assistante, admin.
- Verifier qu'aucune page interne ne fuite chez client.

Commit suggere:

`refactor(nav): clarifie parcours cabinet et modules finances`

## 10. Semaine 7 - Demo pilote et QA finale

Theme editorial: "SAFE est montrable et vendable."

| Priorite | Chantier | Description | Definition de termine |
| --- | --- | --- | --- |
| P1 | Seed demo | Cabinet demo avec clients, dossiers, temps, forfaits, debours, factures, paiements, fiducie, documents, ET un duo avocat + assistant(e) avec navette active. | Demo reproductible en local et preview. |
| P1 | Script demo | Scenario de 20 minutes incluant le moment "l'assistant prepare, l'avocat approuve". | Document Markdown utilisable en appel vente. |
| P1 | Guide pilote | "Comment demarrer avec SAFE" pour avocat solo et pour duo. | 1 page simple par persona. |
| P1 | QA finale | Parcours complet avocat + assistant. | Checklist signee. |
| P1 | Push officiel | Pousser branche. | Origin a jour. |

Verification finale:

```bash
git status --short --branch
npx tsc --noEmit
npm run test:run
npm run build
npm run i18n:keys
```

Option lint:

```bash
npm run lint
```

Si lint n'est pas encore corrige, documenter explicitement les erreurs restantes et verifier que CI ne bloque pas dessus.

Commit suggere:

`chore(readiness): ajoute demo pilote et checklist lancement`

## 11. Backlog post-lancement

| Sujet | Pourquoi apres lancement |
| --- | --- |
| OCR preuve Interac | Forte valeur, mais depend du flux paiement deja stable. |
| Stripe Connect / paiement en ligne | Depend de facture/paiement fiable. |
| Paie complete | Trop large pour MVP pilote. |
| Impersonation support | Besoin d'audit trail strict (modele present, zero implementation). |
| Push/notifications temps reel | Le digest courriel existe deja; le temps reel (websocket/push) est une amelioration, pas un prerequis. |
| Notifications taches/echeances avancees | Apres connexion navette de base. |
| Decision RBAC matrice vs helpers (ADR-010) | A parker explicitement; pas bloquant pilote solo, a trancher avant cabinet multi-roles. |
| E2E Playwright complet | A prioriser avant vente publique, pas forcement avant pilote founder. |
| Reduction massive couleurs ad hoc | Qualite UI continue. |
| Reduction `any` | Dette technique progressive. |

## 12. Ordre de commit recommande

1. `fix(readiness): verrouille facture publique et surfaces internes`
2. `feat(onboarding): guide le premier usage cabinet`
3. `feat(compta): clarifie encaissements et controle comptable`
4. `feat(dossiers): ajoute fermeture et controle documentaire`
5. `feat(navette): connecte edition, actes et facturation au fil avocat-assistant`
6. `refactor(nav): clarifie parcours cabinet et modules finances`
7. `chore(readiness): ajoute demo pilote et checklist lancement`

## 13. Definition finale de "pret a vendre en pilote"

SAFE est pret a vendre en pilote quand:

- un cabinet neuf ne tombe plus sur une experience vide;
- une facture est identique en preview, PDF, email et lien public;
- un paiement peut etre enregistre, alloue et compris;
- la comptabilite est presentee comme controle/export, pas comme grand livre;
- la fiducie indique clairement ce qui doit etre fait;
- un dossier peut etre ferme proprement ou au minimum alerter sur ce qui manque;
- l'assistant(e) a un accueil clair et le travail prepare remonte a l'avocat (deja mature);
- tout travail termine dans un module (document final, facture prete, acte urgent) remonte a la bonne personne sans ouvrir chaque module;
- les modules internes sont invisibles pour un client;
- une demo pilote peut etre jouee sans improvisation, y compris le moment "a deux mains".

## 14. Decisions verrouillees (2026-06-22)

Validation 1 (le plan) obtenue. Decisions prises par le CEO :

1. Navigation : rail a gauche (design safe-interface) adopte. La barre du haut actuelle est remplacee.
2. Push : apres P0 + fermeture dossier minimale (ne jamais exposer un dossier qu'on ne peut pas fermer).
3. Onboarding : cacher le faux formulaire tout de suite, puis batir la version qui persiste.
4. Lint : documenter les erreurs restantes, traiter dans un chantier separe (ne bloque pas le push).
5. Pilote : duo avocat + adjointe. La Semaine 5 (connexion assistant-avocat) passe P1-haut.
6. SAFE Pro : parke. Validation marche avant tout build. Ne contamine pas la stabilisation.
7. "Employes Virtuels" : etiquete "a venir", jamais promis comme livre.

Execution : c'est Claude Code qui code. Les "semaines" ne sont donc pas des semaines de calendrier mais des PHASES ordonnees (P1 a P7), chacune = une ou plusieurs sessions de build, chacune fermee par son bloc de verification + une revue du CEO. L'ordre des phases ne change pas.

Cabinet pilote : Derisier Law (cliente actuelle). A confirmer par le CEO.

Validation 2 (les resultats) : a la fin de chaque phase, le CEO regarde le resultat reel avant d'ouvrir la phase suivante. Aucune modification hors calendrier tant que les resultats ne sont pas concluants.

## 15. Note de revision v2

Ajouts par rapport a la v1:

- Parcours assistant et critere de connexion ajoutes a la definition du vendable (section 2b, point 14).
- Nouvelle Semaine 5 dediee a l'interface assistant et a la connexion entre modules; navigation et demo decalees en S6 et S7 (timeline pilote etendue d'une semaine, assumee).
- Correction d'une erreur d'analyse: le digest courriel quotidien existe deja et fonctionne par persona via la navette. Le travail n'est pas de batir une infra de notification, mais de faire emettre des signaux navette aux modules-iles (edition, actes, facture prete).
- Principe directeur ajoute (section 1): la navette est la colonne vertebrale; connecter un module = emettre un message navette.
- Ajustements herites de l'analyse precedente: positionnement compta remonte en P0 visible (S3), fermeture dossier minimale dans la fenetre P0 (S4), decision RBAC parkee explicitement (section 11).

## 16. Initiative separee — SAFE Pro (droit familial, vs Aliform)

Ajout 2026-06-22, a la demande du CEO. Fichiers : `docs/propositions/safe-pro/` (SAFE_VISION_SURPASSER_ALIFORM.md, SAFE_PRO_Vision_Revolutionnaire.md, safe-pro-advanced.jsx).

Ce que c'est :

- Une vision produit distincte : SAFE Pro, un outil de droit familial (calcul de pension alimentaire, scenarios de garde, assistant IA, extraction de documents, jurisprudence predictive) concu pour surpasser Aliform. 10 modules, feuille de route 24 mois, budget ~500k$, equipe a recruter.
- Ce n'est PAS une identite visuelle, et ce n'est PAS le produit actuel (SAFE = gestion de cabinet : clients, dossiers, facturation, fideicommis, comptabilite).

Pourquoi c'est parke separement (et pas dans les semaines de stabilisation) :

- Ce calendrier stabilise le produit EXISTANT pour une vente pilote avant J+90. SAFE Pro est un nouveau produit, pas une finition.
- Le construire maintenant entre en conflit direct avec le mode prechauffage (sur-livrer a une cliente, capturer la preuve, pas de gros nouveau chantier avant la preuve) et avec la regle "finir avant d'ouvrir".
- La vision elle-meme recommande de VALIDER d'abord (Option 2 : MVP rapide ; premiers pas 90 jours = sondage 100 avocats, 20 interviews, Go/No-Go), pas de lancer le grand projet a l'aveugle.

Etape recommandee (validation, pas build) :

1. Decider si SAFE Pro est un produit separe, un futur module de SAFE, ou un pivot. C'est une decision strategique du CEO, distincte de la stabilisation.
2. Si on l'explore : valider le marche (sondage avocats famille QC, interviews, willingness-to-pay) AVANT toute ligne de code.
3. Ne rien retirer du present calendrier tant que SAFE Pro n'est pas valide : la vente pilote du produit actuel reste le cap.

Decision en attente du CEO : SAFE Pro est-il (a) parke pour apres le pilote, (b) un module futur de SAFE, ou (c) un changement de cap qui remplace la stabilisation actuelle ? Tant que ce n'est pas tranche, il reste ici, en initiative separee.

## 17. Design system safe-interface — elements a reprendre par chantier

Demande CEO (2026-06-22) : modifier l'interface de SAFE en s'inspirant du code de `safe-interface`. Reference : `docs/propositions/safe-interface/` et `SAFE_IDENTITE_VISUELLE.md`. Correspondance element -> chantier :

| Element du projet de reference | Fichier (dans safe-interface) | Ou l'appliquer dans le calendrier |
| --- | --- | --- |
| Tokens : foret #0B1F19, albatre #EFF2ED, surface, encre, muet, verifie #2E7D5B, ambre #B07A1C | tailwind.config.ts | Etape fondatrice (S1) : remplacer la palette actuelle |
| Coque a rail + navigation | components/shell/sidebar.tsx | S6 navigation (rail vs barre du haut a confirmer) |
| Composants de base : Button, Card, CardTitle, Badge, Pill, Logo | components/ui/core.tsx | Etape fondatrice (S1), puis partout |
| Champs de formulaire : Field, Input, Select, Textarea, AmountInput, SegmentedControl | components/ui/form.tsx | S6 (FormField unifie), creation client/dossier |
| Tableau de bord oriente priorite : PriorityCard, ComplianceStrip, KpiCard | components/dashboard/sections.tsx | S2 (premier usage, etats vides, dashboard) |
| Encart fideicommis sur fond foret : TrustCard | components/dashboard/sections.tsx | S3 (comptabilite : fideicommis en avant) |
| Etat des obligations (Barreau B-1 r.5, "Generer l'attestation") : Obligations | components/dashboard/sections.tsx | S3 (conformite) et page Conformite |
| Logo sceau (carre foret + "S" serif) | components/ui/core.tsx (Logo) | Etape fondatrice ; favicon, en-tete facture (B), signature courriel (A) |
| Barre d'action fixe, fil d'Ariane + numero attribue | components/shell/action-bar.tsx, page-head.tsx | Creation client/dossier ; tout formulaire |

Regle : on S'INSPIRE du code (memes tokens, memes composants, memes patterns), on ne colle pas la maquette telle quelle. Les ecrans reels gardent leurs vraies donnees et leur logique ; on les re-habille avec ce systeme. `safe-interface` utilise des donnees de demonstration (lib/data.ts) : c'est une reference visuelle, pas un remplacement du code metier.
