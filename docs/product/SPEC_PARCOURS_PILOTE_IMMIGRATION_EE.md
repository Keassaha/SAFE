# SAFE — Spec de parcours pilote : Entrée express (immigration)

> ⚠️ **REMPLACÉE le 2026-08-18** par
> [SPEC_COLLECTE_PIECES_CLIENT.md](SPEC_COLLECTE_PIECES_CLIENT.md).
>
> Motif : cette spec n'instanciait qu'un seul domaine, l'immigration. Le cabinet pilote
> retenu (Me Cayard, Québec) fait immigration **et** droit de la famille. Le modèle
> spécifié ici n'aurait pas porté le divorce : il lui manquait le rattachement d'une
> pièce à une partie, la distinction entre partie adverse et tiers, et le lien vers la
> pièce produite au cartable.
>
> Le contenu reste valable comme **instance immigration**, repris au §9 de la nouvelle
> spec.

> Prochaine action physique du [blueprint](BLUEPRINT_RENFORCEMENT_SAFE_INSPIRE_NEOLEGAL.md) §33.
> Plan d'ensemble : [PLAN_CONSTRUCTION_MODULE_NEOLEGAL.md](PLAN_CONSTRUCTION_MODULE_NEOLEGAL.md)
> Rédigée le 2026-08-18. **Statut : DRAFT, en attente de validation par le cabinet pilote.**

---

## 0. Pourquoi ce parcours, et pas celui que le blueprint recommandait

Le blueprint §28 recommande le bundle `qc-solo-family-flat-fee`, au motif que « le bundle
existe ». Je m'en écarte, sur trois constats vérifiés dans le code le 2026-08-18.

**Le cabinet pilote n'est pas au Québec et ne fait pas de droit de la famille.**
`lib/seeds/onboard-derisier.ts` déclare `disciplines: ["immobilier", "immigration"]`, et
ses factures sont en TVH, donc en Ontario. Écrire une spec de droit familial québécois
pour une avocate ontarienne en immobilier et immigration produirait un document que
personne ne peut valider.

**SAFE a déjà investi profondément l'immigration.** Ce n'est pas une intuition, c'est
dans le schéma : `Dossier.itaDate` avec `submissionDeadline` calculée à ITA + 60 jours,
`ImmigrationDocument` avec expiration et alertes à 30 et 7 jours, `ImmigrationBackground`
pour la déclaration d'antécédents, et des checklists par type de dossier déjà semées
(`lib/seeds/checklists-immigration.ts`). Cinq documents générables existent déjà, dont
l'IMM 5476 et le mandat d'immigration.

**L'Entrée express est le meilleur terrain possible pour la capacité E.** Une demande
d'Entrée express a une liste de pièces **finie, connue d'avance, dont chaque élément
porte sa propre date d'expiration**, et un **délai dur de 60 jours** après l'ITA. C'est
exactement la forme que la collecte de pièces doit servir, et c'est un registre
d'ancrage (les délais) au sens de la doctrine.

> **À confirmer par le cabinet pilote** : que l'Entrée express est bien un mandat qu'elle
> traite de façon répétable, et non un cas isolé.

---

## 1. Le mandat couvert

**Portée** : préparation et dépôt d'une demande de résidence permanente à la suite d'une
invitation à présenter une demande (ITA) reçue via Entrée express.

**Début** : le client a reçu son ITA. Le compte à rebours de 60 jours a commencé.

**Fin** : demande déposée auprès d'IRCC dans le délai, accusé de réception obtenu.

**Hors portée de ce parcours** : l'évaluation CRS préalable, le profil Entrée express, la
biométrie, le PFL, le COPR et l'atterrissage. Ils figurent dans la checklist existante et
suivront. On spécifie **le segment sous contrainte de délai**, celui où une pièce
manquante coûte le dossier.

---

## 2. Les acteurs

| Acteur | Ce qu'il fait dans ce parcours | Ce qu'il ne voit jamais |
| --- | --- | --- |
| **Client** | fournit ses renseignements et ses pièces, confirme, signe | notes internes, stratégie, rentabilité, autres dossiers |
| **Adjointe** | prépare, relance, contrôle la lisibilité, classe | rien de restreint dans ce parcours |
| **Avocate** | accepte le mandat, approuve les documents, dépose | — |
| **SAFE** | rappelle, propose un classement, signale les manques | ne décide jamais, ne dépose jamais seul |

