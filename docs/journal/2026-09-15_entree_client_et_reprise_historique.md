# 2026-09-15 — Un cabinet qui arrive avec sa clientèle

Ouverture d'un chantier en deux processus, pour Me Dadié, qui commence à entrer ses
clients. Maquettes validées le 14 septembre, priorité 1 livrée en quatre lots le 15.

Relève du §4.1 de la règle de build, supprimer une saisie réelle, et de la file
d'ancrage : le cabinet est au jour 0.

## Ce que vous avez demandé

Deux choses, dans cet ordre.

D'abord **reprendre l'historique** : déposer d'anciennes factures en vrac, en n'importe
quel ordre, et que SAFE en ressorte le client, le dossier, les heures, les dates, les
descriptions, et le statut de paiement. Puis, sur demande explicite, que le désordre du
dépôt ne survive nulle part : tout se range par la date portée par la pièce.

Ensuite **un processus dédié pour entrer les clients**, avec des cases à cocher du genre
« le mandat a-t-il été envoyé », et la consigne d'anticiper ce à quoi vous n'aviez pas
pensé.

## Ce que j'ai trouvé

**La moitié du chemin de la reprise était déjà bâtie.** La lecture d'un document par
vision Claude sans jamais inventer un montant, le rapprochement client/facture avec
confirmation humaine pré-remplie, l'écran d'import avec aperçu ligne à ligne, quatre
types de documents reconnus, l'anti-doublon par empreinte de fichier. Il manque un
cinquième type, « facture passée », et l'écriture dans `Invoice` et `Payment`.

**Les registres d'argent trient déjà sur la date de la pièce**, jamais sur l'heure
d'import : factures sur `dateEmission`, paiements sur `datePaiement`, heures sur `date`,
journal sur `dateTransaction` avec `createdAt` en seul départage. Deux trous seulement :
l'archive de documents de la carte client trie sur l'heure de dépôt, et il n'existe
aucune colonne « date du document » ; et les lignes d'une facture se rangent dans leur
ordre de création.

**Le formulaire « nouveau client » demande onze champs de coordonnées et rien d'autre.**
La base, elle, porte déjà les conflits, la vérification d'identité avec sa méthode et son
échéance, l'occupation, le consentement, le fidéicommis. Ces colonnes existent et ne sont
demandées nulle part au moment où le client entre.

## Ce qui a été construit

Quatre lots, quatre commits.

**A1 — `240b805`.** Dix colonnes additives. Le mandat en trois états (envoyé, signé,
versé au dossier), l'auteur de chaque déclaration en `SET NULL`, l'état d'avancement de
l'entrée, l'objectif du cabinet, et le drapeau `estSoldeOuverture` sur les mouvements de
fidéicommis. Migration écrite à la main : `prisma migrate diff` y ajoutait une dérive
préexistante, dont un `DROP` de l'unicité `TrustReconciliation(cabinetId, periode)`.

**A2 — `c77d727`.** Le module pur qui décide de ce qui reste ouvert, le contrôle d'écart
du fidéicommis, et l'enregistrement en une transaction.

**A3 — `92908bd`.** L'écran, sept questions numérotées, branché sur la vraie base.

**A4 — `aebea46`.** La relance des conflits, tout le monde contre tout le monde.

## Les décisions qui engagent la suite

**Une case cochée est une déclaration, pas une preuve.** Elle porte sa date et le nom de
qui l'a faite. Doctrine reprise de `Invoice.deliveryChannel` : SAFE distingue ce qu'il
détient de ce qu'on lui confie, et les deux sont recevables. Refuser la seconde
traiterait un cabinet qui poste ses mandats comme un cabinet qui n'a rien fait.

**Le solde d'ouverture en fidéicommis ne passe pas par `createTrustDeposit`.** Ce service
refuse un dépôt quand l'identité n'est pas vérifiée, et inscrit une recette au journal
comptable. Appliqués à une reprise, les deux se retournent contre leur but : le refus
pousserait le cabinet à entrer ses clients sans leur solde, et son registre serait faux
pour de bon ; l'écriture au journal daterait une entrée d'argent qui n'a jamais eu lieu,
et le rapprochement bancaire du mois chercherait à la banque une opération introuvable.
L'écriture compte donc dans le solde du client, n'écrit rien au journal, et l'absence de
vérification remonte en tête des manquements de la fiche. Consigner la réalité est
toujours juste : c'est le trou qui doit se voir, pas la somme qui doit s'effacer.

**Rien ne bloque.** Aucun champ obligatoire hormis un nom et un intitulé de dossier. Un
cabinet qui entre trente clients un soir abandonne au troisième refus.

**Le silence n'est pas une réponse.** Zéro échéance voulait dire deux choses opposées,
« il n'y en a pas » et « je ne les ai pas saisies ». La différence est celle entre un
dossier calme et un dossier dont personne ne répond des délais.

**Une seule clé de rapprochement pour les deux côtés du croisement.** La clé de
dédoublonnage trie les mots d'une personne et pas ceux d'une entreprise ; une partie
adverse n'est qu'un nom libre, sans nature déclarée. L'asymétrie faisait que le conflit
le plus grave ne sortait jamais, en silence. Attrapé par les tests avant l'écran.

## Le contrôle qui sauve la reprise

À mesure que les clients entrent, SAFE additionne les soldes de fidéicommis déclarés et
les compare au dernier rapprochement bancaire. L'écart doit se refermer à la fin ; s'il
reste, il y a un client oublié ou une somme à expliquer. Sans ce contrôle, un cabinet
obtient un registre plausible et faux, et c'est ce registre que le Barreau inspecte.

Le panneau ne somme que les écritures d'ouverture, jamais les soldes courants : un
cabinet déjà en service a des mouvements postérieurs à la reprise.

## Ce qui reste

- **Les deux écrans ne sont dans aucun menu.** `Header.tsx` est modifié par une session
  parallèle ; deux mains dans le même fichier finissent mal. Décision CEO en attente sur
  l'emplacement.
- **La priorité 2 attend une vraie facture de Me Dadié** pour éprouver l'extraction avant
  d'investir un écran.
- **Le lot B de la reprise** est découpé et en file : rapprochement, classement
  chronologique avec détection des mois manquants, écran de confirmation, écriture
  marquée « reprise historique », et la colonne `dateDocument` qui corrige le tri de
  l'archive.
- **La dérive migrations ↔ schéma** est confiée à une session séparée.

## Vérifications

Typage vert. 2 201 tests, tous verts. Linter propre sur les fichiers touchés. Chemin
d'écriture éprouvé dans l'application avec un client complet, puis en base : mandat et
auteurs, dossier, partie adverse consignée sans fiche client, échéance, attestation
d'identité avec son lieu de conservation, solde en écriture d'ouverture, et zéro écriture
au journal comptable. Relance des conflits éprouvée sur un cas monté.

Les clients d'essai ont été retirés de la base locale : aucun client fabriqué ne reste
dans un cabinet de démonstration.
