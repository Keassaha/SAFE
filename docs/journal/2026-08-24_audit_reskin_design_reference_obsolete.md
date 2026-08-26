# Audit re-skin design & suppression références obsolètes — 2026-08-24

## État des lieux

**Images de référence obsolètes** : `public/images/app/dashboard.png` (ancien design, cartes colorées sans cohérence visuelle) — ce screenshot **ne reflète pas l'état actuel** du produit depuis le re-skin forêt/albâtre du 2026-06-22.

**Design appliqué** : palette **forêt + albâtre**, en-têtes verts, tokens `si-*`, animations zoom souple de sélection. Live depuis ~2026-06-22.

---

## ✅ Écrans FAITS (re-skinnés en production)

1. **Tableau de bord** (`/tableau-de-bord`)
   - Design forêt complet, KPI cards en harmonie, "À votre attention" stylisé
   
2. **Clients** (`/clients`)
   - Registre unifié (grammaire `components/ui/registre.tsx`)
   - En-tête forêt, listes denses

3. **Dossiers** (`/dossiers`)
   - Design complet, liste + détail, animations zoom
   - Grammaire registre commune

4. **Comptabilité** (`/comptabilite`)
   - Compta-shell re-skin terminé, UI cohérente forêt
   - Journaux, rapports, conformité moteur-side OK

---

## 🔴 Écrans À RE-SKINNER (priorité haute)

| Écran | Route | État | Notes |
|-------|-------|------|-------|
| **Facturation** | `/facturation` | À faire | Critica : factures client, listes, modals |
| **Comptes** | `/comptes` | À faire | Compta : comptes généraux, débit/crédit |
| **Conformité** | `/conformite` | À faire | Obligations, checklist, rapports Barreau |
| **Employés** | `/employees` | À faire | Gestion staff, paies, docs |
| **Rapports** | `/rapports` | À faire | Exports, tableaux, visualisations |
| **Paramètres** | `/parametres` | À faire | Config cabinet, secrets, préférences |
| **Pages détail** | `/edition/**` | Partiellement | Édition client/dossier/facture/compte |
| **Fiches de temps** | `/fiches-de-temps` | À vérifier | Statut post-re-skin inconnu |
| **Outils** | `/outils` | À vérifier | Calculateurs, imports — statut inconnu |

---

## 📋 Plan d'action

### Phase 1 : Nettoyage (immédiat)
- [ ] Supprimer `public/images/app/dashboard.png` (obsolète)
- [ ] Mettre à jour les documentations pointant à cette image
- [ ] Garder `public/images/accueil/tableau-de-bord.png` si utilisé en landing (à vérifier)

### Phase 2 : Continuation re-skin (ordre de priorité)
1. **Facturation** (critère : factures visibles au client, première impression)
2. **Comptes** (critère : compta doit être harmonieuse)
3. **Conformité** (critère : conformité lisible = confiance)
4. **Paramètres** (critère : impression finale du cabinet)
5. **Rapports** (critère : exports = qualité perçue)
6. **Employés** (critère : module secondaire, mais complétude)

### Phase 3 : Pages détail et micro-surfaces
- Audit des modal et drawers d'édition
- Vérifier cohérence fiches-de-temps et outils
- Passer la checklist **§10 (anti-patterns IA)** de `docs/design/DESIGN_HUMAIN.md`

---

## 🎨 Directives de re-skin

- **Palette** : Forêt (#1F3A35 header) + albâtre (#FAFAF8 fonds)
- **Tokens** : Utiliser `si-*` (amber-ink texte, opacité, ombres)
- **En-têtes** : Forêt plein avec titre blanc/gris clair
- **Zoom souple** : Partout où ça se sélectionne, la surface se lève (pas de survol gris aplat)
- **Hiérarchie** : Inspiration Linear (filets, densité modérée, lisibilité d'abord)
- **Anti-slop** : Passer la checklist §0 + §10 de `DESIGN_HUMAIN.md` avant « terminé »

---

## 📸 Références actuelles

- **En-tête référence** : `public/images/linear-style/safe-dashboard-hybrid-production-concept-v5-official-logos.png` (design hybride production-ready, palettes OK)
- **Compta référence** : Écran local de compta-shell (test en prod)
- **Clients & dossiers** : Écrans live actuels (images réelles en prod)

---

## Contexte projet

- **Design standard** : `docs/design/SAFE_PREMIUM_DESIGN_STANDARD.md` (7 lois, 93 règles PS-001–PS-093, grille 100)
- **Anti-AI slop** : `docs/design/DESIGN_HUMAIN.md` (§0 = méta-règles, §10 = patterns à bannir)
- **Decision : design d'abord** : CEO 2026-06-22 — « design d'abord, fonctionnel après »
- **Registre unifié** : `components/ui/registre.tsx` — grammaire commune clients/dossiers depuis 2026-08-11

---

**Statut** : DRAFT, à valider avant Phase 2.
