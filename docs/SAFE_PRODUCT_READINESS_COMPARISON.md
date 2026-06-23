# SAFE Product Readiness - Comparaison Codex / Claude Code

Date: 2026-06-21  
Base de comparaison:

- Rapport Codex: `docs/SAFE_PRODUCT_READINESS_AUDIT.md`
- Rapport Claude Code: audit fourni par l'utilisateur le 2026-06-21
- Branche: `release/2026-06-11-compta-admin-derisier`
- Dernier commit analyse: `16f6893 fix(compta): durcit ecritures et corrige flux facturation`

## 1. Conclusion fusionnee

Les deux audits convergent fortement: SAFE n'est plus un prototype, mais il n'est pas encore un SaaS public autonome. Le produit est proche d'une vente pilote accompagnee si les parcours critiques sont stabilises.

Verdict fusionne:

| Niveau | Decision |
| --- | --- |
| Demo interne | Pret avec encadrement |
| Vente pilote founder | Possible apres correction des P0 fusionnes |
| Vente publique autonome | Pas encore |
| Produit enterprise/compliance large | Trop tot |

La difference principale entre les deux audits:

- Codex insiste davantage sur la coherence produit, la comptabilite operationnelle et la transformation de `/comptabilite` en hub d'action.
- Claude Code insiste davantage sur les bloqueurs de premier usage et de confiance immediate: onboarding qui ne persiste pas, ecrans vides, fermeture dossier, rate-limit public, console interne, impersonation.

Decision: la roadmap doit combiner les deux. Le push officiel ne doit pas seulement corriger la compta; il doit rendre SAFE demonstrable par un cabinet neuf, avec un parcours facture fiable et sans surfaces internes exposees.

## 2. Convergences fortes

| Sujet | Codex | Claude Code | Decision fusionnee |
| --- | --- | --- | --- |
| Nature du produit | Cabinet juridique augmente / OS de cabinet | Systeme d'exploitation de cabinet juridique | Positionnement officiel a retenir |
| Comptabilite | Operationnelle + export externe | Mono-axe append-only + export externe, pas grand livre | Ne pas vendre SAFE comme QuickBooks |
| Vendabilite | Pilote accompagne possible, public pas encore | Pilote accompagne possible, public pas encore | Meme verdict |
| Facture preview/PDF/public | Equivalence non prouvee = P0 | Equivalence non prouvee = bloquant majeur | P0 absolu |
| UX comptabilite | Trop registre/journaux | Trop manuelle / trop large | Refaire en hub d'action |
| Parcours paiement | Encore manuel | Paiements orphelins possibles | Simplifier et surveiller paiements non alloues |
| RH/paie | Ne pas surpromettre paie complete | RH esquisse, paie incomplete | Positionner comme RH/heures/preparation paie |
| Navigation | Pages orphelines et chevauchements | Doublons routes heures/compta/facturation | Nettoyer navigation avant pilote |
| Demo | Seed demo commercial necessaire | Demo cabinet pre-rempli necessaire | Creer scenario demo canonique |
| Tests E2E | Absents, necessaires | Absents, necessaires | Ajouter apres P0 ou avant vente publique |

## 3. Apports nouveaux de Claude Code

Ces points n'etaient pas assez forts dans le rapport Codex et doivent etre ajoutes au plan prioritaire.

| Point nouveau | Gravite retenue | Pourquoi c'est important |
| --- | --- | --- |
| Onboarding in-app ne persiste rien | P0 | Un cabinet neuf peut croire qu'il configure SAFE alors que rien n'est sauvegarde. |
| Ecrans vides sans guidage | P0 | La premiere experience d'un vrai cabinet devient froide et peu rassurante. |
| Fermeture dossier stub | P0/P1 | Obligation operationnelle/deontologique; important pour vendre a un cabinet serieux. |
| PDF audit public sans rate-limit | P0 technique rapide | Risque DoS simple; correction courte. |
| Console SAFE Inc. gatee par nom cabinet | P0/P1 | Surface interne a cacher strictement aux clients. |
| Impersonation seulement modele Prisma | P2 ou retirer promesse | Ne pas laisser croire a une feature support existante. |
| Architecture documentaire eclatee | P1 | L'utilisateur ne sait pas ou ranger preuve, document, piece, RichDocument. |
| Surpaiement / solde negatif peu signale | P1 | Peut fausser la comprehension client et comptable. |

## 4. Points ou Codex est plus strict

| Point | Gravite retenue | Decision |
| --- | --- | --- |
| Redesign `/comptabilite` en workflows | P0/P1 | A traiter avant pilote si la demo inclut la compta. |
| Warnings Prisma d'auth pendant build | P0/P1 | A corriger avant push officiel si possible; au minimum documenter env. |
| Lint rouge | P0/P1 | A corriger ou a cadrer; ne pas laisser une CI future casser. |
| i18n hardcoded strings | P1/P2 | Prioriser pages client-facing, ne pas bloquer le push si non critique. |
| Clarifier "SAFE prepare les donnees pour le comptable" | P1 | Important pour eviter une promesse comptable excessive. |

