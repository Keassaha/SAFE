# SPEC — Plusieurs personnes sur un dossier (co-clients + parties)

> Statut : DRAFT v1, en attente validation CEO avant build.
> Date : 2026-07-07. Auteur : co-direction.
> Origine : demande écrite du cabinet de Me Derisier. « Le système ne permet d'enregistrer qu'un seul client alors que nous avons souvent plusieurs clients pour une même affaire. »
> Décision de portée (CEO, 2026-07-07) : supporter LES DEUX natures de personnes sur un dossier (co-clients ET parties).
> Diagnostic source : `docs/journal/2026-07-07_diagnostic_multi_clients_par_dossier.md`
> Règle projet : pas de build sans spec validée (CLAUDE.md).

---

## 1. Problème

Aujourd'hui, un dossier est rattaché à **exactement un** client. La contrainte est ancrée à trois
niveaux empilés, pas seulement dans l'écran :

- **DB** : `Dossier.clientId` = FK unique, `NOT NULL`, `onDelete Restrict`. Aucune table de liaison.
  `prisma/schema.prisma:464` et `:511`.
- **Server action** : `formData.get("clientId")` reçoit une seule valeur, aucune boucle.
  `app/(app)/dossiers/actions.ts:41`.
- **Formulaire** : `<select name="clientId">` natif, une seule valeur possible.
  `components/dossiers/DossierForm.tsx:70`.

Conséquence terrain : quand une affaire implique plusieurs personnes (couple qui achète, deux époux,
succession, co-actionnaires), le cabinet doit créer **un dossier par personne**. Le dossier réel est
fragmenté, la fiducie est éclatée, et rien ne relie les personnes entre elles.

---

## 2. Périmètre : deux natures de personnes, à ne jamais confondre

Un dossier peut porter deux natures de personnes distinctes. **Ce n'est pas deux fois la même chose.**

| | **Co-client** (votre côté) | **Partie** (adverse ou tierce) |
|---|---|---|
| Exemple | Les deux époux qui achètent | Le vendeur, la partie poursuivie, un intervenant |
| Est-ce une fiche `Client` SAFE ? | **Oui**, lien vers une fiche existante | **Non**, un nom + un rôle sur le dossier |
| Facturé ? | Oui | **Jamais** |
| Fiducie / grand livre ? | Oui, registre séparé par co-client | **Jamais** |
| Sert à quoi | Mandat, facturation, fiducie | Contexte du dossier + **vérification de conflits** |

### Garde-fou dur (règle de conformité, non négociable)

**Une partie adverse ou tierce ne devient JAMAIS une fiche `Client`.**

1. **Conflit d'intérêts.** La partie adverse est précisément ce qu'on cherche lors d'une vérification
   de conflit. La créer comme cliente pollue le registre et masque le vrai risque.
2. **Confidentialité (Loi 25).** Le cabinet n'a ni mandat ni consentement de la partie adverse pour la
   traiter comme cliente. On enregistre le strict nécessaire (nom, rôle), pas un dossier client.

Le modèle de données doit rendre cette confusion **structurellement impossible**, pas seulement
déconseillée.

---

## 3. Modèle de données (additif, ne casse rien)

Principe : on **garde** `Dossier.clientId` comme **client principal** du dossier, et on ajoute par
dessus une table de parties. Aucune colonne existante n'est modifiée ni supprimée. Migration purement
additive, dans la doctrine « brancher avant de bâtir ».

### 3.1 Nouveaux enums

```prisma
enum DossierPartieNature {
  co_client        // rattaché à une fiche Client (notre côté, facturable, fiducie)
  partie_externe   // nom libre, jamais une fiche Client (adverse ou tiers)
}

enum DossierPartieRole {
  mandant_principal   // le client principal du dossier (miroir de Dossier.clientId)
  co_client           // autre client de notre côté
  partie_adverse      // partie opposée
  tiers               // intervenant, témoin, autre partie non adverse
}
```

### 3.2 Nouvelle table `DossierPartie`

