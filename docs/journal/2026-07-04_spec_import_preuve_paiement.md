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

## État
Spec figée v1. **L1 + L2 + L3 terminés et vérifiés (unit + navigateur).** Base fonctionnelle utilisable :
uploader une preuve Interac → pré-remplir → confirmer → paiement créé. Restent :
- **L4** : garde-fous doublon (réf Interac unique) + conservation de la preuve (dépend du GATE stockage
  Supabase désaligné) + migrations (`Payment.preuveStorageKey/interacReference/payerName/payerEmail`).
- **L5** : règles de payeur tiers (`PayerRule` + « se souvenir » + page réglages).
- **L6-L8** (v2) : intake email.
RIEN n'est commité (tous fichiers en working tree).
</content>
