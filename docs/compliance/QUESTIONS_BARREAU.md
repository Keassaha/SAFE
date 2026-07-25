# Questions à confirmer auprès des régulateurs

> Points `INCERTAIN` du registre d'obligations (REGISTRE_OBLIGATIONS.md) qui ne sont pas
> sourçables en interne. À poser formellement. Tant qu'ils sont ouverts, ils ne pilotent
> aucun affichage ni blocage dans SAFE. Action : CEO. Dépendance externe à lancer tôt
> (les régulateurs répondent lentement).

## Pourquoi ces questions comptent

Chaque réponse débloque une entrée du registre et donc une capacité de conformité affichable
ou imposable dans le produit. Sans elles, SAFE ne peut pas afficher un calendrier de
rapprochement au Québec ni prétendre couvrir ces obligations sans risquer d'énoncer une règle
fausse.

---

## ⚠️ Action urgente hors questions : plan de contingence LSO (Ontario, Derisier)

**Vérifié sur sources externes (LSO, Barreau de l'Ontario, juillet 2026).** L'Ontario impose à
tout avocat en pratique privée un **plan de contingence écrit** : un praticien seul doit désigner
un « administrateur » (successeur) qui gère la pratique en cas d'incapacité, informe les Trustee
Services du LSO et l'assureur, et transfère les dossiers. En vigueur depuis le **1ᵉʳ janvier 2025**,
avec **déclaration via le rapport annuel due le 31 mars 2026 (déjà passée)**, révision annuelle.

Derisier Law (avocate seule, ON) est visée. Cette obligation est **absente de tout l'onboarding
et de SAFE**. Action : demander à Me Derisier si son plan de contingence est en place et déclaré.
Ce n'est pas une question de recherche, c'est une vérification directe auprès de la cliente.
Réf. registre TR-ON-06. (Le numéro exact « By-Law 8 » de la source interne reste à confirmer.)

## A. Barreau du Québec

**Q-BARREAU-01 — Délai de rapprochement fiducie (confirmation, PAS bloquant)**
> Confirmer sur le texte officiel que le Règlement RLRQ c. B-1, r. 5 **n'impose aucun délai
> chiffré en jours** pour le rapprochement mensuel du fidéicommis (obligation = livres « à jour »).

Note : la source fact-checkée (FAQ Barreau QC) l'établit déjà, et le code le gère correctement
(aucun « 25 jours » affiché en QC). Question de confirmation seulement, priorité basse.

**Q-BARREAU-02 — Rapport annuel (RAP)**
> Quel est le nom exact, le contenu exigé et le délai de dépôt du rapport annuel sur la pratique
> lié à la comptabilité en fidéicommis ? Existe-t-il un formulaire type ?

Débloque : TR-QC-11, le générateur de rapport annuel côté QC.

**Q-BARREAU-03 — Vérification annuelle par CPA**
> Un cabinet est-il tenu de faire vérifier annuellement ses comptes en fidéicommis par un
> comptable indépendant (CPA), et de transmettre ce rapport au Barreau ? Dans quels cas ?

Débloque : TR-QC-12 (aujourd'hui affirmé par des fiches internes mais absent de la source
fact-checkée).

**Q-BARREAU-04 — Conflits d'intérêts**
> Quel article du Code de déontologie des avocats encadre l'obligation de vérification des
> conflits d'intérêts à l'ouverture d'un dossier, et quelles diligences précises sont exigées ?

Débloque : CONF-QC-01, le caractère obligatoire/bloquant de la vérification de conflits.

**Q-BARREAU-05 — Loi 25**
> Quelles obligations concrètes de la Loi 25 s'appliquent à un cabinet d'avocats (responsable
> de la protection des renseignements, registre d'incidents, seuil et délai de notification à
> la CAI en cas d'incident) ?

Débloque : PRIV-QC-02.

**Q-BARREAU-06 — Mentions de facture**
> Existe-t-il des mentions obligatoires ou interdites sur une facture d'honoraires d'avocat au
> Québec (au-delà des obligations fiscales TPS/TVQ) ?

Débloque : FACT-QC-01, FACT-QC-02.

---

## B. Law Society of Ontario (pour Derisier et futurs cabinets ON)

**Q-LSO-01 — By-Law 9, délai et contenu**
> Confirmer le délai maximal du rapprochement mensuel (le « 25 jours après le relevé » utilisé
> en interne), ainsi que le nom, le contenu et le délai du dépôt annuel à la LSO (type
> « Lawyer Annual Report / Trust Comparison »).

Débloque : TR-ON-02, TR-ON-01 (aujourd'hui basés sur des synthèses internes, pas sur le texte
officiel de By-Law 9).

**Q-LSO-02 — Conflits (Rules of Professional Conduct r. 3.4)**
> Diligences exigées pour la vérification de conflits à l'ouverture.

Débloque : CONF-ON-01.

---

## C. FINTRAC / fédéral

**Q-FED-01 — Régime FINTRAC des avocats**
> Quelles obligations FINTRAC s'appliquent spécifiquement aux avocats (par opposition aux
> courtiers immobiliers), compte tenu de la décision de la Cour suprême de 2015 ? Seuils,
> vérification d'identité, déclarations exigées.

Débloque : FIN-02 (toute la matière FINTRAC interne vise les courtiers, pas les avocats).

**Q-FED-02 — Périmètre exact de la règle « No Cash »**
> Quel est le périmètre exact de l'interdiction d'accepter 7500 $ et plus en espèces par mandat
> (règle-modèle de la Fédération des ordres professionnels de juristes) : exceptions (honoraires
> professionnels, débours, cautionnements), règles d'agrégation par mandat, et articulation avec
> la déclaration québécoise de l'art. 71 ?

Débloque : CASH-01, CASH-QC-02 (le code bloque le dépôt fiducie ≥ 7500 $ ESPECES ; à confirmer
que le périmètre et les exceptions sont corrects, et ajouter la déclaration 30 j).

## D. Revenu Québec / ARC

**Q-RQ-01 — Numéro de taxe sur facture**
> Le numéro d'inscription TPS/TVQ (ou TVH) doit-il figurer sur les factures d'un cabinet, et
> au-delà de quel montant ?

Débloque : FACT-QC-01.

---

## Suivi

| ID | Régulateur | Envoyée le | Réponse le | Résultat |
|----|-----------|-----------|-----------|----------|
| Q-BARREAU-01 | Barreau QC | | | |
| Q-BARREAU-02 | Barreau QC | | | |
| Q-BARREAU-03 | Barreau QC | | | |
| Q-BARREAU-04 | Barreau QC | | | |
| Q-BARREAU-05 | Barreau QC | | | |
| Q-BARREAU-06 | Barreau QC | | | |
| Q-LSO-01 | LSO | | | |
| Q-LSO-02 | LSO | | | |
| Q-FED-01 | FINTRAC | | | |
| Q-FED-02 | Fédération ordres | | | |
| Q-RQ-01 | Revenu Québec | | | |

---

## Réponses de recherche (2026-07-25) — À VALIDER avant tout codage

> Recherche web sourcée (juillet 2026). **Limite d'outillage** : la FAQ du Barreau a pu être
> récupérée, mais les textes primaires (CanLII B-1 r.5 et r.3.1, LSO By-Law 9, Revenu Québec)
> ont bloqué la récupération automatique (HTTP 403). Les numéros d'articles ci-dessous sont
> issus de sources fiables (regulateur, cabinets, éditeurs juridiques) et **restent à revérifier
> sur le texte officiel**. Aucune règle n'est passée à `CONFIRME` dans `lib/compliance/rules.ts` :
> décision CEO requise, question par question.

### ✅ Résolues (confiance HAUTE — à valider puis coder)

**Q-BARREAU-01 — Délai de rapprochement QC.** Confirmé : aucun délai chiffré en jours. L'obligation
est de tenir les livres et le rapport comptable mensuel « à jour ». Cohérent avec le code actuel
(aucun « 25 jours » affiché en QC). → peut passer `CONFIRME` (TR-QC-05). Source : [FAQ Barreau QC](https://www.barreau.qc.ca/en/membres-ordre/obligations-membres/comptabilite-fideicommis-facturation/comptabilite-fideicommis-faq/).

**Q-FED-01 — FINTRAC ne s'applique PAS aux avocats.** Arrêt de la Cour suprême du 13 février 2015
(*Canada (PG) c. Fédération des ordres professionnels de juristes*, 2015 CSC 7) : les obligations
FINTRAC visant les avocats sont inconstitutionnelles. Les avocats/cabinets **n'ont pas** d'obligation
de déclaration ni de tenue de registre FINTRAC. À la place s'appliquent les **règles-modèles des
ordres** (identification du client, no-cash, restrictions fiducie). **Implication produit** : toute
matière « FINTRAC » interne visant l'avocat est à revoir (ne pas imposer). Sources : [Mondaq](https://www.mondaq.com/canada/money-laundering/376256/), [McMillan](https://mcmillan.ca/insights/supreme-court-of-canada-upholds-solicitor-client-privilege-settling-a-15-year-dispute/), [CBC](https://www.cbc.ca/1.2955940).

**Q-FED-02 — Règle « no-cash » 7 500 $.** Interdiction d'accepter 7 500 $ ou plus en espèces
(montant agrégé) par mandat/opération. **Exceptions** : sommes reçues d'un organisme d'application
de la loi, en vertu d'une ordonnance du tribunal, ou au titre d'honoraires professionnels (incl.
provision), débours, dépenses ou cautionnement. Règle du remboursement en espèces si excédent.
→ le code bloque déjà le dépôt fiducie ≥ 7 500 $ espèces ; **reste à ajouter les exceptions** et à
confirmer l'articulation avec la déclaration québécoise (art. 71, 30 j). Sources : [Law Society of Manitoba](https://educationcentre.lawsociety.mb.ca/trust-accounting-fundamentals/handling-of-trust-money/cash-transactions/), [Law Society of BC](https://www.lawsociety.bc.ca/for-lawyers/discipline-advisories/november-8,-2013/), [FLSC](https://flsc.ca/national-initiatives/model-rules-to-fight-money-laundering-and-terrorist-financing).

**Q-RQ-01 / Q-BARREAU-06 — Numéro de taxe sur facture.** Revenu Québec impose des renseignements
par tranche de montant (< 30 $, 30–150 $, > 150 $). Le **numéro d'inscription TPS/TVQ du fournisseur
est requis dès 30 $** pour permettre au client de réclamer un CTI/RTI. Aucun format de facture imposé
aux avocats (hors restaurants/taxis). Côté Barreau : aucune mention spécifique obligatoire identifiée ;
le n° de Barreau n'est pas obligatoire (et la règle interne SAFE l'interdit sur facture client).
Source : [Revenu Québec — Préparation des factures](https://www.revenuquebec.ca/fr/entreprises/taxes/tpstvh-et-tvq/perception-de-la-tps-et-de-la-tvq/preparation-des-factures/).

**Q-LSO-01 (délai) — 25 jours confirmé.** Ontario : rapprochement mensuel à effectuer dans les
25 jours suivant la fin de la période du relevé (By-Law 9). Le code applique déjà ce seuil.
**Reste** : confirmer le numéro d'article exact (By-Law 9, ~s. 18(10)) et le rapport annuel LSO
(nom/contenu/délai). Sources : [Clio](https://www.clio.com/ca/blog/law-society-trust-accounting-rules/), [LSO By-Law 9](https://www.lso.ca/about-lso/legislation-rules/by-laws/by-law-9).

### 🟠 Partielles (confiance MOYENNE — un point à confirmer)

**Q-BARREAU-04 — Conflits QC.** Code de déontologie des avocats (RLRQ c B-1, r 3.1), section conflits
d'intérêts, **art. 72-73 et suivants** : obligation d'éviter tout conflit (devoir de loyauté). La
« diligence de vérification systématique à l'ouverture » n'est pas un article unique mais une pratique
dérivée. **Reste** : l'article précis qui impose la vérification. Source : [CanLII B-1 r.3.1](https://www.canlii.org/fr/qc/legis/regl/rlrq-c-b-1-r-3.1/derniere/rlrq-c-b-1-r-3.1.html).

**Q-BARREAU-05 — Loi 25.** S'applique aux cabinets : désigner un responsable de la protection des
renseignements (coordonnées publiées), tenir un registre des incidents, notifier la CAI **et** les
personnes concernées si « risque de préjudice sérieux ». ⚠️ Le « 72 h » souvent cité provient du RGPD ;
la Loi 25 emploie « avec diligence »/« promptement », **pas** un délai chiffré strict — à vérifier sur
le texte. Source : [Guide Loi 25](https://amlex.ca/loi-25-protection-renseignements-personnels/).

**Q-LSO-02 — Conflits ON.** Rules of Professional Conduct, **r. 3.4**. Diligences précises à confirmer
sur le texte officiel.

### 🔴 Ouvertes — vraie question au Barreau (ne rien coder)

**Q-BARREAU-02 — Rapport annuel (délai).** Le rapport existe sous le nom « **Rapport comptable annuel** »,
avec formulaire type + mode d'emploi publiés par le Barreau. **Le délai exact de transmission n'est pas
confirmé** par les sources accessibles → à demander au Barreau (ou à lire dans B-1 r.5).

**Q-BARREAU-03 — Vérification annuelle par CPA.** Aucune source accessible ne confirme si un audit
annuel par un comptable indépendant est obligatoire, ni dans quels cas. → question directe au Barreau.

### Ce que la validation débloquerait dans le produit

- Q-FED-01 → **revoir la matière FINTRAC** (ne pas imposer d'obligation FINTRAC à l'avocat).
- Q-FED-02 → ajouter la **déclaration 30 j** (art. 71) + coder les **exceptions** au no-cash.
- Q-BARREAU-01 → passer TR-QC-05 de `PARTIEL` à `CONFIRME`.
- Q-RQ-01 → exiger le n° TPS/TVQ sur facture dès 30 $.
- Q-LSO-01 → confirmer l'article et brancher le rapport annuel LSO.
