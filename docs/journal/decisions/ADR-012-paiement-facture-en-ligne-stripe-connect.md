# ADR-012 — Paiement de facture en ligne via Stripe Connect (direct charge)

- **Statut** : Accepté (spec validée CEO 2026-07-04). Mise en œuvre par lots, derrière flag.
- **Contexte** : `docs/product/SPEC_paiement_facture_publique.md`, mémo
  `docs/product/COMPTA_AUTO_PAIEMENTS_BUILD_DOSSIER.md`.

## Contexte

Le portail public de facture (`/facture/[token]`) est en lecture seule. Stripe ne sert
aujourd'hui que l'abonnement du cabinet (`lib/stripe.ts`, plans, webhook abonnement). Il faut
un bouton « Payer » qui encaisse **directement chez l'avocate**, sans que SAFE ne touche les
fonds (sinon SAFE deviendrait transmetteur de fonds).

## Décision

1. **Stripe Connect, comptes Express, direct charges.** Chaque cabinet a son propre compte
   connecté (`Cabinet.stripeConnectAccountId`). Les paiements de facture sont des *direct
   charges* sur ce compte : l'argent va directement à l'avocate. SAFE n'est jamais dépositaire.
2. **Le fidéicommis ne passe JAMAIS par le processeur.** Un paiement en ligne crée toujours un
   `Payment` en compte **operating** (`sourceAccountType = operating`), jamais `trust`. Aucun
   bouton payer sur une écriture/approvisionnement de fiducie. Garde-fou codé + testé
   (`lib/payments/eligibility.ts`).
3. **Réutiliser l'existant** : `presentInvoice` (montant = solde présenté, pas de recalcul),
   `payment-allocation-service` (allocation atomique, verrous advisory), `StripeWebhookEvent`
   (idempotence des événements Stripe).
4. **Additif + flaggé** : nouveaux champs additifs (`Cabinet.stripeConnectAccountId`,
   `Cabinet.stripeConnectChargesEnabled`, `Payment.provider`, `Payment.providerRef`).
   Tout le flux est derrière `ONLINE_PAYMENTS_ENABLED` (défaut éteint). Le bouton payer ne
   s'affiche que si : flag actif ET compte Connect du cabinet prêt (charges enabled) ET
   facture payable (solde > 0, statut émis) ET non-fiducie.
5. **Chemins complémentaires** (lots ultérieurs) : Interac (courriel + référence) et
   « déjà payé comptant » (1 clic, à valider côté cabinet).

## Conséquences

- **Positif** : l'avocate est payée directement, SAFE reste hors du flux de fonds (conforme).
  Réutilise le moteur d'allocation et l'idempotence existants. Migrations additives, prod et
  Derisier intacts tant que le flag est éteint.
- **Prérequis CEO (hors code)** : activer **Connect** sur le compte Stripe de la plateforme,
  confirmer les clés (`STRIPE_SECRET_KEY` existe), configurer l'endpoint webhook des
  paiements (`STRIPE_WEBHOOK_SECRET`). Sans ça, le flux ne peut pas être testé en réel.
- **Vérification** : la logique de garde-fou et d'éligibilité est testée sans Stripe. Le flux
  de bout en bout (carte réelle) exige l'activation Connect et un test en mode test Stripe.

## Alternatives écartées

- **Compte plateforme unique (destination charges vers le cabinet)** : SAFE toucherait les
  fonds en transit → risque de statut de transmetteur de fonds. Écarté au profit des *direct
  charges* sur compte connecté.
- **Payment links Stripe** : moins de contrôle sur l'allocation/idempotence et le rendu. Écarté.
- **Passer le fidéicommis par Stripe** : interdit par la doctrine Barreau. Jamais.

## Lots

- **Lot 1 (ce commit)** : ADR + schéma additif + service Connect (`lib/stripe/connect.ts`) +
  garde-fou d'éligibilité (`lib/payments/eligibility.ts`) + tests. Flag défini, éteint.
- **Lot 2** : onboarding Connect Express dans Paramètres (lien + statut).
- **Lot 3** : PaymentIntent (direct charge) + bouton payer sur `/facture/[token]`.
- **Lot 4** : webhook `payment_intent.succeeded` → `Payment` + allocation (idempotent).
- **Lot 5** : Interac + comptant.
