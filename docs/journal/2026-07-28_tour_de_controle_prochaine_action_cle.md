# 2026-07-28 — Tour de contrôle : la prochaine action clé

## Contexte

Analyse de la Console SAFE Inc. (ex-CRM) demandée par le CEO, puis demande explicite :
« Je veux une tour de contrôle avec une sorte de prochaine action clé, c'est très
important pour moi. »

Le manque était réel et documenté par l'analyse : la console affichait un état
(J+X/90, scores, flux d'activités) mais ne disait jamais quoi faire. Aucun champ
« prochaine action », aucune échéance, le modèle `Task` présent en base avec zéro
usage. Le bloc « relances prioritaires » déduisait tout de `dateDerniereActivite`,
donc il signalait l'ancienneté, pas l'intention.

## Ce qui a été construit

### Moteur — `lib/services/crm/prochaine-action.ts`

Calcule les actions clés du workspace et les classe. Deux familles :

- **Tâches explicites** (modèle `Task`) dues aujourd'hui ou en retard. Elles
  gagnent toujours : une décision d'hier bat une heuristique d'aujourd'hui.
- **Actions déduites** de l'état réel du pipeline, sans qu'on ait à les saisir :
  billet de support en attente, lead signé sans cabinet ouvert, essai Stripe qui
  expire, audit complété sans suite, lead chaud qui refroidit, meilleur lead
  jamais approché.

Paliers d'urgence : `TACHE_RETARD 1000 > TACHE_JOUR 900 > SUPPORT 800 >
ACTIVATION 700 > ESSAI 640 > AUDIT 560 > REFROIDISSEMENT 400 > PREMIER_CONTACT 200`.
L'écart entre paliers reste supérieur à ce que l'ancienneté peut ajouter, pour
qu'un ordre de grandeur ne se renverse pas par le seul effet du temps.

Deux règles de silence :
- **Report explicite** : un lead portant une tâche ouverte datée dans le futur
  fait taire toutes ses actions déduites jusqu'à l'échéance. Reporter veut dire
  reporter.
- **Un lead, une raison** : on ne garde que le motif le plus urgent par lead, pour
  qu'un même cabinet n'occupe jamais deux lignes.

### Actions — `app/(app)/console/actions-cles.ts`

- `terminerActionCle` : écrit une trace réelle (`Activity`) et non un simple état
  d'écran. Sans trace, l'action déduite reviendrait à la seconde suivante. Recalcule
  le score au passage.
- `reporterActionCle` : crée (ou déplace) une vraie `Task` datée. Le report est une
  décision, il existe en base et revient de lui-même le jour dit.
- `planifierActionCle` : permet d'imposer sa propre action clé, qui bat toute
  déduction du moteur.

Un billet de support ne se ferme pas depuis la tour de contrôle : il faut avoir
répondu. On n'offre donc aucun bouton qui ferait disparaître un client qui attend.

### Écran — `components/console/TourDeControle.tsx`

Zone 0 de `/console`, avant l'ancre de phase : ce qu'il faut faire passe avant où
on en est. Une seule action en grand (serif, alignée à gauche), la file d'attente
en rail latéral discret. Divulgation progressive avec déclencheurs persistants
(jamais au survol seul, cf. `DESIGN_HUMAIN` H1/MB1).

### Correctif de sécurité inclus

Ajout de `requireConsoleAccess()` dans `lib/safe-inc.ts` : reproduit exactement la
condition du layout (`isInternal` ET rôle admin). Les nouvelles server actions
l'utilisent. Les actions Console préexistantes vérifient toujours seulement
`isSafeIncCabinet`, ce qui reste un écart à corriger (voir « Reste à faire »).

## Vérifié

- `npx tsc --noEmit` : propre.
- Suite de tests : 753 tests verts (1 suite en échec, `server-only` manquant dans
  `lib/dossiers/parties-sync.ts`, pré-existant et sans lien).
- Le moteur exécuté contre la base locale : toutes les requêtes passent, aucune erreur.
- Rendu vérifié au navigateur (desktop 1280 et mobile), les deux divulgations
  progressives s'ouvrent correctement.

## Reste à faire

1. Les server actions Console préexistantes doivent basculer sur
   `requireConsoleAccess()` : aujourd'hui un membre non-admin du cabinet SAFE peut
   les appeler directement.
2. Aucun test sur le moteur de classement. C'est de la logique de priorisation,
   elle mérite des tests.
3. La conversion Lead → Cabinet n'existe toujours pas : `Lead.cabinetId` est lu
   partout, écrit nulle part. Le palier ACTIVATION du moteur restera donc théorique
   tant que ce trou n'est pas comblé.
4. La console pilote encore le préchauffage (J+X/90, bandeaux `PRECHAUFFAGE`) alors
   que la décision du 2026-07-27 est CONVERSION. Aucun compteur des 10 places.
