# 2026-08-04 — Les portes : premiers écrans de conformité et section Inspection

Suite de la [réévaluation du 2026-08-03](../compliance/REEVALUATION_2026-08-03.md), qui
constatait qu'**un seul service de conformité sur douze avait un écran**. Le moteur était
complet, le cabinet n'y accédait pas.

## Ce qui a été livré

| | Article | État |
|---|---|---|
| Socle commun des écrans | — | livré |
| Rapport mensuel | art. 41 / s. 18(8) | livré la veille |
| Trousse d'inspection | art. 29, 30, 33 | livré |
| Registres imprimables | art. 30 / par. 21(2) | livré |
| Soldes débiteurs | art. 59, 60 / s. 14 | livré |
| Espèces | art. 69 à 73 / s. 19 | livré |
| Autres biens | art. 43 à 46 / s. 18(9) | livré |
| Rapport annuel, cycle de vie, conservation | art. 42, 7, 9, 29-33 | à faire |

Plus le **découplage émission / transmission de facture** (CH-13), qui refermait le
dernier trou touchant l'argent des clients.

## Trois décisions de produit

**SAFE n'envoie pas la déclaration d'espèces.** Il suit l'échéance de trente jours et
consigne la date que l'avocate inscrit. Envoyer à sa place une déclaration signée au
directeur de l'inspection serait poser un acte professionnel à sa place.

**Pas de formulaire de prise de possession sur l'écran des autres biens.** L'art. 43
impose l'inscription « dès réception » : le geste se fait au dossier, au moment où le
bien arrive. Un formulaire ici inviterait à régulariser après coup, c'est-à-dire en
retard.

**Le bouton de la trousse reste actif même avec des pièces manquantes.** Le désactiver
serait du sur-blocage : une trousse incomplète remise en connaissance de cause vaut mieux
qu'aucune trousse, et le manifeste porte la liste des trous. C'est à l'avocate de
décider.

## Ce que le CEO a vu avant moi

**Le classement était faux.** J'avais rangé les six écrans sous « Comptes en
fidéicommis » parce que j'avais commencé le travail par là. Or quatre des neuf registres
ne concernent pas l'argent des clients — journal d'administration, livre des honoraires,
listes de dossiers actifs et fermés — et la trousse d'inspection rassemble tout ce qu'un
inspecteur demande.

Correction : une section **Inspection**, dont la page d'accueil affiche ce qui réclame
l'attention plutôt qu'une liste de liens. Le classement suit désormais la question posée
— « qu'est-ce qu'un inspecteur va me demander ? » — et non la structure du code.

**Le menu que je modifiais n'était pas celui qui s'affiche.** L'entrée avait été ajoutée
à `SidebarNav.tsx`, qui n'alimente que le tiroir mobile. Le menu visible est le `Header`,
en haut, avec sa propre définition. L'entrée était invisible là où elle comptait.

**Le sidebar gauche n'existait plus qu'en fichier.** `components/layout/Sidebar.tsx`
n'était importé par personne. Supprimé.

## Un risque nommé, non corrigé

**La navigation est définie deux fois** : `Header.tsx` pour le bureau, `SidebarNav.tsx`
pour le tiroir mobile. Rien ne garantit qu'elles restent d'accord, et elles ne l'étaient
déjà plus. Les deux sont à jour aujourd'hui ; les unifier reste à faire.

C'est la même classe de problème que les deux systèmes de permissions (`UserRole` et
`EmployeeRole`) relevés au §4.1 de la réévaluation : une vérité écrite deux fois finit
par diverger, et aucun test ne le voit.

## Vérifications faites

Deux passes visuelles dans le navigateur, sur des données volontairement imparfaites
plutôt que sur un mois exemplaire. Défauts trouvés et corrigés :

- deux actions primaires concurrentes sur le rapport mensuel ;
- pastille « plus de 6 mois » mangée par la troncature, invisible au moment où elle sert ;
- « 0 lignes » au lieu du singulier français ;
- le seul filet vertical de l'écran ;
- texte courant en drapeau à droite ;
- **débordement horizontal de 7 px sur mobile**, invisible à l'œil, trouvé en interrogeant
  le DOM ;
- **fond teinté du panneau d'alerte dépendant de l'ordre du CSS généré** et non de l'ordre
  des classes écrites, donc appliqué de façon non garantie.

Un seed de démonstration (`scripts/seed-trust-demo.ts`) passe par les vrais services et
refuse tout cabinet non marqué `isTestCabinet`. Il a prouvé son utilité du premier coup :
le contrôle d'unicité de la séquence de chèques a refusé une double inscription que
j'avais écrite par erreur.

## État

**1 403 tests verts, build propre.** Capacité réelle de production estimée à environ
22 documents sur 25, contre 6 la veille.

## Reste

Trois écrans (rapport annuel, cycle de vie, conservation et accès inspecteur), l'écran de
déclaration de transmission du CH-13, l'unification des deux navigations, et les deux
points structurels de la réévaluation : les deux systèmes de permissions et le solde du
journal faux en cas d'antidatation.