Le blueprint §23 exige que la matrice finale utilise les rôles réels de SAFE. Ce parcours
n'invente aucun rôle : il utilise ceux qui existent, plus le client, qui est nouveau.

---

## 3. Les écrans

### Côté client, par lien sécurisé

Le patron du lien tokenisé existe déjà deux fois en production (`/facture/[token]`,
`/rejoindre/[token]`). On le réutilise, on n'en invente pas un troisième.

**É1. Ce qu'on attend de vous**
Une seule page. En tête, le compte à rebours réel : « Votre demande doit être déposée
avant le 17 octobre 2026. Il reste 43 jours. » Puis la liste des pièces, chacune avec sa
raison en une phrase, son état, et un bouton de dépôt.

Jamais « documents requis ». Toujours « Certificat de police du Maroc, couvrant janvier
2019 à août 2022, toutes les pages ».

**É2. Dépôt d'une pièce**
Choix du fichier, aperçu immédiat, et le résultat des contrôles en clair : lisible ou
non, nombre de pages, date détectée. Si SAFE doute, il le dit et demande confirmation.

**É3. Ce qui a été reçu**
La même liste, qui se vide. Le client voit ce qui est accepté, ce qui est à remplacer et
pourquoi, en langage non technique.

### Côté cabinet

**É4. Tableau du dossier**
Le compte à rebours, la progression réelle, les pièces qui expirent avant le dépôt, la
prochaine action. Une seule action mise en avant (§0 M2 de la base design).

**É5. File de contrôle**
Les pièces reçues à vérifier, une par une, avec le classement proposé et son niveau de
confiance. Accepter, demander un remplacement avec motif, ou écarter.

**É6. Écran de dépôt**
La checklist finale avant transmission à IRCC. Elle ne se coche pas seule.

---

## 4. Les données

### Ce qui existe déjà et ne doit pas être recréé

| Donnée | Où elle vit |
| --- | --- |
| Date ITA, échéance de dépôt | `Dossier.itaDate`, `Dossier.submissionDeadline` |
| Pièces à expiration | `ImmigrationDocument` (type, `issuedAt`, `expiresAt`, alertes 30 et 7 jours) |
| Antécédents déclarés | `ImmigrationBackground` (refus, dépassement de séjour, casier, renvoi, fausse déclaration) |
| Étapes du mandat | `lib/seeds/checklists-immigration.ts`, `immigration_ee` |
| Frais IRCC | modèles de débours déjà semés |
| Documents générables | IMM 5476, mandat d'immigration, déclaration d'antécédents, lettre d'engagement, FINTRAC |

### Ce qu'il faut ajouter

**`ExpectedDocument`**, la pièce attendue. C'est la seule entité nouvelle de ce parcours.

| Champ | Rôle |
| --- | --- |
| `dossierId` | rattachement, isolation par cabinet vérifiable |
| `libelle` | « Certificat de police du Maroc » |
| `raison` | pourquoi elle est demandée, en une phrase montrable au client |
| `periodeCouverte` | « janvier 2019 à août 2022 », null si sans objet |
| `fournisseur` | qui doit la produire : client, cabinet, tiers |
| `obligatoire` | obligatoire, conditionnelle, facultative |
| `echeance` | date limite propre à la pièce, souvent avant celle du dossier |
| `etat` | voir §5 |
| `documentId` | le fichier reçu, quand il y en a un |
| `immigrationDocumentId` | lien vers l'objet à expiration, quand la pièce en est un |
| `motifRemplacement` | pourquoi elle a été refusée, montrable au client |

> **Décision assumée** : `ExpectedDocument` est une entité neuve et **ne réutilise pas
> `DossierPiece`**. `DossierPiece` est le cartable P-/D-, la liste des pièces produites au
> tribunal. Les confondre tordrait un modèle pour un usage qu'il n'a pas.

---

