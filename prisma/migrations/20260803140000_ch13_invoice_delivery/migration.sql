-- CH-13 — Découplage de l'émission et de la TRANSMISSION de la facture.
-- Réf. docs/compliance/REEVALUATION_2026-08-03.md §4.3
--      docs/compliance/AUDIT_REGLEMENTAIRE_INSPECTION_2026-07-30.md M-03, RC-2
--
-- LE MOT DU RÈGLEMENT
--
--   art. 56(2) QC : retrait permis pour les honoraires « pour lesquels la facturation
--                   a été ENVOYÉE ».
--   s. 9(1)3 ON   : fees « for which a billing has been DELIVERED ».
--
-- Envoyée, pas préparée. Délivrée, pas émise.
--
-- LE DÉFAUT CORRIGÉ
--
-- Jusqu'à cette migration, `issueInvoice` posait `sentAt: now` AU MOMENT DE
-- L'ÉMISSION, sans qu'aucun envoi n'ait eu lieu. Le garde-fou INVOICE_NOT_DELIVERED
-- du CH-00 vérifiait donc une date qui ne prouvait rien : toute facture émise
-- ouvrait le retrait.
--
-- Ce n'était pas une régression : c'est un défaut préexistant que le garde-fou a
-- rendu visible en s'appuyant dessus. La réévaluation du 2026-08-03 le classait
-- comme le point le plus gênant restant, parce qu'il touche l'argent des clients et
-- non la production de documents.
--
-- POURQUOI PLUSIEURS CANAUX, ET PAS SEULEMENT L'ENVOI SAFE
--
-- ⚠️ N'accepter que le courriel envoyé par SAFE serait du SUR-BLOCAGE. Un cabinet qui
-- poste ses factures, les remet en main propre ou les envoie depuis son propre client
-- courriel a bel et bien envoyé la facturation au sens du règlement. Lui refuser le
-- retrait le pousserait à contourner, et le contournement détruit précisément la
-- traçabilité qu'on protège (doctrine PR-2 : aucun garde-fou sans porte de sortie).
--
-- `deliveryChannel` distingue donc ce que SAFE PROUVE de ce que le cabinet DÉCLARE.
-- Les deux ouvrent le retrait ; la différence est écrite au dossier et signalée au
-- rapport, jamais maquillée.
--
-- LA REPRISE, ET POURQUOI ELLE EST MARQUÉE
--
-- Les factures existantes portent un `sentAt` issu de l'émission. Deux mauvaises
-- options :
--   - l'effacer bloquerait le retrait sur des factures RÉELLEMENT transmises, sur la
--     seule base d'un défaut logiciel qui n'est pas le fait du cabinet ;
--   - le reprendre tel quel prétendrait qu'une preuve existe.
--
-- Choix retenu : reprendre la date ET la marquer `LEGACY_PRESUME`. Le retrait reste
-- possible, et tout retrait qui s'y appuie est signalé comme reposant sur une
-- transmission PRÉSUMÉE. C'est le même principe que l'interrupteur daté du CH-06 :
-- on ne réécrit pas le passé, on le qualifie.
--
-- Migration ADDITIVE (PR-10).

ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "deliveredAt" TIMESTAMP(3);
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "deliveryChannel" TEXT;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "deliveryDeclaredById" TEXT;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "deliveryNote" TEXT;

-- Reprise : la date d'émission devient une transmission PRÉSUMÉE, jamais prouvée.
-- Ne touche que les factures qui portent déjà un sentAt et aucune transmission.
UPDATE "Invoice"
SET "deliveredAt"     = "sentAt",
    "deliveryChannel" = 'LEGACY_PRESUME',
    "deliveryNote"    = 'Reprise automatique du 2026-08-03 : date issue de l''émission, pas d''un envoi constaté.'
WHERE "sentAt" IS NOT NULL
  AND "deliveredAt" IS NULL;

-- Les retraits futurs interrogent cette colonne ; l'index sert le rapport
-- « transmissions présumées » du tableau de conformité.
CREATE INDEX IF NOT EXISTS "Invoice_cabinetId_deliveryChannel_idx"
  ON "Invoice"("cabinetId", "deliveryChannel");
