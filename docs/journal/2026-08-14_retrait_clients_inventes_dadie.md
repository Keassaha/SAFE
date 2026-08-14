# Le cabinet de Me Dadié contenait trois clients qui n'existent pas

> 14 août 2026. « Je veux pas de client inventé. »

## Ce qui a été retiré

`scripts/seed-dadie.mjs` avait rempli l'espace avec des dossiers fabriqués :
Ibrahim Diallo (immigration), la famille Lemay (garde, aide juridique),
9312-4477 Québec inc. (recouvrement). Des noms, des montants, des heures qui
n'appartiennent à personne, dans un espace montré à un vrai prospect.

Un nouveau script, `scripts/vider-donnees-inventees-dadie.mjs`, retire tout ce
qui en dépend, dans l'ordre que les clés étrangères imposent :

TimeEntry → InvoiceLine → Invoice → TrustTransaction → TrustAccount →
TrustBankAccount → ConflictCheck → Dossier → Client.

Vérifié en base avant d'agir : aucune autre table du produit ne référence ces
clients ou ces dossiers, par une recherche exhaustive de toutes les colonnes
`clientId` et `dossierId` du schéma, pas seulement des tables qu'on pensait
concernées.

Exécuté en local d'abord, puis en production. Résultat, confirmé par requête
directe : 0 client, 0 dossier, 0 facture, 0 entrée de temps, 0 compte en
fidéicommis pour `dadie-avocat-qc-2026`.

## Ce qui reste

Le cabinet, l'accès admin (`jjd@dadieavocat.ca`), l'interface configurée
(horaire, sans couche assistante), les 7 types et gabarits de débours — un
catalogue générique, pas une donnée client. Un cabinet vide, prêt à recevoir
les vrais dossiers de Me Dadié.

## Le script d'installation ne peut plus recréer ces clients

`upsertClients`, `upsertDossiers`, `upsertInvoices`, `upsertTimeEntries`,
`upsertTrust`, `upsertConformite` restent dans `seed-dadie.mjs`, mais ne sont
plus appelées depuis `main()`. Elles documentent la forme du modèle de données
pour ce cabinet (horaire, fidéicommis actif, aide juridique régulière) sans
jamais s'exécuter. Une relance du script, dry-run ou réelle, ne recrée ni
client ni dossier ni facture. Vérifié : rejoué deux fois contre la production,
zéro écriture sur ces tables les deux fois.

Le fil d'activité CRM a été corrigé dans le même mouvement : la note qui
annonçait « clients, dossiers, heures, factures, débours, conflits » configurés
dit maintenant ce qui est vrai, un cabinet vide et un accès prêt.

## Portée de la règle

Ce n'est pas propre à Me Dadié. Aucun cabinet de démonstration, présent ou
futur, ne doit porter de noms de clients fabriqués. Un espace vide avec un vrai
accès est une meilleure démonstration qu'un espace peuplé de fiction : ce que
l'écran montre, il devra le montrer pour vrai à la première utilisation.
