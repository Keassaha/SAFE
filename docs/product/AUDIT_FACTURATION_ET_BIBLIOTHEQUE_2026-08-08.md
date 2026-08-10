# Audit — Volet facturation/relances et volet bibliothèque documentaire

Date : 2026-08-08
Déclencheur : un avocat veut accéder à SAFE pour son volet administratif. Le CEO estime le côté dossier administratif insuffisant.
Portée auditée : `app/(app)/facturation/**`, `app/api/facturation/**`, `lib/services/billing/**`, `lib/email.ts`, `app/(app)/edition/**`, `app/api/documents/**`, `app/api/edition/**`, `lib/ai/**`, `lib/dossiers/cartable-*`, `prisma/schema.prisma`.

Méthode : lecture du code, pas de la documentation. Chaque affirmation ci-dessous est vérifiable par le fichier cité.

---

## Partie A — Facturation et relances

### A.1 Ce qui est solide

**Le pipeline d'émission est sérieux.**
`app/api/facturation/factures/[id]/envoyer-email/route.ts` : présentation canonique → PDF officiel → lettre d'accompagnement courte → `sendEmail` avec pièce jointe → `InvoiceSendLog` (succès ET échec) → escalade du statut vers `ISSUED` seulement si l'envoi a réussi. Le courriel ne ment pas quand la pièce jointe échoue.

**Le message d'envoi est déjà éditable par le cabinet.**
`app/(app)/parametres/envoi-facture/EnvoiFactureConfigForm.tsx` : objet, message, instructions de paiement, avec 4 variables insérables (`{{client}}`, `{{numero_facture}}`, `{{cabinet}}`, `{{echeance}}`) substituées par `applyInvoiceEmailVariables`. **Le mécanisme demandé pour les relances existe déjà — pour l'envoi initial seulement.** Il est à recopier, pas à inventer.

**Le statut « en retard » est dérivé, pas stocké.**
`lib/billing/invoice-status.ts::whereInvoiceOverdue(now)` est la source de vérité unique. Aucun risque de facture marquée en retard qui ne l'est plus. Fondation correcte pour bâtir des paliers.

**Le garde-fou Barreau sur la transmission est en place.**
`Invoice.deliveredAt` / `deliveryChannel` distinguent la preuve (envoi depuis SAFE) de la déclaration (poste, main propre). C'est cette date qui ouvre le droit de retrait fidéicommis. Une relance ne doit jamais toucher ces champs.

### A.2 Le trou : les relances n'existent pas

Le schéma est prêt et le moteur est vide.

| Élément | État réel |
|---|---|
| `model InvoiceReminder` (schema.prisma:1561) | Existe. `reminderDay`, `type`, `scheduledAt`, `sentAt`, `status`, `channel`, `amountFrais`, `amountInterets`, `note`. Complet. |
| `Invoice.lastReminderDay` (schema.prisma:1310) | Existe. **Jamais écrit** nulle part dans le code. |
| enums `InvoiceReminderType`, `ReminderType`, `ReminderChannel` | Existent. Les paliers J+5/J+10/J+15/J+20/J+30 sont déjà pensés dans les commentaires du schéma. |
| `lib/services/billing/reminder-service.ts::createReminder()` | Crée une ligne en base + un audit log. **N'envoie aucun courriel.** Et n'est **appelé nulle part** (seulement ré-exporté par `index.ts` et couvert par un test). |
| `lib/email.ts::reminderEmailHtml()` (ligne 171) | **Importé nulle part.** Code mort. Texte générique en dur, non éditable, signé « SAFE — safecabinet.ca » et non par le cabinet. |
| Route API de relance | **Aucune.** Les 25 routes de `app/api/facturation/**` couvrent émission, annulation, PDF, lien client, paiements, notes de crédit. Pas de relance. |
| Bouton dans l'interface | **Aucun.** Le menu « Outils » pointe vers `/facturation/suivi?retard=1`, qui liste les échus sans permettre d'agir. |
| Colonne « Relance » du tableau | `FacturationTable.tsx:167` affiche `J+{lastReminderDay}` — donc **toujours `—`**, puisque le champ n'est jamais écrit. |
| Automatisation | Un seul cron dans `vercel.json` : `/api/cron/daily-digest`, 11h du lundi au vendredi. Rien pour les échus. |

