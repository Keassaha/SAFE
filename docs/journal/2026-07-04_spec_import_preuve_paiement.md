# 2026-07-04 — Spec : import intelligent de preuve de paiement (Interac)

Décision produit (pas de build). Spec écrite et validée en séquencement avec le CEO.

## Problème visé
Enregistrer un paiement = retranscrire à la main montant + client + facture + note dans
`PaiementFormModal`. La retranscription manuelle est le point réel d'erreur de chiffres et de
décrochage d'attention (TDAH). Objectif : supprimer la retranscription, pas juste l'accélérer.

## Ce qui a été décidé
1. **Un moteur, des portes d'entrée.** Upload et email ne sont pas concurrents : ce sont deux
   intakes (`PaymentProofIntake`) vers un seul moteur `extraire → matcher → confirmer`. Le matching
   est identique quelle que soit la source. Conséquence forcée par l'archi : **le moteur d'abord**.
2. **v1 = moteur + intake UPLOAD** (aucune dépendance externe, livrable dès la clé prod posée).
3. **v2 = intake EMAIL** (« automatique avec signal ») : extraction + matching auto + notification,
   1 clic sur 🟢, écran de confirmation sur 🟠/🔴. Après v1 car OAuth par cabinet = dépendance externe
   lente (vérif Google/Microsoft) + portée sensible Loi 25.
4. **Plafond d'automatisation (règle dure) :** jamais d'écriture aveugle au journal. L'IA ne décide
   jamais des montants ; operating vs fidéicommis n'est jamais routé automatiquement (choix humain).
5. **Dépenses / reçus fournisseurs → spec séparée** (pas dans ce périmètre).

## Briques neuves à construire (v1)
- `lib/ai/extract-payment-proof.ts` — 1re utilisation de Claude en mode **vision** dans le repo.
- `lib/services/finance/match-payment.ts` — matching déterministe, 3 niveaux 🟢/🟠/🔴.
- Pré-remplissage + badges de confiance dans `PaiementFormModal` (réutilisé, pas remplacé).
- Migration additive : `Payment.preuveStorageKey` + `Payment.preuveExtractedAt` (2 colonnes nullables).

## Gates bloquants avant de coder
- `ANTHROPIC_API_KEY` sur Vercel **prod** (confirmée local seulement) → sinon 502 en prod.
- Stockage fichier fonctionnel (clés Supabase docs pointent sur projet mort) → pour conserver la preuve.

## Réutilisation confirmée (pas de refonte)
`Payment` (`schema.prisma:1259`, a déjà `e_transfer`, `referenceNumber`, `note`, `sourceAccountType`),
`PaymentAllocation`, `POST /api/facturation/paiements` inchangée.

## Vérif L0 (2026-07-04)
- **Gate clé IA : levé.** `ANTHROPIC_API_KEY` présente sur Vercel Production + Preview (29j).
- **Gate stockage : confirmé désaligné.** `lib/services/document.ts` lit `SUPABASE_URL` (serveur) =
  projet `nhiorv…`, alors que la DB canonique = `rsblxm…`. Les uploads visent un autre projet Supabase
  (le « projet mort »). Bloque UNIQUEMENT la conservation de preuve (L4), pas l'extraction/matching.

## Découverte terrain (échantillon Interac réel fourni par CEO)
Notification Interac en **autodépôt** = **PAS de champ message/mémo**. Le n° de dossier écrit par le
client n'y figure pas (seulement dans le flux manuel à question de sécurité). Impact : signal de
matching « n° dossier » devient un bonus, pas la base. Compensation : le **courriel de l'expéditeur**
(Répondre à) est présent et matchable contre `Client.email` (signal fort). N° réf Interac = clé
anti-doublon. Spec §4 (schéma extraction + matching) et §6 (colonne `interacReference` unique) corrigées.

## Ajout spec : règles de payeur tiers (demande CEO)
Un tiers (parent, employeur, assureur, autre avocat) paie pour un client → nom/courriel Interac ≠
client. Moteur `PayerRule` ajouté (Brique 2bis) : 2 portées (`CLIENT_UNIQUE` = résolution auto,
`PAYEUR_CONNU` = reconnaissance seule pour payeur multi-clients), règle **apprise dans le flux** (case
« se souvenir » à la confirmation), source des fonds tracée (`payerName`/`payerEmail`, garde-fou AML),
jamais de routage fidéicommis auto. Lot L5 ajouté. Email décalé L6-L8.

