# Spec — Lot 3A+B : Préfixes de dossier + Sujets / Sous-matières (Derisier)

> **Statut :** ✅ Validée (décisions Q1-Q3 tranchées 2026-05-29) — build en cours
> **Date :** 2026-05-29
> **Demandeur :** Aaliyah Regimbald (assistante d'Alexandra Derisier), email 2026-05
> **Cabinet pilote :** `derisier-law-on-2026`
> **Règle projet :** « Pas de build sans spec validée » (CLAUDE.md)
> **Source de vérité :** email Aaliyah (sections 1, 2, 3). Le Lot 1 (n° GST/HST,
> catégories comptables) est déjà appliqué. La section 5 « Documents standards »
> = Lot 3C, **hors périmètre** de cette spec.

---

## 1. Contexte & problème

Aujourd'hui (`app/(app)/dossiers/actions.ts` l.63-70), le numéro de dossier est
généré au format **`AAAA-NNN`** (`2026-001`), via un `count()` global par
cabinet/année. Pas de préfixe par matière, et le `sousType` est un champ **texte
libre** (utilisé surtout pour immobilier/immigration).

Derisier a besoin :
1. de **préfixes par matière** dans le numéro (`2026-IMM-00001`) ;
2. d'une liste **fermée et sélectionnable** de **Sujets** et **Sous-matières**
   (au lieu d'un texte libre), avec libellés bilingues.

## 2. Objectifs

1. Numéro de dossier au format **`{année}-{PRÉFIXE}-{séquence 5 chiffres}`**,
   le préfixe étant **déterminé par le Sujet** choisi.
2. **Sujet** sélectionnable à la création/édition d'un dossier (liste fermée).
3. **Sous-matière** sélectionnable, filtrée selon le Sujet (liste fermée), avec
   libellé bilingue FR/EN.
4. **Configurable par cabinet, sans migration Prisma.** Les autres cabinets
   conservent le format `AAAA-NNN` actuel.

## 3. Hors périmètre

- **Lot 3C** : modèles de documents (facture, mandat, en-tête, signature
  électronique, lettre d'ouverture, QR PayPal) — spec séparée.
- Pas de modification de l'enum `DossierType` (voir §4.1).
- Pas de **rétro-numérotation** des dossiers existants (ils gardent leur numéro).
- Pas de migration de schéma Prisma.

## 4. Décisions de conception

### 4.1 Taxonomie cabinet ≠ enum `DossierType`
Les 8 Sujets d'Aaliyah (Brief Service, LAO, Wills & Estates…) **ne correspondent
pas** à l'enum Prisma `DossierType` (immigration, immobilier, droit_famille,
litige_civil, criminel, corporate, autre). On introduit donc une **taxonomie
propre au cabinet**, indépendante de `DossierType`. L'enum reste inchangé (et
peut continuer d'alimenter les comportements métier existants — FINTRAC, IRCC…).

### 4.2 Stockage : `Cabinet.config` (sans migration)
Catalogue + mapping stockés en JSON dans `Cabinet.config.dossierTaxonomy` :

```jsonc
{
  "dossierTaxonomy": {
    "numbering": { "format": "year-prefix-seq", "seqWidth": 5, "scope": "prefix" },
    "subjects": [
      { "code": "RE",  "prefix": "RE",  "labelFr": "Immobilier",            "labelEn": "Real Estate" },
      { "code": "LAO", "prefix": "LAO", "labelFr": "Aide juridique Ontario", "labelEn": "Legal Aid Ontario" },
      { "code": "IMM", "prefix": "IMM", "labelFr": "Immigration",            "labelEn": "Immigration" },
      { "code": "BS",  "prefix": "BS",  "labelFr": "Service ponctuel",       "labelEn": "Brief Service" },
      { "code": "MIS", "prefix": "MIS", "labelFr": "Divers",                 "labelEn": "Miscellaneous" },
      { "code": "WE",  "prefix": "WE",  "labelFr": "Testaments & successions","labelEn": "Wills & Estates" },
      { "code": "FA",  "prefix": "FA",  "labelFr": "Famille",                "labelEn": "Family" },
      { "code": "BU",  "prefix": "BU",  "labelFr": "Affaires",               "labelEn": "Business" },
      { "code": "AS",  "prefix": "AS",  "labelFr": "Autres services",        "labelEn": "Other Services" }
    ],
    "submatters": {
      "IMM": [ /* ... voir §5 ... */ ],
      "RE":  [ /* ... */ ],
      "AUTRE": [ /* groupe « Autre Services » — voir Q1 ouverte */ ]
    }
  }
}
```

> Un **lecteur serveur** `lib/dossiers/taxonomy.ts` (sur le modèle de
> `lib/billing/cabinet-tax-config.ts`) lit ce JSON et retombe proprement sur
> « pas de taxonomie » (comportement legacy `AAAA-NNN`) si absent/malformé.

### 4.3 Génération du numéro (par préfixe, anti-réemploi)
Remplacer `count()` par un **max parsé** sur les numéros existants du même
préfixe et de la même année :

```
existants = numeroDossier startsWith `${year}-${prefix}-`
seq = (max des 5 derniers chiffres) + 1
numero = `${year}-${prefix}-${String(seq).padStart(seqWidth,"0")}`
```

- Scope de séquence : **par préfixe** (`2026-IMM-00001`, `2026-RE-00001` en
  parallèle). [À confirmer — Q2]
- Conserver la **boucle anti-collision P2002** existante (concurrence).
- `matterCode` (champ libre déjà présent, l.435 du schéma) stocke le `code` du
  Sujet retenu ; `sousType` stocke la sous-matière sélectionnée. **Aucune
  nouvelle colonne.**

## 5. Catalogue exact (email Aaliyah, verbatim)

### 5.1 Sujets → Préfixes
RE Real Estate · LAO Legal Aid Ontario · IMM Immigration · BS Brief Service ·
MIS Miscellaneous · WE Wills & Estates · FA Family · BU Business.

### 5.2 Sous-matières — Immigration (IMM)
Humanitarian Application / Demande humanitaire · Sponsorship / Parrainage ·
Work Permit / Permis de travail · Visitor Visa / Permis de séjour ·
Study Permit / Permis d'étude · Immigration Appeals / Demande d'appel ·
Express Entry / Entrée express · Provincial Nominee / Programmes provinciaux ·
PR Pilot Projects · Refugee Claim Forms · Refugee Claim Representation ·
Invitation Letter / Lettre d'invitation ·
Student Support Affidavit / Déclaration solennelle pour étudiant ·
Complex Affidavits / Déclaration solennelle complexe ·
Submission letter response to immigration without follow-up ·
Submission letter response to immigration with follow-up ·
Temporary Resident Permit / Permis de séjour temporaire ·
Citizenship Application / Demande de citoyenneté ·
Humanitarian Sponsorship / Parrainage humanitaire · US Waiver ·
Procuration / Proxy ·
Travel Documents / Declaration in Lieu of Guarantor / Répondant ·
Travel Documents / Declaration in Lieu of Guarantor / Répondant (1 form) ·
Travel Documents / Application and Declaration in Lieu of Guarantor (Respondent) ·
Consultation.

> Note : l'email contient deux entrées « Temporary Resident Permit » et
> « Procuration » proches de doublons — **dédupliquées** ci-dessus.

### 5.3 Sous-matières — Real Estate (RE)
Purchase Residential / Achat résidentiel · Purchase Commercial / Achat
commercial · Sale / Vente · Sale Commercial / Vente commerciale ·
Condo Certificate Consultation · Refinance / Refinancement ·
Express Closing / Fermeture expresse.

### 5.4 Groupe « Autre Services » (non rattaché aux 8 Sujets dans l'email)
Notarization / Document notarié · Cease and Desist Letters ·
Demand Letters / Mise en demeure · Incorporation · Divorce opinion letter ·
Commercial lease / Bail commercial · Employment contract / Contrat d'employé ·
Wills / Testaments.

> Ces sous-matières recoupent Business (Incorporation, bail, contrat),
> Family (Divorce opinion), Wills & Estates (Wills), Miscellaneous
> (Notarization, Demand Letters). **Rattachement à valider — Q1.**

## 6. Fichiers touchés

| Fichier | Changement |
|---|---|
| `lib/dossiers/taxonomy.ts` *(nouveau)* | Types + lecteur `getCabinetDossierTaxonomy(cabinetId)` ; fallback legacy. |
| `lib/dossiers/numero.ts` *(nouveau)* | `genererNumeroDossier({ cabinetId, year, prefix, seqWidth })` (max parsé). |
| `app/(app)/dossiers/actions.ts` | Brancher la génération sur la taxonomie ; persister `matterCode` (sujet) + `sousType` (sous-matière). Si pas de taxonomie → comportement actuel inchangé. |
| Formulaire dossier *(composant create/edit)* | Dropdowns **Sujet** puis **Sous-matière** (filtrée), libellés selon la locale. |
| `scripts/configure-derisier-...mjs` ou nouveau script | Écrire `Cabinet.config.dossierTaxonomy` pour Derisier (dry-run + `--apply`, idempotent). |
| i18n FR/EN | Clés du formulaire (`dossiers.subject`, `dossiers.submatter`). Les libellés du catalogue viennent de la config (déjà bilingues). |

Aucun changement : schéma Prisma, enum `DossierType`.

## 7. Cas limites

- Cabinet **sans** `dossierTaxonomy` → numérotation `AAAA-NNN` actuelle (zéro régression).
- Sujet sans sous-matière configurée → dropdown sous-matière masqué/optionnel.
- Dossiers existants → numéros inchangés (pas de backfill).
- Concurrence → boucle de retry P2002 conservée.
- Locale EN → libellés `labelEn`, sinon `labelFr`.

## 8. Critères d'acceptation

1. Derisier : créer un dossier « Immigration » → numéro `2026-IMM-00001`, puis
   `2026-IMM-00002` ; un dossier « Real Estate » → `2026-RE-00001`.
2. Le formulaire propose les 8 Sujets et, après sélection, les sous-matières
   correspondantes (verbatim §5).
3. `matterCode` = code du Sujet, `sousType` = sous-matière, persistés.
4. Un autre cabinet (sans taxonomie) conserve `2026-001` — aucune régression.
5. `tsc --noEmit` : 0 erreur. Tests de `genererNumeroDossier` (séquence,
   padding, anti-réemploi) verts.

## 9. Questions tranchées (2026-05-29)

- **Q1 — « Autre Services » :** ✅ **9e Sujet** `AS` « Autres services / Other
  Services » regroupant les 8 sous-matières du §5.4 telles quelles (fidèle à
  l'email). Pas de réaffectation aux autres sujets.
- **Q2 — Scope de séquence :** ✅ **par préfixe** (`2026-IMM-00001`,
  `2026-RE-00001` en parallèle).
- **Q3 — Sous-matière :** ✅ **optionnelle** (le Sujet/préfixe suffit ; la
  sous-matière est un complément, masquée si le Sujet n'en a pas).

## 10. Déploiement

- Build + validation sur **localhost** (worktree) d'abord.
- Écriture de la config Derisier via script idempotent (dry-run puis `--apply`).
- Mise en ligne = redéploiement Vercel. Aucune migration de données.
