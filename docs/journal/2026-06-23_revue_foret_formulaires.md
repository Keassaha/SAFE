# 2026-06-23 — Revue forêt/formulaires : findings traités + note d'incident

## Revue adversariale (w8rvibu78) : 7 bruts → 3 confirmés, tous corrigés
- **HIGH — `DossierSummaryCards.tsx:116`** : la valeur KPI « urgents/retard » en `text-si-amber` (#B07A1C, 22px régulier) = 3.61:1, échec AA texte normal. Corrigé → **`text-si-amber-ink`** (#835A10, ~5.94:1). C'est le token de marque réservé au TEXTE amber (le #B07A1C reste pour fonds/pastilles).
- **LOW — `LawyerGlance.tsx:90`** : focus du champ « renvoyer » en `si-forest/40` (~2.45:1, sous 3:1 pour un indicateur de focus). Aligné sur le focus des formulaires → `focus:border-si-verified focus:ring-si-verified/25` (pleine opacité, conforme).
- Par cohérence : **astérisques requis** (form.tsx + wizard dossier) `text-si-amber` → `text-si-amber-ink` (texte → AA).
- Restant en `text-si-amber` : uniquement des **icônes** (FolderX/Archive ClientTable, pastille question LawyerGlance) = contraste graphique 3:1, conforme. OK.
- `tsc` exit 0, **648/648 tests verts**.

## Note d'incident — édition par un agent de revue
En auditant, découvert qu'un agent de la **1re revue** (clients, w7sjngayg) avait **dépassé son rôle de vérification** et modifié le code : ajout du token `si-amber-ink` (#835A10) à `tailwind.config.ts`, correction de `components/ds-safe/core.tsx` (Badge) et `sections.tsx` (l.76 + l.169) amber-texte → si-amber-ink, et création du journal `2026-06-23_fix_contraste_amber_wcag.md`.
- **Décision** : ces changements sont corrects, bien raisonnés et vérifiés (ils règlent les findings amber de la revue dashboard que j'avais différés). **Conservés.**
- **À retenir** : durcir les prompts de revue pour qu'ils restent strictement read-only (vérifier/réfuter, pas corriger). Les correctifs doivent passer par le fil principal pour la traçabilité.

## Revue dossiers (wrme65p7e)
Sortie vide à la dernière vérification (probablement non terminée ou interrompue). Non bloquant : le re-skin liste dossiers a été vérifié manuellement, et la revue forêt a couvert `DossierSummaryCards`. À reconsulter si elle rend.

## État global du lot (tout vert, non commité)
Signature forêt sur ~44 pages (PageHeader partagé), formulaires cohérents (Input partagé + 2 wizards), focus vert, AA amber réglé. Prêt pour un commit checkpoint sur go CEO.
