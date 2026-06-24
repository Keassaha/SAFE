# Script de démo SAFE — 20 minutes

> Scénario d'appel de vente. Objectif : montrer que SAFE garde le contrôle d'un cabinet (risque fidéicommis, argent, dossiers) sans alourdir le quotidien. Fil conducteur : « l'assistant prépare, l'avocat approuve ».
> Ton : « vous ». Pas de jargon. Le client est le héros.

## Avant l'appel (2 min, hors chrono)
- Ouvrir l'app sur le **cabinet de démo** (voir `prisma/seeds/` + guide ci-dessous), connecté en **avocat**.
- Avoir un second onglet prêt, connecté en **assistant(e)**, pour le moment navette.
- Vérifier que le tableau de bord montre des chiffres réalistes (fidéicommis, à recevoir, encaissé).

## Déroulé

### 1. L'accueil qui dit quoi faire (3 min) — rôle avocat
- Ouvrir `/tableau-de-bord`.
- Pointer le **coup d'œil avocat** en haut : « ce qui vous attend » (prêt pour revue, questions, document prêt, facture prête) **avant** les chiffres.
- Message : « En 15 secondes, vous voyez ce qui demande une décision, puis seulement après, vos indicateurs. »
- Montrer la carte **fidéicommis** : solde + dernier rapprochement. « Le risque numéro un d'une inspection, surveillé en continu. »

### 2. Un dossier, du début à la facture (5 min) — rôle avocat
- Ouvrir un **client** puis un **dossier** actif.
- Montrer les onglets du dossier (mandat, pièces, correspondance, fidéicommis, fermeture).
- Aller dans **Temps** : montrer des heures saisies, prêtes à facturer.
- Aller dans **Facturation** : montrer le hub (honoraires à facturer, débours, aging, taxes, rentabilité) + le registre des factures.

### 3. Le moment clé : l'assistant prépare, l'avocat approuve (5 min) — DEUX rôles
> C'est le cœur de la démo. Basculez entre les deux onglets.

- **Onglet assistant(e)** (`/aujourd'hui`) : l'assistant termine un document → clique **« Marquer comme final »**. Ou marque un dossier **« prêt pour revue »**.
- **Onglet avocat** (`/tableau-de-bord`) : rafraîchir → le **coup d'œil** affiche maintenant « Document prêt » / « Prêt pour revue ». L'avocat clique **Approuver** (ou Renvoyer avec une raison).
- Message : « Rien ne se perd entre l'assistant et vous. Le travail terminé remonte tout seul à la bonne personne, sans courriel, sans relance. »
- Bonus : montrer qu'une **facture validée** apparaît comme « facture prête à émettre » dans le coup d'œil de l'avocat.

### 4. L'argent compréhensible (3 min) — rôle avocat ou compta
- Ouvrir `/comptabilité` : montrer l'**intro doctrinale** (« comptabilité opérationnelle + export vers votre comptable ») + le **hub d'actions** (Encaisser, Dépenses, Contrôle mensuel, Exporter).
- Aller dans **Paiements** : montrer la **bannière des paiements non alloués** et la section **soldes créditeurs (surpaiements)** avec « Demander le remboursement ». « SAFE voit l'argent qui dort et le trop-payé, sans jamais y toucher. »

### 5. Fermer proprement (2 min) — rôle avocat
- Ouvrir un dossier, onglet **Fermeture**.
- Montrer l'**alerte** sur ce qui reste à régler (facture impayée, débours, fidéicommis) avant de fermer.
- Message : « Un dossier ne se ferme pas en laissant de l'argent ou un risque derrière. Et chaque fermeture laisse une trace, avec une lettre de fermeture pour le client. »

### 6. Clôture (2 min)
- Récap : « Vous gardez le contrôle (fidéicommis, argent, dossiers), votre assistant est valorisé, et rien ne tombe entre les mailles. »
- Prochaine étape : audit gratuit ou démarrage pilote (voir guide pilote).

## Notes
- Si une donnée manque pendant la démo, basculer sur un autre dossier du cabinet de démo plutôt que d'improviser.
- Ne jamais montrer la console SAFE Inc. ni l'impersonation (interne, hors périmètre client).
