-- B-02 : le numero de note de credit se genere en comptant les notes de
-- l'annee et en ajoutant 1 (`getNextCreditNoteNumber`, credit-note-service.ts).
-- Deux creations simultanees obtiendraient le meme numero. Cette contrainte est
-- ce qui l'empeche, au niveau de la base.
--
-- CE QU'ELLE NE FAIT PAS. Une version anterieure de ce commentaire disait
-- s'appuyer sur « le verrou consultatif pose dans credit-note-service.ts » :
-- il n'y en a aucun, verifie le 2026-08-27. En cas de course, la seconde
-- creation echouera donc sur une violation d'unicite (P2002), que l'appelant
-- ne rattrape pas encore. C'est un echec franc plutot qu'un doublon silencieux,
-- ce qui reste preferable, mais ce n'est pas une file d'attente.
--
-- Additif et non destructeur. La creation ne peut pas echouer sur un doublon
-- existant : la table est vide, et elle le reste structurellement puisque
-- `createCreditNote` n'est appele par aucun ecran ni aucune route
-- (app/api/facturation/credit-notes/route.ts n'expose qu'un GET).
--
-- Le nom de l'index est celui que Prisma genere pour
-- `@@unique([cabinetId, creditNoteNumber])`, desormais present dans le schema :
-- les deux concordent, il n'y a donc pas de derive a corriger au prochain
-- `prisma migrate dev`.

CREATE UNIQUE INDEX "CreditNote_cabinetId_creditNoteNumber_key"
  ON "CreditNote"("cabinetId", "creditNoteNumber");
