# Une seule pagination pour toutes les listes

**2026-08-12** · déc. CEO

## Le constat

« Dans mon historique d'entrées, je veux que tu organises cela avec des pages
simples et claires par lot de 20 à chaque fois, pas une liste qu'on scroll
jusqu'en bas car ce n'est pas pratique. Un comme les clients. Je veux que toutes
mes listes ressemblent à cela. »

La fiche de temps rendait **172 entrées d'un coup**. Pour atteindre la plus
ancienne il fallait dérouler tout l'écran, sans jamais savoir où l'on en était.

La cause est structurelle : il existait **trois pieds de pagination recopiés**
(clients, dossiers, employés), et chacun codait en dur le chemin de sa page —
`/clients`, `/dossiers`, `/employees`. Aucun n'était réutilisable ailleurs, donc
toute nouvelle liste repartait sans pagination.

## Ce qui a été fait

**Un seul pied.** `components/ui/registre-pagination.tsx` porte désormais la
mécanique unique, dans son propre module « use client » puisqu'il utilise
`usePathname` — `registre.tsx` ne peut pas le devenir, `RegistreFeuille` étant
rendu par des pages serveur. Deux modes :

- **URL** : des liens `?page=N` sur le chemin courant. Page partageable, retour
  arrière fonctionnel, le serveur ne renvoie que la tranche demandée.
- **local** : `onPageChange` quand les données sont déjà en mémoire. Boutons,
  aucun aller-retour réseau.

Le crochet `usePaginationLocale(items)` fournit la tranche et l'état de page pour
le second mode. Il borne la page au nombre réel de pages : un filtre qui
raccourcit la liste alors qu'on est en page 4 afficherait sinon du vide.

**Les trois pieds existants** sont devenus des enveloppes de quinze lignes qui ne
font plus que traduire. Aucun appelant n'a changé.

**Vingt lignes par page partout**, constante `REGISTRE_TAILLE_PAGE`.

## Les listes reprises

| Écran | Avant | Après |
|---|---|---|
| Fiche de temps | 172 rangées d'un bloc | 9 pages de 20 |
| Paiements | tout d'un bloc | paginé |
| Facturation et suivi | tout d'un bloc | paginé |
| Clients · Dossiers · Employés | paginé, code recopié | paginé, mécanique partagée |

Sur la fiche de temps, la tranche ne concerne **que le tableau**. Les quatre
cartes du haut — semaine, mois, non facturé, taux facturable — continuent de
compter sur la totalité des entrées : un total qui ne porterait que sur la page
affichée serait faux. Le retour en page 1 est déclenché par tout changement de
filtre et par le passage d'un onglet à l'autre.

## Vérification

Fiche de temps vérifiée dans le navigateur avec de vraies données :
« 1–20 sur 172 entrée(s) · Précédent · Page 1 / 9 · Suivant », puis passage en
page 2 qui affiche « 21–40 sur 172 » avec des rangées différentes et « Précédent »
devenu actif.

Paiements et Facturation-suivi sont câblés sur le même composant partagé et
passent le typage, mais **n'ont pas pu être vus remplis** : le cabinet de
développement n'a ni paiement ni facture, les deux écrans affichent leur état
vide.

## Deuxième passe : les six listes restantes

Les six écrans listés plus bas comme « reste à faire » sont maintenant câblés sur
le même pied. Onze tableaux au total, certains écrans en portant plusieurs.

| Écran | Tableaux paginés | Mode |
|---|---|---|
| Journal général | mouvements, vue lisible et vue expert | serveur |
| Notes de crédit | les notes | local |
| Honoraires à facturer | le tableau par client | local |
| Honoraires, détail par client | ébauche de facture, feuilles de temps, débours, tâches forfaitaires | local |
| Débours de dossier | les débours | local |
| Récapitulatif de fin d'année | la liste des employés, et les périodes de paie de chaque employé | local |

**Le journal général était déjà paginé côté serveur, mais par 50 et avec son
propre pied recopié deux fois** (une pour la vue lisible, une pour la vue
expert). Il passe à `REGISTRE_TAILLE_PAGE`, donc 20 comme partout ailleurs, et
les deux pieds disparaissent au profit du composant partagé en mode local :
`onPageChange` déclenche la requête serveur suivante, la tranche continue de
venir de la base. Le compteur d'entrées de l'en-tête reste le total serveur.

**Les totaux n'ont pas bougé de portée.** Sur le détail par client, la facture
calculée, les sous-totaux, les taxes et les cases « tout cocher » continuent de
porter sur les listes entières : c'est la sélection qui décide de la facture, pas
la page regardée. Même chose pour les deux totaux de débours d'un dossier, pour
les quatre tuiles de fin d'année, pour le pied de tableau des périodes de paie,
et pour l'export PDF.

**Retour en page 1 sur changement de filtre**, câblé là où l'écran filtre :
quatre filtres du journal général, cinq filtres des honoraires à facturer, et le
sélecteur d'année de la fin d'année.

## Trouvé au passage, pas corrigé

La page `/temps` déclenche une **erreur d'hydratation React** sans rapport avec
ce chantier : dans `SaisieRapideBlock`, la liste déroulante « Client » du
chronomètre rend `disabled=""` et « + Inscrire un nouveau client » côté serveur,
puis `disabled={false}` et la vraie liste côté navigateur. Une tâche a été
ouverte.

## Reste à faire

Plus de liste connue sans pagination. Ce qui reste est une vérification, pas du
câblage : les six écrans de la deuxième passe **n'ont pas pu être vus dans le
navigateur**. Le serveur de développement redirige vers la page de connexion et
la session doit être ouverte à la main. Ils passent `npx tsc --noEmit`,
`npm run i18n:keys` et ESLint sans écart nouveau, et reprennent le composant déjà
vérifié sur la fiche de temps, mais aucun n'a été vu rempli.

À regarder en priorité quand la session sera ouverte : le journal général, seul
écran de la passe dont la pagination sert des requêtes serveur et dont la taille
de page vient de changer de 50 à 20.
