# 2026-07-04 — P1 : création rapide de client sur la page clients

Route vers 10/10, suite du P1 (réduire la friction de l'adjointe).

## Diagnostic
L'action `createClientQuick` (nom seul → client, split prénom/nom pour les
particuliers, détection de doublon, AuditLog) EXISTAIT déjà, mais n'était utilisée
que dans le flux Temps (`components/temps/NewClientModal.tsx`). La page clients
principale n'offrait que `ClientCreationWizard` (6 étapes). Trop lourd pour capturer
un client en quelques secondes au téléphone.

## Correctif (exposer une capacité existante)
- `components/clients/registry/ClientQuickCreateModal.tsx` : bouton « Création rapide »
  → modal 1 champ (type + nom), `createClientQuick`, toast + `router.refresh()`.
- `app/(app)/clients/page.tsx` : bouton ajouté à côté de « Nouveau client » (wizard
  conservé).
- 4 clés i18n FR/EN (quickCreate, quickCreateHint, clientCreated, fullName), parité 3294/3294.

## Vérifié à l'écran (Cabinet Test)
Clic « Création rapide » → modal « Juste un nom pour commencer » → nom → « Créer » →
toast « Client créé » → le client apparaît dans la liste (TOTAL CLIENTS +1). 726 tests
verts, tsc propre.

## Reste vers 10/10 (P1)
Bouton payer sur facture publique (Stripe Connect, plus gros), onboarding qui persiste
(bloqueur self-serve), job de rétention (design-sensible).
