-- Accès payé hors Stripe (encaissement Interac), jusqu'à cette date incluse.
--
-- Additive et nullable : aucune ligne existante n'est touchée, aucun accès
-- existant n'est modifié. Un cabinet dont la colonne reste NULL conserve
-- exactement le comportement d'avant, décidé par le seul statut Stripe.
--
-- Réversible : ALTER TABLE "Cabinet" DROP COLUMN "accesPayeJusquau";
ALTER TABLE "Cabinet" ADD COLUMN "accesPayeJusquau" TIMESTAMP(3);
