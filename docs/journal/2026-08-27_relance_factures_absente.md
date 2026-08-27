# 2026-08-27 — La relance de facture n'existe pas

Constat du CEO : « je n'ai pas la possibilité de faire de la relance ». Vérifié
dans le code : c'est exact, et ce n'est pas un oubli d'écran. C'est une
plomberie complète sans robinet.

## Ce qui existe déjà

| Pièce | Fichier | Appelée par |
|---|---|---|
| Table `InvoiceReminder` + `Invoice.lastReminderDay` | `prisma/schema.prisma` | lue par le registre |
| `createReminder()` | `lib/services/billing/reminder-service.ts` | **rien** |
| `listOverdueInvoices()` | même fichier | **ses tests seulement** |
| `reminderEmailHtml()` | `lib/email.ts:171` | **rien** |
| `createReminderSchema` (zod) | `lib/validations/facturation.ts:191` | **rien** |
| `interest-service.ts` | `lib/services/billing/` | **rien** |

L'envoi de courriel, lui, fonctionne : Resend est branché et
`invoice-send-service` envoie déjà la facture avec son PDF.

Le barème est même déjà encodé dans l'enum `InvoiceReminderType` : `rappel_only`
à J+5 et J+15, `frais` à J+10 avec 5 $, `frais_et_interets` à J+20 et au-delà
avec 5 $ plus 14 %/an.

## Ce qui manque

Le fil entre ces pièces. Aucune route d'API, aucune action serveur, aucun
bouton, aucune tâche planifiée (le seul cron est `daily-digest`). Et
`createReminder()` n'envoie rien : il ENREGISTRE qu'une relance a eu lieu, sans
appeler `sendEmail`.

## Trois conséquences visibles

1. **La colonne « Relance » du registre ne peut jamais rien afficher.** Elle lit
   `lastReminderDay` et `reminderLogs`, qu'aucun code n'écrit. Elle montre « — »
   sur toutes les lignes, pour toujours.

2. **Le menu de ligne promettait un geste inexistant.** L'entrée « Relancer »
   ajoutée le 2026-08-26 pointait vers `/facturation/suivi`, une liste en
   lecture seule. Retirée le jour même du constat.

3. **La vitrine, elle, était juste.** `components/public-site/FeaturesPage.tsx`
   documente déjà le trou et refuse d'annoncer la relance : « ce qui n'est pas
   atteignable depuis l'application n'est pas annoncé ici ». La règle a tenu.

## Deux défauts du gabarit existant, à corriger avant tout envoi

- `reminderEmailHtml` signe « Cet email a été envoyé par SAFE — safecabinet.ca ».
  Un rappel de paiement part du CABINET vers SON client. La signature est fausse,
  et elle expose le fournisseur du cabinet à son client.
- Le gabarit est entièrement en français, comme le courriel d'accompagnement de
  facture. Même trou, déjà consigné le 2026-08-26.

## Ce qui n'est pas tranché

Le barème de l'enum porte des frais et des intérêts. Facturer des intérêts à un
client suppose une clause au mandat et respecte des règles de fond ; ce n'est pas
une décision d'interface. Le rappel SANS frais ni intérêts n'a pas cette charge.
Les deux ne devraient donc pas être livrés dans le même lot.
