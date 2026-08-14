# L'espace de Me Dadié tenait un dépôt en fidéicommis qui n'appartenait à aucun compte

> 13 août 2026. Demande du CEO : « finis totalement l'installation de son cabinet
> en entier et enregistre-le dans mon CRM correctement ».

## Ce qui manquait vraiment

Le cabinet `dadie-avocat-qc-2026` était monté depuis le 10 août : 1 utilisateur,
3 clients, 4 dossiers, 13 entrées de temps, 3 factures, l'interface horaire sans
couche assistante. Comparé ligne à ligne au cabinet Cayard, table par table, il
restait **un seul écart bloquant**, et il touchait exactement ce que Me Dadié a
demandé d'automatiser en premier.

### Un dépôt de 1 500 $ sans compte bancaire

`TrustBankAccount` : 0 ligne. `TrustTransaction` : 1 ligne, `trustBankAccountId`
à NULL.

La migration `ch01_trust_bank_account` du 30 juillet reprend l'existant : elle
crée un compte « coordonnées à compléter » pour tout cabinet portant déjà des
écritures. Cayard en a profité. Le cabinet Dadié est né **après** cette reprise,
et `seed-dadie.mjs` écrivait un mouvement de fidéicommis sans jamais créer le
compte qui le porte. Personne ne repasse derrière : l'ouverture d'un compte est
un acte explicite depuis CH-01 (PR-6), rien ne la déduit d'un dépôt.

Conséquences visibles : le panneau rouge « Commencez par déclarer votre compte en
fidéicommis » en tête des onze écrans d'inspection, et un solde client de 1 500 $
rattaché à rien du tout.

### Ce qui n'était PAS un écart

Trois différences avec Cayard se réparent seules, vérification faite dans le code
avant de toucher quoi que ce soit :

| Écart | Pourquoi il ne compte pas |
|---|---|
| `ExpenseCategory` 0 contre 24 | `ensureExpenseCategories` s'exécute au chargement de `/comptabilite` et de `/journal/depenses` |
| `DossierSection` 0 contre 38 | `app/(app)/dossiers/[id]/page.tsx` génère le cartable à la première ouverture du dossier |
| `ForfaitService`, `RegistreTache` à 0 | délibéré : il facture à l'heure, le catalogue de forfaits n'a pas lieu d'exister |

Les pré-créer aurait obligé à recopier une constante TypeScript dans un script
`.mjs`, donc à entretenir deux listes qui divergeraient.

## Ce qui a été fait

### Le compte général, sans inventer un numéro

`upsertTrust` ouvre maintenant `dadie-trust-bank-general`, type GENERAL, libellé
« Compte général en fidéicommis (coordonnées à compléter) », institution et numéro
à « À compléter ». C'est mot pour mot la doctrine de la reprise de l'existant :

> On n'invente NI nom d'institution NI numéro de compte : un faux numéro dans un
> rapport réglementaire serait pire que l'absence de compte.

Le libellé satisfait la mention exigée par l'art. 50 al. 2 et annonce lui-même ce
qui reste à saisir. L'écriture de 1 500 $ y est rattachée, et `currentBalance` se
recalcule depuis la somme du registre plutôt que de s'écrire en dur, le registre
restant l'autorité (PR-1).

`update: {}` sur l'upsert : dès qu'il saisit son institution, son numéro ou
confirme l'entente B-1 r.10, une relance du script effacerait sa saisie.

### Le CRM complété, pas converti

Le lead existait depuis la soumission de l'audit. Ce que le mapping automatique
ne pouvait pas faire est posé dans `syncCrmLead` :

- `raisonSociale` nettoyée. Le formulaire avait laissé « DADIÉ AVOCAT , entreprise
  individuelle » avec espaces parasites, la fiche cabinet portait déjà le nom propre.
  Deux orthographes du même cabinet dans deux écrans, c'est un doublon qui attend.
- `domainesPratique` normalisé (famille, civil, immigration, administratif). Le
  formulaire les recueille en texte libre : ils dormaient en notes privées, donc
  invisibles au filtrage et au score firmographique.
- `ville` = Gatineau, `regionBarreau` = Outaouais, `nbAdjointsEstime` = 0.
- `modeleAdoption` = TOP_DOWN. Solo sans adjointe : l'adoption bottom-up n'a
  personne par qui monter.
- Le contact : `splitName` coupe au premier espace, ce qui donnait prénom
  « Agboko », nom « Jean-Jacques Dadié ». Corrigé en « Agboko Jean-Jacques » / « Dadié ».
- `volumeFacturation` laissé vide : l'audit ne le demande pas, et un chiffre
  d'affaires deviné vaut moins qu'une case vide qu'on saura remplir.

**Ce qui n'a pas été écrit : `cabinetId` et `convertedAt`.** Ce sont les marqueurs
du client signé, et `/console/clients` ne liste que ces lignes. Me Dadié n'a rien
signé, son espace est une démonstration. Les écrire remplirait le pipeline d'un
client qui n'existe pas, et un pipeline auquel on ne peut plus se fier ne sert
plus à rien. La conversion réelle passera par `lib/services/crm/conversion.ts`,
depuis l'écran, à la signature. Il reste donc en AUDIT_COMPLETED / QUALIFIED_AUDIT.

## Ce que l'écran d'inspection dira maintenant

Le panneau rouge de tête disparaît. À sa place, les alertes redeviennent
individuelles, et deux vont s'allumer :

- **Comptes en fidéicommis** : « 1 démarche à faire », ambre. C'est le formulaire
  prescrit de l'art. 51, à transmettre au Barreau et à l'institution. SAFE ne le
  transmet pas, il consigne la date déclarée.
- **Rapport mensuel** : « aucun rapport produit », rouge. Il détient de l'argent
  client depuis juin, aucun rapport de l'art. 41 n'existe. C'est vrai, et aucun
  rapport ne sera fabriqué à sa place : le rapport se certifie, la certification
  est son acte.

En démonstration, c'est la scène à jouer plutôt qu'à cacher : l'outil nomme ce
qui manque, article à l'appui.

## Restes connus, hors périmètre de l'installation

- **Fin d'exercice financier** : `Cabinet.fiscalYearEnd` est NULL, et pas seulement
  chez lui, chez les 7 cabinets de la base. Sans elle, aucune durée de conservation
  ne se calcule. Une entreprise individuelle ferme presque toujours au 31 décembre,
  mais presque toujours n'est pas une déclaration. Ajouté à la liste « à confirmer »
  du cabinet, persistée dans `Cabinet.config`.
- **Le rapport qu'il a reçu annonce 99 $/mois.** Le générateur de rapport n'est
  pas aligné sur l'offre fondatrice du 27 juillet (50 $ pendant 12 mois, puis 79 $).
  L'écart était déjà noté dans le seed, il touche tous les audits, pas seulement
  le sien.
- **Aucune passe visuelle connectée.** Les écrans n'ont été lus qu'à travers la
  base et le code.

## Vérifications

Script rejoué trois fois sur la production : 1 compte en fidéicommis, 1 écriture,
3 activités, 3 clients, 1 contact. Aucun doublon, aucune valeur écrasée.
