# Audit réglementaire d'inspection — SAFE

**Date** : 2026-07-30
**Périmètre** : Barreau du Québec (RLRQ c. B-1, r. 5) + Law Society of Ontario (By-Law 9)
**Objet** : identifier tout ce qui manque à SAFE pour atteindre un niveau « Inspection Ready »
**Posture** : inspection réglementaire simulée, sans complaisance

---

## 0. Méthode, sources et limites

### 0.1 Sources primaires effectivement lues (texte intégral, cette session)

| Source | Référence | Accès | Statut |
|---|---|---|---|
| Règlement sur la comptabilité et les normes d'exercice professionnel des avocats | RLRQ c. B-1, r. 5, art. 1 à 87, **à jour au 1er avril 2026** | legisquebec.gouv.qc.ca, texte officiel | ✅ lu intégralement |
| LSO By-Law 9 — Financial Transactions and Records | Made 2007-05-01, amendé jusqu'au 2017-04-27, art. 1 à 24 + formulaires | PDF officiel LSO | ✅ lu intégralement |
| LSO — Summary of By-Law 9 Record Keeping Requirements (guide d'application) | lso.ca, page « Bookkeeping » | site LSO | ✅ lu |

Toutes les citations d'articles de ce rapport proviennent de ces trois documents. Là où j'écris un numéro d'article, je l'ai lu.

### 0.2 Sources que je n'ai PAS pu vérifier dans cette session (incertitudes déclarées)

Je les signale explicitement plutôt que de les combler par déduction :

| Élément | Pourquoi c'est un trou | Impact sur l'audit |
|---|---|---|
| **Formulaires prescrits par le Comité exécutif** du Barreau (art. 41, 42, 51, 64) | Le règlement renvoie à des formulaires prescrits dont le contenu exact n'est pas dans le règlement. Je connais les **données obligatoires** (elles sont énumérées aux art. 41 et 42) mais pas la **mise en forme officielle**. | SAFE peut produire les données ; la conformité de forme reste à valider auprès du Barreau. |
| **Guide de comptabilité / guide d'inspection professionnelle du Barreau** | Non consulté cette session. | Les « bonnes pratiques d'application » québécoises ne sont pas couvertes ; seul le texte réglementaire l'est. |
| **Code de déontologie des avocats (QC)** — conflits d'intérêts | Non consulté. Le registre interne `lib/compliance/rules.ts` le marque déjà `INCERTAIN` (CONF-QC-01). | Section conflits traitée sur la base du seul design produit, pas d'un article. |
| **Règlement sur le fonds d'études juridiques (B-1, r. 10)** | Référencé par l'art. 50 mais non lu. | Mécanique exacte de remise des intérêts non auditée. |
| **LSO Rules of Professional Conduct, Financial Management Guidelines, Practice Management Guidelines** | Non lus. | Le volet « gestion de cabinet » ontarien hors By-Law 9 n'est pas couvert. |
| **Obligation de vérification annuelle par un CPA indépendant (QC)** | Absente du texte de B-1 r. 5 tel que lu. L'art. 42 impose un **rapport comptable annuel de l'avocat**, pas un audit externe. Le registre interne (TR-QC-12) posait la question : **la réponse, sur la foi du texte lu, est qu'aucun audit CPA indépendant n'est imposé par B-1 r. 5**. À confirmer auprès du Barreau car d'autres instruments peuvent l'exiger. | Corrige une question ouverte du registre interne. |
| **Rapport Annuel sur la Pratique (RAP)** évoqué par le registre interne (TR-QC-11) | Ce libellé n'apparaît pas dans B-1 r. 5. Ce que le règlement impose est le **rapport comptable annuel de l'art. 42**, transmis au directeur de l'inspection professionnelle **dans les 30 jours d'une demande**, pour une période de 12 mois. | Le registre interne doit être corrigé. |

### 0.3 Corrections à apporter au registre interne `lib/compliance/rules.ts`

L'audit du texte primaire invalide ou précise plusieurs entrées :

| Règle interne | Ce qu'elle dit | Ce que le texte dit réellement | Action |
|---|---|---|---|
| `TR-QC-09` | « Dépôt sans délai indu » | Art. 50 : « **sans délai** après réception », dans une **succursale québécoise** d'une institution assurée **ayant conclu une entente avec le Barreau** (B-1 r. 10), compte identifié « en fidéicommis »/« in trust ». Trois conditions omises. | Corriger et enrichir |
| `TR-ON-05` | « dépôt au plus tard le jour ouvrable suivant (art. 1(3)) » | Art. 7(1) : **« shall immediately pay the money into »** un compte en fiducie. L'art. 1(3) est une **présomption** applicable seulement aux par. 9(1)(2)(3) et art. 14, pas une règle de délai générale. Citation imprécise. | Corriger |
| `CASH-01` | « interdit d'accepter 7 500 $ ou plus en espèces pour un mandat » | Exact sur le seuil, mais : (a) QC art. 69 vise **la réception en fidéicommis** et comporte **6 exceptions** ; (b) ON art. 4(1) vise un montant **agrégé** par dossier client, avec les exceptions de l'art. 6. Le mot **« agrégé »** est absent du registre et du code. | Corriger — critique |
| `CASH-QC-02` | « déclaration dans les 30 jours (art. 71) » | Exact, mais incomplet : la déclaration va **au directeur de l'inspection professionnelle**, accompagnée d'une **copie du reçu** et d'une **mention du fondement** (honoraires gagnés / débours engagés / cas de l'art. 69). | Enrichir |
| `RET-QC-01/02` | 7 ans | Exact. Précision utile : art. 31 = 7 ans **à partir de la fermeture du dossier** pour les journaux et registres ; art. 32 = 7 ans **après la fin de l'exercice financier** pour les rapports mensuels, copies de chèques reçus en fidéicommis et **toutes les pièces justificatives**. Deux points de départ différents. | Enrichir |
| `TR-QC-04` | « art. 43 non couvert par SAFE » | Confirmé, et c'est plus large que noté : art. 43 à 46 (registre + information du client + lieu de garde + affectation). | Confirmé |
| `TR-QC-12` | audit CPA « incertain » | Non exigé par B-1 r. 5. | Reclasser |
| `TR-QC-11` | « RAP » | N'existe pas sous ce nom dans le règlement. Le bon objet est l'art. 42. | Remplacer |

---

## 1. Résumé exécutif

### 1.1 Le verdict en une phrase

SAFE possède un **moteur comptable fidéicommis solide** — registre append-only, verrou de concurrence sur les retraits, verrouillage de période, piste d'audit systématique, blocage de certification sur solde client négatif — mais **ne peut produire aucun des deux livrables réglementaires qui font l'objet de l'inspection** : le **rapport comptable mensuel de l'art. 41** (QC) et son équivalent ontarien, la **comparaison mensuelle détaillée du par. 18(8)** avec ses annexes. Un inspecteur qui arrive demain repart avec un constat.

### 1.2 Les cinq constats qui commandent tout le reste

1. **Le rapport mensuel n'est pas produisible.** L'art. 41 exige sept blocs de données dont **quatre listes détaillées ligne par ligne** (soldes de cartes-clients avec date de dernière inscription, chèques en circulation avec numéro et date d'émission, recettes en circulation, comptes particuliers). SAFE stocke `chequesEnCirculation` et `depotsEnTransit` comme **deux nombres flottants uniques**, saisis à la main. Il n'existe aucune ligne. C'est le cœur de l'inspection, et c'est absent.

2. **SAFE ne modélise pas le compte bancaire.** L'art. 36 impose des livres **distincts pour chaque compte général en fidéicommis** ; l'art. 7(5) ontarien autorise explicitement plusieurs comptes en fiducie. `TrustAccount` dans SAFE n'est pas un compte bancaire : c'est un sous-compte client/dossier. Un cabinet à deux comptes en fidéicommis ne peut pas être servi correctement, et le rapprochement mélangerait deux banques dans un seul écart.

3. **Un retrait fidéicommis peut payer une facture non émise.** `createTrustWithdrawal` vérifie que la facture appartient au bon client, mais **jamais son statut**. Or l'art. 56(2) QC autorise le retrait pour honoraires uniquement « pour lesquels **la facturation a été envoyée** », et le par. 9(1)3 ON dit « **for which a billing has been delivered** ». Un brouillon suffit aujourd'hui à sortir de l'argent client. C'est le scénario type de détournement involontaire.

4. **La règle des espèces est mal implémentée dans les deux sens.** Elle bloque ce qui est permis (les six exceptions des art. 69 QC et 6 ON, dont l'avance d'honoraires) et laisse passer ce qui est interdit (l'**agrégation par dossier** de l'art. 4(1) ON : trois dépôts de 3 000 $ passent). Et rien n'existe pour les art. 70, 71, 72, 73 : reçu en double signé par les deux parties, déclaration au directeur dans les 30 jours, remboursement obligatoirement en espèces, conversion au taux de midi de la Banque du Canada.

5. **Le retrait en espèces est offert dans l'interface.** `components/fideicommis/RetraitForm.tsx` propose le mode `ESPECES` sans aucun garde-fou, alors que l'art. 57 QC l'interdit formellement (« l'avocat ne peut retirer des sommes en espèces d'un compte général en fidéicommis »), sous la seule réserve de l'art. 72.

### 1.3 Ce que SAFE fait déjà mieux que la moyenne du marché

Ce n'est pas un rapport à charge. Trois mécanismes valent d'être notés, parce qu'ils sont rares :

- **Le verrou consultatif Postgres sur le retrait** (`pg_advisory_xact_lock` par compte, solde relu dans la transaction) élimine la course TOCTOU qui produit les soldes négatifs. La plupart des concurrents lisent le solde hors transaction.
- **Le blocage de certification sur compte client négatif** (`reconciliation-service.ts`, garde-fou R-1) attrape exactement ce que l'agrégat masque : un client à −200 $ compensé par un autre à +200 $. C'est la faute la plus sanctionnée en inspection.
- **Le verrouillage de période à la certification**, qui interdit l'antidatation dans un mois clos. C'est la bonne doctrine.

### 1.4 Scores

| Score | Valeur | Lecture |
|---|---|---|
| Barreau du Québec | **48 / 100** | Moteur solide, livrables réglementaires absents |
| Law Society of Ontario | **42 / 100** | Idem, plus les exigences propres à l'Ontario (Form 9A, double signature électronique, registre des biens, frais de renvoi) toutes absentes |
| **Global** | **45 / 100** | |
| Préparation à une inspection réelle | **NON PRÊT** | Échec sur le livrable central dans les deux provinces |

Méthode de calcul en §13.

---

## 2. Tableau complet des exigences réglementaires

Légende : ✅ couvert · 🟡 partiellement couvert · ❌ manquant
Criticité : **C** critique · **M** majeur · **Y** moyen · **N** mineur

### 2.1 Québec — B-1, r. 5

#### Tenue des dossiers (art. 7 à 19)

| # | Art. | Obligation | Objectif | Statut SAFE | Crit. |
|---|---|---|---|---|---|
| QC-01 | 7 | Système à jour de rappel des **dates de prescription** et de tout délai influant sur les recours | Éviter la déchéance des droits du client | 🟡 `DossierDocketEntry`, échéances et `CalendarEvent` existent ; aucun champ « délai de prescription » typé ni alerte dédiée | M |
| QC-02 | 8 | Agenda / registre des rendez-vous, vacations, dates de rappel | Traçabilité de la diligence | 🟡 calendrier présent, pas de registre de « vacations » | N |
| QC-03 | 9 | Liste à jour des **dossiers actifs** et des **dossiers fermés au cours des 7 dernières années** | Livrable d'inspection immédiat | 🟡 `Dossier` + `DossierClosure` existent ; **aucun rapport « liste des dossiers fermés 7 ans »** exportable | Y |
| QC-04 | 11 | Un dossier par mandat ou contrat de service | Traçabilité | ✅ | — |
| QC-05 | 13-14 | Identification du client : nom, adresse, téléphone, **occupation** ; pour une société : n° de constitution, **nature générale des activités**, **nom/poste/adresse/téléphone des personnes autorisées** ; identification du **tiers** pour qui le client agit | Anti-blanchiment, connaissance du client | 🟡 modèle `Client` riche mais **`occupation` absent**, **`natureActivites` absent**, **personnes autorisées absentes**, **tiers absent** | M |
| QC-06 | 15 | Système de classement ordonné ; **registre des codes** si identification codifiée | Reconstituabilité | 🟡 numérotation `lib/dossiers/numero.ts` ; pas de registre des codes | N |
| QC-07 | 18 | Dossiers actifs au domicile professionnel ou lieu d'archivage ; **conservation ≥ 7 ans à compter de la fermeture** | Accès et preuve | ✅ `retentionJusqua`, `computeRetentionUntil` (défaut 7 ans) | — |
| QC-08 | 19 | Interdiction de détruire un **original appartenant au client** sans autorisation ou possibilité de reprise | Propriété du client | ❌ aucune notion d'« original client » ni de consentement à destruction | Y |

#### Vérification d'identité (art. 20 à 27)

| # | Art. | Obligation | Statut SAFE | Crit. |
|---|---|---|---|---|
| QC-09 | 20 | Vérification obligatoire dès que l'avocat **reçoit, débourse ou vire des fonds** (autrement que par TEF) | 🟡 `ClientIdentityVerification` existe mais **n'est jamais déclenchée par un mouvement de fonds** ; aucun blocage | **C** |
| QC-10 | 21 | 7 catégories d'exemptions (institution financière, employeur, confrère, règlement de procédure, ordonnance, honoraires/débours, fonds reçus d'un avocat ou notaire, agent de la paix…) | ❌ aucune modélisation des exemptions | M |
| QC-11 | 22-23 | Documents de **source fiable et indépendante**, copie conservée au dossier ; pour une personne morale : administrateurs et **détenteurs de 25 % et plus** | 🟡 `methode`, `documentId`, `notes` seulement — aucun registre des bénéficiaires effectifs 25 % | **C** |
| QC-12 | 24-25 | Client non rencontré au Canada : **mandataire sous entente écrite** ou **attestation de répondant** (juge, commissaire, professionnel) avec nom, qualité, adresse, signature, type et n° du document | ❌ absent | M |
| QC-13 | 26 | Délais : personne physique = **au plus tard à la réception des fonds** ; société = **60 jours** | ❌ aucun calcul d'échéance ni relance | M |
| QC-14 | 27 | Dispense de re-vérification si reconnaissance / informations inchangées | ❌ | N |

