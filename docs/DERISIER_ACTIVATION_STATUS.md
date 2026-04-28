# Derisier Activation Status

Date de mise a jour: 2026-04-28

Ce fichier suit l'etat reel de l'activation Derisier depuis le repo produit. La checklist d'activation detaillee reste dans `Delivery Syst`, mais ce resume permet de savoir immediatement si le cabinet est encore en transition.

## Statut global

`blocked-on-production-validation`

Le code et les seeds sont largement en place, mais l'activation n'est pas fermee tant que les validations de production, les integrations tierces et les verifications de roles ne sont pas cochees dans le dossier client Delivery.

## Ce qui est confirme cote repo

- Navigation configurable par `CabinetInterface`
- Seeds Derisier presentes dans `lib/seeds/`
- Mode Ontario / forfait / fiducie / retention documentes dans les artefacts Delivery
- Tests unitaires du repo passent localement
- Build locale reproductible sans telechargement de fonts externes

## Ce qui reste externe au repo

- Confirmation URL de production et projet Supabase
- Application du JSON `CabinetInterface` en production
- Execution des seeds sur la base cible
- Invitations utilisateurs et verification des permissions par role
- Configuration Resend, Stripe, DocuSign et leurs webhooks
- Validation de parcours bout en bout sur l'environnement Derisier

## Condition de sortie

On pourra considerer Derisier "active" quand les trois conditions suivantes seront remplies:

1. La checklist `06-activation.md` dans `Delivery Syst` n'a plus de blocant sur environnement, email et permissions.
2. Les parcours critiques ont ete testes sur l'environnement cible.
3. Le statut du present fichier passe a `operational`.