## L1 LIVRÉ + VÉRIFIÉ SUR DONNÉE RÉELLE (2026-07-04) ✅
`lib/ai/extract-payment-proof.ts` : extraction vision Claude (`claude-sonnet-4-5`, SDK 0.90, blocs
image + document PDF). Conventions calquées sur `classify-document.ts` (null si pas de clé, parsing
JSON robuste, null si échec). Testé sur le VRAI PDF Interac autodépôt fourni par le CEO → extraction
100 % correcte : montant 750, courriel keassahatd@gmail.com, date 2026-06-28, réf C1ArqBDEgCn7,
`message: null` (autodépôt bien détecté), `typePreuve: interac_autodepot`, confiance haute. tsc propre.
Test live joué dans le scratchpad (hors suite permanente pour ne pas taper l'API à chaque run).

## L2 LIVRÉ + TESTÉ (2026-07-04) ✅
`lib/services/finance/match-payment.ts` : matcher DÉTERMINISTE (zéro IA), fonction PURE
`matchPaymentProof(extraction, candidates)` → { confidence 🟢/🟠/🔴, clientId, invoiceId, dossierId,
allocatedAmount, isThirdPartyPayer, knownPayerNote, matchedByRule, reasons }. Signaux par fiabilité :
0) règle payeur (CLIENT_UNIQUE = résolution auto / PAYEUR_CONNU = reconnaissance seule), 1) courriel
expéditeur = client (fort), 4) n° dossier dans message (bonus), 3) nom (faible, plafonné 🟠).
🟢 seulement si résolution forte (courriel/dossier/règle) + montant = solde exact d'UNE facture.
Montant illisible → jamais 🟢. Fonction pure = testable sans DB : `__tests__/match-payment.test.ts`,
10 tests verts (les 3 niveaux, règle CLIENT_UNIQUE tiers, PAYEUR_CONNU assureur, dossier via message,
règle inactive ignorée, montant null, normalisation accents). Suite finance complète : 6 fichiers /
19 tests verts. tsc propre.

