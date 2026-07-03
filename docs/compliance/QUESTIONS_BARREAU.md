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
