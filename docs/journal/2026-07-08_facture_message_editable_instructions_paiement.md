# 2026-07-08 — Envoi de facture : message éditable + instructions de paiement

## Demande CEO
Pouvoir envoyer une facture en **corrigeant le message d'envoi avant l'envoi**, avec
la facture en pièce jointe et des **instructions de paiement** pour que le paiement
se fasse efficacement et sans erreur.

## Constat (socle existant)
- Envoi de facture déjà en place : modale (`FacturePreviewActions`) → route
  `POST /api/facturation/factures/[id]/envoyer-email` → `sendEmail` (Resend) + PDF joint
  + trace `InvoiceSendLog`.
- MAIS le message (objet + corps) était généré côté serveur, **non éditable**, et **sans
  instructions de paiement**. La modale ne permettait que d'attacher des documents.

## Fait
- **`lib/email.ts` / `invoiceAccompanyingEmailHtml`** : accepte `customMessage` (texte
  brut édité) et `paymentInstructions`. Message perso rendu à la place de la lettre par
  défaut ; instructions affichées dans un encadré distinct en bas du courriel. Helper
  `escapeToHtml` (échappe le HTML + `\n`→`<br/>`) → pas d'injection depuis le texte saisi.
- **Route `envoyer-email`** :
  - GET renvoie désormais `defaults { subject, message, paymentInstructions }` (message
    par défaut + instructions préqualifiées : Interac au courriel du cabinet + chèque +
    rappel du n° de facture « pour un traitement sans erreur »).
  - POST accepte `subject`, `message`, `paymentInstructions` (override ; retombe sur le
    défaut si absents).
- **Modale `FacturePreviewActions`** : champs éditables **Objet**, **Message**,
  **Instructions de paiement**, préremplis depuis les `defaults`, envoyés au POST. Modale
  élargie (`max-w-lg`) + scroll. Style si.

## Vérif
- `tsc --noEmit` : 0 erreur.
- **Génération du courriel testée en exécution** (`invoiceAccompanyingEmailHtml`) : message
  perso inséré, HTML échappé (`<merci>`→`&lt;merci&gt;`), bloc instructions présent, Interac
  inclus, `\n`→`<br/>`.
- ⚠️ **Non click-testé en direct** : aucune facture brouillon sous le cabinet SAFE Inc, et
  en créer une complète serait lourd. La modale est branchée sur le flux de facture partagé
  (fonctionne pour tout cabinet, y compris les vrais clients).

## Reste (petit suivi)
- Persister un **message par défaut + instructions de paiement par défaut** dans la config
  cabinet (`parametres/envoi-facture`) pour ne pas les retaper à chaque envoi (aujourd'hui :
  défaut recalculé à chaque ouverture, éditable par envoi).
- Point 3 du CEO (« relecture de l'écran d'envoi ») : fait de facto, la modale EST l'écran.
