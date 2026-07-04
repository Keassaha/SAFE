# SPEC — Import intelligent de preuve de paiement (Interac)

> Statut : DRAFT v1, en attente validation CEO avant build.
> Date : 2026-07-04. Auteur : co-direction.
> Règle projet : pas de build sans spec validée (CLAUDE.md).

---

## 1. Problème (formulation TDAH / anti-erreur)

Aujourd'hui, enregistrer un paiement = ouvrir `PaiementFormModal`, **retranscrire à la main** le
montant, choisir le client, choisir la facture, taper la note. La retranscription manuelle d'un
chiffre d'un écran vers un autre est exactement le point où :

- une erreur de montant se glisse (chiffre inversé, virgule),
- l'attention décroche à mi-tâche (charge cognitive : lire ici, retaper là),
- le paiement est relié au mauvais client / mauvaise facture.

**Thèse produit :** on n'accélère pas la saisie, **on supprime la retranscription**. Le cabinet
uploade une preuve Interac, la machine lit et pré-remplit, l'humain confirme d'un clic.

---

## 2. Périmètre

### Principe d'architecture : un moteur, des portes d'entrée (intakes)

L'upload manuel et la connexion courriel ne sont PAS deux fonctionnalités concurrentes. Ce sont deux
**portes d'entrée (intakes)** vers **un seul moteur** : `extraire → matcher → confirmer`. Le matching
est identique quelle que soit la provenance de l'image. On construit donc le moteur une fois, avec une
**frontière d'intake explicite** (`PaymentProofIntake`), et on branche les portes dessus.

```
Intake UPLOAD (v1) ─┐
                    ├──▶ [ extraire → matcher ] ──▶ [ confirmer (humain) ] ──▶ POST paiement
Intake EMAIL (v2)  ─┘
```

