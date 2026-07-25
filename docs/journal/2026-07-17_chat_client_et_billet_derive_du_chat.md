# 2026-07-17 — Support: chat client + billet dérivé du chat

## Contexte / observation

Audit du système de billetterie existant à la demande du CEO. État réel trouvé :

- **Manager de billets côté console** : bâti et branché. Liste `app/(app)/console/support/page.tsx`, fiche + réponses `app/(app)/console/support/[id]/page.tsx`, actions `actions.ts` (createTicket, addReply, setTicketStatus), lien « Support » dans le Header (`/console/support`, mode consultant SAFE Inc.).
- **Modèles** : `SupportTicket` + `TicketReply` existent (`prisma/schema.prisma:3489`).
- **Widget client** : le composant `components/support/SupportWidget.tsx` + les actions `app/(app)/support-widget-actions.ts` (createClientTicket, listMyTickets) existent, MAIS le widget **n'est monté nulle part** (aucun import de `<SupportWidget />`). Le layout ne monte que `<QuickCapture />`. Conséquence : le client ne peut pas envoyer de billet → le manager reste toujours vide → « ça ne se voit pas fonctionner ».

## Décision CEO (changement de processus)

On abandonne le flux « le client crée directement un billet ». Nouveau modèle :

1. **Chat** bidirectionnel avec le client = le canal de communication.
2. Côté CRM, **le CEO transforme une demande en billet** pour organiser le travail.

Choix validés (3 questions) :
- **Billet visible du client** aussi (statut nouveau → en cours → résolu remonté au client).
- **Temps réel instantané** (Supabase Realtime / SSE) plutôt que polling.
- **Plusieurs fils par sujet** et par cabinet.

## Plan retenu (5 phases)

- **P1 Données** : `SupportConversation` + `SupportMessage`, lien optionnel `conversationId`/`sourceMessageId` sur `SupportTicket`. Migration additive, local d'abord, prod en gate séparé.
- **P2 Chat client** : widget « Aide » → vrai chat (fils + messages + nouvelle conversation) + onglet « Suivi » des billets avec statut. Monter le widget dans le layout (`app/(app)/layout.tsx`).
- **P3 Inbox console** : boîte de réception tous cabinets, badges non-lus, réponse dans le chat.
- **P4 Transformer en billet** : bouton sur un fil/message → formulaire pré-rempli → `SupportTicket` lié à la conversation.
- **P5 Temps réel** : SSE ou Supabase Realtime + compteurs non-lus.

**Séquencement recommandé** : P1→P4 avec rafraîchissement auto léger (système utilisable de bout en bout), puis P5 pour le vrai temps réel, afin que la plomberie temps réel ne bloque pas la mise en service.

## Réutilisé (pas à recréer)

Manager `/console/support`, modèles `SupportTicket`/`TicketReply`, action `createTicket`, nav console, coquille du widget.

## Réalisé (2026-07-17, même session)

Phases P1 à P4 codées, en attente du temps réel (P5) — pour l'instant rafraîchissement auto léger (polling 5 s).

- **P1 Données** : migration additive `20260717120000_add_support_conversations` appliquée en local (safe_local, SQL direct) et enregistrée via `migrate resolve`. Modèles `SupportConversation` + `SupportMessage` + enum `StatutConversation`. `SupportTicket` gagne `conversationId` + `sourceMessageId` (FK optionnelles, onDelete SetNull). Relations ajoutées à `Cabinet` et `User`. Client Prisma régénéré.
- **P2 Chat client** : `components/support/SupportWidget.tsx` réécrit en chat (onglets Discussions + Suivi, fils multiples, nouveau fil, envoi optimiste, marquage lu). Actions `app/(app)/support-widget-actions.ts` (listMyConversations, getConversation, startConversation, sendClientMessage, listMyTickets). Widget **monté** dans `app/(app)/layout.tsx` (fil débranché réparé), masqué sur `/console`.
- **P3 Inbox console** : `app/(app)/console/support/messages/page.tsx` (liste tous cabinets, badges non-lus) + `[id]/page.tsx` (fil). Sous-nav Messages | Billets ajoutée sur les deux pages.
- **P4 Transformer en billet** : `chat-actions.ts` (sendSafeMessage, markConversationRead, setConversationStatut, convertToBillet) + `components/console/ConversationThread.tsx` (réponse, archiver, formulaire billet pré-rempli sujet + messages client). Billet lié au fil, visible dans le suivi client.

### Vérification

- `tsc --noEmit` : 0 erreur sur tout le projet.
- Routes console compilent et se chargent (seule erreur = garde d'auth attendue).
- Test runtime bout-en-bout (script jetable sur safe_local) : création fil → compte non-lus filtré 1→0 → réponse SAFE → conversion en billet lié (conversationId + sourceMessageId) → relecture billets dérivés → nettoyage. OK.
- Non fait : clic-à-travers visuel authentifié (login KO sur port alterné 3030, NEXTAUTH_URL lié à un autre port ; c'est le harnais de test, pas le code).

## Pièces jointes au chat (2026-07-17, même session)

Demande CEO : joindre images, PDF, Word, etc. dans le chat. Infra fichiers réutilisée (Vercel Blob privé via `lib/services/document.ts` : `writeDocumentObject`/`readDocumentObject`, fs local en dev).

- **Données** : migration additive `20260717140000_add_support_attachment` (table `SupportAttachment` liée à `SupportMessage`, onDelete Cascade). Appliquée local + `migrate resolve`, client régénéré. Le champ `SupportMessage.attachements String[]` devient inutilisé (on passe par la relation `pieces`).
- **Route d'envoi unifiée** : `POST /api/support/messages` (multipart) remplace les Server Actions d'envoi (celles-ci plafonnent à 1 MB). Gère nouveau fil (`sujet`) ou fil existant (`conversationId`), texte + jusqu'à 5 fichiers (max 25 MB, types PDF/Word/txt/images). Côté (client vs SAFE) déduit du cabinet. Actions `startConversation`/`sendClientMessage`/`sendSafeMessage` supprimées.
- **Route de service** : `GET /api/support/attachments/[id]`, authentifiée (cabinet propriétaire du fil ou SAFE Inc.), streaming inline depuis Blob.
- **UI** : trombone + pastilles de fichiers dans le widget client (nouveau fil + composer) et dans la réponse console. Affichage des pièces : images en aperçu, autres en lien téléchargeable. Rendu côté widget et côté page console serveur.

### Vérification pièces jointes

- `tsc --noEmit` : 0 erreur.
- Test HTTP réel (navigateur connecté) : `POST /api/support/messages` avec image PNG → 200 (fil + message + pièce créés) ; `GET /api/support/attachments/{id}` → 200, content-type image/png. Aperçu image rendu dans le fil (preuve visuelle capturée).
- Piège rencontré : le serveur dev doit être redémarré après `prisma generate` (client Prisma en mémoire = ancienne version, sinon « Unknown argument pieces »).

## Reste à faire

- **P5 Temps réel** : remplacer le polling par SSE ou Supabase Realtime + compteurs non-lus dans la nav console/widget.
- **Gate prod** : appliquer les DEUX migrations additives en production (`20260717120000_add_support_conversations` + `20260717140000_add_support_attachment`) avant déploiement. Vérifier `BLOB_READ_WRITE_TOKEN` en prod (déjà configuré selon l'état infra).
- Test visuel authentifié de la boucle complète (client ↔ console) incluant une vraie image/PDF, côté console.
