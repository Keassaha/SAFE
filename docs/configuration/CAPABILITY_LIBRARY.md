# SAFE Capability Library

Date de mise a jour: 2026-05-07

## Intention

SAFE doit agir comme une bibliotheque de blocs metier, pas seulement comme un
catalogue de bundles fixes.

Le bundle reste utile: il donne une base coherente pour un profil de cabinet.
La capability library rend la configuration composable: elle ajoute les blocs
pertinents selon l'audit, les risques, les obligations et les priorites de la
cliente.

## Pipeline cible

1. Reponses d'audit brutes
2. Profils derives: cabinet, pratique, facturation, conformite, operations,
   migration
3. Bundle recommande
4. Capacites selectionnees
5. Paquet de configuration: interface, seeds, checklist d'activation,
   integrations, backlog custom

## Blocs actifs

- `matter-opening-control`: ouverture de dossier, mandat, conflits, etat de
  preparation.
- `trust-3way-reconciliation`: fideicommis, segregation par client/dossier,
  rapprochement mensuel et certification.
- `loi25-privacy-controls`: responsable PRP, politiques de conservation,
  registre d'incidents et controles Loi 25.
- `billing-ar-followup`: facturation, paiements, comptes a recevoir et relances.
- `admin-automation-dashboard`: tableau de bord operationnel, alertes et file
  de travail.
- `executive-firm-command-center`: centre de commandement qui donne a un cabinet
  solo la visibilite d'un cabinet structure: risques, priorites, production,
  finances et dossiers a revoir.
- `legal-calendar-event-planner`: agenda intelligent qui organise rendez-vous,
  audiences, echeances, relances, taches et planification hebdomadaire.
- `document-retention-library`: bibliotheque documentaire, retention et
  fermeture de dossier.

## Regle produit

Quand SAFE promet une activation sur mesure, on ne doit pas seulement citer le
bundle. On doit montrer:

- le bundle de depart;
- les capacites ajoutees;
- la raison de chaque capacite;
- les priorites d'activation;
- les donnees ou integrations requises.

Pour Me Ruth, par exemple, le moteur doit assembler au minimum:

- fideicommis et conciliation 3-way;
- controles Loi 25;
- ouverture de dossier et conflits;
- facturation et recouvrement;
- tableau de bord operations;
- centre de commandement cabinet;
- planificateur juridique;
- retention documentaire.
