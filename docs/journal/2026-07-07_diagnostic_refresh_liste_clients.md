# 2026-07-07 — Diagnostic : liste clients qui ne se rafraîchit pas après création (prod)

## Observé (signalé par la cliente / CEO via vidéo prod safecabinet.ca)
Après « Création rapide » d'un client (page Registre des Clients), le nouveau
client n'apparaît pas dans la liste sans actualiser manuellement. Ressenti « pas
professionnel ».

## Investigation
- Le code de `ClientQuickCreateModal.tsx` appelle déjà `router.refresh()` (ligne 68)
  et le server action `createClientQuick` fait `revalidatePath("/clients")` +
  `revalidatePath("/temps")`. Pattern correct et idiomatique.
- `ClientTable` lit `clients` directement depuis ses props (pas de `useState`
  figé) : un refresh met bien à jour l'affichage.
- Aucune config de cache agressive (pas de `dynamic`/`revalidate`/`fetchCache`
  dans les layouts, pas de `staleTimes` dans next.config).

## Reproduction locale (dev, cabinet test, code actuel)
- Création d'un client via la modal : la liste passe de 4 → 5 → 6 **sans
  actualisation manuelle**. Donc **le correctif fonctionne sur le code actuel**.
- Artefact dev observé : la modal restait sur « Créer… » (promesse du server
  action non résolue en dev/turbopack). Non reproduit en prod (la vidéo montre le
  toast « Client créé » et la modal fermée). Traité comme quirk dev.

## Conclusion
- Le correctif est présent (commit `1aed316`, déjà sur `origin`) et **vérifié
  fonctionnel en local**.
- La prod montre encore le bug → elle tourne un **build antérieur**. 8 commits
  locaux non poussés (checkpoints WIP du 2026-07-06). Écart repo ↔ prod.

## Prochaine action
- Décision CEO requise : stratégie de déploiement (la branche release contient du
  WIP « travaux en cours », ne pas tout pousser en prod à l'aveugle). Isoler le
  fix client-refresh ou redéployer proprement.
