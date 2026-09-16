# Audit ciblé de sécurité SAFE

Date : 2026-09-16. Référence Git : `c7a3a88`, avec modifications locales préexistantes.
Statut : constat initial conservé comme référence. Des correctifs locaux ont ensuite été préparés et testés, sans déploiement ; voir [le compte rendu](CORRECTIFS_DONNEES_CLIENTS_2026-09-16.md). Les trois reproductions ont été converties en tests de régression.

## Question et synthèse

Quels chemins du code permettent de contourner les permissions ou le cloisonnement des dossiers ?

Trois défauts de contrôle d'accès ont été reproduits en invoquant les vrais gestionnaires de routes avec une session et une base simulées. Deux concernent les documents au sein d'un cabinet ; le troisième accepte des références étrangères au cabinet lors de la création d'une session de travail. Aucun test n'a été envoyé à la production. Aucune compromission passée n'est démontrée.

## Méthode et limites

Lecture ciblée des règles du projet, de l'authentification, des permissions, du middleware, des routes d'édition et de téléchargement, de routes publiques, du webhook Stripe, du stockage documentaire, du schéma Prisma, du script de déploiement et de l'audit du 28 juillet.

Les trois tests ajoutés sont des **reproductions du comportement vulnérable** : leur succès confirme le défaut, pas la sécurité. Ils doivent être remplacés par des assertions de refus lors de la correction. Les mocks ne prouvent pas le comportement d'une base déployée, de ses éventuels triggers ou de ses politiques RLS.

Ce travail n'est pas un audit exhaustif de toutes les routes/actions, des dépendances ou de l'infrastructure. Secrets, données clients, configuration cloud et historiques d'accès n'ont pas été inspectés. Les conclusions de l'ancien audit sur les variables de production ne sont pas reprises comme des faits actuels.

## S1 : modification de documents sans contrôle du responsable

Priorité : **élevée**. `VERIFIE` dans le code et par reproduction locale.

Source : `app/api/edition/documents/[id]/route.ts:70`, garde de rôle au début de PUT ; politique de référence `lib/auth/permissions.ts`, fonction `canEditDossierAsAvocat`.

PUT autorise un rôle `avocat` via `canViewDocuments`, puis ne recherche le document que par `id` et `cabinetId`. Il ne vérifie ni le responsable du dossier ni un droit d'écriture. Le test utilise un avocat A et un document d'un dossier attribué à B : la politique d'édition refuse A, mais PUT met à jour le contenu et retourne 200.

GET et DELETE du même module présentent aussi l'absence de contrôle du responsable, constatée par lecture. GET expose contenu et versions ; DELETE archive. La route de liste `app/api/edition/documents/route.ts` permet d'obtenir les identifiants et contenus par dossier du cabinet, sans filtre du responsable.

Préconditions : session avocat valide, même cabinet, identifiant du dossier/document. Il ne s'agit pas d'un accès anonyme ni d'une lecture entre cabinets démontrée.

Correctif : appliquer une garde centrale de lecture/écriture qui charge le dossier, vérifie le cabinet et le responsable ; couvrir liste, lecture, écriture, archivage et routes annexes. Valider explicitement toute exception de collaboration au lieu de remplacer une permission d'écriture par une permission de lecture.

## S2 : réaffectation d'une pièce permettant de contourner son accès

Priorité : **élevée**. Réaffectation `VERIFIE` par reproduction ; accès ultérieur `INFERENCE` directe du service de téléchargement.

Sources : `app/api/edition/upload/confirm/route.ts:41` et `:67` ; `lib/services/document.ts`, fonction `canAccessDocument` ; `app/api/documents/[id]/download/route.ts`.

La confirmation accepte n'importe quel document du cabinet, même déjà classé dans un dossier. Elle ne vérifie ni l'auteur du téléversement ni le droit sur le dossier source et remplace `dossierId` et `clientId`. Un avocat peut donc réaffecter une pièce du dossier d'un collègue à son propre dossier. Le test reproduit cette mutation avec une réponse 200.

