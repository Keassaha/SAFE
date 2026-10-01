# 2026-10-01 · Clients : la grammaire de Dossiers

## Décision CEO

Image avant/après validée le 2026-10-01 (`captures/2026-10-01_clients_proposition.png`),
fabriquée en appliquant les retouches sur la page réelle. « oui, garde les deux boutons,
code-le » : « Création rapide » et « + Nouveau client » restent tous deux (fenêtre courte
et assistant complet).

## Ce qui a changé

- Titre « Registre des Clients » → « Clients » (« Client Registry » → « Clients »).
- Sous-titre « Gérez vos clients et leurs dossiers » retiré.
- `ClientSummaryCards.tsx` : quatre mesures en capitales → ligne d'état « 2 clients
  actifs · 2 dossiers actifs · 0,00 $ d'honoraires accumulés ». Total et « 100 % »
  retirés (ils répétaient les actifs ; prop `totalClients` gardée).
- `ClientFilters.tsx` : « Statut : tous », « Type : tous » ; bouton Actualiser retiré.
- `ClientTable.tsx` : en-têtes sur une ligne (colonnes élargies, `whitespace-nowrap`) ;
  sur téléphone, « 1 dossiers actifs » devient « 1 dossier actif » (pluriel ICU).

## Mesure

`/clients` : **12 → 11** (animation continue de l'icône d'actualisation retirée).
Vérifié au navigateur : bureau, téléphone, anglais ; aucune erreur.
