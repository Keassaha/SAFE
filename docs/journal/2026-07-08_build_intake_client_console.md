# 2026-07-08 — Build intake client Console (slice 1 : saisie manuelle)

## Demande CEO
Ajouter manuellement un client à la Console, via un formulaire d'intake « intéressant »
calqué sur le formulaire d'audit rempli par le prospect. Priorité choisie : intake
d'abord, puis envoi de factures, puis relecture de l'écran d'envoi.

## Spec
docs/product/SPEC_INTAKE_CLIENT_CONSOLE.md (validée par « go » du CEO, défauts D1/D2/D3
retenus : 6 sections complètes, import + manuel, texte des domaines gardé tel quel).

## Fait (slice 1 = mode manuel)
- Flag `isConsoleIntakeEnabled()` (`SAFE_FEATURE_CONSOLE_INTAKE`, on par défaut) dans `lib/flags.ts`.
- Server action `createClientFromIntake` (`app/(app)/console/clients/nouveau/actions.ts`) :
  mappe les réponses d'audit → champs `Lead`, crée une `AuditSubmission` (source
  `onboarding`, TOUTES les réponses dans `reponses`), crée le `Lead` rattaché
  (`auditSubmission connect`), crée le `LeadContact` principal. Score firmographique
  réutilisé (`computeFirmographicScore`) + score global best-effort via
  `buildRecommendation`. Garde SAFE Inc. + flag.
- Composant `components/console/ConsoleIntakeForm.tsx` : réutilise le questionnaire
  d'audit (`lib/audit-gratuit/questions.ts`, `SECTIONS`/`visibleQuestions`/`sectionQuestions`),
  rendu si, sectionné d'un seul tenant (outil interne = vitesse), questions
  conditionnelles gérées, compteur champs requis, barre de soumission collante.
- Page `app/(app)/console/clients/nouveau/page.tsx` (bannière forêt, garde flag + SAFE Inc.).
- Bouton « + Nouveau client » ajouté à l'en-tête de `/console/clients`.

## Bonus (promis)
- Reskin des composants `components/console/` restés en palette générique
  (NewLeadForm, LogActivityForm, AddContactForm, TicketReplyForm, NewTicketForm,
  ConsoleNav, PipelineBoard) → tokens si. ~155 + 2e passe. Zéro résidu.

## Vérif
- `tsc --noEmit` : 0 erreur.
- Chemin d'écriture testé en intégration (rejeu exact des writes Prisma avec un
  échantillon : AuditSubmission + Lead + lien audit + LeadContact OK, puis nettoyé).
- Visuel port 3010 (connecté créateur) : page d'intake rend les 6 sections, style si
  cohérent, questions conditionnelles OK.

## Note modèle
Un intake crée un `Lead` (prospect) SANS `cabinetId` : il apparaît dans le Pipeline,
pas encore dans « Clients » (qui liste les leads convertis en Cabinet). Conversion =
étape ultérieure (bouton existant). Redirection post-création → fiche `/console/clients/[leadId]`.

## Slice 2 — Mode A « Importer depuis un audit » (FAIT même jour)
- `listImportableAudits()` (actions.ts) : liste les `AuditSubmission` non rattachées
  à un Lead (`where: { lead: { is: null } }`), parse `reponses.answers` pour préremplir.
- `createClientFromIntake` accepte `importedAuditId` : si présent, **réutilise** l'audit
  (update reponses + connect) au lieu d'en créer un nouveau ; garde-fou si déjà rattaché.
- `ConsoleIntakeForm` : sélecteur « Importer depuis un audit » en tête ; à la sélection,
  préremplit `answers`, force `sourceLead = AUDIT_GRATUIT` ; option « Partir de zéro ».
- Vérif : tsc 0 ; test à l'écran (audit fictif créé → sélecteur le liste → sélection
  préremplit raison sociale + ville + province + confirmation verte) → audit test supprimé.
- **Chantier intake bouclé** (Mode B manuel + Mode A import).

## Reste
- Prochain chantier CEO : envoi de factures + message éditable + instructions de paiement
  (socle déjà présent : `sendDocumentsToClient`, route envoyer-email, page config envoi-facture).
