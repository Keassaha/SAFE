# 2026-10-01 · Fidéicommis : trois retouches

## Décision CEO

Image avant/après validée le 2026-10-01 (`captures/2026-10-01_fideicommis_proposition.png`),
fabriquée en appliquant les retouches sur la page réelle. « encre, code-le ».

Correction d'audit consignée : l'audit du matin reprochait à cet écran « des pastilles
d'icônes colorées ». Elles avaient disparu le 2026-09-12 ; l'écran a été recapturé avant
toute proposition.

## Ce qui a changé

1. **« À faire avant le 25 »** (rapprochement à faire, pas en retard) passe du gris à
   l'encre (`TrustSummaryBar.tsx`, ton `ink`). En gris il se lisait comme désactivé alors
   que c'est une tâche et un lien. L'ambre reste au retard, le rouge au retard critique.
2. **La phrase d'aide ne se répète plus** : « …s'impute depuis la Facturation. section
   Facturation » devient « …s'impute depuis la Facturation. », le mot étant le lien
   (`allocateHintLink`, FR/EN).
3. **Les deux filtres tiennent sur une ligne** et disent ce qu'ils filtrent (« Client :
   tous », « Dossier : tous »). Ils occupaient l'emplacement de la recherche, plafonné à
   384 px : `RegistreBarreOutils` reçoit `rechercheLarge` pour lever ce plafond.

## Mesure

`/comptes` : 4 → 4. Lot de corrections (texte, couleur sémantique, mise en page) : les
quatre écarts comptés ne sont pas sur l'écran, ils viennent de modules importés
(`ui/Button.tsx`, `MonthlyReportScreen.tsx`, `TrustStatementPDF.tsx`).

## Incident pendant le lot

Un script de cette session a tronqué `messages/fr.json` à 0 octet (ouverture en écriture
avant lecture). Restauré une minute plus tard depuis la copie compilée par Next à 10 h 47 :
les 83 clés non commitées de la session « rémunération » ont été contrôlées une à une
contre leur pendant anglais (aucune absente, aucune valeur différente). Cette session a
été prévenue.
