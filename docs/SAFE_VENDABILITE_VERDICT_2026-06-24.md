# Verdict de vendabilité — SAFE (2026-06-24)

Après l'exécution complète du calendrier éditorial (Phases 1 à 7). Audit croisé : conformité + flux d'argent, utilisabilité bout-en-bout, et état opérationnel observé en prod.

## Verdict en une phrase
**Le produit est vendable sur le fond (fonctionnellement complet, cœur réglementaire solide), mais il n'est pas « vendable aujourd'hui tel quel » : il reste une courte liste de blocages surtout OPÉRATIONNELS, pas un manque de produit.** Distance estimée : quelques jours, pas un chantier.

## Ce qui est SOLIDE (prêt à vendre)
- **Fidéicommis** : dépôt/retrait, plafond comptant, rapprochement mensuel certifié, isolement du solde opérationnel, blocage solde négatif, anti-TOCTOU (verrou advisory). Vérifié au code.
- **Numérotation des factures sans trou** (brouillon = numéro provisoire, numéro officiel à l'émission). Conforme Barreau.
- **Conservation / archivage** : pas de hard delete client (archive), rétention 7/10 ans configurable.
- **Taxes TPS/TVQ + province (QC/ON)**.
- **Parcours critique complet et câblé** : connexion → client → dossier → temps → facture → paiement → fermeture. Vérifié de bout en bout.
- **Onboarding + états vides guidés**, **navette** avocat↔assistant, **modules expérimentaux bien gatés** (console/impersonation/paie invisibles pour un cabinet client).
- **Matériel de vente** : script de démo, guide pilote, seed de démo.

## Blocages à lever avant de vendre

### P0 — Opérationnel (le produit doit être utilisable en prod)
1. **Connexion prod cassée** : le propriétaire ne peut pas se connecter à `safecabinet.ca` (la base répond `{"ok":true}`, donc c'est le mot de passe/compte, pas l'infra). Un produit où on ne peut pas entrer n'est pas vendable. → « Oublié ? » ou script de reset.
2. **Données de test en prod** : le client « Test » (ptiahou@gmail.com) + sa facture/paiement polluent les KPI. À supprimer (script prêt, aperçu d'abord).
3. **État de déploiement / migrations** : confirmer que la prod tourne le bon build et que la migration `20260623130000_navette_p5_types` est appliquée.

### P1 — Produit (une vraie promesse à finir)
4. **Export comptable mappable non branché** : `exportAccountingPeriodAction` (QB/Xero/Sage, double-entrée balancée) est codé et testé mais **aucun bouton ne l'appelle** ; la carte « Exporter au comptable » est un no-op ; seul un CSV plat est exposé. C'est la Semaine 1 du calendrier Comptabilité. Effort : faible (brancher un bouton).
5. **Fonctions IA** : sans `ANTHROPIC_API_KEY`, les features IA échouent en silence. → les masquer tant que la clé n'est pas configurée, ou configurer la clé.
6. **Incohérences page Comptabilité** : KPI affichés en double, cartes hub = doublon des onglets (cf. calendrier Comptabilité).

### P2 — Polish (non bloquant)
- Reskin de quelques écrans secondaires, nettoyage lint (55 pré-existants), libellés KPI unifiés.

## Conclusion
Le calendrier de vendabilité est tenu : le **produit** est là, et la partie la plus dure (conformité Barreau + flux d'argent) est solide. Ce qui empêche de vendre **aujourd'hui** n'est pas une lacune de fonctionnalités, c'est une **mise en service** : pouvoir se connecter en prod, nettoyer les données de test, confirmer le déploiement, et brancher l'export comptable. Une fois ce P0/P1 fait (jours, pas semaines), SAFE est vendable en pilote.
