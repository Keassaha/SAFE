# 2026-07-13 — Gabarits d'email de facture + rédaction/envoi de mandats depuis l'éditeur

## Demande CEO
1. Permettre aux utilisateurs de modifier, à leur convenance, le courriel qui accompagne l'envoi d'une facture.
2. Permettre d'écrire, modifier et envoyer des mandats au client depuis l'éditeur (ou une voie plus adaptée).

## Décision
- Point d'entrée mandat retenu : **onglet Mandat du dossier** (le plus contextuel, tout est pré-rempli). Option « depuis /edition » écartée pour l'instant.
- On réutilise l'infrastructure existante à ~90 % (aucune migration Prisma) : config cabinet JSON, éditeur Tiptap, envoi au client, génération PDF.

## Chantier 1 — Gabarit d'email de facture (par cabinet)
Avant : la modale d'envoi était éditable au cas par cas, mais les valeurs par défaut étaient regénérées à chaque fois (rien de sauvegardé). Le journal du 2026-07-08 listait justement « reste : persister message/instructions par défaut » — **c'est fait**.

- `lib/cabinet-config.ts` : nouveau type `EmailFactureConfig { objet, message, instructionsPaiement }` dans `CabinetConfig` + getter `getEmailFactureConfig` + fusion dans `mergeCabinetConfig` + helper pur `applyInvoiceEmailVariables` (substitution `{{client}}`, `{{numero_facture}}`/`{{numero}}`, `{{cabinet}}`, `{{echeance}}`, tolérant aux espaces et alias).
- `app/api/cabinet/config/route.ts` : GET renvoie `emailFacture`, PATCH le valide (3 champs texte, 5000 car. max) et le renvoie.
- `app/api/facturation/factures/[id]/envoyer-email/route.ts` (GET) : si un gabarit est sauvegardé, il pré-remplit la modale APRÈS substitution des variables ; sinon retombe sur le défaut généré.
- `app/(app)/parametres/envoi-facture/EnvoiFactureConfigForm.tsx` : 3 champs (objet / message / instructions) + puces de variables cliquables qui s'insèrent dans le dernier champ actif. Champ vide = SAFE génère automatiquement.
- i18n FR/EN (`settingsUi.*`).

## Chantier 2 — Mandats rédigeables et envoyables
- `lib/edition/mandat-template.ts` : builder pur qui produit le contenu ProseMirror (Tiptap) d'un mandat pré-rempli à partir du dossier/client/cabinet/honoraires (objet, honoraires selon mode de facturation, provision/fidéicommis, facturation, collaboration, confidentialité, fin du mandat, blocs de signature). Aucun numéro de Barreau (règle facture étendue par prudence).
- `app/api/dossiers/[id]/mandat/route.ts` : GET liste les mandats du dossier ; POST crée un `RichDocument type="mandat"` pré-rempli (+ version initiale + entrée cahier best-effort) et retourne l'id.
- `components/dossiers/detail/DossierDetailMandat.tsx` : onglet Mandat refait. Bouton « Rédiger le mandat » → crée et ouvre l'éditeur ; liste des mandats existants avec statut ; rappel que l'envoi au client (PDF joint) se fait depuis l'éditeur.
- Type `"mandat"` ajouté là où les types de document sont énumérés : zod (`api/edition/documents`), `DossierAtelierView` (libellé + couleur ambre), `email-templates` (intro FR/EN « prendre connaissance, signer et retourner »).
- i18n FR/EN (`matterDetailUi.*`, `editorUi.docTypeMandat`).

