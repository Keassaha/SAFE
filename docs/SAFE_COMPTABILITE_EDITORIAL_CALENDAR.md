# Calendrier éditorial — Page Comptabilité

> Thème : « La comptabilité que l'avocat comprend, que le comptable accepte. »
> Voix « vous ». Pas de jargon. L'avocat (et son adjointe) sont les héros ; le comptable reste le comptable.
> Source de doctrine : `docs/accounting/SAFE_ACCOUNTING_DOCTRINE.md` — SAFE tient la comptabilité OPÉRATIONNELLE et l'EXPORTE ; il ne remplace pas le comptable, ne fait pas de partie double interne, pas de bilan, pas d'états certifiés.

Établi le 2026-06-24 à partir d'un audit du module (page `/comptabilité`, journaux, `/comptes`, services `lib/services/journal/*`, `lib/accounting/*`).

---

## Ce qui est déjà sain (ne pas retoucher)

| Point | Vérifié | Preuve |
| --- | --- | --- |
| Le « facturé ce mois » est en HT, jamais compté comme trésorerie | ✅ | `lib/services/journal/kpi.ts` (totalFacture HT) |
| Le fidéicommis est isolé du solde opérationnel (jamais additionné) | ✅ | `kpi.ts` (`isTrustEntry`) + carte distincte dans le hub |
| Le journal est mono-axe, append-only, idempotent (doctrine assumée) | ✅ | `JournalGeneralEntry` + `lib/services/journal/journal-service.ts` |
| Le hub `/comptabilité` (intro doctrinale + actions, journaux en mode expert) | ✅ | `ComptabilitePageView.tsx` (livré Phase 3) |

La doctrine n'est pas trahie dans l'UI : aucun écran ne promet « comptabilité complète » ou « remplace le comptable ». À garder ainsi.

---

## Incohérences à corriger (backlog priorisé)

> Mise à jour 2026-06-24 après audit de la page rendue (`/comptabilite?tab=general`).

| Code | Sévérité | Incohérence | Preuve |
| --- | --- | --- | --- |
| COMPTA-01 | **P0** | **Chaîne d'export cassée.** (a) La carte « Exporter au comptable » pointe vers `?tab=general`, l'onglet déjà ouvert → clic sans effet. (b) Le seul bouton visible « Exporter CSV » produit un CSV PLAT du journal (`exportJournalCsv`), pas le format mappable. (c) Le vrai export mappable QB/Xero/Sage `exportAccountingPeriodAction` (Lot 5, double-entrée balancée + méta verrouillage) n'est branché à AUCUN bouton de l'app. | `ComptabilitePageView.tsx` (carte hub `hubExport` → `comptabiliteTab("general")`) ; `app/(app)/journal/general/actions.ts` (`exportJournalAction` plat vs `exportAccountingPeriodAction` Lot 5, jamais appelé en `.tsx`) |
| COMPTA-09 | **P1** | **KPI affichés en double.** Le panneau « Vue cohérente » (Solde opérationnel, Cash net, Facturé, À récupérer) + « Contrôles rapides » (Fidéicommis, Dépenses, Écritures) répètent les 7 KPI du journal général (`ComptaKpiCard`) affichés juste en dessous. Mêmes chiffres, deux styles. | `ComptabilitePageView.tsx` (snapshot) vs `GeneralJournalPageView.tsx` (7 `ComptaKpiCard`) |
| COMPTA-10 | P2 | **Cartes du hub = doublon des onglets.** « Encaisser » → `?tab=paiements` et « Dépenses et débours » → `?tab=depenses` mènent exactement aux onglets du mode expert situés plus bas. Deux chemins pour la même chose. | `ComptabilitePageView.tsx` (HUB hrefs == TABS) |
| COMPTA-04 | P1 | Les alertes anti-erreurs (paiement orphelin, facture sans dossier, débours non recouvré sur dossier fermé) existent en logique mais ne s'affichent nulle part. | `lib/accounting/anti-erreurs.ts` (jamais importé en UI compta) |
| COMPTA-05 | P1 | Le profil de cabinet (A/B/C/D) est stocké mais ne pilote pas l'UI : un cabinet sans fidéicommis voit quand même la carte Fidéicommis et le lien rapprochement. | `lib/accounting/profil-cabinet.ts` + `CabinetInterface.modules.comptabilite` (jamais lu par le hub) |
| COMPTA-06 | P1 | Le verrouillage de période existe en logique (et `exportAccountingPeriodAction` renvoie même `locked`) mais n'est ni visible ni actionnable dans l'UI. | `lib/services/journal/period-lock.ts` + `AccountingPeriodLock` (aucune UI) |
| COMPTA-07 | P2 | L'onglet « Paiements » réemballe la vue facturation complète ; le libellé « Encaisser un paiement » laisse attendre un geste court. | `ComptabilitePageView.tsx` (intégration `FacturationPaiementsView`) |