Le téléchargement vérifie ensuite le responsable du **nouveau** dossier : le déplacement permet logiquement à l'avocat de franchir cette garde. Le téléchargement du fichier réel n'a pas été exécuté.

Préconditions : session avocat valide, identifiant d'une pièce du même cabinet et dossier de destination. La découverte de tous les identifiants de pièces n'a pas été auditée.

Correctif : réserver cette confirmation aux téléversements en attente appartenant à l'utilisateur autorisé ; vérifier le droit d'écriture sur la destination. Traiter le déplacement d'une pièce existante comme une opération distincte, autorisée sur source et destination, atomique et journalisée même si `iaValidated` vaut false.

## S3 : références inter-cabinets acceptées dans les chronomètres

Priorité : **élevée pour l'intégrité**, portée en production à confirmer.

Sources : `app/api/edition/sessions/route.ts:28`, `:39` ; `prisma/schema.prisma:4556`.

`VERIFIE` : POST dérive `cabinetId` de la session mais copie directement les trois identifiants reçus (`richDocumentId`, `dossierId`, `clientId`) dans `workSession.create`, sans rechercher leurs propriétaires ni leur cohérence. Le test confirme que des références étiquetées cabinet B sont transmises à la création sous cabinet A.

`VERIFIE` : le schéma Prisma définit des clés étrangères individuelles sur les identifiants ; il ne définit pas ici de contrainte composite imposant le même cabinet. `INFERENCE` : avec des identifiants étrangers existants et sans protection supplémentaire en base, cela crée une relation entre cabinets. Aucune extraction de contenu d'un autre cabinet n'est démontrée par ce test.

Correctif : charger le document dans le cabinet courant, vérifier les permissions, puis dériver client et dossier depuis ce document côté serveur. Refuser tout conflit avant de modifier une session existante. Ajouter des tests avec deux cabinets et une base de test isolée ; envisager des contraintes composites.

## Autres points observés

- `VERIFIE` : `app/api/edition/documents/[id]/terminer/route.ts` vérifie l'utilisateur et le cabinet de la session de travail, mais pas sa correspondance avec le document de l'URL, ni qu'elle n'est pas déjà terminée. Un nouvel appel crée une nouvelle entrée de temps. Risque d'intégrité et de doublons à couvrir avec une transition atomique et idempotente. Pas de reproduction dédiée dans cette passe.
- `VERIFIE` : `app/api/audit-gratuit/[id]/route.ts` renvoie contact et réponses complètes au porteur de l'identifiant, sans vérifier le secret mentionné dans son commentaire. L'identifiant est un CUID ; aucune énumération facile n'est démontrée. Le lien agit comme un secret permanent sans expiration dédiée. Revoir la minimisation et prévoir un jeton révocable si ce partage public reste voulu.
- `VERIFIE` : la CSP de `next.config.ts` est en Report-Only et contient `unsafe-inline` et `unsafe-eval`. C'est une protection incomplète, pas une preuve de XSS exploitable.
- `VERIFIE` : `lib/rate-limit.ts` retombe en mémoire quand Redis est absent ou échoue. `A_CONFIRMER` : configuration Redis actuelle en production et comportement sous panne.
- `VERIFIE` : `lib/auth.ts` revalide les droits au plus toutes les 15 minutes. Une désactivation ne garantit donc pas une coupure immédiate.
- `A_CONFIRMER` : séparation des bases Preview/Production, état RLS réel, sauvegardes de la base ET des objets, restauration testée. Le script de build interdit déjà les migrations hors production, mais ce garde-fou ne prouve pas que les bases sont séparées.

## Protections constatées

Stockage Blob demandé en mode privé ; téléchargement authentifié avec contrôle par document ; mots de passe comparés avec bcrypt ; jeton de réinitialisation haché avant recherche ; revalidation des sessions ; vérification de signature Stripe avant traitement. Ces observations portent sur le code, pas sur la configuration effective du déploiement.

## Validation exécutée

Commande locale :

