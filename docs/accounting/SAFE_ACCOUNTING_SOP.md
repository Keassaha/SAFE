# SAFE — SOP comptable (procédure d'utilisation)

Date : 2026-06-15
Pour : avocats et personnel administratif de cabinets clients.
Cadre : conforme à [SAFE_ACCOUNTING_DOCTRINE.md](SAFE_ACCOUNTING_DOCTRINE.md). En cas de doute, la doctrine prime.

---

## 1. Objectif de la SOP

Décrire **comment un cabinet utilise SAFE au quotidien** pour tenir une comptabilité juridique opérationnelle : facturer, encaisser, suivre les débours et les dépenses, gérer le fidéicommis, faire le rapprochement mensuel, corriger sans casser la piste d'audit, et exporter au comptable. L'objectif n'est pas l'exhaustivité comptable : c'est la clarté, la conformité Barreau et un export propre.

---

## 2. Profil visé

- **Avocat solo** sans personnel.
- **Petit cabinet** (2 à 5 avocats).
- **Cabinet avec personnel administratif** (adjointe / adjoint).
- **Cabinet avec fidéicommis actif** (dépôts/retraits réguliers).
- **Cabinet sans fidéicommis actif** (peu ou pas de fonds clients détenus).

SAFE s'adapte au profil (voir §5). Le but : ne montrer que ce qui est pertinent, et activer les contrôles utiles à ce cabinet précis.

---

## 3. Configuration initiale lors de la création d'un cabinet

À la création, SAFE détermine le **profil comptable** via le questionnaire (§4) et en dérive :

- les modules visibles (ex. fidéicommis masqué si absent) ;
- le mode de taxe (TPS/TVQ pour QC, TVH pour ON, etc.) ;
- la langue par défaut et les libellés réglementaires (Barreau QC vs LSO) ;
- la fréquence des rappels (rapprochement mensuel, remise de taxes) ;
- le niveau de complexité de l'interface (simplifié / standard / avancé).

---

## 4. Questionnaire d'onboarding comptable

À poser (ou déterminer) à la création du cabinet :

1. **Province principale d'exercice** (QC, ON, autre).
2. **Taille du cabinet** : solo · 2 à 5 avocats · 6+ avocats.
3. **Compte fidéicommis** : présent ? oui / non.
4. **Fidéicommis actif** : utilisé régulièrement ? oui / non.
5. **Méthode de facturation** : horaire · forfaitaire · mixte · contingence.
6. **Inscription TPS/TVQ** (ou TVH) : oui / non.
7. **Fréquence de déclaration des taxes** : mensuelle · trimestrielle · annuelle.
8. **Comptable externe** : oui / non.
9. **Logiciel comptable utilisé** : QuickBooks · Xero · Sage · autre · aucun.
10. **Besoin d'export mensuel** : oui / non.
11. **Besoin de rapprochement mensuel** : oui / non (oui par défaut si fidéicommis actif).
12. **Niveau de complexité souhaité** : simplifié · standard · avancé.

---

## 5. Paramètres selon profil du cabinet

SAFE dérive un **profil comptable** des réponses ci-dessus.

### Profil A — Solo sans fidéicommis actif
Modules actifs : factures, encaissements, comptes à recevoir, dépenses, taxes, export comptable.
Fidéicommis : **masqué** (activable en option). Pas de rapprochement mensuel imposé.

### Profil B — Solo avec fidéicommis
Tout le profil A, plus : journal fidéicommis, cartes-clients par dossier, rapprochement mensuel, transfert fidéicommis → admin lié à une facture. Rappel de rapprochement (By-Law 9 / B-1 r.5).

### Profil C — Petit cabinet avec adjoint administratif
Tout le profil B, plus : rôles et permissions (saisie par l'adjoint, validation par l'avocat), piste d'audit renforcée, rapports mensuels, exports périodiques.

### Profil D — Cabinet plus structuré
Tout le profil C, plus : catégories comptables avancées, exports détaillés, multi-utilisateurs, contrôles internes, rapprochements obligatoires.

---

## 6. Procédure de facturation

1. Composer la facture à partir du temps facturable, des forfaits et des débours refacturables du dossier.
2. Vérifier le client/dossier et le mode de taxe (dérivé du cabinet, pas du défaut).
3. Statut `DRAFT` → `READY_TO_ISSUE` (validation avocat) → `ISSUED` (émission).
4. À l'émission : la facture devient une **créance** (Facturé +, Comptes à recevoir +), HT au journal, taxe en axe distinct. Aucun encaissement créé.
5. Numérotation séquentielle sans trou. Jamais de numéro de Barreau/LSO sur la facture.

---

## 7. Procédure d'encaissement

1. Enregistrer le **paiement réel** reçu (montant, date, mode). Le paiement existe indépendamment des factures.
2. **Allouer** le paiement à une ou plusieurs factures (allocation explicite). Σ allocations ≤ montant du paiement.
3. L'allocation réduit les **comptes à recevoir** ; elle ne crée pas de nouvelle écriture (déjà reflétée par le paiement).
4. Paiement partiel : la facture passe `PARTIALLY_PAID`, solde restant suivi.
5. Erreur d'allocation (mauvaise facture) : **dé-allouer / ré-allouer**, jamais supprimer le paiement.
6. Remboursement : écriture inverse documentée.