#### Dispositions comptables générales (art. 28 à 34)

| # | Art. | Obligation | Statut SAFE | Crit. |
|---|---|---|---|---|
| QC-15 | 28 | Livres et registres **tenus à jour** | 🟡 à jour par construction pour ce qui est saisi ; rien n'impose la saisie | Y |
| QC-16 | 29 | Confidentialité, sécurité, et **accès en tout temps par le syndic, ses enquêteurs, le directeur de l'inspection et ses experts** | ❌ **aucun mode « accès inspecteur »** : pas de compte lecture seule horodaté, pas de trousse d'accès, pas de journalisation d'une consultation d'inspection | M |
| QC-17 | 30 | Registres **lisibles et permanents**, copies extractibles **immédiatement, en tout temps** | 🟡 exports partiels (`export-journal.ts`, QB/Xero/Sage) ; **pas d'export « registre réglementaire » papier-équivalent** | M |
| QC-18 | 31 | Conservation **≥ 7 ans à partir de la fermeture du dossier** de tous journaux et registres, sauf registre des rapports mensuels | 🟡 politique documentaire présente ; **aucune rétention appliquée aux registres comptables eux-mêmes** | M |
| QC-19 | 32 | Conservation **≥ 7 ans après la fin de l'exercice** : rapports mensuels, **copie de tout chèque ou ordre de paiement reçu en fidéicommis**, **toutes les pièces justificatives** (reçus émis, relevés bancaires, chèques compensés, bordereaux de dépôt détaillés, confirmations de virement électronique) | ❌ **aucune pièce justificative n'est attachable à une transaction fidéicommis** ; `TrustTransaction` n'a pas de champ document | **C** |
| QC-20 | 33 | **Reconstituer la comptabilité** sur demande écrite du Comité exécutif, du syndic ou du directeur, dans le délai imparti, à défaut aux frais de l'avocat | ❌ aucune fonction de reconstitution ni de trousse | M |
| QC-21 | 34 | **Journal de caisse d'administration** : pour chaque recette, date, somme, **nom de la personne de qui reçue**, nom du client, n° de dossier, **objet**, **indication « espèces »** ; pour chaque débours, date, montant, **nom du bénéficiaire**, client, dossier | 🟡 `JournalGeneralEntry` couvre date/montant/description/client/dossier ; **manquent** : nom du payeur, nom du bénéficiaire, objet typé, indicateur espèces | M |

#### Comptabilité en fidéicommis (art. 35 à 42)

| # | Art. | Obligation | Statut SAFE | Crit. |
|---|---|---|---|---|
| QC-22 | 36 | **Livres, journaux et registres distincts pour chaque compte général en fidéicommis** | ❌ **SAFE ne modélise pas le compte bancaire fidéicommis** | **C** |
| QC-23 | 37 | Inscriptions **dès réception ou retrait** | ✅ écriture synchrone dans la transaction | — |
| QC-24 | 38 | **Journal de caisse fidéicommis** — recettes : date, somme, **nom de la personne de qui reçue**, nom du client, n° de dossier, **objet**, **indicateur espèces**, **solde après chaque inscription** ; débours : date, montant, **nom du bénéficiaire**, client, dossier, **objet**, **mode de retrait**, **n° de chèque**, solde | 🟡 date, montant, client, dossier, `modePaiement`, `balanceAfter`, `description` ✅ ; **absents : payeur, bénéficiaire, objet typé, n° de chèque, indicateur espèces normalisé** | **C** |
| QC-25 | 39 | **Registre de cartes-clients** — par client **et par dossier**, mêmes champs, solde après chaque inscription | 🟡 dérivable de `TrustTransaction` (`getTrustBalancesByDossier`), mais **hérite des champs manquants** et **n'est jamais matérialisé en registre imprimable** | **C** |
| QC-26 | 40 | **Registre permanent des rapports comptables mensuels** de chaque compte général | 🟡 `TrustComplianceReport` existe mais n'est pas structuré selon l'art. 41 et n'est pas par compte bancaire | M |
| QC-27 | 41 | **Rapport comptable mensuel sur formulaire prescrit**, contenant les 7 blocs (liste des soldes de cartes-clients **avec date de dernière inscription** ; liste des **chèques en circulation** avec montant, date d'émission, **n° de chèque**, client, dossier ; liste des **recettes en circulation** ; total des recettes et débours du mois ; **état comparatif** journal ↔ relevé bancaire ; **liste des comptes particuliers** avec institution, n° de compte, date d'ouverture, montant initial ; **copie du relevé bancaire**) | ❌ **le livrable central de l'inspection n'existe pas** | **C** |
| QC-28 | 42 | **Rapport comptable annuel** au directeur de l'inspection professionnelle, **formulaire prescrit**, **dans les 30 jours** de la demande, période de 12 mois, 7 blocs dont la **liste des comptes fermés durant la période** | ❌ `type: "annual"` existe et bloque la certification si les 12 rapprochements ne sont pas certifiés — bon garde-fou — mais **ne produit aucun des 7 blocs de l'art. 42** | **C** |

#### Autres biens en fidéicommis (art. 43 à 46)

| # | Art. | Obligation | Statut SAFE | Crit. |
|---|---|---|---|---|
| QC-29 | 43 | **Registre permanent des autres biens** : description, n° d'identification, date de prise de possession, client, date de remise, nom du destinataire | ❌ totalement absent | M |
| QC-30 | 44 | Informer **sans délai** le client quand le bien vient d'un tiers | ❌ | Y |
| QC-31 | 45 | Aviser le client du **lieu de garde** du bien meuble et de tout changement | ❌ | Y |
| QC-32 | 46 | Bien utilisé **selon son affectation** | ❌ | Y |

#### Réception et retrait d'argent (art. 47 à 61)

| # | Art. | Obligation | Statut SAFE | Crit. |
|---|---|---|---|---|
| QC-33 | 47 | Sommes rattachées à un **mandat licite clairement défini** ; détenir de l'argent n'est pas en soi l'exercice de la profession | 🟡 `dossierId` obligatoire au dépôt — bon réflexe ; aucun contrôle du caractère « actif » du mandat | Y |
| QC-34 | 48 | Sommes utilisées **selon leur affectation** | ❌ aucune notion d'affectation (« provision honoraires », « fonds de clôture », « consignation ») | M |
| QC-35 | 49 | Informer sans délai le client quand les fonds viennent d'un tiers | 🟡 `Payment.payerName` existe côté paiement ; **absent côté fidéicommis**, et aucune notification | M |
| QC-36 | 50 | Dépôt **sans délai**, **succursale québécoise**, institution assurée **ayant une entente avec le Barreau (B-1 r.10)**, compte identifié **« en fidéicommis »/« in trust »** | ❌ aucune de ces quatre conditions n'est modélisée ni vérifiée | M |
| QC-37 | 51 | **Formulaire prescrit** transmis sans délai au Barreau et à l'institution à l'ouverture ; l'avocat en conserve un exemplaire | ❌ | Y |
| QC-38 | 52 | Ne déposer **que** l'argent en fidéicommis et les frais d'administration du compte | ❌ aucun contrôle de nature des dépôts | M |
| QC-39 | 53 | **Somme indivisible** : déposer en fidéicommis puis retirer **sans délai** la part qui n'y appartient pas | ❌ aucun flux « split » ; risque de mélange de fonds | M |
| QC-40 | 54-55 | Interdiction de déposer : avance d'honoraires **déjà facturée** ; provision de disponibilité acquise par **entente écrite** | ❌ aucun contrôle | M |
| QC-41 | 56 | Trois retraits permis seulement : (1) remise au client ou à un tiers en son nom, (2) honoraires et débours **facturés et envoyés**, selon l'art. 58, (3) transfert direct vers un autre compte en fidéicommis | ❌ **`transactionType` distingue `withdrawal` et `transfer_to_invoice`, mais aucune validation du motif ni de l'envoi de la facture** | **C** |
| QC-42 | 57 | **Aucun retrait en espèces** (sauf art. 72) ; chèques **nominatifs**, jamais au porteur, à « caisse », « cash » ou en blanc | ❌ **le formulaire de retrait offre `ESPECES`** ; aucune notion de bénéficiaire de chèque | **C** |
| QC-43 | 58 | Retrait d'honoraires **sans délai**, **uniquement par chèque à l'ordre de l'avocat** ou **virement vers un compte non fiduciaire au nom de l'avocat** | ❌ aucun contrôle du compte destinataire | M |
| QC-44 | 59 | **Jamais plus que le solde détenu pour ce dossier** | ✅ **implémenté correctement**, sous verrou transactionnel | — |
| QC-45 | 60 | **Combler sans délai tout solde débiteur**, quelle qu'en soit la raison | 🟡 la certification est bloquée si un compte est négatif — mais **aucune alerte immédiate**, aucun délai suivi, aucun flux de renflouement | M |
| QC-46 | 61 | Chèques fidéicommis portant le nom + « en fidéicommis »/« in trust », **numérotés consécutivement** | ❌ **aucun registre de chèques, aucune numérotation, aucun contrôle de séquence** | **C** |

#### Comptes particuliers en fidéicommis (art. 62 à 68)

| # | Art. | Obligation | Statut SAFE | Crit. |
|---|---|---|---|---|
| QC-47 | 62 | Ouvrir un **compte particulier** dès que le client exige que **les revenus lui reviennent** | ❌ concept absent | M |
| QC-48 | 63 | Succursale québécoise, compte identifié « en fidéicommis » **+ nom du client** | ❌ | M |
| QC-49 | 64 | **Formulaire prescrit** rempli par l'avocat **et** le client, transmis au Barreau et à l'institution, copie au client | ❌ | M |
| QC-50 | 65 | Usage restreint du compte particulier (détenir, virer vers le général, acquérir/renouveler des placements, recevoir les revenus, payer les frais) | ❌ | Y |
| QC-51 | 66 | **Cartes-clients propres aux comptes particuliers** : transferts entrants/sortants, revenus de placement, frais, solde après chaque inscription | ❌ | M |
| QC-52 | 67 | **Virer sans délai** le solde au compte général quand le compte particulier n'est plus requis | ❌ | Y |
| QC-53 | 68 | Un **placement** acquis à la demande du client est **réputé un compte particulier** | ❌ | Y |

#### Montants en espèces (art. 69 à 73)

