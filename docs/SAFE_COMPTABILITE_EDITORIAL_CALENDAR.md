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

| Code | Sévérité | Incohérence | Preuve |
| --- | --- | --- | --- |
| COMPTA-01 | P1 | « Exporter au comptable » mène au journal général sans signaler clairement qu'on y exporte (export CSV mappable QB/Xero/Sage présent mais non mis en avant). | `ComptabilitePageView.tsx` (carte Exporter) + `/journal/general` (bouton CSV) + `lib/accounting/export/` |
| COMPTA-04 | P1 | Les alertes anti-erreurs (paiement orphelin, facture sans dossier, débours non recouvré sur dossier fermé) existent en logique mais ne s'affichent nulle part. | `lib/accounting/anti-erreurs.ts` (jamais importé en UI compta) |
| COMPTA-05 | P1 | Le profil de cabinet (A/B/C/D) est stocké mais ne pilote pas l'UI : un cabinet sans fidéicommis voit quand même la carte Fidéicommis et le lien rapprochement. | `lib/accounting/profil-cabinet.ts` + `CabinetInterface.modules.comptabilite` (jamais lu par le hub) |
| COMPTA-06 | P1 | Le verrouillage de période existe en logique mais n'est ni visible ni actionnable : l'avocat ne sait pas quelles périodes sont clôturées, ni comment en rouvrir une. | `lib/services/journal/period-lock.ts` + `AccountingPeriodLock` (aucune UI) |
| COMPTA-07 | P2 | L'onglet « Paiements » réemballe la vue facturation complète ; le libellé « Encaisser un paiement » laisse attendre un geste court. | `ComptabilitePageView.tsx` (intégration `FacturationPaiementsView`) |
| COMPTA-08 | P2 | Les KPI du hub utilisent des clés i18n ad hoc alors que des clés `kpi*` standard existent et restent inutilisées (risque de divergence de libellés). | `messages/fr.json` (clés `kpi*` orphelines) + `ComptabilitePageView.tsx` |

Note : l'audit `docs/accounting/AUDIT_ANOMALIES_INTERFACES_CAYARD_DERISIER.md` couvre un sujet orthogonal (province QC/ON, taxes, localisation) ; ses points restants sont rappelés en Semaine 3.

---

## Semaine 1 — « L'export et les alertes sont évidents »

But : l'avocat voit ce qui part chez le comptable et ce qui cloche, sans chercher.

| Priorité | Chantier | Description | Définition de terminé |
| --- | --- | --- | --- |
| P1 | Export visible (COMPTA-01) | Mettre l'export en avant : un bouton « Exporter au comptable » clair (CSV double-entrée mappable QB/Xero/Sage) sur le hub et/ou en tête du journal général, avec une ligne « prêt pour votre comptable ». | Depuis le hub, un clic mène à un export réel, pas à un journal muet. |
| P1 | Alertes anti-erreurs affichées (COMPTA-04) | Brancher `anti-erreurs.ts` à l'écran : un panneau d'avertissements (paiement orphelin, facture sans dossier, débours non recouvré sur dossier fermé) en tête des journaux / paiements. | Une situation à risque déclenche une alerte visible et compréhensible. |

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
| P2 | Geste « Encaisser » clarifié (COMPTA-07) | Soit un libellé honnête (« Gérer les paiements »), soit un geste court d'enregistrement de paiement. | Le libellé correspond à ce qui s'ouvre. |
| P2 | Clés KPI unifiées (COMPTA-08) | Utiliser les clés `kpi*` standard partout (hub, rapports), supprimer les doublons. | Un seul libellé par KPI, réutilisé. |
| P2 | Taxes / province (renvoi audit) | Vérifier la vue taxes province-aware (QC/ON) et la localisation, selon `AUDIT_ANOMALIES_INTERFACES_CAYARD_DERISIER.md`. | La vue taxes est cohérente avec la province du cabinet. |

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