---

## 8. Procédure de gestion des débours

1. Saisir le débours sur le **dossier** (pas comme dépense cabinet). Indiquer s'il est payé par le cabinet (`payeParCabinet`) et s'il est refacturable.
2. Si payé par le cabinet : sortie de trésorerie immédiate, journalisée (`DEBOURS`). Statut **non facturé**.
3. Refacturation : ajouter le débours comme ligne de facture → statut **facturé**.
4. Encaissement de la facture couvrant le débours → statut **recouvré**.
5. Débours non recouvrable : **radiation** par écriture inverse → statut **radié** (jamais de suppression).
6. Règle : un débours est avancé **pour un client**. S'il ne sera jamais refacturé, c'est une dépense, pas un débours.

---

## 9. Procédure de gestion des dépenses

1. Saisir la dépense du cabinet (loyer, abonnements, fournitures) avec catégorie, fournisseur, montant, TPS/TVQ payées, mode de paiement.
2. Valider la dépense → journalisée (`DEPENSE`, sortie de trésorerie). Le CTI/RTI (taxe récupérable) est suivi pour le résumé de taxes.
3. Une dépense n'est **jamais** refacturée à un client. En cas de doute débours/dépense : « va-t-on le refacturer ? » non = dépense.

---

## 10. Procédure de gestion du fidéicommis

1. **Dépôt** : sur un dossier (client + dossier obligatoires), montant > 0. Espèces refusées à partir de 7 500 $ (règle Barreau). Journalisé `DEPOT_FIDEICOMMIS`.
2. **Carte-client par dossier** : solde courant mis à jour après chaque mouvement.
3. **Retrait** : seulement si le solde du dossier le permet (jamais négatif). Journalisé `RETRAIT_FIDEICOMMIS`.
4. **Transfert vers admin** : un retrait lié à une **facture du même client**. Interdit sans facture, interdit vers la facture d'un autre client (commingling).
5. Le fidéicommis n'apparaît **jamais** dans un total cabinet : carte « Fidéicommis détenu » séparée.
6. Correction : écriture de correction (jamais modifier la transaction d'origine).

---

## 11. Procédure de rapprochement mensuel (fidéicommis)

1. Chaque mois (échéance By-Law 9 : 25 jours après la fin du mois), saisir le **solde du relevé bancaire**, les **chèques en circulation** et les **dépôts en transit**.
2. SAFE calcule le **solde rapproché** (banque − chèques + dépôts) et le compare au **solde du registre** et au **solde par dossier**.
3. **Écart** affiché. La certification est **bloquée si l'écart ≠ 0**.
4. La certification vérifie aussi que **chaque carte-client est ≥ 0** (un solde négatif masqué par l'agrégat bloque la certification).
5. L'avocat **certifie** le rapprochement (signature horodatée). La période est alors **verrouillée** : plus aucune écriture ne peut être antidatée dans ce mois (les corrections s'écrivent dans la période ouverte courante).

---

## 12. Procédure de correction

Principe : **on ne supprime jamais, on inverse.**

- Annulation d'une facture avant émission : `CANCELLED`. Après émission : note de crédit (`CREDITED`).
- Remboursement : écriture inverse documentée.
- Correction d'allocation de paiement : dé-allouer / ré-allouer.
- Radiation de débours : écriture inverse, statut `RADIE`.
- Correction fidéicommis : écriture `CORRECTION` (module FIDEICOMMIS, ajuste le fidéicommis, jamais le cash cabinet).
- Toute correction laisse une trace dans la piste d'audit.

---

## 13. Procédure d'export au comptable

1. Choisir la **période** (mois / trimestre / exercice).
2. Exporter le journal (CSV / Excel) **ou** l'export comptable mappable par période (double-entrée, formats QuickBooks / Xero / Sage / générique).
3. Joindre, selon le besoin : factures, paiements, débours, dépenses, résumé de taxes, mouvements fidéicommis, piste d'audit.
4. *(Cible)* L'export d'une période certifiée est **horodaté et verrouillé** (snapshot reproductible).

---

## 14. Contrôles mensuels obligatoires

- [ ] Rapprochement fidéicommis du mois certifié (écart = 0, chaque carte-client ≥ 0).
- [ ] Comptes à recevoir revus, relances envoyées sur les retards (30/60/90 j).
- [ ] Dépenses du mois saisies et validées.
- [ ] Débours payés par le cabinet : suivis (facturés / recouvrés).
- [ ] Résumé de taxes du mois cohérent (collectée vs payée, CTI/RTI).
- [ ] Export du mois transmis au comptable (si profil le requiert).

---

## 15. Ce que SAFE ne remplace pas

SAFE **ne remplace pas** votre comptable externe ni votre logiciel comptable final. SAFE ne produit pas de bilan, pas d'états financiers certifiés, pas de déclaration de taxes finale, pas d'impôt. SAFE tient la comptabilité **opérationnelle et juridique** du cabinet et **exporte** proprement vers qui produit les documents officiels. En cas de question d'états financiers, d'amortissement, de paie complexe ou de fiscalité finale : « SAFE prépare et exporte, votre comptable produit le document final. »
