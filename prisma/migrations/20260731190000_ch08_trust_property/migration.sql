-- CH-08 — Autres biens en fidéicommis.
-- Réf. docs/compliance/PROGRAMME_INSPECTION_READY.md §4 (CH-08)
--      docs/compliance/AUDIT_REGLEMENTAIRE_INSPECTION_2026-07-30.md §5 (M-09)
--
-- Un « autre bien en fidéicommis » est, selon l'art. 1(3) B-1 r.5, « tout bien, autre
-- qu'une somme d'argent, reçu par un avocat pour être affecté suivant les
-- instructions du client ou d'une autre personne ». Concrètement : titres, actions,
-- testaments originaux, actes notariés, clés, bijoux détenus en garantie, chèques
-- certifiés non déposés.
--
-- SAFE n'en tenait aucun registre. C'était l'un des rares blocs entièrement absents.
--
-- Les deux régimes n'exigent PAS la même chose, et l'écart est net :
--
--   s. 18(9) ON ajoute   la VALEUR du bien, et la personne qui le détenait
--                        IMMÉDIATEMENT AVANT la prise de possession
--   art. 44-46 QC ajoute le lieu de garde et l'obligation d'aviser le client de TOUT
--                        changement d'emplacement, l'affectation du bien, et
--                        l'information du client quand le bien vient d'un tiers
--
-- Les colonnes correspondantes sont donc nullables : imposer la valeur à un cabinet
-- québécois ajouterait au règlement, et imposer le lieu de garde à un cabinet
-- ontarien aussi. C'est le module de règles qui exige les bons champs selon la
-- province.
--
-- L'historique des lieux de garde est conservé (`storageHistoryJson`) : un lieu
-- écrasé ferait perdre la trace du déplacement, alors que l'art. 45 vise précisément
-- « tout changement d'emplacement subséquent ».
--
-- Conservation : 7 ans à compter de la fermeture du dossier au Québec (art. 31) ;
-- DIX ans en Ontario — le registre des biens est le paragraphe 9 de la s. 18, visé
-- par la s. 23(2), et non par les six ans de la s. 23(1). Purger à six ans
-- détruirait un registre encore exigible.
--
-- Migration ADDITIVE (PR-10).

CREATE TABLE IF NOT EXISTS "TrustProperty" (
  "id"                         TEXT NOT NULL,
  "cabinetId"                  TEXT NOT NULL,
  "clientId"                   TEXT NOT NULL,
  "dossierId"                  TEXT,
  "description"                TEXT NOT NULL,
  "identificationNumber"       TEXT,
  "estimatedValue"             DOUBLE PRECISION,
  "receivedFromName"           TEXT,
  "receivedAt"                 TIMESTAMP(3) NOT NULL,
  "storageLocation"            TEXT,
  "storageHistoryJson"         TEXT,
  "storageNotifiedAt"          TIMESTAMP(3),
  "fromThirdParty"             BOOLEAN NOT NULL DEFAULT false,
  "clientNotifiedAt"           TIMESTAMP(3),
  "purpose"                    TEXT,
  "releasedAt"                 TIMESTAMP(3),
  "releasedToName"             TEXT,
  "releaseSignatureDocumentId" TEXT,
  "province"                   TEXT NOT NULL,
  "createdById"                TEXT,
  "createdAt"                  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"                  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TrustProperty_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "TrustProperty_cabinetId_idx" ON "TrustProperty"("cabinetId");
-- Les biens ENCORE DÉTENUS sont ceux dont releasedAt est nul : c'est la requête du
-- registre et de l'alerte de fermeture de dossier.
CREATE INDEX IF NOT EXISTS "TrustProperty_cabinetId_releasedAt_idx"
  ON "TrustProperty"("cabinetId", "releasedAt");
CREATE INDEX IF NOT EXISTS "TrustProperty_clientId_idx" ON "TrustProperty"("clientId");
CREATE INDEX IF NOT EXISTS "TrustProperty_dossierId_idx" ON "TrustProperty"("dossierId");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TrustProperty_cabinetId_fkey') THEN
    ALTER TABLE "TrustProperty" ADD CONSTRAINT "TrustProperty_cabinetId_fkey"
      FOREIGN KEY ("cabinetId") REFERENCES "Cabinet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  -- Restrict : un registre permanent (art. 43) ne disparaît jamais par effet de bord.
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TrustProperty_clientId_fkey') THEN
    ALTER TABLE "TrustProperty" ADD CONSTRAINT "TrustProperty_clientId_fkey"
      FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END
$$;
