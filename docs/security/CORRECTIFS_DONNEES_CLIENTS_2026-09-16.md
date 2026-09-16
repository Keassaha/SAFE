# Protection des données clients : correctifs et mise en service

Date : 2026-09-16. Autorisation : demande explicite de correction après l'audit.

## État

Correctifs locaux, non déployés. Migration testée sur PostgreSQL local avec données fictives uniquement. Aucune donnée réelle copiée, modifiée ou supprimée. Les changements préexistants et concurrents du dépôt ont été laissés en place.

## Correctifs

- **Accès documentaire** : une politique commune vérifie cabinet, client et avocat responsable. Elle est appliquée aux routes d'édition, PDF, envoi, versions, restauration, déplacement, listes, pages d'édition et actions de cartable. Administrateur et assistante gardent leurs droits documentaires ; un rôle inconnu est refusé. Une session sans rôle n'est plus transformée en session avocat.
- **Classement** : seuls les téléversements encore orphelins et appartenant à l'utilisateur peuvent être confirmés. La destination est autorisée. Le classement est revendiqué atomiquement, puis journalisé avec ou sans IA dans la même transaction.
- **Chronomètres** : les références sont dérivées d'un document autorisé et les références incohérentes sont refusées avant écriture. Terminer vérifie la correspondance session/document/client/dossier et réserve atomiquement la transition pour empêcher une double fiche de temps. Une session terminée ne peut plus être reprise via PATCH.
- **Conservation du texte** : chaque changement de contenu conserve l'état précédent dans une version, dans la même transaction. Une concurrence détectée à l'enregistrement ou à la restauration retourne 409. Ce mécanisme conserve un historique, sans constituer une sauvegarde indépendante.
- **Conservation des exports** : un PDF synchronisé utilise un nouvel objet et un nouvel enregistrement au lieu d'écraser l'export précédent. Un hash identique permet de réutiliser une pièce existante. Des exports dont les octets diffèrent, même seulement par métadonnées PDF, peuvent produire des pièces distinctes : priorité à la conservation.
- **Suppression en cascade** : six relations passent en RESTRICT pour conserver documents, versions et sessions lorsque leur parent est supprimé. La migration ne supprime aucune ligne et s'exécute en transaction avec attente de verrou limitée à cinq secondes.
- **Classification IA** : désactivée par défaut même si une clé Anthropic existe. Activation explicite, cabinet par cabinet, par `SAFE_AI_DOCUMENT_CLASSIFICATION_CABINETS` (identifiants exacts séparés par des virgules, aucun joker). Les dossiers candidats sont filtrés selon les droits. Le classement manuel reste possible. Cette variable concerne la classification documentaire ; les autres fonctionnalités IA ne sont pas désactivées par ce correctif.
- **Secret historique** : valeurs de mots de passe retirées de deux journaux Markdown. Aucune rotation de secret ni réécriture de l'historique Git n'a été effectuée.

## Validation

- Suite générale : 187 fichiers réussis, 2 254 tests réussis ; 8 tests PostgreSQL ignorés dans cette exécution sans URL de test.
- Tests ciblés finaux : 25 réussis, couvrant les refus et usages autorisés, les conflits, les doublons, la conservation des exports et la fermeture de la transmission IA par défaut.
- PostgreSQL réel : 8 tests réussis, avec deux cabinets fictifs, vérification des permissions, refus de suppression des parents et retour arrière d'une transaction échouée.
- Migration appliquée à une base créée depuis le schéma Git de référence, puis sauvegarde `pg_dump` et restauration `pg_restore --exit-on-error` dans une seconde base locale. Deux contenus originaux et une version historique retrouvés. **Ce test porte sur des données fictives, pas sur une sauvegarde de production ni sur les fichiers Blob.**
- TypeScript et contrôle de diff exécutés ; voir le compte rendu de livraison pour le résultat final.

Les tests PostgreSQL n'utilisent jamais `DATABASE_URL` par défaut. Ils exigent `SAFE_SECURITY_TEST_DATABASE_URL` et refusent toute destination autre que `127.0.0.1:55439/safe_security_test`.

## Mise en production : ordre obligatoire pour cette livraison

1. **Remplacer le secret historique s'il est encore actif.** Le retirer du fichier ne le retire pas des clones ou de Git. Identifier les consommateurs, préparer leur bascule, effectuer la rotation et vérifier la connexion ; ne pas changer uniquement un côté. Aucun secret ne doit être communiqué dans une conversation ou inscrit dans les journaux.
2. **Obtenir une sauvegarde indépendante vérifiée.** Sauvegarder la base ET les objets documentaires et pièces jointes de support dans un stockage privé séparé du projet source, chiffré, avec suppression/versionnement protégés. Définir la perte maximale acceptable et le délai de reprise avec le responsable. Ne pas considérer le simple statut « sauvegarde activée » comme preuve de restauration.
3. **Restaurer sur une destination isolée.** Vérifier la présence des clients, dossiers, documents, versions et références ; comparer les comptes et les empreintes des fichiers ; ouvrir plusieurs pièces restaurées ; tester les permissions. Désactiver courriels, paiements, crons et IA sur cette destination. Ne jamais restaurer par-dessus la production pour cet exercice.
4. **Préparer une livraison isolée.** Ce dépôt contient d'autres changements et migrations en cours. Ne pas publier tout le répertoire de travail ni appliquer aveuglément toutes les migrations. Inclure les seuls correctifs documentés ici et leur migration, puis vérifier la différence de schéma et la séparation des environnements.
5. **Appliquer la migration et déployer le code revu.** Un échec de verrou doit arrêter la migration, pas provoquer une suppression de données ni un contournement des contraintes. Laisser l'activation de classification IA vide tant que les conditions de traitement externe n'ont pas été validées.
6. **Vérifier le déploiement.** Avec des comptes de test autorisés : avocat responsable accepté, autre avocat/cabinet refusé, autosave restaurable, export précédent encore présent, chronomètre sans doublon. Conserver la preuve de version déployée et de migration appliquée.

## Limites ouvertes

Pas de certification de sauvegardes, de chiffrement, de région, de RLS effectif ou de séparation Preview/Production : leurs configurations cloud n'ont pas été consultées. Pas de rotation effective du secret historique. Les autres observations de l'audit (CSP, limitation de débit, liens publics d'audit, fenêtre de révocation des sessions) ne sont pas annoncées comme résolues par cette livraison. Un accès administrateur direct à la base peut toujours supprimer des données ou désactiver des contraintes : sauvegardes indépendantes et contrôle des comptes cloud restent nécessaires.