Note archi : le matcher prend des candidats déjà chargés (types locaux, pas de couplage Prisma). Le
loader Prisma (charger clients/factures ouvertes/dossiers/règles d'un cabinet) viendra avec L3, quand
il aura une vraie page pour l'appeler. `PayerRuleInput` typé indépendamment → L2 ne dépend pas encore
de la migration `PayerRule` (L5).

## L3 LIVRÉ + VÉRIFIÉ AU NAVIGATEUR (2026-07-04) ✅
UI d'import bout en bout. 4 fichiers :
- `lib/services/finance/payment-match-candidates.ts` : loader Prisma (clients + factures ouvertes +
  dossiers ; `payerRules: []` jusqu'à L5).
- `app/api/facturation/paiements/import-preuve/route.ts` : POST multipart, auth + canManageInvoices,
  garde-fous type/taille (10 Mo), extraction → matching, NE PERSISTE RIEN (renvoie extraction + match).
- `components/facturation/ImportPreuveModal.tsx` : zone d'upload → écran review 2 colonnes (preuve à
  gauche, champs pré-remplis éditables à droite), bandeau de confiance 🟢/🟠/🔴 + raisons, bandeau
  payeur tiers, confirme via le POST paiements EXISTANT (Brique 4 inchangée). paymentMethod = e_transfer.
- `PaiementsView.tsx` : bouton « Importer une preuve » à côté de « Nouveau paiement ».
- i18n : `paymentImport.*` + `billingUi.importProof` FR/EN, parité 3306/3306.

Vérif navigateur (serveur dev 3001, session active, PDF réel POSTé via le vrai endpoint) :
bouton rendu ✓ · modal ouvre (zone upload) ✓ · API HTTP 200 extraction parfaite ✓ · écran review rendu
✓ · badge 🔴 « Aucun rapprochement » (aucun client local avec ce courriel → dégradation correcte vers
saisie manuelle) ✓ · champs pré-remplis exacts (montant 750, date 2026-06-28, réf C1ArqBDEgCn7) ✓ ·
zéro erreur console ✓. tsc 0 erreur (hors console WIP CEO connu). Le chemin 🟢 est couvert par les
tests unitaires L2 (pas de client local au bon courriel pour le démontrer live).

## L4 LIVRÉ + VÉRIFIÉ AU NAVIGATEUR (2026-07-05) ✅
Anti-doublon + conservation de preuve + source des fonds.

DÉCOUVERTE clé : le gate stockage n'en est pas un pour ce lot. (a) `lib/services/document.ts` a déjà
un fallback local (`shouldUseLocalStorage()` quand NODE_ENV≠prod) + primitives `writeDocumentObject`/
`readDocumentObject` → réutilisées telles quelles. Le désalignement Supabase prod (`SUPABASE_URL`=nhiorv)
reste un problème INFRA PARTAGÉ (tous les documents), pas spécifique. (b) Le schéma a déjà `provider`/
`providerRef` + `@@unique([cabinetId, providerRef])` (ADR-012, fondation Stripe du CEO) → RÉUTILISÉS pour
l'anti-doublon Interac (`provider='interac'`, `providerRef`=réf Interac). Donc PAS de colonne
`interacReference` redondante ni de 2e contrainte.

Migration additive `20260704120000_add_payment_proof_fields` : 4 colonnes nullables sur Payment
(`preuveStorageKey`, `preuveExtractedAt`, `payerName`, `payerEmail`). Appliquée au DB LOCAL en SQL direct
(psql) car le local n'a AUCUN historique de migration (dérive connue → jamais `migrate dev/deploy` local).
Prod appliquera via `migrate deploy` dans son pipeline. `prisma generate` relancé.

Code : `createPayment` étendu (provider/providerRef/payer*/preuve* + pré-check anti-doublon sur
providerRef, la contrainte unique fait foi). Nouvelle route `import-preuve/confirmer` (multipart :
fichier + champs → conserve la preuve en best-effort, crée le paiement). Route `[id]/preuve` (stream,
Next 15 params:Promise). Modal → confirme via confirmer (garde le File, passe réf Interac + payeur si
tiers). Tableau paiements : lien trombone « Voir la preuve » si `preuveStorageKey`. i18n viewProof FR/EN.

Vérif navigateur (serveur dev, PDF réel) : upload → sélection client → confirmer → paiement créé
(montant 750, provider=interac, providerRef=C1ArqBDEgCn7, preuve conservée, preuveExtractedAt) ✓ ;
route preuve GET par ID = 200 application/pdf 223 Ko ✓ ; re-import même réf = 409 « déjà enregistré » ✓.
tsc 0 erreur (Next 15 params corrigé). Suites finance+billing+accounting : 20 fichiers / 126 tests verts.
Données de test locales nettoyées (paiements + journal + fichiers preuve).

## L5 LIVRÉ + VÉRIFIÉ AU NAVIGATEUR (2026-07-05) ✅
Moteur de règles de payeur tiers avec apprentissage dans le flux.

Migration `20260705120000_add_payer_rule` : type `PayerRuleScope` + table `PayerRule` (+ relations
Cabinet/Client, cascade). Appliquée au DB local en SQL direct. `prisma generate` relancé (⚠️ le serveur
dev doit être REDÉMARRÉ pour recharger le client Prisma, sinon `prisma.payerRule` undefined → 500 ;
appris à la dure).

Code :
- `lib/services/finance/payer-rules.ts` : CRUD (`createPayerRule` normalise payerName + anti-doublon de
  règle, `listPayerRules`, `setPayerRuleActive`, `deletePayerRule`).
- Loader `payment-match-candidates.ts` : charge désormais les vraies règles actives (fin du `[]`).
- Apprentissage en flux : `confirmer` accepte `rememberPayer` → crée une règle CLIENT_UNIQUE `source=appris`.
- Modal : case « Se souvenir : {payeur} paie pour ce client » (affichée si client choisi + pas déjà
  résolu par règle + expéditeur présent).
- API `payeurs-regles` (GET/POST) + `[id]` (PATCH activer/désactiver, DELETE).
- Page `app/(app)/parametres/payeurs-tiers` + `components/parametres/PayeursReglesView.tsx` (liste +
  création manuelle CLIENT_UNIQUE/PAYEUR_CONNU + toggle + suppression + badge « Apprise »).
- Point d'entrée : lien « Payeurs tiers » dans l'en-tête de la page paiements. Route
  `parametresPayeursTiers`. i18n `payerRules.*` + clés modal + `billingUi.managePayers` FR/EN.

Vérif navigateur (PDF réel) : confirmer avec « se souvenir » → `ruleLearned:true`, règle CLIENT_UNIQUE
source=appris, payerName normalisé ✓ ; re-extraction → matcher résout le client VIA la règle
(`byRule:CLIENT_UNIQUE`, isThirdParty, raison « Règle de payeur… ») ✓ ; page réglages affiche règle +
badge Apprise ✓ ; PATCH+DELETE = 200, règle 1→0 ✓. tsc 0 erreur. Finance+billing : 14 fichiers / 81
tests verts. Données de test nettoyées (paiements + journaux + preuves + règles).

## État
Spec figée v1. **L1 → L5 terminés et vérifiés (unit + navigateur). FEATURE COMPLÈTE (v1).**
Uploader preuve Interac → extraire → rapprocher (avec règles de payeur qui s'apprennent) → confirmer →
paiement avec preuve conservée + anti-doublon + trace source des fonds. Restent :
- **INFRA (hors périmètre feature)** : réaligner `SUPABASE_URL`/service role prod sur le projet canonique
  (`rsblxm…`) pour que la conservation de preuve marche AUSSI en prod (dev only sinon).
- **L6-L8** (v2) : intake email (OAuth boîte courriel).
Commit `30daac9` = L1-L3. **L4 + L5 PAS ENCORE commités** (working tree). Travail Stripe du CEO intact.

## DÉPLOYÉ EN PRODUCTION (2026-07-06) 🚀
Commits `30daac9` (L1-L3) + `d4489b9` (L4-L5) poussés sur origin. Déploiement prod via `vercel --prod`
(le projet N'EST PAS git-connecté : les mises en prod sont des `vercel --prod` CLI depuis le checkout
local, pas des git push). Build OK 2 min → `migrate deploy` a appliqué mes 2 migrations additives en prod.
Aliasé sur **www.safecabinet.ca**. Vérifs prod : homepage 200 ; routes `payeurs-regles` / `import-preuve`
/ `[id]/preuve` = 401 (déployées, garde-fou auth OK) ; base prod (`rsblxmmqlnywcjxztebu`) confirmée =
4 colonnes preuve sur Payment + table PayerRule présentes. FEATURE LIVE.

⚠️ SEUL RELIQUAT : conservation d'IMAGE de preuve en prod dépend du stockage Supabase, dont les clés
serveur (`SUPABASE_URL`) pointent encore le projet mort `nhiorv…` au lieu du canonique `rsblxm…`. Donc
en prod : paiement + matching + anti-doublon + règles = OK ; seule l'image de preuve dégrade proprement
(non stockée) jusqu'au réalignement Supabase (tâche infra distincte, risquée car peut orphaner les docs
existants — nécessite la clé service-role du projet canonique).

## PREUVE DANS LE DOSSIER CLIENT + STOCKAGE VERCEL BLOB (2026-07-06) ✅
1) **Preuve classée dans le dossier du client** (demande CEO) : à la confirmation, la preuve devient un
`Document` rattaché au client (+ dossier si dérivable de la facture), type `preuve_paiement`, via le
module documents (rétention Barreau). Section « Documents du client » ajoutée sur la page client
(`DocumentsSection` était importé mais jamais rendu). Commit `dee38c6`. Vérifié en dev (visible sur la fiche client).

