# 2026-07-30 — Extension du cahier des charges : compta, facturation, couche cognitive

## Demande

Le CEO complète le cahier des charges du CRM avec les sections 26 à 73 : comptabilité
interne de SAFE Inc., facturation complète sous toutes ses formes, et une couche
d'accessibilité cognitive destinée à réduire la charge liée à la gestion administrative.

## Livré

[docs/product/CAHIER_DES_CHARGES_CRM_EXTENSION_COMPTA_TDAH.md](../product/CAHIER_DES_CHARGES_CRM_EXTENSION_COMPTA_TDAH.md),
2050 lignes, sections 26 à 73. Lien croisé ajouté dans le document parent.

## La découverte qui a changé le document

**Le moteur comptable et de facturation existe déjà, et il est considérable.** Inventaire
vérifié dans le code, pas supposé :

- Facturation : `Invoice`, `InvoiceLine`, `InvoiceItem`, `InvoiceReminder`, `InvoiceSendLog`,
  `BillingRun`, plus 15 pages sous `app/(app)/facturation/`
- Paiements : `Payment`, `PaymentAllocation`, `CreditNote`, `InterestCharge`, `PayerRule`,
  services de trop-payé, d'affectation et de rapprochement
- Temps : `TimeEntry` avec `invoiceLineId @unique`, donc double facturation impossible **par
  la base**
- Dépenses : `CabinetExpense` avec anti-doublon par empreinte de reçu, catégorisation
  apprise, extraction par vision
- Banque : import, normalisation, suggestion, statuts de validation
- Journal, verrouillage de période, export QuickBooks / Xero / Sage avec plan comptable
  surchargeable
- Profil comptable A/B/C/D avec activation conditionnelle

Sur les 49 tables demandées : **29 existent déjà, 14 sont à créer, 6 sont refusées.**

## Trois arbitrages structurants

**1. Pas de second moteur comptable dans le CRM.** L'ADR-006 a déjà tranché : SAFE Inc. est
un cabinet client de SAFE. Construire un module comptable parallèle dans la console
doublerait la maintenance, détruirait le dog food, et reviendrait à vendre un produit qu'on
n'utilise pas soi-même. L'extension spécifie donc les **écarts réels** entre ce que le
produit sait faire pour un cabinet et ce dont SAFE Inc. a besoin comme entreprise de
logiciel. Ces écarts sont courts.

**2. Conflit doctrinal identifié et tranché (à valider).** La doctrine v2 dit journal
mono-axe append-only, double-entrée à l'export seulement. Or la commande demande un bilan,
une balance de vérification et un grand livre, qui exigent la partie double en interne.
Trois options présentées. Recommandation : garder le mono-axe, le bilan est produit une fois
par an par le comptable depuis l'export existant. Construire une comptabilité en partie
double pour éviter un export annuel est un mauvais échange, et ce serait aussi imposé aux
cabinets clients.

**3. Deux composants de la couche cognitive remontés en phase 1.** La commande les plaçait
en phase 3. La vue Aujourd'hui étendue et la capture rapide ne dépendent de rien et rendent
du temps dès la première semaine. Les repousser de six mois pour construire d'abord la
plomberie est une perte sèche. Le reste de la couche reste en phase 3, à juste titre.

## Conception notable

**`BillingArrangement`** est la clé de la facturation hybride : un mandat porte N
arrangements (fixe, échelonné, jalon, récurrent, horaire, quota), le moteur les interroge
tous et assemble une facture unique. C'est le seul choix qui évite trois systèmes
parallèles pour l'exemple « 2 000 $ + 300 $/mois + 125 $/h ».

**`CatalogItem`** définit ce que SAFE Inc. vend, une seule fois, et alimente proposition,
devis, contrat, mandat, échéancier, tâches et facture. Ses `tachesTypes` rendent la
décomposition de tâches **déterministe et gratuite** pour tout ce qui est au catalogue,
l'IA ne servant qu'au reste.

**`Mandat` comme notion produit générique**, pas seulement pour SAFE Inc. `Dossier` reste le
contentieux, `Mandat` devient l'unité facturable. Les cabinets clients en profitent aussi,
ils facturent beaucoup de travail hors dossier judiciaire.

**Pas de duplication du minuteur.** `WorkSession` existe : une session de concentration sur
un mandat client **est** du temps facturable. Table `focus_sessions` refusée.

## Cadrage de la couche cognitive

Présentée comme une couche d'accessibilité et de soutien aux fonctions exécutives, jamais
comme un dispositif médical, un diagnostic ou un traitement. Aucun vocabulaire clinique
dans l'interface. Entièrement désactivable, chaque composant réglable séparément, réglages
par défaut du côté sobre.

Interdits explicites (section 63.2) : séries à ne pas rompre, badges, confettis, scores de
productivité personnelle, comparaisons, et tout mécanisme conçu pour faire revenir dans
l'outil plutôt que pour être utile.

## En attente de décision CEO

1. **Option A, B ou C** de la section 0.3 (mono-axe contre partie double). Conditionne la
   section 40 et deux mois de roadmap.
2. Validation des deux cahiers des charges avant tout build.
3. Confirmation que le module comptable reste dans le produit (dog food) et non dans la
   console.
4. `⚠️ À VÉRIFIER` avec le comptable : méthode caisse ou exercice applicable, situation
   d'inscription TPS/TVQ, traitement d'un abonnement logiciel vendu en Ontario.

## Ce qui reste non vérifié du travail des séances précédentes

L'assistant de prospection (`lib/ai/proposer-actions-crm.ts`) compile et `tsc` passe, mais
l'appel réel au modèle n'a jamais été testé de bout en bout. Interruption de la séance du
2026-07-28.