## 5. Les pièces attendues et leurs états

### La liste, pour un dossier Entrée express

Dérivée de la checklist déjà semée et du modèle `ImmigrationDocument`.

| Pièce | Obligatoire | Expire | Piège connu |
| --- | --- | --- | --- |
| Passeport, toutes les pages utilisées | oui | oui | validité insuffisante au dépôt |
| Résultats de test linguistique | oui | oui | validité de 2 ans |
| Évaluation des diplômes (ECA) | oui | oui | validité de 5 ans |
| Certificats de police | oui | non | **trous dans la résidence** |
| Examen médical | oui | oui, 12 mois | fait trop tôt |
| Preuves d'emploi | oui | non | ne correspond pas au NOC/TEER déclaré |
| Preuve de fonds | conditionnelle | oui | non requise si offre d'emploi valide |
| Acte de naissance, état civil | conditionnelle | non | selon composition familiale |
| Photos | oui | non | format IRCC |

Chaque ligne porte sa raison en clair. La colonne « piège connu » n'est pas décorative :
c'est ce que SAFE doit **signaler**, pas décider.

### Les huit états

```text
À demander
  -> Demandée
  -> Reçue
  -> À vérifier
  -> Acceptée
  -> À remplacer   (retour vers Demandée)
  -> Écartée
  -> Déposée
```

Un état ne saute jamais. « Acceptée » est une décision **humaine**, jamais un contrôle
automatique.

---

## 6. Les décisions humaines, et elles seules

| Décision | Qui |
| --- | --- |
| Accepter le mandat | avocate |
| Confirmer qu'une pièce est la bonne, complète et lisible | adjointe ou avocate |
| Demander un remplacement, avec motif | adjointe ou avocate |
| Écarter une pièce | avocate |
| Approuver un document généré | avocate |
| **Déposer auprès d'IRCC** | avocate, jamais automatisé |
| Fermer le dossier | avocate |

Le blueprint §16 interdit d'automatiser sans confirmation : accepter un mandat,
transmettre une procédure, signer, déplacer des fonds, supprimer une pièce, fermer un
dossier. Ce parcours les respecte toutes.

---

## 7. Les automatisations autorisées

- calculer et afficher l'échéance de dépôt depuis `itaDate` ;
- **signaler une pièce qui expire avant la date de dépôt prévue** ;
- signaler un trou de résidence dans les certificats de police ;
- relancer le client selon une politique de rappel, avec un plafond ;
- proposer un classement et un titre, avec niveau de confiance ;
- lire la date d'émission et d'expiration d'une pièce, à confirmer ;
- préremplir l'IMM 5476 et le mandat depuis les données validées ;
- créer les tâches de la checklist existante ;
- prévenir l'équipe à 30 et 7 jours de l'échéance, mécanisme déjà en place.

**Interdit** : conclure qu'une pièce est conforme aux exigences d'IRCC, calculer seul un
délai autre que ITA + 60 jours qui est arithmétique et documenté, déposer.

---

## 8. Les exceptions, écrites d'avance

Le blueprint §16 exige que chaque workflow prévoie ses chemins d'exception. Sans eux, la
première anomalie renvoie le cabinet au courriel.

| Exception | Comportement |
| --- | --- |
| Le client ne répond pas | relances espacées, plafonnées, puis alerte à l'équipe. SAFE n'écrit jamais « dernier avis » seul |
| Pièce illisible | état « À remplacer » avec motif en clair, l'original est conservé |
| Pièce qui expire avant le dépôt | alerte immédiate, la pièce reste acceptée mais signalée |
| Trou dans les certificats de police | signalé à l'équipe, jamais résolu seul |
| Examen médical fait trop tôt | signalé, avec la date de péremption calculée |
| ITA expirée sans dépôt | le dossier passe en exception dure, aucun dépôt possible |
| Antécédent déclaré tardivement | retour en révision avocate, la déclaration est versionnée |
| Client qui retire le mandat | clôture par la capacité N, pièces restituées |
| Changement de composition familiale | la liste des pièces conditionnelles est recalculée, l'ancienne conservée |

---

## 9. Ce que SAFE ne dira jamais dans ce parcours