```prisma
model DossierPartie {
  id        String              @id @default(cuid())
  cabinetId String
  dossierId String
  nature    DossierPartieNature
  role      DossierPartieRole

  // Renseigné SI ET SEULEMENT SI nature = co_client
  clientId  String?

  // Renseigné SI ET SEULEMENT SI nature = partie_externe
  nomAffiche String?

  estPrincipal Boolean @default(false) // vrai uniquement pour le mandant principal
  notes        String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  cabinet Cabinet  @relation(fields: [cabinetId], references: [id], onDelete: Cascade)
  dossier Dossier  @relation(fields: [dossierId], references: [id], onDelete: Cascade)
  client  Client?  @relation(fields: [clientId], references: [id], onDelete: Restrict)

  @@index([cabinetId])
  @@index([dossierId])
  @@index([dossierId, nature])
  @@index([clientId])
}
```

Côté `Dossier` et `Client`, on ajoute la relation inverse `parties DossierPartie[]` (additif).

### 3.3 Invariants (à faire respecter en application, et par contrainte quand possible)

1. **Cohérence nature ↔ champs** :
   - `nature = co_client` ⇒ `clientId` non nul, `nomAffiche` nul.
   - `nature = partie_externe` ⇒ `nomAffiche` non nul, `clientId` nul.
   (Vérifié dans la server action ; renforçable par un `CHECK` SQL ajouté en migration.)
2. **Un seul mandant principal** : exactement une ligne par dossier avec `estPrincipal = true`, et son
   `clientId` est **égal à** `Dossier.clientId`. Le principal est toujours un `co_client`.
3. **Suppression protégée** : `onDelete Restrict` sur `clientId` (aligné sur le durcissement Barreau
   B-1 r.5 déjà en place pour `Dossier.clientId` et `Invoice.clientId`).

### 3.4 Backfill (migration de données, sans perte)

Pour chaque `Dossier` existant, créer une ligne `DossierPartie` :
`nature = co_client`, `role = mandant_principal`, `estPrincipal = true`,
`clientId = Dossier.clientId`. Après backfill, tout dossier a exactement un mandant principal cohérent
avec `Dossier.clientId`. Aucun dossier existant n'est modifié.

---

## 4. Impact sur les modules existants

### 4.1 Fiducie — NE CHANGE PAS (et c'est voulu)

`TrustAccount` et `TrustTransaction` sont rattachés à `clientId` (`prisma/schema.prisma`, clé unique
`@@unique([cabinetId, clientId, matterId])`). C'est **conforme** au Barreau QC (B-1 r.5, art. 2-5) qui
exige des **soldes séparés par client**, même quand plusieurs clients partagent une affaire.

**Règle : un dossier multi-clients NE fusionne PAS les registres de fiducie.** Chaque co-client garde
son propre grand livre fiduciaire. Le dossier devient une **vue** qui agrège l'affichage des soldes de
ses co-clients, sans jamais mélanger les fonds. Un dépôt reste toujours attribué à un co-client
nommé.

### 4.2 Facturation — INCHANGÉE en v1, ouverte en v2

`Invoice.clientId` reste unique. En v1, une facture est émise au **mandant principal** par défaut
(comportement actuel préservé). La question « facturation solidaire vs part de chacun » est une
**inconnue métier** (voir §8) et relève de la v2. On ne devine pas.

### 4.3 Conflits d'intérêts — les parties deviennent enfin visibles

`ConflictCheck` cherche aujourd'hui un `clientName` (texte) et stocke un résultat non bloquant.
Les nouvelles `DossierPartie` de nature `partie_externe` donnent enfin une **source structurée** des
parties adverses. En v1, au minimum : les parties sont enregistrées et **listées** dans l'écran de
vérification de conflit. Le durcissement du moteur de conflit (rendre la vérification bloquante,
recherche croisée sur toutes les parties de tous les dossiers) reste un **axe séparé** déjà identifié
dans la carte des écarts conformité, hors périmètre de cette spec.

---

## 5. UX

### 5.1 Où ça se passe

Écran de création / édition de dossier (`DossierForm` + `DossierCreationWizard`, étape « client »).
L'étape « choisir un client » devient « personnes du dossier », en trois blocs :

1. **Client principal** (obligatoire, inchangé) : le `<select>` actuel, alimente `Dossier.clientId`.
   Garantit la compatibilité et un défaut sûr pour la facturation et la fiducie.
2. **Co-clients** (optionnel, 0..n) : ajouter une ou plusieurs autres fiches `Client`. Chaque ligne =
   soit un client existant (recherche), soit « créer un nouveau client » en ligne (réutilise le flux
   `createClient`). Chaque co-client apparaît ensuite dans la fiducie et pourra être facturé (v2).
