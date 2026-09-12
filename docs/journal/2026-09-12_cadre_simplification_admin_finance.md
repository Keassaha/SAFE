# 2026-09-12 — Le chantier « simplifier l'administratif et le financier » reçoit son cadre

Demande du CEO : « améliorer l'expérience utilisateur de SAFE côté administratif et
financier, rendre les pages moins complexes, simplifier les processus, uniformiser
le tout. Un travail bien organisé et auditable. »

Ce n'est pas un chantier neuf : c'est celui ouvert le 2026-09-09 (« simplifier écran
par écran facturation, comptabilité, dépenses »), élargi à l'administratif (équipe,
paramètres, temps, paye, rapports, import). Ce qui manquait n'était pas du code, c'était
le registre qui permet de dire, à tout moment, ce qui est fait, ce qui est ouvert, et
avec quelles mesures.

## Ce qui a été fait

Aucun fichier de code touché. Trois documents :

- `docs/product/CHANTIER_SIMPLIFICATION_ADMIN_FINANCE.md` : le cadre opposable du
  chantier. Neuf règles rassemblées (toutes existaient déjà, dispersées), l'inventaire
  mesuré des 39 écrans du périmètre, la file ordonnée, la fiche d'audit par écran, le
  registre de suivi, l'état des lots non commités.
- Cette entrée.
- La mémoire de session `project_simplification_argent` mise à jour.

## Ce que la mesure dit

| | |
|---|---|
| Écrans du périmètre | 39 sur 90 |
| Écarts visuels portés par le périmètre | 549 sur 1 083, soit 51 % |
| Écran le plus chargé | `/comptabilite`, 73 écarts, malgré le lot du 2026-09-09 |
| Densité la plus haute | `/comptes` et `/comptes/rapports`, 77 écarts sur 150 lignes |
| Écran le plus gros | `/facturation/nouvelle`, 2 385 lignes |

Deux constats qui changent la manière de travailler :

1. **Quatre lots ont été livrés du 2026-09-09 au 2026-09-12 sans entrée de journal ni
   mesure avant.** Le dernier journal date du 2026-08-27. Les commits sont bons et
   racontent bien ce qu'ils font, mais on ne peut plus dire combien d'écarts ou de
   clics chaque écran avait avant. C'est exactement ce que « auditable » demande.
   Règle posée : pas de commit d'écran sans sa ligne au registre.

2. **Deux sessions Claude écrivent en même temps dans le dépôt.** Un commit est
   arrivé à 18 h 41 pendant la rédaction, et vingt fichiers ont bougé dans le quart
   d'heure précédent. Ce document n'a rien touché au code pour ne pas écraser ce
   travail. Une seule session à la fois dans le code.

## Vérifications faites

- `tsc` : vert, sur l'arbre de travail complet.
- 61 tests des lots en cours : verts.
- `scripts/design-audit.mjs` : 1 083 écarts, 182 fichiers, chiffres relevés route par
  route.

## Ce qui n'a pas pu être vérifié

- Le rendu réel des écrans : pas de session de connexion. La capture passe par les
  routes `/ds-preview/*`, à faire à la fermeture de chaque écran.
- Les « mesures avant » des quatre lots déjà livrés : perdues, le code a changé.

## Prochaine action

Fermer `/facturation` (capture, commit du lot seul, journal, ligne au registre). Puis
ouvrir `/facturation/paiements` par une image, et attendre le oui.