```sh
./node_modules/.bin/vitest run docs/security/__tests__/audit-2026-09-16.test.ts lib/auth/__tests__
```

Résultat : 7 fichiers, 51 tests réussis, dont 3 reproductions de défauts et 48 tests existants. Aucun accès réseau/base dans les reproductions. Aucun changement au code applicatif ni aux fichiers de travail préexistants.

## Prochaine action

Priorité 1 : corriger ensemble les gardes du module d'édition, puis convertir les trois reproductions en tests de refus et ajouter les cas autorisés. Terminé signifie : accès refusé au mauvais avocat/cabinet, déplacement contrôlé, aucune régression des opérations légitimes.

Priorité 2 : vérifier les environnements et réaliser une restauration sur une destination isolée, base et fichiers compris. Le présent audit ne certifie aucune sauvegarde existante.

## Sources

Les chemins et fonctions cités ci-dessus désignent le code local inspecté. Fichier de preuves : `docs/security/__tests__/audit-2026-09-16.test.ts`. Contexte historique uniquement : `docs/security/AUDIT_SECURITE_2026-07-28.md`.

## Complément : données clients (2026-09-16)

### Transmission au service IA

`VERIFIE` : `components/edition/UploadZone.tsx:117` envoie `classify=true`. La route `app/api/edition/upload/route.ts:41` active également cette option par défaut. Elle sélectionne jusqu'à 50 dossiers non clôturés du cabinet, sans filtre par avocat responsable (`:86`). `lib/ai/classify-document.ts` construit un appel Anthropic comprenant nom du fichier, jusqu'à 2 000 caractères de texte extrait, noms de clients, intitulés, identifiants et numéros des dossiers candidats. L'appel se produit si une clé API existe et que la liste des dossiers n'est pas vide. La validation humaine du classement intervient après cette transmission.

Ce flux externe n'est pas en lui-même une preuve de fuite ou d'usage illicite. En revanche, il élargit les données transmises à des dossiers sans rapport nécessaire avec la pièce téléversée. Aucun contrôle d'activation par cabinet n'apparaît dans cette route ou ce service. `A_CONFIRMER` : activation en production, conditions de traitement et de conservation convenues, information des cabinets et localisation effective. Aucun appel IA n'a été exécuté pendant l'audit.

Correctif proposé : contrôle serveur d'activation par cabinet, filtrage des dossiers selon les droits de l'utilisateur, réduction des métadonnées au strict nécessaire et vérification des conditions du fournisseur avant activation.

### Cloisonnement en base

`VERIFIE` : `scripts/secure-rls.mjs` active RLS sur les tables publiques, mais ne crée pas de politiques de séparation par cabinet. Son architecture documentée prévoit une connexion Prisma propriétaire qui contourne RLS. `A_CONFIRMER` : rôle réellement utilisé en production et privilèges effectifs. Dans cette architecture, RLS protège l'accès direct via l'API Supabase, mais ne compense pas les omissions de permissions dans les routes Prisma.

### Stockage, effacement et récupération

`VERIFIE` : le code demande un stockage Blob privé et des téléchargements authentifiés. Le schéma `Document` utilise `Restrict` sur dossier et auteur (`prisma/schema.prisma:3338`). En revanche, `RichDocument.dossier` conserve `onDelete: Cascade` (`:4517`) : une suppression physique du dossier pourrait supprimer documents rédigés et versions. Aucun chemin exploitable de suppression du dossier n'a été établi dans cette passe.

`A_CONFIRMER` : chiffrement et région des services réellement déployés, rétention des sauvegardes et capacité de restauration conjointe base/fichiers. La recherche ciblée dans `docs/security`, `docs/journal` et `scripts` n'a pas fourni de preuve de restauration complète réussie. Cela ne démontre pas l'absence de sauvegardes gérées chez les fournisseurs.

Conclusion : la confidentialité des données clients présente des défauts applicatifs établis ; leur récupérabilité et plusieurs protections d'infrastructure restent non vérifiées. Aucun constat de compromission réelle à ce stade.