**Verdict : la fonctionnalité est à ~10 % (le schéma), 0 % utilisable.**

### A.3 Écart de promesse à corriger avant la démo

La landing affirme aujourd'hui :
- `components/landing/Piliers.tsx:29` — « Les relances partent seules, rien ne dort. »
- `components/landing/preview/TroisActes.tsx:286` — « La facture part, se suit, et relance elle-même si personne n'a répondu. »
- `components/landing/preview/TroisActes.tsx:174` — badge « Relance envoyée ».
- `components/landing/PourLadjointe.tsx:46` — « Il vous enlève [...] les relances ».

Rien de cela n'est vrai dans le produit. Un avocat qui teste le volet administratif cherchera ce bouton. Deux sorties possibles : bâtir la fonction (recommandé, elle est à portée), ou retirer la promesse le temps de la bâtir. Ne pas laisser l'écart ouvert pendant une démo.

### A.4 L'interface : 14 pages pour un seul objet

`app/(app)/facturation/` contient **14 routes** avec un `page.tsx`.

La même facture apparaît sur **trois écrans distincts** :

| Écran | Ce qu'il montre | Recouvrement |
|---|---|---|
| `/facturation` | Hero + 5 KPI + barre de 5 outils + section « facturables » embarquée + filtres + **tableau de toutes les factures** + menu Outils (dont 2 items désactivés « bientôt ») | l'ensemble |
| `/facturation/suivi` | « Envoyées » + « En retard » en pipeline | sous-ensemble du tableau |
| `/facturation/verification` | Brouillons | sous-ensemble du tableau |

Plus neuf satellites : `/honoraires` (redirige vers `#facturables` de la première page), `/honoraires/[clientId]`, `/paiements`, `/notes-de-credit`, `/frais`, `/taxes`, `/rentabilite`, `/creances-aging`, `/temps-non-facture`.

Le problème n'est pas le nombre de fonctions, il est bon. Le problème est qu'**il faut savoir d'avance où aller**. L'opérateur qui veut relancer une facture doit deviner que ça se trouve derrière un menu « Outils » qui mène à un troisième écran où il ne pourra de toute façon rien faire.

### A.5 Proposition d'interface : un écran, un panneau

Remplacer les trois vues par une seule, et remplacer la navigation par un panneau latéral.

```
┌──────────────────────────────────────────────────────────────┐
│  Facturation                          [Outils ▾]  [+ Facture]│
├──────────────────────────────────────────────────────────────┤
│  À facturer     Brouillons    En attente     En retard       │
│  4 200 $ · 6    3             12 400 $ · 9   3 100 $ · 4     │  ← filtres cliquables
├──────────────────────────────────────────────────────────────┤
│  N°     Client        Dossier      Montant  Solde  Âge  Rel. │
│  ────────────────────────────────────────────────────────────│
│  F-104  Tremblay      Divorce      1 850 $  1 850  J+34  J+15│  ← ligne sélectionnée
│  F-103  Gagnon        Succession   2 400 $      0        —   │
└──────────────────────────────────────────────────────────────┘
              ┌────────────────────────────────┐
              │  F-104 · Tremblay              │  ← panneau latéral,
              │  Aperçu · Historique · Relances│     pas une autre page
              │                                │
              │  [Envoyer]  [Relancer]  [Encaisser] │
              └────────────────────────────────┘
```

Trois décisions qui portent le gain :

1. **Les chiffres du haut sont les filtres.** Aujourd'hui ce sont des cartes décoratives et les filtres sont ailleurs. Cliquer « En retard · 4 » filtre le tableau. `/suivi` et `/verification` n'ont plus de raison d'exister.
2. **Une facture s'ouvre dans un panneau latéral, pas dans une page.** Aperçu, historique d'envoi (`InvoiceSendLog` existe déjà), historique de relances, et les trois actions. On ne perd jamais sa liste. On peut traiter dix factures sans jamais changer d'écran.
3. **Les outils sortent du chemin principal.** La barre de 5 tuiles disparaît, tout passe dans le menu « Outils » déjà présent. Taxes, rentabilité, débours, créances : ce sont des consultations mensuelles, pas le travail quotidien.

