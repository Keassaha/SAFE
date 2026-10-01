# 2026-10-01 · Fenêtre « Nouvelle facture » : trois chemins, dont celui qui manquait

## Décision CEO

Image avant/après validée le 2026-10-01
(`captures/2026-10-01_nouvelle_facture_proposition.png`). « oui, code-le ».

## Le défaut de fond

Le seul chemin marqué « RECOMMANDÉ », « Depuis le registre », cherche dans le registre
des tâches (`/api/registre-taches`), propre au forfait. Dans un cabinet horaire, il
répondait « Aucune tâche non facturée » alors que la page derrière la fenêtre montrait des
heures prêtes à facturer (cabinet démo : 375 $ chez Tremblay). Les heures se facturent
par « Préparer la facture » dans « Honoraires à facturer » (`#facturables`), et la
fenêtre n'en parlait pas.

## Ce qui a changé (`NewInvoiceChoiceModal.tsx`)

- Deux cartes à icône et une pastille « RECOMMANDÉ » en dégradé deviennent une question
  (« D'où viennent les lignes de cette facture ? ») et trois chemins en liste :
  1. **Des heures et débours d'un dossier** : ferme la fenêtre et fait défiler jusqu'à
     « Honoraires à facturer ». C'est le chemin qui manquait.
  2. **Du registre des tâches**, annoncé « pour les dossiers au forfait ».
  3. **D'une facture vierge.**
  Au forfait (`preferRegistre`), le registre passe en tête ; l'ordre remplace la pastille.
- Étape « registre » : deux attentes distinctes (le bouton ne dit plus « Génération… »
  pendant le chargement de la liste) ; « Générer la facture » n'apparaît qu'avec au
  moins un dossier ; icônes tournantes remplacées par le texte ; sélection en encre et
  non en vert (le vert ne dit que « validé ») ; survol gris → `safe-zoom-menu` ;
  couleur d'erreur en dur → `text-si-danger-ink`.

Non touché : le flou derrière la fenêtre, qui vient de `components/ui/Modal.tsx`, commun
à toutes les fenêtres.

## Mesure

`/facturation` : **18 → 8**. `NewInvoiceChoiceModal.tsx` : 10 → 0.
