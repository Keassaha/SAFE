# 2026-07-08 — Facturation : bouton « Créer » invisible + activation du mode mixte

## Contexte
Sur `safecabinet.ca/facturation/nouvelle` (cabinet SAFE / Jérémie, dogfood), le CEO
signale deux choses : (1) le bouton « Créer la facture » « ne fonctionne pas », et
(2) il avait demandé la facturation mixte (heure OU forfait, ligne par ligne, comme
chez Me Derisier).

## Observé
1. **Bouton « Créer » silencieux** — la vraie cause : aucun client n'était sélectionné.
   `handleCreate` refuse correctement et pose `submitError`, mais la bannière d'erreur
   est en flux normal en haut de page. Quand on a défilé jusqu'aux lignes, elle apparaît
   hors écran au-dessus → l'utilisateur a l'impression que le bouton est mort.
2. **Mode mixte déjà codé mais masqué** — le toggle « Forfait / Heures » par ligne existe
   déjà dans `CreateInvoiceView.tsx` (`isMixed`, `setLineMode`, `modeToggle`). Il ne
   s'affiche que si le cabinet a `modules.facturation.principal === "mixed"`. Le cabinet
   SAFE n'avait pas ce flag (défaut → horaire), donc toggle invisible. Me Derisier est en
   `"forfait"`. Aucun des deux n'était en mixte.

## Fait
- **Code** (`app/(app)/facturation/nouvelle/CreateInvoiceView.tsx`) : ajout d'un helper
  `raiseError()` qui pose l'erreur **et** remonte en haut de page (`scrollTo top`), câblé
  sur les deux validations (client manquant, aucune ligne) et sur le `catch` serveur.
  L'erreur est désormais toujours visible. → à déployer pour atteindre la prod.
- **Données PROD** : cabinet SAFE (`cmo7ermcg00000ymbe00e3wei`) passé en
  `modules.facturation.principal = "mixed"` (+ colonne legacy `modeFacturation` synchronisée).
  Script jetable exécuté contre le `DIRECT_URL` prod (Supabase `rsblxmmqlnywcjxztebu`),
  dry-run puis APPLY, script + `.env.prod` supprimés ensuite. Changement réversible.

## Effet immédiat
- **Mixte** : live en prod tout de suite (config lue côté serveur à chaque requête).
  Recharger « Nouvelle facture » → un toggle « Type : Forfait / Heures » apparaît sur
  chaque ligne manuelle. En forfait, si le catalogue est vide, la ligne reste en saisie libre.
- **Bouton** : correctif en working tree, pas encore déployé. En attendant, rappel : il
  faut sélectionner un client pour créer la facture.

## Décidé
- Activation du mixte scoping cabinet SAFE seulement (pas Derisier), sur demande CEO.

## Reste / à décider
- Déployer le correctif du bouton en prod.
- Pas de UI self-serve pour changer le mode de facturation (fait via config/bundle). À
  considérer si d'autres cabinets veulent switcher seuls.