## Chantier 3 — Import de mandats existants (modifiables)
Demande CEO complémentaire : pouvoir importer un mandat déjà existant et le modifier. Formats retenus (les trois) : Word (.docx), PDF, copier-coller.
- Dépendances ajoutées : `mammoth` (.docx → HTML) + `@tiptap/html@3.22.4` (épinglé pour matcher `@tiptap/core`, build serveur zeed-dom, sans jsdom).
- `lib/edition/html-to-tiptap.ts` : `htmlToTiptapContent` (HTML mammoth → JSON Tiptap via `generateJSON`, extensions alignées sur l'éditeur) + `textToTiptapContent` (texte brut → paragraphes, lignes vides = paragraphes, saut simple = hardBreak).
- `lib/edition/create-mandat.ts` : helper `createMandatRichDocument` factorisé (RichDocument + version + cahier), partagé par la création depuis gabarit ET l'import.
- `app/api/dossiers/[id]/mandat/import/route.ts` : POST. JSON `{text}` = copier-coller ; multipart `.docx` = conversion fidèle mammoth ; `.pdf` = texte via `pdf-parse` (+ avertissement mise en forme perdue, 422 si PDF scanné) ; `.txt` = texte. Crée un mandat éditable et retourne l'id.
- `components/dossiers/detail/ImportMandatDialog.tsx` : modale 2 onglets (Fichier / Coller le texte). En cas de succès, ouvre l'éditeur ; toast d'avertissement pour les PDF.
- `DossierDetailMandat` : 2e bouton « Importer un mandat » à côté de « Rédiger le mandat ».
- i18n FR/EN (`matterDetailUi.mandateImport*`).

Résultat : Word conserve la mise en forme ; PDF importe le texte (reformatage nécessaire) ; copier-coller instantané. Dans les trois cas le mandat devient un document 100 % éditable dans l'éditeur, puis envoyable au client.

## Vérifications
- `tsc --noEmit` : **0 erreur** sur tout le projet.
- Tests : `invoice-accompanying-email` (4) + `invoice-email-variables` (6) + `mandat-import-conversion` (5) = 15 verts.
- Compilation des routes confirmée via serveur de dev (307 settings, 401 config, 500 mandat = comportement auth identique aux routes `/api/edition/*` existantes quand non authentifié).

## Vérification live (2026-07-13, après relance DB)
- Postgres local `safe_local` était éteint (verrou `postmaster.pid` orphelin pointant vers un PID recyclé par Chrome). Retiré + `brew services restart postgresql@16` → base OK.
- Connexion cabinet test (« Cabinet Test ») OK.
- **Chantier 1 vérifié** : page Paramètres › Envoi de facture affiche la carte gabarit + puces variables ; insertion d'une variable dans le champ actif fonctionne. **Bug corrigé en live** : les placeholders contenant `{{...}}` cassaient le parseur ICU de next-intl (message affiché = clé brute). Placeholders réécrits sans accolades (les puces enseignent déjà les variables).
- **Correction d'intégration majeure** : les boutons Mandat avaient été branchés sur `DossierDetailTabs`, qui est **du code mort** (exporté mais utilisé nulle part). La vraie page dossier rend `DossierBriefcase`. Les actions « Rédiger le mandat » et « Importer un mandat » ont été déplacées dans `components/dossiers/briefcase/BriefcaseSidebar.tsx`, section `mandat`. Confirmé accessible à l'écran.
- **Chantier 2 vérifié** : clic « Rédiger le mandat » → mandat créé + éditeur ouvert pré-rempli (parties, objet avec nom d'affaire, honoraires, signatures) + chrono + « Envoyer au client ». Polish : plus de double point (« Inc.. ») grâce à `endSentence`.
- **Chantier 3 vérifié** : dialogue d'import 2 onglets s'ouvre ; route `mandat/import` (JSON collé) → 201 + mandat créé ; texte rendu en paragraphes éditables dans l'éditeur. (Le remplissage du textarea via l'automatisation ne poussait pas l'état React contrôlé, artefact du harness ; l'API et l'éditeur sont validés, une frappe clavier réelle déclenche l'onChange.)

## Chantier 4 — Modèle de mandat conforme Barreau du Québec
Demande CEO : « le modèle idéal inspiré par le barreau ». Le gabarit initial (chantier 2) était une rédaction générique plausible. Refonte pour calquer le **modèle officiel du Barreau du Québec « Convention de mandat et d'honoraires »**.
- Source primaire trouvée : modèle officiel Barreau (`convention-honoraires.docx`), extrait via `mammoth` (déjà installé pour l'import). Note sourcée complète : `docs/research/RECHERCHE_mandat_convention_barreau_qc.md`.
- `lib/edition/mandat-template.ts` réécrit : structure officielle en 10 sections + PRD + signatures. Pré-remplissage parties/objet/honoraires/provision depuis le dossier ; champs `[____]` pour montants/délais à compléter.
- Éléments déontologiques distinctifs intégrés et sourcés : honoraires justes et raisonnables (Code de déontologie **r 3.1 art. 102**, pas l'ancien « 3.06.01 » cité en interne), **conciliation puis arbitrage de compte** (règlement **B-1, r 17**, 45 jours), avances en fidéicommis au nom du client, conservation 7 ans + remise des originaux, conflits d'intérêts, fin de mandat.
- Route mandat enrichie (coordonnées cabinet + courriel client) pour le bloc « Entre les parties ».
- Test : `lib/__tests__/mandat-template-barreau.test.ts` (5) — 10 sections, fidéicommis, arbitrage 45 j, conflits, 7 ans, pré-remplissage, adaptation forfait.
- Correction sourcing : la KB interne citait l'ancien Code de déontologie (art. 3.06.01, abrogé 2015) ; le gabarit s'appuie sur le modèle officiel et le r 3.1. QC uniquement pour l'instant ; ON/LSO = roadmap.
- Vérifié : document généré imprimé en clair (calque fidèle du modèle Barreau, données du dossier injectées). Typecheck 0 erreur, 16 tests verts.

## Chantier 5 — Signaux « État des obligations » du tableau de bord
Signalement CEO : les signaux du bas ne semblent pas connectés aux données réelles. Diagnostic (données Cabinet Test) : les 4 signaux LISENT bien la base, mais 2 mesuraient la mauvaise chose.
- **Temps non facturé (4)** et **Rapprochement fidéicommis (À faire)** : déjà corrects.
- **« Factures en attente » (0)** : comptait les brouillons (`whereInvoiceDraft`) alors que le cabinet a 2 factures émises dont 1 impayée de 247,50 $. Décision CEO → renommé **« Factures impayées »**, requête = `statut != brouillon AND balanceDue > 0`. Valeur attendue : 1.
- **« Comptes fiducie actifs » (0)** : comptait la table `TrustAccount` (souvent vide ; le solde réel vient de `TrustTransaction`). Décision CEO → renommé **« Clients avec fonds en fiducie »**, nouveau helper `countClientsWithTrustFunds` (groupBy clientId sur TrustTransaction, solde > 0). Reste 0 pour ce cabinet, mais désormais depuis la source de vérité.
- Fichiers : `lib/services/fideicommis/trust-balance-service.ts` (+ helper), `app/(app)/tableau-de-bord/page.tsx` (2 requêtes), `components/dashboard/DashboardViewSafe.tsx` (libellés), `lib/dashboard/types.ts` (doc). Vues mortes non touchées : `DashboardView`, `IndicatorsPanel`.
- Vérif : tsc 0 erreur ; 126 tests fidéicommis/billing verts ; valeurs terrain confirmées en SQL (Factures impayées = 1, Clients avec fonds en fiducie = 0).

## Observé / à faire
- `components/dossiers/detail/DossierDetailTabs.tsx` (+ `DossierDetailMandat.tsx` que j'ai réécrit) sont maintenant inutilisés (code mort pré-existant). À supprimer ou à réconcilier avec le briefcase dans un futur nettoyage.
- **Bloquant vérif e2e** : impossible de se connecter en local, la page /connexion affiche « La base de données ne répond pas » → Postgres `safe_local` non démarré. Rendu visuel des deux écrans à confirmer une fois la DB relancée.
- Dette pré-existante repérée (hors périmètre) : `requireCabinetAndUser` **throw** au lieu de retourner `null`, donc les gardes `if (!session) return 401` des routes edition sont mortes et renvoient 500 aux non authentifiés. À normaliser un jour.
- Le mandat pré-rempli est en français uniquement pour l'instant (le gabarit `EngagementLetterPDF` gère FR/EN ; on pourra brancher la langue du client plus tard).

## Idée build-in-public (à publier plus tard, voix « vous »)
« Votre courriel de facture, écrit une fois, envoyé mille fois. » Montrer en 20 secondes : on règle l'objet et le message une seule fois dans les paramètres, avec des variables (nom du client, numéro, échéance), et chaque facture part déjà rédigée, encore modifiable avant l'envoi. Preuve visuelle > description.