Résultat : **14 routes → 5** (`/facturation`, `/nouvelle`, `/factures/[id]` pour l'impression et le lien direct, `/paiements`, `/outils`). Les autres deviennent des sections ou des filtres.

---

## Partie B — Dossier administratif et bibliothèque

### B.1 Deux mondes documentaires qui ne se parlent pas

| Monde | Modèle Prisma | Contenu | Où on le voit |
|---|---|---|---|
| Documents rédigés dans SAFE | `RichDocument` | notes, lettres, contrats, procédures, requêtes | `/edition/bibliotheque` |
| Fichiers téléversés | `Document` | PDF, scans, pièces, correspondance reçue | **nulle part de transversal** — seulement dossier par dossier (cartable) ou dans la fiche client |

C'est le cœur du problème que l'avocat va rencontrer. Ce qu'un cabinet cherche, ce sont les **pièces reçues**, et elles ne sont visibles nulle part hors de leur dossier d'origine.

### B.2 La « bibliothèque » actuelle n'en est pas une

`app/(app)/edition/bibliotheque/page.tsx` :
- `take: 200` — plafond dur, pas de pagination. Au 201ᵉ document, on ne voit plus le plus ancien.
- Les 200 lignes sont envoyées au client, puis **filtrées en JavaScript dans le navigateur** (`EditionBibliotheque.tsx:71-79`).
- La recherche porte sur `titre + nom du client + intitulé du dossier`. Rien d'autre.
- Elle ignore **100 % des fichiers téléversés**.
- Point annexe : le composant utilise une palette codée en dur (`V1 = { accent: "#4f46e5", ... }`, indigo) hors du design system `si-*`. À reprendre au passage.

### B.3 L'IA travaille déjà, et son travail est jeté

`app/api/edition/upload/route.ts` fait du bon travail :
1. extrait le texte du PDF (`pdf-parse`, ligne 127 de `lib/ai/classify-document.ts`) ;
2. envoie ce texte + la liste des 50 dossiers ouverts à Claude ;
3. récupère dossier suggéré, type de document, score de confiance, raisonnement, titre suggéré ;
4. y ajoute une suggestion de section de cartable (`suggestPracticeDocument`).

**Puis le texte extrait est jeté.** Il vit dans une variable locale, sert au prompt, et disparaît à la fin de la requête. Aucune colonne ne le stocke.

Pire, il y a **deux routes d'upload** et elles ne font pas la même chose :

| Route | Utilisée par | Extraction de texte | Classification IA |
|---|---|---|---|
| `/api/edition/upload` | `components/edition/UploadZone.tsx` (atelier) | oui, puis jetée | oui |
| `/api/documents/upload` | `components/documents/DocumentsSection.tsx` (fiche client / dossier) | **non** | **non** |

Donc selon l'endroit où l'utilisateur dépose son fichier, l'IA travaille ou ne travaille pas. Ce n'est pas un choix, c'est une divergence.

Manquent aussi :
- **Aucun OCR** pour les images et les scans. `pdf-parse` ne lit que la couche texte : un PDF scanné rend une chaîne vide. Or les pièces d'un cabinet sont massivement des scans.
- **Aucun index plein texte** (pas de `tsvector`), **aucun embedding** (pas de `pgvector`).

Conséquence directe : il est impossible de chercher « la mise en demeure de mars » ou « le bail ». On ne peut retrouver un document que si on se souvient de son nom de fichier.

### B.4 Ce qui est déjà excellent : la structure de rangement

`lib/dossiers/cartable-templates/index.ts` — 670 lignes, 11 domaines de pratique, chacun avec ses sections nommées par un vrai vocabulaire de cabinet :

> Mandat et engagement · Pièces Madame (P-) · Pièces Monsieur (D-) · Procédures · Jugements et ordonnances · Correspondance · Fidéicommis · Notes et honoraires · Fermeture du dossier

Et pour le pénal : Divulgation DPCP, Formulaires prescrits (C.cr.), Comparutions et dates. Pour l'immigration : Suivi IRCC / MIFI.

`Document` porte déjà `sectionKey`, `classificationSubtype`, `classificationConfidence`, `classificationNeedsReview`, `classificationReason`.

**Le squelette d'archiviste existe et il est bon.** Le rangement est fait. C'est le **retrouvage** qui n'existe pas.

---

## Partie C — Plan

Deux chantiers, jamais en parallèle. Le premier est plus court, plus visible, et son schéma est déjà en place.

### Chantier 1 — Relances multi-niveaux

**Lot R1 — Le moteur (fondation)**

- Migration additive : `model ReminderTemplate` (`cabinetId`, `niveau`, `joursApresEcheance`, `objet`, `message`, `actif`, `canal`). N paliers configurables, pas 3 en dur.
- Route `POST /api/facturation/factures/[id]/relance` : charge le palier applicable → rend le template avec `applyInvoiceEmailVariables` (existe déjà) → `sendEmail` avec le PDF joint → crée `InvoiceReminder` → **écrit enfin `lastReminderDay`**.
- Réécrire `reminder-service.ts::createReminder()` pour qu'il envoie au lieu de seulement journaliser.
- Supprimer `reminderEmailHtml()` (code mort remplacé par le template éditable).
- Ne jamais toucher `deliveredAt` / `deliveryChannel` : une relance n'est pas une transmission au sens de l'art. 56(2).

*Terminé quand* : depuis une facture en retard, un bouton « Relancer » envoie un vrai courriel signé du cabinet, et la colonne Relance affiche `J+15` au lieu de `—`.
*Durée réaliste* : 2 jours.

**Lot R2 — L'écran des échus + le panneau latéral**

- `/facturation` absorbe `/suivi` et `/verification` : les 4 chiffres du haut deviennent les filtres.
- Panneau latéral sur sélection d'une ligne : aperçu, historique d'envoi, historique de relances, actions Envoyer / Relancer / Encaisser.
- Sur le filtre « En retard » : groupement par palier (J+5, J+15, J+30, J+60), sélection multiple, **aperçu du message avant envoi**, envoi en lot.

*Terminé quand* : 10 factures relancées en 3 clics, avec le message vu avant qu'il parte.
*Durée réaliste* : 4 jours.

**Lot R3 — Paramètres éditables**

- `/parametres/relances` : liste des paliers, jours, objet, message, mêmes variables insérables. Recopier `EnvoiFactureConfigForm.tsx`, il fait déjà exactement ça.

*Terminé quand* : le cabinet change le texte du palier 2 et le voit dans l'aperçu de R2.
*Durée réaliste* : 1 jour.

**Lot R4 — Automatisation prudente**

- Cron quotidien `/api/cron/relances` : calcule les factures dont un palier est échu et les pose **en attente d'approbation** dans l'écran des échus.
- Bascule cabinet « envoi automatique », **désactivée par défaut**.

Raison du défaut à off : un courriel qui part seul chez le client d'un avocat engage la relation du cabinet, pas la nôtre. Le cabinet l'active quand il a vu les propositions pendant deux semaines et qu'il leur fait confiance. C'est aussi ce qui rend la promesse de la landing tenable sans risque.

*Terminé quand* : chaque matin, l'écran affiche « 3 relances proposées ».
*Durée réaliste* : 1 jour.

**Total chantier 1 : 8 jours de construction.**

### Chantier 2 — Bibliothèque et archiviste

**Lot B1 — Persister le texte (fondation, invisible mais bloquante)**

- Migration additive sur `Document` : `textContent String?`, `textExtractedAt DateTime?`, `ocrStatus String?`.
- Index Postgres plein texte français : `to_tsvector('french', nom || ' ' || textContent)`.
- Brancher l'extraction sur **les deux** routes d'upload, pas une seule. Aligner `/api/documents/upload` sur `/api/edition/upload` (classification IA comprise).
- Backfill des documents déjà en base.

*Terminé quand* : une requête SQL sur le contenu d'un PDF déjà téléversé le retrouve.
*Durée réaliste* : 2 jours.

**Lot B2 — La bibliothèque unifiée**

- `/bibliotheque` : recherche **serveur**, paginée, sur `Document` **et** `RichDocument`.
- Filtres : client, dossier, section de cartable, type, période.
- Le résultat affiche **l'extrait de texte qui correspond**, surligné. Pas seulement un nom de fichier.
- Reprendre la palette `si-*` au passage (le composant actuel est en indigo hors design system).

*Terminé quand* : taper « mise en demeure » retrouve le PDF dont c'est le contenu, pas seulement ceux dont c'est le titre.
*Durée réaliste* : 3 jours.

**Lot B3 — L'archiviste**

Une barre unique en français : *« les baux du dossier Tremblay de l'an dernier »*.

Le sens du flux est la décision importante : **Claude traduit la question en filtres, il ne produit pas la réponse.** Il remplit un formulaire (`client`, `dossier`, `sectionKey`, `période`, `type`, `motsClés`), et c'est la recherche déterministe de B2 qui exécute. Les filtres déduits sont affichés à l'écran et modifiables.

Deux conséquences : aucune hallucination possible (l'IA ne voit jamais les documents, seulement la question), et l'avocat comprend toujours pourquoi il obtient ces résultats-là. C'est ce qui rend la fonction montrable à un avocat sans réserve.

*Terminé quand* : 5 questions posées en français retrouvent le bon document.
*Durée réaliste* : 2 jours.

**Lot B4 — La file de rangement**

- Écran « Documents à ranger » : les documents sans dossier ou sans section, avec la suggestion IA et son score. Un clic = rangé.
- `classificationNeedsReview` existe déjà sur le modèle et n'est exploité nulle part.

*Terminé quand* : 20 documents non classés sont rangés en moins de 5 minutes.
*Durée réaliste* : 1 jour.

**Total chantier 2 : 8 jours de construction.**

### C.3 Ce qu'on ne fait pas maintenant

- **OCR des scans.** Nécessaire à terme, mais c'est un service externe, un coût par page et une file d'attente. B1 pose la colonne `ocrStatus` pour que le branchement soit trivial plus tard. Ne pas l'ouvrir dans ce chantier.
- **Recherche sémantique par embeddings.** La recherche plein texte + filtres IA couvre l'usage réel d'un cabinet. Les embeddings sont la version suivante, pas la première.
- **Frais de retard et intérêts automatiques sur relance.** `InvoiceReminder.amountFrais` et `amountInterets` existent, et `InterestCharge` aussi. Mais facturer des frais automatiquement engage le cabinet vis-à-vis de son client et du Barreau. À traiter comme une décision distincte, avec sa propre vérification réglementaire.
- **Portail client documentaire.** Hors périmètre.

---

## Ordre recommandé

Chantier 1 d'abord, entièrement, avant d'ouvrir le chantier 2.

Trois raisons :
1. Son schéma est déjà en base — le rapport travail/résultat est le meilleur des deux.
2. C'est ce qui rentre de l'argent. C'est l'argument qui se démontre à un avocat en 30 secondes.
3. Il ferme un écart de promesse déjà publié sur la landing.

Le chantier 2 est ce que l'avocat a demandé, mais il est plus long et son lot fondateur (B1) ne produit rien de visible. L'ouvrir en second, une fois le chantier 1 fermé.

---

## Fichiers cités

**Facturation**
- `app/(app)/facturation/page.tsx` · `suivi/page.tsx` · `verification/page.tsx`
- `app/api/facturation/factures/[id]/envoyer-email/route.ts`
- `lib/services/billing/reminder-service.ts` · `lib/email.ts:171`
- `lib/billing/invoice-status.ts`
- `components/facturation/FacturationTable.tsx:167` · `FacturationActions.tsx`
- `app/(app)/parametres/envoi-facture/EnvoiFactureConfigForm.tsx`
- `prisma/schema.prisma:1288` (Invoice) · `:1555` (enums) · `:1561` (InvoiceReminder)

**Documents**
- `app/(app)/edition/bibliotheque/page.tsx` · `components/edition/EditionBibliotheque.tsx`
- `app/api/edition/upload/route.ts` · `app/api/documents/upload/route.ts`
- `lib/ai/classify-document.ts` · `lib/dossiers/cartable-templates/index.ts`
- `prisma/schema.prisma:2967` (Document)

**Promesses landing à réconcilier**
- `components/landing/Piliers.tsx:29` · `preview/TroisActes.tsx:174,286` · `PourLadjointe.tsx:46`
