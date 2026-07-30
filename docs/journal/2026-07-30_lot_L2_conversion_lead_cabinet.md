# 2026-07-30 — Lot L2 : conversion Lead → Cabinet

## Le trou refermé

`Lead.cabinetId` était lu partout (tableau de bord, page clients, pipeline, audits) et écrit
nulle part. Conséquences : les étapes SIGNED, ACTIVATION et LIVE étaient décoratives, et
`/console/clients`, qui filtre sur `cabinetId != null`, serait resté vide indéfiniment.
C'était le seul lot vraiment bloquant du MVP.

## Décision prise sans réponse du CEO

Question posée en fin de lot L1, restée sans réponse : l'invitation part-elle
automatiquement à la conversion ?

**Tranché : non.** La conversion crée le cabinet et prépare une invitation *en attente*.
L'envoi est un second geste, depuis la fiche. Cohérent avec la règle qui tient partout
ailleurs, aucune communication externe sans validation humaine, et avec le bon sens : on
n'envoie pas un accès à un espace qui n'est pas encore configuré. Facile à inverser si le
CEO préfère l'inverse.

Conséquence de conception : **aucun compte utilisateur n'est créé**. Le modèle `Invitation`
existait déjà, avec son jeton et son parcours `/rejoindre/[token]`. L'avocate crée son
propre compte et choisit son mot de passe. SAFE Inc. ne manipule jamais de mot de passe.

## Ce qui a été construit

### `lib/services/crm/conversion.ts`

Une transaction unique, dix écritures :

1. le `Cabinet`, avec nom, coordonnées, forfait et fin d'exercice
2. l'`Invitation` d'administrateur, jeton de 64 caractères, 72 h, **non envoyée**
3. `Lead.cabinetId`, `convertedAt`, `statutLead = ACTIVE_CUSTOMER`,
   `stageLead = ACTIVATION_IN_PROGRESS`
4. l'`ActivationChecklist` en `upsert` (`leadId` est unique)
5. les tâches de prospection ouvertes passées en `ANNULEE` avec date de clôture,
   jamais supprimées
6. les tâches d'intégration, 8 ou 9 selon le fidéicommis, échelonnées sur 45 jours
7. une `Activity` de conversion sur le lead
8. une entrée `AuditLog` portant l'origine, le lead et l'auteur

Garde-fous **avant** la transaction, pour échouer tôt et sans rien créer : lead existant,
pas déjà converti, étape SIGNED, nom non vide, adresse valide, fin d'exercice au format
MM-JJ, et adresse d'invitation pas déjà rattachée à un compte existant (sinon l'invitation
serait impossible à accepter).

`Lead.cabinetId` étant `@unique`, une double conversion est de toute façon impossible au
niveau de la base.

### Écrans

- `/console/clients/[id]/convertir` : formulaire prérempli depuis la fiche. Il annonce ce
  qui va être créé avant de le créer, y compris le nombre de tâches de prospection qui
  seront annulées. Une action qui touche neuf tables mérite d'annoncer sa portée.
- `BandeauConversion` en tête de la fiche, trois états dont un seul s'affiche : à convertir,
  invitation en attente, actif. Chaque état porte l'action qui débloque la suite, et rien
  d'autre.
- Si l'étape n'est pas SIGNED, l'écran l'explique au lieu d'afficher un formulaire inerte.

### Envoi de l'invitation

Action séparée `envoyerInvitationAdmin`. Une invitation expirée est prolongée à l'envoi
plutôt qu'expédiée telle quelle : sinon le destinataire clique sur un lien mort.

## Vérifié

- **14 tests** dans `lib/services/crm/__tests__/conversion.test.ts` : garde-fous, contenu de
  chaque écriture, annulation des tâches sans suppression, variante fidéicommis, contenu du
  journal d'audit, et le fait qu'un échec en transaction ne remonte jamais un succès.
- **Essai réel contre la base locale** : les dix écritures rejouées dans une transaction
  volontairement annulée. Toutes acceptées par le schéma, **0 trace résiduelle**. Les tests
  à client mocké ne prouvent pas qu'un enum ou une clé étrangère passe ; celui-là si.
- `npx tsc --noEmit` : entièrement propre.
- Suite complète : **803 tests verts**. La seule suite en échec est l'erreur de collecte
  `server-only` préexistante.
- Route `/console/clients/[id]/convertir` compilée par le serveur de dev, sans erreur de
  build. La seule erreur au log est « Non authentifié » depuis le layout Console, c'est la
  garde du lot L1 qui fait son travail.

## Incident de vérification à connaître

Le premier essai réel a échoué sur `cabinet.create`, champ `fiscalYearEnd` inconnu, alors
que `tsc` était vert quelques minutes plus tôt. Cause trouvée : **une autre session
travaille en parallèle dans le même dossier** et avait régénéré le client Prisma depuis un
état intermédiaire du schéma. Le champ existe bien dans `schema.prisma` et dans la migration
`20260730120000_ch00_trust_compliance_guards`.

`npx prisma generate` a resynchronisé le client, et tout est passé. Ce n'était donc pas un
défaut du lot, mais le client généré est un artefact partagé : tant que deux sessions
écrivent dans ce dossier, `tsc` et la suite peuvent mentir dans les deux sens.

## Non vérifié

Pas de parcours au navigateur : la conversion exige une session interne admin, et je ne me
connecte pas moi-même. À confirmer par le CEO à la prochaine connexion, sur un lead de test
passé à SIGNED.

## Reste ouvert

- Le forfait proposé vient de `PLANS` (Essentiel 89 $, Professionnel 149 $). La décision CEO
  du 2026-07-27 fixe l'offre fondatrice à 50 $ et 75 $ pendant 12 mois, puis 79 $ et 119 $
  gelés. **Les forfaits Stripe ne reflètent pas encore cette décision.** À traiter au lot L9,
  bascule conversion.
- L'`ActivationChecklist` est créée vide. Son instanciation depuis le bundle recommandé
  demande une correspondance bundle → étapes qui n'existe pas encore.

## Suite

L3 : consentement tracé, adresse postale LCAP, anti-doublon d'envoi. C'est ce qui débloque
le premier envoi légal en volume.
