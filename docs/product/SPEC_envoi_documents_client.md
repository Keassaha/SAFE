# SPEC — Envoi de documents au client (et facture multi-pièces)

> Statut : DRAFT, en attente de validation CEO avant build.
> Date : 2026-06-07.

## 1. Intention

Permettre au cabinet d'**envoyer des documents au client directement via l'application**, par le même mécanisme que l'envoi de facture. La facture devient un cas particulier de « pièce envoyée au client » : on peut donc **joindre d'autres documents** à une facture (ex. lettre explicative), et **envoyer un document seul** depuis le portail d'édition.

Citation CEO : *« considérer le fait d'envoyer une facture comme l'envoi d'un document, de sorte qu'on puisse rajouter d'autres documents »*.

## 2. Périmètre v1 (validé)

- Pièces envoyables : **RichDocuments** (documents créés/rédigés dans le portail d'édition), rendus en PDF.
- Texte d'email : **gabarits prédéfinis par type de document, éditables** avant envoi.
- Hors v1 (plus tard) : fichiers uploadés (`Document`), gabarits générés (react-pdf), envoi groupé multi-clients.

## 3. Briques réutilisées (déjà existantes)

| Brique | Fichier |
|---|---|
| RichDocument → PDF | `lib/atelier/tiptap-to-pdf.ts` + `lib/edition/pdf-builder.tsx` (déjà utilisé par « Export PDF ») |
| Envoi email multi-pièces | `lib/email.ts` → `sendEmail({ attachments: [...] })` |
| Gabarits HTML | `documentEmailHtml`, `invoiceAccompanyingEmailHtml` |
| Trace de communication | `NotificationLog` (générique : type/channel/sentTo/subject/status) |
| Envoi facture | `app/api/facturation/factures/[id]/envoyer-email/route.ts` (+ `InvoiceSendLog`) |

## 4. Architecture — un moteur d'envoi partagé

### 4.1 Service `lib/services/client-send/send-to-client.ts`
```
sendDocumentsToClient({
  cabinetId, dossierId, clientId, sentById,
  recipientEmail, subject, body,
  richDocumentIds: string[],      // 1..N documents à rendre + joindre
}): Promise<{ sent: boolean; logId: string; failures: string[] }>
```
- Rend chaque RichDocument en PDF (réutilise le builder existant).
- `sendEmail({ to, subject, html: body→html, attachments: [...pdf] })`.
- Trace dans `NotificationLog` (type `document_send`, channel `email`, metadata = liste des docs envoyés). **Preuve de communication (Barreau).**
- Garde-fou : refuse si `recipientEmail` absent ; ne rend que des RichDocuments du même `dossierId`/`cabinetId` ; recommande le statut `final` (avertissement si `brouillon`).

### 4.2 Gabarits `lib/services/client-send/email-templates.ts` (purs)
- `documentEmailTemplate(type, locale, { clientNom, cabinetNom, documentTitre })` → `{ subject, body }`.
- Un défaut par type : `lettre`, `contrat`, `procedure`, `requete`, `note`, `autre`. Bilingue FR/EN. Éditable côté UI.

### 4.3 Point d'entrée 1 — Portail d'édition
- `DocumentEditor` : bouton **« Envoyer au client »** à côté de « Export PDF ».
- Ouvre `SendToClientDialog` : destinataire pré-rempli (email du client du dossier), sujet + corps pré-remplis par le gabarit du type, **éditables**, aperçu de la pièce.
- POST `app/api/edition/documents/[id]/send/route.ts` → `sendDocumentsToClient`.

### 4.4 Point d'entrée 2 — Envoi de facture (multi-pièces)
- L'étape d'envoi de facture gagne une section **« Joindre d'autres documents du dossier ? »** : liste les RichDocuments `final` du dossier, cases à cocher.
- La route `factures/[id]/envoyer-email` accepte `attachRichDocumentIds: string[]` → rend leurs PDF → les ajoute aux `attachments` du **même courriel** que la facture. Le log facture (`InvoiceSendLog`) note les pièces additionnelles en metadata.

## 5. Conformité

- Chaque envoi = une trace immuable (`NotificationLog` ou `InvoiceSendLog`), preuve de communication client (erreur #1 LAWPRO/LSO = défaut de communication).
- Aucune suppression : on logue, on ne détruit rien.
- Permissions : envoi réservé aux rôles qui gèrent le dossier (avocate, admin, assistante) ; comptabilité pour les factures (inchangé).

## 6. Découpage (lots)

| Lot | Contenu | Migration |
|---|---|---|
| **E1** | Gabarits d'email (`email-templates.ts`, purs + tests) | — |
| **E2** | Service `sendDocumentsToClient` (rendu PDF + envoi + NotificationLog) + tests | — |
| **E3** | Portail d'édition : bouton « Envoyer au client » + `SendToClientDialog` + route `/edition/documents/[id]/send` | — |
| **E4** | Envoi facture : section « joindre d'autres documents » + extension de la route facture | — |
| **E5** | Vérif (tsc/lint/vitest/build) + commit + push | — |

**Aucune migration** : on réutilise `NotificationLog`. Risque faible (câblage de briques existantes).