Conséquence de séquencement (forcée par l'archi, pas par préférence) : **le moteur d'abord**. L'email
ne peut rien alimenter tant que le moteur n'existe pas ; une fois le moteur là, l'upload est quasi
gratuit et l'email devient un adaptateur qui réutilise ~80 % du code.

### v1 — Moteur + intake UPLOAD
- **Paiement entrant** dont on a une **preuve image** (capture Interac, courriel Interac en image/PDF, reçu).
- Extraction : montant, nom de l'expéditeur, message/note (souvent le n° de dossier), date.
- Matching automatique → client + facture ouverte + dossier, avec **niveau de confiance visible**.
- **Confirmation humaine obligatoire** avant toute écriture. Jamais d'auto-save.
- Aucune dépendance externe (pas d'OAuth). Livrable dès que la clé prod est posée.

### v2 — Intake EMAIL (« automatique avec signal »)
- Le cabinet connecte sa boîte une fois (OAuth). SAFE capte le courriel Interac entrant, lance
  extraction + matching **automatiquement**, et **notifie** : « paiement de X $ de NOM détecté,
  dossier Y, prêt à confirmer ».
- Plafond d'automatisation (règles dures, cf. §5) : un match **🟢 certain** peut devenir **un seul
  clic** ; tout **🟠/🔴** garde l'écran de confirmation ; le routage operating vs fidéicommis n'est
  **jamais** automatique. Donc « automatique » = extraction + matching + notification auto, pas
  écriture aveugle au journal.
- **Coûts réels qui justifient v2 après v1** : (a) OAuth par cabinet = vérification Google/Microsoft,
  dépendance externe lente + revue sécurité ; (b) lire la boîte courriel = portée sensible Loi 25 à
  cadrer. À ne pas improviser dans le lot du cœur.

### Hors périmètre (spec séparée)
- Dépenses / reçus fournisseurs (`CabinetExpense`) → **décision CEO 2026-07-04 : spec dédiée séparée**,
  même moteur vision + confirmation réutilisé.
- Rapprochement de relevé bancaire.

> Décision de scope : v1 = **moteur + upload d'image (Interac d'abord)**. v2 = **intake email**
> (même moteur). Dépenses = autre spec. On ne mélange pas les trois dans un même lot.

---

## 3. Ce qui existe déjà (à réutiliser, ne pas réinventer)

| Brique | Emplacement | Réutilisation |
|--------|-------------|---------------|
| Modèle paiement | `prisma/schema.prisma:1259` (`Payment`) | champs `montant`, `method` (dont `e_transfer`), `referenceNumber`, `note`, `clientId`, `invoiceId`, `sourceAccountType` |
| Allocation multi-facture | `PaymentAllocation` (`schema.prisma:1289`) | relier paiement ↔ facture(s) |
| Formulaire | `components/facturation/PaiementFormModal.tsx` | à **pré-remplir**, pas remplacer |
| Route création | `POST /api/facturation/paiements` | inchangée, reçoit le payload confirmé |
| Appel Claude (texte) | `lib/ai/classify-document.ts`, `lib/ai/summarize-dossier.ts` | même client Anthropic, **nouveau mode vision** |

**Aucune** capacité d'upload d'image ni de vision n'existe encore. C'est le vrai neuf de ce lot.

---

## 4. Architecture cible (4 briques)

```
Intake UPLOAD (v1) ─┐   ┌─ type PaymentProofIntake = { fileBytes, mime, source } ─┐
Intake EMAIL  (v2) ─┘   └──────────────────────────────────────────────────────────┘
        │
        ▼
[1] extract-payment-proof.ts  ── Claude vision ──▶  { montant, expediteur, message, date, devise, confiance_ocr }
        │
        ▼
[2] match-payment.ts          ── règles déterministes ──▶  { client?, factures[], dossier?, niveau_confiance }
        │
        ▼
[3] PaiementFormModal pré-rempli  (preuve à gauche, champs à droite, badges de confiance)
        │
        ▼ (clic humain « Confirmer » — un seul clic si 🟢)
[4] POST /api/facturation/paiements  (flux existant, inchangé)
```

Les briques [1]→[4] sont **communes** à tous les intakes. L'upload (v1) et l'email (v2) ne diffèrent
que par la façon dont l'image entre dans `PaymentProofIntake`.

### Brique 1 — Extraction vision (`lib/ai/extract-payment-proof.ts`)
- Entrée : image (png/jpg) ou PDF de la preuve.
- Appel Claude en **mode vision** (bloc `image`), modèle `claude-sonnet-4-5`.
- Sortie **JSON strict** :

```json
{
  "montant": 750.00,
  "devise": "CAD",
  "expediteur_nom": "KEASSAHA JEREMIE TIAHOU",
  "expediteur_courriel": "keassahatd@gmail.com",
  "message": null,
  "date": "2026-06-28",
  "reference_interac": "C1ArqBDEgCn7",
  "banque_source": "TD Canada Trust",
  "compte_dest_4derniers": "0126",
  "type_preuve": "interac_autodepot | interac_manuel | recu | autre",
  "confiance_ocr": "haute | moyenne | basse",
  "champs_illisibles": []
}
```

> **Réalité vérifiée sur échantillon réel (2026-07-04) :** une notification Interac en **autodépôt**
> (« déposé automatiquement ») **ne contient PAS de champ message/mémo**. Le n° de dossier que le
> client écrit n'y figure donc pas. Le champ `message` n'apparaît que dans le flux **manuel**
> (question de sécurité). Comme le cabinet destinataire active l'autodépôt par commodité, on conçoit
> pour le **pire cas : message absent**. `message` est un bonus, jamais la base.

- **Garde-fou dur** : si `montant` illisible ou `confiance_ocr = basse` → on n'invente pas, on
  renvoie le champ vide et on le signale. Aucun chiffre halluciné ne doit atteindre le formulaire.

### Brique 2 — Matching déterministe (`lib/services/finance/match-payment.ts`)
Pas d'IA ici (règle projet : les montants et rapprochements sont déterministes, cf.
`project_ai_agents`). Signaux, par ordre de fiabilité :

