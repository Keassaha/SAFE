# Audit de cohérence des chiffres comptables

> **Date** : 12 août 2026
> **Question posée** : la refonte visuelle a-t-elle altéré la logique comptable,
> et les chiffres apparaissent-ils au bon endroit dans tout le logiciel ?
> **Réponse courte** : la logique comptable n'a pas été touchée. Trois défauts
> ont été trouvés, dont deux dans le jeu de données de simulation et un,
> préexistant et déjà documenté, dans le code.

---

## 1. La refonte n'a pas touché la comptabilité

Relevé des fichiers modifiés pendant tout le chantier visuel, filtré sur les
répertoires de logique comptable.

| Fichier | Nature du changement |
|---|---|
| `lib/services/client-send/send-to-client.ts` | une couleur littérale pour un PDF |
| `app/api/facturation/*` (5 routes) | permissions élargies en **lecture** |
| `prisma/seeds/demo-cabinet.mjs` | nom du cabinet de démonstration |

**Aucun calcul, aucun filtre métier, aucune règle de taxe n'a été modifié.**

Les changements de permissions ne viennent pas de la refonte : ils ont été
faits par une session parallèle. Ils ont été vérifiés méthode par méthode.

### Ce que valent ces changements de permissions

| Route | GET | POST |
|---|---|---|
| `facturation/paiements` | `canViewBilling` | `canManageInvoices` |
| `facturation/credit-notes` | `canViewBilling` | pas de POST |
| `facturation/surpaiements` | `canViewBilling` | `canManageInvoices` |
| `facturation/paiements/[id]/preuve` | `canViewBilling` | — |
| `documents/payment-receipt/[id]` | `canViewBilling` | — |

L'écriture reste sous `canManageInvoices` partout. La lecture s'aligne sur le
droit de voir la table où la donnée est déjà affichée, ce qui évite une icône
qui renvoie 403. **Changement sain.**

### Balayage complet des gardes d'autorisation

Toutes les routes de `facturation`, `fideicommis`, `journal` et
`comptabilite` ont été inspectées.

- **Une seule route sans session** : `facturation/factures/public/[token]`.
  C'est voulu et documenté : lien de partage client, gardé par un jeton
  non devinable, 404 sur jeton inconnu, 410 sur jeton expiré.
- **Une route authentifiée sans contrôle de rôle** :
  `facturation/billing-stages` en POST. Elle exige une session et borne au
  `cabinetId` de cette session. Risque faible, mais c'est la seule écriture
  comptable qui ne nomme pas de permission. À trancher.
- Les écritures sensibles du fidéicommis (dépôt, retrait, correction) sont
  toutes gardées par `canEditBillingTrust`.

---

## 2. Le défaut de code, préexistant et documenté

### Deux sources de vérité pour « quelles factures comptent »

| Surface | Filtre employé |
|---|---|
| Rapports (`lib/rapports/load.ts`) | `invoiceStatus` — **canonique** |
| Facturation | `paymentStatus` — **canonique** |
| **Tableau de bord** | `statut` — **hérité** |

`docs/accounting/INVOICE_STATUS_NORMALIZATION.md`, daté du 29 avril, désigne
`invoiceStatus` comme source de vérité du cycle de vie et `paymentStatus`
comme source de vérité du règlement. Il énonce aussi le fait décisif :

> Aucun code ne met `statut: "payee"`, `"partiellement_payee"` ou `"en_retard"`.

Autrement dit, en usage réel, le filtre du tableau de bord
`statut: { in: ["envoyee", "partiellement_payee", "en_retard"] }` **ne peut
capturer que les `envoyee`**. Les factures partiellement payées et en retard
sont invisibles à ce KPI.

Le document liste ce cas parmi les « filtres fautifs ». La migration prévue
n'a donc pas été menée à son terme sur le tableau de bord.

**Ce n'est pas une régression de la refonte.** C'est une dette antérieure,
identifiée par l'équipe elle-même, et qui reste ouverte.

### Pourquoi les chiffres concordent quand même aujourd'hui

Parce que le jeu de simulation écrit les deux champs de façon cohérente. Sur
des données produites par l'application, ils divergeraient.

---

## 3. Les deux défauts du jeu de simulation, corrigés

Trouvés par cet audit, tous deux dans `scripts/simuler-activite.mjs`.

### `OVERDUE` était stocké

La doctrine l'interdit explicitement : le retard se **dérive** de la date
d'échéance, il ne se stocke pas, sinon il devient faux dès le lendemain.

Le générateur écrivait `invoiceStatus: "OVERDUE"`. Conséquence mesurée : la
requête dérivée de retard (`ISSUED` + non payée + échéance passée) trouvait
**zéro** facture, donc le service de relance n'avait rien à relancer.

Corrigé : une facture en retard est `ISSUED` avec une échéance passée.
**11 factures** sont désormais relançables.

### `paymentStatus` n'était pas rempli

Les 31 factures restaient à `UNPAID`, dont quatorze intégralement payées. Or
c'est ce champ que lisent les écrans de facturation.

Corrigé : 14 `PAID`, 9 `PARTIAL`, 8 `UNPAID`.

**Zéro facture** dont le règlement contredit les montants.

---

## 4. Réconciliation finale

Chaque surface interrogée avec **sa propre formule**, sur les mêmes données.

### Montant impayé

| Surface | Formule | Résultat |
|---|---|---:|
| Rapports | `invoiceStatus ∈ {ISSUED, PARTIALLY_PAID, OVERDUE}` | 38 060 $ |
| Tableau de bord | `statut ∈ {envoyee, partiellement_payee, en_retard}` | 38 060 $ |
| Facturation | `paymentStatus ≠ PAID` | 38 060 $ |

**Les trois concordent.**

### Fidéicommis

| Source | Résultat |
|---|---:|
| Somme des `TrustTransaction` (source de vérité) | 89 275 $ |
| Cache `client.trustAccountBalance` | 89 275 $ |

**Les deux concordent au dollar près.** C'est le contrôle qui compte le plus :
un cache qui ment sur un compte en fiducie est un manquement à B-1 r.5, pas un
défaut d'affichage.

### Autres mesures

| Mesure | Valeur |
|---|---:|
| Revenus facturés hors taxes | 75 769 $ |
| Paiements reçus | 49 055 $ |
| Factures non annulées | 87 115 $ |
| Travail forfait non facturé | 0 $ |
| Heures facturables non facturées | 118 881 $ |
| Arithmétique de facture fausse | **0 / 31** |

Sous-total + TPS + TVQ = total, et total − encaissé = solde, à deux décimales
près, sur les trente et une factures.

---

## 5. Ce qui reste ouvert

| Sujet | Gravité | Action proposée |
|---|---|---|
| Le tableau de bord filtre sur `statut` hérité | **Moyenne** | Terminer la migration prévue par la doctrine : passer aux *where builders* de `lib/billing/invoice-status.ts` |
| `billing-stages` POST sans contrôle de rôle | Faible | Décider quel rôle peut modifier une étape de facturation |
| `app/(app)/parametres`, `app/(app)/facturation` lisent aussi `statut: "en_retard"` | **Moyenne** | Même migration, mêmes builders |

Ces trois points sont antérieurs à la refonte visuelle. Aucun n'a été introduit
par elle.
