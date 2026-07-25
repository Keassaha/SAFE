# Plan — Éditeur de documents niveau pro (minimaliste, juridique)

**Date** : 2026-07-17
**Contexte** : Le CEO veut rapprocher l'éditeur d'édition de documents d'un outil pro type Word, en restant minimaliste et centré sur le travail juridique. Analyse basée sur le code réel (`components/edition/`, `lib/edition/`, `app/api/edition/`).

---

## 1. Forces de l'éditeur actuel

1. **Chrono facturable intégré** : session de travail démarrée à l'ouverture, pause auto après 15 min d'inactivité, bouton Terminé qui alimente la saisie de temps. Aucun Word ne fait ça. C'est LE différenciateur, à protéger.
2. **Socle Tiptap sain** : StarterKit + titres H1-H4, alignement, tableaux redimensionnables, listes imbriquées (décimal → alpha → romain, déjà stylées), citations, liens. Architecture React soignée (chrono en ref, subscriptions stables, pas de re-render parasites).
3. **Auto-save 4 s + versions** : sauvegarde débouncée, save manuel, toast avec retry, panneau de versions avec snapshots étiquetés, aperçu et restauration.
4. **Cycle de vie complet du document** : bibliothèque, déplacement entre dossiers, envoi au client, export PDF avec en-tête cabinet, upload avec classification IA.
5. **Interface réellement minimaliste** : une seule barre d'outils style Apple Notes, page blanche 820 px sur fond gris, compteur de mots / temps de lecture. C'est l'ADN à conserver.
6. **i18n FR/EN** partout.

## 2. Faiblesses (vs travail juridique pro)

### A. Structure juridique — le plus gros écart
- **Pas de numérotation de clauses** : aucun multi-niveaux automatique 1. / 1.1 / 1.1.1 propre aux contrats et procédures. Les listes ordonnées imbriquées existent mais ne sont pas pensées « clauses » (pas de renvois, pas de continuité).
- **Pas de renvois croisés** (« voir l'article 4.2 ») qui se renumérotent.
- **Pas de notes de bas de page** : citations juridiques impossibles proprement.
- **Pas de gabarits avec variables** : seul le mandat a un template (`mandat-template.ts`). Pas de champs de fusion {client}, {numéro de dossier}, {taux} réutilisables dans lettres et procédures.

### B. Échange avec l'externe
- **Pas d'export DOCX** : seul le PDF existe. La partie adverse et les confrères travaillent en Word ; sans .docx l'éditeur ne peut pas être l'outil unique.
- **Import DOCX partiel** : l'upload accepte .docx mais ne le convertit pas en document éditable (seul le mandat a un chemin mammoth → tiptap via `html-to-tiptap.ts`).

### C. Révision et collaboration
- **Pas de suivi des modifications** : LA fonction Word des juristes (négociation de contrats). Rien d'équivalent.
- **Pas de commentaires / annotations** en marge.
- **Pas de verrou ni coédition** : deux personnes sur le même document = dernier sauvé gagne, silencieusement. (`@tiptap/extension-collaboration` est installé mais pas branché.)
- **Pas de diff entre versions** : le panneau versions montre des snapshots mais pas ce qui a changé.

### D. Mise en page / WYSIWYG
- **Pas de modèle de page** : pas de pagination, sauts de page, en-têtes/pieds, marges, interligne. L'écran (Geist 16 px) ne ressemble pas au PDF exporté (Helvetica 10 pt, en-tête bleu) : ce qu'on voit n'est pas ce qu'on livre.
- **PDF hors design system** : bleus codés en dur (#1E3A5F / #2563EB) alors que le reskin est forêt/albâtre ; caret et liens indigo (#4f46e5) dans l'éditeur, même incohérence.

### E. Petites frictions
- Extensions installées mais non branchées : image, surlignage, couleur, indice/exposant, listes de tâches (le CSS existe déjà pour tasklist et images, sans bouton).
- Lien via `window.prompt`, restauration via `window.confirm` : à remplacer par des UI propres.
- Pas de rechercher/remplacer.
- Titre tronqué à 200 px dans le fil d'Ariane.
- Pas de raccourci « / » (slash commands) ni palette.

---

## 3. Plan proposé — 3 lots

**Principe directeur** : ne pas viser la parité Word. Viser « les 6 gestes Word dont un juriste ne peut pas se passer », en gardant une seule barre d'outils.

### Lot 1 — Brancher l'existant + frictions (petit, 1-2 sessions)
1. Activer image, surlignage, indice/exposant, tasklist (déjà installés + CSS prêt).
2. Bubble menu pour les liens (remplacer window.prompt) + menu contextuel tableau (ajouter/supprimer lignes-colonnes, fusionner).
3. Rechercher / remplacer (Cmd+F dans le document).
4. Aligner les couleurs éditeur + PDF sur les tokens forêt (retirer l'indigo et le bleu hardcodé).
5. Interligne (1 / 1,5 / double) : exigence fréquente des tribunaux.

### Lot 2 — Le cœur juridique (le vrai chantier différenciant)
6. **Numérotation de clauses multi-niveaux** : un « mode clauses » (extension ProseMirror custom) qui numérote 1. / 1.1 / 1.1.1 automatiquement, avec renvois croisés qui suivent la renumérotation.
7. **Notes de bas de page** pour citations.
8. **Gabarits + variables de fusion** : bibliothèque de modèles (lettre, mise en demeure, procédure) avec champs {client}, {dossier}, {date} auto-remplis depuis le dossier. Généraliser ce que fait déjà le mandat.
9. **Export DOCX** (tiptap JSON → html → docx) pour l'échange avec confrères ; import DOCX → éditable en réutilisant le chemin mammoth du mandat.

### Lot 3 — Révision pro (plus lourd, à spécifier avant chantier)
10. **Suivi des modifications** (mode suggestion) + acceptation/refus par changement.
11. **Commentaires en marge** ancrés au texte.
12. **Diff visuel entre versions** dans le panneau existant.
13. **Verrou d'édition simple** (un éditeur à la fois + bannière « X est en train d'éditer ») avant toute vraie coédition temps réel.
14. Mise en page : marges, saut de page manuel, aperçu paginé fidèle au PDF.

### Décisions à trancher (CEO)
- **Track changes** : les extensions officielles Tiptap (comments, suggestions) sont payantes (Tiptap Pro). Alternatives : build custom sur ProseMirror (plus long) ou abonnement Tiptap. À chiffrer avant le Lot 3.
- **DOCX export** : fidélité « propre et simple » (rapide) vs fidélité mise en page complète (long). Recommandation : propre et simple d'abord.
- **Filtre terrain** : valider avec l'usage réel de Me Derisier quels items du Lot 2 elle toucherait cette semaine (doctrine : brancher avant de bâtir).

---

**Statut** : plan proposé, en attente de priorisation CEO.
