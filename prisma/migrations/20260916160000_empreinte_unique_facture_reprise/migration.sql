-- La même facture passée ne peut pas être reprise deux fois.
--
-- Le contrôle applicatif (findFirst sur l'empreinte, dans la transaction de
-- versement) suffit en usage normal, mais deux dépôts simultanés le franchissent
-- tous les deux : chacun lit avant que l'autre n'écrive. Seule la base peut
-- trancher. Index partiel : il ne contraint que les pièces de reprise, les
-- autres types de documents gardent le droit d'exister en plusieurs exemplaires
-- (un même PDF joint à deux dossiers, par exemple).
CREATE UNIQUE INDEX IF NOT EXISTS "Document_reprise_empreinte_unique"
  ON "Document" ("cabinetId", "hash")
  WHERE "documentType" = 'facture_passee_source' AND "hash" IS NOT NULL;