1. **Courriel expéditeur** (`expediteur_courriel`) contre `Client.email` — **signal fort et stable**
   (plus fiable qu'un nom mal orthographié ou tronqué). Présent même en autodépôt.
2. **Montant exact** contre `Invoice.balanceDue` (factures ISSUED / PARTIALLY_PAID / OVERDUE du cabinet).
3. **Nom expéditeur** en matching flou (normalisation accents/casse) contre `Client` (nom, prénom, raisonSociale).
4. **N° de dossier** extrait du `message` via regex — **bonus seulement**, souvent absent (autodépôt).

Sortie = **niveau de confiance combiné** :

| Niveau | Condition | Comportement UI |
|--------|-----------|-----------------|
| 🟢 Certain | courriel expéditeur = un client **ET** montant = solde exact d'**une seule** facture ouverte de ce client (ou n° dossier présent et concordant) | tout pré-rempli, vert |
| 🟠 À confirmer | client identifié mais montant ≠ solde exact / plusieurs factures ouvertes / seul le nom concorde | pré-rempli + surligné orange « vérifiez » |
| 🔴 Aucun match | ni courriel ni nom ne concordent | preuve affichée, champs vides à remplir à la main |

> **Impact honnête de l'autodépôt :** sans n° de dossier, davantage de cas tombent en 🟠 (client à
> plusieurs factures, paiement partiel). Le « zéro clic » n'est pas promis sur l'autodépôt ; l'écran
> de confirmation reste la norme. C'est le prix de la sûreté, pas un défaut.

### Brique 2bis — Règles de payeur tiers (`PayerRule`)

**Problème :** quand un tiers paie pour un client (parent → enfant, employeur → employé, assureur →
assuré, avocat → avocat), le nom et le courriel Interac ne correspondent à **aucun** client. Sans
mémoire, l'adjointe redevine le rattachement à chaque virement. Le moteur de règles supprime cette
charge répétitive.

**Modèle de règle — deux portées (évite les faux positifs) :**

| Portée | Cas d'usage | Comportement du matching |
|--------|-------------|--------------------------|
| `CLIENT_UNIQUE` | Le père paie **toujours** pour sa fille | **Résolution auto** → ce client (+ dossier si précisé). Élève la confiance : 🟢 si le montant colle à une facture ouverte, sinon 🟠. |
| `PAYEUR_CONNU` | Un assureur paie pour **40 assurés** avec le même courriel | **Reconnaissance seule** : « payeur tiers connu : [note] ». Ne force PAS un client — celui-ci reste choisi par montant/facture. Évite de rattacher 40 clients au même payeur. |

**Deux façons de créer une règle :**
1. **Manuelle** — page réglages « Payeurs tiers » : `payeur (courriel/nom) → client (+ dossier) + portée + note`.
2. **Apprise dans le flux (défaut recommandé)** — à la confirmation d'un paiement dont l'expéditeur
   n'a pas matché, case à cocher **« Se souvenir : ce payeur paie pour [client X] »** →
   crée une `PayerRule CLIENT_UNIQUE` (`source = "appris"`). Pour un payeur manifestement multi-clients,
   option **« Marquer comme payeur tiers connu »** → `PAYEUR_CONNU`. La règle naît de la confirmation,
   zéro travail en plus.

**Intégration au matching (nouveau signal 0, avant les signaux courriel/nom directs) :**
- Chercher une `PayerRule` active par `payerEmail` puis `payerName` normalisé.
- `CLIENT_UNIQUE` trouvée → client (et dossier) résolus par la règle, confiance selon le montant.
- `PAYEUR_CONNU` trouvée → étiquette « payeur tiers connu », résolution client par montant/facture comme d'habitude.
- Aucune règle **et** expéditeur ≠ client → 🔴, mais l'UI propose **« créer une règle de payeur »**.

**Garde-fous propres aux règles :**
1. **Source des fonds tracée (AML / inspection-ready).** Le paiement enregistre TOUJOURS le payeur réel
   (`payerName` / `payerEmail`) **distinct** du client au compte duquel il est appliqué. « Reçu de X,
   appliqué au client Y. » C'est un plus de conformité, pas seulement du confort.