- que le dossier sera accepté, ou ses chances ;
- qu'une pièce est conforme aux exigences d'IRCC ;
- qu'un délai autre que ITA + 60 jours s'applique, sans règle validée et versionnée ;
- qu'un document est authentique parce qu'il a été téléversé ;
- qu'une relation avocat-client existe avant acceptation par l'avocate.

---

## 10. Critères d'acceptation

Le parcours n'est pas terminé si un seul de ces points manque.

**Fonctionnels**

1. Une liste de pièces se crée depuis le type de dossier, sans saisie manuelle.
2. Le client reçoit un lien, dépose sans créer de compte, et voit sa liste se vider.
3. Chaque pièce porte sa raison en clair, jamais un intitulé générique.
4. Une pièce qui expire avant la date de dépôt est signalée aux deux côtés.
5. Le cabinet accepte ou renvoie une pièce avec motif, et le client voit le motif.
6. L'original est conservé intact, la version OCR ne le remplace jamais.
7. Le compte à rebours est juste, et calculé sur le jour calendaire du cabinet.

**Transversaux, repris du §26 du blueprint**

8. Isolation par cabinet vérifiée par test.
9. Français et anglais, le cabinet servant les deux.
10. État vide et chemin de récupération sur chaque écran.
11. Journal d'audit sur : demande, dépôt, acceptation, refus, remplacement, dépôt final.
12. Aucune suggestion IA présentée comme une décision humaine.
13. Test du parcours critique de bout en bout.
14. Export du dossier possible à tout moment.

---

## 11. Les questions du §29, tranchées par hypothèse

Chacune est une **hypothèse de travail**, pas une décision. La colonne de droite dit ce
qui doit être confirmé avant que le code ne s'y appuie.

| # | Question | Hypothèse retenue | À confirmer |
| --- | --- | --- | --- |
| 1 | Quel cabinet pilote | Derisier, seul cabinet actif | **oui, par l'appel** |
| 2 | Quel mandat répétable | Entrée express après ITA | **oui** |
| 3 | Portail : route SAFE, sous-domaine ou domaine cabinet | route SAFE avec lien tokenisé, comme la facture | non, patron éprouvé |
| 4 | Fournisseur de signature | **aucun dans ce parcours** : rien à signer avant le dépôt | reporté |
| 5 | Format des modèles | ceux qui existent déjà, PDF | non |
| 6 | Source canonique d'un document | `Document`, `ExpectedDocument` ne fait que pointer | non |
| 7 | Objets à envelopper plutôt que migrer | `ImmigrationDocument` est enveloppé, jamais remplacé | non |
| 8 | Paiement avant conflict check | **non**, le retainer précède l'ITA de toute façon | oui, si un cas contraire existe |
| 9 | Données traitées par l'IA | lecture de dates sur pièce, classement proposé. Aucun antécédent envoyé à un tiers | **oui, décision de politique** |
| 10 | Règles de cahier par juridiction | sans objet, pas de cahier ici | — |
| 11 | Qui approuve et produit | voir §6 | oui |
| 12 | Niveau d'export garanti | export du dossier complet, originaux inclus | oui |

---

## 12. Ce que cette spec ne fait pas

Elle ne décrit **pas** le portail complet, le catalogue d'offres, la qualification, la
génération documentaire avancée, la signature ni les cahiers de pièces. Le blueprint les
prévoit, le plan de construction les ordonne, et ce parcours n'en a besoin d'aucun.

Elle ne contient **aucune estimation de durée**. Un chiffre posé ici deviendrait une
promesse.

---

## 13. Prochaine action

Lire cette spec à Me Derisier, section par section, et noter ses corrections sur les
douze hypothèses du §11 et sur la liste de pièces du §5.

Les deux réponses qui décident de tout :

1. L'Entrée express après ITA est-elle un mandat qu'elle traite de façon répétable ?
2. La liste de pièces du §5 correspond-elle à ce qu'elle demande réellement à ses clients ?

Si la réponse à la première est non, cette spec est à refaire sur un autre mandat, et
c'est beaucoup moins cher que de découvrir l'erreur après trois semaines de code.