2) **GATE STOCKAGE RÉSOLU — bascule sur Vercel Blob** (décision CEO : plutôt que réparer Supabase).
Store Blob PRIVÉ `safe-documents` créé (`vercel blob create-store --access private --yes`), token
`BLOB_READ_WRITE_TOKEN` provisionné Prod+Preview+Dev. `lib/services/document.ts` réécrit : write/read/del
→ Vercel Blob privé (`put/get/del`, `access:'private'`, `addRandomSuffix:false`), fallback fichiers
locaux conservé en dev. Confidentiel (Barreau) : store privé, jamais d'URL publique, servi via routes
auth. Round-trip put/get/del vérifié avec le vrai token. Supabase Storage retiré de document.ts (les
clés `nhiorv…` mortes deviennent hors-sujet). Commit `cabfcc5`. Déployé prod (`vercel --prod`), santé OK.

⚠️ INCIDENT évité : `vercel blob create-store` a fait un `env pull` qui a ÉCRASÉ `.env.local` (DATABASE_URL
→ prod, clé Anthropic perdue). Restauré : DB locale (`safe_local` depuis `.env` racine) + Anthropic
(depuis `.env.local.bak.claude`) + token Blob. LEÇON : les commandes `vercel blob`/`vercel env` écrasent
`.env.local` — sauvegarder avant.
</content>
