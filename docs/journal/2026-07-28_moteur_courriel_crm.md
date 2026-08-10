# 2026-07-28 — Moteur de courriel du CRM

## Décisions cadrées avec le CEO

Trois choix tranchés avant de coder :

1. **Qui parle à qui** : SAFE Inc. vers ses cabinets clients et ses prospects, depuis
   la Console. Ce n'est pas une feature produit pour les cabinets.
2. **Canal** : courriel 1:1 avec gabarits, en premier. Pas de séquences automatiques
   pour l'instant.
3. **Envoi** : brouillon à valider, toujours. Le moteur prépare, le CEO relit, puis
   envoie.

## Ce qui existait déjà et n'a pas été refait

Resend est branché depuis longtemps (`lib/email.ts`), le chat in-app bidirectionnel
existe pour les cabinets clients, `LeadContact` porte déjà `email`, `emailStatut` et
`doNotContact`, et `Activity` sait journaliser `EMAIL_ENVOYE` / `EMAIL_OUVERT` /
`EMAIL_BOUNCE`. Le socle était là, relié à rien. Aucune migration n'a été nécessaire.

## Ce qui a été construit

### Gabarits — `lib/crm/gabarits.ts`

Six gabarits : premier contact, invitation à l'audit, suite d'audit, relance posée,
place fondatrice, suivi de consultation. Voix SAFE : « vous », ton posé, aucun levier
de peur, aucun tiret long en milieu de phrase, le cabinet en héros.

Les gabarits vivent dans le code et non en base. Ils font partie du message de
l'entreprise : ils méritent d'être versionnés et relus comme du copywriting, pas
édités à la volée dans un formulaire.

### Moteur — `lib/services/crm/courriel.ts`

`construireCourriel` ne touche à rien et sert autant à l'aperçu qu'à l'envoi. C'est
ce qui garantit que le message relu est exactement celui qui part : l'écran ne peut
pas faire envoyer autre chose que ce qu'il a montré.

Trois refus durs avant tout envoi : contact désabonné (`doNotContact`), adresse
absente, adresse `INVALIDE` ou `BOUNCE`.

Après envoi : `Activity` de type `EMAIL_ENVOYE` avec le sujet et le corps réels,
`dateDerniereActivite` rafraîchie, score recalculé. Le courriel nourrit donc
directement la tour de contrôle et le pipeline.

### Conformité LCAP — `lib/crm/desabonnement.ts` + `app/desabonnement/`

La loi canadienne anti-pourriel impose, dans tout message électronique commercial,
l'identification claire de l'expéditeur et un mécanisme d'exclusion simple, valide
au moins soixante jours et traité en dix jours ouvrables.

- Pied de message automatique : nom, adresse postale, site, lien de désabonnement.
- Lien signé en HMAC-SHA256. Sans signature, n'importe qui pourrait désabonner
  n'importe quel contact en devinant un identifiant.
- Page de confirmation plutôt qu'un désabonnement en un seul GET : les antipourriels
  et les aperçus de messagerie préchargent les liens, un GET destructeur serait
  déclenché par des robots au lieu de la personne.
- Le désabonnement écrit `doNotContact` et laisse une trace `Activity` datée, ce qui
  permet de démontrer la date de traitement en cas de plainte.

### Écran — `components/console/ComposerCourriel.tsx`

Sur la fiche du cabinet, sous les contacts. Deux temps imposés : choisir contact et
gabarit, puis relire le rendu avec les vraies variables et corriger avant d'envoyer.
Le bouton d'envoi n'existe pas tant que rien n'a été relu. Les contacts désabonnés
portent un badge et sortent de la liste des destinataires.

## Vérifié

- `npx tsc --noEmit` : propre.
- Page de désabonnement testée au navigateur : lien invalide refusé, lien signé
  valide accepté et affichant la bonne adresse. La confirmation n'a pas été cliquée
  pour ne pas désabonner un vrai contact de la base locale.

## À faire avant le premier envoi réel

1. **`SAFE_INC_ADRESSE_POSTALE` n'est pas définie.** Sans elle, le pied de message
   n'affiche pas d'adresse postale et les envois ne sont pas conformes à la LCAP.
   Variable d'environnement à renseigner avec l'adresse réelle de SAFE Inc.
2. **Adresse d'expédition.** Tout part actuellement de `factures@safecabinet.ca`,
   l'adresse des factures. Une adresse de conversation serait plus juste.
3. **Consentement.** La LCAP exige un consentement exprès ou tacite avant d'écrire à
   un prospect. Le consentement tacite couvre notamment la relation d'affaires
   existante et l'adresse professionnelle publiée sans mention de refus, ce qui
   correspond à la plupart des cabinets visés, mais la base ne trace pas encore
   d'où vient le consentement de chaque contact. À ajouter avant tout volume.
4. **Ouvertures et rejets.** Les statuts `EMAIL_OUVERT` et `EMAIL_BOUNCE` existent
   mais rien ne les écrit : il manque le webhook Resend. C'est aussi ce qui
   débloquerait la dimension engagement du score, aujourd'hui plafonnée.
