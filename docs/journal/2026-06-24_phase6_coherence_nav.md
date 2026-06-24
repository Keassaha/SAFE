# 2026-06-24 — Phase 6 : cohérence de la navigation par rôle

Theme calendrier (Semaine 6) : « SAFE raconte une seule histoire ». Décision de coque déjà prise (barre du haut, rail annulé). Méthode : audit (agent Explore) + correctif ciblé.
Branche `release/2026-06-11-compta-admin-derisier`. tsc + 661 tests verts, parité i18n.

## Constat (audit)
La navigation était déjà largement cohérente :
- `SidebarNav` filtre les items ET leurs enfants par `show(role)` ; les groupes vides dégradent en simple lien.
- Menus par persona cohérents : avocat ne voit pas le groupe Finances (ne gère pas les factures) ; assistante ne voit pas Comptes/fidéicommis (`canViewBillingTrust` l'exclut) ; comptabilité ne voit ni File assistante ni Édition.
- **Console SAFE Inc.** bien gardée (`isInternal` + `canManageCabinetSettings`, aucun lien dans la nav cliente ; CONSULTANT_NAV du Header seulement si `isSafeInc`).
- **Journaux en « mode expert »** via le hub `/comptabilité` : déjà fait en Phase 3.
- **Sous-actions facturation** : déjà exposées en cartes dans le hub `/facturation`.

## Seul vrai défaut corrigé
5 sous-pages facturation (`verification`, `suivi`, `paiements`, `notes-de-credit`, `frais`) n'avaient que `requireCabinetId()` — donc accessibles par URL directe sans vérification de rôle, incohérent avec le hub (`canManageInvoices`). Alignées sur `requirePageAccess(canManageInvoices)` (`lib/auth/page-guard.ts`), conforme à la doctrine « le menu cache, il ne protège pas ».

## Volontairement laissé
- Création client/dossier + import : `requireCabinetId` (tous rôles), actions cœur sans données financières sensibles → OK.
- `FormField` unifié (calendrier P1/P2) : nicety de refactoring pour FUTURS écrans, différé.
- Accès assistante aux rapports financiers (temps-non-facturé/aging/taxes sur `canViewBillingTrust`) : débat produit, laissé en l'état.
- Clarté fine /temps vs /mes-heures : nuance, non bloquant.

## Reste calendrier
P7 démo / QA finale.