3. **Autres parties** (optionnel, 0..n) : ajouter un **nom** + un **rôle** (partie adverse / tiers).
   Aucune fiche client créée. Un bandeau rappelle : « une partie adverse ne doit pas être enregistrée
   comme cliente ». Ces entrées nourrissent la vérification de conflits.

### 5.2 Affichage dossier

La page dossier gagne un encart « Personnes » : mandant principal, co-clients (avec lien vers fiche +
solde fiducie), parties adverses / tiers (nom + rôle, sans lien fiche).

### 5.3 i18n

Nouvelles clés sous `matters.*` dans `messages/fr.json` et `messages/en.json` : `dossierPeople`,
`principalClient`, `coClients`, `addCoClient`, `otherParties`, `addParty`, `partyRole`,
`adversePartyWarning`, rôles. La clé existante `matters.selectClient` devient
`matters.selectPrincipalClient` (ou est conservée + ajout).

---

## 6. Séquencement et flag

Doctrine « spec + flag avant chantier ». Feature flag `multiPartiesDossier`
(env ou réglage cabinet), défaut **off**. Tant qu'off, l'UI reste l'écran actuel (un client), et le
backfill assure que le modèle est déjà cohérent en coulisses.

- **v1 (ce lot)** : enums + table `DossierPartie` + backfill + garde-fous d'invariants + UI des trois
  blocs + affichage « Personnes » + parties visibles dans l'écran de conflit. Facturation et fiducie
  inchangées (principal par défaut ; registres fiducie séparés par co-client).
- **v2 (gated sur réponse Me Derisier)** : facturation multi-clients (solidaire ou répartie).
- **v3 (axe séparé, déjà identifié)** : durcissement du moteur de conflits utilisant les parties.

---

## 7. Migrations (additives)

1. `CREATE TYPE DossierPartieNature`, `CREATE TYPE DossierPartieRole`.
2. `CREATE TABLE DossierPartie` (+ index).
3. Backfill mandant principal (§3.4) via `INSERT ... SELECT` depuis `Dossier`.
4. (Optionnel, recommandé) `CHECK` SQL pour l'invariant nature ↔ champs (§3.3-1).

Aucune colonne existante touchée. Aucune FK existante modifiée. Réversible (drop table + types).
Rappel doctrine DB : ne pas `migrate dev` global (dérives pré-existantes connues) ; appliquer en SQL
additif ciblé, tester en local sur `safe_local` + cabinet test avant prod.

---

## 8. Zones ouvertes (à confirmer, ne pas inventer)

1. **Facturation multi-clients** (bloque v2) : sur un dossier à plusieurs co-clients, une seule facture
   au principal, ou une part par co-client, ou responsabilité **solidaire** ? → question à Me Derisier.
2. **Barreau, non sourcé** (cf. diagnostic) : mandat écrit conjoint (conditions / consentement),
   responsabilité solidaire de paiement, traitement des co-clients dans le rapport annuel. Le Code de
   déontologie QC est référencé mais absent du disque. À sourcer avant toute promesse produit.
3. **Consentement au mandat conjoint** : faut-il, à l'ajout d'un co-client, tracer un consentement
   éclairé (le co-mandat est la situation de conflit maximal) ? À trancher, possiblement en v1 léger.

---

## 9. Critères d'acceptation (v1)

- Un dossier peut être créé et édité avec 1 client principal + N co-clients + N parties externes.
- Impossible de créer une `DossierPartie partie_externe` avec un `clientId` (garde-fou testé).
- Chaque dossier a exactement un mandant principal, cohérent avec `Dossier.clientId`.
- Les registres de fiducie restent séparés par co-client ; aucun mélange de fonds.
- Les factures existantes et nouvelles restent émises au principal (aucune régression facturation).
- Les parties externes apparaissent dans l'écran de vérification de conflit.
- Flag off ⇒ comportement strictement identique à aujourd'hui.
- Tous les dossiers existants (dont Dérisier) fonctionnent après backfill, sans perte.

## 10. Hors périmètre v1 (explicite)

- Facturation répartie / solidaire (v2).
- Moteur de conflits bloquant et recherche croisée (axe séparé).
- Fusion de dossiers existants déjà fragmentés (un dossier par personne) en un dossier multi-clients :
  outil de consolidation à spécifier séparément si le besoin est confirmé.
