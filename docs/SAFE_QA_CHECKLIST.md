# Checklist QA finale — pré-pilote SAFE

> À parcourir avant un déploiement pilote. Cocher chaque ligne. Signer en bas.
> Date : 2026-06-24 · Branche : `release/2026-06-11-compta-admin-derisier`

## A. Vérification technique (automatisée)

| Contrôle | Commande | Résultat |
| --- | --- | --- |
| Types | `npx tsc --noEmit` | ✅ aucun erreur |
| Tests | `npm run test:run` | ✅ 661 tests / 77 fichiers |
| Build | `npm run build` | ✅ succès (toutes les routes compilées) |
| Parité i18n | `npm run i18n:keys` | ✅ 3133 / 3133 clés (fr = en), aucune vide |
| Lint | `npm run lint` | ⚠️ 55 problèmes **pré-existants** (52 apostrophes JSX `react/no-unescaped-entities`, 3 alt-text, 3 `no-assign-module-variable` dans un test, 1 hook-deps). **Aucun dans le code de cette release.** Le build n'est pas bloqué. À nettoyer post-pilote. |

## B. Parcours avocat (manuel)

- [ ] Connexion en avocat → `/tableau-de-bord` s'ouvre.
- [ ] Le **coup d'œil avocat** s'affiche au-dessus des chiffres (prêt pour revue, questions, document prêt, facture prête).
- [ ] La carte **fidéicommis** affiche solde + dernier rapprochement.
- [ ] Ouvrir un client → un dossier → onglets visibles (mandat, pièces, fidéicommis, fermeture).
- [ ] Le groupe **Finances** n'apparaît PAS dans le menu de l'avocat (cohérence rôle).
- [ ] Onglet **Fermeture** d'un dossier : alerte sur facture impayée / débours / fidéicommis ; bouton « Fermer le dossier » ; lettre de fermeture téléchargeable une fois fermé.
- [ ] `/comptabilité` : intro doctrinale + hub d'actions ; journaux en « mode expert ».

## C. Parcours assistant(e) (manuel)

- [ ] Connexion en assistant(e) → `/aujourd'hui` (accueil) avec prochaine action + file + échéances.
- [ ] Marquer un document **« final »** dans l'atelier d'édition.
- [ ] Marquer un dossier **« prêt pour revue »**.
- [ ] Poser une **question** dans la navette d'un dossier.
- [ ] Le menu de l'assistant ne montre PAS les Comptes fidéicommis (réservé avocat/compta/admin).

## D. Le moment de connexion (duo)

- [ ] Assistant marque un document final → l'avocat voit **« Document prêt »** dans son coup d'œil après rafraîchissement.
- [ ] Avocat **Approuve** ou **Renvoie** (avec raison) un « prêt pour revue ».
- [ ] Une facture validée (DRAFT → READY_TO_ISSUE) apparaît comme **« Facture prête »** chez l'avocat.
- [ ] Un acte à échéance < 3 jours remonte chez l'assistant (scan quotidien) sans réémission le lendemain.

## E. Argent (manuel)

- [ ] `/facturation` : hub avec sous-actions (honoraires, débours, aging, taxes, rentabilité) + registre.
- [ ] **Paiements** : bannière des paiements non alloués ; section soldes créditeurs (surpaiements) avec « Demander le remboursement » (aucun mouvement d'argent réel).
- [ ] Reçu de paiement consultable depuis chaque paiement.
- [ ] Les sous-pages facturation refusent l'accès par URL à un rôle non autorisé (ex. avocat sur `/facturation/paiements` → redirigé).

## F. Étanchéité (pas de fuite)

- [ ] La **console SAFE Inc.** (`/console/*`) redirige un utilisateur non interne vers le tableau de bord.
- [ ] Aucun lien vers la console / l'impersonation dans la navigation d'un cabinet client.
- [ ] Création de client/dossier accessible aux rôles attendus.

## G. Données de démo

- [ ] Le cabinet de démo charge clients, dossiers, temps, factures, paiements, fidéicommis, documents, + un duo avocat/assistant avec navette active.
- [ ] La démo est reproductible (local + preview).

---

**QA réalisée par :** ____________________   **Date :** ____________
**Verdict :** ☐ Prêt pilote   ☐ Corrections requises (lister) ____________

## Note de déploiement (important)
La migration `20260623130000_navette_p5_types` (additive : types de signaux navette + colonne `sourceRef`) doit être appliquée **avant** le déploiement du code de la Phase 5, sinon les signaux échouent silencieusement (best-effort, rien ne casse, mais aucun signal n'est émis).