| # | Art. | Obligation | Statut SAFE | Crit. |
|---|---|---|---|---|
| QC-54 | 69 | Interdiction de recevoir **en fidéicommis** 7 500 $ ou plus en espèces **pour un même mandat**, **sauf 6 exceptions** (institution financière, organisme public, ordonnance/amende, agent de la paix, dépôt pour mise en liberté, **avance d'honoraires ou de débours**) | 🟡 seuil correct mais **blocage absolu, aucune exception, aucune agrégation par mandat** | **C** |
| QC-55 | 70 | **Reçu pour toute somme en espèces** (aucun seuil) : date, nom du payeur, somme, client, dossier, objet ; **signé par l'avocat ET par le payeur** ; copie conservée | ❌ aucun reçu, aucune signature | **C** |
| QC-56 | 71 | Espèces ≥ 7 500 $ : **dans les 30 jours**, transmettre au directeur de l'inspection professionnelle **copie du reçu + déclaration signée** mentionnant le fondement | ❌ | **C** |
| QC-57 | 72 | Remboursement total ou partiel d'une somme ≥ 7 500 $ reçue en espèces : **obligatoirement en espèces**, contre **reçu signé** par le bénéficiaire (client, bénéficiaire, somme, date, dossier) | ❌ | M |
| QC-58 | 73 | Espèces étrangères converties au **taux officiel de midi de la Banque du Canada** du jour de réception (ou jour ouvrable précédent si férié) | ❌ aucune notion de devise ni de conversion sur les espèces | Y |

#### Cessation d'exercice (art. 74 à 82)

| # | Art. | Obligation | Statut SAFE | Crit. |
|---|---|---|---|---|
| QC-59 | 75-76 | Cession des dossiers, livres et registres à un avocat en exercice ; **avis écrit au syndic et aux clients** | ❌ | Y |
| QC-60 | 78 | **Prévoir un cessionnaire désigné** en cas de décès ou d'inaptitude | ❌ | M (c'est l'équivalent québécois du plan de contingence ontarien) |
| QC-61 | 82 | Conservation 7 ans des dossiers non repris | 🟡 politique générique | N |

### 2.2 Ontario — By-Law 9

| # | Art. | Obligation | Statut SAFE | Crit. |
|---|---|---|---|---|
| ON-01 | 2, 2.2, 2.3 | Titulaire **failli** ou **suspendu** : interdiction de manier des fonds en fiducie ; retrait de tous les comptes **dans les 30 jours** de la suspension | ❌ aucun statut de licence dans le modèle `User` ; aucun blocage | M |
| ON-02 | 4(1) | Interdiction de recevoir **en montant agrégé** 7 500 $ CAD ou plus en espèces **pour un même dossier client** | ❌ **le code teste transaction par transaction, jamais l'agrégat** | **C** |
| ON-03 | 4(2) | Devises étrangères converties au **taux de midi de la Banque du Canada** au moment de la réception (jour ouvrable précédent si férié) | ❌ | Y |
| ON-04 | 5 | La règle s'applique dès que le titulaire reçoit/paie des fonds, achète/vend des valeurs, biens immobiliers ou actifs d'entreprise, ou **transfère des fonds par tout moyen** | ❌ aucun périmètre d'activité modélisé | Y |
| ON-05 | 6 | 5 exceptions (organisme public, institution financière, agent de la paix, ordonnance, amende, **honoraires/débours/cautionnement à condition que tout remboursement soit aussi en espèces**) | ❌ | M |
| ON-06 | 7(1) | Fonds reçus en fiducie **« immediately »** déposés dans un compte désigné comme compte en fiducie, au nom du titulaire ou du cabinet | ❌ aucun suivi du délai de dépôt (aucune date de réception distincte de la date de dépôt) | **C** |
| ON-07 | 7(3) | Doivent aussi être déposés : les fonds retirés **par inadvertance** en contravention de l'art. 9, et les fonds **mixtes** non séparables | ❌ | M |
| ON-08 | 7(4) | Retirer **dès que possible** la part appartenant au titulaire dans un paiement mixte | ❌ | M |
| ON-09 | 7(5) | **Un titulaire peut tenir plusieurs comptes en fiducie** | ❌ non modélisé | **C** |
| ON-10 | 8(1) | Exceptions au dépôt en fiducie : **demande écrite du client**, compte au nom du client, remise immédiate | ❌ | Y |
| ON-11 | 8(2) | Interdiction de déposer en fiducie : fonds appartenant entièrement au titulaire, **provision générale non remboursable**, paiement d'honoraires **déjà facturés** | ❌ | M |
| ON-12 | 8(3) | Les fonds non déposés en fiducie doivent quand même figurer dans les registres de la Partie V | ❌ | Y |
| ON-13 | 9(1) | **Cinq motifs de retrait seulement**, dont le par. 3 : honoraires **« for which a billing has been delivered »** | ❌ **aucun contrôle du statut de la facture** | **C** |
| ON-14 | 9(3) | Jamais plus que ce qui est détenu **pour ce client dans ce compte** | ✅ (au niveau client/dossier ; ⚠️ « dans ce compte » impossible à garantir faute de modèle de compte bancaire) | 🟡 |
| ON-15 | 10 | Retrait pour honoraires/débours **uniquement** par chèque à l'ordre du titulaire, virement vers un compte non fiduciaire à son nom, ou virement électronique | ❌ | M |
| ON-16 | 11 | Chèque en fiducie **jamais** payable à « cash » ou au porteur ; **jamais signé par un non-titulaire** sauf circonstances exceptionnelles avec pouvoir de signature **et cautionnement** au moins égal au solde maximal de l'exercice précédent | ❌ **aucune notion de signataire autorisé ni de cautionnement** | **C** |
| ON-17 | 12(2)1 | **Double contrôle électronique** : une personne saisit les données, **une autre** autorise, chacune avec son propre mot de passe | ❌ **aucune séparation des tâches sur les virements** | **C** |
| ON-18 | 12(2)2-3 | Confirmation de l'institution **au plus tard à la clôture du jour bancaire suivant**, contenant 6 éléments précis (n° du compte source, nom/succursale/adresse de l'institution destinataire, nom du titulaire du compte destinataire, n° du compte destinataire, horodatage de réception, horodatage d'envoi) | ❌ | M |
| ON-19 | 12(2)4 + 12(7) | **Réquisition de virement électronique signée avant la saisie**, **Formulaire 9A** | ❌ **Form 9A absent** — c'est le premier document qu'un auditeur LSO demande sur un virement | **C** |
| ON-20 | 12(3) | Exemption de double contrôle pour le **praticien véritablement seul** (pas d'associé, pas d'employé) qui saisit lui-même les deux jeux de données | ❌ aucune modélisation de la taille du cabinet à cette fin | Y |
| ON-21 | 12(5) | Dans le jour bancaire suivant la confirmation : **imprimer**, **comparer** à la réquisition signée, **annoter** client/objet/n° de dossier, **signer et dater** | ❌ | M |
| ON-22 | 13 | Fonds de clôture immobilière (règles spécifiques, Form 9B/9C) | ❌ non couvert ; pertinent si un cabinet fait de l'immobilier | M |
| ON-23 | 14 | **Solde suffisant en tout temps** dans les comptes en fiducie pour couvrir toutes les obligations | 🟡 vérifié par dossier au retrait, jamais au niveau du compte bancaire | M |
| ON-24 | 15-17 | Retraits automatiques Teranet et comptes associés | ❌ | N (sauf immobilier ON) |
| ON-25 | 18(1) | **Livre-journal des recettes en fiducie** : date, **méthode de réception**, **personne de qui reçue**, montant, **objet**, client | 🟡 méthode ✅, montant ✅, client ✅ ; **personne et objet absents** | **C** |
| ON-26 | 18(2) | **Livre-journal des débours en fiducie** : date, **méthode**, **numéro ou identifiant du document utilisé** (n° de chèque), **personne à qui versé**, montant, **objet**, client | ❌ **identifiant de document et bénéficiaire absents** | **C** |
| ON-27 | 18(3) | **Grand livre des clients** en fiducie : par client, tout reçu, tout déboursé, solde non dépensé | 🟡 dérivable, non matérialisé | M |
| ON-28 | 18(4) | **Journal des virements entre comptes clients**, avec **l'objet de chaque virement** | ❌ **aucun mouvement client→client n'est modélisé** (il est bloqué, ce qui est prudent, mais l'art. 56(3) QC et le par. 9(1)4 ON les autorisent dans certains cas) | M |
| ON-29 | 18(5)(6) | Journaux **généraux** (hors fiducie) recettes et débours, avec méthode, identifiant de document, personne | 🟡 `JournalGeneralEntry` sans personne ni identifiant de document | M |
| ON-30 | 18(7) | **Livre des honoraires** ou fichier chronologique des factures | ✅ `Invoice` + numérotation séquentielle sans trou | — |
| ON-31 | 18(8) | **Comparaison mensuelle** solde bancaire ↔ total des soldes clients, **avec les motifs de tout écart**, appuyée par (i) **une liste détaillée mensuelle client par client** et (ii) **un rapprochement détaillé de chaque compte bancaire en fiducie** | ❌ **la liste détaillée n'est jamais produite ni figée ; le rapprochement n'est pas par compte bancaire ; les motifs d'écart ne sont pas un champ structuré** | **C** |
| ON-32 | 18(9) | **Registre des biens autres que de l'argent** : description, date de prise de possession, **personne qui la détenait avant**, **valeur**, client, date de remise, destinataire | ❌ | M |
| ON-33 | 18(10) | Relevés bancaires, **chèques compensés**, **bordereaux de dépôt détaillés en double**, pour tous les comptes fiducie **et généraux** | ❌ aucune pièce attachée | **C** |
| ON-34 | 18(11) | **Réquisitions 9A signées + confirmations imprimées signées** | ❌ | **C** |
| ON-35 | 19(1) | **Carnet de reçus en double** pour toute somme en espèces : date, payeur, montant, client, n° de dossier, **signature du titulaire ET du payeur** | ❌ | **C** |
| ON-36 | 19.1 | **Registre des frais de renvoi** reçus et payés (date, méthode, montant, titulaire concerné, client) + tous les documents | ❌ | M |
| ON-37 | 20 | Hypothèques détenues en fiducie : **grand livre des actifs**, **grand livre des passifs**, **comparaison mensuelle** | ❌ | M (si pratique immobilière) |
| ON-38 | 21(1) | Registres permanents ; à la main = à l'encre | ✅ (électronique) | — |
| ON-39 | 21(2) | **Copie papier produite promptement sur demande du Barreau** | 🟡 exports CSV ; **aucun rendu paginé « registre » imprimable** | M |
| ON-40 | 22(1) | Registres **à jour en tout temps** | 🟡 | Y |
| ON-41 | 22(2) | Comparaison mensuelle (18(8)) et comparaison hypothécaire (20(3)) créées **dans les 25 jours** suivant la fin du mois | ✅ **seuil correctement implémenté et correctement restreint à l'Ontario** (`computeReconciliationSeverity`) | — |
| ON-42 | 23(1) | Conservation **6 ans** + exercice courant pour les registres des art. 18, 19, 19.1 | 🟡 rétention documentaire seulement | M |
| ON-43 | 23(2) | Conservation **10 ans** + exercice courant pour les par. 18(1), (2), (3), (8), (9), (10), (11) | ❌ **aucune rétention différenciée sur les registres comptables** | M |
| ON-44 | 24 | Cabinet agissant pour un prêteur : dossier par charge, autorisation d'investissement signée, rapport au prêteur | ❌ | M (si immobilier) |

---

## 3. Fonctionnalités entièrement couvertes ✅

Ce qui passerait tel quel devant un inspecteur :

1. **Registre fidéicommis append-only** — aucun `update`/`delete` sur `TrustTransaction` ; les corrections sont des écritures nouvelles reliées par `correctionOfId`. Conforme à l'esprit des art. 30 QC et 21 ON.
2. **Solde par dossier jamais dépassé au retrait** (art. 59 QC, par. 9(3) ON) — et implémenté de façon *robuste* : verrou consultatif Postgres par compte, solde relu dans la transaction. C'est mieux que la moyenne.
3. **Blocage de certification sur solde client négatif** — attaque directement le risque le plus sanctionné.
4. **Verrouillage de période à la certification** — interdit l'antidatation dans un mois clos (`accountingPeriodLock`), avec un point d'étranglement unique dans `createJournalEntry`.
5. **Interdiction de la réallocation croisée entre clients** (`validateNoCrossAllocation`) — un retrait ne peut servir la facture d'un autre client, avec journalisation de la tentative bloquée. Excellent.
6. **Numérotation de factures séquentielle sans trou** (par. 18(7) ON).
7. **Piste d'audit systématique** sur toute opération fidéicommis (`createAuditLog` avec `oldValues`/`newValues`, IP, user-agent).
8. **Politique de saisie manuelle restreinte** au journal (`AJUSTEMENT`, `CORRECTION` seulement) — empêche le double comptage et le mélange des flux.
9. **Seuil des 25 jours correctement provincialisé** — jamais affiché au Québec, où aucun délai chiffré n'existe. C'est une finesse réglementaire réelle et bien faite.
10. **Rapport annuel bloqué tant que les 12 rapprochements mensuels ne sont pas certifiés** — bonne discipline, même si le contenu du rapport reste à construire.
11. **Corrections append-only du journal** avec re-jeu versionné (`#vN`) et écriture compensatoire — doctrine correcte.
12. **Rétention documentaire** avec `retentionJusqua` et `onDelete: Restrict` sur `Document` pour empêcher la disparition par effet de bord.

---

## 4. Fonctionnalités partiellement couvertes 🟡

| Domaine | Ce qui existe | Ce qui manque pour être conforme |
|---|---|---|
| **Rapprochement trois voies** | Trois soldes calculés : `soldeBancaire`, `soldeRegistre`, `soldeParDossier` | **L'écart n'est calculé qu'entre deux d'entre eux** : `ecart = soldeRapproche − soldeRegistre`. `soldeParDossier` est stocké mais **jamais comparé**. La « troisième voie » est décorative. Un écart entre la somme des `TrustAccount.currentBalance` et la somme des `TrustTransaction.amount` passerait la certification sans être vu. |
| **Carte-client** | Soldes dérivables par `getTrustBalancesByDossier` | Pas de registre matérialisé, pas de **date de dernière inscription**, pas de champs art. 39, pas de rendu imprimable, pas de figeage mensuel |
| **Journal fidéicommis** | Date, montant, client, dossier, mode, solde, description | Payeur, bénéficiaire, objet typé, n° de chèque, indicateur espèces normalisé |
| **Vérification d'identité** | Modèle `ClientIdentityVerification`, champs `idType`, `idNumber`, `identityVerified` | Aucun déclenchement par mouvement de fonds, aucun blocage, aucune échéance 60 jours, aucun bénéficiaire effectif 25 %, aucun répondant |
| **Conflits d'intérêts** | `ConflictCheck` avec recherche par nom, résolution, notes | Aucune obligation d'exécution avant ouverture, pas de recherche sur les parties adverses (`DossierPartie` existe pourtant), pas de blocage |
| **Rétention** | `retentionJusqua`, politiques par type de document | Aucune rétention appliquée aux **registres comptables** (7 ans QC, 6/10 ans ON), aucune distinction des deux points de départ (fermeture du dossier vs fin d'exercice) |
| **Exports** | CSV, QuickBooks, Xero, Sage | Aucun export **au format registre réglementaire**, aucune trousse d'inspection, aucun PDF paginé et signé |
| **Alertes de rapprochement** | Bannière, sévérité provincialisée | Aucune alerte sur solde débiteur (art. 60), aucune alerte sur dépôt en retard, aucune alerte sur espèces cumulées |
| **Intérêts sur créances** | `InterestCharge`, taux annuel, jours de retard | Aucune vérification du **plafond légal**, aucun avis préalable au client, aucune vérification que le taux est stipulé au mandat |
| **RBAC** | Deux systèmes (`UserRole` 4 rôles + `EmployeeRole` matrice module/action) ; certification réservée à `admin_cabinet`/`avocat` | **Deux systèmes parallèles = risque de divergence**. Aucune séparation des tâches sur les virements (par. 12(2)1 ON). Aucun signataire autorisé ni cautionnement (art. 11 ON). |

---

## 5. Fonctionnalités manquantes ❌ — analyse détaillée

Pour chacune : pourquoi c'est obligatoire, pourquoi l'inspecteur regarde, les conséquences, l'implémentation SAFE.

---

### M-01 — Rapport comptable mensuel de l'art. 41 (QC) / comparaison 18(8) (ON)

**Criticité : CRITIQUE. C'est le livrable numéro un de l'inspection.**

**Pourquoi obligatoire.** Art. 40 : « L'avocat doit tenir à jour un registre permanent contenant les rapports comptables mensuels de chaque compte général en fidéicommis. » Art. 41 : sur le formulaire prescrit, sept blocs. Côté Ontario, par. 18(8) : comparaison mensuelle **plus** deux annexes obligatoires — la liste détaillée client par client et le rapprochement détaillé de chaque compte bancaire — le tout dans les 25 jours (par. 22(2)).

**Pourquoi l'inspecteur le vérifie en premier.** C'est le seul document qui prouve simultanément que les trois registres concordent, que l'avocat s'en est aperçu, et qu'il l'a fait dans les temps. Un cabinet qui ne l'a pas n'a pas de comptabilité fidéicommis, quelle que soit la qualité de ses écritures.

**Conséquences réglementaires.** Manquement direct aux art. 40-41 QC / par. 18(8) et 22(2) ON. En pratique : demande de reconstitution (art. 33, aux frais de l'avocat), suivi d'inspection rapproché, signalement au syndic si des écarts apparaissent, et en cas de déficit, procédure disciplinaire.

**Risques pour le cabinet.** Un déficit de fidéicommis non détecté pendant plusieurs mois devient un détournement de fait. L'assurance responsabilité ne couvre pas la faute déontologique de tenue de livres.

**Implémentation SAFE.**

*Écrans*
1. `/comptabilite/fideicommis/rapports-mensuels` — liste des périodes avec état (à faire / brouillon / certifié / en retard), par compte bancaire.
2. Écran de composition du rapport mensuel, en sept sections repliables correspondant aux sept blocs de l'art. 41.
3. Écran de saisie des **chèques en circulation** (liste, pas un nombre) : n° de chèque, date d'émission, montant, client, dossier, bénéficiaire.
4. Écran de saisie des **recettes en circulation** : montant, date de réception, client, dossier.
5. Écran de téléversement du **relevé bancaire** du mois, obligatoire pour clore.
6. Aperçu imprimable paginé + PDF signé.

*Données à enregistrer*
- Nouvelle table `TrustMonthlyReport` : `cabinetId`, `trustBankAccountId`, `periode`, `status`, `snapshotJson` (figé), `bankStatementDocumentId`, `certifiedById`, `certifiedAt`, `declarationText`, `lockedAt`.
- Nouvelle table `TrustOutstandingCheque` : `reportId`, `chequeNumber`, `issueDate`, `amount`, `clientId`, `dossierId`, `payeeName`, `clearedAt`.
- Nouvelle table `TrustDepositInTransit` : `reportId`, `receivedDate`, `amount`, `clientId`, `dossierId`, `payerName`.
- Nouvelle table `TrustClientLedgerSnapshot` : `reportId`, `clientId`, `dossierId`, `balance`, `lastEntryDate` — **c'est le champ « date de la dernière inscription » de l'art. 41(1), aujourd'hui inexistant**.
- Nouvelle table `TrustDiscrepancyReason` : `reportId`, `amount`, `explanation`, `resolvedAt` — le par. 18(8) ON exige explicitement « the reasons for any differences ».

*Validations automatiques*
- Somme des soldes du snapshot = solde du registre, à l'exact.
- Solde bancaire − Σ chèques en circulation + Σ recettes en circulation = solde du registre. Si non, écart non nul → **motif obligatoire** avant certification.
- Aucun solde client négatif (déjà fait, à conserver).
- Relevé bancaire attaché sinon certification refusée.
- Ontario : blocage à J+25 avec compteur visible ; Québec : rappel sans seuil chiffré (**conserver la distinction existante, elle est correcte**).

*Contrôles internes*
- Le rapport est **figé** (`snapshotJson`) à la certification : un recalcul ultérieur ne doit jamais réécrire un rapport signé.
- Certification réservée à l'avocat responsable (déjà le cas pour `canCertifyComplianceReport`).
- La certification verrouille la période (déjà le cas).

*Journaux d'audit* : génération, chaque modification de ligne, téléversement du relevé, certification, toute tentative de certification refusée avec le motif.

*Rapports générés* : PDF paginé du rapport mensuel, registre annuel des 12 rapports, export CSV de chaque liste.

*Cas particuliers* : premier mois d'utilisation (solde d'ouverture à saisir et à justifier) ; compte ouvert ou fermé en cours de mois ; chèque en circulation depuis plus de 6 mois (à signaler — fonds potentiellement non réclamés) ; mois sans aucune transaction (le rapport reste obligatoire).

*Erreurs humaines à prévenir* : saisir le solde bancaire avant les chèques en circulation et « forcer » l'écart ; recopier le rapport du mois précédent ; certifier sans avoir regardé la liste client.

*Protections* : interdiction de saisir un écart « à la main » ; l'écart est **toujours calculé** ; le bouton de certification n'apparaît qu'après affichage complet de la liste client (accusé de lecture) ; comparaison automatique avec le mois précédent et signalement des soldes clients inchangés depuis plus de 12 mois.

---

### M-02 — Modèle de compte bancaire en fidéicommis

**Criticité : CRITIQUE (structurel).**

**Pourquoi obligatoire.** Art. 36 QC : livres distincts **par compte général**. Art. 41(7) : relevé **de chaque compte**. Par. 7(5) ON : plusieurs comptes autorisés. Par. 18(8)ii ON : rapprochement détaillé **de chaque compte bancaire en fiducie**. Par. 9(3) ON : pas plus que ce qui est détenu pour ce client **dans ce compte**.

**Pourquoi l'inspecteur le vérifie.** Il demande la liste des comptes, les relevés, et vérifie que chaque compte se rapproche seul. Un système qui ne connaît qu'un « pot » global ne peut pas répondre.

**Conséquences.** Impossibilité structurelle de produire les art. 41 et 42 QC et le par. 18(8) ON pour tout cabinet ayant plus d'un compte. Impossibilité de gérer les comptes particuliers (art. 62-68).

**Implémentation SAFE.**
- Table `TrustBankAccount` : `cabinetId`, `type` (`GENERAL` | `PARTICULIER`), `institutionName`, `branchAddress`, `accountNumber` (chiffré), `accountLabel` (doit contenir « en fidéicommis » ou « in trust » — **validation automatique**), `province`, `openedAt`, `closedAt`, `barreauNotifiedAt`, `barreauFormDocumentId`, `clientId` (pour les comptes particuliers), `initialDeposit`, `isPooled`, `interestBeneficiary` (Fonds d'études juridiques / Law Foundation of Ontario / client).
- `TrustTransaction.trustBankAccountId` obligatoire (migration avec compte par défaut rétroactif).
- Rapprochement, rapport mensuel, rapport annuel : tous portés par `trustBankAccountId`.
- Validation à l'ouverture : institution dans une liste ayant une entente avec le Barreau (QC, art. 50), succursale québécoise, libellé du compte conforme.
- Écran « Comptes en fidéicommis » avec état de chaque compte, dernier rapprochement, solde, et alerte si un compte n'a pas été rapproché.

---

### M-03 — Précondition « facture émise » sur le retrait d'honoraires

**Criticité : CRITIQUE. C'est un défaut de code exploitable aujourd'hui.**

**Le défaut, précisément.** Dans `lib/services/fideicommis/trust-transaction-service.ts`, la branche `if (factureId)` fait :

```
const invoice = await prisma.invoice.findFirst({ where: { id: factureId, cabinetId, clientId } });
if (!invoice) throw new Error(...);
```

Aucune lecture de `invoiceStatus`, `statut`, `sentAt` ni `validatedAt`. Une facture au statut `DRAFT` / `brouillon`, jamais envoyée au client, permet donc de sortir des fonds du fidéicommis.

**Pourquoi c'est interdit.** Art. 56(2) QC : retrait permis pour « le montant des honoraires et des débours **pour lesquels la facturation a été envoyée** ». Par. 9(1)3 ON : « **for which a billing has been delivered** ». Le mot est « envoyée » / « delivered », pas « préparée ».

**Pourquoi l'inspecteur le vérifie.** C'est le test classique : il prend trois retraits d'honoraires au hasard et demande la facture correspondante avec sa preuve d'envoi. S'il n'y en a pas, le retrait est un prélèvement irrégulier sur les fonds du client.

**Conséquences.** Retrait irrégulier = utilisation des fonds d'un client. Sanction disciplinaire, remboursement immédiat, et en cas de récidive, radiation possible.

**Implémentation.**
- Refuser le retrait si l'invoice n'est pas dans un état émis **et** n'a pas de `sentAt` non nul (ou une trace `InvoiceSendLog`).
- Refuser si le montant retiré dépasse le `balanceDue` de la facture.
- Refuser si la date de la facture est postérieure à la date du retrait.
- Consigner sur la transaction la référence facture, la date d'envoi et le canal.
- Un retrait **sans** facture doit exiger un **motif typé** parmi les trois de l'art. 56 : `REMISE_CLIENT_OU_TIERS`, `HONORAIRES_FACTURES`, `TRANSFERT_AUTRE_FIDEICOMMIS`. Aujourd'hui il n'y a aucun motif.
- Test de non-régression : un retrait sur facture brouillon doit lever.

---

### M-04 — Registre des chèques en fidéicommis et numérotation consécutive

**Criticité : CRITIQUE.**

**Pourquoi.** Art. 61 QC : chèques portant le nom + « en fidéicommis », **numérotés consécutivement**. Art. 38(2)h : **n° de chèque** au journal. Art. 41(2) : liste des chèques en circulation avec **n° de chèque**. Par. 18(2) ON : « the number or a similar identifier of any document used to disburse money ». Art. 57 QC et art. 11 ON : jamais au porteur, à « caisse » ou « cash ».

**Ce qui manque dans SAFE.** Aucun champ `chequeNumber`, aucun bénéficiaire, aucun contrôle de séquence, aucun état du chèque (émis / compensé / annulé / périmé).

**Implémentation.**
- Table `TrustCheque` : `trustBankAccountId`, `chequeNumber` (unique par compte), `issueDate`, `payeeName` (obligatoire, non vide, refusé si « cash », « caisse », « bearer », « porteur »), `amount`, `clientId`, `dossierId`, `trustTransactionId`, `status`, `clearedAt`, `voidedAt`, `voidReason`.
- Détection automatique des **trous de séquence** et affichage en tête du rapport mensuel.
- Chèque annulé : conservé, jamais supprimé, avec motif.
- Chèque en circulation depuis plus de 6 mois : alerte (fonds possiblement non réclamés).
- Blocage du mode `ESPECES` au retrait (art. 57 QC), sauf le cas de remboursement de l'art. 72 qui devient un flux distinct et explicite.

---

### M-05 — Chaîne complète des espèces (art. 69 à 73 QC / art. 4, 6, 19 ON)

**Criticité : CRITIQUE.**

**Trois défauts distincts.**

1. **Sur-blocage.** Le code refuse tout dépôt espèces ≥ 7 500 $. Or l'art. 69 prévoit six exceptions et l'art. 6 ON en prévoit cinq. L'exception la plus courante — **avance d'honoraires ou de débours** (art. 69(6) QC, art. 6(e) ON) — est précisément celle qu'un cabinet rencontre. SAFE bloque une opération licite, ce qui pousse l'utilisateur à la contourner en la saisissant comme « AUTRE ». Le sur-blocage produit du contournement, donc de la non-conformité.
2. **Sous-blocage.** L'art. 4(1) ON vise un montant **agrégé** par dossier client. Trois dépôts espèces de 3 000 $ sur le même dossier violent la règle et passent tous les trois.
3. **Absence totale** des art. 70 (reçu signé pour **toute** somme en espèces, sans seuil), 71 (déclaration au directeur dans les 30 jours), 72 (remboursement obligatoirement en espèces), 73 (conversion au taux de midi de la Banque du Canada), par. 19(1) ON (carnet de reçus en double signé).

**Implémentation.**
- Table `CashReceipt` : `date`, `payerName`, `amount`, `currency`, `cadAmount`, `conversionRate`, `conversionDate`, `clientId`, `dossierId`, `purpose`, `receivedByUserId`, `payerSignatureStorageKey`, `licenseeSignatureStorageKey`, `receiptNumber` (séquentiel), `exemptionInvoked` (énuméré aligné sur art. 69 QC / art. 6 ON), `declarationSentAt`, `declarationDocumentId`.
- Agrégation par dossier : à chaque saisie, calcul du cumul espèces du dossier ; blocage au franchissement de 7 500 $ **sauf** exception invoquée et documentée.
- Si exception invoquée : champ motif obligatoire, et pour l'exception « honoraires/débours » en Ontario, **mémoriser que tout remboursement devra se faire en espèces** (art. 6(e)).
- Déclaration art. 71 : dès qu'un cumul atteint 7 500 $, création automatique d'une **tâche à échéance J+30** avec génération du courrier au directeur de l'inspection professionnelle, copie du reçu attachée, et blocage du tableau de conformité tant qu'elle n'est pas envoyée.
- Reçu : PDF à deux signatures, imprimable, numéroté ; l'exception du par. 19(2) ON (efforts raisonnables si le payeur ne signe pas) doit être **documentée**, pas silencieuse.
- Conversion FX : appel ou saisie du taux de midi de la Banque du Canada avec la date, conservé sur le reçu.

---

### M-06 — Virements électroniques : Form 9A, double contrôle, confirmation signée (ON)

**Criticité : CRITIQUE en Ontario.**

**Pourquoi.** Par. 12(2)1 : deux personnes, deux mots de passe, l'une saisit, l'autre autorise. Par. 12(2)4 et 12(7) : **réquisition signée avant la saisie**, au **Formulaire 9A**. Par. 12(5) : dans le jour bancaire suivant, imprimer la confirmation, la comparer à la réquisition, l'annoter (client, objet, n° de dossier), la signer et la dater. Par. 18(11) : conserver réquisitions et confirmations signées **10 ans**.

**Pourquoi l'inspecteur le vérifie.** C'est mécanique : il prend un virement au relevé et demande le 9A signé et la confirmation contresignée. Absence = manquement immédiat, sans discussion possible.

**Implémentation.**
- Table `ElectronicTrustTransferRequisition` : tous les champs du Form 9A, `signedByUserId`, `signedAt`, `dataEnteredByUserId`, `authorizedByUserId` (**doivent différer**, sauf praticien seul au sens du par. 12(3)), `confirmationDocumentId`, `confirmationPrintedAt`, `comparedAt`, `annotatedClientId`, `annotatedDossierId`, `countersignedByUserId`, `countersignedAt`.
- Génération PDF du Form 9A pré-rempli depuis la transaction.
- **Aucun retrait par virement ne peut être enregistré sans réquisition signée préalable** — l'ordre chronologique doit être vérifié, pas seulement l'existence.
- Tâche automatique J+1 bancaire pour la contresignature, avec alerte si non faite.
- Détection du praticien seul : dérivée du nombre d'utilisateurs actifs du cabinet, et **journalisée** comme motif d'exemption.

---

### M-07 — Pièces justificatives attachées aux opérations

**Criticité : CRITIQUE.**

**Pourquoi.** Art. 32 QC : conservation 7 ans après l'exercice de « toutes les pièces justificatives ou de contrôle », **nommément** les copies de reçus émis, les relevés bancaires, les copies de chèques compensés, les bordereaux de dépôt détaillés, les documents confirmant les virements électroniques, et **une copie de tout chèque ou ordre de paiement reçu en fidéicommis**. Par. 18(10) ON : relevés, chèques compensés, bordereaux de dépôt en double, pour les comptes fiducie **et généraux**.

**Ce qui manque.** `TrustTransaction` n'a aucun lien vers `Document`. `Payment` a `preuveStorageKey` (bon), mais le fidéicommis n'a rien.

**Implémentation.**
- Table de liaison `TrustTransactionDocument` (`trustTransactionId`, `documentId`, `role` : `CHEQUE_RECU`, `BORDEREAU_DEPOT`, `CHEQUE_COMPENSE`, `CONFIRMATION_VIREMENT`, `RECU_ESPECES`, `RELEVE_BANCAIRE`, `AUTRE`).
- Pièce **obligatoire** selon le mode : dépôt par chèque → copie du chèque + bordereau ; virement → confirmation ; espèces → reçu signé.
- Indicateur « pièce manquante » sur chaque ligne du journal, et compteur en tête du rapport mensuel.
- Rétention alignée : 7 ans après fin d'exercice (QC), 10 ans (ON pour les par. 18(1)(2)(3)(8)(9)(10)(11)).

---

### M-08 — Vérification d'identité déclenchée par les mouvements de fonds

**Criticité : CRITIQUE.**

**Pourquoi.** Art. 20 QC : l'obligation naît quand l'avocat **reçoit, débourse ou vire des fonds**, autrement que par TEF. Art. 26 : au plus tard **à la réception** pour une personne physique, **60 jours** pour une société. Art. 23 : pour une personne morale, **administrateurs** et **détenteurs de 25 % et plus**.

**Ce qui manque.** Aucun lien entre `TrustTransaction` / `Payment` et `ClientIdentityVerification`. Aucune échéance. Aucun bénéficiaire effectif. Aucune exemption modélisée (art. 21).

**Implémentation.**
- Au premier mouvement de fonds sur un dossier : si le client n'a pas de vérification valide et qu'aucune exemption de l'art. 21 n'est invoquée, **bloquer** (personne physique) ou **créer une échéance à 60 jours** (personne morale) avec blocage à l'expiration.
- Table `BeneficialOwner` : `clientId`, `nom`, `adresse`, `occupation`, `pourcentage`, `role` (administrateur / détenteur ≥ 25 %), `verifiedAt`, `sourceDocumentId`.
- Table `IdentityAttestation` (art. 24) : répondant, qualité, adresse, signature, type et n° du document, date.
- Champ `exemptionArt21` énuméré, avec justification obligatoire.
- Écran « Identification et vérification » sur la fiche client, avec état vert/jaune/rouge et échéance visible.

---

### M-09 — Registre des autres biens en fidéicommis

**Criticité : MAJEUR.**

**Pourquoi.** Art. 43 QC : registre permanent — description, n° d'identification, date de prise de possession, client, date de remise, destinataire. Par. 18(9) ON, plus exigeant : ajoute **la personne qui détenait le bien immédiatement avant** et **la valeur**. Conservation 10 ans en Ontario.

**Cas réels** : titres, actions au porteur, testaments originaux, clés, bijoux détenus en garantie, actes notariés, chèques certifiés non déposés.

**Implémentation.**
- Table `TrustProperty` : `cabinetId`, `clientId`, `dossierId`, `description`, `identificationNumber`, `estimatedValue`, `receivedFromName`, `receivedAt`, `storageLocation`, `storageLocationHistory` (art. 45 : informer le client de tout changement), `clientNotifiedAt` (art. 44 quand le bien vient d'un tiers), `purpose` (art. 46, affectation), `releasedAt`, `releasedToName`, `releaseSignatureDocumentId`.
- Inclusion obligatoire dans le rapport mensuel et le rapport annuel.
- Alerte à la fermeture d'un dossier si un bien est encore détenu.

---

### M-10 — Comptes particuliers en fidéicommis (art. 62 à 68 QC)

**Criticité : MAJEUR.**

**Pourquoi.** Dès qu'un client exige que les revenus de son dépôt lui reviennent, l'avocat **doit** ouvrir un compte particulier (art. 62), avec formulaire signé par les deux parties (art. 64), cartes-clients propres (art. 66), usage restreint (art. 65), et virement du solde au compte général quand il n'est plus requis (art. 67). Les placements acquis à la demande du client y sont assimilés (art. 68). L'art. 41(6) et l'art. 42(6) exigent la **liste de ces comptes** dans les rapports mensuel et annuel.

**Conséquence de l'absence.** Un cabinet qui détient une somme importante pour un client (vente immobilière, succession, litige commercial) et qui laisse les intérêts partir au Fonds d'études juridiques alors que le client les exigeait **prive le client d'un revenu**. C'est une faute civile en plus d'une faute déontologique.

**Implémentation.** Découle de M-02 : `TrustBankAccount.type = PARTICULIER` avec `clientId`, `openedAt`, `initialDeposit`, `institutionName`, `accountNumber`, `barreauFormDocumentId`, `clientCopyeSentAt`. Registre `TrustParticularLedger` conforme à l'art. 66 (transferts entrants/sortants, revenus de placement, frais, solde après chaque inscription). Alerte quand un compte particulier n'est plus requis (dossier fermé) et que le solde n'a pas été viré.

---

### M-11 — Mode « accès inspecteur » et trousse d'inspection

**Criticité : MAJEUR.**

**Pourquoi.** Art. 29(3) QC : accès aux données **en tout temps** par le syndic, ses enquêteurs, le directeur de l'inspection professionnelle, ses inspecteurs et ses experts. Art. 30 : copies extractibles **immédiatement**. Art. 33 : reconstitution sur demande. Par. 21(2) ON : copie papier produite **promptement** sur demande du Barreau.

**Implémentation.**
- Rôle `INSPECTEUR` en lecture seule, à durée limitée, avec journalisation intégrale de chaque consultation.
- Bouton « Trousse d'inspection » générant en une opération : journal de caisse fidéicommis de la période, journal d'administration, registre complet des cartes-clients, les 12 rapports mensuels, le rapport annuel, le registre des autres biens, le registre des chèques, le registre des espèces, la liste des dossiers actifs et fermés (art. 9), les relevés bancaires, l'index des pièces justificatives.
- Sortie : PDF paginé et signé + archive ZIP avec manifeste et empreintes SHA-256.
- Journalisation de la génération de la trousse (qui, quand, pour quelle période, quel destinataire).

---

### M-12 — Séparation des tâches, signataires autorisés et cautionnement

**Criticité : MAJEUR.**

**Pourquoi.** Art. 11(b) ON : un chèque en fiducie ne peut être signé par un non-titulaire, sauf circonstances exceptionnelles, si la personne a le pouvoir de signature **et est cautionnée pour un montant au moins égal au solde maximal en dépôt durant l'exercice précédent**. Par. 12(2)1 : double contrôle sur les virements.

**Ce qui manque.** Aucune notion de signataire autorisé, aucun cautionnement, aucun double contrôle, et **deux systèmes RBAC parallèles** (`UserRole` à 4 valeurs et `EmployeeRole` avec matrice module/action) qui peuvent diverger.

**Implémentation.**
- Table `TrustSignatory` : `userId`, `trustBankAccountId`, `isLicensee`, `bondAmount`, `bondExpiryDate`, `bondDocumentId`, `authorizedFrom`, `authorizedTo`.
- Calcul automatique du **solde maximal en dépôt de l'exercice précédent** et alerte si le cautionnement est insuffisant.
- Double validation obligatoire au-delà d'un seuil configurable par cabinet, et **toujours** pour les virements électroniques sauf praticien seul.
- Unifier les deux systèmes RBAC ou déclarer formellement l'un dérivé de l'autre, avec test de parité.

---

### M-13 — Objet, payeur et bénéficiaire sur chaque écriture

**Criticité : MAJEUR (bloque M-01).**

Champs à ajouter à `TrustTransaction` : `payerName` (art. 38(1)c, par. 18(1)), `payeeName` (art. 38(2)c, par. 18(2)), `purpose` typé + libre (art. 38(1)f et (2)f, par. 18(1) et (2)), `chequeNumber` (art. 38(2)h), `isCash` normalisé (art. 38(1)g), `receivedAt` distinct de `depositedAt` (art. 50 QC « sans délai », par. 7(1) ON « immediately » — sans les deux dates, le délai de dépôt est invérifiable).
Mêmes ajouts, adaptés, sur `JournalGeneralEntry` pour l'art. 34 et les par. 18(5)(6) ON.

---

### M-14 — Journal des virements entre cartes-clients

**Criticité : MAJEUR.**

Par. 18(4) ON : registre de tous les virements entre comptes du grand livre clients **avec l'objet de chaque virement**. Art. 56(3) QC : transfert direct vers un autre compte en fidéicommis autorisé.

SAFE **bloque** aujourd'hui toute allocation croisée (`validateNoCrossAllocation`). C'est prudent, mais trop large : un transfert légitime (même client, deux dossiers ; regroupement de dossiers ; succession) devient impossible, ce qui pousse à faire un retrait puis un dépôt — deux opérations qui cassent la traçabilité et masquent le lien. Il faut un **flux de transfert explicite**, autorisé, motivé et journalisé, plutôt qu'une interdiction contournable.

---

### M-15 — Rétention appliquée aux registres comptables

**Criticité : MAJEUR.**

QC : art. 31 = 7 ans **à partir de la fermeture du dossier** ; art. 32 = 7 ans **après la fin de l'exercice**. ON : art. 23(1) = 6 ans + exercice courant ; art. 23(2) = **10 ans** + exercice courant pour les par. 18(1)(2)(3)(8)(9)(10)(11) ; art. 23(3) = 10 ans pour l'art. 20.

SAFE applique une rétention aux `Document`, pas aux registres. Il faut : un `fiscalYearEnd` sur `Cabinet`, une politique de rétention par **type de registre** et par province, un blocage de purge, un rapport « ce qui devient purgeable cette année », et une purge à double validation avec journal.

---

### M-16 — Détection et remédiation du solde débiteur (art. 60 QC / art. 14 ON)

**Criticité : MAJEUR.**

Art. 60 : « combler **sans délai** tout solde débiteur en fidéicommis dans un dossier, **quelle qu'en soit la raison** ». Art. 14 ON : solde suffisant **en tout temps**.

Aujourd'hui, le seul filet est le refus de certification. Un solde débiteur peut donc vivre trois semaines sans que personne ne le voie. Il faut : détection **au moment de l'écriture**, alerte immédiate à l'avocat responsable et à l'administrateur, tableau des soldes débiteurs avec ancienneté, flux de renflouement typé (`TRUST_SHORTFALL_REMEDIATION`) avec source des fonds, et signalement dans le rapport mensuel même après correction (l'inspecteur veut voir l'incident et sa résolution, pas sa disparition).

Point de vigilance connexe : `createTrustCorrection` **n'a pas de verrou** et **ne vérifie pas** qu'une correction négative ne rend pas le solde du dossier négatif. C'est le chemin le plus court vers un solde débiteur.

---

### M-17 — Défauts de calcul à corriger

| Défaut | Où | Effet | Correction |
|---|---|---|---|
| Troisième voie non comparée | `reconciliation-service.ts` : `ecart = soldeRapproche − soldeRegistre` | `soldeParDossier` stocké mais jamais vérifié → divergence registre/comptes invisible | Ajouter `ecartParDossier` et bloquer la certification s'il est non nul |
| Pas de verrou sur le dépôt | `createTrustDeposit` | Deux dépôts concurrents → `balanceAfter` et `TrustAccount.currentBalance` faux | Même `pg_advisory_xact_lock` que le retrait |
| Pas de verrou ni de garde sur la correction | `createTrustCorrection` | Correction négative → solde dossier négatif | Verrou + refus si le solde résultant est négatif |
| Solde courant du journal faux si antidatation | `createJournalEntry` : `lastEntry` trié par `dateTransaction desc` | Colonne `solde` incohérente sur les écritures antidatées (le code le documente) | Recalcul du solde courant à la lecture, ou solde par période figée |
| `getTrustBalance` avec `dossierId ?? null` | `trust-balance-service.ts` | Un appel sans `dossierId` ne renvoie **pas** le solde global du client mais le solde des transactions sans dossier | Séparer explicitement les deux cas |
| Agrégat de comptes en 3ᵉ voie | `getTotalTrustAccountBalances` | Somme de `currentBalance`, un champ dénormalisé mis à jour hors verrou au dépôt | Dériver systématiquement du registre append-only |

---

### M-18 — Autres manques, par ordre décroissant

| Réf. | Manque | Source | Crit. |
|---|---|---|---|
| M-18a | Registre des **frais de renvoi** (reçus et payés) | par. 19.1 ON | M |
| M-18b | Registres **hypothèques détenues en fiducie** (grand livre actifs, passifs, comparaison mensuelle) et dossier prêteur | art. 20 et 24 ON | M si immobilier |
| M-18c | **Fonds de clôture immobilière**, Form 9B / 9C | art. 13 ON | M si immobilier |
| M-18d | **Statut de licence** (failli, suspendu, radié) et blocage des mouvements | art. 2, 2.2, 2.3 ON | M |
| M-18e | **Affectation des fonds** (art. 48 QC : « utilisées selon leur affectation ») | art. 48 QC | M |
| M-18f | **Somme indivisible** : dépôt puis retrait sans délai de la part non fiduciaire | art. 53 QC, par. 7(3)2 et 7(4) ON | M |
| M-18g | Interdiction de déposer une **avance déjà facturée** | art. 54 QC, par. 8(2)2 ON | M |
| M-18h | **Formulaire d'ouverture de compte** transmis au Barreau | art. 51 et 64 QC | Y |
| M-18i | **Éligibilité de l'institution** (entente B-1 r.10, succursale québécoise, libellé du compte) | art. 50 QC | M |
| M-18j | **Intérêts** : suivi du versement au Fonds d'études juridiques / Law Foundation of Ontario | art. 50 QC (renvoi B-1 r.10), s. 57 Law Society Act | M |
| M-18k | **Notification au client** quand les fonds viennent d'un tiers | art. 49 QC | M |
| M-18l | **Cessionnaire désigné** en cas de décès ou d'inaptitude ; plan de contingence ontarien | art. 78 QC ; obligation LSO 2025 (`TR-ON-06` du registre interne, à re-sourcer) | M |
| M-18m | **Liste des dossiers fermés des 7 dernières années** exportable | art. 9 QC | Y |
| M-18n | **Système de rappel des délais de prescription** typé | art. 7 QC | M |
| M-18o | Interdiction de détruire un **original du client** sans autorisation | art. 19 QC | Y |
| M-18p | Champs **occupation**, **nature des activités**, **personnes autorisées**, **tiers représenté** | art. 14 QC | M |
| M-18q | **Registre des codes** de dossiers si codification | art. 15 QC | N |
| M-18r | **Rendu imprimable paginé** de chaque registre | art. 30 QC, par. 21(2) ON | M |
| M-18s | **Motifs d'écart** structurés au rapprochement | par. 18(8) ON (« together with the reasons for any differences ») | **C** |
| M-18t | **Fin d'exercice financier** du cabinet (`fiscalYearEnd`) | art. 32 QC, art. 23 ON — toutes les rétentions en dépendent | M |

---

## 6. Risques critiques

| # | Risque | Scénario concret | Conséquence |
|---|---|---|---|
| RC-1 | **Impossibilité de produire le rapport mensuel** | L'inspecteur demande les rapports des 12 derniers mois. SAFE produit un PDF sans liste de cartes-clients, sans chèques en circulation détaillés, sans relevé bancaire. | Manquement art. 40-41 QC / par. 18(8) ON. Reconstitution aux frais de l'avocat (art. 33). |
| RC-2 | **Retrait d'honoraires sur facture non émise** | Un utilisateur crée une facture brouillon et applique le fidéicommis. L'argent sort. La facture n'est jamais envoyée. | Utilisation irrégulière de fonds clients. Faute déontologique lourde. |
| RC-3 | **Espèces : agrégat non contrôlé** (Ontario) | Trois dépôts de 3 000 $ sur le même dossier. Total 9 000 $. Aucune alerte. | Violation art. 4(1) ON. Signalement possible. |
| RC-4 | **Retrait en espèces offert dans l'interface** | Un assistant choisit `ESPECES` au retrait. | Violation directe art. 57 QC. |
| RC-5 | **Pas de reçu ni de déclaration sur les espèces** | Le cabinet reçoit 8 000 $ en espèces sous exception. Aucun reçu signé, aucune déclaration au directeur dans les 30 jours. | Violation art. 70 et 71 QC / par. 19(1) ON. |
| RC-6 | **Virement électronique sans Form 9A** (Ontario) | Tous les virements du cabinet, depuis toujours. | Violation par. 12(2)4, 12(7) et 18(11). Constat immédiat. |
| RC-7 | **Aucune pièce justificative** | L'inspecteur pointe un dépôt de 45 000 $ et demande le bordereau. Rien. | Violation art. 32 QC / par. 18(10) ON. |
| RC-8 | **Un seul compte bancaire implicite** | Le cabinet ouvre un deuxième compte en fidéicommis. Les deux se mélangent dans le rapprochement. | Écart structurellement inexplicable. Violation art. 36 QC. |
| RC-9 | **Troisième voie décorative** | Divergence entre la somme des `TrustAccount.currentBalance` et le registre append-only. La certification passe. | Faux sentiment de conformité, ce qui est pire que l'absence de contrôle. |
| RC-10 | **Vérification d'identité jamais imposée** | Réception de fonds pour un nouveau client sans aucune vérification. | Violation art. 20 et 26 QC. Exposition anti-blanchiment. |

---

## 7. Risques majeurs

RM-1 registre des autres biens absent · RM-2 comptes particuliers absents (privation de revenus du client) · RM-3 aucune séparation des tâches ni cautionnement · RM-4 rétention non appliquée aux registres · RM-5 solde débiteur détecté trop tard · RM-6 aucun mode inspecteur · RM-7 aucun registre de chèques ni contrôle de séquence · RM-8 pas de journal des transferts entre cartes-clients · RM-9 frais de renvoi non tracés (ON) · RM-10 aucun suivi du délai de dépôt (« sans délai » / « immediately ») · RM-11 deux systèmes RBAC divergents · RM-12 registres hypothécaires absents pour une pratique immobilière ontarienne · RM-13 statut de licence non modélisé · RM-14 pas de `fiscalYearEnd`, donc aucune rétention calculable correctement.

---

## 8. Risques moyens

Absence de liste des dossiers fermés sur 7 ans · pas de rappel typé des délais de prescription · pas de contrôle de l'éligibilité de l'institution financière · formulaires d'ouverture de compte non gérés · notification au client sur fonds de tiers absente · conversion FX des espèces absente · pas de contrôle sur la nature des dépôts (art. 52, 54 QC) · absence de flux « somme indivisible » · pas de suivi du versement des intérêts au Fonds / à la LFO · cessionnaire désigné absent · pas de rendu imprimable paginé.

---

## 9. Risques mineurs

Registre des codes de dossiers · registre des vacations (art. 8) · exemptions art. 21 et art. 6 non modélisées comme données · Teranet (art. 15-17 ON) · dispense de re-vérification (art. 27).

---

## 10. Recommandations prioritaires

**Les cinq choses à faire avant toute autre.**

1. **Corriger les trois défauts de code exploitables aujourd'hui** — précondition « facture émise » au retrait, blocage du mode `ESPECES` au retrait, garde sur la correction négative. Une journée de travail, et cela retire les deux fautes les plus lourdes.
2. **Introduire `TrustBankAccount`** — tout le reste en dépend. Sans modèle de compte bancaire, ni le rapport mensuel, ni le rapport annuel, ni les comptes particuliers ne sont possibles.
3. **Enrichir `TrustTransaction`** des champs de l'art. 38 et du par. 18(1)(2) — payeur, bénéficiaire, objet, n° de chèque, indicateur espèces, date de réception distincte de la date de dépôt. Sans ces champs, le rapport mensuel ne peut pas être rempli, quelle que soit la qualité de l'écran qui le produira.
4. **Construire le rapport mensuel de l'art. 41 / par. 18(8)** avec ses quatre listes détaillées, le relevé bancaire attaché et les motifs d'écart structurés. C'est le livrable qui décide de l'inspection.
5. **Fermer la chaîne des espèces** — reçu signé, agrégation par dossier, exceptions modélisées, déclaration J+30 automatisée.

**Deux décisions de produit à prendre maintenant.**

- **Le sur-blocage est une faute autant que le sous-blocage.** Refuser une opération licite pousse au contournement. Chaque garde-fou doit avoir une porte de sortie documentée (exception invoquée + motif + trace), jamais un mur.
- **La conformité doit être un livrable, pas un tableau de bord.** Un cabinet ne se fait pas inspecter sur un écran vert : il se fait inspecter sur des documents. Tout le module conformité doit converger vers « je peux imprimer et signer ceci ».

---

## 11. Roadmap de développement priorisée

### Lot 0 — Correctifs immédiats (3 à 5 jours)

- Précondition facture émise et envoyée au retrait
- Blocage du mode `ESPECES` au retrait
- Verrou + garde de non-négativité sur `createTrustCorrection` et `createTrustDeposit`
- Comparaison réelle de la troisième voie (`ecartParDossier`) et blocage de certification
- Motif typé obligatoire sur tout retrait (les trois de l'art. 56)
- Correction des huit entrées erronées du registre `lib/compliance/rules.ts` (§0.3)
- `Cabinet.fiscalYearEnd`

### Lot 1 — Socle structurel (2 à 3 semaines)

- `TrustBankAccount` + migration rétroactive
- Champs art. 38 / par. 18(1)(2) sur `TrustTransaction`
- `TrustCheque` + contrôle de séquence
- `TrustTransactionDocument` (pièces justificatives) avec obligation par mode
- Détection immédiate du solde débiteur + alerte + flux de renflouement

### Lot 2 — Le livrable d'inspection (3 à 4 semaines)

- `TrustMonthlyReport` avec les 7 blocs de l'art. 41
- `TrustOutstandingCheque`, `TrustDepositInTransit`, `TrustClientLedgerSnapshot`, `TrustDiscrepancyReason`
- Téléversement obligatoire du relevé bancaire
- Registre imprimable des cartes-clients (art. 39) et du journal de caisse (art. 38)
- Rapport annuel de l'art. 42 avec ses 7 blocs et la liste des comptes fermés

### Lot 3 — Espèces et identité (2 semaines)

- `CashReceipt` avec reçu signé à deux signatures et numérotation
- Agrégation par dossier, exceptions art. 69 QC / art. 6 ON modélisées
- Déclaration art. 71 automatisée à J+30
- Remboursement en espèces de l'art. 72
- Conversion FX au taux de midi de la Banque du Canada
- Déclenchement de la vérification d'identité par mouvement de fonds, échéance 60 jours, bénéficiaires effectifs 25 %, attestation de répondant

### Lot 4 — Ontario spécifique (2 à 3 semaines)

- `ElectronicTrustTransferRequisition` + génération Form 9A + double contrôle + contresignature J+1
- `TrustSignatory` avec cautionnement et calcul du solde maximal de l'exercice précédent
- Registre des frais de renvoi (par. 19.1)
- Journal des transferts entre cartes-clients (par. 18(4))
- Motifs d'écart structurés (par. 18(8))

### Lot 5 — Biens, comptes particuliers, inspection (2 à 3 semaines)

- `TrustProperty` (art. 43-46 QC / par. 18(9) ON)
- Comptes particuliers (art. 62-68) avec registre de l'art. 66
- Rôle `INSPECTEUR` en lecture seule journalisée
- Trousse d'inspection en un clic, PDF paginé + ZIP avec manifeste SHA-256
- Rétention par type de registre, par province, avec blocage de purge

### Lot 6 — Pratiques spécialisées et cycle de vie (à cadrer selon les clients réels)

- Hypothèques en fiducie et dossier prêteur (art. 20 et 24 ON)
- Fonds de clôture immobilière, Form 9B/9C (art. 13 ON)
- Statut de licence et blocage (art. 2, 2.2, 2.3 ON)
- Cessation d'exercice, cessionnaire désigné, plan de contingence (art. 74-82 QC ; obligation LSO)
- Délais de prescription typés (art. 7 QC), liste des dossiers fermés 7 ans (art. 9 QC)

**Durée totale estimée : 13 à 18 semaines de développement.** À doubler si l'estimation doit tenir compte des tests, des migrations en production et de la validation des formulaires auprès du Barreau.

---

## 12. Liste exhaustive des fonctionnalités à développer

**Modèle de données** — `TrustBankAccount` · `TrustCheque` · `TrustMonthlyReport` · `TrustOutstandingCheque` · `TrustDepositInTransit` · `TrustClientLedgerSnapshot` · `TrustDiscrepancyReason` · `TrustTransactionDocument` · `TrustProperty` · `TrustParticularLedger` · `TrustSignatory` · `CashReceipt` · `ElectronicTrustTransferRequisition` · `ReferralFee` · `MortgageAssetLedger` · `MortgageLiabilityLedger` · `BeneficialOwner` · `IdentityAttestation` · `TrustInterestRemittance` · `RecordRetentionRule` · `InspectionAccessSession`.

**Champs à ajouter** — `TrustTransaction` : `trustBankAccountId`, `payerName`, `payeeName`, `purposeCode`, `purposeText`, `chequeNumber`, `isCash`, `receivedAt`, `depositedAt`, `fundAllocation`, `thirdPartyFunds`, `clientNotifiedAt`. `JournalGeneralEntry` : `payerName`, `payeeName`, `purposeCode`, `isCash`, `documentIdentifier`. `Cabinet` : `fiscalYearEnd`, `province` explicite, `contingencyPlanDocumentId`, `successorLawyerName`. `Client` : `occupation`, `natureActivites`, `authorizedPersons`, `actsForThirdParty`, `thirdPartyDetails`. `User` : `licenceStatus`, `licenceNumber`, `isBankrupt`, `suspendedFrom`.

**Écrans** — Comptes en fidéicommis (liste et fiche) · Rapport mensuel (composition en 7 sections) · Chèques en circulation · Recettes en circulation · Registre des chèques · Cartes-clients imprimables · Journal de caisse fidéicommis imprimable · Journal d'administration imprimable · Rapport annuel · Reçu d'espèces (saisie et signature) · Déclaration art. 71 · Registre des autres biens · Comptes particuliers · Form 9A · Contresignature de confirmation · Signataires et cautionnements · Identification et vérification client · Bénéficiaires effectifs · Soldes débiteurs · Frais de renvoi · Trousse d'inspection · Rétention et purge · Accès inspecteur.

**Validations automatiques** — 24 règles bloquantes, dont : facture émise avant retrait · motif de retrait obligatoire · pas d'espèces au retrait · pas de chèque au porteur · séquence de chèques sans trou · relevé bancaire attaché avant certification · écart nul ou motivé · aucun solde client négatif · troisième voie concordante · agrégat espèces par dossier · exception espèces documentée · vérification d'identité avant réception de fonds · échéance 60 jours pour les personnes morales · Form 9A signé avant saisie · saisie et autorisation par deux personnes distinctes · cautionnement suffisant · pièce justificative selon le mode · période verrouillée · pas d'antidatation · rétention non expirée avant purge · libellé de compte contenant « en fidéicommis » ou « in trust » · institution éligible · dépôt sans délai après réception · liste des 12 rapprochements certifiés avant rapport annuel.

**Rapports** — Rapport comptable mensuel (art. 41) · Rapport comptable annuel (art. 42) · Comparaison mensuelle 18(8) avec ses deux annexes · Journal de caisse fidéicommis · Journal de caisse d'administration · Registre des cartes-clients · Registre des cartes-clients des comptes particuliers · Registre des autres biens · Registre des chèques · Registre des espèces · Registre des frais de renvoi · Grand livre hypothécaire actifs et passifs · Liste des dossiers actifs · Liste des dossiers fermés 7 ans · Soldes débiteurs et leur résolution · Intérêts versés au Fonds / LFO · Pièces justificatives manquantes · Piste d'audit filtrée · Trousse d'inspection complète.

---

## 13. Score de conformité — Barreau du Québec : 48 / 100

Méthode : 61 obligations québécoises identifiées au §2.1, pondérées par criticité (critique = 4, majeur = 3, moyen = 2, mineur = 1), et notées 1,0 si couvertes, 0,5 si partielles, 0 si manquantes.

| Bloc | Poids | Obtenu |
|---|---|---|
| Tenue des dossiers (art. 7-19) | 15 | 8,5 |
| Vérification d'identité (art. 20-27) | 18 | 3,0 |
| Comptabilité générale (art. 28-34) | 20 | 6,5 |
| Comptabilité fidéicommis (art. 35-42) | 27 | 9,5 |
| Autres biens (art. 43-46) | 9 | 0 |
| Réception et retrait (art. 47-61) | 42 | 16,0 |
| Comptes particuliers (art. 62-68) | 19 | 0 |
| Espèces (art. 69-73) | 16 | 2,0 |
| Cessation (art. 74-82) | 7 | 1,0 |
| **Total** | **173** | **82,5** |

82,5 / 173 = **47,7 %**, arrondi à **48 / 100**.

## 14. Score de conformité — Law Society of Ontario : 42 / 100

44 obligations identifiées au §2.2, même méthode.

| Bloc | Poids | Obtenu |
|---|---|---|
| Failli / suspendu (art. 2, 2.2, 2.3) | 3 | 0 |
| Espèces (art. 4-6) | 11 | 2,0 |
| Compte en fiducie, dépôts (art. 7-8) | 17 | 4,0 |
| Retraits (art. 9-12) | 23 | 5,0 |
| Solde suffisant, Teranet (art. 13-17) | 10 | 1,5 |
| Registres art. 18 | 40 | 15,0 |
| Espèces, frais de renvoi, hypothèques (art. 19-20) | 13 | 0 |
| Forme, actualité, conservation (art. 21-23) | 15 | 8,5 |
| Prêteur (art. 24) | 3 | 0 |
| **Total** | **135** | **56,0** |

56,0 / 135 = **41,5 %**, arrondi à **42 / 100**.

Note : l'écart avec le Québec vient de trois exigences ontariennes lourdes et totalement absentes — Form 9A, double contrôle électronique et cautionnement des signataires non titulaires — auxquelles s'ajoutent les registres spécialisés (frais de renvoi, hypothèques).

## 15. Score global : 45 / 100

Moyenne pondérée à parts égales, les deux provinces étant des marchés cibles déclarés.

**Lecture honnête de ce chiffre.** 45 n'est pas « à moitié conforme ». C'est « le moteur est bon, les livrables n'existent pas ». Un logiciel à 45 avec un moteur solide se corrige en un trimestre ; un logiciel à 70 avec un moteur faux ne se corrige pas. SAFE est dans le premier cas.

---

## 16. Évaluation de la préparation à une inspection réelle

### 16.1 Verdict : NON PRÊT

Un inspecteur du Barreau ou un auditeur LSO produit un constat de non-conformité dès la première heure, sur le seul rapport mensuel.

### 16.2 Ce que je demanderais, en tant qu'inspecteur, et ce que SAFE peut produire

| # | Document demandé | Source | SAFE peut-il ? | Détail |
|---|---|---|---|---|
| 1 | Liste des comptes en fidéicommis, généraux et particuliers, avec institution, n° et date d'ouverture | art. 41(6), 42(6) QC | ❌ **Absent** | Aucun modèle de compte bancaire |
| 2 | Formulaires d'ouverture transmis au Barreau | art. 51, 64 QC | ❌ Absent | |
| 3 | Journal de caisse fidéicommis des 12 derniers mois | art. 38 QC, par. 18(1)(2) ON | 🟡 **Incomplet** | Écritures présentes ; payeur, bénéficiaire, objet, n° de chèque absents |
| 4 | Registre des cartes-clients | art. 39 QC, par. 18(3) ON | 🟡 Incomplet | Dérivable, jamais matérialisé, champs manquants, pas de date de dernière inscription |
| 5 | Les 12 rapports comptables mensuels | art. 40-41 QC, par. 18(8) ON | ❌ **Absent** | **Constat immédiat** |
| 6 | Relevés bancaires du fidéicommis | art. 41(7) QC, par. 18(10) ON | ❌ Absent | Aucun téléversement |
| 7 | Rapport comptable annuel | art. 42 QC | ❌ Absent | Coquille présente, contenu absent |
| 8 | Liste des chèques en circulation avec numéros | art. 41(2) QC | ❌ Absent | Un seul nombre agrégé |
| 9 | Copies des chèques compensés, bordereaux de dépôt | art. 32 QC, par. 18(10) ON | ❌ Absent | |
| 10 | Confirmations de virements électroniques | art. 32 QC, par. 18(11) ON | ❌ Absent | |
| 11 | Réquisitions Form 9A signées | par. 12(7), 18(11) ON | ❌ Absent | **Constat immédiat en Ontario** |
| 12 | Carnet de reçus d'espèces en double, signés | art. 70 QC, par. 19(1) ON | ❌ Absent | |
| 13 | Déclarations des espèces ≥ 7 500 $ | art. 71 QC | ❌ Absent | |
| 14 | Registre des autres biens en fidéicommis | art. 43 QC, par. 18(9) ON | ❌ Absent | |
| 15 | Journal de caisse d'administration | art. 34 QC, par. 18(5)(6) ON | 🟡 Incomplet | Payeur, bénéficiaire, objet, indicateur espèces absents |
| 16 | Livre des honoraires / copies de factures | art. 18(7) ON | ✅ **Oui** | Numérotation séquentielle sans trou |
| 17 | Preuve que chaque retrait d'honoraires suit une facture envoyée | art. 56 QC, par. 9(1)3 ON | ❌ **Non — et le contraire est possible** | |
| 18 | Liste des dossiers actifs et fermés sur 7 ans | art. 9 QC | 🟡 Données présentes, rapport absent | |
| 19 | Dossiers de vérification d'identité | art. 20-27 QC | 🟡 Coquille présente, contenu et déclenchement absents | |
| 20 | Registre des frais de renvoi | par. 19.1 ON | ❌ Absent | |
| 21 | Grand livre hypothécaire | art. 20 ON | ❌ Absent | |
| 22 | Preuve de la remise des intérêts au Fonds / LFO | art. 50 QC, s. 57 Law Society Act | 🟡 Champ `interetsLFO` saisi, aucun suivi de versement | |
| 23 | Piste d'audit des accès et modifications | art. 29 QC | ✅ **Oui** | `AuditLog` complet, bon point |
| 24 | Copies papier immédiates de tout registre | art. 30 QC, par. 21(2) ON | 🟡 CSV oui, rendu registre paginé non | |
| 25 | Preuve de conservation aux durées réglementaires | art. 31-32 QC, art. 23 ON | 🟡 Documents oui, registres comptables non | |

**Bilan : 2 « oui » sur 25.** 10 partiels, 13 absents.

### 16.3 Comment se déroulerait l'inspection

- **Minute 10** : demande des rapports mensuels. Absents. Le reste de l'inspection change de nature — l'inspecteur passe d'une vérification à une reconstitution.
- **Minute 30** : demande des relevés bancaires et des bordereaux. Absents du système ; le cabinet les cherche dans ses courriels.
- **Heure 1** : échantillon de trois retraits d'honoraires. Si l'un d'eux correspond à une facture brouillon, le dossier bascule vers le syndic.
- **Heure 2** : en Ontario, demande d'un Form 9A. Absent.

---

## 17. Plan d'action « Inspection Ready » (100 %)

### Phase 1 — Arrêter l'hémorragie (semaine 1)

**Objectif : plus aucune opération irrégulière possible.**

- [ ] Retrait d'honoraires conditionné à une facture émise **et** envoyée, montant plafonné au solde dû
- [ ] Motif typé obligatoire sur tout retrait (art. 56 QC / par. 9(1) ON)
- [ ] Mode `ESPECES` retiré du formulaire de retrait, remplacé par le flux art. 72 explicite
- [ ] Verrou consultatif et garde de non-négativité sur dépôt et correction
- [ ] Troisième voie réellement comparée, certification bloquée sur `ecartParDossier ≠ 0`
- [ ] `Cabinet.fiscalYearEnd`
- [ ] Registre `lib/compliance/rules.ts` corrigé selon §0.3, avec les articles exacts

**Sortie de phase** : aucun chemin de code ne permet une opération que le règlement interdit.

### Phase 2 — Rendre le rapport mensuel possible (semaines 2 à 5)

- [ ] `TrustBankAccount` et migration
- [ ] Champs art. 38 / par. 18(1)(2) sur `TrustTransaction`
- [ ] `TrustCheque` avec contrôle de séquence
- [ ] Pièces justificatives attachables, obligatoires par mode

**Sortie de phase** : toutes les données de l'art. 41 existent en base.

### Phase 3 — Produire le livrable (semaines 6 à 9)

- [ ] Rapport mensuel en 7 blocs, avec les quatre listes détaillées
- [ ] Relevé bancaire obligatoire
- [ ] Motifs d'écart structurés
- [ ] Registres imprimables : journal de caisse, cartes-clients
- [ ] Rapport annuel de l'art. 42

**Sortie de phase** : le cabinet peut imprimer et signer ce que l'inspecteur demande. **C'est le point où SAFE devient vendable comme logiciel conforme.**

### Phase 4 — Fermer les chaînes ouvertes (semaines 10 à 13)

- [ ] Espèces de bout en bout : reçu, agrégat, exceptions, déclaration J+30, remboursement, FX
- [ ] Identité : déclenchement par mouvement de fonds, échéances, bénéficiaires effectifs, répondant
- [ ] Solde débiteur : détection immédiate, alerte, renflouement tracé

### Phase 5 — Ontario complet (semaines 14 à 16)

- [ ] Form 9A, double contrôle, contresignature J+1
- [ ] Signataires et cautionnements
- [ ] Frais de renvoi, transferts entre cartes-clients

### Phase 6 — Inspection et cycle de vie (semaines 17 à 19)

- [ ] Autres biens, comptes particuliers
- [ ] Rôle inspecteur, trousse d'inspection, rétention différenciée
- [ ] Cessation d'exercice, cessionnaire désigné

### Phase 7 — Validation externe (à lancer en parallèle dès la semaine 1)

**C'est la phase qu'on oublie et qui détermine tout.**

- [ ] Obtenir du Barreau les **formulaires prescrits** des art. 41, 42, 51 et 64 (Comité exécutif). Sans eux, la conformité de forme reste hypothétique.
- [ ] Obtenir la **liste des institutions ayant une entente au sens de B-1 r. 10** (art. 50).
- [ ] Faire relire le rapport mensuel généré par SAFE par un **inspecteur retraité ou un CPA spécialisé en comptabilité juridique**, avant tout client.
- [ ] Ontario : valider le Form 9A généré auprès du service Spot Audit du LSO.
- [ ] Lire et intégrer le **Code de déontologie (QC)** et les **Rules of Professional Conduct (ON)** sur les conflits, les honoraires et les intérêts, aujourd'hui hors corpus.
- [ ] Trancher les questions ouvertes de `docs/compliance/QUESTIONS_BARREAU.md` avec les réponses obtenues ici (§0.2 et §0.3).

---

## 18. Audit de l'architecture fonctionnelle

### 18.1 Risques structurels

| # | Risque | Analyse |
|---|---|---|
| A-1 | **Le compte bancaire n'existe pas comme entité** | Toute la comptabilité fidéicommis repose sur une abstraction client/dossier. Le règlement, lui, raisonne par compte bancaire. Cet écart de modèle rend plusieurs obligations structurellement inatteignables. **C'est la dette de conception la plus lourde du système.** |
| A-2 | **Deux sources de vérité pour le solde** | `TrustTransaction` (append-only, correct) et `TrustAccount.currentBalance` / `Dossier.soldeFiducieDossier` (dénormalisés, mis à jour hors verrou au dépôt). Le rapprochement utilise les deux et ne les compare jamais. Toute dénormalisation non vérifiée finit par diverger. |
| A-3 | **Deux systèmes de permissions parallèles** | `UserRole` (4 valeurs) et `EmployeeRole` (matrice module/action). Rien ne garantit leur cohérence. Un durcissement appliqué à l'un peut être contourné par l'autre. |
| A-4 | **Le registre de conformité est inerte** | `COMPLIANCE_RULES_ENABLED` est éteint par défaut. Un moteur de règles qui ne pilote rien est un document, pas un contrôle. Et il contient huit entrées erronées (§0.3) que personne n'a détectées parce qu'il ne sert à rien. |
| A-5 | **Solde courant du journal faux en cas d'antidatation** | Documenté dans le code mais non corrigé. La colonne `solde` de `JournalGeneralEntry` est une donnée dérivée persistée : elle sera un jour affichée à un inspecteur. |
| A-6 | **Aucun horodatage de confiance** | Les certifications sont horodatées par l'application. Rien n'empêche techniquement un opérateur de base de données de réécrire l'histoire. Pour un registre légal, une chaîne d'empreintes (hash chaîné par cabinet) serait proportionnée. |

### 18.2 Failles de conception

- **La certification atteste plus que ce qui est vérifié.** Le texte signé dit « les registres et rapprochements de la période sont exacts et conformes au règlement ». Ce que le système vérifie réellement : un écart bancaire nul et aucun compte négatif. Il ne vérifie ni les pièces justificatives, ni la concordance des cartes-clients, ni les chèques en circulation, ni les délais de dépôt. **Faire signer une attestation plus large que le contrôle réel expose l'avocat, et donc SAFE.** L'attestation doit être réduite à ce qui est effectivement vérifié, ou le contrôle élargi à ce qui est attesté.
- **`getOrCreateTrustAccount` crée un compte implicitement au premier dépôt.** L'ouverture d'un compte en fidéicommis est un acte réglementé (art. 50-51). La créer par effet de bord d'un dépôt est le contraire du contrôle attendu.
- **L'interdiction absolue des transferts entre clients** est plus stricte que le règlement (art. 56(3) QC et par. 9(1)4 ON les permettent) et sans porte de sortie, donc contournable par un retrait suivi d'un dépôt — ce qui produit exactement la perte de traçabilité qu'on voulait éviter.
- **Le rapprochement écrase la certification** : `createReconciliation` fait un `upsert` qui remet `certifiedAt: null` et `certifiedById: null`. Une re-saisie efface donc une certification signée. Il faudrait refuser toute modification d'une période certifiée, pas la décertifier silencieusement.

### 18.3 Flux dangereux

1. Facture brouillon → application du fidéicommis → argent sorti (RC-2)
2. Correction négative → solde dossier négatif → invisible jusqu'à la fin du mois
3. Dépôts espèces fractionnés → aucune agrégation → seuil franchi sans alerte
4. Retrait en espèces via le formulaire → opération interdite enregistrée comme licite
5. Re-création d'un rapprochement certifié → certification effacée sans trace explicite
6. Dépôt concurrent sans verrou → `balanceAfter` faux → registre incohérent avec lui-même

### 18.4 Automatisations à interdire formellement

Un logiciel de comptabilité juridique doit refuser d'automatiser certaines choses. À inscrire comme doctrine :

- **Jamais** de retrait automatique du fidéicommis vers le compte d'administration, même sur facture émise. L'acte de retrait est un acte de l'avocat (art. 58 QC).
- **Jamais** de certification automatique d'un rapprochement, même à écart nul.
- **Jamais** de correction automatique d'un écart par écriture d'ajustement.
- **Jamais** de purge automatique d'un registre en fin de rétention sans double validation humaine.
- **Jamais** de génération automatique d'un Form 9A sans signature préalable d'un titulaire.
- **Jamais** d'application automatique d'un solde fidéicommis à une facture au moment de son émission.

### 18.5 Fonctionnalités qui devraient être obligatoires, non optionnelles

Sélection du compte bancaire à chaque écriture · motif de retrait · pièce justificative selon le mode · relevé bancaire mensuel · lecture attestée de la liste des cartes-clients avant certification · vérification d'identité avant premier mouvement de fonds · reçu pour toute somme en espèces · double contrôle sur les virements (hors praticien seul).

### 18.6 Erreurs humaines à neutraliser par le produit

| Erreur | Fréquence en cabinet | Protection à bâtir |
|---|---|---|
| Retirer avant d'envoyer la facture | Très fréquente | Blocage dur |
| Saisir un dépôt sur le mauvais dossier | Fréquente | Confirmation avec nom du client et solde résultant affichés |
| Oublier un chèque en circulation au rapprochement | Fréquente | Registre de chèques alimenté à l'émission, pas ressaisi |
| « Forcer » l'écart à zéro | Fréquente et grave | Écart toujours calculé, jamais saisissable |
| Antidater une écriture pour « corriger » un mois | Fréquente | Verrou de période (déjà en place) |
| Recopier le rapprochement du mois précédent | Occasionnelle | Comparaison automatique et signalement des valeurs identiques |
| Accepter des espèces au-delà du seuil | Occasionnelle, très grave | Agrégat par dossier + exception documentée |
| Laisser un solde débiteur dormir | Fréquente | Alerte immédiate à l'écriture |

---

## 19. Benchmark concurrentiel

### 19.1 Avertissement de fiabilité

Je n'ai pas testé ces produits dans cette session et je ne dispose pas de leur documentation à jour. Ce qui suit repose sur une connaissance générale du marché et doit être traité comme **une hypothèse de travail à vérifier**, pas comme un fait établi. J'indique explicitement le niveau de confiance. Aucune fonctionnalité concurrente ne devrait être citée dans un document commercial SAFE sur la seule base de ce tableau.

### 19.2 Positionnement comparé

| Produit | Ancrage canadien | Confiance |
|---|---|---|
| **Cosmolex** | Comptabilité intégrée nativement (pas de couche externe), positionnement explicite sur la conformité fidéicommis canadienne, rapprochement à trois voies. Souvent cité comme la référence sur ce point précis. | Moyenne |
| **Soluno** | Produit d'origine canadienne, orienté comptabilité juridique, historiquement proche des exigences des barreaux provinciaux. | Moyenne-basse |
| **LEAP** | Forte présence canadienne, comptabilité fidéicommis intégrée, bibliothèque de formulaires par juridiction. | Moyenne-basse |
| **Clio** | Leader du marché, origine canadienne. Clio Manage gère le fidéicommis et les rapprochements ; la profondeur comptable dépend de l'usage de Clio Accounting ou d'une intégration QuickBooks. | Moyenne |
| **Actionstep** | Plateforme configurable, comptabilité fidéicommis présente, personnalisation par juridiction. | Basse |
| **Smokeball** | Orientation forte États-Unis et Australie ; couverture canadienne à vérifier. | Basse |

### 19.3 Où SAFE est déjà devant

Trois éléments que je n'ai vus documentés nulle part comme standard du marché :

1. **Le verrou transactionnel Postgres sur le retrait.** La plupart des systèmes valident le solde hors transaction. SAFE élimine la classe entière des soldes négatifs par concurrence.
2. **Le blocage de certification sur compte client négatif individuel.** Beaucoup d'outils vérifient l'agrégat. SAFE vérifie chaque compte, ce qui est la bonne granularité réglementaire.
3. **La provincialisation du délai de 25 jours.** Un produit qui affiche « conforme dans 25 jours » à un cabinet québécois invente une règle. SAFE ne le fait pas, délibérément et de façon testée. C'est un raffinement rare.

### 19.4 Où SAFE est derrière

Le rapport mensuel réglementaire · les formulaires officiels (9A, 9B, 9C, formulaires prescrits QC) · le modèle de compte bancaire · le registre de chèques · les pièces justificatives attachées · les registres spécialisés (biens, frais de renvoi, hypothèques) · la trousse d'inspection.

### 19.5 Idées à reprendre

- **Le formulaire comme produit.** Un logiciel de conformité se juge sur les documents qu'il imprime. Investir l'effort de design dans le PDF du rapport mensuel, pas seulement dans l'écran.
- **L'assistant de rapprochement guidé** qui refuse d'avancer tant qu'une étape n'est pas complète, au lieu d'un formulaire libre à valider.
- **La comptabilité non séparable.** L'avantage de Cosmolex est qu'on ne peut pas « faire la compta ailleurs ». SAFE a déjà ce trait avec son journal append-only ; l'assumer comme argument.
- **La bibliothèque de formulaires par juridiction** comme actif produit, mise à jour centralement, plutôt que comme fonctionnalité annexe.

### 19.6 Le vrai différenciateur possible

Aucun de ces produits, à ma connaissance, ne fait de la conformité un **objet vivant sourcé et versionné** : une règle qui porte son article, sa juridiction, son niveau de confiance et sa date de vérification, et qui refuse de s'afficher si elle n'est pas sourcée. SAFE a déjà cette architecture dans `lib/compliance/rules.ts` — elle est simplement éteinte et partiellement fausse. **Allumée, corrigée et branchée sur les écrans, c'est une position que personne n'occupe.**

---

## 20. Ce que je retiendrais si je ne devais retenir qu'une chose

SAFE a construit le moteur avant les livrables. C'est le bon ordre — l'inverse produit des logiciels qui impriment de jolis rapports faux. Mais un moteur sans livrable ne passe pas une inspection, et un cabinet ne perçoit pas la qualité d'un verrou consultatif Postgres. Les treize à dix-huit semaines qui séparent SAFE de l'« Inspection Ready » sont donc à la fois du travail de conformité et du travail de vente.

**Le rapport mensuel de l'art. 41 est le pivot.** Il rend la conformité visible, il rend l'inspection survivable, et il est la démonstration commerciale la plus courte : un PDF que l'avocate imprime, signe et classe.

---

*Rapport produit le 2026-07-30. Sources primaires : RLRQ c. B-1, r. 5 (à jour au 1er avril 2026, texte officiel LegisQuébec) ; LSO By-Law 9 (version du 27 avril 2017, PDF officiel) ; LSO Summary of By-Law 9 Record Keeping Requirements. Incertitudes déclarées au §0.2.*
