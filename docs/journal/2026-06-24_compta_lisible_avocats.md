# 2026-06-24 — Comptabilité lisible par des avocats (non comptables)

Refonte de la section Comptabilité / Finances : la lire comme un compte rendu financier,
pas comme un grand livre brut. Objectif : un·e avocat·e comprend en moins de 30 secondes
combien est facturé, payé, dû, dans le cabinet, et ce qui appartient au client en fidéicommis.
Branche `release/2026-06-11-compta-admin-derisier`.

## Principe directeur
Le moteur comptable était déjà centralisé et solide (`computeJournalKpis`, allocation de
paiements sous verrou, notes de crédit, surpaiement, statuts de facture). Le manque était
la **présentation**. On a donc ajouté **une seule couche de sémantique partagée** qui traduit
chaque écriture brute en langage avocat, sans dupliquer aucun calcul.

## Livrables
- **`lib/accounting/movement-semantics.ts`** — `describeMovement()`, fonction PURE et source
  de vérité unique de la lecture « avocat » : Augmente le dû / Réduit le dû / Impact trésorerie
  / Solde lié + ton de couleur. Réutilise `isTrustEntry` de `kpi.ts` (exporté) → zéro divergence
  avec les KPI. Conforme : débours récupérable suivi à part (jamais aux comptes à recevoir),
  fidéicommis hors trésorerie cabinet, note de crédit = facture à net négatif qui réduit le dû.
- **Vue simplifiée — 6 KPI + phrases pédagogiques** (`ComptabilitePageView`) : Facturé ce mois /
  Paiements reçus / Balance due / Sorties-dépenses / Argent opérationnel + Fidéicommis dans un
  encart détaché « argent du client ». Une micro-phrase sous chaque chiffre.
- **Panneau « Comprendre les mouvements »** (`components/comptabilite/MovementLegend.tsx`).
- **Tableau lisible « Mouvements expliqués »** (`components/comptabilite/MovementsTable.tsx`) +
  toggle Lisible/Expert dans `GeneralJournalPageView`. Le journal brut entrée/sortie est CONSERVÉ
  (piste d'audit Barreau + export CPA), accessible en un clic.
- **Couleurs** : vert reçu/positif, rouge réduction/sortie, ambre à surveiller (facturé non encaissé),
  neutre sans impact trésorerie.
- **Actions faciles** : enregistrer un paiement, appliquer un paiement, voir factures impayées,
  voir paiements non appliqués, corriger par ajustement (jamais de suppression), exporter.
- **i18n FR/EN** : ~70 nouvelles clés sous `accountingUi`, parité maintenue.

## Tests (les 6 scénarios exigés)
`lib/accounting/__tests__/movement-semantics.test.ts` (8) + `accounting-scenarios.test.ts` (6),
appuyés sur les fonctions de prod réelles :
facture → augmente le dû · paiement → réduit le dû + cash · partiel → laisse une balance ·
complet → PAYÉ · trop-payé → crédit identifié · fidéicommis → reste séparé.

## Vérification
| Contrôle | Résultat |
| --- | --- |
| `npx tsc --noEmit` | ✅ 0 erreur |
| `npm run test:run` (accounting + billing) | ✅ 213 tests, dont 14 nouveaux |
| `npm run i18n:keys` | ✅ 3266 / 3266 (parité fr/en) |
| Compilation route `/comptabilite` (dev) | ✅ aucune erreur serveur |
| Rendu visuel authentifié | ⏳ non capturé — `/comptabilite` exige une connexion (mot de passe non saisi par principe). Screenshot dispo dès que le CEO se connecte au preview. |

## Itération 2 — simplification (même jour)
Retour CEO : « trop d'éléments, mauvaise organisation ». La page empilait ~28 blocs avant le
tableau (6 KPI + panneau contrôle 3 lignes + encart fidéicommis + légende 5 cartes + hub 6 cartes
+ 8 KPI redondants dans l'onglet journal). Refonte en page épurée :
- **6 KPI sur une seule grille** (fidéicommis fondu comme 6e carte, teinte ambre « argent du client »).
- Légende « Comprendre les mouvements » repliée derrière un lien **« Comprendre les chiffres »** (masquée par défaut).
- Panneau de contrôle latéral, encart fidéicommis détaché, gros bloc doctrine et titre « Mode expert » **supprimés**.
- Hub de 6 grosses cartes remplacé par **2 liens discrets** (factures impayées · paiements non appliqués). Les actions encaisser/allouer/corriger/exporter vivent déjà dans les onglets.
- Onglet « Journal général » intégré avec `embedded` : **ses 8 KPI ne se réaffichent plus** (déjà en haut de page).
Résultat : header → 6 chiffres → 2 liens → onglets → tableau. tsc 0, parité i18n 3268/3268.

## Non fait (volontaire)
- Push : non exécuté (action sortante, à confirmer).
- Badges d'avertissement « paiement non appliqué » dans le tableau : l'info `allocationStatus`
  n'est pas portée par `JournalEntryRow`. À ajouter si on veut le signal directement en ligne.
