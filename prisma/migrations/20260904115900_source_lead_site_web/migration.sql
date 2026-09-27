-- Une demande écrite depuis le site public devient un lead : il lui faut sa source.
--
-- Seule dans sa migration exprès. Postgres refuse d'utiliser une valeur d'enum
-- ajoutée dans la même transaction que son usage ; la garder à part met la
-- table DemandeSite, qui suit, hors de portée de ce piège.

ALTER TYPE "SourceLead" ADD VALUE IF NOT EXISTS 'SITE_WEB';
