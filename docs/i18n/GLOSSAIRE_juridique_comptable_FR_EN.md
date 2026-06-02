# Glossaire de localisation SAFE — FR ↔ EN (juridique + comptable)

> **Référence unique** pour toute traduction dans SAFE. Objectif : un anglais
> juridique/comptable **canadien correct** (pas du mot-à-mot), et une cohérence
> stricte d'un écran à l'autre. Toute nouvelle clé de `messages/*.json` doit
> respecter ce glossaire.
>
> Contexte : cabinets Québec (Barreau du Québec, *fidéicommis*) **et** Ontario
> (Law Society of Ontario, *trust account*). Statut : v1, 2026-06-01.

---

## 1. Règles générales
- **Ton** : professionnel, sobre, direct. Pas d'argot, pas de familiarité.
- **Casse EN** : *Sentence case* pour les libellés d'interface (« Create invoice »),
  pas de Title Case partout. Respecter les noms propres (HST, IRCC, LSO).
- **« Vous »** en FR (jamais « tu ») — cohérent avec la voix de marque.
- Ne jamais traduire les **noms d'institutions** : Barreau du Québec, Law Society of
  Ontario, IRCC, Revenu Québec, ARC/CRA.
- Montants/dates : formatés via `Intl` selon la locale (`fr-CA` / `en-CA`), pas en dur.

---

## 2. Juridique — général

| FR | EN | Notes |
|---|---|---|
| Cabinet | Firm | « law firm » si ambigu |
| Avocat·e | Lawyer | (pas « attorney » — usage canadien) |
| Adjoint·e juridique | Legal assistant | rôle `assistante` |
| Client | Client | |
| Dossier | Matter | terme canadien standard (pas « case file ») |
| Numéro de dossier | Matter number | |
| Mandat | Mandate / Engagement | « engagement » pour la lettre de mission |
| Mandat de représentation | Representation mandate | |
| Lettre d'engagement | Engagement letter | |
| Conflit d'intérêts | Conflict of interest | |
| Vérification de conflits | Conflict check | |
| Vérification d'identité | Identity verification | |
| Cartable (dossier physique/structuré) | Matter file | « briefcase » évité |
| Échéance | Deadline | |
| Audience | Hearing | |
| Dépôt (procédure) | Filing | |
| Pièce / document | Document / exhibit | « exhibit » = pièce au sens preuve |
| Confidentiel | Confidential | |
| Conformité | Compliance | |
| Inspection professionnelle | Professional inspection | Barreau / LSO |

---

## 3. Comptabilité & fidéicommis

| FR | EN | Notes |
|---|---|---|
| Comptabilité | Accounting | |
| Fidéicommis / compte en fiducie | Trust account | **terme clé** ; QC=fidéicommis, ON=trust |
| Compte en fidéicommis général | General trust account | |
| Compte particulier (fidéicommis) | Specific (separate) trust account | |
| Compte d'administration / général | General (operating) account | |
| Rapprochement (bancaire) | Reconciliation | « bank reconciliation » |
| Journal de caisse (recettes-déboursés) | Cash receipts & disbursements journal | |
| Carte-client (fidéicommis) | Client trust ledger | |
| Grand livre | General ledger | |
| Écriture (comptable) | Journal entry | |
| Débit / Crédit | Debit / Credit | |
| Solde | Balance | |
| Dépôt | Deposit | |
| Retrait / décaissement | Withdrawal / disbursement | |
| Pièce justificative | Supporting document / voucher | |
| Rapport annuel comptable | Annual accounting report | obligation Barreau |
| Déclaration T3 | T3 return | comptes particuliers en fidéicommis |

---

## 4. Facturation & honoraires

| FR | EN | Notes |
|---|---|---|
| Facturation | Billing | module |
| Facture | Invoice | |
| Brouillon | Draft | statut facture |
| Émise | Issued | |
| Échue | Overdue | facture en retard |
| Payée | Paid | |
| Honoraires | Fees / Legal fees | |
| Débours | Disbursements | **pas** « expenses » |
| Frais (administratifs) | Charges / Admin fees | |
| Dépense | Expense | journal des dépenses |
| Note de crédit | Credit note | |
| Note de débit | Debit note | |
| Sous-total | Subtotal | |
| Taxe / TPS / TVQ / TVH | Tax / GST / QST / HST | ne pas traduire les acronymes |
| Montant requis du client | Amount required from client | (facture Derisier) |
| Mode de facturation | Billing mode | |
| Au forfait | Flat fee | « flat-fee billing » |
| Au taux horaire | Hourly | « hourly rate » |
| Taux horaire | Hourly rate | |
| Suivi du temps | Time tracking | |
| Entrée de temps | Time entry | |
| Temps facturable | Billable time | |
| Taux d'utilisation | Utilization rate | |
| Relance | Reminder / Follow-up | relance de facture = payment reminder |
| Solde dû | Balance due | |
| Recouvrement | Collection / recovery | |
| Paiement | Payment | |
| Virement bancaire | Bank transfer / wire | |
| Chèque | Cheque | (orthographe canadienne) |

---

## 5. Couche assistante / préparation (états & manquants)

| FR | EN | Notes |
|---|---|---|
| Prêt pour revue | Ready for review | |
| En préparation | In preparation | |
| En attente du client | Awaiting client | |
| Incomplet | Incomplete | |
| Bloqué | Blocked | |
| Prêt à facturer | Ready to bill | |
| Manquant | Missing item | |
| Prochaine action | Next action | |
| File d'attente | Work queue | |
| Tâche | Task | |
| Tâche en retard | Overdue task | |
| À revoir (renvoi avocate) | Send back / Needs revision | navette retour |
| Fil d'exécution | Activity feed | |
| Où j'en étais ? | Where I left off | bloc reprise (T1) |
| Rien n'est oublié | All caught up / Nothing slips | badge état de repos |

---

## 6. UI commune (verbes & actions)

| FR | EN |
|---|---|
| Enregistrer | Save |
| Annuler | Cancel |
| Ajouter | Add |
| Modifier | Edit |
| Supprimer | Delete |
| Créer | Create |
| Voir / Consulter | View |
| Rechercher | Search |
| Filtrer | Filter |
| Exporter | Export |
| Télécharger | Download |
| Téléverser | Upload |
| Envoyer | Send |
| Confirmer | Confirm |
| Retour | Back |
| Suivant / Précédent | Next / Previous |
| Aucun résultat | No results |
| Chargement… | Loading… |
| Obligatoire | Required |
| Facultatif | Optional |

---

## 7. À NE PAS faire
- ❌ « case » pour dossier → ✅ **matter**.
- ❌ « expenses » pour débours → ✅ **disbursements**.
- ❌ « escrow » pour fidéicommis → ✅ **trust account**.
- ❌ « bill » et « invoice » mélangés → choisir **invoice** (document) ; *to bill* = facturer.
- ❌ Traduire HST/GST/QST/IRCC/LSO.
- ❌ Title Case systématique sur les boutons → Sentence case.

---

## 8. Maintenance
À chaque nouveau module localisé : vérifier les termes ici **avant** d'écrire les clés EN.
Tout nouveau terme métier récurrent s'ajoute à ce glossaire (PR liée).