Déjà SAIN (ne pas toucher) : « Contrôle mensuel » → `/comptes/rapprochement` (page réelle, fonctionne) ; « Nouvelle écriture » (modal qui marche) ; le bouton « Exporter CSV » exporte vraiment (mais en format plat, cf. COMPTA-01).

Note : l'audit `docs/accounting/AUDIT_ANOMALIES_INTERFACES_CAYARD_DERISIER.md` couvre un sujet orthogonal (province QC/ON, taxes, localisation) ; ses points restants sont rappelés en Semaine 3.

---

## Semaine 1 — « L'export marche vraiment, et l'écran ne se répète pas »

But : la promesse « prêt pour votre comptable » devient vraie, et la page arrête d'afficher deux fois les mêmes chiffres.

| Priorité | Chantier | Définition de terminé |
| --- | --- | --- |
| **P0** | **Réparer la chaîne d'export (COMPTA-01)** : brancher `exportAccountingPeriodAction` (Lot 5, mappable QB/Xero/Sage) à un vrai bouton ; faire que « Exporter au comptable » DÉCLENCHE cet export (ouvre un choix de période/format + télécharge), au lieu de re-naviguer sur l'onglet courant ; distinguer clairement « journal brut (CSV) » et « export comptable mappable ». | Un clic sur « Exporter au comptable » télécharge un fichier mappable QB/Xero/Sage, avec les totaux débit/crédit balancés. |
| P1 | **Dédupliquer les KPI (COMPTA-09)** : un seul jeu d'indicateurs. Soit garder le snapshot « Vue cohérente » en tête et retirer les 7 `ComptaKpiCard` du journal général (recommandé), soit l'inverse. | Chaque chiffre (solde, facturé, fidéicommis…) n'apparaît qu'une fois sur la page. |
| P1 | **Alertes anti-erreurs affichées (COMPTA-04)** : brancher `anti-erreurs.ts` à un panneau d'avertissements en tête des journaux / paiements. | Une situation à risque (paiement orphelin, facture sans dossier…) déclenche une alerte visible. |

---

## Semaine 2 — « SAFE s'adapte à chaque cabinet »

But : un cabinet ne voit que ce qui le concerne, et garde la main sur ses périodes.

| Priorité | Chantier | Description | Définition de terminé |
| --- | --- | --- | --- |
| P1 | Profils de cabinet qui pilotent l'UI (COMPTA-05) | Lire le profil (A/B/C/D) dans le hub et masquer les cartes/onglets non pertinents (ex. Fidéicommis caché si le cabinet n'en a pas). | Un cabinet sans fidéicommis ne voit ni la carte Fidéicommis ni le lien rapprochement. |
| P1 | Périodes comptables visibles et actionnables (COMPTA-06) | Afficher les périodes verrouillées + permettre de verrouiller / rouvrir (selon le rôle), relié au « Contrôle mensuel ». | L'avocat voit quelles périodes sont clôturées et peut en rouvrir une avec les droits. |

---

## Semaine 3 — « Cohérence et finition »

But : enlever les dernières frictions et divergences.

| Priorité | Chantier | Description | Définition de terminé |
| --- | --- | --- | --- |
| P2 | Cartes hub vs onglets (COMPTA-10) | Les cartes « Encaisser » / « Dépenses et débours » mènent aux mêmes onglets situés plus bas. Choisir un seul chemin : soit les cartes deviennent l'entrée unique (et on réduit les onglets), soit on retire ces cartes redondantes. | Une seule façon d'atteindre paiements / dépenses. |
| P2 | Geste « Encaisser » clarifié (COMPTA-07) | Soit un libellé honnête (« Gérer les paiements »), soit un geste court d'enregistrement de paiement. | Le libellé correspond à ce qui s'ouvre. |
| P2 | Libellés KPI unifiés (COMPTA-08) | Une fois les KPI dédupliqués (COMPTA-09), garder une seule série de clés `kpi*`. | Un seul libellé par KPI. |
| P2 | Taxes / province (renvoi audit) | Vérifier la vue taxes province-aware (QC/ON) selon `AUDIT_ANOMALIES_INTERFACES_CAYARD_DERISIER.md`. | La vue taxes est cohérente avec la province du cabinet. |

---

## Vérification (fin de chaque semaine)

```bash
npx tsc --noEmit
npm run i18n:keys
npm run test:run
```

## Commits suggérés

- Semaine 1 : `feat(compta): export visible + alertes anti-erreurs à l'écran`
- Semaine 2 : `feat(compta): profils cabinet pilotent l'UI + périodes actionnables`
- Semaine 3 : `refactor(compta): cohérence libellés KPI et geste paiement`

## Règles de travail (rappel)

- Respecter la doctrine : opérationnel + export, jamais « remplace le comptable ».
- Chaque écran reste cohérent par rôle (avocat / assistante / comptabilité).
- Pas de tiret long dans le copy, voix « vous », le client est le héros.
- Migrations additives seulement ; pas de `migrate dev` global.
