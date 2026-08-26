# Tâches re-skin design prioritaires — 2026-08-24

Ordre de priorité basé sur impact client + complétude visuelle.

## Écrans critiques (blocage avant livraison)

### P1: Facturation (`/facturation`)
- **Impact** : première impression client (paiements), compliance visuelle
- **Scope** : liste factures, détail facture, modal création, états paiement
- **Design** : adapter en-têtes forêt, listes denses, détail modal
- **Checklist** : 
  - [ ] En-tête forêt + titre blanc
  - [ ] Listes avec registre unifié (typage, tris)
  - [ ] Modal détail facture (corps forêt, CTA vert)
  - [ ] États de paiement visuels cohérents
  - [ ] Passer §10 DESIGN_HUMAIN.md (anti-slop)

### P2: Comptes (`/comptes`)
- **Impact** : compta doit être lisible et professionnelle
- **Scope** : liste comptes, détail compte, mouvements
- **Design** : adapcodes comptables, hiérarchie débit/crédit, volumes clairs
- **Checklist** :
  - [ ] En-tête et table comptes cohérents
  - [ ] Hiérarchie compte/sous-compte visible
  - [ ] Mouvements : date, description, montants séparés (D/C)
  - [ ] Recherche et filtres lisibles

### P3: Conformité (`/conformite`)
- **Impact** : confiance réglementaire, audit, checklists
- **Scope** : obligations, rapports, états de conformité, attestations
- **Design** : adapte checklist items, badges statut, sections rapports
- **Checklist** :
  - [ ] Obligations : couleurs statut (✅ vert, ⏳ ambre, ⚠ rouge)
  - [ ] Rapports lisibles (export OK)
  - [ ] Badges Barreau minimaux et clairs

---

## Écrans secondaires (impression finale du cabinet)

### P4: Paramètres (`/parametres`)
- **Impact** : finition, confiante, impression "cabinet pro"
- **Scope** : config cabinet, secrets, préférences, intégrations
- **Design** : groupes de paramètres clairs, formulaires lisibles
- **Checklist** :
  - [ ] Sections hiérarchisées (apparence > données > sécurité)
  - [ ] Formulaires avec spacing cohérent
  - [ ] Toggles et selects dans la grammaire forêt

### P5: Rapports (`/rapports`)
- **Impact** : exports clients, qualité perçue, densité d'info
- **Scope** : listes rapports, détail, génération, export PDF
- **Design** : tableaux lisibles, pagination, actions claires
- **Checklist** :
  - [ ] En-têtes rapports forêt
  - [ ] Tableaux tabulaires (chiffres alignés droite)
  - [ ] Boutons export visuellement distincts

### P6: Employés (`/employees`)
- **Impact** : module secondaire, mais complétude visuelle
- **Scope** : liste staff, fiches, droits, paies
- **Design** : adapte registre unifié, cards ou listes
- **Checklist** :
  - [ ] Liste uniforme (nom, rôle, statut)
  - [ ] Détail fiche cohérent
  - [ ] Badges rôles clairs

---

## Micro-surfaces (pages détail et modals)

### P7: Pages détail édition (`/edition/**`)
- **Scope** : toutes les modals et drawers de création/édition
  - Client (édition modal)
  - Dossier (détail full page)
  - Facture (détail + édition)
  - Compte (détail + mouvements)
  - Tâche, dossier-navette, etc.
- **Design** : drawer ou modal dans la grammaire forêt
- **Checklist** :
  - [ ] Titres et sections hiérarchisées
  - [ ] Formulaires : labels/inputs/CTA cohérents
  - [ ] Aucun gris plat au survol (zoom souple)
  - [ ] Boutons action distincts (primaire vert forêt, secondaire albâtre)

### P8: Fiches de temps (`/fiches-de-temps`)
- **Status** : À vérifier (peut être OK ou nécessiter retouche)
- **Scope** : saisie, liste, détail
- **Checklist** :
  - [ ] Vérifier mise en page actuelle
  - [ ] Adapter si gris/aplat détecté

### P9: Outils (`/outils`)
- **Status** : À vérifier (calculateurs, imports)
- **Scope** : calculateur, widget import
- **Checklist** :
  - [ ] Vérifier mise en page actuelle
  - [ ] Adapter si nécessaire

---

## Directives transversales

### Tokens à utiliser
```ts
// Couleurs forêt/albâtre
--si-forest: #1F3A35
--si-albaster: #FAFAF8
--si-amber-ink: #3D2E24
--si-text-primary: rgba(11, 31, 25, 1)
--si-text-secondary: rgba(11, 31, 25, 0.6)
--si-border: rgba(11, 31, 25, 0.12)

// En-têtes
background: var(--si-forest)
color: var(--si-albaster)
```

### En-têtes (pattern standard)
```tsx
<div className="bg-si-forest text-si-albaster px-6 py-4">
  <h1 className="text-2xl font-serif">{title}</h1>
</div>
```

### Listes (registre unifié)
Réutiliser `components/ui/registre.tsx` pour cohérence tris/colonnes.

### Animations (zoom souple)
- Partout où ça se sélectionne : `transition-transform scale-102 shadow-sm` (soulevé)
- Jamais de survol gris aplat (`bg-gray-100`)
- Voir : `docs/design/SAFE_PREMIUM_DESIGN_STANDARD.md` (PS-085 interactions)

### Checklist terminaison (§10 DESIGN_HUMAIN.md)
Avant de dire qu'un écran est « terminé » :
- [ ] Aucun gradient lissé (slop)
- [ ] Zéro animations « flottantes » sans raison
- [ ] Typographie : sérifs clairs (titres), sans-serif corps
- [ ] Espacement régulier (4/8/16/32px grid)
- [ ] Pas de « 3D faux » ni ombres excessives
- [ ] Couleurs : monochrome + 1 accent (vert forêt)

---

## Estimations (ordre de grandeur)

| Écran | Complexité | Durée | Priorité |
|-------|-----------|-------|----------|
| Facturation | Moyenne | 2–3j | P1 |
| Comptes | Moyenne | 1.5–2j | P2 |
| Conformité | Haute | 2–3j | P3 |
| Paramètres | Moyenne | 1–1.5j | P4 |
| Rapports | Moyenne | 1.5–2j | P5 |
| Employés | Basse | 1j | P6 |
| Pages détail | Haute (volume) | 2–3j | P7 |
| Fiches de temps | Basse | 0.5–1j | P8 |
| Outils | Basse | 0.5–1j | P9 |
| **Total** | | **13–17j** | |

---

## Dépendances

- Lire **avant toute retouche** :
  - `docs/design/SAFE_PREMIUM_DESIGN_STANDARD.md` (7 lois, 93 règles)
  - `docs/design/DESIGN_HUMAIN.md` (§0 méta-règles, §10 anti-slop)
  - `components/ui/registre.tsx` (grammaire listes)
  
- **Passer la checklist §10** avant chaque commit

---

**Prêt à commencer par P1 (Facturation) ?** Demander.