2. **Jamais de routage fidéicommis automatique.** Une règle de payeur ne coche jamais la fiducie : un
   tiers qui verse une provision en fiducie soulève une question de propriété des fonds (choix humain conscient).
3. **Règles éditables et désactivables.** Une règle apprise par erreur doit se corriger/supprimer facilement.

### Brique 3 — UI de confirmation (extension de `PaiementFormModal`)
- Nouveau bouton d'entrée : **« Importer une preuve »** sur la page paiements.
- Modal en 2 colonnes : **preuve à gauche** (image zoomable) · **champs pré-remplis à droite**.
- Chaque champ pré-rempli porte un **badge de confiance** (vert/orange) et reste **éditable**.
- Le champ montant en 🟠/🔴 est visuellement marqué « à vérifier ».
- **Payeur tiers** : si l'expéditeur ≠ client choisi, afficher « Reçu de [payeur] » + case
  **« Se souvenir : ce payeur paie pour [client] »** (→ crée une `PayerRule`, cf. Brique 2bis).
- Bouton **« Confirmer et enregistrer »** — jamais actif tant que client + montant ne sont pas remplis.

### Brique 4 — Écriture
- Aucun changement au `POST /api/facturation/paiements`. On lui passe le payload **après**
  confirmation humaine, exactement comme une saisie manuelle. L'IA ne poste jamais seule.

---

## 5. Garde-fous (conformité + anti-erreur)

1. **Jamais d'écriture automatique.** L'extraction pré-remplit un formulaire ; l'humain valide. C'est
   la garantie anti-erreur ET la cohérence avec la doctrine « l'IA ne décide jamais des montants ».
2. **Operating vs fidéicommis = choix humain conscient.** L'extraction ne devine PAS
   `sourceAccountType`. Défaut = `operating`. Un virement Interac vers le fidéicommis (provision)
   existe, mais c'est à l'humain de le cocher. On ne route jamais automatiquement vers la fiducie.