## 5. P0 fusionnes avant push officiel

Ces points deviennent le socle minimal avant push officiel et demo serieuse.

| # | P0 fusionne | Source | Definition de termine |
| --- | --- | --- | --- |
| 1 | Equivalence facture preview/PDF/email/public | Deux audits | Test de contrat vert; presenter/loader unique ou preuve d'equivalence. |
| 2 | Onboarding in-app persistant ou cache | Claude | Le parcours sauvegarde vraiment, ou il est cache/remplace par une page claire. |
| 3 | Ecrans vides guides sur parcours principal | Claude | Dashboard, clients, dossiers, facturation ont CTA de premier usage. |
| 4 | Rate-limit PDF audit public | Claude | Route protegee par `checkRateLimit()` ou equivalent. |
| 5 | Console interne masquee aux clients | Claude/Codex | Console SAFE Inc. gatee par flag interne robuste, pas par nom de cabinet. |
| 6 | Etat technique pushable | Codex | `tsc`, tests critiques, build OK; lint/env Prisma corriges ou decision documentee. |
| 7 | Positionnement compta clarifie | Codex | Texte/UX indique comptabilite operationnelle + export externe; journaux en mode expert ou clairement presentes. |

## 6. P1 avant vente pilote

| # | P1 | Definition de termine |
| --- | --- | --- |
| 1 | Fermeture dossier reelle | Checklist, lettre de fermeture, retention, statut cloture. |
| 2 | Paiements orphelins / surpaiements | Liste ou alertes; allocation facilitee; solde negatif signale. |
| 3 | Debours centraux | Fiche debours claire et accessible depuis dossier/facturation. |
| 4 | Nettoyage navigation | Sort des doublons `/temps`, `/mes-heures`, `/fiches-de-temps`, journaux, pages orphelines decide. |
| 5 | Doctrine documentaire | Une logique claire pour upload, RichDocument, DossierPiece, pieces facture, preuves. |
| 6 | Demo cabinet pre-remplie | Scenario reproductible de 20 minutes sans ecran vide. |
| 7 | RH/paie scope | Libelles et docs positionnent le module comme gestion equipe/heures/preparation paie. |

## 7. P2 apres lancement

| Sujet | Decision |
| --- | --- |
| Import preuve Interac OCR | V2 apres stabilisation facture/paiement manuel. |
| Paie complete | Hors MVP sauf decision business explicite. |
| Impersonation | Implementer avec audit trail ou retirer de la promesse. |
| Playwright E2E complet | A faire avant vente publique autonome. |
| Reduction `any`, couleurs ad hoc, FormField unifie | Qualite continue apres P0/P1. |
| Interets de retard auto | Apres stabilisation des statuts facture/paiement. |

## 8. Contradictions ou nuances

### Tests

Claude indique 644 tests verts; Codex a relance un sous-ensemble critique de 214 tests compta/finance/fideicommis. Les deux ne se contredisent pas: ils ne couvrent pas le meme perimetre.

Decision: dans le calendrier de production, distinguer:

- tests critiques compta/billing/fideicommis;
- suite complete `npm run test:run`;
- futurs tests E2E.

### Comptabilite

Claude classe comptabilite comme mature techniquement. Codex la classe moyen cote UX.

Decision: les deux sont vrais. Le moteur comptable est solide; l'interface comptable reste a rendre vendable.

### Fermeture dossier

Claude la classe bloquante. Codex la classait importante mais moins centrale.

Decision: pour un produit vendu a des avocats, la fermeture dossier passe P1 haut ou P0 si la demo/pilote couvre le cycle complet.

### Lint

Codex met lint rouge en P0. Claude le classe important car le build ignore lint.

Decision: P0 pour push qualite si CI cible l'exige; sinon P1 mais a documenter explicitement.

## 9. Decision produit finale

SAFE doit etre stabilise autour de trois promesses vendables:

1. Cabinet organise: clients, dossiers, documents, assistant queue.
2. Argent maitrise: temps/forfaits/debours, facture fiable, paiement, recu, creances.
3. Conformite rassurante: fideicommis, rapprochement, exports comptables, fermeture dossier.

Tout ce qui ne sert pas ces trois promesses doit etre:

- cache;
- deplace en interne;
- documente comme V2;
- ou retire de la navigation.

## 10. Prochaine action

Utiliser cette comparaison pour alimenter le calendrier de production:

`docs/SAFE_PRODUCTION_EDITORIAL_CALENDAR.md`

Le calendrier doit transformer les constats en sequences courtes, verifiables et committables.
