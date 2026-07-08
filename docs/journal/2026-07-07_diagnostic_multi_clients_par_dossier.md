# Diagnostic — Plusieurs clients (co-clients) pour une même affaire

**Date** : 2026-07-07
**Origine** : demande écrite du cabinet de Me Derisier (courriel). « Le système ne permet d'enregistrer qu'un seul client alors que nous avons souvent plusieurs clients pour une même affaire. »
**Statut** : recherche/diagnostic terminé. Pas de build. Spec à écrire après confirmation du cabinet.

---

## 1. Interprétation du besoin

« Plusieurs clients pour une même affaire » = **mandat conjoint / co-clients** : plusieurs personnes du même côté, toutes clientes du même avocat sur le même dossier (couple en immobilier, époux, succession, co-actionnaires).

**Décision de portée (CEO, 2026-07-07) : supporter LES DEUX natures de personnes sur un dossier.**

| | Co-client (notre côté) | Partie adverse / autre partie |
|---|---|---|
| Fiche `Client` SAFE ? | Oui (lien vers fiche existante) | NON, juste un nom + rôle sur le dossier |
| Facturé / fiducie ? | Oui | Jamais |
| Rôle | Mandat, facturation, fiducie | Contexte + vérification de conflits |

**Garde-fou dur** : une partie adverse ne doit JAMAIS devenir une fiche `Client`.
1. Conflit d'intérêts : la partie adverse est ce qu'on cherche en vérification de conflit ; la créer comme cliente pollue le registre.
2. Confidentialité (Loi 25) : pas de mandat ni de consentement pour la traiter comme cliente.

## 2. Où est le blocage (3 couches, pas seulement l'UI)

- **DB** : `Dossier.clientId` = FK unique, NOT NULL, onDelete Restrict. Aucune table de liaison, aucune notion de co-client. `prisma/schema.prisma:461`
- **Server action** : `formData.get("clientId")` reçoit une seule valeur, aucune boucle. `app/(app)/dossiers/actions.ts:41`
- **Formulaire** : `<select name="clientId">` natif, une seule valeur. `components/dossiers/DossierForm.tsx:70`

Contournement actuel des cabinets : un dossier par personne → fragmentation du dossier réel.

## 3. Éléments essentiels impactés

1. **Fiducie** : `TrustAccount`/`TrustTransaction` par `clientId`. CONFORME Barreau (B-1 r.5 art. 2-5 : soldes séparés par client même en affaire partagée). Un dossier multi-clients NE DOIT PAS fusionner les registres fiducie.
2. **Facturation** : `Invoice.clientId` unique. À trancher : facturé à qui ? part de chacun ? solidarité ?
3. **Conflits d'intérêts** : le co-mandat = risque maximal. `ConflictCheck` existe mais opt-in/non bloquant.
4. **Plafond espèces 7 500 $** : défini « par mandat ». Périmètre ambigu si dossier = plusieurs mandats.
5. **Client principal** : garder une notion de client responsable (affichage, défauts facturation/fiducie) + co-clients ajoutés. Permet un changement additif.

## 4. Zones NON sourcées (à confirmer, ne pas inventer)

- Aucun doc interne ni source Barreau ne traite explicitement des co-clients/mandats conjoints.
- Code de déontologie QC référencé mais absent du disque.
- À confirmer : mandat écrit conjoint (conditions/consentement), responsabilité solidaire de paiement, traitement co-clients au rapport annuel Barreau.

## 5. Direction pressentie (à valider en spec, pas construit)

Modèle de « parties du dossier » avec rôle, plutôt qu'une simple liaison client-dossier :
- **Co-clients** = liens vers des fiches `Client` existantes (impacte facturation + fiducie).
- **Parties** = entrées légères (nom + rôle plaignant/défendeur/tiers) qui alimentent la vérification de conflits, rien d'autre. Jamais de fiche `Client`.

Amorces à réutiliser dans le schéma : enum `RepresentationType` (plaignant/défendeur/conseil), champ `DossierPiece.partie`. Conserver `Dossier.clientId` comme client principal pour ne rien casser. Migration additive. Doctrine « brancher avant de bâtir ».

## 6. Prochaine étape

- ✅ Spec écrite : `docs/product/SPEC_MULTI_CLIENTS_PARTIES_DOSSIER.md`.
- ✅ v1 CONSTRUITE (2026-07-07), feature SAFE générale (pas seulement Derisier).
- Reste : question facturation à Me Derisier (solidaire vs répartie, bloque v2).

## 7. Build v1 (2026-07-07) — livré local, prod à déployer

Feature générale, activée par défaut, kill-switch `SAFE_FEATURE_MULTI_PARTIES=off` (`lib/flags.ts`).

Fichiers :
- Schéma : enums `DossierPartieNature`/`DossierPartieRole` + modèle `DossierPartie` + relations inverses (Dossier/Client/Cabinet). `prisma/schema.prisma`.
- Migration additive + backfill principal + CHECK d'invariant : `prisma/migrations/20260707130000_dossier_parties/migration.sql`.
- Logique : `lib/dossiers/parties.ts` (types + parse), `lib/dossiers/parties-sync.ts` (`syncDossierParties`, `reconcilePrincipalParty`).
- UI : `components/dossiers/DossierPartiesEditor.tsx` (co-clients + parties, warning conformité), branché dans le wizard (`registry/DossierCreationWizard.tsx` étape 2) et le formulaire d'édition (`DossierForm.tsx`). Affichage « Personnes » sur `app/(app)/dossiers/[id]/page.tsx`.
- Actions : `app/(app)/dossiers/actions.ts` create + update synchronisent les parties.
- i18n : clés `matters.*` FR/EN.

Vérifs :
- `tsc --noEmit` : 0 erreur. JSON locales valides.
- DB : backfill 4/4 dossiers → mandant principal. Roundtrip co-client + partie externe OK.
- Garde-fou CHECK prouvé : rejette une partie_externe avec clientId ET un co_client sans clientId.
- Navigateur (cabinet test) : éditeur monté, libellés FR résolus, principal exclu du choix co-client, `partiesJson` sérialisé correct, warning affiché, 0 erreur console.

⚠️ PROD : la migration a été appliquée en LOCAL uniquement (`prisma db execute`, historique local en mode db push). Pour prod, appliquer `20260707130000_dossier_parties/migration.sql`. Migration additive et réversible (drop table + types).
