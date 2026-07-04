# Spec — Bouton payer sur la facture publique

> Statut : **DRAFT**, en attente validation CEO. Route vers 10/10, P1 (valeur business).
> État actuel confirmé par cartographie du code (2026-07-04).
> Lié au mémo projet « Plan auto paiements compta » (c'est l'une des 2 specs à écrire).

## Problème

Le portail client public (`/facture/[token]`) affiche une facture en lecture seule. Pour
payer, le client doit passer hors SAFE (chèque, virement manuel). Friction, et l'avocate
attend son argent. Face à un Clio qui intègre le paiement, c'est un manque net.

## Objectif

Un bouton **« Payer »** sur la facture publique, qui encaisse **directement chez l'avocate**
(pas chez SAFE), enregistre le paiement et l'alloue à la facture automatiquement. Plus deux
chemins complémentaires : **Interac** (courriel) et **« déjà payé comptant »** en un clic.

## Principe déloyal / doctrine (NON négociable)

- **Le fidéicommis ne passe JAMAIS par un processeur de paiement.** Un bouton payer n'existe
  que pour des factures d'honoraires/débours, jamais pour approvisionner le compte en fiducie.
  Garde-fou à coder explicitement.
- **L'argent va à l'avocate, pas à SAFE.** → Stripe **Connect** (comptes connectés des
  cabinets), pas un compte plateforme unique. SAFE n'est pas dépositaire des fonds clients.

## État actuel (confirmé)

- **Portail public** : `app/facture/[token]/` + `app/api/facturation/factures/public/[token]/route.ts`.
  Rend via `presentInvoice` (source unique, cf. test d'équivalence). **Lecture seule, aucun
  bouton payer.**
- **Stripe = abonnement cabinet UNIQUEMENT** (`lib/stripe.ts` : plans Essentiel/Professionnel/
  Cabinet). Le webhook (`app/api/webhooks/stripe/route.ts`) ne gère que la souscription.
  **Pas de Stripe Connect, pas de PaymentIntent client, pas de compte connecté par cabinet.**
- **Modèle Payment** (prisma) : `montant`, `method` (`PaymentMethodBilling` : cash, cheque,
  e_transfer, card, bank_transfer, **trust**), `sourceAccountType` (**operating | trust |
  external**), `allocationStatus`, + `PaymentAllocation` (allocation à facture avec **verrous
  advisory Postgres**, atomique, testé). Saisie **manuelle** aujourd'hui. **Pas de champ
  `provider`** (stripe/interac) → à ajouter (additif).
- **Point d'accroche du garde-fou fidéicommis** : le champ `Payment.sourceAccountType` existe
  déjà. Règle : bouton payer visible seulement si la facture/le paiement n'est pas `trust`.
- **Service** : `lib/services/billing/payment-allocation-service.ts` (validation + création +
  allocation atomique). Base solide à réutiliser pour le paiement en ligne.
- **Interac / comptant** : mentionnés dans le mémo, **zéro implémentation** aujourd'hui.

## Portée (MVP)

1. **Stripe Connect par cabinet** : onboarding du compte connecté de l'avocate (Express),
   stocké sur `Cabinet`. Sans ça, pas de bouton payer.
2. **Payer par carte** sur la facture publique : PaymentIntent sur le compte connecté du
   cabinet, montant = solde dû, devise du cabinet.
3. **Webhook** : à la confirmation, créer un `Payment` (provider=stripe) + l'allouer à la
   facture, mettre à jour le statut. Idempotent (clé d'événement Stripe).
4. **Chemins complémentaires** : bouton « Payer par Interac » (affiche l'adresse courriel
   Interac du cabinet + référence) ; bouton « J'ai déjà payé comptant » (marque un paiement
   comptant à valider côté cabinet).

Hors périmètre MVP : abonnements clients, paiements partiels programmés, remboursements.

## Plan par lots

- **Lot 0 — Spec + décision** : valider Connect (Express) et le fait que SAFE ne touche pas
  les fonds. (ADR paiement.)
- **Lot 1 — Connect onboarding** : lien d'onboarding Stripe Express par cabinet, statut stocké.
- **Lot 2 — Payer par carte** : bouton sur `/facture/[token]` (visible seulement si Connect
  actif ET facture payable ET non-fiducie), PaymentIntent, page de succès.
- **Lot 3 — Webhook + allocation** : à `payment_intent.succeeded`, créer un `Payment`
  (nouveau champ `provider=stripe`, `method=card`, `sourceAccountType=operating`) et l'allouer
  via le `payment-allocation-service` existant (verrous advisory → pas de double-allocation).
  Idempotent sur la clé d'événement Stripe. Migration additive (`provider`, `stripeConnectAccountId`).
- **Lot 4 — Interac + comptant** : les deux chemins complémentaires.

## Critères d'acceptation

- Une facture publique payable affiche « Payer » quand le cabinet a un compte Connect actif ;
  le paiement carte crédite le compte de l'avocate (pas SAFE) et l'argent n'apparaît jamais
  en fidéicommis.
- Le webhook crée un `Payment` alloué à la facture, une seule fois (idempotent), et le solde
  se met à jour.
- Aucun bouton payer ne s'affiche pour une écriture/approvisionnement de fiducie.
- Interac et « comptant » enregistrent les bons états.
- tsc + suite verte.

## Garde-fous

- **Fidéicommis jamais via processeur** (test dédié).
- **Connect obligatoire** avant tout bouton payer (sinon masqué).
- **Idempotence webhook** (clé d'événement Stripe), pas de double-allocation.
- **Équivalence des montants** : le montant payé = solde présenté (`presentInvoice`), pas un
  recalcul.
- Derrière un flag jusqu'à validation en conditions réelles.