3. **La preuve est conservée.** L'image uploadée est attachée au paiement (traçabilité inspection).
4. **Doublon.** Deux niveaux : (a) si `reference_interac` est déjà rattaché à un paiement existant,
   **bloquer** (même virement importé deux fois — clé d'idempotence exacte) ; (b) sinon, alerter si un
   paiement même montant + même client existe déjà à ±3 jours (double-enregistrement, erreur TDAH classique).

---

## 6. Modèle de données (migration additive)

Le `Payment` n'a aucun lien vers un fichier. Option retenue : **champ simple sur `Payment`**
(plus léger que relier le modèle `Document`, dont le stockage est branché sur des clés Supabase à
vérifier).

```prisma
model Payment {
  // ... existant ...
  preuveStorageKey  String?   // clé de l'image de preuve
  preuveExtractedAt DateTime? // trace : extraction IA passée
  interacReference  String?   // n° de réf Interac, clé d'idempotence anti-doublon
  payerName         String?   // payeur réel si tiers (source des fonds, distinct du client)
  payerEmail        String?

  @@unique([cabinetId, interacReference])  // même virement jamais importé deux fois
}

model PayerRule {
  id          String         @id @default(cuid())
  cabinetId   String
  payerEmail  String?        // au moins un des deux identifiants
  payerName   String?        // stocké normalisé (sans accents, minuscules) pour matcher
  clientId    String?        // cible (requis pour CLIENT_UNIQUE)
  dossierId   String?        // optionnel : précise le dossier
  scope       PayerRuleScope
  note        String?        // ex: « Père de la cliente », « Assureur Intact »
  active      Boolean        @default(true)
  source      String?        // "manuel" | "appris"
  createdById String?
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @default(now()) @updatedAt

  cabinet Cabinet  @relation(fields: [cabinetId], references: [id], onDelete: Cascade)
  client  Client?  @relation(fields: [clientId], references: [id], onDelete: Cascade)

  @@index([cabinetId, payerEmail])
  @@index([cabinetId])
}

enum PayerRuleScope {
  CLIENT_UNIQUE  // ce payeur paie toujours pour CE client → résolution auto
  PAYEUR_CONNU   // payeur tiers multi-clients → reconnaissance seule, client choisi par montant
}
```

> `interacReference` porte le garde-fou doublon (§5.4a). L'index unique par cabinet empêche
> physiquement le double-import du même virement. Nullable car les reçus non-Interac n'en ont pas.
> `payerName` / `payerEmail` tracent la source des fonds quand un tiers paie (§4 Brique 2bis, garde-fou AML).
> `PayerRule` : migration additive (nouvelle table + 1 enum), aucune donnée existante touchée.

Migration **additive** uniquement (colonnes nullables + nouvelle table `PayerRule`). Aucune donnée
existante touchée.

---

## 7. Dépendances / gates AVANT de coder

- [ ] **`ANTHROPIC_API_KEY` sur Vercel prod.** Confirmée en local (2026-06-04) mais pas vérifiée en
  prod. Sans elle, l'extraction renvoie 502 en production. **Bloquant.**
- [ ] **Stockage fichier fonctionnel.** Le stockage documents pointe (memory `project_db_infra_state`)
  sur des clés `SUPABASE_*` d'un projet mort. Il faut un bucket qui marche pour uploader la preuve.
  **Bloquant pour la conservation de preuve** (pas pour l'extraction elle-même, qui peut lire le
  fichier en mémoire avant stockage).

---

## 8. Découpage en lots (chacun finissable, avec définition de terminé)

| Lot | Contenu | Définition de terminé |
|-----|---------|-----------------------|
| **L0** | Débloquer les 2 gates (clé prod + bucket) | extraction testée renvoie du JSON en prod ; upload test stocké et relu |
| **L1** | `extract-payment-proof.ts` + test sur 3 vraies captures Interac | JSON correct extrait de 3 images réelles, champ illisible bien signalé |
| **L2** | `match-payment.ts` + tests (3 niveaux de confiance) | fonction pure testée : 🟢/🟠/🔴 sur cas construits |
| **L3** | UI import + pré-remplissage + badges dans `PaiementFormModal` | à l'écran : j'uploade → champs remplis → je confirme → paiement créé |
| **L4** | Garde-fous doublon + conservation preuve + migrations | doublon alerté, image visible sur le paiement enregistré |
| **L5** | **Règles de payeur tiers** : table `PayerRule`, signal 0 dans le matching, case « se souvenir » à la confirmation, page réglages « Payeurs tiers » | un tiers paie → je coche « se souvenir » → au prochain virement du même payeur, le bon client est reconnu tout seul |

Ordre imposé : L0 → L1 → L2 → L3 → L4 → L5. Le moteur de règles (L5) s'appuie sur L2/L3 déjà en
place ; il ne bloque pas la mise en service de base (upload + confirmation) qui marche dès L4.

### Lots v2 (intake email — après validation de v1 en usage réel)

| Lot | Contenu | Définition de terminé |
|-----|---------|-----------------------|
| **L6** | OAuth boîte courriel par cabinet + stockage credentials + cadrage Loi 25 | un cabinet connecte sa boîte, jeton stocké chiffré |
| **L7** | Capteur courriel Interac → `PaymentProofIntake` → moteur L1/L2 (réutilisé) | un courriel Interac test déclenche extraction + matching sans upload |
| **L8** | Notification « prêt à confirmer » + confirmation 1-clic sur 🟢 | notif reçue, 🟢 confirmé en 1 clic, 🟠/🔴 ouvrent l'écran complet |

v2 réutilise L1–L5 sans les réécrire. Le neuf de v2 = uniquement l'intake (L6-L7) + la notif (L8).

---

## 9. Ce qu'on ne fait PAS dans v1
- Pas de dépenses / reçus fournisseurs → **spec séparée** (décision CEO 2026-07-04).
- Pas d'OAuth courriel → **v2** (L5-L7), même moteur.
- Pas de routage automatique vers le fidéicommis (jamais, même en v2).
- Pas de rapprochement bancaire.
```
