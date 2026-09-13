# 2026-09-13 — Facturation : le sous-titre part, le tri reste en place, et une facture payée ne peut plus se dire « jamais envoyée » à tort

Quatre consignes du CEO sur l'écran `/facturation`, données captures à l'appui.
Elles rouvrent le rang 1 du chantier, fermé le 2026-09-12 (`ab5d88f`).

## Ce qui a été demandé, mot pour mot

1. « pas besoin de mettre un sous-titre c'est redondant »
2. « quand je clique sur le filtre de total, la page se recharge et retourne vers le
   haut, je veux que ce soit figé en fait »
3. « il manque une logique comptable, je vois qu'une facture qui n'a jamais été envoyée
   est payée dans les statuts, gère cette incohérence comptable »
4. « Les titres doivent être mieux ajustés » — précisé en séance : **les deux**, les
   en-têtes de colonnes et les titres de section.

## 1. Le sous-titre

« Du travail terminé qui attend une facture. Un dossier, une facture. » redisait
« Honoraires à facturer ». Il part, avec sa clé de traduction.

**Gardée, elle** : la phrase du seuil juste en dessous (« Un dossier se propose dès que
son total atteint 100,00 $. Modifier le seuil »). Elle ne répète pas le titre, elle
porte un chiffre réglable et le lien pour le changer. À dire si elle devait partir aussi.

## 2. Le tri qui remontait en haut

Le tri d'une colonne est une navigation vers le serveur : l'adresse porte `sortBy` et
`sortOrder`, et la base fait le tri. Next.js remonte en haut de page à chaque
navigation. On cliquait donc sur « Total » au bas d'un registre de vingt lignes, et on
se retrouvait en haut.

Corrigé dans `components/ui/registre.tsx`, sur le composant partagé : le lien de tri
porte `scroll={false}`. **Les cinq registres du produit en profitent** (factures,
clients, dossiers, employés, et tout registre à venir), pas seulement la facturation.

## 3. L'incohérence comptable

C'est le point sérieux, et **la colonne fautive est celle que j'ai ajoutée le
2026-09-10.**

Elle lisait `Invoice.sentAt`. Ce champ n'est posé qu'à un seul endroit du produit :
l'envoi courriel depuis SAFE (`invoice-send-service`). Une facture postée, remise en
main propre, déposée sur un portail ou envoyée depuis le courriel du cabinet ne le
porte jamais. Elle s'affichait donc « jamais envoyée » alors qu'elle avait été
régulièrement transmise. C'est exactement ce que le CEO a vu : une facture payée, dite
jamais envoyée.

Ce que le produit sait déjà, et que la colonne ignorait : `lib/compliance/invoice-delivery.ts`
tient depuis le 2026-07-30 la doctrine de la transmission, lue sur les textes
(RLRQ c. B-1, r. 5, art. 56(2) ; LSO By-Law 9, s. 9(1)3). Le mot du règlement est
**envoyée**, pas émise, et six canaux comptent, dont cinq que SAFE ne peut que dater
sans les prouver. La vérité vit dans `Invoice.deliveredAt` et `Invoice.deliveryChannel`,
et un écran existe déjà pour la déclarer : Inspection › Transmission des factures.

Trois changements :

- **La colonne lit `deliveredAt`**, la transmission par n'importe quel canal, et
  s'intitule « Transmise le ». Une facture postée cesse d'être accusée à tort.
- **Trois états au lieu de deux.** Transmise : la date, en gris. Jamais transmise et
  rien d'encaissé : « jamais transmise » en ambre, un oubli à rattraper. **Jamais
  transmise alors que de l'argent est entré : en rouge**, avec une infobulle qui cite
  l'article et renvoie à l'écran de déclaration. C'est l'incohérence, et elle se
  distingue maintenant de l'oubli ordinaire.
- **La colonne devient triable**, comme l'émission et l'échéance qui l'encadrent.
  Trier dessus remonte les factures jamais transmises en tête de registre.

Ce que ce lot ne fait pas, et qui reste ouvert : **rien n'empêche encore d'encaisser sur
une facture non transmise.** L'écran le montre, il ne le bloque pas. Bloquer serait un
mur, et la doctrine du module dit pourquoi : un cabinet qui poste ses factures a bel et
bien envoyé sa facturation, et lui refuser le geste le pousse à contourner. La question
à trancher est plutôt : faut-il proposer la déclaration de transmission au moment où on
enregistre le paiement ? À décider, pas à supposer.

## 4. Les titres

**Les en-têtes de colonnes.** La flèche de tri passait à gauche du mot sur les colonnes
alignées à droite et à droite du mot sur « Client » : la même rangée portait deux
conventions. La flèche suit désormais toujours le libellé. Et « Transmise le » était la
seule des trois dates à ne pas se trier ; elle se trie.

Mesuré après coup, dans le navigateur, en comparant le bord droit de chaque en-tête au
bord droit du texte de sa cellule :

| Colonne | Écart |
|---|---:|
| Émission | 0 px |
| Transmise le | 0 px |
| Échéance | 0 px |
| Total | 0 px |
| Solde | 0 px |

**Les titres de section.** « Honoraires à facturer » et « Liste des factures »
paraissaient décalés de quatre pixels vers la gauche par rapport au cadre qu'ils
coiffent. Ils ne l'étaient pas : ils commencent au même pixel. C'est le coin de la
feuille qui rentrait — `.safe-feuille` portait un rayon de 14 px, quand le palier
« panneau » du référentiel (§2.4), employé par toutes les autres surfaces du produit,
est à 10 px. Le rayon passe à 10 px. **Toutes les feuilles du produit se resserrent en
même temps**, et le titre et le cadre se lisent enfin sur la même verticale.

## Vérifications

- Typecheck vert.
- **2 154 tests verts** (180 fichiers).
- Parité FR/EN parfaite.
- Écarts au standard sur `/facturation` : 20 → **18**.
- Capture des trois états sur `/ds-preview/facturation` :
  `docs/journal/captures/2026-09-13_facturation_transmission.png`. La rangée
  « Boulangerie Saint-Roch » porte l'incohérence (payée, jamais transmise, en rouge) ;
  « Constructions Béliveau » porte l'oubli ordinaire (brouillon, jamais transmise, en
  ambre).

## Ce que je n'ai pas pu vérifier

- L'écran réel avec une session ouverte. En particulier : combien de factures du cabinet
  de démonstration portent réellement l'incohérence. La capture le montre sur des
  données fictives.
- Le tri qui ne remonte plus : vérifiable seulement en cliquant sur « Total » au bas du
  registre réel, sur le port 3001.
- L'effet du rayon à 10 px sur les autres écrans à feuille (clients, dossiers, employés,
  paiements, fidéicommis, temps, comptabilité). Le changement est d'un jeton, mais il
  touche tout le produit.
