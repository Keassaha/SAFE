# Recherche — Modèle de convention de mandat et d'honoraires (Barreau du Québec)

**Date** : 2026-07-13
**Objet** : ancrer le gabarit de mandat de SAFE (`lib/edition/mandat-template.ts`) sur des sources officielles plutôt que sur une rédaction inventée.
**Statut** : sourcé. Zones d'incertitude marquées ⚠️.

---

## 1. Source primaire (le « modèle idéal »)

Le Barreau du Québec publie un **modèle officiel** de convention, mis à la disposition de ses membres :

- **Convention de mandat et d'honoraires** — Barreau du Québec
  `https://www.barreau.qc.ca/media/qcahz3cu/convention-honoraires.docx`

Le gabarit de SAFE **calque la structure de ce modèle** (10 sections + PRD + signatures). Le texte des clauses fixes est une adaptation fidèle (même substance juridique, phrasé propre à SAFE) ; les données du dossier (parties, objet, honoraires, provision) sont pré-remplies, et les montants / délais / coordonnées manquants restent en champs `[____]` à compléter par l'avocat.

Structure officielle reproduite :
1. Quels sont les services demandés ? (les « Services », annexe budgétaire)
2. Combien coûtent les services ? (aide juridique, assurance frais juridiques, honoraires + délégation, frais de justice, expertises, estimation, montant maximal)
3. Comment payer les services ? (avances en fidéicommis, comptes d'honoraires, modes de paiement, intérêts)
4. Comment communiquer entre nous ? (moyens + sécurité / renseignements sensibles)
5. Comment sont gérés les renseignements personnels ? (conservation 7 ans, remise des originaux)
6. Informer l'avocat des changements
7. Comment résoudre les différends ? (**conciliation puis arbitrage de compte**)
8. Qu'est-ce qu'un conflit d'intérêts ?
9. Quand et comment mettre fin à la convention ? (client en tout temps ; avocat pour motif sérieux ; pas à un moment inopportun)
10. À quel moment la convention commence-t-elle à s'appliquer ?
+ Modes de prévention et règlement des différends (PRD) en tête, + bloc Signatures.

---

## 2. Ancrages réglementaires (sources secondaires)

| Élément du gabarit | Source | Extrait / règle |
|---|---|---|
| Honoraires justes et raisonnables + facteurs | **Code de déontologie des avocats, RLRQ c B-1, r 3.1, art. 102** | « Les honoraires sont justes et raisonnables s'ils sont justifiés par les circonstances et proportionnés aux services rendus. » Facteurs : expérience, temps/effort, difficulté, importance pour le client, responsabilité, etc. ([LégisQuébec](https://www.legisquebec.gouv.qc.ca/fr/document/rc/b-1,%20r.%203.1), [CanLII](https://www.canlii.org/fr/qc/legis/regl/rlrq-c-b-1-r-3.1/derniere/rlrq-c-b-1-r-3.1.html)) |
| Informer le client du coût prévisible | Code de déontologie (r 3.1) + [Barreau — facturation](https://cms.barreau.qc.ca/fr/grand-public/faire-affaire-avec-un-avocat/facturation-services-avocat/) | L'avocat doit informer le client du coût approximatif prévisible des services. |
| Conciliation puis arbitrage de compte | **Règlement sur la procédure de conciliation et d'arbitrage des comptes des avocats, RLRQ c B-1, r 17** | Conciliation demandée dans les **45 jours** de la réception du compte ; arbitrage dans les 30 jours du rapport de conciliation ; décision finale et sans appel. ([CanLII](https://www.canlii.org/fr/qc/legis/regl/rlrq-c-b-1-r-17/derniere/rlrq-c-b-1-r-17.html), [Barreau — FAQ](https://www.barreau.qc.ca/en/general-public/filing-complaint-against-lawyer/contesting-lawyer-invoice/conciliation-arbitration-fees-faq/)) |
| Avances déposées en fidéicommis au nom du client | Règlement sur la comptabilité en fidéicommis des avocats (B-1, r 5) + modèle Barreau | « déposées sans délai dans le compte en fidéicommis de l'Avocat, au nom du Client ». |
| Conservation du dossier 7 ans, remise des originaux | Modèle officiel Barreau (section 5) | Conservation 7 ans après la fin du mandat, puis destruction sauf données conflits ; remise des originaux au client. |

---

## 3. Corrections apportées à la base interne

- Les fichiers KB internes citaient le **Code de déontologie art. 3.06.01** : c'est l'**ancien** Code (RLRQ c B-1, r 3), abrogé/remplacé en 2015 par le **r 3.1**. Le gabarit n'utilise pas cette numérotation périmée. (Cf. carte des écarts conformité : socle de sourcing troué.)
- L'**arbitrage de compte** était marqué « incertain » en interne ; il est confirmé et intégré (r 17).

---

## 4. Zones d'incertitude / à valider ⚠️

- **Numéros d'articles fins** (au-delà de l'art. 102) non tous vérifiés un à un ; le gabarit s'appuie sur le modèle officiel du Barreau, pas sur des citations d'articles dans le texte client.
- **Variantes par domaine** (immobilier/FINTRAC, immigration/IMM 5476, famille, criminel/aide juridique) : non encore intégrées au gabarit. Le modèle Barreau est généraliste. Phase 2 possible.
- **Ontario / LSO** : le modèle actuel est **Québec uniquement**. Un « engagement/retainer letter » LSO suit d'autres règles (By-Law 9, etc.) ; à traiter séparément si le marché ON est visé.
- Le gabarit reste **modifiable** par l'avocate dans l'éditeur : il est un point de départ conforme, pas un avis juridique figé.

---

## 5. Emplacement dans le code

- Générateur : `lib/edition/mandat-template.ts` (`buildMandatContent`, `mandatTitreParDefaut`).
- Test de structure : `lib/__tests__/mandat-template-barreau.test.ts` (10 sections, fidéicommis, conciliation 45 j, conflits, 7 ans, pré-remplissage).
- Création/import : `app/api/dossiers/[id]/mandat/route.ts` et `.../mandat/import/route.ts`.
